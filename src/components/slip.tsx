import { useMemo } from "react";
import { buildTickets, rate, recovery, summarizeTickets, ticketHit, upsetBoard } from "@/lib/keirin/tickets";
import type { Ledger } from "@/lib/keirin/points";
import type { AiModel, Analysis, Race } from "@/lib/keirin/types";
import { carFace } from "@/lib/keirin/visual";

function pct(value: number | null) {
  return value == null ? "—" : `${value.toFixed(0)}%`;
}

function Car({ car }: { car: number }) {
  const face = carFace(car);
  return (
    <span
      className="inline-grid size-7 place-items-center rounded-md font-mono text-sm"
      style={{ background: face.bg, color: face.fg }}
    >
      {car}
    </span>
  );
}

export function UpsetBoard({
  races,
  model,
  ledger,
  onPick,
}: {
  races: Race[];
  model: AiModel;
  ledger: Ledger;
  onPick: (index: number) => void;
}) {
  const rows = useMemo(() => upsetBoard(races, model, ledger), [races, model, ledger]);
  if (!races.length) return null;
  const hot = rows.filter((row) => row.prob >= 65);
  const warm = rows.filter((row) => row.prob < 65);
  const render = (list: typeof rows) => (
    <ul className="mt-2 flex flex-col gap-2">
      {list.map((row) => (
        <li key={`${row.id}-${row.index}`}>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-subtle px-3 text-left"
            onClick={() => onPick(row.index)}
          >
            <span className="min-w-0 truncate text-sm text-fg">{row.id}</span>
            <span className={`shrink-0 font-mono text-sm ${row.prob >= 65 ? "text-hot" : "text-warm"}`}>
              {row.prob.toFixed(0)}%
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-gold">読み込み時の荒れ</h2>
        <span className="font-mono text-xs text-faint">65%以上 {hot.length}</span>
      </div>
      {hot.length ? (
        <>
          <p className="mt-2 text-sm text-hot">かなり荒れそう</p>
          {render(hot)}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">65%以上のレースはありません。</p>
      )}
      {warm.length ? (
        <>
          <p className="mt-3 text-sm text-warm">やや波乱</p>
          {render(warm)}
        </>
      ) : null}
    </section>
  );
}

export function Slip({ analysis, prob, order }: { analysis: Analysis; prob: number; order: string }) {
  const ticket = useMemo(() => buildTickets(analysis, false), [analysis]);
  const judged = order.trim() ? ticketHit(ticket, order) : null;
  const boxCars: number[] = [];
  ticket.exacta.forEach(([a, b]) => {
    if (!boxCars.includes(a)) boxCars.push(a);
    if (!boxCars.includes(b)) boxCars.push(b);
  });
  const grouped = new Map<number, Array<[number, number, number]>>();
  ticket.trifecta.forEach((row) => {
    const list = grouped.get(row[0]) ?? [];
    list.push(row);
    grouped.set(row[0], list);
  });

  return (
    <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-gold">買い目</h2>
        <span className="font-mono text-xs text-faint">1点100円 / 計2,500円</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        点数は過去レースの勝率に合わせ、重い印から買います。
        {prob >= 65 ? "このレースは荒れやすさが高いです。" : ""}
      </p>

      <h3 className="mt-4 text-sm text-fg">単勝 4点</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {ticket.wins.map((car) => (
          <Car key={car} car={car} />
        ))}
      </div>

      <h3 className="mt-4 text-sm text-fg">2連単 6点</h3>
      <p className="mt-1 font-mono text-xs text-faint">{boxCars.join("-")} のBOX</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ticket.exacta.map(([a, b]) => (
          <span key={`${a}-${b}`} className="rounded-lg bg-subtle px-2 py-1 font-mono text-sm text-fg">
            {a}-{b}
          </span>
        ))}
      </div>

      <h3 className="mt-4 text-sm text-fg">3連単 15点</h3>
      <ul className="mt-2 space-y-2">
        {[...grouped.entries()].map(([first, rows]) => (
          <li key={first} className="flex flex-wrap items-center gap-1.5">
            <Car car={first} />
            {rows.map(([a, b, c]) => (
              <span key={`${a}-${b}-${c}`} className="rounded-lg bg-subtle px-2 py-1 font-mono text-sm text-fg">
                {b}-{c}
              </span>
            ))}
          </li>
        ))}
      </ul>

      {judged ? (
        <p className="mt-3 text-sm text-gold">
          この結果は 単勝{judged.win ? "的中" : "不的中"}
          {judged.judgedExacta ? ` / 2連単${judged.exacta ? "的中" : "不的中"}` : ""}
          {judged.judgedTrifecta ? ` / 3連単${judged.trifecta ? "的中" : "不的中"}` : ""}
        </p>
      ) : null}
    </section>
  );
}

function line(label: string, hits: number, judged: number, roi: number | null) {
  return (
    <p className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-fg">
        {hits}/{judged || 0} {pct(rate(hits, judged))}
        <span className="ml-3 text-gold">回収 {pct(roi)}</span>
      </span>
    </p>
  );
}

export function Record({ races, model, ledger }: { races: Race[]; model: AiModel; ledger: Ledger }) {
  const rows = useMemo(() => summarizeTickets(races, model, ledger), [races, model, ledger]);
  const any = rows.some((row) => row.races > 0);
  return (
    <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
      <h2 className="text-sm font-medium text-gold">的中率と回収率</h2>
      <p className="mt-1 text-sm text-muted">着順を保存したレースだけ集計します。回収は1点100円です。</p>
      {!any ? (
        <p className="mt-3 text-sm text-muted">まだ結果がありません。</p>
      ) : (
        rows.map((row) => (
          <div key={row.name} className="mt-3 border-t border-line pt-2">
            <p className="text-sm text-fg">
              {row.name}
              <span className="ml-2 font-mono text-xs text-faint">{row.races}R</span>
            </p>
            {line("単勝", row.winHits, row.races, recovery(row.winReturn, row.winKnown, 4))}
            {line("2連単", row.exactaHits, row.exactaJudged, recovery(row.exactaReturn, row.exactaKnown, 6))}
            {line("3連単", row.trifectaHits, row.trifectaJudged, recovery(row.trifectaReturn, row.trifectaKnown, 15))}
          </div>
        ))
      )}
    </section>
  );
}
