# Arema-sMovie

VOICEVOX の音声と Remotion で、指示した内容の解説動画(mp4)を自動生成するプロジェクト。

- スキル: `.claude/skills/explainer-video/SKILL.md`(「解説動画にして」で起動)
- 台本→動画: `node build.mjs script.json out/video.mp4`(VOICEVOX エンジンが localhost:50021 で起動していること)
- VOICEVOX は Docker Hub の `voicevox/voicevox_engine:cpu-latest` を使う
- 声を使う動画には「VOICEVOX:キャラ名」のクレジット表記が必要
