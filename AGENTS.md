# AGENTS.md — Arema-sMovie

AI エージェント向けの運用ルール。Claude Code でも他のエージェントでも、このファイルの手順で同じ成果物が作れる。
オーナー(yub4-arema)から「このリポジトリの運用は任せる」と言われている。迷ったらここのルールで決める。

**目的**: 指示された内容を、VOICEVOX の音声と Remotion で「解説動画(mp4)」にして渡す。デザインは Material 3 Expressive。

## 現在の状況と残タスク(引き継ぎ)
- 実装は完了。`src/`、`build.mjs`、`tools/` は静止画で目視確認済み(見出し・フロー図・stack・pattern・口パク)。
- **未完了: LFM3 解説動画(`scripts/lfm3-architecture.json`)の最終レンダリング**。台本は公式のアーキテクチャ図に沿って完成している。描画に約30分かかるため、途中で止めた。
  - 実行: `bash tools/setup.sh && node build.mjs scripts/lfm3-architecture.json out/lfm3.mp4 0.75`(長いので `run_in_background` 推奨)
  - 仕上がりを確認(`remotion still` で数枚)してからユーザーに渡す。
- **立ち絵の素材はリポジトリに入っていない**(第三者の著作物。規約未確認)。素材がなくても動くが、その場合は自作 SVG キャラになる。立ち絵ありで作るには、ユーザーに素材をもらって下の「立ち絵」の手順で書き出す。
- 動画の渡し先は**チャット**。Google Drive へのアップロードは未解決(下の「落とし穴」参照)。
- `main` へのマージは未実施(作業ブランチ `claude/explainer-video-skill`)。動画の確認が済んだらマージしてよい(オーナー了承済み)。

## クイックスタート
```bash
bash tools/setup.sh                     # dockerd → VOICEVOX(localhost:50021) → npm install。何度でも実行可
node build.mjs scripts/<名前>.json out/<名前>.mp4 0.75   # 第3引数は書き出し倍率(試作 0.75、本番は省略=1920x1080)
bash tools/setup.sh stop                # 終了時
```
1フレームだけ見る: `npx remotion still src/index.tsx Explainer out/s.png --frame=N --props=out/props.json --browser-executable=/opt/pw-browsers/chromium --scale=0.5`
(`out/props.json` は直前の `build.mjs` が作る)

## 作業の流れ
1. **調べる**: 一次情報を優先(公式ブログ・論文)。出典は台本の `source` に書く。
2. **台本を書く**: `scripts/<名前>.json`。書式は [docs/SCRIPT_FORMAT.md](docs/SCRIPT_FORMAT.md)。構成は PREP法/三幕構成([NOTES.md](NOTES.md))。
3. **レンダリング**(上のクイックスタート)。
4. **確認**: 日本語の崩れ、図のはみ出し、ラベルの重なり、見出しとチップの衝突、キャラの顔が切れていないか。
5. **渡す**: mp4 をユーザーに送る。VOICEVOX のクレジット(キャラ名)と出典を添える。

## 構成
| パス | 役割 |
|---|---|
| `build.mjs` | 台本 → VOICEVOX 音声 → 音量(口パク用)→ Remotion レンダリング |
| `src/theme.ts` | デザイントークン(M3 Expressive の色・シェイプ・クッキー型) |
| `src/index.tsx` | 映像(背景、キャラ、字幕、図解部品) |
| `scripts/*.json` | 台本。動画にしたものは残す(`example-caffeine` は最小の見本、`lfm3-architecture` が本番) |
| `tools/setup.sh` | 環境構築 |
| `tools/prepare_portraits.py` | 立ち絵素材(PSD/PNG)から動画用の上半身画像を書き出す |
| `docs/SCRIPT_FORMAT.md` | 台本の書式リファレンス |
| `DESIGN.md` | デザインルール |
| `NOTES.md` | 構成・声づくりの学び |
| `.claude/skills/explainer-video/` | Claude Code 用スキル(入口。中身はこのファイルを指す) |

