# 台本(scripts/*.json)の書式

```json
{"source":"出典名(右上に表示)","speaker":14,"scenes":[
 {"title":"見出し","speaker":14,"bullets":["最大3つ"],
  "subtitle":"字幕に出す文(LFM3 など元の表記)",
  "narration":"読み上げる文(エルエフエムスリー のようにかな書き)"}]}
```

## シーンのフィールド
| フィールド | 内容 |
|---|---|
| `title` | 見出し。長いと自動で縮む(約14文字までが目安) |
| `speaker` | VOICEVOX の声ID。**1シーン=1話者**。最初の2人が左右のキャラになる |
| `narration` | 読み上げ。英字・数字・記号はかな書きにする(誤読防止) |
| `subtitle` | 字幕。省略すると `narration` を使う。長い文は自動で分割して順に出す |
| `face` | トバリの表情。`default / joy / ok / trouble / angry / sad`(立ち絵に表情がある話者のみ) |
| `speed` `intonation` `pause` | 声の調整。全体(script直下)にもシーンにも書ける。既定は 1.0 / 1.15 / 1.0 |

内容は次のどれか1つ(複数書くと `diagram` > `big` > `bullets` の順で1つだけ出る)。
- `bullets`: 箇条書き(**最大3つ**)
- `big`: 大きな一言(掛け合いのツッコミ向き)
- `diagram`: 図解(下表)

## diagram
| type | 書き方 | 用途 |
|---|---|---|
| `flow` | `{"type":"flow","nodes":[{"text":"A\n補足","tone":"primary"}, ...]}` | 手順・因果。**最大6ノード**(5以上は文字が小さくなる)。改行は `\n` |
| `wave` | `{"type":"wave","top":"重い","bottom":"軽い","curves":[{"label":"…","tone":"tertiary","points":[0..1の配列]}]}` | 時間変化・比較。概念図なら見出しに「(概念図)」 |
| `tally` | `{"type":"tally","rows":[{"label":"…","count":13,"tone":"primary"}]}` | 内訳の数え上げ |
| `stack` | `{"type":"stack","items":[{"text":"Norm"},{"text":"Block","kind":"block"}],"notes":["右の説明"]}` | 縦の積み上げ図。items は**上から下**の順。`kind`: `norm`(既定) / `block` / `op` / `io` |
| `pattern` | `{"type":"pattern","cells":"CCFCS…","legend":[{"key":"C","label":"…","count":13,"tone":"primary"}]}` | 並びの帯。`cells` の各文字を `legend.key` の色にする |

`tone` は `primary` / `secondary` / `tertiary`(DESIGN.md のカラーロール)。

## 声ID(VOICEVOX)
冥鳴ひまり=14、夜語トバリ=118、里石ユカ=126、ずんだもん=3、四国めたん=2、春日部つむぎ=8。
全一覧は `curl localhost:50021/speakers`。
