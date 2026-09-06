import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * Server-only: SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so it's
 * never bundled into client JS. Never import this file from a 'use client'
 * component, and never pass caller-supplied ids straight through to it
 * without checking them yourself first — there is no RLS backstop here.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
