#!/usr/bin/env python3
"""Dessa / GPT-Live / Shizuku-Duplex 構造解説動画の生成スクリプト。
図解(Pillow) + 字幕 + 合成音声(pyopenjtalk) を ffmpeg で mp4 にする。
使い方: python3 make_video.py  -> out/explain.mp4
"""
import os, re, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import pyopenjtalk

W, H = 1280, 720
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

FONT = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"
def F(s): return ImageFont.truetype(FONT, s)

# 色: 紫=会話する本体 / 緑=裏モデル / 灰=入出力
PURPLE, GREEN, GRAY = "#7c3aed", "#16a34a", "#6b7280"
INK, BG, SOFT = "#1f2937", "#f8fafc", "#e5e7eb"
ORANGE, LPURPLE = "#ea580c", "#a78bfa"
SUB_TOP = 585

# ---------- 描画ヘルパー ----------
def text(d, x, y, s, size=30, col=INK, anchor="la", bold=False):
    d.text((x, y), s, font=F(size), fill=col, anchor=anchor, stroke_width=1 if bold else 0, stroke_fill=col)

def box(d, x, y, w, h, s, col, size=28, fg="white", sub=None):
    d.rounded_rectangle([x, y, x + w, y + h], 16, fill=col)
    lines = s.split("\n")
    lh = size + 6
    total = lh * len(lines) + (size - 6 if sub else 0)
    ty = y + (h - total) / 2
    for ln in lines:
        d.text((x + w / 2, ty), ln, font=F(size), fill=fg, anchor="ma")
        ty += lh
    if sub:
        d.text((x + w / 2, ty), sub, font=F(size - 8), fill=fg, anchor="ma")

def arrow(d, x1, y1, x2, y2, col=INK, wd=5):
    d.line([x1, y1, x2, y2], fill=col, width=wd)
    v = np.array([x2 - x1, y2 - y1], float); n = np.linalg.norm(v)
    if n == 0: return
    v /= n; p = np.array([-v[1], v[0]]); t = np.array([x2, y2], float)
    a = t - v * 22 + p * 11; b = t - v * 22 - p * 11
    d.polygon([tuple(t), tuple(a), tuple(b)], fill=col)

def title(d, s):
    text(d, 40, 28, s, 40, INK, bold=True)
    d.line([40, 84, 1240, 84], fill=SOFT, width=3)

def bubble(d, x, y, w, h, s, col=GRAY, size=26):
    box(d, x, y, w, h, s, col, size)

# ---------- シーン定義 ----------
# 各 step = (台本, 描画関数, reset)  reset=True なら新しいキャンバス
S = []
def scene(name): S.append({"name": name, "steps": []}); return S[-1]["steps"]
def step(st, say, fn, reset=False): st.append((say, fn, reset))

# 1 タイトル
st = scene("title")
def d_title(d):
    text(d, 640, 170, "Dessa・GPT-Live・Shizuku-Duplex", 60, INK, "ma", True)
    text(d, 640, 270, "なにがちがう？  ― 構造のちがいを図で見る ―", 38, GRAY, "ma")
    box(d, 190, 380, 260, 90, "本体\n(会話する)", PURPLE, 28)
    box(d, 510, 380, 260, 90, "裏モデル\n(調べもの)", GREEN, 28)
    box(d, 830, 380, 260, 90, "入力・出力", GRAY, 28)
step(st, "Dessa、GPT-Live、Shizuku-Duplex。この三つは、何がちがうのでしょう。今回は、仕組みの構造のちがいを、図で見ていきます。", d_title, True)

# 2 用語の準備
st = scene("terms")
def d_t1(d):
    title(d, "まず言葉の準備① 音声対話AI")
    box(d, 60, 230, 260, 110, "あなたの声", GRAY, 32)
    box(d, 460, 210, 360, 150, "音声対話AI", PURPLE, 38)
    box(d, 960, 230, 260, 110, "AIの声", GRAY, 32)
    arrow(d, 320, 285, 455, 285); arrow(d, 820, 285, 955, 285)
    text(d, 640, 420, "声で話しかけると、声で答えてくれるAI", 34, INK, "ma")
