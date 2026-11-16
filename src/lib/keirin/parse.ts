import { parseFormationString } from "./engine";
import type { Race } from "./types";

export function parseMarkdownRaces(mdText: string): Race[] {
  const text = mdText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sections = text.split(/^#\s*競輪レースデータ[：:]/m).slice(1);
  const races: Race[] = [];

  sections.forEach((sec) => {
    const title = sec.split("\n")[0]?.trim() || "無名レース";
    const formationMatch = sec.match(/並び予想\s*[|｜]\s*(\[[^\]]+\](?:\s*\[[^\]]+\])*)/);
    const rawFormation = formationMatch?.[1]?.trim() ?? "";
    const girls = /ガールズ|女子/.test(title) || /種別\s*[|｜]\s*[^\n]*ガールズ/.test(sec);

    const entryMap = new Map<number, { car: number; name: string; rawMark: string }>();
    let inTable = false;
    sec.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## 出走表")) {
        inTable = true;
        return;
      }
      if (inTable && trimmed.startsWith("##")) {
        inTable = false;
        return;
      }
      if (!inTable || !trimmed.startsWith("|")) return;
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (cells.length < 7 || !/^\d+$/.test(cells[0])) return;
      const car = parseInt(cells[0], 10);
      if (car < 1 || car > 9) return;
      entryMap.set(car, { car, name: cells[1] || `選手${car}`, rawMark: cells[6] || "-" });
    });

    const entries = [...entryMap.values()].sort((a, b) => a.car - b.car);
    if (entries.length < 5) return;
    const lines = rawFormation ? parseFormationString(rawFormation, entries) : entries.map((e) => [String(e.car)]);
    races.push({
      id: title.slice(0, 48),
      rawFormation: rawFormation || lines.map((g) => `[${g.join(" ")}]`).join(" "),
      lines,
      resultOrder: "",
      payout: null,
      entries,
      girls,
    });
  });

  return races;
}
