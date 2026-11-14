# Bahasa Indonesia localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Indonesian artwork was generated or replaced. Every
Indonesian string below is a proposal that needs a native speaker (and, where flagged, medical/editorial review)
before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian,
German and Chinese specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply
unchanged to Indonesian.

## Current behaviour (shipped)

Indonesian has no artwork of its own. `resolveEditorialImage(set, 'id')` returns the **English** variant, and the spoken
description (`EDITORIAL_IMAGE_ALT.*.id`) says that the lettering in the picture is English
(«Tulisan pada gambar berbahasa Inggris: “…”»), so the app never presents English lettering as Indonesian. The missing
assets are listed by `EDITORIAL_IMAGES_MISSING_INDONESIAN` (`src/i18n/editorialImages.ts`) and pinned by
`PhaseIndonesianLocalization.test.ts`.

## Source images (exact)

| # | Asset base name | Size (px) | Format | Text elements | File to deliver | Used by |
|---|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | cover title (2 lines) | `cycle-phases-hero.id.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | title (2 lines) + subtitle (2 lines) | `grossesse_semiane.id.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | headline (2 lines) + poster (4 lines) | `activité_grossesse.id.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | headline (2 lines) + poster (3 lines) + "2 KG" | `activité.id.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total
size cap of 5 MB is already close).

## Proposals (English → Indonesian)

Indonesian words are longer than English ones (about 15–30 %); keep each block inside the original bounding box with at
least 12 px safe margin, reduce the point size rather than adding lines, and keep the existing Latin typeface family.

| # | Asset | English | Indonesian proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `Tubuh` / `dan siklusnya` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `Perawatan medis` / `selama kehamilan` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `Demi kesehatan ibu` / `dan kesejahteraan bayi` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `Bergerak untuk` / `kehamilan yang sehat` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `IBU YANG` / `SEHAT` / `UNTUK BAYI YANG` / `TUMBUH OPTIMAL` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `Bergerak agar` / `merasa lebih baik` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `TUBUH` / `KESEIMBANGAN` / `ENERGI` | |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (also valid in Indonesian) | none |

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `id: require('../assets/images/library/<base>.id.webp')` to each set
   (`LocalizedImageSet.id` is already optional); `EDITORIAL_IMAGES_MISSING_INDONESIAN` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.id`: replace the «Tulisan pada gambar berbahasa Inggris» sentence by the real Indonesian
   lettering.
3. Tests that pin the current state: `PhaseIndonesianLocalization.test.ts` (`text-in-image illustrations`),
   `PhaseEditorialImageLocalization.test.tsx` (language list / require count), `scripts/validate-editorial-images.py`
   (`LANGS`).
