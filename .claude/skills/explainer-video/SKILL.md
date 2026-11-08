---
name: explainer-video
description: 指示された内容を、VOICEVOXの音声とRemotionで解説動画(mp4)にして、チャットに送る。「解説動画にして」「動画で解説して」「〇〇の仕組みを動画で」など、解説動画の作成を頼まれたときに使う。
---

# 解説動画づくり

指示された内容を、VOICEVOX音声 + Remotion映像(Material 3 Expressive)の解説動画にして、SendUserFileでユーザーに送る。
リポジトリの運用ルールは **AGENTS.md**、デザインルールは **DESIGN.md** にある。先に読む。

Driveコネクタは動画のアップロードに向かない(base64を手書きする必要がある)。動画の渡し先はチャット。

## 手順
1. **調べる**: 一次情報を優先する(公式ブログ、論文)。取得は TinyFish の fetch_content / search。YouTubeは字幕本文が取れない(タイトル・概要欄・チャプターのみ)。出典は台本の `source` に書く。
2. **台本を書く**: `scripts/<名前>.json`。PREP法か三幕構成(NOTES.md)。出典にない数字・順序を足さない。
3. **環境を用意する**(新しいセッションでは毎回):
   - `pgrep dockerd || (dockerd >/tmp/dockerd.log 2>&1 &); sleep 8`
   - `docker pull voicevox/voicevox_engine:cpu-latest`(GitHub/Hugging FaceはブロックされるがDocker Hubは使える)
   - `docker run -d --rm --name vv -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-latest`、`curl localhost:50021/version` が返るまで待つ
   - リポジトリのルートで `npm install --no-audit --no-fund`
4. **レンダリング**: `node build.mjs scripts/<名前>.json out/<名前>.mp4`
   - 試作は第3引数に `0.75`(1440x810)。解像度が偶数になる倍率だけ使える(0.6667は失敗する)。
   - 長い動画は時間がかかる(約5000フレームで20分以上)。`run_in_background` で実行する。
   - 1フレームだけ見るなら `npx remotion still src/index.tsx Explainer out/s.png --frame=N --props=out/props.json --browser-executable=/opt/pw-browsers/chromium`
5. **確認**: 日本語の崩れ、図のはみ出し、ラベルの重なりを見る。
6. **送る**: SendUserFile で mp4 を送る。VOICEVOXのクレジットと出典を添える。
7. 終わったら `docker rm -f vv`。

## 台本(JSON)の書き方
```json
{"source":"出典名","speaker":14,"scenes":[
 {"title":"見出し","speaker":14,"bullets":["最大3つ"],
  "subtitle":"字幕に出す文(LFM3 など元の表記)",
  "narration":"読み上げる文(エルエフエムスリー のようにかな書き)"}]}
```
- 内容は `bullets` / `big`(大きな一言) / `diagram` のどれか1つ。
- `diagram`: `flow`(nodes、改行は `\n`)、`wave`(top/bottom/curves[points 0〜1])、`tally`(rows[label,count])。
- 声: 冥鳴ひまり=14、夜語トバリ=118、里石ユカ=126、ずんだもん=3、四国めたん=2。最初の2人が左右に出る。
- 1シーン=1話者。掛け合いはシーンを分ける。調整は `speed` / `intonation` / `pause`。

## キャラ
公式立ち絵は `public/characters/<声ID>.png` に置けば自動で使う。なければSVGキャラ。ユーザーはチャットに画像を貼れば渡せる(サンドボックスからは配布サイトに接続できない)。
