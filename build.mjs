// 使い方: node build.mjs script.json out.mp4   (VOICEVOXエンジンが localhost:50021 で起動していること)
import fs from "fs"; import {execSync} from "child_process";
const [,, scriptPath = "script.json", out = "out/video.mp4"] = process.argv;
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
// 声ID: 14=冥鳴ひまり 118=夜語トバリ(ノーマル) 126=里石ユカ 3=ずんだもん 2=四国めたん
// シーンごとに speaker を指定すれば掛け合いにできる。speed/intonation/pause で抑揚とテンポを調整
const defaults = {speaker: script.speaker ?? 14, speed: script.speed ?? 1.0, intonation: script.intonation ?? 1.15, pause: script.pause ?? 1.0};
const FPS = 30; fs.mkdirSync("public/audio", {recursive: true}); fs.mkdirSync("out", {recursive: true});
const scenes = [];
for (const [i, s] of script.scenes.entries()) {
  const speaker = s.speaker ?? defaults.speaker;
  const q = await (await fetch(`http://localhost:50021/audio_query?speaker=${speaker}&text=${encodeURIComponent(s.narration)}`, {method: "POST"})).json();
  q.speedScale = s.speed ?? defaults.speed; q.intonationScale = s.intonation ?? defaults.intonation; q.pauseLengthScale = s.pause ?? defaults.pause;
  const wav = Buffer.from(await (await fetch(`http://localhost:50021/synthesis?speaker=${speaker}`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(q)})).arrayBuffer());
  const name = `audio/s${i}.wav`; fs.writeFileSync(`public/${name}`, wav);
  const sec = (wav.length - 44) / (24000 * 2); // 24kHz 16bit mono
  scenes.push({...s, audio: name, frames: Math.ceil((sec + 0.6) * FPS)});
}
fs.writeFileSync("out/props.json", JSON.stringify({scenes, fps: FPS}));
execSync(`npx remotion render src/index.tsx Explainer ${out} --props=out/props.json --browser-executable=/opt/pw-browsers/chromium --crf=32 --concurrency=4`, {stdio: "inherit"});
