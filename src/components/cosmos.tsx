import { useMemo } from "react";
import { readCosmos } from "@/lib/keirin/cosmos";
import type { Analysis } from "@/lib/keirin/types";
import { carFace } from "@/lib/keirin/visual";

export function CosmosPanel({ analysis }: { analysis: Analysis }) {
  const reading = useMemo(() => readCosmos(analysis), [analysis]);
  const top = new Set(reading.luoshu.topCars);

  return (
    <section className="mt-4 rounded-[28px] border border-line bg-elevated p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-gold">外典</h2>
        <span className="font-mono text-xs text-faint">点灯 {reading.alerts}/5</span>
      </div>
      <p className="mt-1 text-sm text-muted">洛書、3・6・9、電荷、6174、142857。点灯が多いほど陣形が崩れています。</p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-fg">洛書</h3>
          <span className={`font-mono text-xs ${reading.luoshu.alert ? "text-hot" : "text-faint"}`}>
            |{reading.luoshu.sum}−15| = {reading.luoshu.deviation}
          </span>
        </div>
        <div className="mt-2 grid max-w-40 grid-cols-3 gap-1">
          {reading.luoshu.grid.flat().map((car) => {
            const face = carFace(car);
            const on = top.has(car);
            return (
              <div
                key={car}
                className="grid h-10 place-items-center rounded-lg font-mono text-sm"
                style={{
                  background: face.bg,
                  color: face.fg,
                  outline: on ? "2px solid #e4c36a" : "1px solid transparent",
                }}
              >
                {car}
              </div>
            );
          })}
        </div>
        <p className={`mt-2 text-sm ${reading.luoshu.alert ? "text-gold" : "text-muted"}`}>{reading.luoshu.line}</p>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-fg">3・6・9</h3>
          <span className={`font-mono text-xs ${reading.tesla.alert ? "text-hot" : "text-faint"}`}>
            物質界 {reading.tesla.material}/3
          </span>
        </div>
        <p className={`mt-2 text-sm ${reading.tesla.alert ? "text-gold" : "text-muted"}`}>{reading.tesla.line}</p>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-fg">八重項の電荷</h3>
          <span className={`font-mono text-xs ${reading.charge.alert ? "text-hot" : "text-faint"}`}>
            Q {reading.charge.total > 0 ? "+" : ""}
            {reading.charge.total.toFixed(2)}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-subtle">
          <div className="absolute top-0 left-1/2 h-full w-px bg-faint" />
          <div
            className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-gold"
            style={{ left: `${Math.min(96, Math.max(4, (reading.charge.total + 1) * 50))}%` }}
          />
        </div>
        <p className={`mt-2 text-sm ${reading.charge.alert ? "text-gold" : "text-muted"}`}>{reading.charge.line}</p>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-fg">カプレカー 6174</h3>
          <span className={`font-mono text-xs ${reading.kaprekar.alert ? "text-hot" : "text-faint"}`}>
            {reading.kaprekar.steps}手
          </span>
        </div>
        <p className={`mt-2 text-sm ${reading.kaprekar.alert ? "text-gold" : "text-muted"}`}>{reading.kaprekar.line}</p>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-fg">142857 の弦</h3>
          <span className={`font-mono text-xs ${reading.hex.alert ? "text-hot" : "text-faint"}`}>
            交差 {reading.hex.crossings}
          </span>
        </div>
        <p className={`mt-2 text-sm ${reading.hex.alert ? "text-gold" : "text-muted"}`}>{reading.hex.line}</p>
      </div>

      {reading.alerts >= 3 ? (
        <p className="mt-4 text-sm text-hot">外典が3つ以上点灯しています。陣形の崩れが重なり、万車券側に寄ります。</p>
      ) : null}
    </section>
  );
}
