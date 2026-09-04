import Image from 'next/image';
import Link from 'next/link';
import nailartLogo from '@/public/nailart.png';
import ProfilePopover from './ProfilePopover';

type NavbarProps = {
  fullName: string | null;
  avatarUrl: string | null;
};

/* ────────────────────────────────────────────────────────────
   Dashboard nav — not a bar. Two independent floating buttons
   (logo top-left, profile top-right) over the transparent canvas,
   each its own glass chip.
   ──────────────────────────────────────────────────────────── */
export function Navbar({ fullName, avatarUrl }: NavbarProps) {
  return (
    <>
      <style>{`
        .dnav-logo {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 30;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 12px 30px rgba(0, 0, 0, 0.45);
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .dnav-logo:hover {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28), 0 16px 36px rgba(0, 0, 0, 0.5);
          transform: translateY(-1px);
        }
        .dnav-logo__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      `}</style>

      <Link href="/" className="dnav-logo" aria-label="Nailart AI home">
        <Image className="dnav-logo__img" src={nailartLogo} alt="" width={44} height={44} priority />
      </Link>

      <ProfilePopover fullName={fullName} avatarUrl={avatarUrl} />
    </>
  );
}

export default Navbar;
