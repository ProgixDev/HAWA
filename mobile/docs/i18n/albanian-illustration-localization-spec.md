# Shqip (Albanian) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Albanian artwork was generated or replaced. Every Albanian string below is a
proposal that needs a native speaker (and, where flagged, medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German, Chinese, Indonesian and
Hindi specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply unchanged to Albanian.

## Audit result: which images carry language-specific text

| # | Asset base name | Lettering in the picture | Albanian variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — lettering is English in Albanian |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

Every other illustration of the app (all other article covers, onboarding art, the objective icons, anonymous-mode and profile artwork) contains **no
lettering**, so it is reused as it is for Albanian: nothing to translate, nothing to replace.

## Current behaviour (shipped)

Albanian has no artwork of its own. `resolveEditorialImage(set, 'sq')` returns the **English** variant, and the spoken description
(`EDITORIAL_IMAGE_ALT.*.sq`) says that the lettering in the picture is English (« Teksti në figurë është në anglisht: “…” »), so the app never presents English
lettering as Albanian. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_ALBANIAN` (`src/i18n/editorialImages.ts`) and pinned by
`PhaseAlbanianLocalization.test.ts`.

## Source images (exact)

| # | Asset base name | Size (px) | Format | File to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.sq.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.sq.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.sq.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.sq.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size cap of 5 MB is already close).

## Proposals (English → Albanian)

Albanian text is about 15–30 % longer than the English: keep each block inside the original bounding box with at least 12 px safe margin, reduce the point
size rather than adding lines, and keep the existing Latin typeface family — which already has **ë Ë ç Ç** (Latin-1 / Latin Extended-A). Check the four
letters in the chosen weights before lettering.

| # | Asset | English | Albanian proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `Trupi` / `dhe ciklet e tij` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `Kujdes mjekësor` / `gjatë shtatzënisë` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `Për shëndetin e nënës` / `dhe mirëqenien e bebes` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `Lëviz për` / `një shtatzëni të shëndetshme` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `NJË NËNË` / `ME SHËNDET TË MIRË` / `PËR NJË BEBE` / `QË RRITET MIRË` | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `Lëviz për` / `të ndjerë mirë` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `TRUPI` / `EKUILIBRI` / `ENERGJIA` | |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (understood as is) | none |

Note on capitals: Albanian capitals keep their diacritics (`SHËNDET`, `NËNË`, `ÇËSHTJE`): never letter an Ë as E.

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `sq: require('../assets/images/library/<base>.sq.webp')` to each set (`LocalizedImageSet.sq` is already optional);
   `EDITORIAL_IMAGES_MISSING_ALBANIAN` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.sq`: replace the « Teksti në figurë është në anglisht » sentence by the real Albanian lettering.
3. Tests that pin the current state: `PhaseAlbanianLocalization.test.ts` (`images and legal text`), `PhaseEditorialImageLocalization.test.tsx`
   (language list / require count) and `scripts/validate-editorial-images.py` (`LANGS`).
