import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Creates a Polar customer session for the authenticated user and returns the
 * hosted customer portal URL, so a subscribed user can manage/cancel their
 * subscription and view billing history without leaving our dashboard.
 *
 * Reuses the same env vars as app/api/checkout/route.ts:
 *   - POLAR_ACCESS_TOKEN  (Organization Access Token, needs `customer_sessions:write`)
 *   - POLAR_SERVER        ("sandbox" | "production", defaults to "production")
 *
 * The customer is looked up by `external_customer_id`, which we set to the
 * Supabase auth user id at checkout time (see app/api/checkout/route.ts).
 */

const POLAR_API_BASE =
  process.env.POLAR_SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
const POLAR_API_URL = `${POLAR_API_BASE}/v1/customer-sessions/`;

export async function POST() {
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

  let polarResponse: Response;
  try {
    polarResponse = await fetch(POLAR_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ external_customer_id: user.id }),
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

  const session = await polarResponse.json();
  if (!session?.customer_portal_url) {
    return NextResponse.json({ error: 'Polar did not return a customer portal URL.' }, { status: 502 });
  }

  return NextResponse.json({ url: session.customer_portal_url as string });
}
