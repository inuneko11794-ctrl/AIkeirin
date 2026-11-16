import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  GraduationCap,
  Save,
  Shuffle,
  Target,
} from "lucide-react";
import {
  analyzeRace,
  BASELINE,
  calibrate70,
  extractFeatures,
  predictUpset,
  scoreOf,
  trainOnRaces,
  verdictOf,
} from "@/lib/keirin/engine";
import { CosmosPanel } from "@/components/cosmos";
import { learnFromResult, emptyLedger, type Ledger } from "@/lib/keirin/points";
import { carFace, PAYOUT_TIERS } from "@/lib/keirin/visual";
import { parseMarkdownRaces } from "@/lib/keirin/parse";
import { loadState, saveState } from "@/lib/keirin/store";
import type { AiModel, Race } from "@/lib/keirin/types";

const GravityStage = lazy(() => import("@/components/stage").then((m) => ({ default: m.GravityStage })));
const LineDrift = lazy(() => import("@/components/stage").then((m) => ({ default: m.LineDrift })));
const Sonify = lazy(() => import("@/components/stage").then((m) => ({ default: m.Sonify })));

function usePress() {
  const [hit, setHit] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const mark = (id: string) => {
    setHit(id);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHit(null), 280);
  };
  return { hit, mark };
}

function CarNo({ car }: { car: number }) {
  const face = carFace(car);
  return (
    <span
      className="inline-grid size-6 place-items-center rounded-md font-mono text-xs font-medium"
      style={{ background: face.bg, color: face.fg }}
    >
      {car}
    </span>
  );
}