step(st, "まず言葉の準備です。音声対話AIとは、声で話しかけると、声で答えてくれるAIのことです。", d_t1, True)
def d_t2(d):
    title(d, "まず言葉の準備② 本体と裏モデル、色の見方")
    box(d, 60, 130, 330, 110, "本体", PURPLE, 38)
    text(d, 430, 160, "会話を受け持つAI", 32)
    box(d, 60, 280, 330, 110, "裏モデル", GREEN, 38)
    text(d, 430, 310, "調べものを手伝うAI", 32)
    box(d, 60, 430, 330, 110, "入力・出力", GRAY, 38)
    text(d, 430, 460, "聞く声と、返す声", 32)
    text(d, 900, 160, "紫", 60, PURPLE, "ma", True); text(d, 900, 300, "緑", 60, GREEN, "ma", True); text(d, 900, 450, "灰", 60, GRAY, "ma", True)
step(st, "この動画では、会話を受け持つAIを「本体」、調べものを手伝うAIを「裏モデル」と呼びます。", d_t2, True)
step(st, "色は、紫が本体、緑が裏モデル、灰色が入力と出力です。", lambda d: None)
def d_t3(d):
    title(d, "まず言葉の準備③ トークンとLLM")
    toks = ["京", "都", "の", "お", "す", "す", "め"]
    for i, t in enumerate(toks):
        box(d, 60 + i * 80, 150, 70, 70, t, GRAY, 34)
    text(d, 60, 235, "トークン = AIが扱う、文字や音の細かい単位", 28, GRAY)
    arrow(d, 620, 185, 740, 185)
    box(d, 745, 125, 220, 120, "LLM", PURPLE, 42)
    arrow(d, 965, 185, 1075, 185)
    box(d, 1080, 150, 90, 70, "は", ORANGE, 34); box(d, 1175, 150, 70, 70, "…", ORANGE, 34)
    text(d, 640, 330, "LLM（大規模言語モデル）", 38, INK, "ma", True)
    text(d, 640, 390, "トークンを入れると、続きのトークンを出すAI", 34, INK, "ma")
step(st, "もうひとつ。AIは、文字や音を、トークンという細かい単位に切って扱います。", d_t3, True)
step(st, "LLM、つまり大規模言語モデルは、トークンを入れると、続きのトークンを出す仕組みです。", lambda d: None)

# 3 構造の比較
st = scene("compare")
ROWS = {"dessa": 100, "gpt": 225, "shizuku": 405}
def row(d, key, name, note, with_back=True):
    t = ROWS[key]
    text(d, 40, t + 8, name, 30, INK, bold=True)
    text(d, 40, t + 48, note, 21, GRAY)
    box(d, 330, t, 150, 70, "音声入力", GRAY, 24)
    box(d, 560, t, 220, 70, "本体", PURPLE, 30)
    box(d, 860, t, 150, 70, "音声出力", GRAY, 24)
    arrow(d, 480, t + 35, 555, t + 35); arrow(d, 780, t + 35, 855, t + 35)
    if with_back:
        box(d, 560, t + 100, 220, 60, "裏モデル", GREEN, 26)
        arrow(d, 625, t + 72, 625, t + 98, GREEN); arrow(d, 715, t + 98, 715, t + 74, GREEN)
        text(d, 600, t + 118, "依頼", 20, GREEN, "ra"); text(d, 740, t + 118, "結果", 20, GREEN, "la")
step(st, "ではまず、Dessaです。本体が一つだけで、聞くところから話すところまで、すべて一人でやります。裏のモデルはいません。",
     lambda d: (title(d, "3つの構造をならべる"), row(d, "dessa", "Dessa", "本体1つで全部", False)), True)
def d_dessa_note(d):
    box(d, 1040, ROWS["dessa"] - 2, 200, 74, "テキストなし", ORANGE, 24)
step(st, "しかも、文字を使いません。人間の会話の音声だけで学習して、知識も受け答えも、音声から身につけたと、Blockは言っています。", d_dessa_note)
step(st, "次に、GPT-Live。会話専用の本体と、調べもの担当の裏モデルに、役割が分かれています。",
     lambda d: row(d, "gpt", "GPT-Live", "本体 + 裏モデル"))
