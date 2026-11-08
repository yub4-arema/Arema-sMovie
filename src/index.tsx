import React from "react";
import {registerRoot, Composition, AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from "remotion";

import {C, FONT, FPS, Tone, tone, cookie} from "./theme";

type Curve = {label: string; tone?: Tone; points: number[]; dashed?: boolean};
type Diagram =
  | {type: "flow"; nodes: {text: string; tone?: Tone}[]}
  | {type: "wave"; top: string; bottom: string; curves: Curve[]}
  | {type: "tally"; rows: {label: string; count: number; tone?: Tone}[]}
  | {type: "stack"; items: {text: string; kind?: "norm" | "block" | "op" | "io"; tone?: Tone}[]; notes?: string[]}
  | {type: "pattern"; cells: string; legend: {key: string; label: string; count: number; tone: Tone}[]};
type Scene = {title: string; bullets?: string[]; big?: string; diagram?: Diagram; narration: string; subtitle?: string; face?: string; speaker: number; frames: number; speechFrames: number; audio: string; amp: number[]};
type Cast = {id: number; side: "left" | "right"};
type Props = {scenes: Scene[]; cast: Cast[]; source?: string; portraits?: Record<string, {frames?: string[]; faces?: Record<string, string>}>};

// 声ごとのオリジナルSVGキャラ設定(VOICEVOXの声に合わせた雰囲気)
const LOOK: Record<number, {name: string; hair: string; eye: string; acc: "bow" | "moon" | "bud"; sleepy?: boolean; long?: boolean; tone: Tone}> = {
  14: {name: "冥鳴ひまり", hair: "#2b2233", eye: "#9a78e8", acc: "bow", tone: "primary"},
  118: {name: "夜語トバリ", hair: "#1b1a30", eye: "#f2c94c", acc: "moon", sleepy: true, long: true, tone: "tertiary"},
  126: {name: "里石ユカ", hair: "#c78aa4", eye: "#6fb8a0", acc: "bud", tone: "secondary"},
};
const lookOf = (id: number) => LOOK[id] ?? {name: `話者${id}`, hair: "#3a3347", eye: "#d0bcff", acc: "bow" as const, tone: "secondary" as Tone};

const useSpr = (delay = 0, damping = 11, stiffness = 150) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, stiffness, mass: 0.8}});
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const blob = (x: number, y: number, s: number, c: string, ph: number): React.CSSProperties => ({
    position: "absolute", left: x + Math.sin(f / 90 + ph) * 60, top: y + Math.cos(f / 110 + ph) * 50, width: s, height: s,
    background: `radial-gradient(closest-side, ${c}, transparent)`, opacity: 0.7,
  });
  return (
    <AbsoluteFill style={{background: C.surface}}>
      <div style={blob(-200, -150, 800, C.primaryContainer, 0)} />
      <div style={blob(1250, 250, 700, C.tertiaryContainer, 2)} />
      <div style={blob(500, 700, 600, C.secondaryContainer, 4)} />
    </AbsoluteFill>
  );
};

