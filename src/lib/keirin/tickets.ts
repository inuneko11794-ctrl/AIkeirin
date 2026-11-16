import { analyzeRace, extractFeatures, predictUpset, verdictOf } from "./engine";
import type { Ledger } from "./points";
import type { AiModel, Analysis, Race } from "./types";

const UNIT = 100;
const HOLE = new Set(["無", "T", "△", "▲", "☆", "★", "星"]);

export type Ticket = {
  upset: boolean;
  wins: number[];
  exacta: Array<[number, number]>;
  trifecta: Array<[number, number, number]>;
};

type Scored = Analysis["entries"][number];

function disrupt(entry: Scored) {
  let score = 0;
  if (entry.isTanki) score += 1.3;
  if (entry.mark === "△" || entry.mark === "▲") score += 1.5;
  else if (HOLE.has(entry.mark)) score += 0.8;
  if (entry.car === 3 || entry.car === 6 || entry.car === 9) score += 0.45;
  return score;
}

function lineBonus(analysis: Analysis, first: number, second: number) {
  for (const line of analysis.lineSummaryList) {
    if (line.isTanki) continue;
    const i = line.members.findIndex((m) => m.car === first);
    const j = line.members.findIndex((m) => m.car === second);
    if (i >= 0 && j > i) return 1.7;
  }
  return 0;
}

export function buildTickets(analysis: Analysis, upset: boolean): Ticket {
  const ranked = [...analysis.entries].sort((a, b) => b.weight - a.weight || a.car - b.car);
  const chalk = ranked.slice(0, upset ? 2 : 4);
  const rest = [...analysis.entries]
    .filter((e) => !chalk.some((c) => c.car === e.car))
    .sort((a, b) => (upset ? disrupt(b) - disrupt(a) : b.weight - a.weight) || b.weight - a.weight || a.car - b.car);
  const wins = [...chalk, ...rest].slice(0, 4).map((e) => e.car);

  const box = upset ? [...chalk, ...rest].slice(0, 3) : ranked.slice(0, 3);
  const exacta: Array<[number, number]> = [];
  for (const a of box) {
    for (const b of box) {
      if (a.car !== b.car) exacta.push([a.car, b.car]);
    }
  }

  const pool = [...ranked.slice(0, 3), ...rest].filter((e, i, arr) => arr.findIndex((x) => x.car === e.car) === i).slice(0, 5);
  const triples: Array<{ key: [number, number, number]; score: number }> = [];
  for (const a of pool) {
    for (const b of pool) {
      if (a.car === b.car) continue;
      for (const c of pool) {
        if (c.car === a.car || c.car === b.car) continue;
        let score = a.weight * 1.25 + b.weight * 0.9 + c.weight * 0.6 + lineBonus(analysis, a.car, b.car);
        if (lineBonus(analysis, b.car, c.car)) score += 0.6;
        if (upset) score += disrupt(b) * 0.45 + disrupt(c) * 0.3;
        triples.push({ key: [a.car, b.car, c.car], score });
      }
    }
  }
  triples.sort((a, b) => b.score - a.score || a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2]);

  return {
    upset,
    wins,
    exacta: exacta.slice(0, 6),
    trifecta: triples.slice(0, 15).map((t) => t.key),
  };
}

export function parseFinish(order: string) {
  return order
    .normalize("NFKC")
    .split(/[^0-9]+/)
    .map((n) => Number(n))
    .filter((n) => n >= 1 && n <= 9);
}

export function ticketHit(ticket: Ticket, order: string) {
  const finish = parseFinish(order);
  const win = finish.length >= 1 && ticket.wins.includes(finish[0]);
  const exacta =
    finish.length >= 2 && ticket.exacta.some(([a, b]) => a === finish[0] && b === finish[1]);
  const trifecta =
    finish.length >= 3 &&
    ticket.trifecta.some(([a, b, c]) => a === finish[0] && b === finish[1] && c === finish[2]);
  return { finish, win, exacta, trifecta, judgedExacta: finish.length >= 2, judgedTrifecta: finish.length >= 3 };
}

export type MarketRow = {
  name: string;
  races: number;
  winHits: number;
  exactaHits: number;
  trifectaHits: number;
  exactaJudged: number;
  trifectaJudged: number;
  winReturn: number;
  winKnown: number;
  exactaReturn: number;
  exactaKnown: number;
  trifectaReturn: number;
  trifectaKnown: number;
};

function blank(name: string): MarketRow {
  return {
    name,
    races: 0,
    winHits: 0,
    exactaHits: 0,
    trifectaHits: 0,
    exactaJudged: 0,
    trifectaJudged: 0,
    winReturn: 0,
    winKnown: 0,
    exactaReturn: 0,
    exactaKnown: 0,
    trifectaReturn: 0,
    trifectaKnown: 0,
  };
}

function payoutBand(payout: number | null) {
  if (payout == null || payout <= 0) return "配当なし";
  if (payout < 3000) return "本命・堅実";
  if (payout < 10000) return "中穴";
  if (payout < 50000) return "万車券";
  return "大穴";
}

export function rate(hits: number, total: number) {
  if (!total) return null;
  return (hits / total) * 100;
}

export function recovery(returned: number, knownRaces: number, points: number) {
  if (!knownRaces) return null;
  return (returned / (knownRaces * points * UNIT)) * 100;
}

export function upsetBoard(races: Race[], model: AiModel, ledger?: Ledger | null) {
  return races
    .map((race, index) => {
      const analysis = analyzeRace(race, ledger);
      const prob = predictUpset(extractFeatures(analysis), model) * 100;
      return { index, id: race.id, prob, verdict: verdictOf(prob).headline };
    })
    .filter((row) => row.prob >= 52)
    .sort((a, b) => b.prob - a.prob || a.index - b.index);
}

export function summarizeTickets(races: Race[], _model: AiModel, ledger?: Ledger | null) {
  const bands = ["本命・堅実", "中穴", "万車券", "大穴", "配当なし"].map(blank);
  const all = blank("全体");
  const rows = [all, ...bands];
  const byName = new Map(rows.map((row) => [row.name, row]));

  races.forEach((race) => {
    if (!race.resultOrder.trim()) return;
    const analysis = analyzeRace(race, ledger);
    const ticket = buildTickets(analysis, false);
    const hit = ticketHit(ticket, race.resultOrder);
    if (!hit.finish.length) return;
    const targets = [all, byName.get(payoutBand(race.payout))!];
    targets.forEach((row) => {
      row.races += 1;
      if (hit.win) row.winHits += 1;
      if (race.winPayout && race.winPayout > 0) {
        row.winKnown += 1;
        if (hit.win) row.winReturn += race.winPayout;
      } else if (!hit.win) {
        row.winKnown += 1;
      }
      if (hit.judgedExacta) {
        row.exactaJudged += 1;
        if (hit.exacta) row.exactaHits += 1;
        if (race.exactaPayout && race.exactaPayout > 0) {
          row.exactaKnown += 1;
          if (hit.exacta) row.exactaReturn += race.exactaPayout;
        } else if (!hit.exacta) {
          row.exactaKnown += 1;
        }
      }
      if (hit.judgedTrifecta) {
        row.trifectaJudged += 1;
        if (hit.trifecta) row.trifectaHits += 1;
        if (race.payout && race.payout > 0) {
          row.trifectaKnown += 1;
          if (hit.trifecta) row.trifectaReturn += race.payout;
        } else if (!hit.trifecta) {
          row.trifectaKnown += 1;
        }
      }
    });
  });

  return rows.filter((row) => row.name === "全体" || row.races > 0);
}