step(st, "Shizuku-Duplexも同じです。本体と裏モデルの二人体制になっています。",
     lambda d: row(d, "shizuku", "Shizuku-Duplex", "本体 + 裏モデル"))

# 4 二人体制の流れ
st = scene("flow")
def f_base(d):
    title(d, "本体と裏モデルの分担")
    box(d, 540, 150, 240, 90, "本体", PURPLE, 34)
    box(d, 540, 410, 240, 90, "裏モデル", GREEN, 34)
def f1(d):
    f_base(d)
    bubble(d, 40, 150, 330, 90, "「京都のおすすめは？」", GRAY, 26)
    arrow(d, 370, 195, 535, 195)
    arrow(d, 660, 242, 660, 405, GREEN, 6)
    text(d, 690, 310, "検索が必要 → 依頼する", 26, GREEN)
step(st, "二人体制の動きを見てみましょう。「京都のおすすめは？」と聞かれた本体は、検索が必要だと判断して、裏モデルに依頼します。", f1, True)
def f2(d):
    d.rectangle([675, 285, 1000, 345], fill=BG)
    arrow(d, 660, 242, 660, 405, GREEN, 6)
    box(d, 330, 290, 660, 50, "DELEGATE（依頼の合図となる特別なトークン）", ORANGE, 24)
step(st, "Shizuku-Duplexでは、このとき本体が、DELEGATEという特別なトークンを出します。依頼の合図です。", f2)
def f3(d):
    arrow(d, 785, 195, 910, 195)
    bubble(d, 915, 150, 320, 90, "「えーと、探してみますね」", GRAY, 24)
    text(d, 660, 520, "検索中…", 28, GREEN, "ma")
step(st, "裏モデルが検索している間も、本体は「えーと、探してみますね」としゃべり続けます。", f3)
def f4(d):
    d.rectangle([320, 285, 1005, 350], fill=BG)
    arrow(d, 640, 242, 640, 405, GREEN, 6)
    arrow(d, 700, 405, 700, 245, GREEN, 6)
    text(d, 720, 310, "結果が返る", 26, GREEN)
    d.rectangle([560, 505, 760, 560], fill=BG)
    bubble(d, 915, 260, 320, 90, "「京都なら…」", GRAY, 26)
    arrow(d, 785, 215, 910, 290)
    text(d, 1075, 365, "自分の言葉で話す", 24, GRAY, "ma")
step(st, "結果が返ってきたら、本体が自分の言葉で話します。", f4)
def f5(d):
    box(d, 250, 535, 780, 40, "調べている間も無言にならない", PURPLE, 24)
step(st, "この分担のおかげで、調べている間に無言になる問題が起きません。", f5)

# 5 LLMがなぜ声を出せるか
st = scene("voice")
def v1(d):
    title(d, "LLMなのに、なぜ声が出せる？")
    text(d, 640, 150, "LLM = トークンを入れて、トークンを出す", 36, INK, "ma")
    toks = ["文字トークン", "音声トークン"]
    box(d, 240, 260, 340, 100, "文字トークン", GRAY, 34)
    box(d, 700, 260, 340, 100, "音声トークン", ORANGE, 34)
    text(d, 640, 295, "＋", 56, INK, "ma", True)
    text(d, 640, 420, "音のトークンも出せるように、LLMを拡張してある", 34, PURPLE, "ma", True)
step(st, "ここで疑問です。LLMは、トークンを入れてトークンを出す仕組みなのに、どうして声が出せるのでしょう。答えは、音のトークンも出せるように、拡張してあるからです。", v1, True)
def v2(d):
    title(d, "ブログの図6の流れ ① 入力 → ② 出力")
    box(d, 40, 130, 230, 110, "ユーザーの音声", GRAY, 26)
    box(d, 330, 130, 290, 110, "音声エンコーダ", GRAY, 28, sub="音 → 特徴量(数字の並び)")
    box(d, 690, 130, 300, 110, "Transformer", PURPLE, 32, sub="LLMの中心部分")
    arrow(d, 270, 185, 325, 185); arrow(d, 620, 185, 685, 185)
    box(d, 1030, 130, 210, 110, "前の瞬間の\n自分の出力", GRAY, 22)
    arrow(d, 1030, 185, 995, 185)
