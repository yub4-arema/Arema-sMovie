// Material 3 Expressive デザイントークン(ダークテーマ・ベースラインのパープルシード)
// 色・シェイプ・フォントはここに集約する。コンポーネントに直書きしない。ルールは DESIGN.md を参照。

export const C = {
  surface: "#141218", onSurface: "#E6E0E9", onSurfaceVariant: "#CAC4D0",
  surfaceContainer: "#211F26", surfaceContainerHigh: "#2B2930", outline: "#938F99",
  primary: "#D0BCFF", onPrimary: "#381E72", primaryContainer: "#4F378B", onPrimaryContainer: "#EADDFF",
  secondary: "#CCC2DC", onSecondary: "#332D41", secondaryContainer: "#4A4458", onSecondaryContainer: "#E8DEF8",
  tertiary: "#EFB8C8", onTertiary: "#492532", tertiaryContainer: "#633B48", onTertiaryContainer: "#FFD8E4",
};
export const FONT = "'Noto Sans CJK JP','Noto Sans JP','IPAexGothic',sans-serif";
export type Tone = "primary" | "secondary" | "tertiary";
export const tone = (t: Tone) => ({
  primary: {fg: C.primary, bg: C.primaryContainer, on: C.onPrimaryContainer},
  secondary: {fg: C.secondary, bg: C.secondaryContainer, on: C.onSecondaryContainer},
  tertiary: {fg: C.tertiary, bg: C.tertiaryContainer, on: C.onTertiaryContainer},
}[t]);

export const FPS = 30;

// シェイプ: 角丸スケール(px)
export const SHAPE = {medium: 24, large: 40, extraLarge: 56, xxl: 64, full: 999};

// クッキー型(波打つ円)の SVG パス。n=山の数、amp=山の高さ、rot=回転
export const cookie = (cx: number, cy: number, r: number, n: number, amp: number, rot: number) => {
  let d = "";
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2, rr = r + amp * Math.cos(n * t + rot);
    d += (i ? "L" : "M") + (cx + rr * Math.cos(t)).toFixed(1) + " " + (cy + rr * Math.sin(t)).toFixed(1);
  }
  return d + "Z";
};
