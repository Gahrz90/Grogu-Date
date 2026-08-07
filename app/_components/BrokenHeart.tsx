export function BrokenHeart({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      role="img"
      aria-label="Un cuore spezzato in due metà"
      className={className}
    >
      <defs>
        <linearGradient id="bh-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f08ea0" />
          <stop offset="100%" stopColor="#b83a52" />
        </linearGradient>
        <linearGradient id="bh-right" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2657a" />
          <stop offset="100%" stopColor="#8f2338" />
        </linearGradient>
        <radialGradient id="bh-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e2657a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e2657a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="95" rx="95" ry="85" fill="url(#bh-glow)" />

      {/* left half */}
      <g className="animate-crack-left origin-[100px_90px]">
        <path
          d="M100 42c-9-16-27-24-44-19C37 28 26 45 28 64c3 30 33 55 72 90V128l-12-14 14-16-12-16 10-12z"
          fill="url(#bh-left)"
        />
      </g>

      {/* right half */}
      <g className="animate-crack-right origin-[100px_90px]">
        <path
          d="M100 42c9-16 27-24 44-19 19 5 30 22 28 41-3 30-33 55-72 90V128l12-14-14-16 12-16-10-12z"
          fill="url(#bh-right)"
        />
      </g>
    </svg>
  );
}