step(st, "流れはこうです。入力側では、ユーザーの音声を、音声エンコーダという部品で特徴量、つまり数字の並びに変えて、Transformerに入れます。", v2, True)
step(st, "前の瞬間に自分が出した、テキストと音声トークンも、一緒に入れます。", lambda d: None)
def v3(d):
    text(d, 165, 298, "② 出力", 26, INK, bold=True)
    box(d, 40, 345, 200, 120, "Transformer", PURPLE, 26, sub="テキストを出す")
    arrow(d, 840, 242, 840, 290, INK); d.line([840, 290, 140, 290], fill=INK, width=5); arrow(d, 140, 290, 140, 340)
    box(d, 300, 345, 220, 120, "テキスト", LPURPLE, 28, sub="inner monologue")
    arrow(d, 240, 405, 295, 405)
step(st, "出力側では、Transformerがまず、テキストを出します。これがインナーモノローグ、頭の中で考えている言葉にあたります。", v3)
def v4(d):
    box(d, 580, 345, 230, 120, "Local\nTransformer", PURPLE, 26)
    arrow(d, 520, 405, 575, 405)
    box(d, 870, 345, 180, 120, "音声\nトークン", ORANGE, 26)
    arrow(d, 810, 405, 865, 405)
step(st, "次に、小さなLocal Transformerが、音声トークンを出します。", v4)
def v5(d):
    box(d, 1090, 345, 150, 120, "audio\ndecoder", GRAY, 24)
    arrow(d, 1050, 405, 1085, 405)
    text(d, 1165, 480, "→ 波形(声)", 24, GRAY, "ma")
step(st, "最後に、audio decoderが、音声トークンを波形、つまり実際の音に戻します。", v5)
def v6(d):
    box(d, 120, 525, 1040, 44, "LLMが波形を直接出すのではなく、「音声トークンまで出せるLLM」+「波形に戻す部品」", PURPLE, 22)
step(st, "つまりLLM本体が、波形を直接出しているわけではありません。音声トークンまで出せるよう拡張したLLMと、トークンを波形にする部品の組み合わせです。", v6)

# 6 80ms
st = scene("80ms")
def frames(d, n):
    for i in range(n):
        x = 40 + i * 195
        box(d, x, 190, 180, 100, "80ms", PURPLE, 34)
def m1(d):
    title(d, "80ミリ秒とは？")
    frames(d, 1)
    text(d, 40, 310, "= 1回の処理の単位(1フレーム)", 26, INK)
    text(d, 40, 400, "返事までの遅れ、ではない", 36, ORANGE, bold=True)
step(st, "次は80ミリ秒。これは返事までの遅れではなく、一回の処理の単位、一フレームの長さです。", m1, True)
def m2(d):
    d.rectangle([0, 100, W, 560], fill=BG)
    title(d, "毎フレーム、聞く と 話す を同時に")
    frames(d, 6)
    for i in range(6):
        x = 40 + i * 195
        text(d, x + 90, 305, "聞く＋話す", 24, INK, "ma")
    text(d, 640, 400, "……を延々とくり返す", 34, INK, "ma", True)
    text(d, 640, 460, "聞くと話すを同時に進めるしくみ = 全二重", 32, PURPLE, "ma", True)
step(st, "80ミリ秒ぶんの音を聞いて、80ミリ秒ぶんの音を出す。これを延々と繰り返しています。聞くと話すを同時に進めることを、全二重と呼びます。", m2)
def m3(d):
    d.rectangle([0, 100, W, 560], fill=BG)
    title(d, "なにが大変？")
    box(d, 60, 150, 220, 90, "LLMの\n1回の処理", PURPLE, 26)
    text(d, 310, 175, "≦ 80ms", 50, ORANGE, bold=True)
    text(d, 60, 280, "これより遅いと、リアルタイムの会話に追いつけない", 32, INK)
    text(d, 60, 360, "そのため最適化したと、ブログに書いてある", 30, GRAY)
    box(d, 60, 420, 260, 70, "TensorRT", GRAY, 30); box(d, 350, 420, 360, 70, "Tritonカーネル", GRAY, 30)
