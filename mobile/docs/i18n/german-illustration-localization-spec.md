# German localization spec: the 4 text-in-image editorial illustrations

Audience: designer / product owner. Status: PROPOSAL ONLY. No German artwork was generated. Every German string is a
proposal that needs a native speaker (and, where flagged, medical/editorial review) before it is lettered.

The four images are the ones described, with measured coordinates, safe zones and naming rules, in
[`turkish-illustration-localization-spec.md`](turkish-illustration-localization-spec.md) and
[`russian-illustration-localization-spec.md`](russian-illustration-localization-spec.md). Geometry, masters, naming
(note the accented `é`, NFC), typeface requirements and the cropped zones on 320–412 dp phones apply unchanged.

## Current behaviour (shipped)

German has no artwork of its own. `resolveEditorialImage(set, 'de')` returns the **English** variant, and the spoken
description (`EDITORIAL_IMAGE_ALT.*.de`) says that the lettering in the picture is English
(«Die Beschriftung im Bild ist auf Englisch: …»). The missing assets are listed by `EDITORIAL_IMAGES_MISSING_GERMAN`
(`src/i18n/editorialImages.ts`) and pinned by `PhaseGermanLocalization.test.ts`.

## Proposals (characters, English → German)

German is on average 15–35% longer; a block marked "re-set" must be reduced inside the original box (never overflow
into the illustration). Required typeface: complete Latin-1 with `ä ö ü Ä Ö Ü ß`, and a script face that draws the
umlauts correctly (do not compose accents by overlaying marks).

| # | Asset | English | German proposal | Chars | Flag |
|---|---|---|---|---|---|
| 1a/1b | `cycle-phases-hero` (cover, embossed) | The body / and its cycles | `Der Körper` / `und seine Zyklen` | 8→10, 14→16 | none |
| 2a/2b | `grossesse_semiane` title | Medical care / during pregnancy | `Vorsorge` (script) / `in der Schwangerschaft` | 12→8, 16→22 (+38%, re-set) | NEEDS MEDICAL REVIEW (drops "medical") |
| 2c/2d | subtitle | For mom’s health / and baby’s well-being | `Für die Gesundheit von Mama` / `und das Wohl des Babys` | 16→27, 21→22 | re-set |
| 3a/3b | `activité_grossesse` headline | Move for / a healthy pregnancy | `Beweg dich für` / `eine gesunde Schwangerschaft` | 8→14, 19→28 (+47%, re-set) | |
| 3c–3f | poster (4 lines) | A MOM IN / GOOD HEALTH / FOR A THRIVING / BABY | `EINE GESUNDE` / `MAMA FÜR` / `EIN GESUNDES` / `BABY` | 8→12, 11→8, 14→12, 4→4 | NEEDS MEDICAL REVIEW (slogan) |
| 4a/4b | `activité` headline | Move to / feel good | `Beweg dich,` / `fühl dich gut` | 7→11, 9→13 | |
| 4c–4e | poster | BODY / BALANCE / ENERGY | `KÖRPER` / `BALANCE` / `ENERGIE` | 4→6, 7→7, 6→7 | |
| 4f | dumbbell label | 2 KG | `2 KG` (unchanged, language-neutral) | 4→4 | none |

Capitals: `Ö`/`Ü`/`ß` — in an all-caps poster write `ß` as `SS` or keep lower-case; none of the proposals contains
`ß`. Wording matches the in-app article titles («Beweg dich, um deinen Zyklus zu unterstützen» pattern).

## Wiring (developer, after the files exist; NOT done)

1. `src/i18n/editorialImages.ts`: add `de: require('../assets/images/library/<base>.de.webp')` to each set (static
   `require()`; `LocalizedImageSet.de` is already optional); `EDITORIAL_IMAGES_MISSING_GERMAN` empties itself.
2. `EDITORIAL_IMAGE_ALT.*.de`: replace the "auf Englisch" sentence by the real German lettering, per delivered image.
3. Tests and tooling that pin the current state: `PhaseGermanLocalization.test.ts` (`text-in-image illustrations`),
   `PhaseEditorialImageLocalization.test.tsx` (language list / require count; total size cap 5 MB is already close),
   `scripts/validate-editorial-images.py` (`LANGS`, masters under `design-sources/editorial-images/<base>.de.png`).
4. WebP budget enforced by tests: more than 50 KB and less than 600 KB per file, same pixel size as the others.

## Open points

1. Native review of every proposal; medical/editorial sign-off for 2a and 3c–3f.
2. Image 2: may the German edit re-set the text inside the panel (recommended), or must it keep the exact position?
3. Informal «du» («Beweg dich») on artwork, or an impersonal wording («In Bewegung bleiben»)?