type Portrait = {frames?: string[]; faces?: Record<string, string>};
// 口パク: frames(閉じ/半開き/開き)を音量で切り替える。frames が無ければ表情(faces)を使う
const portraitSrc = (pr: Portrait, active: boolean, amp: number, face?: string) => {
  if (pr.frames && pr.frames.length) {
    const n = pr.frames.length, i = !active ? 0 : amp < 0.12 ? 0 : amp < 0.35 ? Math.min(1, n - 1) : n - 1;
    return pr.frames[i];
  }
  const fc = pr.faces ?? {};
  return (active && face && fc[face]) || fc.default || Object.values(fc)[0];
};
const Avatar: React.FC<{id: number; side: "left" | "right"; active: boolean; amp: number; portrait?: Portrait; face?: string}> = ({id, side, active, amp, portrait, face}) => {
  const f = useCurrentFrame();
  const L = lookOf(id), T = tone(L.tone);
  const pop = useSpr(side === "left" ? 0 : 8);
  const act = spring({frame: active ? f % 100000 : 0, fps: FPS, config: {damping: 9, stiffness: 120}}); // 発話開始の弾み用(簡易)
  const bob = Math.sin(f / (active ? 6 : 16)) * (active ? 8 : 4);
  const blink = f % 120 < 5 ? 0.15 : 1;
  const mouth = 3 + amp * 15;
  const scale = (active ? 1.06 : 0.9) * (0.6 + 0.4 * pop);
  const hairPath = "M 62 160 Q 62 62 150 62 Q 238 62 238 160 Q 214 110 150 116 Q 86 110 62 160 Z";
  return (
    <div style={{position: "absolute", bottom: 30, [side]: 50, width: 340, height: 380, transform: `translateY(${bob}px) scale(${scale})`, transformOrigin: "50% 100%", opacity: active ? 1 : 0.6, filter: active ? "none" : "saturate(.6)"} as React.CSSProperties}>
      {portrait ? (
        <>
          <svg viewBox="0 0 300 330" width="340" height="374" style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}><path d={cookie(150, 160, 128, 10, 9, f / 70)} fill={T.bg} /></svg>
          <div style={{position: "absolute", left: 20, right: 20, top: 8, height: 340, overflow: "hidden", borderRadius: "56px 56px 96px 96px", background: T.bg}}>
            <Img src={staticFile(portraitSrc(portrait, active, amp, face))} style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%", transform: `scaleY(${1 + amp * 0.025})`, transformOrigin: "50% 100%"}} />
          </div>
        </>
      ) : (
      <svg viewBox="0 0 300 330" width="340" height="374" style={{overflow: "visible"}}>
        <path d={cookie(150, 160, 128, 10, 9, f / 70)} fill={T.bg} />
        {L.long && <path d="M 52 150 Q 50 300 110 300 L 190 300 Q 250 300 248 150 Z" fill={L.hair} />}
        <ellipse cx="150" cy="150" rx="98" ry="100" fill={L.hair} />
        <ellipse cx="150" cy="170" rx="80" ry="76" fill="#FFE8E0" />
        <path d={hairPath} fill={L.hair} />
        <path d="M 150 62 Q 130 110 150 128 Q 170 110 150 62 Z" fill={L.hair} />
        {[115, 185].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="172" rx="12" ry={(L.sleepy ? 8 : 15) * blink} fill={L.eye} />
            <ellipse cx={x - 3} cy="168" rx="4" ry={4 * blink} fill="#fff" />
            {L.sleepy && <path d={`M ${x - 15} 163 Q ${x} 157 ${x + 15} 163`} stroke={L.hair} strokeWidth="4" fill="none" strokeLinecap="round" />}
          </g>
        ))}
        <ellipse cx="96" cy="196" rx="14" ry="8" fill="#ff8fa8" opacity=".35" />
        <ellipse cx="204" cy="196" rx="14" ry="8" fill="#ff8fa8" opacity=".35" />
        <ellipse cx="150" cy="212" rx="12" ry={mouth} fill="#8a2f4a" />
        {L.acc === "bow" && <g transform="translate(222 84) rotate(18)"><path d="M0 0 L-30 -20 L-30 20 Z M0 0 L30 -20 L30 20 Z" fill={C.primary} /><circle r="8" fill={C.onPrimary} /><path d="M0 -4 L2 1 L7 1 L3 4 L4 9 L0 6 L-4 9 L-3 4 L-7 1 L-2 1Z" fill="#ffe27a" transform="translate(26 26) scale(.8)" /></g>}
        {L.acc === "moon" && <g transform="translate(76 92)"><circle r="20" fill="#ffe9a8" /><circle cx="9" cy="-4" r="17" fill={L.hair} /></g>}
        {L.acc === "bud" && <g transform="translate(224 88)"><circle r="12" fill="#ffd1e0" /><circle cx="-14" cy="-8" r="9" fill="#ffb3cb" /><circle cx="12" cy="-14" r="9" fill="#ffb3cb" /><circle r="5" fill="#fff3b0" /></g>}
      </svg>
      )}
      <div style={{position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", background: T.fg, color: C.surface, fontFamily: FONT, fontWeight: 800, fontSize: 26, padding: "6px 22px", borderRadius: 999, whiteSpace: "nowrap"}}>{L.name}</div>
    </div>
  );
};

