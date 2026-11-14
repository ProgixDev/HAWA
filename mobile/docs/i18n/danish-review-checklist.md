# Danish (Dansk) — Localization Review Checklist

**Language code:** `da` | **Locale:** `da-DK` | **Script:** Latin | **Direction:** LTR
**Added:** 2026-10-25 | **Phase:** Initial integration (Phase 14)

## 1. Dictionary (`src/i18n/locales/da.ts`)

- [ ] All ~6247 leaf keys present (same as `en.ts`)
- [ ] `danishName: 'Dansk'` present (shown in every language's appearance screen)
- [ ] Informal "du" address throughout — no formal "De"/"Deres" as a pronoun
- [ ] AWA brand always written as "AWA", never "Awa" or "awa"
- [ ] Medical terms: menstruationscyklus, ægløsning, follikelfase, lutealfase
- [ ] Islamic terms kept neutral and educational (fiqh, nifas, ghusl, salat/bøn, sawm/faste, qadaa/kaza)
- [ ] `_one`/`_other` plural pairs both present; no `_few`/`_many`/`_zero`/`_two` keys
- [ ] Interpolation placeholders `{{variable}}` identical to English counterparts
- [ ] No raw i18n key leakage (no `appearance.language.xxx` left untranslated)
- [ ] Characters æ ø å Æ Ø Å render correctly in the app

## 2. Articles (73 total)

- [ ] Every article screen has a `da:` block after `bn:` and before `} as const)`
- [ ] Each article's language-selector expression updated: `i18n.language === 'da' ? 'da' :` before final `'fr'` fallback
- [ ] All keys in each `da:` block match the `en:` block structure exactly
- [ ] No array length mismatches (topics, phases, milestones, etc.)

## 3. Pregnancy weeks (41 weeks)

- [ ] All 41 weeks (1–41) have a `da:` block in `pregnancyWeekData.ts`
- [ ] Each week has at minimum: `title`, `body`
- [ ] Medical content is accurate and appropriate for a Danish-speaking audience

## 4. Legal documents

- [ ] `TERMS.da` has ≥ 2 sections with non-empty `title` and `body`
- [ ] `PRIVACY.da` has ≥ 2 sections with non-empty `title` and `body`
- [ ] Placeholder text notes that final legal content is pending
- [ ] `[!] LEGAL-CONTENT VALIDATION REQUIRED` — final Danish Terms of Use and Privacy Policy text must be reviewed by a legal professional before public release

## 5. Calendar and dates

- [ ] `WEEK_DAYS_DA = ['Man','Tir','Ons','Tor','Fre','Lør','Søn']` — 3-letter, Monday-first
- [ ] Single-letter weekdays in `CycleInformationScreen`: `['M','T','O','T','F','L','S']`
- [ ] Single-letter weekdays in `PregnancyMedicalInformationScreen`: same
- [ ] `dateFormatLocale('da')` returns `'da-DK'`
- [ ] Dates display as day-month-year (Danish convention)
- [ ] Decimal separator is comma (da-DK convention) — appears in statistics/export

## 6. Map (LocationScreen)

- [ ] `mapLanguageFor('da-DK')` → `'da'`
- [ ] Map labels shown in Danish when available
- [ ] Non-translated labels fall back to Latin transliteration, then local name
- [ ] Geocoder returns results in Danish

## 7. PDF / CSV export

- [ ] Helvetica WinAnsi covers æ ø å Æ Ø Å (all Latin-1 supplement, U+00C0–U+00FF)
- [ ] No font substitution needed; no new font dependency added
- [ ] Exported PDF headers/labels shown in Danish
- [ ] CSV headers shown in Danish

## 8. Typography / Cycle ring

- [ ] `å` (U+00E5) displays correctly in cycle ring labels
- [ ] `æ` (U+00E6) and `ø` (U+00F8) fall to FALLBACK_EM (0.62 em) in cycleRingLayout — acceptable
- [ ] No layout overflow for long Danish compound words

## 9. Notifications

- [ ] Prayer, fasting, cycle, pregnancy and postpartum notification strings appear in Danish
- [ ] Discreet notification titles/bodies use Danish fallback
- [ ] No hardcoded French/English strings in notification payloads for Danish users

## 10. Illustrations

- [ ] `EDITORIAL_IMAGES_MISSING_DANISH` exported — tracks 3 missing Danish image variants
- [ ] `EDITORIAL_IMAGE_ALT.*.da` present for all 3 illustrated articles
- [ ] `[!] ILLUSTRATION-LOCALIZATION` — Danish-specific artwork is pending for: pregnancyFollowUp, pregnancyExercise, exercise. App gracefully falls back to the default illustration.

## 11. Android visual validation

- [ ] **NOT COMPLETE** — must be tested on a real Android device
- [ ] æøå ÆØÅ render correctly in all text views
- [ ] Cycle calendar weekday headers show correct abbreviated names
- [ ] No text clipping in compact phone layouts (Samsung Galaxy A-series)
- [ ] Settings > Language shows 🇩🇰 Dansk
- [ ] Full app navigation in Danish: home → calendar → statistics → journal → library

## 12. Tests

- [ ] `PhaseDanishLocalization.test.ts` passes (all describe blocks)
- [ ] `PhaseBengaliLocalization.test.ts` passes (ALL_LANGUAGES includes 'da')
- [ ] `PhasePortugueseLocalization.test.ts` passes
- [ ] `initialLanguage.test.ts` passes
- [ ] `PhaseItalianRuntimeIntegration.test.ts` passes (TERMS/PRIVACY key lists)
- [ ] `PhaseItalianEditorial.test.tsx` passes (editorial key order string)
- [ ] `mapLanguage.test.ts` passes (registered Record, mapLanguageFor cases)

## Sign-off

- [ ] Linguistic review by a native Danish speaker
- [ ] Medical terminology checked against Danish health vocabulary
- [ ] `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED` — Islamic content reviewed by qualified scholar/organisation for Danish context
- [ ] Legal documents (§4 above) reviewed by legal professional
