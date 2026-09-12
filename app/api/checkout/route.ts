import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Creates a Polar checkout session for one of our two plans and returns the
 * hosted checkout URL for the client to redirect to.
 *
 * The plan → product mapping lives in the environment:
 *   - POLAR_PRO_PRODUCT_ID
 *   - POLAR_ULTRA_PPRODUCT_ID   (note: the env var name has a typo — kept as-is)
 *   - POLAR_ACCESS_TOKEN        (Organization Access Token, `checkouts:write`)
 *   - POLAR_SERVER              ("sandbox" | "production", defaults to "production")
 *
 * Tokens and product IDs are environment-specific in Polar — a sandbox token
 * used against the production API returns `401 invalid_token`. Keep POLAR_SERVER
 * in sync with where POLAR_ACCESS_TOKEN and the product IDs were issued.
 *
 * The buyer is always taken from the authenticated Supabase session — we pass
 * `external_customer_id`/`customer_email` to Polar so the resulting Customer
 * can be reconciled back to our user in webhooks later.
 */

const POLAR_API_BASE =
  process.env.POLAR_SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
const POLAR_API_URL = `${POLAR_API_BASE}/v1/checkouts/`;

const PRODUCT_ID_BY_PLAN: Record<string, string | undefined> = {
  pro: process.env.POLAR_PRO_PRODUCT_ID,
  ultra: process.env.POLAR_ULTRA_PPRODUCT_ID,
};

type CheckoutRequestBody = {
  plan?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'POLAR_ACCESS_TOKEN is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const plan = body.plan?.trim().toLowerCase();
  if (!plan || !(plan in PRODUCT_ID_BY_PLAN)) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }

  const productId = PRODUCT_ID_BY_PLAN[plan];
  if (!productId) {
    return NextResponse.json(
      { error: `Product ID for the "${plan}" plan is not configured on the server.` },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;

  let polarResponse: Response;
  try {
    polarResponse = await fetch(POLAR_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [productId],
        success_url: `${origin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
        external_customer_id: user.id,
        customer_email: user.email,
        metadata: { plan, user_id: user.id },
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Could not reach Polar.' }, { status: 502 });
  }

  if (!polarResponse.ok) {
    const errorText = await polarResponse.text();
    return NextResponse.json(
      { error: `Polar API error (${polarResponse.status}): ${errorText}` },
      { status: 502 }
    );
  }

  const checkout = await polarResponse.json();
  if (!checkout?.url) {
    return NextResponse.json({ error: 'Polar did not return a checkout URL.' }, { status: 502 });
  }

  return NextResponse.json({ url: checkout.url });
}
