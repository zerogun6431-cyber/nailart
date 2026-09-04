'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────────────────────────
   PromptArea — the dashboard's center stage. A large auto-growing
   prompt box for describing the thumbnail to generate, styled for
   the dark canvas (no Tailwind/Radix — plain CSS-in-JS + inline
   SVG icons, matching the rest of this project).
   Design only: submit is a no-op until generation is wired up.
   ──────────────────────────────────────────────────────────── */

/* ---------- icons (stroke-based, 24x24, no icon fonts) ---------- */
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 5V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const ToolsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...props}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.5 11.5L12 5l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </svg>
);
const StyleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 20c3-1 3-4 3-6l10-10 3 3-10 10c-2 0-5 0-6 3z" />
  </svg>
);
const ChannelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="4" />
    <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
  </svg>
);
const TextIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 6h14" />
    <path d="M12 6v13" />
    <path d="M9 19h6" />
  </svg>
);
const TrendUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

const TOOLS = [
  { id: 'style', name: 'Reference a style', icon: StyleIcon },
  { id: 'channel', name: 'Match my channel', icon: ChannelIcon },
  { id: 'text', name: 'Bold text overlay', icon: TextIcon },
  { id: 'ctr', name: 'Optimize for CTR', icon: TrendUpIcon },
] as const;

export function PromptArea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<(typeof TOOLS)[number]['id'] | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire up thumbnail generation.
  };

  const hasValue = value.trim().length > 0 || Boolean(imagePreview);
  const activeTool = TOOLS.find((t) => t.id === selectedTool) ?? null;

  return (
    <div className="prompt-area">
      <style>{`
        .prompt-area {
          width: 100%;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
        }
        .prompt-area__eyebrow {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .prompt-area__heading {
          margin: 0;
          text-align: center;
          font-size: clamp(1.5rem, 3.2vw, 2.25rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .prompt-box {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 28px;
          padding: 10px;
          background: #1f1f1f;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09), 0 30px 80px rgba(0, 0, 0, 0.5);
        }
        .prompt-box__preview {
          position: relative;
          width: fit-content;
          margin: 2px 2px 4px;
        }
        .prompt-box__preview img {
          width: 58px;
          height: 58px;
          object-fit: cover;
          border-radius: 14px;
          display: block;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
        }
        .prompt-box__preview-remove {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1f1f1f;
          color: #fff;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        .prompt-box textarea {
          width: 100%;
          resize: none;
          border: 0;
          background: transparent;
          outline: none;
          color: #fff;
          font: inherit;
          font-size: 1.02rem;
          line-height: 1.5;
          padding: 12px 14px 6px;
          min-height: 56px;
          max-height: 240px;
        }
        .prompt-box textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .prompt-box__toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 4px 4px 8px;
        }
        .prompt-box__icon-btn {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .prompt-box__icon-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .prompt-box__tools-wrap {
          position: relative;
        }
        .prompt-box__tools-trigger {
          height: 34px;
          padding: 0 12px;
          border: 0;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .prompt-box__tools-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .prompt-box__tools-menu {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 0;
          width: 220px;
          padding: 8px;
          border-radius: 16px;
          background: rgba(31, 31, 31, 0.98);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px rgba(0, 0, 0, 0.55);
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 6;
        }
        .prompt-box__tools-scrim {
          position: fixed;
          inset: 0;
          z-index: 5;
          background: transparent;
          border: 0;
          cursor: default;
        }
        .prompt-box__tool-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.88);
          font: inherit;
          font-size: 0.86rem;
          text-align: left;
          cursor: pointer;
        }
        .prompt-box__tool-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .prompt-box__active-tool {
          height: 34px;
          padding: 0 12px 0 10px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 58, 237, 0.18);
          color: #c4b5fd;
          font-size: 0.85rem;
          font-weight: 500;
          border: 0;
          cursor: pointer;
        }
        .prompt-box__spacer {
          flex: 1;
        }
        .prompt-box__send {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .prompt-box__send--active {
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: #fff;
        }
        .prompt-box__send:disabled {
          cursor: default;
        }
      `}</style>

      <div>
        <p className="prompt-area__eyebrow">Nailart AI</p>
        <h1 className="prompt-area__heading">What thumbnail do you want to create today?</h1>
      </div>

      <form className="prompt-box" onSubmit={handleSubmit}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

        {imagePreview && (
          <div className="prompt-box__preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview, not a static asset */}
            <img src={imagePreview} alt="Attached reference" />
            <button
              type="button"
              className="prompt-box__preview-remove"
              onClick={() => setImagePreview(null)}
              aria-label="Remove attached image"
            >
              <XIcon />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe the thumbnail you want — e.g. “shocked reaction, bold red text, 10 million subs”"
        />

        <div className="prompt-box__toolbar">
          <button
            type="button"
            className="prompt-box__icon-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach reference image"
          >
            <PlusIcon />
          </button>

          <div className="prompt-box__tools-wrap">
            <button
              type="button"
              className="prompt-box__tools-trigger"
              onClick={() => setIsToolsOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isToolsOpen}
            >
              <ToolsIcon />
              Tools
            </button>

            {isToolsOpen && (
              <>
                <button
                  type="button"
                  className="prompt-box__tools-scrim"
                  aria-label="Close tools menu"
                  onClick={() => setIsToolsOpen(false)}
                />
                <div className="prompt-box__tools-menu" role="menu">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      className="prompt-box__tool-item"
                      onClick={() => {
                        setSelectedTool(tool.id);
                        setIsToolsOpen(false);
                      }}
                    >
                      <tool.icon />
                      {tool.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {activeTool && (
            <button type="button" className="prompt-box__active-tool" onClick={() => setSelectedTool(null)}>
              <activeTool.icon />
              {activeTool.name}
              <XIcon />
            </button>
          )}

          <div className="prompt-box__spacer" />

          <button type="button" className="prompt-box__icon-btn" aria-label="Record voice">
            <MicIcon />
          </button>

          <button
            type="submit"
            className={`prompt-box__send${hasValue ? ' prompt-box__send--active' : ''}`}
            disabled={!hasValue}
            aria-label="Generate thumbnail"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

export default PromptArea;
