'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import PricingModal from './PricingModal';

type ProfilePopoverProps = {
  fullName: string | null;
  avatarUrl: string | null;
  plan: string;
};

/**
 * Floating profile button, top-right of the dashboard. Hover reveals a
 * small card below the avatar with the user's name and a Sign out button.
 * Uses :hover (+ :focus-within for keyboard users) — no click state needed.
 */
export function ProfilePopover({ fullName, avatarUrl, plan }: ProfilePopoverProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const initial = (fullName?.trim().charAt(0) || 'N').toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handleManageSubscription = async () => {
    if (openingPortal) return;
    setOpeningPortal(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/customer-portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? '고객 포털을 여는 데 실패했어요.');
      }
      window.location.href = json.url as string;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : '고객 포털을 여는 데 실패했어요.');
      setOpeningPortal(false);
    }
  };

  return (
    <div className="profile-pop">
      <style>{`
        .profile-pop {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 30;
        }
        .profile-pop__trigger {
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 12px 30px rgba(0, 0, 0, 0.45);
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .profile-pop__trigger:hover {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28), 0 16px 36px rgba(0, 0, 0, 0.5);
          transform: translateY(-1px);
        }
        .profile-pop__avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .profile-pop__fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
        }
        /* Invisible bridge (padding-top) keeps :hover unbroken between the
           trigger button and the card below it. */
        .profile-pop__menu {
          position: absolute;
          top: 100%;
          right: 0;
          padding-top: 10px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.15s ease, visibility 0.15s ease;
        }
        .profile-pop:hover .profile-pop__menu,
        .profile-pop:focus-within .profile-pop__menu {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .profile-pop__menu-card {
          min-width: 180px;
          padding: 16px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: rgba(24, 24, 24, 0.92);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12), 0 20px 50px rgba(0, 0, 0, 0.5);
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
        }
        .profile-pop__menu-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }
        .profile-pop__name {
          margin: 0;
          max-width: 160px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .profile-pop__pricing {
          width: 100%;
          padding: 9px 14px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
          transition: box-shadow 0.15s ease, color 0.15s ease;
        }
        .profile-pop__pricing:hover {
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }
        .profile-pop__manage {
          width: 100%;
          padding: 9px 14px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
          transition: box-shadow 0.15s ease, color 0.15s ease;
        }
        .profile-pop__manage:hover {
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }
        .profile-pop__manage:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .profile-pop__error {
          margin: 0;
          text-align: center;
          font-size: 0.75rem;
          color: #fca5a5;
        }
        .profile-pop__signout {
          width: 100%;
          padding: 9px 14px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
          transition: box-shadow 0.15s ease, color 0.15s ease;
        }
        .profile-pop__signout:hover {
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }
        .profile-pop__signout:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>

      <button type="button" className="profile-pop__trigger" aria-label="Account menu">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL
          <img className="profile-pop__avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="profile-pop__fallback" aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      <div className="profile-pop__menu">
        <div className="profile-pop__menu-card">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL
            <img className="profile-pop__menu-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="profile-pop__fallback profile-pop__menu-avatar" aria-hidden="true">
              {initial}
            </span>
          )}
          {fullName && <p className="profile-pop__name">{fullName}</p>}
          <button type="button" className="profile-pop__pricing" onClick={() => setPricingOpen(true)}>
            View Plan
          </button>
          {plan !== 'free' && (
            <button
              type="button"
              className="profile-pop__manage"
              onClick={handleManageSubscription}
              disabled={openingPortal}
            >
              {openingPortal ? '이동 중…' : 'Manage subscription'}
            </button>
          )}
          {portalError && <p className="profile-pop__error">{portalError}</p>}
          <button type="button" className="profile-pop__signout" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} plan={plan} />
    </div>
  );
}

export default ProfilePopover;
