import {homeColors} from '../home/homeTheme';

// Text colours for the Journal screens' illustrated intro banners (Humeur, Symptômes, Vie intime, Notes personnelles,
// Sommeil, Activité physique, Symptômes de grossesse, Post-partum).
//
// The banner artwork is a fixed, LIGHT photograph (pale lavender / cream / blush on the text side) in every app theme,
// so the text lying on it must be dark ink in Light, Dark and True Black alike. Reading `theme.colors.accent` /
// `textSecondary` there is wrong: in Dark and True Black those resolve to pale lavender, which vanishes on the photo.
// Only the surface BEHIND the text decides the ink, not the app theme (same reasoning as the existing "fixed visual
// island" notes in JournalSleepScreen / JournalActivityScreen).
//
// Measured against the real PNGs (text-side zone, x 4–45 % / y 12–88 %, darkest 1 % of pixels), see
// journalHeroContrast.test.ts: title >= 7.3:1, body >= 5.8:1, accent >= 4.7:1 (WCAG AA is 4.5:1 for normal text).
export const JOURNAL_HERO_INK = {
  /** Banner title. Same value as the app's dark-ink token (`homeColors.textPrimary`). */
  title: homeColors.textPrimary,
  /** Banner description / body copy. */
  body: '#3D3656',
  /** Small coloured elements on the banner (link, icon, badge text); a darker take on the brand violet. */
  accent: '#4A2FB0',
} as const;
