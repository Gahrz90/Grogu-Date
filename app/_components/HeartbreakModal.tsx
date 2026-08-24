"use client";

import { useEffect, useRef } from "react";

export function HeartbreakModal({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const dismissRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    dismissRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="heartbreak-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div className="absolute inset-0 animate-fade bg-void/80 backdrop-blur-md" onClick={onDismiss} />

      <div className="relative w-full max-w-md animate-pop rounded-3xl border border-heart/30 bg-void-700/90 p-8 text-center shadow-[0_30px_80px_-20px_rgba(226,101,122,0.45)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-heart/15 animate-beat">
          {/* At 28px the two drifting halves of <BrokenHeart> read as a whole
              heart, so the badge uses a crack line instead. */}
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
            <path
              d="M12 21s-8-4.9-8-10.6C4 7 6.5 5 9 5c1.6 0 2.4.8 3 1.6C12.6 5.8 13.4 5 15 5c2.5 0 5 2 5 5.4C20 16.1 12 21 12 21z"
              className="fill-heart"
            />
            <path
              d="M12 6.6 9.8 10.1 13.1 11.7 10.5 13.9 12.7 15.7 11.4 20.6"
              stroke="#0c1f18"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <h2 id="heartbreak-title" className="text-2xl font-semibold text-sand text-balance">
          Oh no! Ci vuoi spezzare il cuore davvero così?
        </h2>
        <p className="mt-3 text-sm text-sand/60">
          You&apos;re a bad baby! <span aria-hidden>😭</span>
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            ref={dismissRef}
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-force px-7 py-3.5 font-semibold text-void transition-all duration-300 hover:bg-force/90 hover:shadow-[0_0_28px_-4px_rgba(168,211,138,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-force"
          >
            No, ci ho ripensato! 😌
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-heart/40 bg-heart/10 px-7 py-3.5 font-medium text-heart transition-all duration-300 hover:bg-heart/20 hover:shadow-[0_0_24px_-4px_rgba(226,101,122,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-heart"
          >
            Sì, mi dispiace 😢
          </button>
        </div>
      </div>
    </div>
  );
}
