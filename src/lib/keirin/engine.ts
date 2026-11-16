import type { AiModel, Analysis, Entry, LineSummary, Race } from "./types";

export const BASELINE = {
  dissonanceMean: 4.1,
  chaosMean: 6.55,
  biasMean: 0.238,
  weights: [0.58, 0.49, 0.28, 0.62, 0.46],
  bias: -0.48,
};

export const SCORES: Record<string, number> = {
  "◎": 5,
  "◯": 3.39,
  "△": 2.31,
  "✕": 1.74,
  "⑳": 1.06,
  "●": 1.05,
  "▲": 0.97,
  "✖": 0.93,
  "☆": 0.86,
  T: 0.81,
  "★": 0.78,
  星: 0.4,
  無: 0.2,
};

const SPECIAL: Record<string, string> = {
  "◎": "⑳",
  "◯": "●",
  "△": "▲",
  "✕": "✖",
};

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

export function scoreOf(mark: string) {
  return SCORES[mark.trim()] ?? 0.5;
}

export type ScoreBook = {
  marks?: Record<string, number>;
  roles?: Record<string, number>;
  lines?: Record<string, number>;
  cars?: Record<string, number>;
};

export function strengthOf(
  book: ScoreBook | null | undefined,
  part: { car: number; mark: string; role: string; lineKey: string; lineSize: number },
) {
  if (!book) return scoreOf(part.mark);
  const markScore = book.marks?.[part.mark] ?? scoreOf(part.mark);
  const roleScore = book.roles?.[`${part.role}:${part.mark}`] ?? 0;
  const carScore = book.cars?.[`${part.car}:${part.mark}`] ?? 0;
  const lineScore = (book.lines?.[part.lineKey] ?? 0) / Math.max(1, part.lineSize);
  return markScore + roleScore + carScore + lineScore;
}

export function normalizeRawMark(raw: string | undefined | null) {
  if (!raw) return "無";
  const s = String(raw).trim();
  if (["本命", "◎"].includes(s)) return "◎";
  if (["対抗", "◯", "○", "〇"].includes(s)) return "◯";
  if (["単穴", "△"].includes(s)) return "△";
  if (["連下", "✕", "×"].includes(s)) return "✕";
  if (["-", "－", "無", "無印", ""].includes(s)) return "無";
  return s;
}

export function rawLabel(raw: string | undefined | null) {
  const s = String(raw ?? "").trim();
  if (["本命", "◎"].includes(s)) return "本命";
  if (["対抗", "◯", "○", "〇"].includes(s)) return "対抗";
  if (["単穴", "△"].includes(s)) return "単穴";
  if (["連下", "✕", "×"].includes(s)) return "連下";
  if (["-", "－", "無", "無印", ""].includes(s)) return "無";
  return s || "無";
}

export function parseFormationString(rawStr: string, entries: Entry[]) {
  if (!rawStr.trim()) return entries.map((e) => [String(e.car)]);
  const brackets = rawStr.match(/\[[^\]]+\]/g);
  if (brackets) {
    const groups = brackets.map((b) => b.match(/\d/g) ?? []).filter((g) => g.length);
    if (groups.length) return groups;
  }
  return rawStr
    .split(/[\s\-/・,]+/)
    .map((g) => g.match(/\d/g) ?? [])
    .filter((g) => g.length);
}

function convertLine(rawMarks: string[]) {
  const conv = [...rawMarks];
  let i = 0;
  while (i < rawMarks.length) {
    if (rawMarks[i] !== "無") {
      i += 1;
      continue;
    }
    let len = 1;
    while (i + len < rawMarks.length && rawMarks[i + len] === "無") len += 1;
    if (len >= 2) {
      const seq = ["☆", "★", "星"];
      for (let k = 0; k < len; k += 1) conv[i + k] = seq[Math.min(k, 2)];
    }
    i += len;
  }

  const claimed = rawMarks.map(() => false);
  for (let idx = 0; idx < rawMarks.length; idx += 1) {
    const special = SPECIAL[rawMarks[idx]];
    if (!special) continue;
    const left = idx - 1;
    const right = idx + 1;
    const leftFree = left >= 0 && rawMarks[left] === "無" && !claimed[left];
    if (leftFree) {
      conv[left] = special;
      claimed[left] = true;
    }
    if (right < rawMarks.length && rawMarks[right] === "無" && !claimed[right]) {
      conv[right] = leftFree ? "☆" : special;
      claimed[right] = true;
    }
  }

  for (let idx = 0; idx < conv.length; idx += 1) {
    if (rawMarks[idx] === "無" && conv[idx] === "無") conv[idx] = "☆";
  }
  return conv;
}