const splitChunks = (text: string) => {
  const sents = text.split(/(?<=[。！？!?])/).filter(Boolean);
  return sents.flatMap((s) => {
    if (s.length <= 36) return [s];
    const out: string[] = []; let buf = "";
    for (const p of s.split(/(?<=、)/)) { if (buf && (buf + p).length > 34) { out.push(buf); buf = ""; } buf += p; }
    if (buf) out.push(buf); return out;
  });
};

const Subtitle: React.FC<{s: Scene}> = ({s}) => {
  const f = useCurrentFrame();
  const chunks = splitChunks(s.subtitle ?? s.narration), total = chunks.reduce((a, c) => a + c.length, 0);
  const t = Math.max(0, f - 6) / Math.max(1, s.speechFrames - 6) * total;
  let acc = 0, idx = chunks.length - 1;
  for (let i = 0; i < chunks.length; i++) { acc += chunks[i].length; if (t < acc) { idx = i; break; } }
  const local = f - 6 - (chunks.slice(0, idx).reduce((a, c) => a + c.length, 0) / total) * (s.speechFrames - 6);
  const pop = spring({frame: local, fps: FPS, config: {damping: 14, stiffness: 220}});
  const T = tone(lookOf(s.speaker).tone);
  return (
    <div style={{position: "absolute", left: 450, right: 450, bottom: 60, minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center",
      background: C.surfaceContainerHigh, borderRadius: 64, padding: "26px 44px", borderLeft: `14px solid ${T.fg}`, transform: `scale(${0.96 + 0.04 * Math.min(1, pop)})`, boxShadow: "0 10px 40px rgba(0,0,0,.45)"}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, lineHeight: 1.4, color: C.onSurface, textAlign: "center", textWrap: "balance"} as React.CSSProperties}>{chunks[idx]}</div>
    </div>
  );
};

const Cards: React.FC<{items: string[]}> = ({items}) => (
  <div style={{display: "flex", flexDirection: "column", gap: 26, alignItems: "center"}}>
    {items.map((b, i) => <Card key={i} i={i} text={b} />)}
  </div>
);
const Card: React.FC<{i: number; text: string}> = ({i, text}) => {
  const p = useSpr(14 + i * 12);
  const tones: Tone[] = ["primary", "tertiary", "secondary"], T = tone(tones[i % 3]);
  return (
    <div style={{width: 1320, display: "flex", alignItems: "center", gap: 36, background: C.surfaceContainerHigh, borderRadius: 56, padding: "22px 40px 22px 26px", transform: `translateX(${(1 - p) * -120}px) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 1.5)}}>
      <svg width="96" height="96" viewBox="0 0 96 96"><path d={cookie(48, 48, 40, 8, 6, i)} fill={T.bg} /><text x="48" y="64" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="46" fill={T.on}>{i + 1}</text></svg>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 58, color: C.onSurface}}>{text}</div>
    </div>
  );
};

const Big: React.FC<{text: string; t: Tone}> = ({text, t}) => {
  const p = useSpr(10, 8, 120), T = tone(t);
  return (
    <div style={{display: "flex", justifyContent: "center"}}>
      <div style={{background: T.bg, color: T.on, borderRadius: 110, padding: "56px 110px", fontFamily: FONT, fontWeight: 900, fontSize: 120, transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -6}deg)`, boxShadow: "0 16px 60px rgba(0,0,0,.4)"}}>{text}</div>
    </div>
  );
};

