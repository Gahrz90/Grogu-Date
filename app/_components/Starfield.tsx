// Deterministic PRNG: the same stars are rendered on the server and on the
// client, so there is no hydration mismatch and no useEffect flash.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x6704);
const STARS = Array.from({ length: 90 }, () => ({
  left: rand() * 100,
  top: rand() * 100,
  size: 1 + rand() * 2.2,
  delay: rand() * 4,
  duration: 3 + rand() * 4,
  opacity: 0.3 + rand() * 0.5,
}));

export function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-sand animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-force-deep/20 blur-3xl animate-float-slow" />
      <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl animate-float" />
    </div>
  );
}
