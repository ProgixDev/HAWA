# 한국어 (Korean) localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No Korean artwork was generated or replaced. Every Korean string below is a
proposal that needs a native speaker (and, where flagged, medical / editorial review) before it is lettered.

The four images, with measured coordinates, safe zones, masters and naming rules, are described in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) (and repeated in the Russian, German, Chinese, Indonesian, Hindi, Albanian and
Japanese specs). Geometry, naming (note the accented `é`, NFC) and the cropped zones on 320–412 dp phones apply unchanged to Korean.

## Audit result: which illustrations carry language-specific text

All illustrations of the app were audited. Only the four below carry lettering inside the picture; **every other illustration** (all other article covers, onboarding
art, the objective icons, anonymous-mode and profile artwork, the palette previews) contains **no lettering**, so it is language-neutral and is reused as it is for Korean.

| # | Asset base name | Lettering in the picture | Korean variant needed? |
|---|---|---|---|
| 1 | `cycle-phases-hero` | cover title (2 lines) | **Yes** — the lettering is English in Korean |
| 2 | `grossesse_semiane` | title (2 lines) + subtitle (2 lines) | **Yes** |
| 3 | `activité_grossesse` | headline (2 lines) + poster (4 lines) | **Yes** |
| 4 | `activité` | headline (2 lines) + poster (3 lines) + "2 KG" | **Yes** (the "2 KG" label can stay) |

## Current behaviour (shipped)

Korean has no artwork of its own. `resolveEditorialImage(set, 'ko')` returns the **English** variant, and the spoken description
(`EDITORIAL_IMAGE_ALT.*.ko`) says that the lettering in the picture is English (« 이미지 속 글자는 영어예요: “…” »), so the app never presents English
lettering as Korean. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_KOREAN` (`src/i18n/editorialImages.ts`) and pinned by
`PhaseKoreanLocalization.test.ts`.

## Source images (exact)

| # | Asset base name | Size (px) | Format | File to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | WebP | `cycle-phases-hero.ko.webp` | 15+ library articles + Library thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | WebP | `grossesse_semiane.ko.webp` | `PregnancyWeeklyArticleScreen` hero |
| 3 | `activité_grossesse` | 1774 x 887 | WebP | `activité_grossesse.ko.webp` | `PregnancyExerciseArticleScreen` hero |
| 4 | `activité` | 1774 x 887 | WebP | `activité.ko.webp` | `ExerciseCycleSupportArticleScreen` hero |

WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others (the total size cap of 5 MB is already close).

## Proposals (English → Korean)

Korean is **horizontal** here and uses word spaces, so a line can wrap between words. A Hangul syllable is one em wide and a Korean line is usually shorter than the English one but needs
**more height**: keep each block inside the original bounding box with at least 12 px safe margin, allow 1.3–1.4 × line spacing, and do not add lines. Use a Korean sans typeface of similar
weight to the existing lettering (for example Noto Sans KR, Pretendard or Gmarket Sans, all SIL OFL / free licenses — **check the license of the chosen face and that every syllable used is
in it**). Do not break a word across two lines; break at a word space. Numerals stay Western ("2 KG"). Never use Hanja.

| # | Asset | English | Korean proposal | Flag |
|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover) | The body / and its cycles | `몸과` / `주기의 흐름` | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `임신 중` / `건강 관리` | NEEDS MEDICAL REVIEW |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `엄마의 건강과` / `아기의 행복을 위해` | |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `건강한 임신을 위해` / `몸을 움직여요` | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `건강한 엄마가` / `튼튼한 아기를` / `키워요` / (3 lines: no capitals in Hangul) | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `몸을 움직여` / `기분 좋게` | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `몸` / `균형` / `에너지` | none |
| 4f | dumbbell label | 2 KG | unchanged `2 KG` (understood as is) | none |

Note: Hangul has no capital letters; the posters keep the English poster's visual weight with a bolder cut, not with capitals. The 4-line English slogan reads naturally in 3 Korean lines; keep the
poster's block height by increasing the line spacing rather than inventing a fourth line.

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `ko: require('../assets/images/library/<base>.ko.webp')` to each set (`LocalizedImageSet.ko` is already optional);
   `EDITORIAL_IMAGES_MISSING_KOREAN` then empties itself.
2. `EDITORIAL_IMAGE_ALT.*.ko`: replace the « 이미지 속 글자는 영어예요 » sentence by the real Korean lettering.
3. Tests that pin the current state: `PhaseKoreanLocalization.test.ts` (`images and legal text`), `PhaseEditorialImageLocalization.test.tsx`
   (language list / require count) and `scripts/validate-editorial-images.py` (`LANGS`).
