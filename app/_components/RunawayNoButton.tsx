"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Distance at which the button panics and jumps away, measured from its centre.
 * Kept tight — roughly the button's own half-width — so the pointer gets right
 * up to the edge before it bolts. A fast flick can now land a real click, which
 * is why `onClick` opens the modal too.
 */
const FLEE_RADIUS = 80;
/** Distance that still counts as "being chased". */
const CHASE_RADIUS = 215;
/** Continuous chase time before the heartbreak modal shows up. */
const CHASE_MS = 3000;
/** If the pointer stops moving for this long, the chase is considered over. */
const MOVE_IDLE_MS = 450;
/** Touch fallback: taps can't be a "continuous" chase, so count them instead. */
const TAP_LIMIT = 8;
/**
 * Chase time before the pursuit is reported as such. Debounces the single hop
 * the button makes when the pointer merely passes by on its way to "Sì".
 */
const CHASE_ONSET_MS = 300;
/** Minimum delay between two escapes, keeps the motion readable. */
const HOP_COOLDOWN_MS = 130;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

type Point = { x: number; y: number };

export function RunawayNoButton({
  label = "No",
  paused = false,
  onCaught,
  onChasingChange,
}: {
  label?: string;
  paused?: boolean;
  onCaught: () => void;
  /** Fires when the pursuit starts and when it stops. */
  onChasingChange?: (chasing: boolean) => void;
}) {
  const [escaped, setEscaped] = useState(false);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [heat, setHeat] = useState(0);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const escapedRef = useRef(false);
  const lastHopRef = useRef(0);
  const tapsRef = useRef(0);
  const inRangeRef = useRef(false);
  const lastMoveRef = useRef(0);
  const chaseRef = useRef(0);
  const pausedRef = useRef(paused);
  const onCaughtRef = useRef(onCaught);
  const chasingRef = useRef(false);
  const onChasingChangeRef = useRef(onChasingChange);

  useEffect(() => {
    pausedRef.current = paused;
    onCaughtRef.current = onCaught;
    onChasingChangeRef.current = onChasingChange;
  });

  // Let go of the pursuit flag when this button leaves the screen.
  useEffect(
    () => () => {
      if (chasingRef.current) onChasingChangeRef.current?.(false);
    },
    [],
  );

  const measure = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
    };
  }, []);

  /** Pick a spot that is away from the pointer and still inside the viewport. */
  const pickTarget = useCallback(
    (px: number, py: number, m: { cx: number; cy: number; w: number; h: number }): Point => {
      const pad = 14;
      const maxX = window.innerWidth - m.w - pad;
      const maxY = window.innerHeight - m.h - pad;
      const away = Math.atan2(m.cy - py, m.cx - px);
      const hop = Math.max(190, Math.min(window.innerWidth, window.innerHeight) * 0.36);

      // Fan out from the "straight away" direction until a legal spot is found.
      for (let i = 0; i < 14; i++) {
        const spread = (Math.PI / 7) * Math.ceil(i / 2) * (i % 2 ? 1 : -1);
        const angle = away + spread;
        const x = clamp(px + Math.cos(angle) * hop - m.w / 2, pad, maxX);
        const y = clamp(py + Math.sin(angle) * hop - m.h / 2, pad, maxY);
        if (Math.hypot(x + m.w / 2 - px, y + m.h / 2 - py) >= FLEE_RADIUS + 50) {
          return { x, y };
        }
      }

      // Cornered: teleport to the mirrored side of the screen.
      return {
        x: clamp(window.innerWidth - px - m.w / 2, pad, maxX),
        y: clamp(window.innerHeight - py - m.h / 2, pad, maxY),
      };
    },
    [],
  );

  const flee = useCallback(
    (px: number, py: number, countAsTap = false) => {
      const now = performance.now();
      if (now - lastHopRef.current < HOP_COOLDOWN_MS) return;
      const m = measure();
      if (!m) return;
      lastHopRef.current = now;

      const target = pickTarget(px, py, m);

      if (!escapedRef.current) {
        escapedRef.current = true;
        setSize({ w: m.w, h: m.h });
        // Start from where the button already is, so the first hop animates.
        setPos({ x: m.cx - m.w / 2, y: m.cy - m.h / 2 });
        setEscaped(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setPos(target)));
      } else {
        setPos(target);
      }

      // Only discrete taps feed the fallback counter: a finger tapping around
      // never produces a "continuous" chase, while a drag does and is timed
      // by the 3-second clock instead.
      if (!countAsTap) return;
      tapsRef.current += 1;
      if (tapsRef.current >= TAP_LIMIT && !pausedRef.current) {
        tapsRef.current = 0;
        chaseRef.current = 0;
        setHeat(0);
        onCaughtRef.current();
      }
    },
    [measure, pickTarget],
  );

  // Track the pointer globally: hovering is never required to trigger the escape.
  useEffect(() => {
    const track = (x: number, y: number, isTap: boolean) => {
      const m = measure();
      if (!m) return;
      const distance = Math.hypot(m.cx - x, m.cy - y);
      inRangeRef.current = distance < CHASE_RADIUS;
      lastMoveRef.current = performance.now();
      if (distance < FLEE_RADIUS && !pausedRef.current) {
        flee(x, y, isTap);
      }
    };

    const onMove = (event: PointerEvent) => track(event.clientX, event.clientY, false);
    const onDown = (event: PointerEvent) =>
      track(event.clientX, event.clientY, event.pointerType !== "mouse");
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) track(touch.clientX, touch.clientY, false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [flee, measure]);

  // The 3-second chase clock.
  useEffect(() => {
    const tick = 100;

    const report = () => {
      const chasing = chaseRef.current >= CHASE_ONSET_MS;
      if (chasingRef.current === chasing) return;
      chasingRef.current = chasing;
      onChasingChangeRef.current?.(chasing);
    };

    const id = window.setInterval(() => {
      if (!escapedRef.current || pausedRef.current) {
        if (chaseRef.current !== 0) {
          chaseRef.current = 0;
          setHeat(0);
          report();
        }
        return;
      }

      const chasing =
        inRangeRef.current && performance.now() - lastMoveRef.current < MOVE_IDLE_MS;

      chaseRef.current = chasing ? chaseRef.current + tick : 0;
      report();

      const next = Math.min(1, Math.round((chaseRef.current / CHASE_MS) * 10) / 10);
      setHeat((prev) => (prev === next ? prev : next));

      if (chaseRef.current >= CHASE_MS) {
        chaseRef.current = 0;
        tapsRef.current = 0;
        setHeat(0);
        report();
        onCaughtRef.current();
      }
    }, tick);
    return () => window.clearInterval(id);
  }, []);

  // Keep the runaway inside the viewport when the window is resized.
  useEffect(() => {
    if (!escaped || !size) return;
    const onResize = () =>
      setPos((prev) => ({
        x: clamp(prev.x, 14, window.innerWidth - size.w - 14),
        y: clamp(prev.y, 14, window.innerHeight - size.h - 14),
      }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [escaped, size]);

  const button = (
    <button
      ref={buttonRef}
      type="button"
      // Keyboard users cannot be dodged: catching it this way opens the modal too.
      onClick={() => onCaughtRef.current()}
      aria-label={`${label} — attenzione, questo pulsante scappa`}
      style={{
        transform: `scale(${1 - heat * 0.12})`,
        boxShadow: heat > 0 ? `0 0 ${10 + heat * 28}px rgba(226,101,122,${0.25 + heat * 0.45})` : undefined,
      }}
      className={`pointer-events-auto rounded-full border border-sand/25 bg-white/5 px-8 py-3.5 text-lg font-medium text-sand/80 backdrop-blur-sm transition-[transform,box-shadow,background-color,color] duration-300 ease-out hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-heart ${
        heat >= 0.6 ? "animate-wiggle" : ""
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <span
        className="inline-flex items-center justify-center"
        style={size && escaped ? { width: size.w, height: size.h } : undefined}
      >
        {!escaped && button}
      </span>

      {/* `escaped` only ever flips inside a pointer event, so `document` exists. */}
      {escaped &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-40">
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {button}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
