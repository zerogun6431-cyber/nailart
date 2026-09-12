'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import AetherHero from './AetherHero';

/* ────────────────────────────────────────────────────────────
   Nailart AI landing hero.
   Keeps the existing AetherHero design (living shader background,
   glassmorphism, Space Grotesk) with the content centered.
   The center "Get Started" CTA is only for signed-out visitors —
   once logged in there's nothing to start, so it's dropped.
   ──────────────────────────────────────────────────────────── */
export function HeroSection() {
  const { user, loading } = useAuth();
  const showGetStarted = !loading && !user;

  return (
    <AetherHero
      title="Perfect YouTube thumbnails, made by AI"
      subtitle="Nailart AI studies your channel's style and generates click-worthy thumbnails automatically — from concept to design, in just a few seconds."
      ctaLabel={showGetStarted ? 'Get Started' : undefined}
      ctaHref={showGetStarted ? '#get-started' : undefined}
      secondaryCtaLabel="Watch Demo"
      secondaryCtaHref="#demo"
      align="center"
      overlayGradient="transparent"
    />
  );
}

export default HeroSection;
