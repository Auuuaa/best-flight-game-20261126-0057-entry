// Alpine Courier — a tiny seeded random generator so the valley, the clouds and
// the ring course are identical on every load with the same seed. Screenshots
// and replays depend on this: no Math.random() anywhere in the game.

// Mulberry32 — small, fast, and good enough for terrain.
export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Roll a value in [min, max) from a seeded generator.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Pick an integer in [min, max] inclusive.
export function intRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Smooth noise in [0, 1): interpolate between random control points so ridges
// and the river read as terrain instead of static.
export function makeNoise1D(rng, points, step) {
  const values = [];
  for (let i = 0; i <= points; i++) values.push(rng());
  return function noise(x) {
    const scaled = x / step;
    const i = Math.floor(scaled);
    const frac = scaled - i;
    const a = values[Math.min(i, points)];
    const b = values[Math.min(i + 1, points)];
    const smooth = frac * frac * (3 - 2 * frac);
    return a + (b - a) * smooth;
  };
}
