# Russian localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. Nothing here changes artwork; no Russian image has been
generated. Every Russian string is a proposal that needs a native speaker (and, where flagged, medical/editorial
review) before it is lettered into artwork.

The four images are the same ones described, with measured coordinates, in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md). Geometry, safe zones,
masters, naming rules and typeface notes in that document apply unchanged; this file only adds the Russian copy, the
width risks specific to Cyrillic, and the wiring.

## Current behaviour (shipped)

Russian has no artwork of its own. `resolveEditorialImage(set, 'ru')` returns the **English** variant
(`image[resolved] ?? image.en`), and the spoken description (`EDITORIAL_IMAGE_ALT.*.ru`) says that the lettering in
the picture is English. The missing assets are listed by `EDITORIAL_IMAGES_MISSING_RUSSIAN`
(`src/i18n/editorialImages.ts`) and pinned by `PhaseRussianLocalization.test.ts`.

## Summary

| # | Asset base name | Size (px) | English lettering | Russian files to deliver | Used by |
|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | 1672 x 941 | "The body / and its cycles" (embossed on a book cover) | `cycle-phases-hero.ru.webp` | `CyclePhasesArticleScreen` + 15 other library heroes + Library "popular" thumbnail |
| 2 | `grossesse_semiane` | 1774 x 887 | "Medical care / during pregnancy" + "For mom’s health / and baby’s well-being" | `grossesse_semiane.ru.webp` | `PregnancyWeeklyArticleScreen` |
| 3 | `activité_grossesse` | 1774 x 887 | "Move for / a healthy pregnancy" + poster "A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY" | `activité_grossesse.ru.webp` | `PregnancyExerciseArticleScreen` |
| 4 | `activité` | 1774 x 887 | "Move to / feel good" + poster "BODY / BALANCE / ENERGY" + "2 KG" on a dumbbell | `activité.ru.webp` | `ExerciseCycleSupportArticleScreen` |

Exact files (note the accented `é`, NFC): `src/assets/images/library/cycle-phases-hero.{fr,en,es,it,tr}.webp`,
`grossesse_semiane.{fr,en,es,it}.webp`, `activité_grossesse.{fr,en,es,it}.webp`, `activité.{fr,en,es,it}.webp`.
The French originals are the `<base>.png` files next to them; English/Spanish/Italian masters live in
`design-sources/editorial-images/` (masters for the other languages are the right base for a Russian edit).

None of the images contains a diagram, a number of days, a hormone name or an instruction: the lettering is a
title/tagline/slogan only. Items that still make a health claim are flagged NEEDS MEDICAL REVIEW.

## Russian text proposals

Counts are characters, English -> Russian. Cyrillic is typically 15-35% wider than the English at the same type
size, so any block marked "over +15%" must be re-set (reduced size/tracking inside the original block) — never
overflow into the illustration (see the Turkish spec §0.3 and §0.4 for margins and the cropped zones on 320-412 dp
phones). Typeface: the chosen faces MUST contain complete Cyrillic (including `ё`, `Й`, `Щ`, `Ъ`, `Ы`, `Ю`, `Я`);
verify that the script face draws connected Cyrillic correctly (many Latin brush scripts have no Cyrillic at all —
use a script designed for Cyrillic, e.g. a Cyrillic-capable Lobster/Marck Script/Pacifico-like face; this is a
candidate to evaluate, not a claim about the originals).

### 1. `cycle-phases-hero`

| # | English | Russian proposal | Chars | Note |
|---|---|---|---|---|
| 1a | The body | `Тело` | 8 -> 4 | |
| 1b | and its cycles | `и его циклы` | 14 -> 11 | |

Full: «Тело и его циклы» (16 vs 23, shorter). Alternative, second person: `Ваше тело` / `и его циклы`. Embossed,
centred on the cover, no other change.

### 2. `grossesse_semiane`

| # | English | Russian proposal (primary) | Chars | Flag |
|---|---|---|---|---|
| 2a (script) | Medical care | `Наблюдение` | 12 -> 10 | NEEDS MEDICAL REVIEW: drops "медицинское" |
| 2b (sans) | during pregnancy | `при беременности` | 16 -> 16 | |
| 2c | For mom’s health | `Для здоровья мамы` | 16 -> 17 (+6%) | |
| 2d | and baby’s well-being | `и благополучия малыша` | 21 -> 21 | |

