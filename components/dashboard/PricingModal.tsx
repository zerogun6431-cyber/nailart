'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* ────────────────────────────────────────────────────────────
   PricingModal — a react-portal payment modal opened from the
   profile popover. Two simple plan cards (Pro / Ultra) showing
   only price and credits. Matches the project's dark, no-Tailwind
   CSS-in-JS style. Border is a plain glass hairline (no beam).
   ──────────────────────────────────────────────────────────── */

type Plan = {
  key: 'pro' | 'ultra';
  name: string;
  price: number;
  credits: number;
};

const PLANS: Plan[] = [
  { key: 'pro', name: 'Pro', price: 20, credits: 100 },
  { key: 'ultra', name: 'Ultra', price: 45, credits: 300 },
];

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

type PricingModalProps = {
  open: boolean;
  onClose: () => void;
  plan: string;
};

export function PricingModal({ open, onClose, plan }: PricingModalProps) {
  const currentPlan = PLANS.find((p) => p.key === plan);
  const [mounted, setMounted] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan['key'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const startCheckout = async (plan: Plan['key']) => {
    if (pendingPlan) return;
    setPendingPlan(plan);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? '결제 페이지를 여는 데 실패했어요.');
      }
      window.location.href = json.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 페이지를 여는 데 실패했어요.');
      setPendingPlan(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="pricing-modal" role="dialog" aria-modal="true" aria-label="Pricing" onMouseDown={onClose}>
      <style>{`
        .pricing-modal {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          animation: pricing-fade 0.15s ease;
        }
        @keyframes pricing-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pricing-modal__panel {
          position: relative;
          width: 100%;
          max-width: 560px;
          padding: 40px;
          border-radius: 24px;
          background: #181818;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12), 0 40px 100px rgba(0, 0, 0, 0.6);
        }
        .pricing-modal__close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          transition: color 0.12s ease, box-shadow 0.12s ease;
        }
        .pricing-modal__close:hover {
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
        }
        .pricing-modal__title {
          margin: 0 0 24px;
          text-align: center;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .pricing-modal__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .pricing-modal__grid--single {
          grid-template-columns: minmax(0, 220px);
          justify-content: center;
        }
        .pricing-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 28px 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .pricing-card__name {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }
        .pricing-card__price {
          margin: 0;
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .pricing-card__price span {
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.45);
        }
        .pricing-card__credits {
          margin: 0 0 6px;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .pricing-card__cta {
          width: 100%;
          margin-top: auto;
          padding: 10px 14px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: #fff;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: filter 0.15s ease, opacity 0.15s ease;
        }
        .pricing-card__cta:hover {
          filter: brightness(1.08);
        }
        .pricing-card__cta:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .pricing-modal__error {
          margin: 16px 0 0;
          text-align: center;
          font-size: 0.85rem;
          color: #fca5a5;
        }
        @media (max-width: 480px) {
          .pricing-modal__panel { padding: 32px 20px; }
          .pricing-modal__grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pricing-modal__panel" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="pricing-modal__close" onClick={onClose} aria-label="Close">
          <XIcon />
        </button>

        {currentPlan ? (
          <>
            <h2 className="pricing-modal__title">현재 요금제</h2>
            <div className="pricing-modal__grid pricing-modal__grid--single">
              <div className="pricing-card">
                <p className="pricing-card__name">{currentPlan.name}</p>
                <p className="pricing-card__price">
                  ${currentPlan.price} <span>/ 월</span>
                </p>
                <p className="pricing-card__credits">{currentPlan.credits} 크레딧</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="pricing-modal__title">가격 모델</h2>
            <div className="pricing-modal__grid">
              {PLANS.map((planOption) => (
                <div key={planOption.key} className="pricing-card">
                  <p className="pricing-card__name">{planOption.name}</p>
                  <p className="pricing-card__price">
                    ${planOption.price} <span>/ 월</span>
                  </p>
                  <p className="pricing-card__credits">{planOption.credits} 크레딧</p>
                  <button
                    type="button"
                    className="pricing-card__cta"
                    onClick={() => startCheckout(planOption.key)}
                    disabled={pendingPlan !== null}
                  >
                    {pendingPlan === planOption.key ? '이동 중…' : '구독하기'}
                  </button>
                </div>
              ))}
            </div>
            {error && <p className="pricing-modal__error">{error}</p>}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default PricingModal;
