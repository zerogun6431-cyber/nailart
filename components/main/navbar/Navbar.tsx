import Image from 'next/image';
import nailartLogo from '@/public/nailart.png';
import NavCta from './NavCta';

/* ────────────────────────────────────────────────────────────
   Nailart AI — top navigation bar.
   Sits transparently over the hero (glassmorphism, Space Grotesk)
   to match the existing landing design.
   Left:   logo + wordmark
   Center: Features · Pricing · Contact
   Right:  Get Started button
   ──────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  return (
    <header className="na-nav">
      <style>{`
        .na-nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          background: transparent;
        }
        .na-nav__inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          padding: 22px clamp(20px, 5vw, 48px);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .na-nav__brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
        }
        .na-nav__logo {
          width: auto;
          height: 34px;
          border-radius: 8px;
          display: block;
        }
        .na-nav__wordmark {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .na-nav__links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 36px;
        }
        .na-nav__link {
          color: rgba(255, 255, 255, 0.82);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }
        .na-nav__link:hover {
          color: #fff;
        }
        .na-nav__cta {
          padding: 11px 22px;
          border-radius: 12px;
          background: transparent;
          color: #fff;
          text-decoration: none;
          font-weight: 900;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
          white-space: nowrap;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
          transition: box-shadow 0.15s ease;
        }
        .na-nav__cta:hover {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
        }
        @media (max-width: 760px) {
          .na-nav__links {
            display: none;
          }
        }
      `}</style>

      <div className="na-nav__inner">
        {/* Left — logo + wordmark */}
        <a className="na-nav__brand" href="#" aria-label="Nailart AI home">
          <Image
            className="na-nav__logo"
            src={nailartLogo}
            alt="Nailart AI"
            width={62}
            height={34}
            priority
          />
          <span className="na-nav__wordmark">nailart</span>
        </a>

        {/* Center — section links */}
        <nav className="na-nav__links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="na-nav__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — primary CTA */}
        <NavCta />
      </div>
    </header>
  );
}

export default Navbar;
