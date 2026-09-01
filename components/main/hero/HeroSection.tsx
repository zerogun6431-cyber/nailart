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
      overlayGradient="linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.48) 45%, rgba(0,0,0,0.62) 100%)"
    />
  );
}

export default HeroSection;
