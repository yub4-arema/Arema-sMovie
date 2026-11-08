---
name: explainer-video
description: 指示された内容を、VOICEVOXの音声とRemotionで解説動画(mp4)にして、チャットに送る。「解説動画にして」「動画で解説して」など、解説動画の作成を頼まれたときに使う。
---

# 解説動画づくり

指示された内容を、VOICEVOX音声+Remotion映像の解説動画(1920x1080 mp4)にして、SendUserFileでユーザーに送る。
Driveコネクタは動画のアップロードに向かない(base64を手書きする必要がある)ので、置き場所はチャット。ユーザーは「共有できればいい」と言っている。

## 手順
1. **台本を書く**: PREP法(結論→理由→具体例→結論)か三幕構成で組む。構成を先に決める。尺は長くしすぎない(目安 1〜3分)。詳細は リポジトリルートの NOTES.md。
2. **環境を用意する**(新しいセッションでは毎回必要):
   - `pgrep dockerd || (dockerd >/tmp/dockerd.log 2>&1 &); sleep 8`
   - `docker pull voicevox/voicevox_engine:cpu-latest` (GitHubとHugging Faceはブロックされる。Docker Hubは使える)
   - `docker run -d --rm --name vv -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-latest` で起動し、`curl localhost:50021/version` が返るまで待つ
   - このリポジトリのルートで `npm install --no-audit --no-fund`(ルートが Remotion プロジェクト)
3. **script.json を書く**: リポジトリルートの script.example.json を参考に、シーンごとに title / bullets / narration を並べる。
   - 声: 既定は冥鳴ひまり(14)。夜語トバリ=118、里石ユカ=126、ずんだもん=3、四国めたん=2。シーンごとに `speaker` を指定すれば掛け合いにできる。
   - 調整: speed / intonation(既定1.15) / pause を script 全体またはシーンごとに指定できる。
   - 読みが怪しい語(英単語・専門用語)はひらがな・カタカナで書く。
4. **レンダリング**: `node build.mjs script.json out/名前.mp4`(ブラウザは /opt/pw-browsers/chromium を使う)
5. **確認**: `ffmpeg -ss 1.5 -i out/名前.mp4 -frames:v 1 out/f.png` で1フレーム見て、日本語が崩れていないか確認する。
6. **送る**: SendUserFile で mp4 を送る。使った声のクレジット表記(VOICEVOX:キャラ名)も添える。
7. 終わったら `docker rm -f vv`。

## ファイルの場所(このリポジトリ)
- `build.mjs`: 台本→VOICEVOX音声→Remotionレンダリング
- `src/index.tsx`: 映像のコンポジション
- `script.example.json`: 台本の例 / `NOTES.md`: 構成・声づくりのメモ
- 生成物(out/, public/audio/)は .gitignore 済み。動画は repo に入れない。

## 注意
- ユーザーは日本語での応答を希望。「怪しい雰囲気」の女の子の声(ひまり、トバリ、ユカ)が好み。
- 声ごとに利用規約がある。公開する動画にはクレジット表記が必要。
- YouTubeの字幕は取得できない(タイトルと概要欄のみ)。
