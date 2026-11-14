# বাংলা (Bengali) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Bengali artwork was generated or replaced. Every Bengali string below is a
proposal that needs a native speaker (and, where flagged, medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German, Chinese, Indonesian, Hindi, Albanian,
Japanese and Korean specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply unchanged to Bengali.

## Audit result: which illustrations carry language-specific text

All illustrations of the app were audited. Only the four below carry lettering inside the picture; **every other illustration** (all other article covers, onboarding
art, the objective icons, anonymous-mode and profile artwork, the palette previews) contains **no lettering**, so it is language-neutral and is reused as it is for Bengali.

| # | Asset base name | Lettering in the picture | Bengali variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — the lettering is English in Bengali |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

## Current behaviour (shipped)

Bengali has no artwork of its own. `resolveEditorialImage(set, 'bn')` returns the **English** variant, and the spoken description
(`EDITORIAL_IMAGE_ALT.*.bn`) says that the lettering in the picture is English (« ছবির লেখাটি ইংরেজিতে: “…” »), so the app never presents English
lettering as Bengali. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_BENGALI` (`src/i18n/editorialImages.ts`).

## Source images (exact)

| # | Asset base name | Size (px) | Format | File to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.bn.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.bn.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.bn.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.bn.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by the existing tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size cap of 5 MB is already close).

## Proposals (English → Bengali)

Bengali is **horizontal** here and uses word spaces, so a line can wrap between words. Bengali needs **more height** than Latin: the conjuncts, vowel signs and the *matra* (the headline bar)
reach about 1.4 × the font size, so keep each block inside the original bounding box with at least 12 px safe margin, allow 1.5 × line spacing, and do not add lines. Use a Bengali sans
typeface of similar weight to the existing lettering (for example Noto Sans Bengali, Hind Siliguri or Anek Bangla, all SIL OFL — **check the license of the chosen face and that every conjunct
used is in it**; the matras of neighbouring letters must join into one continuous bar). Do not break a word across two lines. Numerals stay Western ("2 KG" or "2 কেজি"). Bengali has
no capital letters, so the posters keep the English poster's visual weight with a bolder cut, not with capitals.

| # | Asset | English | Bengali proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `শরীর ও` / `তার চক্র` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `গর্ভাবস্থায়` / `চিকিৎসা যত্ন` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `মায়ের সুস্থতা ও` / `শিশুর ভালো থাকার জন্য` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `সুস্থ গর্ভাবস্থার জন্য` / `শরীর নাড়ান` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `সুস্থ মা` / `সুস্থ শিশুর` / `বেড়ে ওঠার` / `জন্য` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `ভালো থাকতে` / `শরীর নাড়ান` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `শরীর` / `ভারসাম্য` / `শক্তি` | none |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (understood as is) or `2 কেজি` | none |

Check every Bengali line in the real typeface at the final size: a line that fits in English can need 15–25 % more width once conjuncts such as ন্ধ, ক্ষ, স্থ are set, and a descender
from the line above can touch the matra of the line below at 1.3 × spacing.

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `bn: require('../assets/images/library/<base>.bn.webp')` to each set (`LocalizedImageSet.bn` is already optional);
   `EDITORIAL_IMAGES_MISSING_BENGALI` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.bn`: replace the « ছবির লেখাটি ইংরেজিতে » sentence by the real Bengali lettering.
3. Tests that pin the current state: `PhaseBengaliLocalization.test.ts` (`images and legal text`), `PhaseEditorialImageLocalization.test.tsx` (language list / require count) and
   `scripts/validate-editorial-images.py` (`LANGS`).