const Flow: React.FC<{nodes: {text: string; tone?: Tone}[]}> = ({nodes}) => {
  const w = Math.min(420, Math.floor((1760 - (nodes.length - 1) * 130) / nodes.length));
  return (
    <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 10}}>
      {nodes.map((n, i) => <FlowNode key={i} i={i} n={n} w={w} last={i === nodes.length - 1} />)}
    </div>
  );
};
const FlowNode: React.FC<{i: number; n: {text: string; tone?: Tone}; w: number; last: boolean}> = ({i, n, w, last}) => {
  const p = useSpr(12 + i * 22), a = useSpr(22 + i * 22, 20, 100);
  const T = tone(n.tone ?? (["primary", "secondary", "tertiary"] as Tone[])[i % 3]);
  return (
    <>
      <div style={{width: w, minHeight: 230, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-line", textWrap: "balance", background: T.bg, color: T.on, borderRadius: i % 2 ? 90 : 60, padding: 30, fontFamily: FONT, fontWeight: 900, fontSize: n.text.includes("\n") ? 40 : (w >= 380 ? 52 : 42), lineHeight: 1.3, transform: `scale(${0.4 + 0.6 * p})`, opacity: Math.min(1, p * 1.4)}}>{n.text}</div>
      {!last && <svg width="110" height="60" viewBox="0 0 110 60" style={{opacity: a}}><path d="M5 30 H80" stroke={C.outline} strokeWidth="10" strokeLinecap="round" strokeDasharray="1" /><path d="M72 10 L104 30 L72 50 Z" fill={C.outline} /></svg>}
    </>
  );
};

const TallyRow: React.FC<{r: {label: string; count: number}; T: {fg: string; bg: string; on: string}; base: number}> = ({r, T, base}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <div style={{display: "flex", alignItems: "center", gap: 30, width: 1600}}>
      <div style={{width: 560, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: T.fg}}>{r.label}</div>
      <div style={{display: "flex", gap: 8, flexWrap: "wrap", flex: 1}}>
        {Array.from({length: r.count}).map((_, i) => {
          const p = spring({frame: f - 10 - (base + i) * 2, fps, config: {damping: 10, stiffness: 200}});
          return <div key={i} style={{width: 44, height: 44, borderRadius: i % 2 ? 22 : 12, background: T.bg, border: `3px solid ${T.fg}`, transform: `scale(${Math.max(0, p)})`}} />;
        })}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 72, color: T.fg, width: 130, textAlign: "right"}}>{r.count}</div>
    </div>
  );
};
const Tally: React.FC<{rows: {label: string; count: number; tone?: Tone}[]}> = ({rows}) => {
  let k = 0;
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 34, alignItems: "center"}}>
      {rows.map((r, ri) => { const base = k; k += r.count; return <TallyRow key={ri} r={r} base={base} T={tone(r.tone ?? (["primary", "tertiary", "secondary"] as Tone[])[ri % 3])} />; })}
    </div>
  );
};

