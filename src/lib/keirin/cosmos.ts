import type { Analysis } from "./types";

const LUOSHU = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
] as const;

const DIAGONALS = [
  [2, 5, 8],
  [4, 5, 6],
] as const;

const MATERIAL = new Set([1, 2, 4, 5, 7, 8]);
const AXIS = [3, 6, 9];
const HOLE = new Set(["無", "T", "△", "▲", "☆", "★", "星"]);
const STRONG = new Set(["◎", "⑳", "◯", "●"]);

const CHARGE: Record<number, { q: number; name: string }> = {
  1: { q: 1, name: "p" },
  2: { q: 0, name: "n" },
  3: { q: 1, name: "Σ+" },
  4: { q: 0, name: "Σ0" },
  5: { q: 0, name: "Λ" },
  6: { q: -1, name: "Σ-" },
  7: { q: 0, name: "Ξ0" },
  8: { q: -1, name: "Ξ-" },
  9: { q: 0, name: "η'" },
};

const CYCLE: Array<[number, number]> = [
  [1, 4],
  [4, 2],
  [2, 8],
  [8, 5],
  [5, 7],
  [7, 1],
];

export type CosmosReading = {
  luoshu: {
    grid: number[][];
    topCars: number[];
    sum: number;
    deviation: number;
    broken: string[];
    alert: boolean;
    line: string;
  };
  tesla: {
    material: number;
    hidden: Array<{ car: number; mark: string }>;
    alert: boolean;
    line: string;
  };
  charge: {
    total: number;
    alert: boolean;
    line: string;
  };
  kaprekar: {
    cars: number[];
    steps: number;
    reached: boolean;
    alert: boolean;
    line: string;
  };
  hex: {
    crossings: number;
    chords: number;
    alert: boolean;
    line: string;
  };
  alerts: number;
};

function byStrength(analysis: Analysis) {
  return [...analysis.entries].sort((a, b) => b.weight - a.weight || a.car - b.car);
}

function kaprekarSteps(digits: number[]) {
  let value = Number([...digits].sort((a, b) => b - a).join(""));
  let steps = 0;
  while (value !== 6174 && steps < 8) {
    const text = String(value).padStart(4, "0");
    const desc = Number([...text].sort((a, b) => (a < b ? 1 : -1)).join(""));
    const asc = Number([...text].sort((a, b) => (a > b ? 1 : -1)).join(""));
    const next = desc - asc;
    steps += 1;
    if (next === value) return { steps, reached: false };
    value = next;
  }
  return { steps, reached: value === 6174 };
}

function point(car: number) {
  const ang = (Math.PI * 2 * (car - 1)) / 9 - Math.PI / 2;
  return { x: Math.cos(ang), y: Math.sin(ang) };
}

function crosses(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
) {
  const turn = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0;
}

export function readCosmos(analysis: Analysis): CosmosReading {
  const ranked = byStrength(analysis);
  const present = new Set(analysis.entries.map((e) => e.car));
  const top = ranked.slice(0, 3);
  const topCars = top.map((e) => e.car);
  const topSet = new Set(topCars);
  const sum = topCars.reduce((total, car) => total + car, 0);
  const deviation = Math.abs(sum - 15);
  const broken = DIAGONALS.filter((diag) => diag.every((car) => present.has(car))).flatMap((diag) => {
    const hit = diag.filter((car) => topSet.has(car)).length;
    return hit === 1 || hit === 2 ? [`${diag.join("-")}`] : [];
  });
  const luoshuAlert = deviation >= 5 || (deviation >= 3 && broken.length > 0);

  const material = topCars.filter((car) => MATERIAL.has(car)).length;
  const hidden = AXIS.filter((car) => present.has(car))
    .map((car) => analysis.entries.find((e) => e.car === car))
    .filter((e): e is NonNullable<typeof e> => !!e && HOLE.has(e.mark))
    .map((e) => ({ car: e.car, mark: e.mark }));
  const teslaAlert = material >= 2 && hidden.length >= 1;

  const weightSum = analysis.entries.reduce((total, e) => total + Math.max(e.weight, 0.2), 0) || 1;
  const chargeTotal =
    analysis.entries.reduce((total, e) => total + Math.max(e.weight, 0.2) * (CHARGE[e.car]?.q ?? 0), 0) / weightSum;
  const chargeAlert = Math.abs(chargeTotal) >= 0.28;

  const kapCars = ranked.slice(0, 4).map((e) => e.car);
  const kap = kapCars.length === 4 ? kaprekarSteps(kapCars) : { steps: 0, reached: false };
  const kapAlert = kap.steps >= 6;

  const strong = analysis.entries.filter((e) => STRONG.has(e.mark)).map((e) => e.car);
  const field = present;
  let crossings = 0;
  let chords = 0;
  for (let i = 0; i < strong.length; i += 1) {
    for (let j = i + 1; j < strong.length; j += 1) {
      chords += 1;
      const a = point(strong[i]);
      const b = point(strong[j]);
      for (const [c, d] of CYCLE) {
        if (!field.has(c) || !field.has(d)) continue;
        if (strong[i] === c || strong[i] === d || strong[j] === c || strong[j] === d) continue;
        if (crosses(a, b, point(c), point(d))) crossings += 1;
      }
    }
  }
  const hexAlert = crossings >= 2;

  const alerts = [luoshuAlert, teslaAlert, chargeAlert, kapAlert, hexAlert].filter(Boolean).length;

  return {
    luoshu: {
      grid: LUOSHU.map((row) => [...row]),
      topCars,
      sum,
      deviation,
      broken,
      alert: luoshuAlert,
      line: luoshuAlert
        ? `上位3車 ${topCars.join("・")} の和は ${sum}。15から ${deviation} 外れ${broken.length ? `、対角線 ${broken.join(" / ")} が途切れ` : ""}ています。`
        : `上位3車 ${topCars.join("・")} の和は ${sum}。15との差は ${deviation} です。`,
    },
    tesla: {
      material,
      hidden,
      alert: teslaAlert,
      line: teslaAlert
        ? `上位印 ${material} 車が物質界側にいて、${hidden.map((h) => `${h.car}(${h.mark})`).join("・")} が 3・6・9 に潜んでいます。`
        : `3・6・9 に穴は ${hidden.length} 車。物質界への偏りは ${material}/3 です。`,
    },
    charge: {
      total: +chargeTotal.toFixed(2),
      alert: chargeAlert,
      line: chargeAlert
        ? `総電荷 ${chargeTotal.toFixed(2)}。中性から外れ、本命が対消滅しやすい帯電です。`
        : `総電荷 ${chargeTotal.toFixed(2)}。中性に近く、電荷の崩れは小さいです。`,
    },
    kaprekar: {
      cars: kapCars,
      steps: kap.steps,
      reached: kap.reached,
      alert: kapAlert,
      line:
        kapCars.length < 4
          ? "4車分の車番がないので、6174へは測れません。"
          : kapAlert
            ? `${kapCars.join("")} は 6174 まで ${kap.steps} 手。着順が二転三転しやすい深さです。`
            : `${kapCars.join("")} は 6174 まで ${kap.steps} 手です。`,
    },
    hex: {
      crossings,
      chords,
      alert: hexAlert,
      line: hexAlert
        ? `強い印の弦 ${chords} 本のうち、142857 の軌道と ${crossings} 回交差しています。`
        : `142857 の軌道との交差は ${crossings} 回です。`,
    },
    alerts,
  };
}
