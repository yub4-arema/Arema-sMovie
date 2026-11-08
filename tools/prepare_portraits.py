"""立ち絵の素材から、動画用の上半身画像を public/characters/<声ID>/ に書き出す。
  ひまり(14) / ユカ(126): PSD の口レイヤーを切り替えて 0.png(閉じ) 1.png(半開き) 2.png(開き)
  トバリ(118): 表情違いの PNG から face_<名前>.png
使い方: PSD_LIB=<psd-tools の site-packages> python3 -I tools/prepare_portraits.py <ひまりPSD> <ユカPSD> <トバリPNGのディレクトリ> <出力 public/characters>
素材は第三者の著作物。利用規約を確認できたものだけリポジトリに入れる(AGENTS.md)。public/characters/ は .gitignore 済み。
"""
import glob, os, sys
if os.environ.get("PSD_LIB"): sys.path.insert(0, os.environ["PSD_LIB"])
from PIL import Image
from psd_tools import PSDImage

H_OUT = 720  # 出力の高さ(px)

def bust(img, cx, hfrac, aspect=0.9, top=0.0):
    W, H = img.size
    h = hfrac * H; w = min(W, h * aspect)
    x0 = min(max(cx * W - w / 2, 0), W - w); y0 = top * H
    img = img.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))
    return img.resize((round(img.width * H_OUT / img.height), H_OUT), Image.LANCZOS)

def psd_variants(path, group, picks, crop, out):
    os.makedirs(out, exist_ok=True)
    psd = PSDImage.open(path)
    grp = next(l for l in psd.descendants() if l.is_group() and l.name == group)
    for i, pick in enumerate(picks):
        for k in grp: k.visible = False
        target = max([k for k in grp if k.name == pick], key=lambda k: k.size[0] * k.size[1])
        target.visible = True
        img = psd.composite(force=True); img = img.crop(img.getbbox())
        bust(img, **crop).save(os.path.join(out, f"{i}.png")); print(out, i, pick)

def main(himari_psd, yuka_psd, tobari_dir, root):
    psd_variants(himari_psd, "!口", ["*すん", "*う", "*あ"], dict(cx=0.36, hfrac=0.40), f"{root}/14")
    psd_variants(yuka_psd, "口", ["*閉じ", "*口開け", "*あ"], dict(cx=0.50, hfrac=0.30), f"{root}/126")
    out = f"{root}/118"; os.makedirs(out, exist_ok=True)
    faces = {"default": "8語り", "joy": "1喜", "ok": "5納得", "trouble": "6困", "angry": "2怒", "sad": "3哀"}
    for key, name in faces.items():
        f = [x for x in glob.glob(f"{tobari_dir}/**/*座り_{name}.png", recursive=True) if "赤面" not in x][0]
        bust(Image.open(f).convert("RGBA"), cx=0.38, hfrac=0.40).save(f"{out}/face_{key}.png"); print(out, key, name)

if __name__ == "__main__":
    main(*sys.argv[1:5])