Full title «Наблюдение при беременности»; subtitle «Для здоровья мамы и благополучия малыша».
The literal «Медицинское наблюдение / во время беременности» (2a 22, +83%; 2b 21, +31%) does not fit the script
block without shrinking both lines noticeably; use it only if medical sign-off requires the word «медицинское» and
the designer can re-set both lines inside the pale panel (x 1195..1774).
Same pre-existing crop issue as the other languages (title partly under the share/bookmark buttons at 360 dp):
keep Russian no wider than English, preferably within x <= 1535 (Turkish spec §0.4).

### 3. `activité_grossesse`

| # | English | Russian proposal (primary) | Chars | Flag |
|---|---|---|---|---|
| 3a (sans) | Move for | `Двигайтесь для` | 8 -> 14 (+75%) | re-set smaller; box is 481 px wide, sans is the lighter line |
| 3b (script) | a healthy pregnancy | `здоровой беременности` | 19 -> 21 (+11%) | |
| 3c | A MOM IN | `ЗДОРОВАЯ` | 8 -> 8 | NEEDS MEDICAL REVIEW (health-claim slogan) |
| 3d | GOOD HEALTH | `МАМА —` | 11 -> 6 | |
| 3e | FOR A THRIVING | `СЧАСТЛИВЫЙ` | 14 -> 10 | "thriving" is ambiguous; «ЗДОРОВЫЙ» is the safer medical reading |
| 3f | BABY | `МАЛЫШ` | 4 -> 5 | |

Headline «Двигайтесь для здоровой беременности» (consistent with the app title «Оставаться активной во время
беременности»). Poster «ЗДОРОВАЯ МАМА — СЧАСТЛИВЫЙ МАЛЫШ» (4 lines like English). The poster is largely cropped at
320-360 dp for every language already; keep Russian no wider than English. Capitals use `Ё`/`Й` correctly.

### 4. `activité`

| # | English | Russian proposal (primary) | Chars | Flag |
|---|---|---|---|---|
| 4a (sans) | Move to | `Двигайтесь,` | 7 -> 11 (+57%) | re-set |
| 4b (script) | feel good | `чтобы чувствовать себя хорошо` | 9 -> 29 (+222%) | does not fit one line: set as 2 script lines (`чтобы чувствовать` / `себя хорошо`) |
| 4c | BODY | `ТЕЛО` | 4 -> 4 | |
| 4d | BALANCE | `БАЛАНС` | 7 -> 6 | |
| 4e | ENERGY | `ЭНЕРГИЯ` | 6 -> 7 | |
| 4f | 2 KG | `2 КГ` | 4 -> 4 | optional / low priority (tiny embossed label) |

Shorter alternative that keeps the box: 4a `Двигайтесь` / 4b `с удовольствием` (15, +67%) = «Двигайтесь с удовольствием».
It paraphrases the slogan (native review required). The headline block sits where the back button overlays at 360 dp
(pre-existing). Wording matches the in-app article title pattern «Двигайтесь, чтобы поддержать свой цикл».

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `ru: require('../assets/images/library/<base>.ru.webp')` to each set (static
   `require()` only — the test forbids dynamic paths). `LocalizedImageSet.ru` is already optional;
   `EDITORIAL_IMAGES_MISSING_RUSSIAN` empties itself as entries are added.
2. `EDITORIAL_IMAGE_ALT.*.ru`: replace the "надпись на английском языке" sentence by the real Russian lettering,
   per image, only for images that were actually delivered.
3. Tests that pin the current state and must change together:
   - `src/i18n/__tests__/PhaseRussianLocalization.test.ts`, describe `text-in-image illustrations` (the four base
     names in `EDITORIAL_IMAGES_MISSING_RUSSIAN`, `hasLocalizedEditorialImage(..., 'ru') === false`, and the
     `на английском языке` assertion).
   - `src/screens/__tests__/PhaseEditorialImageLocalization.test.tsx` (language list and require count; the
     Turkish addition is the model) and `scripts/validate-editorial-images.py` (`LANGS`, masters, size/digest
     rules; check the 5 MB total cap — it is already close).
4. WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the other
   variants, RGB, no alpha; masters outside the bundle under `design-sources/editorial-images/<base>.ru.png`.

## Open points

1. Native-speaker review of every proposal above; medical/editorial sign-off for 2a and 3c-3f.
2. Image 2: may the Russian edit re-set the text inside the panel (recommended, as for Turkish) or must it keep the
   exact original position?
3. Image 4: literal («чтобы чувствовать себя хорошо», 2 script lines) or paraphrase («с удовольствием»)?
4. Whether `2 KG` should become `2 КГ`.
5. Script face with real Cyrillic support (see above) — approval of the font choice.
