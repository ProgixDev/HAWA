# हिन्दी (Hindi) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Hindi artwork was generated or replaced. Every Hindi string
below is a proposal that needs a native speaker (and, where flagged, medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German,
Chinese and Indonesian specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply
unchanged to Hindi.

## Audit result: which images carry language-specific text

| # | Asset base name | Lettering in the picture | Hindi variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — lettering is English in Hindi |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

Every other illustration of the app (all other article covers, onboarding art, the objective icons, anonymous-mode and
profile artwork) contains **no lettering**, so it is reused as it is for Hindi: nothing to translate, nothing to replace.

## Current behaviour (shipped)

Hindi has no artwork of its own. `resolveEditorialImage(set, 'hi')` returns the **English** variant, and the spoken
description (`EDITORIAL_IMAGE_ALT.*.hi`) says that the lettering in the picture is English
(« चित्र में लिखा टेक्स्ट अंग्रेज़ी में है: “…” »), so the app never presents English lettering as Hindi. The missing assets are
listed by `EDITORIAL_IMAGES_MISSING_HINDI` (`src/i18n/editorialImages.ts`) and pinned by `PhaseHindiLocalization.test.ts`.

## Source images (exact)

| # | Asset base name | Size (px) | Format | File to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.hi.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.hi.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.hi.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.hi.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size
cap of 5 MB is already close).

## Proposals (English → Hindi)

| # | Asset | English | Hindi proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `शरीर और` / `उसके चक्र` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `गर्भावस्था में` / `चिकित्सकीय देखभाल` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `माँ की सेहत और` / `शिशु की भलाई के लिए` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `स्वस्थ गर्भावस्था के` / `लिए सक्रिय रहें` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `स्वस्थ माँ` / `सेहतमंद` / `शिशु के` / `लिए` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `अच्छा महसूस` / `करने के लिए हरकत` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `शरीर` / `संतुलन` / `ऊर्जा` | |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (understood as is) | none |

## Typography notes for the designer (Devanagari is not Latin)

* The original lettering uses a Latin typeface that has **no Devanagari glyphs**. Use a Devanagari family with a matching
  tone (Noto Sans Devanagari, OFL, is the one AWA already embeds for PDFs; a Devanagari companion of the artwork's own
  family is better if the licence allows).
* Devanagari has **no upper case**: the English poster lines in capitals must be given their emphasis through weight and size
  instead; do not letter-space Devanagari (it separates vowel signs and conjuncts).
* Vowel signs rise above the headline (shirorekha) and hang below the baseline: use a line height of about 1.4–1.5 x the
  size, and keep 12 px of safe margin above and below each block.
* Hindi lines are 10–25 % longer than the English ones: reduce the size before adding a line, and check the 320–412 dp crops.
* Hindi digits stay Western (`2 KG`).

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `hi: require('../assets/images/library/<base>.hi.webp')` to each set
   (`LocalizedImageSet.hi` is already optional); `EDITORIAL_IMAGES_MISSING_HINDI` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.hi`: replace the « चित्र में लिखा टेक्स्ट अंग्रेज़ी में है » sentence by the real Hindi lettering.
3. Tests that pin the current state: `PhaseHindiLocalization.test.ts` (`images and legal text`),
   `PhaseEditorialImageLocalization.test.tsx` (language list / require count) and `scripts/validate-editorial-images.py`
   (`LANGS`).
