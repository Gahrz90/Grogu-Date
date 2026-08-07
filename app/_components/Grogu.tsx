"use client";

import { useEffect, useRef, useState } from "react";

export type GroguMood = "hopeful" | "happy" | "sad" | "crying";

/**
 * How far the glints can drift, in viewBox units. Capped so they stay inside
 * the eye even in the `sad` face, where the eyes are shorter: the glints sit
 * 4/5 units up-left of each eye centre and have a radius of 5, against an eye
 * of rx 16 / ry 15.
 */
const GAZE_X = 6.5;
const GAZE_Y = 4.8;
/**
 * Distance over which the gaze reaches its full deflection. Shorter vertically:
 * there is never much viewport above the face, so the upward look needs less
 * travel to read as "looking up".
 */
const GAZE_REACH_X = 420;
const GAZE_REACH_Y = 260;

/**
 * Follows the pointer and returns the eye offset in viewBox units.
 * The listener is rAF-throttled: one measurement per frame, at most.
 */
function useGaze(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const frameRef = useRef(0);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        // The eyes sit in the upper third of the artwork, not at its centre.
        const eyesX = rect.left + rect.width / 2;
        const eyesY = rect.top + rect.height * 0.38;
        const nx = Math.max(-1, Math.min(1, (event.clientX - eyesX) / GAZE_REACH_X));
        const ny = Math.max(-1, Math.min(1, (event.clientY - eyesY) / GAZE_REACH_Y));
        setGaze({ x: +(nx * GAZE_X).toFixed(2), y: +(ny * GAZE_Y).toFixed(2) });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [svgRef]);

  return gaze;
}

const FACES: Record<
  GroguMood,
  {
    eyeRy: number;
    mouth: string;
    cheeks: boolean;
    sadBrows: boolean;
    tear: boolean;
    coverEyes: boolean;
    label: string;
  }
> = {
  hopeful: {
    eyeRy: 19,
    mouth: "M108 132 q12 7 24 0",
    cheeks: false,
    sadBrows: false,
    tear: false,
    coverEyes: false,
    label: "Un piccolo alieno verde con orecchie enormi che ti segue con lo sguardo",
  },
  happy: {
    eyeRy: 19,
    mouth: "M102 130 q18 16 36 0",
    cheeks: true,
    sadBrows: false,
    tear: false,
    coverEyes: false,
    label: "Un piccolo alieno verde con orecchie enormi che sorride felice",
  },
  sad: {
    eyeRy: 15,
    mouth: "M109 137 q11 -9 22 0",
    cheeks: false,
    sadBrows: true,
    tear: true,
    coverEyes: false,
    label: "Un piccolo alieno verde con orecchie enormi, triste, con una lacrima",
  },
  crying: {
    eyeRy: 15,
    mouth: "M106 139 q14 -11 28 0",
    cheeks: false,
    sadBrows: true,
    tear: true,
    coverEyes: true,
    label: "Un piccolo alieno verde che piange coprendosi gli occhi con le mani",
  },
};

const HAND_MOTION = "transform 460ms cubic-bezier(0.34, 1.28, 0.64, 1)";

/** Clasped in front of the robe, or raised over the eyes. */
const HANDS = {
  down: { left: "translate(107px, 209px) rotate(-10deg)", right: "translate(133px, 209px) rotate(10deg)" },
  up: { left: "translate(96px, 107px) scale(1.5)", right: "translate(144px, 107px) scale(1.5)" },
};

/**
 * Hand-drawn, self-contained SVG mascot: no external assets, no network,
 * so the page stays instant when it's opened from a WhatsApp preview.
 */
