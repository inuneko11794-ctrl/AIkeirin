import { analyzeRace, scoreOf, strengthOf } from "./engine";
import type { Analysis, Race } from "./types";

export type Bucket = "marks" | "roles" | "lines" | "cars";

export type AppliedDelta = {
  bucket: Bucket;
  key: string;
  delta: number;
};

export type PointMove = {
  label: string;
  delta: number;
};

export type Ledger = {
  marks: Record<string, number>;
  roles: Record<string, number>;
  lines: Record<string, number>;
  cars: Record<string, number>;
  applied: Record<string, AppliedDelta[]>;
  last: { raceId: string; predicted: string; actual: string; gap: number; moves: PointMove[] } | null;
  batchLearned: number;
};

const STEP = 0.12;

export function emptyLedger(): Ledger {
  return { marks: {}, roles: {}, lines: {}, cars: {}, applied: {}, last: null, batchLearned: 0 };
}

export function normalizeLedger(value: Partial<Ledger> | null | undefined): Ledger {
  return {
    marks: value?.marks ?? {},
    roles: value?.roles ?? {},
    lines: value?.lines ?? {},
    cars: value?.cars ?? {},
    applied: value?.applied ?? {},
    last: value?.last ?? null,
    batchLearned: value?.batchLearned ?? 0,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, +n.toFixed(3)));
}

function read(table: Record<string, number>, key: string, seed: number) {
  return table[key] ?? seed;
}

type Atom = {
  car: number;
  mark: string;
  role: string;
  lineKey: string;
  power: number;
};

function atomsOf(analysis: Analysis, ledger: Ledger): Atom[] {
  return analysis.lineSummaryList.flatMap((line) => {
    const lineKey = line.members.map((m) => m.convertedMark).join("");
    return line.members.map((m, index) => {
      const role = line.isTanki ? "単騎" : index === 0 ? "先頭" : index === 1 ? "番手" : `${index + 1}番手`;
      const markScore = strengthOf(ledger, {
        car: m.car,
        mark: m.convertedMark,
        role,
        lineKey,
        lineSize: line.members.length,
      });
      return {
        car: m.car,
        mark: m.convertedMark,
        role,
        lineKey,
        power: markScore,
      };
    });
  });
}

export function rankRace(race: Race, ledger: Ledger) {
  const analysis = analyzeRace(race);
  const atoms = atomsOf(analysis, ledger).sort((a, b) => b.power - a.power || a.car - b.car);
  return { analysis, atoms };
}

function parseOrder(order: string) {
  return order
    .normalize("NFKC")
    .split(/[^0-9]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 9);
}

function undo(ledger: Ledger, raceId: string) {
  const prev = ledger.applied[raceId];
  if (!prev) return;
  prev.forEach((d) => {
    const table = ledger[d.bucket];
    const seed = d.bucket === "marks" ? scoreOf(d.key) : 0;
    table[d.key] = clamp(read(table, d.key, seed) - d.delta, d.bucket === "marks" ? 0.05 : -3, d.bucket === "marks" ? 8 : 3);
  });
  delete ledger.applied[raceId];
}

export function learnFromResult(race: Race, order: string, source: Ledger) {
  const actualCars = parseOrder(order);
  const ledger = normalizeLedger(structuredClone(source));
  if (!actualCars.length) {
    return { ledger, predicted: "", actual: "", gap: 0, moves: [] as PointMove[] };
  }
  undo(ledger, race.id);
  const { atoms } = rankRace(race, ledger);
  const predicted = atoms.map((a) => a.car).join("-");

  const actualRank = new Map<number, number>();
  actualCars.forEach((car, i) => {
    if (!actualRank.has(car)) actualRank.set(car, i + 1);
  });
  const known = actualCars.length;
  const predRank = new Map(atoms.map((a, i) => [a.car, i + 1]));
  const touched = new Map<string, { bucket: Bucket; key: string; delta: number; label: string }>();

  const add = (bucket: Bucket, key: string, delta: number, label: string) => {
    if (!delta) return;
    const id = `${bucket}:${key}`;
    const prev = touched.get(id);
    if (prev) prev.delta += delta;
    else touched.set(id, { bucket, key, delta, label });
  };

  const lineGaps = new Map<string, number[]>();
  let gap = 0;
  atoms.forEach((atom) => {
    const pred = predRank.get(atom.car) ?? known + 1;
    let actual: number | null = actualRank.get(atom.car) ?? null;
    if (actual == null) {
      if (pred <= known) actual = known + 1;
      else return;
    }
    const signed = pred - actual;
    gap += Math.abs(signed);
    const delta = signed * STEP;
    add("marks", atom.mark, delta, `印 ${atom.mark}`);
    add("roles", `${atom.role}:${atom.mark}`, delta * 0.7, `${atom.role}${atom.mark}`);
    add("cars", `${atom.car}:${atom.mark}`, delta * 0.8, `${atom.car}番${atom.mark}`);
    const list = lineGaps.get(atom.lineKey) ?? [];
    list.push(signed);
    lineGaps.set(atom.lineKey, list);
  });

  lineGaps.forEach((signs, key) => {
    const mean = signs.reduce((a, b) => a + b, 0) / signs.length;
    add("lines", key, mean * STEP * 0.6, `並び ${key}`);
  });

  const applied: AppliedDelta[] = [];
  const moves: PointMove[] = [];
  touched.forEach((item) => {
    const rounded = +item.delta.toFixed(3);
    if (!rounded) return;
    const table = ledger[item.bucket];
    const seed = item.bucket === "marks" ? scoreOf(item.key) : 0;
    table[item.key] = clamp(
      read(table, item.key, seed) + rounded,
      item.bucket === "marks" ? 0.05 : -3,
      item.bucket === "marks" ? 8 : 3,
    );
    applied.push({ bucket: item.bucket, key: item.key, delta: rounded });
    moves.push({ label: item.label, delta: rounded });
  });
  moves.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  ledger.applied[race.id] = applied;
  const actual = actualCars.join("-");
  ledger.last = { raceId: race.id, predicted, actual, gap, moves: moves.slice(0, 8) };
  return { ledger, predicted, actual, gap, moves };
}

export function learnFromRaces(races: Race[], source: Ledger) {
  const base = normalizeLedger(structuredClone(source));
  const seen = new Map<string, number>();
  const keyed = races.map((race) => {
    const n = seen.get(race.id) ?? 0;
    seen.set(race.id, n + 1);
    if (n === 0) return race;
    return { ...race, id: `${race.id}#${n}` };
  });
  keyed.forEach((race) => undo(base, race.id));
  let ledger = base;
  let count = 0;
  keyed.forEach((race) => {
    if (!parseOrder(race.resultOrder).length) return;
    count += 1;
    ledger = learnFromResult(race, race.resultOrder, ledger).ledger;
  });
  ledger.batchLearned = count;
  return ledger;
}
