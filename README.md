# Arema-sMovie

解説動画を、ゼロからコードで自動生成するリポジトリです。テンプレートも素材も使いません。
台本・図・音声(2人の掛け合い)・字幕・書き出しまで、すべてここで作ります。

## 作られる動画
- **図解 + 字幕 + 合成音声**(立ち絵・キャラクターなし)
- **解説役と相方の掛け合い**(ゆっくり実況風)。相方は毎回ランダムなメンバー
- 専門用語は、使う前に図で説明してから出す
- 出どころ(公式ブログ / 論文 / 一般論 / 報道 / 推測)を画面の右上で区別する

## 作ってある動画
- `video/out/explain.mp4` … 三つの構造の比較(短い版・VOICEVOX)
- `video/out/deep.mp4` … 深掘り版(トークン、LLM、音声コーデック、Shizuku-Duplex の中身、評価、比較。約23分)

## 作り方
詳しくは [AGENTS.md](AGENTS.md)。

```bash
# Docker だけで作る(おすすめ)
VOICEVOX_SPEAKER=ナースロボ＿タイプＴ docker compose up --build --abort-on-container-exit
# -> video/out/explain.mp4

# 手元で作る(Python + ffmpeg + VOICEVOX エンジンが必要)
VOICEVOX_SPEAKER=ナースロボ＿タイプＴ python3 video/make_video.py
OUT_NAME=deep.mp4 python3 video/make_deep.py
```

## 構成
- `video/make_video.py` … 描画・音声・字幕・書き出しの共通部分と、短い版の台本
- `video/make_deep.py` … 深掘り版の台本(`make_video.py` を使う)
- `Dockerfile`, `docker-compose.yml` … VOICEVOX エンジンと動画生成をまとめて動かす
- `.github/workflows/make-video.yml` … GitHub Actions で作る(手動実行)
- `.claude/agents/explainer-video.md` … 動画を作るエージェント向けの指示

## 注意
- 音声のキャラクターごとに、VOICEVOX の利用規約を必ず確認してください。動画の右下に音声のクレジットを入れています。
- 生成物(`voice.wav`、`frames/`、`ttscache/`)はコミットしません。
