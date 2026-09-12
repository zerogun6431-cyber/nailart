import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Handles the Polar webhook events our billing model actually needs. The
 * endpoint is subscribed to exactly these six event types:
 *
 *   - order.paid              Fired for both the first subscription payment and
 *                              every renewal (billing_reason subscription_create /
 *                              subscription_cycle). Records the payment and grants
 *                              that plan's credit allotment. Upgrade/downgrade
 *                              proration orders (billing_reason subscription_update)
 *                              are deliberately skipped here — see subscription.updated.
 *   - subscription.active      New subscription becomes active, or a past-due one
 *                              recovers. Sets plan from the product and status to
 *                              'active'.
 *   - subscription.canceled    Cancellation was scheduled; the customer keeps
 *                              access until the current period ends. Sets
 *                              subscription_status to 'canceled' without touching
 *                              plan (access, and credits, are unaffected until
 *                              subscription.revoked actually lands).
 *   - subscription.uncanceled  The customer revoked a pending end-of-period
 *                              cancellation before it took effect. Sets
 *                              subscription_status back to 'active' and keeps
 *                              the plan as-is.
 *   - subscription.revoked     Access ends immediately (period ran out after
 *                              cancellation, or payment retries were exhausted).
 *                              Resets plan to 'free' and clears subscription_status.
 *   - subscription.updated     Fires for essentially any other change to the
 *                              subscription — plan upgrade/downgrade, resuming a
 *                              scheduled cancellation, etc. Re-syncs plan/status
 *                              from the subscription's current product/status, and
 *                              on a pro -> ultra transition tops up credits by the
 *                              difference (ultra -> pro leaves credits untouched).
 *
 * Every sync above goes through the same `sync_user_subscription` DB function,
 * which atomically compares against the user's current plan — so it doesn't
 * matter which of these events fires first or if one is redelivered.
 *
 * Both our checkout route (see app/api/checkout/route.ts) and this handler key
 * users by `external_customer_id` / `customer.external_id`, which we set to the
 * Supabase auth user id at checkout time.
 */

const CREDITS_BY_PLAN = { pro: 100, ultra: 300 } as const;
type Plan = keyof typeof CREDITS_BY_PLAN;
const UPGRADE_CREDIT_DIFF = CREDITS_BY_PLAN.ultra - CREDITS_BY_PLAN.pro;

const PLAN_BY_PRODUCT_ID: Partial<Record<string, Plan>> = {
  [process.env.POLAR_PRO_PRODUCT_ID ?? '']: 'pro',
  [process.env.POLAR_ULTRA_PPRODUCT_ID ?? '']: 'ultra',
};

// Our users.subscription_status check constraint only allows these five values
// (plus null), but Polar's own SubscriptionStatus enum is wider. Map the rest
// down to the closest fit for subscription.updated, where the raw status can
// genuinely be anything.
const ALLOWED_STATUS = new Set(['active', 'trialing', 'past_due', 'canceled', 'incomplete']);
function sanitizeStatus(status: string): string | null {
  if (ALLOWED_STATUS.has(status)) return status;
  if (status === 'unpaid') return 'canceled'; // retries exhausted; subscription.revoked follows to drop the plan
  if (status === 'paused') return 'active'; // still counts as retaining access
  return null; // incomplete_expired, or anything unrecognized
}

type PolarOrderPaidData = {
  id: string;
  billing_reason: string;
  total_amount: number;
  product_id: string;
  customer: { external_id: string | null };
};

type PolarSubscriptionData = {
  status: string;
  product_id: string;
  customer: { external_id: string | null };
};

/**
 * Polar signs webhooks per the Standard Webhooks spec, but the HMAC key
 * derivation depends on when the endpoint secret was generated: secrets from
 * on/after 2026-09-08 use the `whsec_...` secret as-is, older secrets instead
 * sign with the UTF-8 bytes of the *whole* `whsec_...` string, base64-encoded.
 * We don't know which side of that cutoff this endpoint's secret falls on, so
 * try both derivations before rejecting the request.
 */
function verifyPolarWebhook(body: string, headers: Record<string, string>, secret: string): unknown {
  const keyCandidates = [secret, Buffer.from(secret, 'utf-8').toString('base64')];
  let lastError: unknown;
  for (const key of keyCandidates) {
    try {
      return new Webhook(key).verify(body, headers);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'POLAR_WEBHOOK_SECRET is not configured on the server.' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let event: { type: string; data: unknown };
  try {
    event = verifyPolarWebhook(body, headers, secret) as { type: string; data: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(supabase, event.data as PolarOrderPaidData);
        break;
      case 'subscription.active':
        await syncSubscription(supabase, event.data as PolarSubscriptionData, 'active');
        break;
      case 'subscription.canceled':
        await syncSubscription(supabase, event.data as PolarSubscriptionData, 'canceled');
        break;
      case 'subscription.uncanceled':
        await syncSubscription(supabase, event.data as PolarSubscriptionData, 'uncanceled');
        break;
      case 'subscription.revoked':
        await syncSubscription(supabase, event.data as PolarSubscriptionData, 'revoked');
        break;
      case 'subscription.updated':
        await syncSubscription(supabase, event.data as PolarSubscriptionData, 'updated');
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Polar webhook (${event.type}) handling failed:`, error);
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleOrderPaid(
  supabase: ReturnType<typeof createAdminClient>,
  order: PolarOrderPaidData
) {
  // Renewals and the very first payment only — upgrade/downgrade proration
  // orders are reconciled via the pro <-> ultra credit diff in syncSubscription
  // instead, so they must not also grant a full plan's worth of credits here.
  if (order.billing_reason !== 'subscription_create' && order.billing_reason !== 'subscription_cycle') {
    return;
  }

  const plan = PLAN_BY_PRODUCT_ID[order.product_id];
  const userId = order.customer.external_id;
  if (!plan || !userId) return;

  // provider_payment_id is unique, so a redelivered order.paid event no-ops here
  // (nothing returned from `.select()`) instead of granting credits twice.
  const { data: inserted, error: insertError } = await supabase
    .from('payments')
    .upsert(
      { user_id: userId, plan, amount: order.total_amount, status: 'paid', provider_payment_id: order.id },
      { onConflict: 'provider_payment_id', ignoreDuplicates: true }
    )
    .select('id');
  if (insertError) throw insertError;
  if (!inserted || inserted.length === 0) return;

  const { error: creditError } = await supabase.rpc('increment_user_credits', {
    p_user_id: userId,
    p_amount: CREDITS_BY_PLAN[plan],
  });
  if (creditError) throw creditError;
}

async function syncSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: PolarSubscriptionData,
  event: 'active' | 'canceled' | 'uncanceled' | 'revoked' | 'updated'
) {
  const userId = subscription.customer.external_id;
  if (!userId) return;

  const newPlan: 'free' | Plan = event === 'revoked' ? 'free' : PLAN_BY_PRODUCT_ID[subscription.product_id] ?? 'free';
  const newStatus =
    event === 'active' || event === 'uncanceled'
      ? 'active'
      : event === 'canceled'
        ? 'canceled'
        : event === 'revoked'
          ? null
          : sanitizeStatus(subscription.status);

  const { error } = await supabase.rpc('sync_user_subscription', {
    p_user_id: userId,
    p_new_plan: newPlan,
    p_new_status: newStatus,
    p_upgrade_credit_diff: UPGRADE_CREDIT_DIFF,
  });
  if (error) throw error;
}