export function Lab() {
  const [races, setRaces] = useState<Race[]>([]);
  const [model, setModel] = useState<AiModel>({ weights: [0.58, 0.49, 0.28, 0.62, 0.46], bias: -0.48 });
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState("");
  const [payout, setPayout] = useState("");
  const { hit, mark } = usePress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [ledger, setLedger] = useState<Ledger>(emptyLedger);

  useEffect(() => {
    const saved = loadState();
    setRaces(saved.races);
    setModel(saved.model);
    setLedger(saved.ledger);
    setIndex(saved.races.length ? Math.min(saved.index, saved.races.length - 1) : 0);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ races, model, index, ledger });
  }, [hydrated, races, model, index, ledger]);

  const race = races[index];
  const analysis = useMemo(() => (race ? analyzeRace(race, ledger) : null), [race, ledger]);
  const prob = analysis ? predictUpset(extractFeatures(analysis), model) * 100 : 0;
  const verdict = verdictOf(prob);

  useEffect(() => {
    setOrder(race?.resultOrder ?? "");
    setPayout(race?.payout ? String(race.payout) : "");
  }, [race?.id, race?.resultOrder, race?.payout]);

  const toast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const ingest = (text: string, source: string) => {
    const next = parseMarkdownRaces(text);
    if (!next.length) {
      toast(`${source}からレースを読めませんでした`);
      return;
    }
    setRaces(next);
    setIndex(0);
    toast(`${next.length}レースを読み込みました`);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    ingest(await file.text(), file.name);
  };

  const shift = (dir: number) => {
    if (!races.length) return;
    setIndex((i) => (i + dir + races.length) % races.length);
  };

  const saveResult = () => {
    if (!race) return;
    const resultOrder = order.trim();
    const nextPayout = payout.trim() ? Number(payout) : null;
    setRaces((prev) => prev.map((r, i) => (i === index ? { ...r, resultOrder, payout: nextPayout } : r)));
    if (!resultOrder) {
      toast(`「${race.id}」の結果を保存しました`);
      return;
    }
    const learned = learnFromResult({ ...race, resultOrder, payout: nextPayout }, resultOrder, ledger);
    setLedger(learned.ledger);
    toast(`「${race.id}」の結果を保存しました`);
  };

  const exportCsv = () => {
    const rows = [["レース", "車番", "選手", "元印", "変換印", "ライン", "並び", "着順", "配当"]];
    races.forEach((r) => {
      analyzeRace(r).entries.forEach((e) => {
        rows.push([
          r.id,
          String(e.car),
          e.name,
          e.rawMark,
          e.mark,
          e.lineLabel,
          r.rawFormation,
          r.resultOrder,
          r.payout ? String(r.payout) : "",
        ]);
      });
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "keirin-quadrivium.csv";
    a.click();
  };

  const toneClass =
    verdict.tone === "hot" ? "text-hot" : verdict.tone === "warm" ? "text-warm" : verdict.tone === "cool" ? "text-cool" : "text-fg";
  const press = (id: string) => `pressable ${hit === id ? "is-hit" : ""}`;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-5">
        <p className="font-mono text-xs tracking-[0.18em] text-faint">QUADRIVIUM LAB</p>
        <h1 className="font-display text-4xl leading-none tracking-tight text-fg">競輪四学</h1>
        <p className="mt-2 text-sm text-muted">並びと印から不協和・カオス・下剋上を見て、荒れ確率を出す。</p>
      </header>

      <section className="rounded-[28px] border border-line bg-elevated p-4">
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt,.markdown,text/markdown,text/plain,*/*"
          className="sr-only"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`${press("file")} flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-medium text-accent-fg`}
            onClick={() => {
              mark("file");
              fileRef.current?.click();
            }}
          >
            <FolderOpen size={18} />
            ファイル読込
          </button>
          <button
            type="button"
            className={`${press("sample")} flex min-h-14 items-center justify-center rounded-2xl border border-line text-sm text-fg`}
            onClick={() => {
              mark("sample");
              void fetch("/sample-kawasaki.md")
                .then((r) => r.text())
                .then((t) => ingest(t, "サンプル"))
                .catch(() => toast("サンプルを開けませんでした"));
            }}
          >
            川崎サンプル
          </button>
        </div>
      </section>

      {notice ? (
        <p className="mt-3 rounded-xl border border-line bg-subtle px-3 py-2 text-sm text-fg" role="status">
          {notice}
        </p>
      ) : null}

      <section className="mt-4 flex min-h-11 items-center gap-1 rounded-[20px] border border-line bg-elevated p-1">
        <button
          type="button"
          aria-label="前のレース"
          className={`${press("prev")} grid size-11 place-items-center rounded-xl text-fg`}
          onClick={() => {
            mark("prev");
            shift(-1);
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <select
          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-fg"
          value={races.length ? index : ""}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {!races.length ? <option value="">レースなし</option> : null}
          {races.map((r, i) => (
            <option key={`${r.id}-${i}`} value={i} className="bg-elevated">
              {i + 1}/{races.length} {r.id}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="次のレース"
          className={`${press("next")} grid size-11 place-items-center rounded-xl text-fg`}
          onClick={() => {
            mark("next");
            shift(1);
          }}
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          aria-label="ランダム"
          className={`${press("rand")} grid size-11 place-items-center rounded-xl text-fg`}
          onClick={() => {
            mark("rand");
            if (!races.length) {
              toast("レースがありません");
              return;
            }
            setIndex(Math.floor(Math.random() * races.length));
          }}
        >
          <Shuffle size={16} />
        </button>
      </section>

      {!race || !analysis ? (
        <p className="mt-4 text-sm text-muted">まだレースがありません。出走表ファイルを読み込むと、全レースを解析できます。</p>
      ) : (
        <>
          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-5">
            <p className="text-xs tracking-wide text-faint">四学診断</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <p className={`font-mono text-5xl tabular-nums leading-none ${toneClass}`}>{prob.toFixed(1)}%</p>
              <p className="max-w-[11rem] pb-1 text-right text-sm font-medium text-fg">{verdict.headline}</p>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-subtle">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, prob))}%` }} />
            </div>
            <p className="mt-3 font-mono text-xs text-faint">並び {race.rawFormation}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-mono text-sm tabular-nums text-fg">不協和度 {analysis.dissonance}</p>
                <p className="text-sm text-muted">
                  {analysis.dissonance > 4.1 ? "不協和コード（波乱の響き）" : "協和コード（安定の響き）"}
                </p>
              </div>
              <div>
                <p className="font-mono text-sm tabular-nums text-fg">カオス {analysis.chaosIndex}</p>
                <p className="text-sm text-muted">
                  重心偏り {analysis.gravityBias}（{analysis.gravityBias < 0.238 ? "均衡" : "偏重"}）
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-fg">ラインと変換印</h2>
              <span className="font-mono text-xs text-faint">
                下剋上 {analysis.coupScore} / ちぎれ {analysis.abandonScore}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {analysis.lineSummaryList.map((line, li) => (
                <div key={`${line.label}-${li}`} className="rounded-xl bg-subtle px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">{line.label}</span>
                    <span className="font-mono text-fg">[{line.members.map((m) => m.convertedMark).join(" ")}]</span>
                  </div>
                  <ul className="mt-1">
                    {line.members.map((m) => (
                      <li key={m.car} className="flex justify-between gap-3 py-1 text-sm">
                        <span className="inline-flex items-center gap-2">
                          <CarNo car={m.car} /> {m.name}
                        </span>
                        <span className="font-mono text-gold">
                          {m.rawMark}→{m.convertedMark}
                          <span className="ml-2 text-faint">{scoreOf(m.convertedMark).toFixed(1)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 break-all font-mono text-xs text-fg">{analysis.raceDna}</p>
            {analysis.dramaDetails.length ? (
              <ul className="mt-2 space-y-1 border-t border-line pt-2 text-sm text-muted">
                {analysis.dramaDetails.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-gold">出走表の音楽化</h2>
              <span className="font-mono text-xs text-faint">基準 {BASELINE.dissonanceMean}</span>
            </div>
            <p className="mt-1 text-sm text-muted">車番を音階に、印の強さを音量にします。</p>
            <Suspense fallback={<div className="h-28" />}>
            <Sonify analysis={analysis} />
          </Suspense>
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-gold">車番ポリゴン</h2>
              <span className="font-mono text-xs text-cyan">
                重心 {analysis.gravityBias} / {BASELINE.biasMean}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              車番をバンクの円周に並べ、変換後の印を重りにします。点線は均衡の境、0.238です。
            </p>
            <Suspense fallback={<div className="h-72" />}>
            <GravityStage analysis={analysis} />
          </Suspense>
            <p className="text-sm text-gold">
              {analysis.gravityBias < BASELINE.biasMean
                ? "重心が中心付近です。強い印が散らばり、支配する軸がありません。どの車番からも波乱が起きやすい形です。"
                : "重心が端に寄っています。重い印が固まっていて、その方向の軸が押し切る本命決着になりやすい形です。"}
            </p>
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-gold">ライン重力</h2>
              <span className="font-mono text-xs text-faint">カオス {analysis.chaosIndex} / {BASELINE.chaosMean}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              ラインは連星です。質量が拮抗すると軌道が乱れ、単騎は彗星として横切ります。赤線は下剋上、破線はちぎれです。
            </p>
            <Suspense fallback={<div className="h-64" />}>
            <LineDrift analysis={analysis} />
          </Suspense>
            <p className="text-sm text-gold">
              {analysis.chaosIndex >= BASELINE.chaosMean
                ? "ラインの質量が近く、単騎が軌道を乱しています。三体のように決着が読みにくい形です。"
                : "一つのラインが重いです。その重力に引き込まれ、スジで堅くなりやすい形です。"}
            </p>
            {analysis.gravityBias < BASELINE.biasMean &&
            (analysis.chaosIndex >= BASELINE.chaosMean || analysis.coupScore > 0) ? (
              <p className="mt-2 text-sm text-hot">
                重心の均衡と、ラインの拮抗か下剋上が同時に出ています。この重なりは万車券に寄りやすい形です。
              </p>
            ) : null}
          </section>

          <CosmosPanel analysis={analysis} />

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <h2 className="text-sm font-medium text-gold">印の重り</h2>
            <p className="mt-1 text-sm text-muted">円周の各車番に乗せている質量です。</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-xs text-faint">
                  <tr>
                    <th className="py-1 font-medium">車</th>
                    <th className="font-medium">選手</th>
                    <th className="font-medium">ライン</th>
                    <th className="font-medium">元</th>
                    <th className="font-medium">変換</th>
                    <th className="font-medium">重み</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.entries.map((e) => (
                    <tr key={e.car} className="border-t border-line">
                      <td className="py-1.5"><CarNo car={e.car} /></td>
                      <td>{e.name}</td>
                      <td className="text-cyan">{e.lineLabel}</td>
                      <td className="font-mono">{e.rawMark}</td>
                      <td className="font-mono text-gold">{e.mark}</td>
                      <td className="font-mono">{scoreOf(e.mark).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <h2 className="text-sm font-medium text-gold">理論の重み</h2>
            <ul className="mt-3 space-y-3">
              {[
                ["不協和", model.weights[0], BASELINE.dissonanceMean, "bg-cyan"],
                ["カオス", model.weights[1], BASELINE.chaosMean, "bg-warm"],
                ["DNA", model.weights[2], 1, "bg-cool"],
                ["下剋上", model.weights[3], 0.36, "bg-hot"],
                ["重心", model.weights[4], BASELINE.biasMean, "bg-gold"],
              ].map(([label, weight, base, bar]) => (
                <li key={String(label)}>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="text-muted">{label}（基準 {base}）</span>
                    <span className="text-gold">+{Number(weight).toFixed(3)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
                    <div className={`h-full ${String(bar)}`} style={{ width: `${Math.min(100, Number(weight) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
            <h2 className="text-sm font-medium text-gold">配当帯の基準</h2>
            <p className="mt-1 text-sm text-muted">今のレースは不協和 {analysis.dissonance}、カオス {analysis.chaosIndex}、重心 {analysis.gravityBias}。</p>
            <div className="mt-3 flex flex-col gap-2">
              {PAYOUT_TIERS.map((tier) => (
                <div key={tier.name} className="rounded-xl bg-subtle px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm text-fg">{tier.name}</p>
                    <p className="font-mono text-xs text-gold">{tier.share}</p>
                  </div>
                  <p className="font-mono text-xs text-faint">{tier.range}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    不協和 {tier.dissonance} / カオス {tier.chaos} / 下剋上 {tier.coup} / 重心 {tier.bias}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">登録レース</h2>
          <span className="font-mono text-xs text-faint">{races.length}</span>
        </div>
        {races.length ? (
          <div className="mt-3 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {races.map((r, i) => {
              const done = Boolean(r.payout || r.resultOrder);
              return (
                <button
                  key={`${r.id}-${i}`}
                  type="button"
                  className={`${press(`stock-${i}`)} flex min-h-11 items-center justify-between gap-2 rounded-xl border px-2 text-left text-xs ${
                    i === index ? "border-line-strong bg-subtle text-fg" : "border-line text-muted"
                  }`}
                  onClick={() => {
                    mark(`stock-${i}`);
                    setIndex(i);
                  }}
                >
                  <span className="truncate">{r.id}</span>
                  <span className="shrink-0 font-mono">{done ? (r.payout ? `${r.payout}円` : "済") : "結果待ち"}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">リストは空です。</p>
        )}
      </section>

      <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
        <h2 className="text-sm font-medium text-fg">結果登録</h2>
        <p className="mt-1 text-xs text-faint">対象 {race ? race.id : "なし"}</p>
        <label className="mt-3 block text-xs text-faint">
          着順
          <input
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="4-1-7"
            className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono text-sm text-fg"
          />
        </label>
        <label className="mt-3 block text-xs text-faint">
          3連単配当（円）
          <input
            value={payout}
            onChange={(e) => setPayout(e.target.value)}
            inputMode="numeric"
            placeholder="12500"
            className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono text-sm text-fg"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`${press("save")} flex min-h-11 items-center justify-center gap-1 rounded-xl bg-accent text-sm font-medium text-accent-fg`}
            onClick={() => {
              mark("save");
              saveResult();
            }}
          >
            <Save size={16} />
            この結果を保存
          </button>
          <button
            type="button"
            className={`${press("train")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`}
            onClick={() => {
              mark("train");
              const labeled = races.filter((r) => r.payout && r.payout > 0);
              if (!labeled.length) {
                toast("配当付きレースを登録すると学習できます");
                return;
              }
              setModel(trainOnRaces(races, model));
              toast(`${labeled.length}レースの結果から重みを更新しました`);
            }}
          >
            <GraduationCap size={16} />
            結果で学習
          </button>
          <button
            type="button"
            className={`${press("cal")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`}
            onClick={() => {
              mark("cal");
              setModel(calibrate70(model));
              toast("万車券基準を70%に合わせました");
            }}
          >
            <Target size={16} />
            万車券70%基準
          </button>
          <button
            type="button"
            className={`${press("csv")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`}
            onClick={() => {
              mark("csv");
              if (!races.length) {
                toast("出力するレースがありません");
                return;
              }
              exportCsv();
            }}
          >
            <Download size={16} />
            CSV出力
          </button>
        </div>
      </section>
    </main>
  );
}