const KIND = (k: string | undefined, t: Tone | undefined) => {
  if (k === "block") return {bg: C.primaryContainer, fg: C.onPrimaryContainer, br: C.primary};
  if (k === "op") return {bg: C.secondaryContainer, fg: C.onSecondaryContainer, br: C.secondary};
  if (k === "io") return {bg: C.surfaceContainerHigh, fg: C.onSurface, br: C.outline};
  if (t) { const T = tone(t); return {bg: T.bg, fg: T.on, br: T.fg}; }
  return {bg: C.surfaceContainer, fg: C.onSurfaceVariant, br: C.outline};
};
const StackItem: React.FC<{text: string; kind?: string; tone?: Tone; delay: number; last: boolean}> = ({text, kind, tone: t, delay, last}) => {
  const p = useSpr(delay, 12, 170), K = KIND(kind, t);
  return (
    <>
      <div style={{width: 470, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: K.bg, color: K.fg, border: `3px solid ${K.br}`, borderRadius: kind === "op" ? 999 : 18, fontFamily: FONT, fontWeight: 800, fontSize: 26, transform: `scaleX(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 1.5)}}>{text}</div>
      {!last && <div style={{height: 14, color: C.outline, fontSize: 18, lineHeight: "14px", opacity: Math.min(1, p * 1.5)}}>▲</div>}
    </>
  );
};
const Stack: React.FC<{d: Extract<Diagram, {type: "stack"}>}> = ({d}) => {
  const n = d.items.length;
  return (
    <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 90}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
        {d.items.map((it, i) => <StackItem key={i} text={it.text} kind={it.kind} tone={it.tone} delay={10 + (n - 1 - i) * 8} last={i === n - 1} />)}
      </div>
      {d.notes && <div style={{display: "flex", flexDirection: "column", gap: 22, width: 900}}>{d.notes.map((t, i) => <Note key={i} i={i} text={t} />)}</div>}
    </div>
  );
};
const Note: React.FC<{i: number; text: string}> = ({i, text}) => {
  const p = useSpr(30 + i * 22), T = tone((["primary", "tertiary", "secondary"] as Tone[])[i % 3]);
  return (
    <div style={{background: C.surfaceContainerHigh, borderLeft: `12px solid ${T.fg}`, borderRadius: 40, padding: "18px 34px", fontFamily: FONT, fontWeight: 800, fontSize: 40, lineHeight: 1.3, color: C.onSurface, transform: `translateX(${(1 - p) * 80}px)`, opacity: Math.min(1, p * 1.5)}}>{text}</div>
  );
};
const Pattern: React.FC<{d: Extract<Diagram, {type: "pattern"}>}> = ({d}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const col = (k: string) => { const l = d.legend.find((x) => x.key === k); return tone(l ? l.tone : "secondary"); };
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 44}}>
      <div style={{display: "flex", gap: 6}}>
        {d.cells.split("").map((ch, i) => {
          const p = spring({frame: f - 8 - i * 3, fps, config: {damping: 10, stiffness: 220}}), T = col(ch);
          return <div key={i} style={{width: 62, height: 84, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: ch === "C" ? 16 : 31, background: T.bg, border: `3px solid ${T.fg}`, color: T.on, fontFamily: FONT, fontWeight: 900, fontSize: 38, transform: `scale(${Math.max(0, p)})`}}>{ch}</div>;
        })}
      </div>
      <div style={{display: "flex", gap: 56}}>
        {d.legend.map((l, i) => {
          const T = tone(l.tone), p = useSpr(8 + 24 * 3 + i * 14);
          return (
            <div key={i} style={{display: "flex", alignItems: "center", gap: 18, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 30}px)`}}>
              <div style={{width: 56, height: 56, borderRadius: l.key === "C" ? 14 : 28, background: T.bg, border: `3px solid ${T.fg}`, color: T.on, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 32}}>{l.key}</div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.onSurface}}>{l.label}</div>
              <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: T.fg}}>{l.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Wave: React.FC<{d: Extract<Diagram, {type: "wave"}>}> = ({d}) => {
  const f = useCurrentFrame();
  const W = 1760, H = 440, x0 = 200, x1 = 1250;
  const prog = interpolate(f, [18, 110], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const path = (pts: number[]) => {
    const P = pts.map((v, i) => [x0 + (i / (pts.length - 1)) * (x1 - x0), 30 + (1 - v) * (H - 60)]);
    let dd = `M${P[0][0]} ${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] ?? P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] ?? p2;
      dd += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return dd;
  };
  const rawY = d.curves.map((c) => 30 + (1 - c.points[c.points.length - 1]) * (H - 60));
  const order = rawY.map((y, i) => [y, i]).sort((a, b) => a[0] - b[0]);
  const labelY: number[] = []; let prev = -999;
  for (const [y, i] of order) { const yy = Math.max(y, prev + 50); labelY[i] = yy; prev = yy; }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display: "block", margin: "0 auto"}}>
      <rect x={x0 - 14} y="20" width="10" height={H - 40} rx="5" fill={C.outline} />
      <text x={x0 - 34} y="48" textAnchor="end" fontFamily={FONT} fontWeight={900} fontSize="44" fill={C.primary}>{d.top}</text>
      <text x={x0 - 34} y={H - 22} textAnchor="end" fontFamily={FONT} fontWeight={900} fontSize="44" fill={C.tertiary}>{d.bottom}</text>
      <line x1={x0} y1={H / 2} x2={x1} y2={H / 2} stroke={C.outline} strokeWidth="4" strokeDasharray="4 14" strokeLinecap="round" />
      {d.curves.map((c, i) => {
        const col = tone(c.tone ?? (["primary", "tertiary", "secondary"] as Tone[])[i % 3]).fg;
        const ly = labelY[i];
        return (
          <g key={i}>
            <path d={path(c.points)} pathLength={1} fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={c.dashed ? "0.02 0.02" : "1"} strokeDashoffset={c.dashed ? 0 : 1 - prog} opacity={c.dashed ? prog : 1} />
            <text x={x1 + 18} y={ly + 14} fontFamily={FONT} fontWeight={800} fontSize="36" fill={col} opacity={prog}>{c.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const SceneView: React.FC<{s: Scene; idx: number; total: number}> = ({s, idx, total}) => {
  const p = useSpr(0, 13, 170);
  const T = tone(lookOf(s.speaker).tone);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: "absolute", left: 90, top: 64, display: "flex", alignItems: "center", gap: 28, transform: `translateX(${(1 - p) * -200}px)`, opacity: Math.min(1, p * 1.6)}}>
        <div style={{background: T.bg, color: T.on, fontWeight: 900, fontSize: 34, padding: "10px 30px", borderRadius: 999}}>{String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
        <div style={{fontWeight: 900, fontSize: Math.max(56, Math.min(92, Math.floor(950 / Math.max(1, s.title.length)))), color: C.onSurface, letterSpacing: -2, whiteSpace: "nowrap"}}>{s.title}</div>
      </div>
      <div style={{position: "absolute", left: 0, right: 0, top: 250, height: 470, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{width: "100%"}}>
          {s.diagram?.type === "flow" && <Flow nodes={s.diagram.nodes} />}
          {s.diagram?.type === "wave" && <Wave d={s.diagram} />}
          {s.diagram?.type === "tally" && <Tally rows={s.diagram.rows} />}
          {s.diagram?.type === "stack" && <Stack d={s.diagram} />}
          {s.diagram?.type === "pattern" && <Pattern d={s.diagram} />}
          {!s.diagram && s.big && <Big text={s.big} t={lookOf(s.speaker).tone} />}
          {!s.diagram && !s.big && s.bullets && <Cards items={s.bullets} />}
        </div>
      </div>
      <Subtitle s={s} />
    </AbsoluteFill>
  );
};

const Video: React.FC<Props> = ({scenes, cast, source, portraits}) => {
  const frame = useCurrentFrame();
  let start = 0, cur = scenes[0], curStart = 0;
  const starts = scenes.map((s) => { const st = start; start += s.frames; if (frame >= st) { cur = s; curStart = st; } return st; });
  const local = frame - curStart;
  const amp = cur ? (cur.amp[local] ?? 0) : 0;
  const inSpeech = cur ? local < cur.speechFrames : false;
  return (
    <AbsoluteFill>
      <Background />
      {scenes.map((s, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={s.frames}>
          <SceneView s={s} idx={i} total={scenes.length} />
          <Audio src={staticFile(s.audio)} />
        </Sequence>
      ))}
      {cast.map((c) => <Avatar key={c.id} id={c.id} side={c.side} portrait={portraits?.[String(c.id)]} face={cur && cur.speaker === c.id ? cur.face : undefined} active={!!cur && cur.speaker === c.id && inSpeech} amp={cur && cur.speaker === c.id && inSpeech ? amp : 0} />)}
      <div style={{position: "absolute", right: 50, top: 40, fontFamily: FONT, fontSize: 22, color: C.onSurfaceVariant, background: C.surfaceContainer, padding: "6px 20px", borderRadius: 999}}>
        VOICEVOX: {cast.map((c) => lookOf(c.id).name).join(" / ")}
      </div>
      {source && <div style={{position: "absolute", right: 50, top: 88, fontFamily: FONT, fontSize: 22, color: C.onSurfaceVariant, background: C.surfaceContainer, padding: "6px 20px", borderRadius: 999}}>出典: {source}</div>}
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Explainer" component={Video} width={1920} height={1080} fps={FPS} durationInFrames={300}
    defaultProps={{scenes: [], cast: [], source: ""} as Props}
    calculateMetadata={({props}) => ({durationInFrames: Math.max(1, (props as Props).scenes.reduce((a, s) => a + s.frames, 0))})} />
));