export function Grogu({
  mood = "hopeful",
  className = "",
}: {
  mood?: GroguMood;
  className?: string;
}) {
  const face = FACES[mood];
  const hands = face.coverEyes ? HANDS.up : HANDS.down;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gaze = useGaze(svgRef);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 240 270"
      role="img"
      aria-label={face.label}
      className={className}
    >
      <defs>
        <radialGradient id="g-skin" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#cfe6b4" />
          <stop offset="60%" stopColor="#a9cd8a" />
          <stop offset="100%" stopColor="#7fa866" />
        </radialGradient>
        <linearGradient id="g-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d7b3" />
          <stop offset="100%" stopColor="#b99f74" />
        </linearGradient>
        <radialGradient id="g-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a8d38a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a8d38a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-eye" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#3c4436" />
          <stop offset="100%" stopColor="#11170f" />
        </radialGradient>
      </defs>

      {/* force glow */}
      <ellipse cx="120" cy="140" rx="118" ry="122" fill="url(#g-halo)" className="animate-halo" />

      {/* ears */}
      <g className="animate-wiggle origin-[120px_110px]">
        <g transform="rotate(-20 120 106)">
          <ellipse cx="38" cy="114" rx="56" ry="21" fill="url(#g-skin)" />
          <ellipse cx="46" cy="114" rx="42" ry="11" fill="#c98f8f" opacity="0.4" />
        </g>
        <g transform="rotate(20 120 106)">
          <ellipse cx="202" cy="114" rx="56" ry="21" fill="url(#g-skin)" />
          <ellipse cx="194" cy="114" rx="42" ry="11" fill="#c98f8f" opacity="0.4" />
        </g>
      </g>

      {/* robe */}
      <path
        d="M120 150c-38 0-58 26-62 74a6 6 0 0 0 6 7h112a6 6 0 0 0 6-7c-4-48-24-74-62-74z"
        fill="url(#g-robe)"
      />
      <path
        d="M120 150c-16 0-29 5-38 14 10 12 22 19 38 19s28-7 38-19c-9-9-22-14-38-14z"
        fill="#cbb387"
        opacity="0.8"
      />
      <path
        d="M96 168c8 22 10 42 8 63M144 168c-8 22-10 42-8 63"
        stroke="#a2865d"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      {/* sleeves: only visible while the arms are raised */}
      <g
        fill="#c9b184"
        style={{ opacity: face.coverEyes ? 1 : 0, transition: "opacity 380ms ease" }}
      >
        <path d="M74 214 q-6 -56 14 -92 l18 10 q-18 40 -14 84z" />
        <path d="M166 214 q6 -56 -14 -92 l-18 10 q18 40 14 84z" />
      </g>

      {/* head */}
      <ellipse cx="120" cy="104" rx="61" ry="57" fill="url(#g-skin)" />
      <ellipse cx="120" cy="70" rx="42" ry="22" fill="#d7ebbd" opacity="0.35" />

      {/* wispy hair */}
      <path
        d="M104 50c2-9 5-14 9-18M120 46c0-9 1-15 3-20M136 50c-2-9-4-14-8-18"
        stroke="#8fae76"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* eyes — only the glints track the pointer, the eyes themselves hold still */}
      <g>
        <ellipse cx="96" cy="104" rx="16" ry={face.eyeRy} fill="url(#g-eye)" />
        <ellipse cx="144" cy="104" rx="16" ry={face.eyeRy} fill="url(#g-eye)" />
        <g
          style={{
            transform: `translate(${gaze.x}px, ${gaze.y}px)`,
            transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <circle cx="92" cy="99" r="5" fill="#fff" opacity="0.85" />
          <circle cx="140" cy="99" r="5" fill="#fff" opacity="0.85" />
        </g>
      </g>

      {face.sadBrows && (
        <g stroke="#7d9c65" strokeWidth="4.5" strokeLinecap="round" fill="none">
          {/* inner ends lifted: sad, not angry */}
          <path d="M79 88 q16 -10 32 -3" />
          <path d="M161 88 q-16 -10 -32 -3" />
        </g>
      )}

      {face.cheeks && (
        <g fill="#d98b8b" opacity="0.32">
          <ellipse cx="80" cy="124" rx="10" ry="6" />
          <ellipse cx="160" cy="124" rx="10" ry="6" />
        </g>
      )}

      {/* nose + mouth */}
      <ellipse cx="120" cy="120" rx="5.5" ry="3.5" fill="#7c9a63" />
      <path d={face.mouth} stroke="#6f8c58" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {face.tear && <ellipse cx="100" cy="132" rx="4" ry="6.5" fill="#9fd8ff" opacity="0.9" />}

      {/* running tears, drawn under the hands so they slip out from behind them */}
      {face.coverEyes && (
        <g fill="#9fd8ff">
          <ellipse cx="90" cy="124" rx="3.6" ry="5.6" className="animate-tear" />
          <ellipse cx="150" cy="126" rx="3.2" ry="5" className="animate-tear [animation-delay:0.8s]" />
        </g>
      )}

      {/* hands: clasped in front, or raised over the eyes when he can't watch.
          Over the face they darken and grow fingers, otherwise they read as
          eyelids against the green of the head. */}
      {[
        { transform: hands.left, fill: face.coverEyes ? "#8cb56f" : "#a9cd8a" },
        { transform: hands.right, fill: face.coverEyes ? "#84ad67" : "#9cc17e" },
      ].map((hand, i) => (
        <g key={i} style={{ transform: hand.transform, transition: HAND_MOTION }}>
          <ellipse
            rx="12"
            ry="10"
            fill={hand.fill}
            stroke="#6f9257"
            strokeWidth={face.coverEyes ? 0.9 : 0}
            style={{ transition: "fill 380ms ease, stroke-width 380ms ease" }}
          />
          <g
            stroke="#6f9257"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            style={{ opacity: face.coverEyes ? 0.75 : 0, transition: "opacity 380ms ease" }}
          >
            <path d="M-4.5 -7 v13" />
            <path d="M1.5 -7.5 v14" />
            <path d="M7 -6.5 v12" />
          </g>
        </g>
      ))}
    </svg>
  );
}
