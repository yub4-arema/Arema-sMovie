# Arema-sMovie

VOICEVOX の音声と Remotion で、指示した内容の解説動画(mp4)を自動生成するプロジェクト。デザインは Material 3 Expressive。

- 運用ルール: [AGENTS.md](AGENTS.md) / デザインルール: [DESIGN.md](DESIGN.md) / 学びのメモ: [NOTES.md](NOTES.md)
- スキル: `.claude/skills/explainer-video/SKILL.md`(「解説動画にして」で起動)
- 台本: `scripts/*.json` → `node build.mjs scripts/<名前>.json out/<名前>.mp4`(VOICEVOX エンジンが localhost:50021 で起動していること)
- VOICEVOX は Docker Hub の `voicevox/voicevox_engine:cpu-latest` を使う
- 声を使う動画には「VOICEVOX:キャラ名」のクレジット表記が必要
