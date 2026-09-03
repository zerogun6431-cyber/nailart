import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth cookies via Next's `cookies()` (async in
 * this Next.js version — see node_modules/next/dist/docs).
 *
 * Calling `.setAll()` from a Server Component (rather than a Server Action /
 * Route Handler) throws — that's expected as long as `proxy.ts` is also
 * refreshing the session, so the try/catch below is safe to ignore.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore, proxy.ts refreshes sessions.
          }
        },
      },
    }
  );
}
