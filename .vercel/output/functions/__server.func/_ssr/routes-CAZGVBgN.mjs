import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as GraduationCap, c as ChevronRight, i as Save, l as ChevronLeft, n as Target, o as FolderOpen, r as Shuffle, s as Download } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CAZGVBgN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BASELINE = {
	dissonanceMean: 4.1,
	chaosMean: 6.55,
	biasMean: .238,
	weights: [
		.58,
		.49,
		.28,
		.62,
		.46
	],
	bias: -.48
};
var SCORES = {
	"◎": 5,
	"⑳": 4.5,
	"◯": 4,
	"●": 4,
	"△": 3,
	"▲": 2.8,
	"✕": 2.2,
	"✖": 1.8,
	T: 2,
	"☆": 1.2,
	"★": .9,
	星: .6,
	無: .2
};
var SPECIAL = {
	"◎": "⑳",
	"◯": "●",
	"△": "▲",
	"✕": "✖"
};
var CIRCLED = [
	"①",
	"②",
	"③",
	"④",
	"⑤",
	"⑥",
	"⑦",
	"⑧",
	"⑨"
];
function scoreOf(mark) {
	return SCORES[mark.trim()] ?? .5;
}
function normalizeRawMark(raw) {
	if (!raw) return "無";
	const s = String(raw).trim();
	if (["本命", "◎"].includes(s)) return "◎";
	if ([
		"対抗",
		"◯",
		"○"
	].includes(s)) return "◯";
	if (["単穴", "△"].includes(s)) return "△";
	if ([
		"連下",
		"✕",
		"×"
	].includes(s)) return "✕";
	if ([
		"-",
		"－",
		"無",
		""
	].includes(s)) return "無";
	return s;
}
function parseFormationString(rawStr, entries) {
	if (!rawStr.trim()) return entries.map((e) => [String(e.car)]);
	const brackets = rawStr.match(/\[[^\]]+\]/g);
	if (brackets) {
		const groups = brackets.map((b) => b.match(/\d/g) ?? []).filter((g) => g.length);
		if (groups.length) return groups;
	}
	return rawStr.split(/[\s\-/・,]+/).map((g) => g.match(/\d/g) ?? []).filter((g) => g.length);
}
function convertLine(rawMarks) {
	const conv = [...rawMarks];
	let i = 0;
	while (i < rawMarks.length) {
		if (rawMarks[i] !== "無") {
			i += 1;
			continue;
		}
		let len = 1;
		while (i + len < rawMarks.length && rawMarks[i + len] === "無") len += 1;
		if (len >= 3) {
			const seq = [
				"☆",
				"★",
				"星"
			];
			for (let k = 0; k < len; k += 1) conv[i + k] = seq[k] ?? "星";
		} else if (len === 2) {
			conv[i] = "☆";
			conv[i + 1] = "★";
		}
		i += len;
	}
	for (let idx = 0; idx < rawMarks.length; idx += 1) {
		const special = SPECIAL[rawMarks[idx]];
		if (!special) continue;
		if (idx > 0 && rawMarks[idx - 1] === "無" && conv[idx - 1] === "無") conv[idx - 1] = special;
		if (idx < rawMarks.length - 1 && rawMarks[idx + 1] === "無" && conv[idx + 1] === "無") {
			const leftUsed = idx > 0 && rawMarks[idx - 1] === "無" && conv[idx - 1] === special;
			conv[idx + 1] = leftUsed ? "☆" : special;
		}
	}
	for (let idx = 0; idx < conv.length; idx += 1) if (rawMarks[idx] === "無" && conv[idx] === "無") conv[idx] = "☆";
	return conv;
}
function applyLineAndMarkRules(race) {
	const carToEntry = {};
	race.entries.forEach((e) => {
		carToEntry[e.car] = e;
	});
	const groups = race.girls || !race.lines.length ? race.entries.map((e) => [String(e.car)]) : race.lines;
	let lineCounter = 0;
	const lineSummaryList = [];
	const carMeta = {};
	const pushTanki = (car) => {
		const entry = carToEntry[car];
		if (!entry) return;
		const rawM = normalizeRawMark(entry.rawMark);
		const converted = rawM === "無" ? "T" : rawM;
		carMeta[car] = {
			lineLabel: "単騎",
			isTanki: true,
			rawMark: rawM,
			convertedMark: converted
		};
		lineSummaryList.push({
			label: "単騎",
			isTanki: true,
			members: [{
				car,
				name: entry.name,
				rawMark: rawM,
				convertedMark: converted
			}]
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
		const convMarks = convertLine(rawMarks);
		const members = cars.map((c, idx) => {
			carMeta[c] = {
				lineLabel: label,
				isTanki: false,
				rawMark: rawMarks[idx],
				convertedMark: convMarks[idx]
			};
			return {
				car: c,
				name: carToEntry[c].name,
				rawMark: rawMarks[idx],
				convertedMark: convMarks[idx]
			};
		});
		lineSummaryList.push({
			label,
			isTanki: false,
			members
		});
	});
	race.entries.forEach((e) => {
		if (!carMeta[e.car]) pushTanki(e.car);
	});
	return {
		carMeta,
		lineSummaryList
	};
}
function analyzeRace(race) {
	const { carMeta, lineSummaryList } = applyLineAndMarkRules(race);
	const entries = [...race.entries].sort((a, b) => a.car - b.car).map((e) => ({
		...e,
		rawMark: carMeta[e.car].rawMark,
		mark: carMeta[e.car].convertedMark,
		lineLabel: carMeta[e.car].lineLabel,
		isTanki: carMeta[e.car].isTanki
	}));
	const scores = entries.map((e) => scoreOf(e.mark));
	const numCars = entries.length || 1;
	const semitones = [
		0,
		2,
		4,
		5,
		7,
		9,
		11,
		12,
		14
	];
	const notes = scores.map((s, i) => ({
		s,
		i
	})).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.i).map((i) => semitones[(entries[i].car - 1) % 9]).sort((a, b) => a - b);
	let dissonance = 0;
	for (let j = 0; j < notes.length - 1; j += 1) {
		const iv = notes[j + 1] - notes[j];
		dissonance += [
			1,
			6,
			11
		].includes(iv) ? 3 : [2, 10].includes(iv) ? 1.5 : .5;
	}
	let tanKiCount = 0;
	const masses = lineSummaryList.map((l) => {
		if (l.isTanki) tanKiCount += 1;
		return l.members.reduce((sum, m) => sum + scoreOf(m.convertedMark), 0);
	});
	const meanM = masses.reduce((a, b) => a + b, 0) / (masses.length || 1);
	const chaosIndex = 10 / (Math.sqrt(masses.reduce((a, b) => a + (b - meanM) ** 2, 0) / (masses.length || 1)) + 1) + tanKiCount * 1.5;
	const raceDna = `${numCars}C-L${lineSummaryList.filter((l) => !l.isTanki).map((l) => l.members.length).join("") + (tanKiCount > 0 ? `T${tanKiCount}` : "")}-[${entries.map((e) => e.mark).join("")}]`;
	let coupScore = 0;
	let abandonScore = 0;
	const dramaDetails = [];
	lineSummaryList.forEach((l) => {
		if (l.isTanki || l.members.length < 2) return;
		const s1 = scoreOf(l.members[0].convertedMark);
		const s2 = scoreOf(l.members[1].convertedMark);
		const str = l.members.map((m) => `${m.car}(${m.convertedMark})`).join("-");
		if (s2 > s1) {
			coupScore += +(s2 - s1).toFixed(1);
			dramaDetails.push(`${l.label} 下剋上気配 [${str}]`);
		} else if (s1 - s2 >= 2) {
			abandonScore += +(s1 - s2).toFixed(1);
			dramaDetails.push(`${l.label} ちぎれ注意 [${str}]`);
		} else dramaDetails.push(`${l.label} 安定結束 [${str}]`);
	});
	const totalW = scores.reduce((a, b) => a + b, 0) || 1;
	let gx = 0;
	let gy = 0;
	entries.forEach((_e, i) => {
		const ang = 2 * Math.PI * i / numCars - Math.PI / 2;
		gx += scores[i] * Math.cos(ang);
		gy += scores[i] * Math.sin(ang);
	});
	const gravityBias = Math.sqrt((gx / totalW) ** 2 + (gy / totalW) ** 2);
	return {
		entries,
		lineSummaryList,
		dissonance: +dissonance.toFixed(2),
		chaosIndex: +chaosIndex.toFixed(2),
		raceDna,
		coupScore: +coupScore.toFixed(2),
		abandonScore: +abandonScore.toFixed(2),
		dramaDetails,
		gravityBias: +gravityBias.toFixed(3)
	};
}
function extractFeatures(res) {
	return [
		Math.min(1.5, res.dissonance / (BASELINE.dissonanceMean * 1.5)),
		Math.min(1.5, res.chaosIndex / (BASELINE.chaosMean * 1.8)),
		.65,
		Math.min(1.5, (res.coupScore + res.abandonScore) / 4.5),
		Math.max(0, 1 - res.gravityBias / (BASELINE.biasMean * 2.4))
	];
}
function predictUpset(features, model) {
	let z = model.bias;
	for (let i = 0; i < 5; i += 1) z += features[i] * model.weights[i];
	return 1 / (1 + Math.exp(-z));
}
function verdictOf(prob) {
	if (prob >= 65) return {
		headline: "かなり荒れそう",
		tone: "hot"
	};
	if (prob >= 52) return {
		headline: "やや波乱気配",
		tone: "warm"
	};
	if (prob >= 40) return {
		headline: "互角・標準",
		tone: "calm"
	};
	return {
		headline: "堅め・本命寄り",
		tone: "cool"
	};
}
function defaultModel() {
	return {
		weights: [...BASELINE.weights],
		bias: BASELINE.bias
	};
}
function calibrate70(model) {
	const bias = +(Math.log(.7 / .3) - [
		.85,
		.82,
		.65,
		.72,
		.78
	].reduce((s, v, i) => s + v * model.weights[i], 0)).toFixed(4);
	return {
		...model,
		bias
	};
}
function trainOnRaces(races, model) {
	const labeled = races.filter((r) => r.payout && r.payout > 0);
	if (!labeled.length) return model;
	const next = {
		weights: [...model.weights],
		bias: model.bias
	};
	for (let ep = 0; ep < 150; ep += 1) labeled.forEach((r) => {
		const x = extractFeatures(analyzeRace(r));
		const y = Number(r.payout) >= 1e4 ? 1 : 0;
		const err = predictUpset(x, next) - y;
		for (let i = 0; i < 5; i += 1) next.weights[i] -= .05 * err * x[i];
		next.bias -= .05 * err;
	});
	return next;
}
var CAR_FACE = [
	{
		bg: "#f5f5f4",
		fg: "#141414"
	},
	{
		bg: "#171717",
		fg: "#fafafa"
	},
	{
		bg: "#e11d48",
		fg: "#fff7f8"
	},
	{
		bg: "#2563eb",
		fg: "#f8fafc"
	},
	{
		bg: "#eab308",
		fg: "#1c1403"
	},
	{
		bg: "#16a34a",
		fg: "#f0fdf4"
	},
	{
		bg: "#ea580c",
		fg: "#fff7ed"
	},
	{
		bg: "#db2777",
		fg: "#fdf2f8"
	},
	{
		bg: "#7c3aed",
		fg: "#f5f3ff"
	}
];
var NOTE_NAMES = [
	"ド",
	"レ",
	"ミ",
	"ファ",
	"ソ",
	"ラ",
	"シ",
	"ド",
	"レ"
];
var NOTE_FREQ = [
	261.63,
	293.66,
	329.63,
	349.23,
	392,
	440,
	493.88,
	523.25,
	587.33
];
function carFace(car) {
	return CAR_FACE[(Math.max(1, car) - 1) % 9];
}
var PAYOUT_TIERS = [
	{
		name: "本命・堅実",
		range: "〜2,999円",
		share: "42%",
		dissonance: 3.35,
		chaos: 5.45,
		coup: "21%",
		bias: .295
	},
	{
		name: "中穴",
		range: "3,000〜9,999円",
		share: "26%",
		dissonance: 3.88,
		chaos: 6.35,
		coup: "34%",
		bias: .242
	},
	{
		name: "万車券",
		range: "10,000〜49,999円",
		share: "24%",
		dissonance: 4.45,
		chaos: 7.15,
		coup: "46%",
		bias: .205
	},
	{
		name: "大穴",
		range: "50,000円〜",
		share: "8%",
		dissonance: 5.1,
		chaos: 8.3,
		coup: "58%",
		bias: .165
	}
];
function GravityStage({ analysis }) {
	const ref = (0, import_react.useRef)(null);
	const entries = analysis.entries;
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let frame = 0;
		let alive = true;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const draw = (t) => {
			if (!alive) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			const cx = w / 2;
			const cy = h / 2;
			const radius = Math.min(w, h) * .36;
			const n = Math.max(entries.length, 1);
			const spin = reduce ? 0 : t * 15e-5;
			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI * 2);
			ctx.strokeStyle = "rgba(228,195,106,0.35)";
			ctx.lineWidth = 1;
			ctx.stroke();
			const pts = entries.map((e, i) => {
				const ang = Math.PI * 2 * i / n - Math.PI / 2 + spin;
				return {
					e,
					x: cx + Math.cos(ang) * radius,
					y: cy + Math.sin(ang) * radius,
					s: scoreOf(e.mark)
				};
			});
			const top = [...pts].sort((a, b) => b.s - a.s).slice(0, 3);
			if (top.length >= 3) {
				ctx.beginPath();
				top.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
				ctx.closePath();
				ctx.fillStyle = "rgba(62,224,197,0.16)";
				ctx.strokeStyle = "rgba(62,224,197,0.85)";
				ctx.lineWidth = 1.5;
				ctx.fill();
				ctx.stroke();
			}
			let wx = 0;
			let wy = 0;
			let wt = 0;
			pts.forEach((p) => {
				wx += p.x * p.s;
				wy += p.y * p.s;
				wt += p.s;
			});
			const gx = wx / (wt || 1);
			const gy = wy / (wt || 1);
			ctx.beginPath();
			ctx.arc(gx, gy, 7, 0, Math.PI * 2);
			ctx.fillStyle = "#e4c36a";
			ctx.fill();
			pts.forEach((p) => {
				const face = carFace(p.e.car);
				ctx.beginPath();
				ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
				ctx.fillStyle = face.bg;
				ctx.fill();
				ctx.fillStyle = face.fg;
				ctx.font = "600 12px IBM Plex Sans, sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(String(p.e.car), p.x, p.y + .5);
			});
			frame = requestAnimationFrame(draw);
		};
		frame = requestAnimationFrame(draw);
		return () => {
			alive = false;
			cancelAnimationFrame(frame);
		};
	}, [entries]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "h-64 w-full",
		"aria-label": "車番ポリゴン"
	});
}
function LineDrift({ analysis }) {
	const ref = (0, import_react.useRef)(null);
	const lines = analysis.lineSummaryList;
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let frame = 0;
		let alive = true;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const draw = (t) => {
			if (!alive) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			const cx = w / 2;
			const cy = h / 2;
			const orbit = Math.min(w, h) * .28;
			const spin = reduce ? 0 : t * 12e-5;
			lines.forEach((line, li) => {
				const ang = Math.PI * 2 * li / Math.max(lines.length, 1) + spin;
				const lx = cx + Math.cos(ang) * orbit * (line.isTanki ? 1.15 : .72);
				const ly = cy + Math.sin(ang) * orbit * .72;
				line.members.forEach((m, mi) => {
					const spread = (mi - (line.members.length - 1) / 2) * 18;
					const x = lx + Math.cos(ang + Math.PI / 2) * spread;
					const y = ly + Math.sin(ang + Math.PI / 2) * spread;
					const face = carFace(m.car);
					ctx.beginPath();
					ctx.arc(x, y, 12, 0, Math.PI * 2);
					ctx.fillStyle = face.bg;
					ctx.fill();
					if (!line.isTanki && mi > 0) {
						const ps = (mi - 1 - (line.members.length - 1) / 2) * 18;
						ctx.beginPath();
						ctx.moveTo(lx + Math.cos(ang + Math.PI / 2) * ps, ly + Math.sin(ang + Math.PI / 2) * ps);
						ctx.lineTo(x, y);
						ctx.strokeStyle = "rgba(228,195,106,0.7)";
						ctx.stroke();
					}
					ctx.fillStyle = face.fg;
					ctx.font = "600 11px IBM Plex Sans, sans-serif";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(String(m.car), x, y + .5);
				});
			});
			frame = requestAnimationFrame(draw);
		};
		frame = requestAnimationFrame(draw);
		return () => {
			alive = false;
			cancelAnimationFrame(frame);
		};
	}, [lines]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "h-56 w-full",
		"aria-label": "ライン重力"
	});
}
function toneAt(car, mark, when, duration) {
	const ctx = new AudioContext();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "triangle";
	osc.frequency.value = NOTE_FREQ[(car - 1) % 9];
	const vol = Math.min(.18, .04 + scoreOf(mark) * .025);
	gain.gain.setValueAtTime(1e-4, ctx.currentTime + when);
	gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + when + .03);
	gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + when + duration);
	osc.connect(gain).connect(ctx.destination);
	osc.start(ctx.currentTime + when);
	osc.stop(ctx.currentTime + when + duration + .05);
	osc.onended = () => void ctx.close();
}
function Sonify({ analysis }) {
	const [loop, setLoop] = (0, import_react.useState)(false);
	const loopRef = (0, import_react.useRef)(null);
	const max = 5;
	(0, import_react.useEffect)(() => {
		return () => {
			if (loopRef.current) window.clearInterval(loopRef.current);
		};
	}, []);
	const playOnce = () => {
		analysis.entries.forEach((e, i) => toneAt(e.car, e.mark, i * .12, .45));
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
		const duration = .2 + analysis.entries.length * .12 + .5;
		const rate = 44100;
		const offline = new OfflineAudioContext(1, Math.ceil(rate * duration), rate);
		analysis.entries.forEach((e, i) => {
			const osc = offline.createOscillator();
			const gain = offline.createGain();
			osc.type = "triangle";
			osc.frequency.value = NOTE_FREQ[(e.car - 1) % 9];
			const start = i * .12;
			const vol = Math.min(.4, .08 + scoreOf(e.mark) * .06);
			gain.gain.setValueAtTime(1e-4, start);
			gain.gain.exponentialRampToValueAtTime(vol, start + .02);
			gain.gain.exponentialRampToValueAtTime(1e-4, start + .42);
			osc.connect(gain).connect(offline.destination);
			osc.start(start);
			osc.stop(start + .5);
		});
		const samples = (await offline.startRendering()).getChannelData(0);
		const buffer = /* @__PURE__ */ new ArrayBuffer(44 + samples.length * 2);
		const view = new DataView(buffer);
		const write = (offset, text) => {
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
			view.setInt16(44 + i * 2, clamped < 0 ? clamped * 32768 : clamped * 32767, true);
		});
		const a = document.createElement("a");
		a.href = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
		a.download = "keirin-chord.wav";
		a.click();
	};
	const chord = analysis.dissonance > 4.1 ? "基準超え。不協和が強いほど高配当の予兆です。" : "基準以下。協和寄りの安定した響きです。";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 flex h-28 items-end gap-1.5",
			children: analysis.entries.map((e) => {
				const face = carFace(e.car);
				const h = Math.max(8, scoreOf(e.mark) / max * 100);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 flex-col items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-24 w-full items-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "note-bar w-full rounded-t-md",
							style: {
								height: `${h}%`,
								background: face.bg
							}
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-[10px] text-faint",
						children: [
							e.car,
							":",
							NOTE_NAMES[(e.car - 1) % 9]
						]
					})]
				}, e.car);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-gold",
			children: chord
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-2 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pressable min-h-11 rounded-xl bg-cyan text-sm font-medium text-accent-fg",
					onClick: playOnce,
					children: "単発再生"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `pressable min-h-11 rounded-xl text-sm font-medium ${loop ? "bg-hot text-fg" : "bg-gold text-accent-fg"}`,
					onClick: toggleLoop,
					children: loop ? "ループ停止" : "不協和ループ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pressable col-span-2 min-h-11 rounded-xl border border-line text-sm text-fg",
					onClick: () => void saveWav(),
					children: "曲をWAV保存"
				})
			]
		})
	] });
}
var STEP = .12;
function emptyLedger() {
	return {
		marks: {},
		roles: {},
		lines: {},
		cars: {},
		applied: {},
		last: null
	};
}
function normalizeLedger(value) {
	return {
		marks: value?.marks ?? {},
		roles: value?.roles ?? {},
		lines: value?.lines ?? {},
		cars: value?.cars ?? {},
		applied: value?.applied ?? {},
		last: value?.last ?? null
	};
}
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, +n.toFixed(3)));
}
function read(table, key, seed) {
	return table[key] ?? seed;
}
function atomsOf(analysis, ledger) {
	return analysis.lineSummaryList.flatMap((line) => {
		const lineKey = line.members.map((m) => m.convertedMark).join("");
		return line.members.map((m, index) => {
			const role = line.isTanki ? "単騎" : index === 0 ? "先頭" : index === 1 ? "番手" : `${index + 1}番手`;
			const markScore = read(ledger.marks, m.convertedMark, scoreOf(m.convertedMark));
			const roleScore = read(ledger.roles, `${role}:${m.convertedMark}`, 0);
			const carScore = read(ledger.cars, `${m.car}:${m.convertedMark}`, 0);
			const lineScore = read(ledger.lines, lineKey, 0) / line.members.length;
			return {
				car: m.car,
				mark: m.convertedMark,
				role,
				lineKey,
				power: markScore + roleScore + carScore + lineScore
			};
		});
	});
}
function rankRace(race, ledger) {
	const analysis = analyzeRace(race);
	return {
		analysis,
		atoms: atomsOf(analysis, ledger).sort((a, b) => b.power - a.power || a.car - b.car)
	};
}
function parseOrder(order) {
	return order.split(/[^0-9]+/).map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= 9);
}
function undo(ledger, raceId) {
	const prev = ledger.applied[raceId];
	if (!prev) return;
	prev.forEach((d) => {
		const table = ledger[d.bucket];
		const seed = d.bucket === "marks" ? scoreOf(d.key) : 0;
		table[d.key] = clamp(read(table, d.key, seed) - d.delta, d.bucket === "marks" ? .05 : -3, d.bucket === "marks" ? 8 : 3);
	});
	delete ledger.applied[raceId];
}
function learnFromResult(race, order, source) {
	const ledger = normalizeLedger(structuredClone(source));
	undo(ledger, race.id);
	const actualCars = parseOrder(order);
	const { atoms } = rankRace(race, ledger);
	const predicted = atoms.map((a) => a.car).join("-");
	if (!actualCars.length) return {
		ledger,
		predicted,
		actual: "",
		gap: 0,
		moves: []
	};
	const actualRank = /* @__PURE__ */ new Map();
	actualCars.forEach((car, i) => {
		if (!actualRank.has(car)) actualRank.set(car, i + 1);
	});
	const known = actualCars.length;
	const predRank = new Map(atoms.map((a, i) => [a.car, i + 1]));
	const touched = /* @__PURE__ */ new Map();
	const add = (bucket, key, delta, label) => {
		if (!delta) return;
		const id = `${bucket}:${key}`;
		const prev = touched.get(id);
		if (prev) prev.delta += delta;
		else touched.set(id, {
			bucket,
			key,
			delta,
			label
		});
	};
	const lineGaps = /* @__PURE__ */ new Map();
	let gap = 0;
	atoms.forEach((atom) => {
		const pred = predRank.get(atom.car) ?? known + 1;
		let actual = actualRank.get(atom.car) ?? null;
		if (actual == null) {
			if (pred <= known) actual = known + 1;
			else return;
		}
		const signed = pred - actual;
		gap += Math.abs(signed);
		const delta = signed * STEP;
		add("marks", atom.mark, delta, `印 ${atom.mark}`);
		add("roles", `${atom.role}:${atom.mark}`, delta * .7, `${atom.role}${atom.mark}`);
		add("cars", `${atom.car}:${atom.mark}`, delta * .8, `${atom.car}番${atom.mark}`);
		const list = lineGaps.get(atom.lineKey) ?? [];
		list.push(signed);
		lineGaps.set(atom.lineKey, list);
	});
	lineGaps.forEach((signs, key) => {
		const mean = signs.reduce((a, b) => a + b, 0) / signs.length;
		add("lines", key, mean * STEP * .6, `並び ${key}`);
	});
	const applied = [];
	const moves = [];
	touched.forEach((item) => {
		const rounded = +item.delta.toFixed(3);
		if (!rounded) return;
		const table = ledger[item.bucket];
		const seed = item.bucket === "marks" ? scoreOf(item.key) : 0;
		table[item.key] = clamp(read(table, item.key, seed) + rounded, item.bucket === "marks" ? .05 : -3, item.bucket === "marks" ? 8 : 3);
		applied.push({
			bucket: item.bucket,
			key: item.key,
			delta: rounded
		});
		moves.push({
			label: item.label,
			delta: rounded
		});
	});
	moves.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
	ledger.applied[race.id] = applied;
	const actual = actualCars.join("-");
	ledger.last = {
		raceId: race.id,
		predicted,
		actual,
		gap,
		moves: moves.slice(0, 8)
	};
	return {
		ledger,
		predicted,
		actual,
		gap,
		moves
	};
}
function listPoints(ledger) {
	const marks = Object.entries({
		...Object.fromEntries(Object.keys({
			"◎": 1,
			"⑳": 1,
			"◯": 1,
			"●": 1,
			"△": 1,
			"▲": 1,
			"✕": 1,
			"✖": 1,
			T: 1,
			"☆": 1,
			"★": 1,
			星: 1
		}).map((k) => [k, scoreOf(k)])),
		...ledger.marks
	}).map(([key, value]) => ({
		key,
		value,
		base: scoreOf(key)
	}));
	const rows = (table) => Object.entries(table).map(([key, value]) => ({
		key,
		value
	})).filter((row) => Math.abs(row.value) >= .01).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8);
	return {
		marks,
		lines: rows(ledger.lines),
		cars: rows(ledger.cars),
		roles: rows(ledger.roles)
	};
}
function parseMarkdownRaces(mdText) {
	const sections = mdText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/^#\s*競輪レースデータ[：:]/m).slice(1);
	const races = [];
	sections.forEach((sec) => {
		const title = sec.split("\n")[0]?.trim() || "無名レース";
		const rawFormation = sec.match(/並び予想\s*[|｜]\s*(\[[^\]]+\](?:\s*\[[^\]]+\])*)/)?.[1]?.trim() ?? "";
		const girls = /ガールズ|女子/.test(title) || /種別\s*[|｜]\s*[^\n]*ガールズ/.test(sec);
		const entryMap = /* @__PURE__ */ new Map();
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
			const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
			if (cells.length < 7 || !/^\d+$/.test(cells[0])) return;
			const car = parseInt(cells[0], 10);
			if (car < 1 || car > 9) return;
			entryMap.set(car, {
				car,
				name: cells[1] || `選手${car}`,
				rawMark: cells[6] || "-"
			});
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
			girls
		});
	});
	return races;
}
var KEY = "keirin-quadrivium-v1";
function loadState() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {
			races: [],
			model: defaultModel(),
			index: 0,
			ledger: emptyLedger()
		};
		const parsed = JSON.parse(raw);
		return {
			races: Array.isArray(parsed.races) ? parsed.races : [],
			model: parsed.model?.weights?.length === 5 ? parsed.model : defaultModel(),
			index: Number.isFinite(parsed.index) ? parsed.index ?? 0 : 0,
			ledger: normalizeLedger(parsed.ledger)
		};
	} catch {
		return {
			races: [],
			model: defaultModel(),
			index: 0,
			ledger: emptyLedger()
		};
	}
}
function saveState(state) {
	localStorage.setItem(KEY, JSON.stringify(state));
}
function usePress() {
	const [hit, setHit] = (0, import_react.useState)(null);
	const timer = (0, import_react.useRef)(null);
	const mark = (id) => {
		setHit(id);
		if (timer.current) window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setHit(null), 280);
	};
	return {
		hit,
		mark
	};
}
function CarNo({ car }) {
	const face = carFace(car);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-grid size-6 place-items-center rounded-md font-mono text-xs font-medium",
		style: {
			background: face.bg,
			color: face.fg
		},
		children: car
	});
}
function Lab() {
	const [races, setRaces] = (0, import_react.useState)([]);
	const [model, setModel] = (0, import_react.useState)({
		weights: [
			.58,
			.49,
			.28,
			.62,
			.46
		],
		bias: -.48
	});
	const [index, setIndex] = (0, import_react.useState)(0);
	const [notice, setNotice] = (0, import_react.useState)("");
	const [order, setOrder] = (0, import_react.useState)("");
	const [payout, setPayout] = (0, import_react.useState)("");
	const { hit, mark } = usePress();
	const fileRef = (0, import_react.useRef)(null);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [ledger, setLedger] = (0, import_react.useState)(emptyLedger);
	(0, import_react.useEffect)(() => {
		const saved = loadState();
		setRaces(saved.races);
		setModel(saved.model);
		setLedger(saved.ledger);
		setIndex(saved.races.length ? Math.min(saved.index, saved.races.length - 1) : 0);
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		saveState({
			races,
			model,
			index,
			ledger
		});
	}, [
		hydrated,
		races,
		model,
		index,
		ledger
	]);
	const race = races[index];
	const analysis = (0, import_react.useMemo)(() => race ? analyzeRace(race) : null, [race]);
	const prob = analysis ? predictUpset(extractFeatures(analysis), model) * 100 : 0;
	const verdict = verdictOf(prob);
	const ranking = (0, import_react.useMemo)(() => race ? rankRace(race, ledger) : null, [race, ledger]);
	const points = (0, import_react.useMemo)(() => listPoints(ledger), [ledger]);
	(0, import_react.useEffect)(() => {
		setOrder(race?.resultOrder ?? "");
		setPayout(race?.payout ? String(race.payout) : "");
	}, [
		race?.id,
		race?.resultOrder,
		race?.payout
	]);
	const toast = (msg) => {
		setNotice(msg);
		window.setTimeout(() => setNotice(""), 3200);
	};
	const ingest = (text, source) => {
		const next = parseMarkdownRaces(text);
		if (!next.length) {
			toast(`${source}からレースを読めませんでした`);
			return;
		}
		setRaces(next);
		setIndex(0);
		toast(`${next.length}レースを読み込みました`);
	};
	const onFile = async (file) => {
		if (!file) return;
		ingest(await file.text(), file.name);
	};
	const shift = (dir) => {
		if (!races.length) return;
		setIndex((i) => (i + dir + races.length) % races.length);
	};
	const saveResult = () => {
		if (!race) return;
		const resultOrder = order.trim();
		const nextPayout = payout.trim() ? Number(payout) : null;
		setRaces((prev) => prev.map((r, i) => i === index ? {
			...r,
			resultOrder,
			payout: nextPayout
		} : r));
		if (!resultOrder) {
			toast("結果は保存しました。着順があると点数が動きます");
			return;
		}
		const learned = learnFromResult({
			...race,
			resultOrder,
			payout: nextPayout
		}, resultOrder, ledger);
		setLedger(learned.ledger);
		const top = learned.moves.slice(0, 3).map((m) => `${m.label} ${m.delta > 0 ? "+" : ""}${m.delta.toFixed(2)}`).join(" / ");
		toast(`予想 ${learned.predicted} → 結果 ${learned.actual}${top ? `。${top}` : ""}`);
	};
	const exportCsv = () => {
		const rows = [[
			"レース",
			"車番",
			"選手",
			"元印",
			"変換印",
			"ライン",
			"並び",
			"着順",
			"配当"
		]];
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
					r.payout ? String(r.payout) : ""
				]);
			});
		});
		const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
		const a = document.createElement("a");
		a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
		a.download = "keirin-quadrivium.csv";
		a.click();
	};
	const toneClass = verdict.tone === "hot" ? "text-hot" : verdict.tone === "warm" ? "text-warm" : verdict.tone === "cool" ? "text-cool" : "text-fg";
	const press = (id) => `pressable ${hit === id ? "is-hit" : ""}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-[0.18em] text-faint",
						children: "QUADRIVIUM LAB"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-none tracking-tight text-fg",
						children: "競輪四学"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "並びと印から不協和・カオス・下剋上を見て、荒れ確率を出す。"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[28px] border border-line bg-elevated p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: ".md,.txt,.markdown,text/markdown,text/plain,*/*",
					className: "sr-only",
					onChange: (e) => {
						onFile(e.target.files?.[0]);
						e.target.value = "";
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${press("file")} flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-medium text-accent-fg`,
						onClick: () => {
							mark("file");
							fileRef.current?.click();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { size: 18 }), "ファイル読込"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${press("sample")} flex min-h-14 items-center justify-center rounded-2xl border border-line text-sm text-fg`,
						onClick: () => {
							mark("sample");
							fetch("/sample-kawasaki.md").then((r) => r.text()).then((t) => ingest(t, "サンプル")).catch(() => toast("サンプルを開けませんでした"));
						},
						children: "川崎サンプル"
					})]
				})]
			}),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 rounded-xl border border-line bg-subtle px-3 py-2 text-sm text-fg",
				role: "status",
				children: notice
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 flex min-h-11 items-center gap-1 rounded-[20px] border border-line bg-elevated p-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "前のレース",
						className: `${press("prev")} grid size-11 place-items-center rounded-xl text-fg`,
						onClick: () => {
							mark("prev");
							shift(-1);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 18 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-fg",
						value: races.length ? index : "",
						onChange: (e) => setIndex(Number(e.target.value)),
						children: [!races.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "レースなし"
						}) : null, races.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: i,
							className: "bg-elevated",
							children: [
								i + 1,
								"/",
								races.length,
								" ",
								r.id
							]
						}, `${r.id}-${i}`))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "次のレース",
						className: `${press("next")} grid size-11 place-items-center rounded-xl text-fg`,
						onClick: () => {
							mark("next");
							shift(1);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "ランダム",
						className: `${press("rand")} grid size-11 place-items-center rounded-xl text-fg`,
						onClick: () => {
							mark("rand");
							if (!races.length) {
								toast("レースがありません");
								return;
							}
							setIndex(Math.floor(Math.random() * races.length));
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { size: 16 })
					})
				]
			}),
			!race || !analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted",
				children: "まだレースがありません。出走表ファイルを読み込むと、全レースを解析できます。"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-faint",
							children: "四学診断"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex items-end justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `font-mono text-5xl tabular-nums leading-none ${toneClass}`,
								children: [prob.toFixed(1), "%"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-[11rem] pb-1 text-right text-sm font-medium text-fg",
								children: verdict.headline
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-1.5 overflow-hidden rounded-full bg-subtle",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-accent",
								style: { width: `${Math.min(100, Math.max(0, prob))}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 font-mono text-xs text-faint",
							children: ["並び ", race.rawFormation]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-sm tabular-nums text-fg",
								children: ["不協和度 ", analysis.dissonance]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: analysis.dissonance > 4.1 ? "不協和コード（波乱の響き）" : "協和コード（安定の響き）"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-sm tabular-nums text-fg",
								children: ["カオス ", analysis.chaosIndex]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"重心偏り ",
									analysis.gravityBias,
									"（",
									analysis.gravityBias < .238 ? "均衡" : "偏重",
									"）"
								]
							})] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-fg",
								children: "ラインと変換印"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-faint",
								children: [
									"下剋上 ",
									analysis.coupScore,
									" / ちぎれ ",
									analysis.abandonScore
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col gap-2",
							children: analysis.lineSummaryList.map((line, li) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-subtle px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: line.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-fg",
										children: [
											"[",
											line.members.map((m) => m.convertedMark).join(" "),
											"]"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-1",
									children: line.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex justify-between gap-3 py-1 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarNo, { car: m.car }),
												" ",
												m.name
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono text-gold",
											children: [
												m.rawMark,
												"→",
												m.convertedMark,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-2 text-faint",
													children: scoreOf(m.convertedMark).toFixed(1)
												})
											]
										})]
									}, m.car))
								})]
							}, `${line.label}-${li}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 break-all font-mono text-xs text-fg",
							children: analysis.raceDna
						}),
						analysis.dramaDetails.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1 border-t border-line pt-2 text-sm text-muted",
							children: analysis.dramaDetails.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: d }, d))
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-gold",
								children: "出走表の音楽化"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-faint",
								children: ["基準 ", BASELINE.dissonanceMean]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "車番を音階に、印の強さを音量にします。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sonify, { analysis })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-gold",
								children: "ライン重力"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-faint",
								children: [
									"カオス ",
									analysis.chaosIndex,
									" / ",
									BASELINE.chaosMean
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "同じラインは結び、単騎は外側を回ります。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineDrift, { analysis })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-gold",
								children: "車番ポリゴン"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-cyan",
								children: [
									"重心 ",
									analysis.gravityBias,
									" / ",
									BASELINE.biasMean
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GravityStage, { analysis }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-gold",
							children: analysis.gravityBias < BASELINE.biasMean ? "基準より重心が中央に寄っています。力が分散し、波乱の気配です。" : "基準より重心が偏っています。力の集中は本命寄りです。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[28rem] text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "text-xs text-faint",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-1 font-medium",
											children: "車"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "選手"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "ライン"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "元"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "変換"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "font-medium",
											children: "重み"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: analysis.entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-1.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarNo, { car: e.car })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: e.name }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-cyan",
											children: e.lineLabel
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "font-mono",
											children: e.rawMark
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "font-mono text-gold",
											children: e.mark
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "font-mono",
											children: scoreOf(e.mark).toFixed(1)
										})
									]
								}, e.car)) })]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-gold",
						children: "理論の重み"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-3",
						children: [
							[
								"不協和",
								model.weights[0],
								BASELINE.dissonanceMean,
								"bg-cyan"
							],
							[
								"カオス",
								model.weights[1],
								BASELINE.chaosMean,
								"bg-warm"
							],
							[
								"DNA",
								model.weights[2],
								1,
								"bg-cool"
							],
							[
								"下剋上",
								model.weights[3],
								.36,
								"bg-hot"
							],
							[
								"重心",
								model.weights[4],
								BASELINE.biasMean,
								"bg-gold"
							]
						].map(([label, weight, base, bar]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex justify-between font-mono text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [
									label,
									"（基準 ",
									base,
									"）"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-gold",
								children: ["+", Number(weight).toFixed(3)]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 overflow-hidden rounded-full bg-subtle",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-full ${String(bar)}`,
								style: { width: `${Math.min(100, Number(weight) * 100)}%` }
							})
						})] }, String(label)))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium text-gold",
							children: "配当帯の基準"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [
								"今のレースは不協和 ",
								analysis.dissonance,
								"、カオス ",
								analysis.chaosIndex,
								"、重心 ",
								analysis.gravityBias,
								"。"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-col gap-2",
							children: PAYOUT_TIERS.map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-subtle px-3 py-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-fg",
											children: tier.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-xs text-gold",
											children: tier.share
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-xs text-faint",
										children: tier.range
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 font-mono text-xs text-muted",
										children: [
											"不協和 ",
											tier.dissonance,
											" / カオス ",
											tier.chaos,
											" / 下剋上 ",
											tier.coup,
											" / 重心 ",
											tier.bias
										]
									})
								]
							}, tier.name))
						})
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-fg",
						children: "登録レース"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-faint",
						children: races.length
					})]
				}), races.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3",
					children: races.map((r, i) => {
						const done = Boolean(r.payout || r.resultOrder);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `${press(`stock-${i}`)} flex min-h-11 items-center justify-between gap-2 rounded-xl border px-2 text-left text-xs ${i === index ? "border-line-strong bg-subtle text-fg" : "border-line text-muted"}`,
							onClick: () => {
								mark(`stock-${i}`);
								setIndex(i);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: r.id
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 font-mono",
								children: done ? r.payout ? `${r.payout}円` : "済" : "結果待ち"
							})]
						}, `${r.id}-${i}`);
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "リストは空です。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-fg",
						children: "結果登録と点数"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-faint",
						children: ["対象 ", race ? race.id : "なし"]
					}),
					ranking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-sm text-gold",
						children: ["現在の点数順 ", ranking.atoms.map((a) => a.car).join("-")]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "着順を保存すると、予想順位と実際の着順の差で印・並び・車番の点数を増減します。同じレースの保存し直しは前回分を戻してから計算します。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block text-xs text-faint",
						children: ["着順", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: order,
							onChange: (e) => setOrder(e.target.value),
							placeholder: "4-1-7",
							className: "mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono text-sm text-fg"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block text-xs text-faint",
						children: ["3連単配当（円）", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: payout,
							onChange: (e) => setPayout(e.target.value),
							inputMode: "numeric",
							placeholder: "12500",
							className: "mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono text-sm text-fg"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${press("save")} flex min-h-11 items-center justify-center gap-1 rounded-xl bg-accent text-sm font-medium text-accent-fg`,
								onClick: () => {
									mark("save");
									saveResult();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 16 }), "この結果を保存"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${press("train")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`,
								onClick: () => {
									mark("train");
									const labeled = races.filter((r) => r.payout && r.payout > 0);
									if (!labeled.length) {
										toast("配当付きレースを登録すると学習できます");
										return;
									}
									setModel(trainOnRaces(races, model));
									toast(`${labeled.length}レースの結果から重みを更新しました`);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { size: 16 }), "結果で学習"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${press("cal")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`,
								onClick: () => {
									mark("cal");
									setModel(calibrate70(model));
									toast("万車券基準を70%に合わせました");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 16 }), "万車券70%基準"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${press("csv")} flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-sm text-fg`,
								onClick: () => {
									mark("csv");
									if (!races.length) {
										toast("出力するレースがありません");
										return;
									}
									exportCsv();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), "CSV出力"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-[28px] border border-line bg-elevated p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-gold",
						children: "増減ポイント"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "印そのものの点数と、ライン並び・車番印の補正です。結果が予想より良ければ上がり、悪ければ下がります。"
					}),
					ledger.last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-mono text-xs text-fg",
						children: [
							"直近 ",
							ledger.last.raceId,
							"　予想 ",
							ledger.last.predicted,
							"　結果 ",
							ledger.last.actual,
							"　差 ",
							ledger.last.gap
						]
					}) : null,
					ledger.last?.moves.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: ledger.last.moves.map((move) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between font-mono text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: move.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: move.delta > 0 ? "text-cyan" : "text-hot",
								children: [move.delta > 0 ? "+" : "", move.delta.toFixed(2)]
							})]
						}, move.label))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-faint",
							children: "印の点数"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 space-y-1",
							children: points.marks.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between font-mono text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.key }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-gold",
									children: [row.value.toFixed(2), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-faint",
										children: [" / ", row.base.toFixed(1)]
									})]
								})]
							}, row.key))
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-faint",
							children: "並び・車番の補正"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 space-y-1",
							children: [
								...points.lines,
								...points.cars,
								...points.roles
							].length ? [
								...points.lines.map((row) => ({
									...row,
									kind: "並び"
								})),
								...points.cars.map((row) => ({
									...row,
									kind: "車"
								})),
								...points.roles.map((row) => ({
									...row,
									kind: "位置"
								}))
							].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between font-mono text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [
										row.kind,
										" ",
										row.key
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: row.value > 0 ? "text-cyan" : "text-hot",
									children: [row.value > 0 ? "+" : "", row.value.toFixed(2)]
								})]
							}, `${row.kind}${row.key}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted",
								children: "まだ動いていません。着順を保存するとここに出ます。"
							})
						})] })]
					})
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lab, {});
}
//#endregion
export { Home as component };