step(st, "大変なのは、一回の処理を80ミリ秒以内に終えないと、リアルタイムの会話に追いつかなくなることです。そのためにTensorRTやTritonカーネルで最適化したと、ブログに書かれています。", m3, True)
def m4(d):
    title(d, "実際の返答までの時間は、別の数字")
    text(d, 40, 130, "話し終わってから返事までの中央値", 30, GRAY)
    text(d, 40, 215, "Shizuku-Duplex", 28, INK)
    d.rounded_rectangle([320, 205, 320 + 0.57 * 1100, 255], 10, fill=PURPLE); text(d, 320 + 0.57 * 1100 + 15, 208, "0.57秒", 34, INK, bold=True)
    text(d, 40, 305, "GPT-Live", 28, INK)
    d.rounded_rectangle([320, 295, 320 + 0.53 * 1100, 345], 10, fill=GRAY); text(d, 320 + 0.53 * 1100 + 15, 298, "0.53秒", 34, INK, bold=True)
step(st, "実際の返答までの時間は別の数字で、話し終わってから返事までの中央値が、Shizuku-Duplexは0.57秒、GPT-Liveは0.53秒です。", m4, True)
def m5(d):
    text(d, 40, 400, "・80ms刻みは、全二重のMoshiなども使っている", 30, INK)
    text(d, 40, 450, "  → Shizuku独自の発明ではない", 30, GRAY)
    text(d, 40, 505, "・モデルの大きさ、使ったGPUは、ブログに書かれていない", 30, INK)
step(st, "なお、80ミリ秒刻みは、全二重モデルのMoshiなども使っていて、Shizuku独自の発明ではありません。モデルの大きさや使ったGPUは、ブログに書かれていませんでした。", m5)

# 7 Shizuku独自
st = scene("shizuku")
def card(d, x, y, n, head, body, col):
    d.rounded_rectangle([x, y, x + 585, y + 215], 18, fill="white", outline=col, width=4)
    d.ellipse([x + 16, y + 16, x + 66, y + 66], fill=col)
    text(d, x + 41, y + 20, str(n), 34, "white", "ma", True)
    text(d, x + 85, y + 22, head, 28, INK, bold=True)
    for i, ln in enumerate(body):
        text(d, x + 24, y + 85 + i * 38, ln, 24, INK)
def s1(d):
    title(d, "Shizuku-Duplexならではの4点")
    card(d, 40, 110, 1, "聞く・話すを同時に", ["80msごとに、聞く・話すを1回ずつ進める。", "話し始めも、黙るタイミングも", "モデルが自分で決める。"], PURPLE)
step(st, "一つ目。80ミリ秒ごとに、聞くと話すを同時に一回ずつ進めます。話し始めるタイミングも、黙るタイミングも、モデルが自分で決めます。", s1, True)
def s2(d):
    card(d, 655, 110, 2, "話す前に、文字で書き出す", ["声を出す少し前に、言う内容をテキストに。", "人間でいう「頭の中で考えながら話す」", "= inner monologue"], ORANGE)
step(st, "二つ目。声を出す少し前に、言う内容を文字で書き出してから、音声にします。人間でいう、頭の中で考えながらしゃべる感じ。これがインナーモノローグです。", s2)
def s3(d):
    card(d, 40, 345, 3, "表情・動きも同じ時間軸", ["声だけでなく、Live2Dの表情や動きも出す。", "文ごとに表情がパッと変わる", "不自然さがなくなる。"], GREEN)
step(st, "三つ目。声だけでなく、Live2Dという、キャラクターを動かす技術の表情や動きも、同じ時間軸で出します。文ごとに表情がパッと切り替わる、不自然さがなくなります。", s3)
def s4(d):
    card(d, 655, 345, 4, "約5分ごとに要約", ["会話を要約して、コンテキスト", "(AIが覚えている会話の範囲)を組み直す。", "長話しても品質が落ちにくい。"], GRAY)
step(st, "四つ目。約5分ごとに会話を要約して、コンテキスト、つまりAIが覚えている会話の範囲を組み直します。長く話しても、品質が落ちにくくなります。", s4)

