'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Spinner } from '@/components/ui/spinner-1';
import type { GeneratedImage } from '@/lib/gallery/useGeneratedImages';

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
const ReferenceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M20.5 15.5 15 10l-8 8.5" />
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
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

type Attachment = {
  id: string;
  url: string;
  data: string;
  mimeType: string;
  /** id of the gallery thumbnail this came from, if attached via the reference picker — used to dedupe. */
  sourceId?: string;
};

function readFileAsAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const [header, data] = url.split(',');
      const mimeType = header.match(/data:(.*);base64/)?.[1] ?? file.type ?? 'image/jpeg';
      resolve({ id: crypto.randomUUID(), url, data, mimeType });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type PromptAreaProps = {
  images?: GeneratedImage[];
  onImageGenerated?: (image: GeneratedImage) => void;
};

export function PromptArea({ images = [], onImageGenerated }: PromptAreaProps = {}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const addAttachments = async (files: File[]) => {
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setAttachmentError(`최대 ${MAX_ATTACHMENTS}개까지 첨부할 수 있어요.`);
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const oversized = imageFiles.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    const withinSize = imageFiles.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);
    const toAdd = withinSize.slice(0, room);

    if (oversized.length > 0) {
      setAttachmentError(`이미지당 5MB까지만 첨부할 수 있어요 — ${oversized.length}개 건너뜀.`);
    } else if (withinSize.length > toAdd.length) {
      setAttachmentError(`최대 ${MAX_ATTACHMENTS}개까지만 첨부할 수 있어요 — 일부는 건너뛰었어요.`);
    } else {
      setAttachmentError(null);
    }

    if (toAdd.length === 0) return;
    const newAttachments = await Promise.all(toAdd.map(readFileAsAttachment));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) addAttachments(files);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const attachFromGallery = async (image: GeneratedImage) => {
    if (attachments.some((a) => a.sourceId === image.id)) return;
    if (attachments.length >= MAX_ATTACHMENTS) {
      setAttachmentError(`최대 ${MAX_ATTACHMENTS}개까지 첨부할 수 있어요.`);
      return;
    }

    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      if (blob.size > MAX_ATTACHMENT_BYTES) {
        setAttachmentError('이 썸네일은 5MB를 초과해 첨부할 수 없어요.');
        return;
      }
      const file = new File([blob], 'thumbnail', { type: blob.type || 'image/jpeg' });
      const attachment = await readFileAsAttachment(file);
      setAttachments((prev) => [...prev, { ...attachment, sourceId: image.id }]);
      setAttachmentError(null);
    } catch {
      setAttachmentError('썸네일을 불러오지 못했어요.');
    }
  };

  const runGeneration = async () => {
    if (!value.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    const referenceImages = attachments.map((a) => ({ data: a.data, mimeType: a.mimeType }));

    try {
      const res = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value.trim(), referenceImages }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to generate thumbnail.');
      }
      const image = json.image as string;
      setGeneratedImage(image);
      onImageGenerated?.({
        id: json.id as string,
        url: image,
        prompt: json.prompt as string,
        createdAt: new Date(json.createdAt as string).getTime(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runGeneration();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runGeneration();
    }
  };

  const hasValue = value.trim().length > 0 || attachments.length > 0;
  const showResult = isGenerating || Boolean(error) || Boolean(generatedImage);

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
        .prompt-box__attachments {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 2px 2px 4px;
        }
        .prompt-box__preview {
          position: relative;
          width: fit-content;
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
        .prompt-box__attachment-error {
          margin: 0 2px 4px;
          font-size: 0.78rem;
          color: #fca5a5;
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
        .prompt-box__ref-wrap {
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
        /* Invisible bridge (padding-bottom) keeps :hover unbroken between the
           trigger and the card floating above it. */
        .prompt-box__ref-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          padding-bottom: 10px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          z-index: 6;
        }
        .prompt-box__ref-wrap:hover .prompt-box__ref-menu,
        .prompt-box__ref-wrap:focus-within .prompt-box__ref-menu {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .prompt-box__ref-card {
          width: 248px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(31, 31, 31, 0.98);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px rgba(0, 0, 0, 0.55);
        }
        .prompt-box__ref-title {
          margin: 0 0 8px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: rgba(255, 255, 255, 0.5);
        }
        .prompt-box__ref-empty {
          margin: 0;
          padding: 8px 2px 4px;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .prompt-box__ref-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
        }
        .prompt-box__ref-item {
          aspect-ratio: 1 / 1;
          padding: 0;
          border: 0;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: box-shadow 0.12s ease;
        }
        .prompt-box__ref-item:hover {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
        }
        .prompt-box__ref-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
        .prompt-box__spinner {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          animation: prompt-spin 0.7s linear infinite;
        }
        @keyframes prompt-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .prompt-result {
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
        }
        .prompt-result__state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 32px 24px;
          width: 100%;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
        }
        .prompt-result__state--error {
          color: #fca5a5;
        }
        .prompt-result__hint {
          margin: 0;
          font-size: 0.9rem;
          text-align: center;
        }
        .prompt-result__hint--error {
          color: #fca5a5;
        }
        .prompt-result__image {
          width: 100%;
          max-width: 640px;
          border-radius: 20px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.45);
        }
      `}</style>

      <AnimatePresence initial={false}>
        {showResult && (
          <motion.div
            key="prompt-result"
            layout
            className="prompt-result"
            initial={{ opacity: 0, height: 0, y: -12 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {isGenerating && (
              <div className="prompt-result__state">
                <Spinner size={40} color="rgba(255, 255, 255, 0.55)" />
                <p className="prompt-result__hint">Generating thumbnail…</p>
              </div>
            )}
            {!isGenerating && error && (
              <div className="prompt-result__state prompt-result__state--error">
                <XIcon width={40} height={40} strokeWidth={1.4} />
                <p className="prompt-result__hint prompt-result__hint--error">{error}</p>
              </div>
            )}
            {!isGenerating && !error && generatedImage && (
              // eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset
              <img src={generatedImage} alt="Generated thumbnail" className="prompt-result__image" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout>
        <p className="prompt-area__eyebrow">Nailart AI</p>
        <h1 className="prompt-area__heading">What thumbnail do you want to create today?</h1>
      </motion.div>

      <motion.form layout className="prompt-box" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          hidden
        />

        {attachments.length > 0 && (
          <div className="prompt-box__attachments">
            {attachments.map((att) => (
              <div key={att.id} className="prompt-box__preview">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview, not a static asset */}
                <img src={att.url} alt="Attached reference" />
                <button
                  type="button"
                  className="prompt-box__preview-remove"
                  onClick={() => removeAttachment(att.id)}
                  aria-label="Remove attached image"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachmentError && <p className="prompt-box__attachment-error">{attachmentError}</p>}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
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

          <div className="prompt-box__ref-wrap">
            <button type="button" className="prompt-box__tools-trigger" aria-haspopup="menu">
              <ReferenceIcon />
              참조
            </button>

            <div className="prompt-box__ref-menu" role="menu">
              <div className="prompt-box__ref-card">
                <p className="prompt-box__ref-title">내 썸네일에서 첨부</p>
                {images.length === 0 ? (
                  <p className="prompt-box__ref-empty">아직 생성한 썸네일이 없어요.</p>
                ) : (
                  <div className="prompt-box__ref-grid">
                    {images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className="prompt-box__ref-item"
                        onClick={() => attachFromGallery(img)}
                        title={img.prompt}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase public URL thumbnail */}
                        <img src={img.url} alt={img.prompt} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="prompt-box__spacer" />

          <button type="button" className="prompt-box__icon-btn" aria-label="Record voice">
            <MicIcon />
          </button>

          <button
            type="submit"
            className={`prompt-box__send${hasValue ? ' prompt-box__send--active' : ''}`}
            disabled={!hasValue || isGenerating}
            aria-label="Generate thumbnail"
          >
            {isGenerating ? <span className="prompt-box__spinner" /> : <SendIcon />}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

export default PromptArea;