export function applyLineAndMarkRules(race: Race) {
  const carToEntry: Record<number, Entry> = {};
  race.entries.forEach((e) => {
    carToEntry[e.car] = e;
  });

  const groups =
    race.girls || !race.lines.length
      ? race.entries.map((e) => [String(e.car)])
      : race.lines;

  let lineCounter = 0;
  const lineSummaryList: LineSummary[] = [];
  const carMeta: Record<number, { lineLabel: string; isTanki: boolean; rawMark: string; convertedMark: string }> =
    {};

  const pushTanki = (car: number) => {
    const entry = carToEntry[car];
    if (!entry) return;
    const rawM = normalizeRawMark(entry.rawMark);
    const converted = rawM === "無" ? "T" : rawM;
    carMeta[car] = { lineLabel: "単騎", isTanki: true, rawMark: rawLabel(entry.rawMark), convertedMark: converted };
    lineSummaryList.push({
      label: "単騎",
      isTanki: true,
      members: [{ car, name: entry.name, rawMark: rawLabel(entry.rawMark), convertedMark: converted }],
    });
  };

  groups.forEach((grp) => {
    const cars = grp.map((c) => parseInt(c, 10)).filter((c) => !Number.isNaN(c) && carToEntry[c]);
    if (!cars.length) return;
    if (cars.length === 1 || race.girls) {
      cars.forEach(pushTanki);
      return;
    }
    const label = `ライン${CIRCLED[lineCounter] ?? lineCounter + 1}`;
    lineCounter += 1;
    const rawMarks = cars.map((c) => normalizeRawMark(carToEntry[c].rawMark));
    const labels = cars.map((c) => rawLabel(carToEntry[c].rawMark));
    const convMarks = convertLine(rawMarks);
    const members = cars.map((c, idx) => {
      carMeta[c] = {
        lineLabel: label,
        isTanki: false,
        rawMark: labels[idx],
        convertedMark: convMarks[idx],
      };
      return { car: c, name: carToEntry[c].name, rawMark: labels[idx], convertedMark: convMarks[idx] };
    });
    lineSummaryList.push({ label, isTanki: false, members });
  });

  race.entries.forEach((e) => {
    if (!carMeta[e.car]) pushTanki(e.car);
  });

  return { carMeta, lineSummaryList };
}