# 8 まとめ
st = scene("summary")
def sm_base(d):
    title(d, "まとめ")
def sm1(d):
    sm_base(d)
    box(d, 40, 120, 280, 90, "Dessa", PURPLE, 34)
    text(d, 350, 140, "テキストなしでどこまで行けるか、の研究寄りの実験", 28)
step(st, "まとめです。Dessaは、テキストなしでどこまで行けるか、という研究寄りの実験です。", sm1, True)
def sm2(d):
    box(d, 40, 250, 280, 90, "GPT-Live", PURPLE, 34)
    text(d, 350, 270, "賢い助っ人(ツール)として使う用途", 28)
step(st, "GPT-Liveは、賢い助っ人、つまりツールとして使う用途です。", sm2)
def sm3(d):
    box(d, 40, 380, 280, 90, "Shizuku-Duplex", PURPLE, 30)
    text(d, 350, 385, "日本語で、キャラが生きているように見せる用途", 28)
    text(d, 350, 428, "構造はGPT-Liveに近い。キャラ用の動作出力が足されている", 24, GRAY)
step(st, "Shizuku-Duplexは、日本語で、キャラが生きているように見せる用途。構造はGPT-Liveに近く、キャラ用の動作出力が足されています。", sm3)
def sm4(d):
    box(d, 120, 505, 1040, 56, "ちがいは「裏モデルがいるか」と「出力が声だけか、動きまであるか」", ORANGE, 28)
step(st, "構造のちがいは、本体が一人か、裏モデルがいるか。そして出力が、声だけか、キャラの動きまであるか。以上です。", sm4)

# ---------- 読み上げ ----------
READ = [("GPT-Live", "ジーピーティー ライブ"), ("Shizuku-Duplex", "シズク デュプレックス"), ("Shizuku", "シズク"),
        ("Dessa", "デッサ"), ("DELEGATE", "デリゲート"), ("Live2D", "ライブツーディー"), ("LLM", "エルエルエム"),
        ("TensorRT", "テンサーアールティー"), ("Triton", "トリトン"), ("Local Transformer", "ローカルトランスフォーマー"),
        ("Transformer", "トランスフォーマー"), ("audio decoder", "オーディオデコーダ"), ("Moshi", "モシ"),
        ("Block", "ブロック"), ("GPU", "ジーピーユー"), ("AI", "エーアイ"), ("0.57", "ゼロ点五七"), ("0.53", "ゼロ点五三"),
        ("80", "八十"), ("5分", "五分"), ("全二重", "ぜんにじゅう"), ("音声エンコーダ", "音声エンコーダー"), ("特徴量", "とくちょうりょう")]
def yomi(s):
    for a, b in READ: s = s.replace(a, b)
    return s

# ---------- 字幕 ----------
def wrap_raw(s, size, maxw):
    f = F(size); lines, cur = [], ""
    for ch in s:
        if f.getlength(cur + ch) > maxw and cur: lines.append(cur); cur = ch
        else: cur += ch
    if cur: lines.append(cur)
    return lines

def wrap(s, size, maxw):
    """2行以内に収まるなら、読点(、)や括弧の切れ目で、なるべく均等に折る。"""
    f = F(size)
    if f.getlength(s) <= maxw: return [s]
    best = None
    for i, ch in enumerate(s):
        if ch in "、」。" and 0 < i < len(s) - 1:
            a, b = s[:i + 1], s[i + 1:]
            wa, wb = f.getlength(a), f.getlength(b)
            if max(wa, wb) <= maxw:
                score = abs(wa - wb)
                if best is None or score < best[0]: best = (score, [a, b])
    if best: return best[1]
    lines = wrap_raw(s, size, maxw)
    if len(lines) == 2:   # 切れ目が無いときは均等割り(行頭の句読点は前の行へ)
        lo, hi = 300, maxw
        while lo < hi:
            mid = (lo + hi) // 2
            if len(wrap_raw(s, size, mid)) <= 2: hi = mid
            else: lo = mid + 1
        lines = wrap_raw(s, size, lo)
    out = []
    for ln in lines:
        while ln and ln[0] in "、。」）" and out: out[-1] += ln[0]; ln = ln[1:]
        out.append(ln)
    return out

