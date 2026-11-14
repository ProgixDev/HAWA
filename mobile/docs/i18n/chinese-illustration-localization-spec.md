# Simplified Chinese localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Chinese artwork was generated. Every Chinese string is
a proposal that needs a native speaker (and, where flagged, medical/editorial review) before it is lettered.

The four images are the ones described, with measured coordinates, safe zones and naming rules, in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md),
[`russian-illustration-localization-spec.md`](russian-illustration-localization-spec.md) and
[`german-illustration-localization-spec.md`](german-illustration-localization-spec.md). Geometry, masters, naming
(note the accented `é`, NFC), and the cropped zones on 320–412 dp phones apply unchanged.

## Current behaviour (shipped)

Chinese has no artwork of its own. `resolveEditorialImage(set, 'zh')` returns the **English** variant, and the spoken
description (`EDITORIAL_IMAGE_ALT.*.zh`) says that the lettering in the picture is English («图中文字为英文：…»).
The missing assets are listed by `EDITORIAL_IMAGES_MISSING_CHINESE` (`src/i18n/editorialImages.ts`) and pinned by
`PhaseChineseLocalization.test.ts`.

## Proposals (characters, English → Chinese)

Chinese lettering is usually shorter than English; a CJK face (Noto Sans SC / Noto Serif SC, SIL OFL) with real
bold must be used; do not use a Latin script face for hanzi.

| # | Asset | English | Chinese proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `身体` / `与它的周期` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `孕期` / `医学照护` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `为妈妈的健康` / `也为宝宝的安康` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `动一动` / `迎接健康的孕期` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `健康的妈妈` / `养育` / `茁壮成长的` / `宝宝` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `动起来` / `感觉更好` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `身体` / `平衡` / `活力` | |
| 4f | dumbbell label | 2 KG | `2 千克` or unchanged `2 KG` | none |

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `zh: require('../assets/images/library/<base>.zh.webp')` to each set
   (`LocalizedImageSet.zh` is already optional); `EDITORIAL_IMAGES_MISSING_CHINESE` empties itself.
2. `EDITORIAL_IMAGE_ALT.*.zh`: replace the "lettering is English" sentence by the real Chinese lettering.
3. Tests that pin the current state: `PhaseChineseLocalization.test.ts` (`text-in-image illustrations`),
   `PhaseEditorialImageLocalization.test.tsx` (language list / require count; total size cap 5 MB is already close),
   `scripts/validate-editorial-images.py` (`LANGS`).
4. WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others.
