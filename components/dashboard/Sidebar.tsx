'use client';

import type React from 'react';
import type { GeneratedImage } from '@/lib/gallery/useGeneratedImages';

type SidebarProps = {
  images: GeneratedImage[];
};

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M20.5 15.5 15 10l-8 8.5" />
  </svg>
);

/* ────────────────────────────────────────────────────────────
   Dashboard sidebar — a floating "liquid glass" panel on the left
   edge showing the signed-in user's generated thumbnails. Same
   glass-chip language as Navbar/ProfilePopover (blur + saturate +
   inset hairline + soft shadow), on a #202020 base with a subtle
   top sheen for the liquid-glass highlight.
   ──────────────────────────────────────────────────────────── */
export function Sidebar({ images }: SidebarProps) {
  return (
    <aside className="gallery-sidebar">
      <style>{`
        .gallery-sidebar {
          position: fixed;
          top: 88px;
          left: 24px;
          bottom: 24px;
          width: 260px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 16px;
          border-radius: 28px;
          background: rgba(32, 32, 32, 0.55);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 24px 60px rgba(0, 0, 0, 0.5);
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
        }
        .gallery-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 45%);
          pointer-events: none;
        }
        .gallery-sidebar__header {
          position: relative;
          flex-shrink: 0;
        }
        .gallery-sidebar__eyebrow {
          margin: 0 0 2px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .gallery-sidebar__title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #fff;
        }
        .gallery-sidebar__list {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 2px;
          margin-right: -4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }
        .gallery-sidebar__list::-webkit-scrollbar {
          width: 5px;
        }
        .gallery-sidebar__list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }
        .gallery-sidebar__item {
          position: relative;
          display: block;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .gallery-sidebar__item:hover {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
          transform: translateY(-1px);
        }
        .gallery-sidebar__item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gallery-sidebar__item-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          padding: 8px 9px;
          background: linear-gradient(180deg, transparent 42%, rgba(0, 0, 0, 0.8));
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .gallery-sidebar__item:hover .gallery-sidebar__item-overlay {
          opacity: 1;
        }
        .gallery-sidebar__item-prompt {
          margin: 0;
          font-size: 0.68rem;
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.88);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gallery-sidebar__empty {
          position: relative;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px 12px;
          text-align: center;
          color: rgba(255, 255, 255, 0.35);
        }
        .gallery-sidebar__empty p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.45;
        }
        @media (max-width: 960px) {
          .gallery-sidebar {
            display: none;
          }
        }
      `}</style>

      <div className="gallery-sidebar__header">
        <p className="gallery-sidebar__eyebrow">Gallery</p>
        <h2 className="gallery-sidebar__title">My Thumbnails</h2>
      </div>

      {images.length === 0 ? (
        <div className="gallery-sidebar__empty">
          <ImageIcon color="rgba(255, 255, 255, 0.3)" />
          <p>Your generated thumbnails will show up here.</p>
        </div>
      ) : (
        <div className="gallery-sidebar__list">
          {images.map((image) => (
            <a
              key={image.id}
              className="gallery-sidebar__item"
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              title={image.prompt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset */}
              <img src={image.url} alt={image.prompt} />
              <div className="gallery-sidebar__item-overlay">
                <p className="gallery-sidebar__item-prompt">{image.prompt}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
