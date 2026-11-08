import React from "react";
import {registerRoot, Composition, AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate} from "remotion";

type Scene = {title: string; bullets: string[]; narration: string; frames: number; audio: string};
type Props = {scenes: Scene[]; fps: number};
const FPS = 30;

const SceneView: React.FC<{s: Scene; idx: number; total: number}> = ({s, idx, total}) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 12], [0, 1], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{background: "linear-gradient(135deg,#0f172a,#1e3a8a)", color: "#fff", fontFamily: "'Noto Sans CJK JP','Noto Sans JP',sans-serif", padding: 90, opacity: fade}}>
      <div style={{fontSize: 30, opacity: 0.6}}>{idx + 1} / {total}</div>
      <div style={{fontSize: 84, fontWeight: 800, margin: "20px 0 50px"}}>{s.title}</div>
      {s.bullets.map((b, i) => {
        const o = interpolate(f, [20 + i * 25, 35 + i * 25], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
        return <div key={i} style={{fontSize: 52, margin: "18px 0", opacity: o, transform: `translateX(${(1 - o) * 40}px)`}}>▶ {b}</div>;
      })}
      <div style={{position: "absolute", left: 90, right: 90, bottom: 60, fontSize: 34, background: "rgba(0,0,0,.45)", padding: "16px 24px", borderRadius: 12}}>{s.narration}</div>
    </AbsoluteFill>
  );
};

const Video: React.FC<Props> = ({scenes}) => {
  let start = 0;
  return (
    <AbsoluteFill>
      {scenes.map((s, i) => {
        const from = start; start += s.frames;
        return (
          <Sequence key={i} from={from} durationInFrames={s.frames}>
            <SceneView s={s} idx={i} total={scenes.length} />
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Explainer" component={Video} width={1920} height={1080} fps={FPS}
    durationInFrames={300}
    defaultProps={{scenes: [], fps: FPS} as Props}
    calculateMetadata={({props}) => ({durationInFrames: Math.max(1, (props as Props).scenes.reduce((a, s) => a + s.frames, 0))})} />
));
