// Sizes of "Invitation envoyée" (Pending): the back button, the invitation illustration,
// the title/description, the status card, the two action buttons and (in __DEV__) the
// divider + preview card must all fit in ONE viewport — no scrolling — so every size below
// shrinks smoothly with the window height: s = 0 on a short phone (≤ 600 dp) … 1 on a tall
// one (≥ 860 dp). Mirrors the same lerp approach as awaADeuxBenefitsLayout.ts /
// awaADeuxIntroLayout.ts (the other "fit on one screen" AWA à deux steps).
//
// Pure numbers, no colors: the theme is applied by the screen.

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const half = (value: number) => Math.round(value * 2) / 2;

export const PENDING_SHORT_SCREEN = 600;
export const PENDING_TALL_SCREEN = 860;

export type PendingLayout = {
  heroHeight: number;
  titleFontSize: number;
  titleLineHeight: number;
  bodyMarginTop: number;
  bodyGap: number;
  statusIconSize: number;
  statusClockSize: number;
  statusPaddingVertical: number;
  primaryHeight: number;
  cancelHeight: number;
  dividerMarginVertical: number;
  previewMinHeight: number;
  previewIconSize: number;
  /** StepFit requires this even though Pending has no sticky CTA (no ctaLabel is passed). */
  ctaHeight: number;
};

export function getPendingLayout(height: number): PendingLayout {
  const s = clamp01((height - PENDING_SHORT_SCREEN) / (PENDING_TALL_SCREEN - PENDING_SHORT_SCREEN));
  const lerp = (short: number, tall: number) => half(short + (tall - short) * s);

  const titleFontSize = lerp(22, 26);
  const primaryHeight = lerp(46, 52);

  return {
    heroHeight: lerp(92, 128),
    titleFontSize,
    titleLineHeight: titleFontSize + 6,
    bodyMarginTop: lerp(10, 18),
    bodyGap: lerp(8, 12),
    statusIconSize: lerp(54, 60),
    statusClockSize: lerp(24, 27),
    statusPaddingVertical: lerp(10, 14),
    primaryHeight,
    cancelHeight: lerp(46, 50),
    dividerMarginVertical: lerp(10, 16),
    previewMinHeight: lerp(68, 80),
    previewIconSize: lerp(36, 40),
    ctaHeight: primaryHeight,
  };
}