SPK_LABEL = {"解": ("解説", PURPLE), "相": ("相方", GREEN)}

def render(canvas_fn_list, sub, spk="解"):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for fn in canvas_fn_list: fn(d)
    if VV_CREDIT: d.text((W - 16, SUB_TOP - 28), "音声: " + VV_CREDIT, font=F(20), fill=GRAY, anchor="ra")
    d.rectangle([0, SUB_TOP, W, H], fill="#111827")
    # 話者ラベル(解説=紫 / 相方=緑)
    label, col = SPK_LABEL[spk]
    lw = 150
    d.rounded_rectangle([40, SUB_TOP + 40, 40 + lw, H - 40], 14, fill=col)
    d.text((40 + lw / 2, SUB_TOP + (H - SUB_TOP) / 2), label, font=F(30), fill="white", anchor="mm")
    lines = wrap(sub, 32, 1000)
    lh = 42; y0 = SUB_TOP + (H - SUB_TOP - lh * len(lines)) / 2
    for i, ln in enumerate(lines):
        d.text((640 + lw / 2 + 10, y0 + i * lh), ln, font=F(32), fill="white", anchor="ma")
    return im

# ---------- 掛け合い(話者の割り当て) ----------
# 行頭に「解：」(解説役) か「相：」(相方) を付けると、その行の話者になる。
# 付けない行は直前の話者(最初は解説役)。
SPK_RE = re.compile(r"^\s*([解相])[:：]\s*(.*)$")
def parse_say(say):
    """台本の1ステップを [(話者, 文)] の列にする。文は「。」で区切り、短い文は次とつなげる。"""
    out, cur = [], "解"
    for line in say.split("\n"):
        if not line.strip(): continue
        m = SPK_RE.match(line)
        if m: cur, line = m.group(1), m.group(2)
        sents = []
        for t in re.findall(r"[^。]+。?", line):
            if sents and len(sents[-1]) < 14: sents[-1] += t
            else: sents.append(t)
        out += [(cur, x.strip()) for x in sents if x.strip()]
    return out

# ---------- 音声 ----------
# 解説役: VOICEVOX_SPEAKER(例 ナースロボ＿タイプＴ) / 相方: VOICEVOX_SPEAKER2(既定「ランダム」= メンバーから毎回ランダム)
# 相方を固定するなら名前を指定する(例 里石ユカ)。
# VOICEVOX_URL(既定 http://127.0.0.1:50021) / VOICEVOX_STYLE(既定 ノーマル) も指定できる。
# 未指定なら pyopenjtalk(棒読み)を使う。相方は速さを変えて区別する。
import io, json, urllib.parse, urllib.request, hashlib
VV_URL = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021")
# 相方のメンバー(VOICEVOXの話者名)。VOICEVOX_SPEAKER2 が未指定・「ランダム」なら、毎回この中から1人をランダムに選ぶ。
MEMBERS = ["玄野武宏", "白上虎太郎", "青山龍星", "冥鳴ひまり", "九州そら", "ちび式じい", "櫻歌ミコ", "小夜/SAYO",
           "ナースロボ＿タイプＴ", "あんこもん", "夜語トバリ", "暁記ミタマ", "里石ユカ"]
import random
_sub = os.environ.get("VOICEVOX_SPEAKER2", "ランダム")
_main = os.environ.get("VOICEVOX_SPEAKER", "")
if _sub in ("", "ランダム"):
    _pool = [m for m in MEMBERS if not (_main and _main in m)] or MEMBERS
    _sub = random.choice(_pool)
    print("相方(ランダム):", _sub, file=sys.stderr)
VV_NAMES = {"解": _main, "相": _sub}
VV_STYLE = os.environ.get("VOICEVOX_STYLE", "ノーマル")
VV_CREDIT = ""
VV_IDS = {}   # 話者名 -> style id

def vv_call(path, data=None, query=None):
    url = VV_URL + path + ("?" + urllib.parse.urlencode(query) if query else "")
    req = urllib.request.Request(url, data=data, method="POST" if data is not None or query else "GET",
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=120).read()

