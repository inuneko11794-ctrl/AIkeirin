import { useEffect, useRef, useState } from "react";
import { scoreOf } from "@/lib/keirin/engine";
import type { Analysis } from "@/lib/keirin/types";
import { carFace, NOTE_FREQ, NOTE_NAMES } from "@/lib/keirin/visual";

function frameSize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const bw = Math.max(1, Math.floor(w * dpr));
  const bh = Math.max(1, Math.floor(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { w, h };
}

function watchCanvas(canvas: HTMLCanvasElement, draw: (t: number) => void) {
  let frame = 0;
  let visible = true;
  const loop = (t: number) => {
    frame = 0;
    if (!visible) return;
    draw(t);
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (!frame) frame = requestAnimationFrame(loop);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  observer.observe(canvas);
  start();
  return () => {
    visible = false;
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}

type Props = { analysis: Analysis };

export function GravityStage({ analysis }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const entries = analysis.entries;
  const gravity = analysis.gravity;
  const bias = analysis.gravityBias;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (t: number) => {
      const { w, h } = frameSize(canvas, ctx);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.34;
      const n = Math.max(entries.length, 1);
      const balanced = bias < 0.238;
      const pulse = reduce ? 1 : 1 + Math.sin(t / 700) * 0.04;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(228,195,106,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.arc(cx, cy, radius * 0.238, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(62,224,197,0.55)";
      ctx.stroke();
      ctx.setLineDash([]);

      const pts = entries.map((e, i) => {
        const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
        return {
          e,
          ang,
          x: cx + Math.cos(ang) * radius,
          y: cy + Math.sin(ang) * radius,
        };
      });

      if (pts.length >= 3) {
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.strokeStyle = "rgba(126,200,255,0.55)";
        ctx.stroke();
      }

      const gx = cx + gravity.x * radius;
      const gy = cy + gravity.y * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.strokeStyle = balanced ? "rgba(62,224,197,0.95)" : "rgba(228,195,106,0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(246,243,234,0.8)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx, gy, (balanced ? 5 : 7) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = balanced ? "#3ee0c5" : "#e4c36a";
      ctx.fill();

      pts.forEach((p) => {
        const face = carFace(p.e.car);
        const rad = 7 + Math.min(9, p.e.weight * 1.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = face.bg;
        ctx.fill();
        ctx.fillStyle = face.fg;
        ctx.font = "600 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(p.e.car), p.x, p.y + 0.5);
        ctx.fillStyle = "#e4c36a";
        ctx.font = "12px sans-serif";
        ctx.fillText(p.e.mark, cx + Math.cos(p.ang) * (radius + 18), cy + Math.sin(p.ang) * (radius + 18));
      });
    };
    return watchCanvas(canvas, draw);
  }, [entries, gravity.x, gravity.y, bias]);

  return <canvas ref={ref} className="h-72 w-full" aria-label="車番ポリゴン。円周上の車番と重心" />;
}

export function LineDrift({ analysis }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lines = analysis.lineSummaryList;
  const chaos = analysis.chaosIndex;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (t: number) => {
      const { w, h } = frameSize(canvas, ctx);

      const cx = w / 2;
      const cy = h / 2;
      const systems = lines.filter((line) => !line.isTanki);
      const comets = lines.filter((line) => line.isTanki);
      const masses = systems.map((line) => line.members.reduce((sum, m) => sum + scoreOf(m.convertedMark), 0));
      const maxMass = Math.max(...masses, 1);
      const wild = chaos >= 6.55;
      const spin = reduce ? 0.4 : t * (wild ? 0.00035 : 0.00016);
      const orbit = Math.min(w, h) * (wild ? 0.3 : 0.26);

      systems.forEach((line, li) => {
        const ang = (Math.PI * 2 * li) / Math.max(systems.length, 1) + spin;
        const wobble = wild ? Math.sin(t / 500 + li) * 16 : 0;
        const lx = cx + Math.cos(ang) * orbit + wobble;
        const ly = cy + Math.sin(ang) * orbit * 0.72;
        const mass = masses[li] ?? 1;
        const glow = 16 + (mass / maxMass) * 26;
        const grd = ctx.createRadialGradient(lx, ly, 2, lx, ly, glow);
        grd.addColorStop(0, "rgba(228,195,106,0.28)");
        grd.addColorStop(1, "rgba(228,195,106,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(lx, ly, glow, 0, Math.PI * 2);
        ctx.fill();

        const s1 = scoreOf(line.members[0]?.convertedMark ?? "");
        const s2 = line.members[1] ? scoreOf(line.members[1].convertedMark) : 0;
        const coup = line.members.length >= 2 && s2 > s1;
        const tear = line.members.length >= 2 && s1 - s2 >= 2;
        const placed = line.members.map((m, mi) => {
          const spread = (mi - (line.members.length - 1) / 2) * 24;
          let x = lx + Math.cos(ang + Math.PI / 2) * spread;
          let y = ly + Math.sin(ang + Math.PI / 2) * spread;
          if (coup && mi === 1) {
            x -= Math.cos(ang + Math.PI / 2) * 12;
            y -= Math.sin(ang + Math.PI / 2) * 12;
          }
          if (tear && mi > 0) {
            x += Math.cos(ang) * 16;
            y += Math.sin(ang) * 16;
          }
          return { m, x, y };
        });

        placed.forEach((p, mi) => {
          if (mi === 0) return;
          const prev = placed[mi - 1];
          ctx.beginPath();
          ctx.setLineDash(tear ? [3, 4] : []);
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = coup ? "rgba(255,93,115,0.9)" : tear ? "rgba(240,163,94,0.9)" : "rgba(228,195,106,0.75)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
        });

        placed.forEach((p) => {
          const face = carFace(p.m.car);
          const rad = 6 + Math.min(8, scoreOf(p.m.convertedMark));
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = face.bg;
          ctx.fill();
          ctx.fillStyle = face.fg;
          ctx.font = "600 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(p.m.car), p.x, p.y + 0.5);
        });
      });

      comets.forEach((line, ci) => {
        const m = line.members[0];
        if (!m) return;
        const speed = reduce ? ci : t * 0.0016 + ci * 1.3;
        const a = Math.min(w, h) * 0.4;
        const b = a * 0.42;
        const x = cx + Math.cos(speed) * a;
        const y = cy + Math.sin(speed) * b;
        const tx = x - Math.cos(speed) * 22;
        const ty = y - Math.sin(speed) * 12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = "rgba(126,200,255,0.75)";
        ctx.stroke();
        const face = carFace(m.car);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = face.bg;
        ctx.fill();
        ctx.fillStyle = face.fg;
        ctx.font = "600 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(m.car), x, y + 0.5);
      });
    };
    return watchCanvas(canvas, draw);
  }, [lines, chaos]);

  return <canvas ref={ref} className="h-64 w-full" aria-label="ライン重力。連星と単騎の彗星" />;
}

function toneAt(car: number, mark: string, when: number, duration: number) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = NOTE_FREQ[(car - 1) % 9];
  const vol = Math.min(0.18, 0.04 + scoreOf(mark) * 0.025);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + duration + 0.05);
  osc.onended = () => void ctx.close();
}

export function Sonify({ analysis }: Props) {
  const [loop, setLoop] = useState(false);
  const loopRef = useRef<number | null>(null);
  const max = 5;

  useEffect(() => {
    return () => {
      if (loopRef.current) window.clearInterval(loopRef.current);
    };
  }, []);

  const playOnce = () => {
    analysis.entries.forEach((e, i) => toneAt(e.car, e.mark, i * 0.12, 0.45));
  };

  const toggleLoop = () => {
    if (loopRef.current) {
      window.clearInterval(loopRef.current);
      loopRef.current = null;
      setLoop(false);
      return;
    }
    playOnce();
    loopRef.current = window.setInterval(playOnce, 1600);
    setLoop(true);
  };

  const saveWav = async () => {
    const duration = 0.2 + analysis.entries.length * 0.12 + 0.5;
    const rate = 44100;
    const offline = new OfflineAudioContext(1, Math.ceil(rate * duration), rate);
    analysis.entries.forEach((e, i) => {
      const osc = offline.createOscillator();
      const gain = offline.createGain();
      osc.type = "triangle";
      osc.frequency.value = NOTE_FREQ[(e.car - 1) % 9];
      const start = i * 0.12;
      const vol = Math.min(0.4, 0.08 + scoreOf(e.mark) * 0.06);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
      osc.connect(gain).connect(offline.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const write = (offset: number, text: string) => {
      for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
    };
    write(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, i) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
    a.download = "keirin-chord.wav";
    a.click();
  };

  const chord =
    analysis.dissonance > 4.1 ? "基準超え。不協和が強いほど高配当の予兆です。" : "基準以下。協和寄りの安定した響きです。";

  return (
    <div>
      <div className="mt-3 flex h-28 items-end gap-1.5">
        {analysis.entries.map((e) => {
          const face = carFace(e.car);
          const h = Math.max(8, (scoreOf(e.mark) / max) * 100);
          return (
            <div key={e.car} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className="note-bar w-full rounded-t-md"
                  style={{ height: `${h}%`, background: face.bg }}
                />
              </div>
              <span className="font-mono text-[10px] text-faint">
                {e.car}:{NOTE_NAMES[(e.car - 1) % 9]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-gold">{chord}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="pressable min-h-11 rounded-xl bg-cyan text-sm font-medium text-accent-fg" onClick={playOnce}>
          単発再生
        </button>
        <button
          type="button"
          className={`pressable min-h-11 rounded-xl text-sm font-medium ${loop ? "bg-hot text-fg" : "bg-gold text-accent-fg"}`}
          onClick={toggleLoop}
        >
          {loop ? "ループ停止" : "不協和ループ"}
        </button>
        <button
          type="button"
          className="pressable col-span-2 min-h-11 rounded-xl border border-line text-sm text-fg"
          onClick={() => void saveWav()}
        >
          曲をWAV保存
        </button>
      </div>
    </div>
  );
}
