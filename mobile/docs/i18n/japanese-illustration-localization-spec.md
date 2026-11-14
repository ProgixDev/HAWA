# 日本語 (Japanese) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Japanese artwork was generated or replaced. Every Japanese string below is a
proposal that needs a native speaker (and, where flagged, medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German, Chinese, Indonesian, Hindi and
Albanian specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply unchanged to Japanese.

## Audit result: which illustrations carry language-specific text

All illustrations of the app were audited. Only the four below carry lettering inside the picture; **every other illustration** (all other article covers, onboarding
art, the objective icons, anonymous-mode and profile artwork, the palette previews) contains **no lettering**, so it is language-neutral and is reused as it is for Japanese.

| # | Asset base name | Lettering in the picture | Japanese variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — the lettering is English in Japanese |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

## Current behaviour (shipped)

Japanese has no artwork of its own. `resolveEditorialImage(set, 'ja')` returns the **English** variant, and the spoken description
(`EDITORIAL_IMAGE_ALT.*.ja`) says that the lettering in the picture is English (« 画像内の文字は英語です：「…」 »), so the app never presents English
lettering as Japanese. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_JAPANESE` (`src/i18n/editorialImages.ts`) and pinned by
`PhaseJapaneseLocalization.test.ts`.

## Source images (exact)

| # | Asset base name | Size (px) | Format | File to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.ja.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.ja.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.ja.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.ja.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size cap of 5 MB is already close).

## Proposals (English → Japanese)

Japanese is **horizontal** here. A Japanese line is usually shorter than the English one in width (each kana / kanji is one em) but needs **more height**: keep each block inside the
original bounding box with at least 12 px safe margin, allow 1.3–1.4 × line spacing, and do not add lines. Use a Japanese sans typeface of similar weight to the existing lettering
(for example Noto Sans JP or Zen Kaku Gothic New, SIL OFL); **check that every kanji used is in the chosen weights**. Do not break a word across two lines; break after a particle or a
phrase (「からだと／そのサイクル」). Numerals stay Western ("2 KG"). Never mix a Chinese-form kanji: take the glyphs from a Japanese font.

| # | Asset | English | Japanese proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `からだと、` / `そのサイクル` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `妊娠中の` / `医療ケア` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `ママの健康と` / `赤ちゃんの健やかさのために` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `健やかな妊娠のために` / `からだを動かそう` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `元気なママが` / `すこやかな` / `赤ちゃんを` / `育てます` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `からだを動かして` / `心地よく` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `からだ` / `バランス` / `エネルギー` | none |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (understood as is) | none |

Note: Japanese has no capital letters; the posters keep the English poster's visual weight with a bolder cut, not with capitals.

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `ja: require('../assets/images/library/<base>.ja.webp')` to each set (`LocalizedImageSet.ja` is already optional);
   `EDITORIAL_IMAGES_MISSING_JAPANESE` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.ja`: replace the « 画像内の文字は英語です » sentence by the real Japanese lettering.
3. Tests that pin the current state: `PhaseJapaneseLocalization.test.ts` (`images and legal text`), `PhaseEditorialImageLocalization.test.tsx`
   (language list / require count) and `scripts/validate-editorial-images.py` (`LANGS`).
