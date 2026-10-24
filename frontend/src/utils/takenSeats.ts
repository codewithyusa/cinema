function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function random(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function takenSeatsFor(key: string, rows: string[], columns = 10): Set<string> {
  const next = random(hash(key));
  const taken = new Set<string>();
  for (const row of rows) {
    for (let i = 1; i <= columns; i++) {
      if (next() < 0.28) taken.add(`${row}${i}`);
    }
  }
  return taken;
}