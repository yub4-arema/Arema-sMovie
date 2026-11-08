// 使い方: node build.mjs script.json out/video.mp4   (VOICEVOXエンジンが localhost:50021 で起動していること)
import fs from "fs"; import {execSync} from "child_process";
const [,, scriptPath = "script.json", out = "out/video.mp4", scale = "1"] = process.argv; // scale=0.75 で 1440x810(速い試作。解像度が偶数になる倍率のみ可)
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
// 声ID: 14=冥鳴ひまり 118=夜語トバリ 126=里石ユカ 3=ずんだもん 2=四国めたん (キャラ絵は src/index.tsx の LOOK で定義)
const d = {speaker: script.speaker ?? 14, speed: script.speed ?? 1.0, intonation: script.intonation ?? 1.15, pause: script.pause ?? 1.0};
const FPS = 30; fs.mkdirSync("public/audio", {recursive: true}); fs.mkdirSync("out", {recursive: true});
const scenes = [], order = [];
for (const [i, s] of script.scenes.entries()) {
  const speaker = s.speaker ?? d.speaker; if (!order.includes(speaker)) order.push(speaker);
  const q = await (await fetch(`http://localhost:50021/audio_query?speaker=${speaker}&text=${encodeURIComponent(s.narration)}`, {method: "POST"})).json();
  q.speedScale = s.speed ?? d.speed; q.intonationScale = s.intonation ?? d.intonation; q.pauseLengthScale = s.pause ?? d.pause;
  const wav = Buffer.from(await (await fetch(`http://localhost:50021/synthesis?speaker=${speaker}`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(q)})).arrayBuffer());
  const name = `audio/s${i}.wav`; fs.writeFileSync(`public/${name}`, wav);
  const n = (wav.length - 44) >> 1, pcm = new Int16Array(wav.buffer.slice(wav.byteOffset + 44, wav.byteOffset + 44 + n * 2));
  const win = 24000 / FPS, amp = [];
  for (let f = 0; f * win < n; f++) { let sum = 0, c = 0; for (let k = f * win; k < Math.min(n, (f + 1) * win); k++) { sum += pcm[k] * pcm[k]; c++; } amp.push(Math.min(1, Math.sqrt(sum / c) / 7000)); }
  const sm = amp.map((v, k) => +(((amp[k - 1] ?? v) + v * 2 + (amp[k + 1] ?? v)) / 4).toFixed(2));
  const sec = n / 24000;
  scenes.push({...s, speaker, audio: name, amp: sm, speechFrames: Math.ceil(sec * FPS), frames: Math.ceil((sec + 0.5) * FPS)});
}
const cast = order.slice(0, 2).map((id, k) => ({id, side: k === 0 ? "left" : "right"}));
// 立ち絵(任意): public/characters/<声ID>/ に 0.png,1.png,2.png(口パク: 閉じ/半開き/開き)と face_<名前>.png(表情)を置くと使う。なければSVGキャラ
const portraits = {};
for (const c of cast) {
  const dir = `public/characters/${c.id}`; if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir), frames = ["0.png", "1.png", "2.png"].filter((f) => files.includes(f)).map((f) => `characters/${c.id}/${f}`);
  const faces = Object.fromEntries(files.filter((f) => /^face_.+\.png$/.test(f)).map((f) => [f.slice(5, -4), `characters/${c.id}/${f}`]));
  if (frames.length || Object.keys(faces).length) portraits[c.id] = {frames, faces};
}
fs.writeFileSync("out/props.json", JSON.stringify({scenes, cast, source: script.source ?? "", portraits}));
execSync(`npx remotion render src/index.tsx Explainer ${out} --props=out/props.json --browser-executable=/opt/pw-browsers/chromium --crf=28 --scale=${scale} --concurrency=4`, {stdio: "inherit"});
