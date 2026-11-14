# Português (Portugal and Brasil) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Portuguese artwork was generated or replaced. Every Portuguese string below is a proposal that needs a native speaker of each variant (and, where flagged,
medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in [`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German,
Chinese, Indonesian, Hindi, Albanian, Japanese and Korean specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply unchanged to Portuguese.

## Audit result: which illustrations carry language-specific text
All illustrations of the app were audited. Only the four below carry lettering inside the picture; **every other illustration** (all other article covers, onboarding art, the objective icons, anonymous-mode and profile
artwork, the palette previews) contains **no lettering**, so it is language-neutral and is reused as it is for Portuguese.

| # | Asset base name | Lettering in the picture | Portuguese variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — the lettering is English in Portuguese |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

## Current behaviour (shipped)
Portuguese has no artwork of its own. `resolveEditorialImage(set, 'pt-PT' | 'pt-BR')` returns the **English** variant, and the spoken description (`EDITORIAL_IMAGE_ALT.*['pt-PT' | 'pt-BR']`) says that the lettering in the
picture is English (« O texto na imagem está em inglês: “…” »), so the app never presents English lettering as Portuguese. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_PORTUGUESE`
(`src/i18n/editorialImages.ts`) and pinned by `PhasePortugueseLocalization.test.ts`.

## Source images (exact)
| # | Asset base name | Size (px) | Format | Files to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.pt-PT.webp` (+ `.pt-BR.webp` only if a line differs) | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.pt-PT.webp` / `.pt-BR.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.pt-PT.webp` / `.pt-BR.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.pt-PT.webp` / `.pt-BR.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size cap of 5 MB is already close). Because the lettering is short, **one file per image can serve both
variants** when the chosen wording is correct in Portugal and in Brazil (see the “Both” column); only the lines marked PT / BR need a second file.

## Proposals (English → Portuguese)
Portuguese is horizontal, uses accents (á à â ã é ê í ó ô õ ú ç) that must be present in the chosen typeface and weights, and its lines are about 10–20 % longer than the English ones: keep each block inside the original bounding
box with at least 12 px safe margin, do not add lines, never break a word, break after an article or a preposition. Use a humanist sans of similar weight to the existing lettering (for example Nunito Sans, Open Sans or Montserrat,
SIL OFL). Numerals stay Western ("2 KG").

| # | Asset | English | Portugal (pt-PT) | Brasil (pt-BR) | Flag |
|---|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `O corpo` / `e os seus ciclos` | `O corpo` / `e os seus ciclos` | Both |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `Cuidados médicos` / `durante a gravidez` | `Cuidados médicos` / `durante a gravidez` | Both · NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `Pela saúde da mãe` / `e o bem-estar do bebé` | `Pela saúde da mãe` / `e o bem-estar do bebê` | **BR differs** (*bebê*) |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `Mexa-se por` / `uma gravidez saudável` | `Movimente-se por` / `uma gravidez saudável` | **BR differs** (usual verb) |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `UMA MÃE` / `SAUDÁVEL` / `PARA UM BEBÉ` / `A CRESCER BEM` | `UMA MÃE` / `SAUDÁVEL` / `PARA UM BEBÊ` / `CRESCENDO BEM` | **BR differs** · NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `Mexa-se para` / `se sentir bem` | `Movimente-se para` / `se sentir bem` | **BR differs** |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `CORPO` / `EQUILÍBRIO` / `ENERGIA` | `CORPO` / `EQUILÍBRIO` / `ENERGIA` | Both |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` | unchanged | none |

## Wiring (developer, after the files exist; NOT done)
1. `src/i18n/editorialImages.ts`: add `'pt-PT': require('../assets/images/library/<base>.pt-PT.webp')` (and `'pt-BR'`) to each set (`LocalizedImageSet['pt-PT' | 'pt-BR']` are already optional);
   `EDITORIAL_IMAGES_MISSING_PORTUGUESE` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*['pt-PT' | 'pt-BR']`: replace the « O texto na imagem está em inglês » sentence by the real Portuguese lettering.
3. Tests that pin the current state: `PhasePortugueseLocalization.test.ts` (`images and legal text`), `PhaseEditorialImageLocalization.test.tsx` (language list / require count) and
   `scripts/validate-editorial-images.py` (`LANGS`).
