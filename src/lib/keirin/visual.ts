export const CAR_FACE = [
  { bg: "#f5f5f4", fg: "#141414" },
  { bg: "#171717", fg: "#fafafa" },
  { bg: "#e11d48", fg: "#fff7f8" },
  { bg: "#2563eb", fg: "#f8fafc" },
  { bg: "#eab308", fg: "#1c1403" },
  { bg: "#16a34a", fg: "#f0fdf4" },
  { bg: "#ea580c", fg: "#fff7ed" },
  { bg: "#db2777", fg: "#fdf2f8" },
  { bg: "#7c3aed", fg: "#f5f3ff" },
] as const;

export const NOTE_NAMES = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド", "レ"];
export const NOTE_FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];

export function carFace(car: number) {
  return CAR_FACE[(Math.max(1, car) - 1) % 9];
}

export const PAYOUT_TIERS = [
  { name: "本命・堅実", range: "〜2,999円", share: "42%", dissonance: 3.35, chaos: 5.45, coup: "21%", bias: 0.295 },
  { name: "中穴", range: "3,000〜9,999円", share: "26%", dissonance: 3.88, chaos: 6.35, coup: "34%", bias: 0.242 },
  { name: "万車券", range: "10,000〜49,999円", share: "24%", dissonance: 4.45, chaos: 7.15, coup: "46%", bias: 0.205 },
  { name: "大穴", range: "50,000円〜", share: "8%", dissonance: 5.1, chaos: 8.3, coup: "58%", bias: 0.165 },
] as const;