export function analyzeRace(race: Race, book?: ScoreBook | null): Analysis {
  const { carMeta, lineSummaryList } = applyLineAndMarkRules(race);
  const entries = [...race.entries]
    .sort((a, b) => a.car - b.car)
    .map((e) => ({
      ...e,
      rawMark: carMeta[e.car].rawMark,
      mark: carMeta[e.car].convertedMark,
      lineLabel: carMeta[e.car].lineLabel,
      isTanki: carMeta[e.car].isTanki,
    }));

  const power = new Map<number, number>();
  lineSummaryList.forEach((line) => {
    const lineKey = line.members.map((m) => m.convertedMark).join("");
    line.members.forEach((m, index) => {
      const role = line.isTanki ? "単騎" : index === 0 ? "先頭" : index === 1 ? "番手" : `${index + 1}番手`;
      power.set(
        m.car,
        strengthOf(book, { car: m.car, mark: m.convertedMark, role, lineKey, lineSize: line.members.length }),
      );
    });
  });
  const scores = entries.map((e) => power.get(e.car) ?? scoreOf(e.mark));
  const numCars = entries.length || 1;
  const semitones = [0, 2, 4, 5, 7, 9, 11, 12, 14];
  const topIdx = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.i);
  const notes = topIdx.map((i) => semitones[(entries[i].car - 1) % 9]).sort((a, b) => a - b);
  let dissonance = 0;
  for (let j = 0; j < notes.length - 1; j += 1) {
    const iv = notes[j + 1] - notes[j];
    dissonance += [1, 6, 11].includes(iv) ? 3 : [2, 10].includes(iv) ? 1.5 : 0.5;
  }

  let tanKiCount = 0;
  const masses = lineSummaryList.map((l) => {
    if (l.isTanki) tanKiCount += 1;
    return l.members.reduce((sum, m) => sum + (power.get(m.car) ?? scoreOf(m.convertedMark)), 0);
  });
  const meanM = masses.reduce((a, b) => a + b, 0) / (masses.length || 1);
  const stdM = Math.sqrt(masses.reduce((a, b) => a + (b - meanM) ** 2, 0) / (masses.length || 1));
  const chaosIndex = 10 / (stdM + 1) + tanKiCount * 1.5;

  const lineShape =
    lineSummaryList.filter((l) => !l.isTanki).map((l) => l.members.length).join("") +
    (tanKiCount > 0 ? `T${tanKiCount}` : "");
  const raceDna = `${numCars}C-L${lineShape}-[${entries.map((e) => e.mark).join("")}]`;

  let coupScore = 0;
  let abandonScore = 0;
  const dramaDetails: string[] = [];
  lineSummaryList.forEach((l) => {
    if (l.isTanki || l.members.length < 2) return;
    const s1 = power.get(l.members[0].car) ?? scoreOf(l.members[0].convertedMark);
    const s2 = power.get(l.members[1].car) ?? scoreOf(l.members[1].convertedMark);
    const str = l.members.map((m) => `${m.car}(${m.convertedMark})`).join("-");
    if (s2 > s1) {
      coupScore += +(s2 - s1).toFixed(1);
      dramaDetails.push(`${l.label} 下剋上。番手が先頭より重い [${str}]`);
    } else if (s1 - s2 >= 2) {
      abandonScore += +(s1 - s2).toFixed(1);
      dramaDetails.push(`${l.label} ちぎれ。先頭が番手より2.0以上重い [${str}]`);
    } else {
      dramaDetails.push(`${l.label} 安定結束 [${str}]`);
    }
  });

  const totalW = scores.reduce((a, b) => a + b, 0) || 1;
  let gx = 0;
  let gy = 0;
  entries.forEach((_e, i) => {
    const ang = (2 * Math.PI * i) / numCars - Math.PI / 2;
    gx += scores[i] * Math.cos(ang);
    gy += scores[i] * Math.sin(ang);
  });
  const gravity = { x: gx / totalW, y: gy / totalW };
  const gravityBias = Math.sqrt(gravity.x ** 2 + gravity.y ** 2);

  return {
    entries: entries.map((e, i) => ({ ...e, weight: +scores[i].toFixed(2) })),
    lineSummaryList,
    dissonance: +dissonance.toFixed(2),
    chaosIndex: +chaosIndex.toFixed(2),
    raceDna,
    coupScore: +coupScore.toFixed(2),
    abandonScore: +abandonScore.toFixed(2),
    dramaDetails,
    gravityBias: +gravityBias.toFixed(3),
    gravity: { x: +gravity.x.toFixed(4), y: +gravity.y.toFixed(4) },
  };
}

export function extractFeatures(res: Analysis) {
  return [
    Math.min(1.5, res.dissonance / (BASELINE.dissonanceMean * 1.5)),
    Math.min(1.5, res.chaosIndex / (BASELINE.chaosMean * 1.8)),
    0.65,
    Math.min(1.5, (res.coupScore + res.abandonScore) / 4.5),
    Math.max(0, 1 - res.gravityBias / (BASELINE.biasMean * 2.4)),
  ];
}

export function predictUpset(features: number[], model: AiModel) {
  let z = model.bias;
  for (let i = 0; i < 5; i += 1) z += features[i] * model.weights[i];
  return 1 / (1 + Math.exp(-z));
}

export function verdictOf(prob: number) {
  if (prob >= 65) return { headline: "かなり荒れそう", tone: "hot" as const };
  if (prob >= 52) return { headline: "やや波乱気配", tone: "warm" as const };
  if (prob >= 40) return { headline: "互角・標準", tone: "calm" as const };
  return { headline: "堅め・本命寄り", tone: "cool" as const };
}

export function defaultModel(): AiModel {
  return { weights: [...BASELINE.weights], bias: BASELINE.bias };
}

export function calibrate70(model: AiModel): AiModel {
  const bias = +(
    Math.log(0.7 / 0.3) - [0.85, 0.82, 0.65, 0.72, 0.78].reduce((s, v, i) => s + v * model.weights[i], 0)
  ).toFixed(4);
  return { ...model, bias };
}

export function trainOnRaces(races: Race[], model: AiModel): AiModel {
  const labeled = races.filter((r) => r.payout && r.payout > 0);
  if (!labeled.length) return model;
  const next = { weights: [...model.weights], bias: model.bias };
  for (let ep = 0; ep < 150; ep += 1) {
    labeled.forEach((r) => {
      const x = extractFeatures(analyzeRace(r));
      const y = Number(r.payout) >= 10000 ? 1 : 0;
      const err = predictUpset(x, next) - y;
      for (let i = 0; i < 5; i += 1) next.weights[i] -= 0.05 * err * x[i];
      next.bias -= 0.05 * err;
    });
  }
  return next;
}