## 台本のルール
- 事実は出典にあるものだけ。出典にない数字・順序・因果を足さない。足すなら見出しに「(概念図)」と書く。
- `narration`(読み上げ)と `subtitle`(表示)を分ける。英字・数字・略語はかな書きで読ませ、字幕には元の表記を出す。
- 1シーン=1話者。掛け合いはシーンを分ける。箇条書きは最大3つ。1シーンの音声は30秒以内が目安。

## 立ち絵(任意)
- 置き場所: `public/characters/<声ID>/`(`.gitignore` 済み。**コミットしない**)。
  - `0.png` `1.png` `2.png` = 口パク(閉じ/半開き/開き)。音量で切り替わる。
  - `face_<名前>.png` = 表情。台本の `face` で切り替える(`face_default.png` が既定)。
  - ディレクトリが無い話者は自作 SVG キャラ(`src/index.tsx` の `LOOK`)になる。
- 書き出し: `PSD_LIB=<psd-toolsのsite-packages> python3 -I tools/prepare_portraits.py <ひまりPSD> <ユカPSD> <トバリPNGの親ディレクトリ> public/characters`
  - 依存は `pip install --target <dir> psd-tools pillow`。`python -I` は PYTHONPATH を無視するので `PSD_LIB` で渡す。
  - これまでの素材: 冥鳴ひまり=PSD(`冥鳴ひまり立ち絵＿とらっかあ.psd`)、里石ユカ=PSD(`つぼみ 書き出し.psd`)、夜語トバリ=PNG(なごにや式「座り」8表情)。
  - 他のキャラを足すときは `tools/prepare_portraits.py` の `main()` に口レイヤー名と切り出し位置(`cx`/`hfrac`)を足す。
- ZIP の展開: 日本語ファイル名が Shift-JIS(cp932)または `#U91cc…` 表記のことがある。`zipfile.ZipFile(path, metadata_encoding="cp932")` と `#Uxxxx` の復号で読める。展開先は素材ごとに別の空ディレクトリにする(ダウンロード物は信頼しない)。
- **利用規約**: 配布元(なごにや屋 https://nagoniya.booth.pm/ など)の規約は予告なく変わる。使う前にユーザーが各配布ページで確認する。クレジットは右上のチップに VOICEVOX のキャラ名が自動で出る。

## Git のルール
- 作業は `claude/<トピック>` ブランチ。コミットメッセージは日本語、1行目は変更の要点。
- 動画が正しく作れたことを確認してから `main` にマージする。
- コミットしない: `node_modules/`、`out/`、`public/audio/`、`public/characters/`、`*.mp4`、`*.wav`、第三者素材。

## 環境の制約と落とし穴(クラウドセッション)
- **ネットワーク**: GitHub、Hugging Face、YouTube、ニコニ静画、pixiv、booth、voicevox.hiroshiba.jp には直接つながらない。Docker Hub・npm・PyPI は使える。Web の調査はツール(TinyFish / WebSearch)経由。YouTube は字幕本文が取れず、タイトル・概要欄・チャプターだけ。
- **Docker**: デーモンは手動起動(`tools/setup.sh` がやる)。VOICEVOX イメージの取得に数分。
- **書き出し倍率は解像度が偶数になる値だけ**(0.75、0.5、1)。0.6667 は 1280.06 になり失敗する。
- **背景に CSS `blur` を使わない**(描画が数倍遅くなる)。ぼかしは `radial-gradient` で代用している。
- **描画は重い**: 約5500フレームで30分前後。`run_in_background` で実行し、完了通知を待つ。
- **Google Drive**: コネクタは `base64Content` に中身を直接書く方式で、動画に向かない(手書きが必要で壊れやすい)。Drive API トークンを環境に登録すれば `curl` で上げられるが、アクセストークンは約1時間で失効する。現状は動画をチャットで渡している。
- **`git clone` が `main` しか追跡しない**ため、push 済みのブランチでも「未 push」と誤判定されることがある。直すには `git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`。
- 「LFM3」のような英数字の読み上げは `narration` をかな書きにする(字幕は `subtitle` に元の表記)。
