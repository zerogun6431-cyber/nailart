import AetherHero from './AetherHero';

/* ────────────────────────────────────────────────────────────
   Nailart AI landing hero.
   Keeps the existing AetherHero design (living shader background,
   glassmorphism, Space Grotesk) with the content centered.
   ──────────────────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <AetherHero
      title="Perfect YouTube thumbnails, made by AI"
      subtitle="Nailart AI studies your channel's style and generates click-worthy thumbnails automatically — from concept to design, in just a few seconds."
      ctaLabel="Get Started"
      ctaHref="#get-started"
      secondaryCtaLabel="Watch Demo"
      secondaryCtaHref="#demo"
      align="center"
      overlayGradient="transparent"
    />
  );
}

export default HeroSection;
