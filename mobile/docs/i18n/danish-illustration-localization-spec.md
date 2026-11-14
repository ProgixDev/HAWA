# Danish Illustration Localization Spec

**Status:** PENDING — no Danish-specific illustration variants exist yet.

The following editorial illustrations currently have no Danish (`da`) variant in `src/i18n/editorialImages.ts`. The app uses the default (French/general) image instead. This is tracked by `EDITORIAL_IMAGES_MISSING_DANISH`.

## Missing illustrations

| Key | Article | Current fallback | Danish artwork status |
|-----|---------|------------------|-----------------------|
| `pregnancyFollowUp` | PregnancyWeeklyArticleScreen | Default illustration | ❌ Missing |
| `pregnancyExercise` | PregnancyExerciseArticleScreen | Default illustration | ❌ Missing |
| `exercise` | ConceptionLifestyleArticleScreen | Default illustration | ❌ Missing |

## Alt texts (accessibility)

Danish alt texts are implemented in `EDITORIAL_IMAGE_ALT` in `editorialImages.ts`:

- `pregnancyFollowUp.da`: "Gravid kvinde med ultralydsundersøgelse under opfølgning"
- `pregnancyExercise.da`: "Gravid kvinde der laver yoga på en måtte"
- `exercise.da`: "Kvinde der dyrker let motion udendørs"

## When artwork becomes available

1. Add the image asset to `src/assets/images/editorial/da/`
2. Add `da: require('../assets/images/editorial/da/<filename>')` to the relevant `LocalizedImageSet` entry in `editorialImages.ts`
3. Remove the key from `EDITORIAL_IMAGES_MISSING_DANISH`
4. Update this file

## Design notes

- Danish cultural context: inclusive, modern, neutral palette
- Avoid stereotypical Scandinavian imagery; use same illustration style as existing articles
- Image content should be culturally appropriate for a Muslim audience (modest dress)
