import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components ('use client').
 * Safe to call repeatedly — @supabase/ssr reuses a single browser instance.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
