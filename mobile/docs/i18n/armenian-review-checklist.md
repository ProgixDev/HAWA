# Armenian (hy) — localization notes and review checklist

Status: dictionary (6,274 keys), 73 library articles, 41 pregnancy weeks, legal placeholders and registration are in place. **Nothing here has been reviewed by a native Armenian speaker, a physician or a scholar.** Do not ship before the items below are checked.

## What was integrated

- `src/i18n/locales/hy.ts` — full dictionary (parity with `en.ts`, zero placeholder mismatches). Eastern Armenian, formal «դուք», sentence terminator `:` (the Armenian full stop), `_one` and `_other` strings identical (the noun stays singular after a numeral).
- Plural: CLDR `hy` = `one` when the integer part is 0 or 1 (0, 0.5, 1, 1.5 → one; 2, 2.5, 11 → other). Engines with `Intl.PluralRules` (Node, Jest) already do this; for Hermes `src/i18n/pluralRules.ts` now has `armenianCardinal`, checked against Node's CLDR output for 0, 0.5, 1, 1.5, 2, 2.5, 5, 11, 21.
- Library: all 73 article screens have a `hy` block; `UnderstandCycleArticleScreen` has its hand-written language selector extended with `hy` (its base text is the French block, as for the other languages).
- `src/data/pregnancyWeekData.ts` — 41 weeks, `hy` block after `ka`.
- Registration: `themePreferences` (aliases `hy-am`, `hye`, `arm`, `hy-arm`, `hy-arm-am`), `i18n/index.ts`, `editorialLanguage.ts`, `editorialImages.ts` (alt texts say the lettering in the artwork is English), `AppearanceScreen`, `PersonalInformationScreen`, `LegalDocumentScreen` (placeholder terms/privacy), weekday labels (`WEEK_DAYS_HY`: Երկ Երք Չրք Հնգ Ուր Շբթ Կիր), `hy-AM` date locale, composed Hijri dates (`COMPOSED_HIJRI.hy`, era marker «(Հիջրա)»).
- Maps: `hy` is in `MAP_LANGUAGES` (non-Latin set). Verified on 2026-10-27 with the project's public MapTiler key: geocoder `language=hy` → HTTP 200 (unknown code → 400), vector tiles carry `name:hy`, and the `Noto Sans Regular` glyph range 1280–1535 (Armenian) is served. `mapLanguage.test.ts` has `hy` cases (not run).
- PDF: `src/services/pdfArmenianFont.ts` — Noto Sans Armenian Regular + Bold (OFL 1.1, `src/assets/fonts/NotoSansArmenian-OFL.txt`), static instances wght 400/700, subset to the Armenian block (U+0530–058F, including the dram sign ֏), the Armenian ligatures (U+FB13–FB17), ASCII and punctuation; ~33 KB each. Armenian runs use this face, everything else stays Helvetica (same run-splitting as Georgian, **not** registered in `shapedFaces`: Armenian has no reordering, conjuncts or combining marks, so pdf-lib draws it directly).
  - Checked with fontTools + HarfBuzz: all 8,025 distinct Armenian words in the app → fontkit glyph ids/advances/offsets identical to HarfBuzz (script Armn, language hy), no `.notdef`; all 74 Armenian letters (upper and lower case) and the dram sign are in the subset; a sample page wraps inside the margins.

## Not done / not verified

- No Jest, `tsc`, ESLint, Gradle, Metro, APK or device run was performed (instruction for this work). Run them before merging. Only syntax (TypeScript `transpileModule`), dictionary parity, article key-set (73/73, 0 missing, 0 extra), week completeness (41/41) and font checks were run.
- No Armenian-specific typography tuning (line height); Android's system fallback font should render the UI, but check on a real device (Huawei BUEQY19527041001 included).
- No Armenian artwork exists for the text-in-image illustrations (English lettering remains).
- Legal documents are placeholders translated from the existing placeholders — they need real legal text.

## Terms flagged for native / medical / scholarly review

Religious (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`): նիֆաս (nifas), իսթիհադա (istihada), ղուսլ (ghusl), կադա (qadaa), զիքր, դուա, ֆիքհ, մազհաբ, ֆեթվա, հայդ, թահարա, Զուլ-հիջա / Զուլ-կադա and the other Hijri month transliterations (`COMPOSED_HIJRI.hy`), the era marker «(Հիջրա)», «Ասսալամու ալեյքում» in the onboarding greeting, «Ալհամդուլիլլահ» in the make-up fasts screen. The religious articles (FiqhWomenIntro, MenstruationPurity, PrayerDuringMenstruation, ReturningToPrayer, RamadanFasting, FastingQadaa, Istihada, NifasFiqh, ReligiousFaq, ReligiousFaqAfterLoss) keep the neutral, school-agnostic wording of the English source; no ruling was added.

Medical: բեյբի-բլյուզ, հետծննդյան դեպրեսիա, լոխիա, անդրոգեններ, հիրսուտիզմ, ինսուլինակայունություն, օստեոպենիա / օստեոպորոզ, դենսիտոմետրիա, ֆոլիկուլային / լյուտեալ փուլ, Բրաքստոն-Հիքսի կծկումներ, մեկոնիում, վերնիքս, PCOS (kept in Latin letters everywhere — a native review should decide whether to use the Armenian long form «պոլիցիստոզ ձվարանների համախտանիշ»/ՊՁՀ), «վիժում» for miscarriage, contraception terms (պլաստր, օղակ, սպիրալ), ձվազատում (ovulation), դաշտանադադար / պերիմենոպաուզա, ՍՃՓՎ (STI), ՆԴՀ / ՆԴԴԽ (PMS / PMDD).

UI choices to confirm: `onboarding.welcome.brandPrefix` is empty (as for bn/ja/ko/ka) with title «Բարի գալուստ»; the discreet app name «Օրագիր»; the confirmation word «ՋՆՋԵԼ» (delete); Premium plan wording; the notification texts; the short weekday labels (three letters, also used where other languages use a single letter).

Content note: `MenopauseTransition` keeps the English source's "in France … around age 51" statement (Ֆրանսիայում) — decide whether to keep a country-specific figure.
