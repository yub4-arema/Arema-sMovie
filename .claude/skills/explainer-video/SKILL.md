---
name: explainer-video
description: 指示された内容を、VOICEVOXの音声とRemotionで解説動画(mp4)にして渡す。「解説動画にして」「動画で解説して」「〇〇の仕組みを動画で」など、解説動画の作成を頼まれたときに使う。
---

# 解説動画づくり

手順・ルール・落とし穴は **リポジトリ直下の AGENTS.md** にある。最初に読むこと(現在の状況と残タスクも書いてある)。
台本の書式は `docs/SCRIPT_FORMAT.md`、デザインは `DESIGN.md`。

最短の流れ:
1. `bash tools/setup.sh`(dockerd・VOICEVOX・npm install)
2. 調べて、`scripts/<名前>.json` を書く(出典にない事実を足さない)
3. `node build.mjs scripts/<名前>.json out/<名前>.mp4 0.75`(長いので `run_in_background`)
4. 静止画で確認してから、mp4 をチャットで渡す(VOICEVOX のクレジットと出典を添える)
5. `bash tools/setup.sh stop`
