import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (see
// node_modules/next/dist/docs/.../file-conventions/proxy.md). This runs on
// every request to keep the Supabase auth session cookie fresh.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
