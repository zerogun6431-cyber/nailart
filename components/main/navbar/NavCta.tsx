'use client';

import { useAuth } from '@/components/shared/AuthProvider';

/**
 * Auth-aware navbar CTA. Signed-in visitors go straight to /dashboard
 * instead of back through /auth.
 */
export function NavCta() {
  const { user, loading } = useAuth();

  return (
    <a className="na-nav__cta" href={loading ? '#' : user ? '/dashboard' : '/auth'}>
      {user ? 'Dashboard' : 'Get Started'}
    </a>
  );
}

export default NavCta;
