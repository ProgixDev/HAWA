# Malay Illustration Localization Spec

**Status:** PENDING — no Malay-specific illustration variants exist yet.

The text-in-image editorial illustrations below have no Malay (`ms`) variant in `src/i18n/editorialImages.ts`. The English variant is returned and the spoken description (`EDITORIAL_IMAGE_ALT.*.ms`) says that the lettering inside the picture is in English. Tracked by `EDITORIAL_IMAGES_MISSING_MALAY`.

## Missing illustrations

| Image set | Used by | Current behaviour | Malay artwork |
|---|---|---|---|
| `cycle-phases-hero` | cycle phases article / library hero | English lettering | Missing |
| `grossesse_semiane` (`PREGNANCY_FOLLOW_UP_HERO`) | PregnancyWeekly article | English lettering | Missing |
| `activité_grossesse` (`PREGNANCY_EXERCISE_HERO`) | PregnancyExercise article | English lettering | Missing |
| `activité` (`EXERCISE_HERO`) | exercise article | English lettering | Missing |

## Alt texts (accessibility) — implemented

- `pregnancyFollowUp.ms`: "Gambar: doktor dan wanita hamil semasa pemeriksaan ultrasound. Tulisan pada gambar dalam bahasa Inggeris: …"
- `pregnancyExercise.ms`: "Gambar: wanita hamil bersenam di atas tilam yoga. Tulisan pada gambar dalam bahasa Inggeris: …"
- `exercise.ms`: "Gambar: wanita bersenam di atas tilam yoga. Tulisan pada gambar dalam bahasa Inggeris: …"

## When artwork becomes available

1. Produce the Malay-lettered variants (same artwork, Malay text; keep the existing safe margins).
2. Add `ms: require('../assets/images/…')` to the relevant `LocalizedImageSet`.
3. Update the alt text so it no longer says the lettering is English.
4. Remove the entry from `EDITORIAL_IMAGES_MISSING_MALAY` (it is derived automatically) and update this file.

## Design notes

- Malay is Latin script and LTR; Malay strings are on average ~15–25 % longer than English, so leave extra room in the lettering.
- Native-speaker review of the lettering is required before shipping.