def vv_resolve(name):
    """話者名の一部から VOICEVOX の style id を決める。見つからなければ一覧を出して止まる。"""
    if name in VV_IDS: return VV_IDS[name]
    speakers = json.loads(vv_call("/speakers"))
    hit = [sp for sp in speakers if name in sp["name"]]
    if not hit:
        names = ", ".join(sp["name"] for sp in speakers)
        sys.exit(f"VOICEVOX に '{name}' が見つからない。使える話者: {names}")
    sp = hit[0]
    st = next((x for x in sp["styles"] if x["name"] == VV_STYLE), sp["styles"][0])
    print("VOICEVOX:", sp["name"], st["name"], st["id"], file=sys.stderr)
    VV_IDS[name] = st["id"]
    return st["id"]

def setup_voices():
    """使う話者を最初に確定し、クレジットを作る(描画より前に決める)。"""
    global VV_CREDIT
    real = []
    for k in ("解", "相"):
        if VV_NAMES[k]:
            vv_resolve(VV_NAMES[k])
            real.append(next(sp["name"] for sp in json.loads(vv_call("/speakers")) if VV_NAMES[k] in sp["name"]))
    if real:
        VV_CREDIT = " / ".join(f"VOICEVOX:{n}" for n in dict.fromkeys(real))

def tts(s, spk="解"):
    """文ごとの音声をディスクにキャッシュ(同じ文・同じ話者なら再合成しない)。"""
    key = hashlib.sha1((spk + VV_NAMES[spk] + VV_STYLE + yomi(s)).encode()).hexdigest()
    cp = os.path.join(OUT, "ttscache"); os.makedirs(cp, exist_ok=True); cf = os.path.join(cp, key + ".npz")
    if os.path.exists(cf):
        z = np.load(cf); return z["x"], int(z["sr"])
    x, sr = tts_raw(s, spk)
    np.savez(cf, x=x, sr=sr); return x, sr

def tts_raw(s, spk="解"):
    if VV_NAMES[spk]:
        sid = vv_resolve(VV_NAMES[spk])
        q = vv_call("/audio_query", query={"text": yomi(s), "speaker": sid})
        wav = vv_call("/synthesis", data=q, query={"speaker": sid})
        with wave.open(io.BytesIO(wav)) as w:
            sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
        return x, sr
    x, sr = pyopenjtalk.tts(yomi(s), speed=1.0 if spk == "解" else 1.15)
    x = x.astype(np.float32) / 32768.0 if x.dtype != np.float32 else x
    return x, sr

def main():
    fdir = os.path.join(OUT, "frames"); os.makedirs(fdir, exist_ok=True)
    setup_voices()
    audio, listing, sr0, idx = [], [], None, 0
    for sc in S:
        fns = []
        for say, fn, reset in sc["steps"]:
            if reset: fns = []
            fns.append(fn)
            for spk, sent in parse_say(say):
                x, sr = tts(sent, spk); sr0 = sr
                pad = np.zeros(int(sr * 0.45), np.float32)
                clip = np.concatenate([x, pad]); audio.append(clip)
                p = os.path.join(fdir, f"f{idx:03d}.png")
                render(fns, sent.rstrip("。"), spk).save(p)
                listing.append((p, len(clip) / sr)); idx += 1
        print("scene", sc["name"], "ok", file=sys.stderr)
    wav = np.concatenate(audio)
    wp = os.path.join(OUT, "voice.wav")
    with wave.open(wp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0)
        w.writeframes((np.clip(wav, -1, 1) * 32767).astype(np.int16).tobytes())
    lp = os.path.join(OUT, "list.txt")
    with open(lp, "w") as f:
        for p, dur in listing: f.write(f"file '{p}'\nduration {dur:.3f}\n")
        f.write(f"file '{listing[-1][0]}'\n")
    mp = os.path.join(OUT, os.environ.get("OUT_NAME", "explain.mp4"))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lp, "-i", wp,
                    "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-c:a", "aac", "-b:a", "160k", "-shortest", mp], check=True)
    print("done", mp, f"{len(wav)/sr0:.1f}s")

if __name__ == "__main__":
    main()
