import Image from 'next/image';
import Link from 'next/link';
import nailartLogo from '@/public/nailart.png';
import ShaderBackground from '@/components/shared/ShaderBackground';
import GoogleSignInButton from '@/components/main/auth/GoogleSignInButton';

// https://www.youtube.com/watch?v=f7SS57LFPco
const DEMO_VIDEO_ID = 'f7SS57LFPco';

/* ────────────────────────────────────────────────────────────
   Auth page.
   3:2 split — left is a moodboard panel (shader + black wash +
   demo video + oversized "NAILART" wordmark), right is the
   glassmorphism sign-in card. Google is the only entry point,
   no login/signup split.
   ──────────────────────────────────────────────────────────── */
export default function AuthPage() {
    return (
        <main className="auth">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

        .auth {
          position: relative;
          flex: 1 1 auto;
          min-height: 100vh;
          overflow: hidden;
          color: #fff;
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system,
            'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .auth__row {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }
        .auth__left {
          position: relative;
          flex: 3 1 0%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: 100px 56px 56px;
        }
        .auth__left-wash {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          pointer-events: none;
        }
        .auth__video {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 640px;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 24px 60px rgba(0, 0, 0, 0.5);
        }
        .auth__video iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .auth__brandmark {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: clamp(3.25rem, 9vw, 8rem);
          line-height: 0.9;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .auth__right {
          position: relative;
          flex: 2 1 0%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .auth__overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 40%, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.72) 78%);
          pointer-events: none;
        }
        .auth__card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 408px;
          padding: 40px 36px 32px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 30px 80px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          text-align: center;
        }
        .auth__brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }
        .auth__logo {
          width: auto;
          height: 34px;
          border-radius: 8px;
          display: block;
        }
        .auth__wordmark {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .auth__title {
          margin: 0;
          font-size: 1.6rem;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .auth__subtitle {
          margin: 12px 0 30px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
        }
        .auth__google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 13px 20px;
          border: 0;
          border-radius: 12px;
          background: #fff;
          color: #1f1f1f;
          font: inherit;
          font-size: 0.98rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .auth__google:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.34);
        }
        .auth__google:active {
          transform: translateY(0);
        }
        .auth__google:disabled {
          opacity: 0.7;
          cursor: default;
          transform: none;
        }
        .auth__fineprint {
          margin: 22px 0 0;
          font-size: 0.78rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.55);
        }
        .auth__fineprint a {
          color: rgba(255, 255, 255, 0.78);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auth__back {
          position: absolute;
          z-index: 2;
          top: 28px;
          left: 28px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
        }
        .auth__back:hover {
          color: #fff;
        }
        @media (max-width: 900px) {
          .auth__row {
            flex-direction: column;
          }
          .auth__left {
            flex: none;
            padding: 88px 32px 40px;
            min-height: 55vh;
          }
          .auth__brandmark {
            font-size: clamp(2.75rem, 16vw, 5rem);
          }
          .auth__right {
            flex: none;
            padding: 40px 24px 64px;
          }
        }
        @media (max-width: 480px) {
          .auth__card {
            padding: 34px 24px 28px;
          }
        }
      `}</style>

            <ShaderBackground ariaLabel="Nailart AI background" />

            <Link href="/" className="auth__back">
                ← Back
            </Link>

            <div className="auth__row">
                <section className="auth__left">
                    <div className="auth__left-wash" aria-hidden="true" />

                    <div className="auth__video">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}`}
                            title="Nailart AI demo"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>

                    <h2 className="auth__brandmark">NAILART</h2>
                </section>

                <section className="auth__right">
                    <div className="auth__overlay" aria-hidden="true" />

                    <div className="auth__card">
                        <span className="auth__brand">
                            <Image
                                className="auth__logo"
                                src={nailartLogo}
                                alt="Nailart AI"
                                width={62}
                                height={34}
                                priority
                            />
                            <span className="auth__wordmark">nailart</span>
                        </span>

                        <h1 className="auth__title">Sign in to Nailart AI</h1>
                        <p className="auth__subtitle">
                            Generate click-worthy YouTube thumbnails in seconds.
                        </p>

                        <GoogleSignInButton />

                        <p className="auth__fineprint">
                            By continuing, you agree to our <a href="#terms">Terms</a> and{' '}
                            <a href="#privacy">Privacy Policy</a>.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
