# Georgian (ka) — localization notes and review checklist

Status: dictionary (6,274 keys), 73 library articles, 41 pregnancy weeks, legal placeholders and registration are in place. **Nothing here has been reviewed by a native Georgian speaker, a physician or a scholar.** Do not ship before the items below are checked.

## What was integrated

- `src/i18n/locales/ka.ts` — full dictionary (parity with `en.ts`, zero placeholder mismatches). Plural: CLDR `ka` = one/other; the `_one` and `_other` strings are identical (the noun stays singular after a numeral).
- Library: all 73 article screens have a `ka` block; `UnderstandCycleArticleScreen` has its hand-written language selector extended with `ka`.
- `src/data/pregnancyWeekData.ts` — 41 weeks, `ka` block after `az`.
- Registration: `themePreferences` (aliases `ka-ge`, `kat`, `geo`, `ka-geor`…), `i18n/index.ts`, `editorialLanguage.ts`, `editorialImages.ts` (alt texts say the lettering in the artwork is English), `AppearanceScreen`, `PersonalInformationScreen`, `LegalDocumentScreen` (placeholder terms/privacy), weekday labels (`WEEK_DAYS_KA`: ორ სა ოთ ხუ პა შა კვ), `ka-GE` date locale, composed Hijri dates (`COMPOSED_HIJRI.ka`, era marker ჰ.წ.).
- Maps: `ka` is in `MAP_LANGUAGES` (non-Latin set). Verified on 2026-10-27 with the project's public MapTiler key: geocoder `language=ka` → HTTP 200 (unknown code → 400), vector tiles carry `name:ka`, and the `Noto Sans Regular` glyph range 4096–4351 (Georgian) is served.
- PDF: `src/services/pdfGeorgianFont.ts` — Noto Sans Georgian Regular + Bold (OFL 1.1, `src/assets/fonts/NotoSansGeorgian-OFL.txt`), static instances wght 400/700, subset to the Georgian blocks (U+10A0–10FF, U+1C90–1CBF, U+2D00–2D2F), ₾ (U+20BE), ASCII and punctuation; ~46 KB each. Georgian runs use this face, everything else stays Helvetica (same `DevanagariFaces` run-splitting as the Indic scripts, but **not** registered in `shapedFaces`: Mkhedruli has no reordering/conjuncts/combining marks, so pdf-lib draws it directly).
  - Checked with fontTools + HarfBuzz: all 6,957 distinct Georgian words in the app → fontkit glyph ids/advances/offsets identical to HarfBuzz, no `.notdef`; every Georgian code point used by the app is in the subset; sample page wraps inside the margins.

## Not done / not verified

- No Jest, `tsc`, ESLint, Gradle, Metro, APK or device run was performed (instruction for this session). Run them before merging.
- No Georgian-specific typography tuning (line height); Android's system fallback font (Noto Sans Georgian) should render the UI, but check on a real device (Huawei BUEQY19527041001 included).
- No Georgian artwork exists for the text-in-image illustrations (English lettering remains).
- Legal documents are placeholders translated from the existing placeholders — they need real legal text.

## Terms flagged for native / medical / scholarly review

Religious (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`): ნიფასი (nifas), ისთიჰადა (istihada), ღუსლი (ghusl), კადაა (qadaa), ზიქრი, დუა, ფიქჰი, მაზჰაბი, ფეტვა, ჰაიდი, თაჰარა, ზულ-ჰიჯა / ზულ-ყიდა and the other Hijri month transliterations (`COMPOSED_HIJRI.ka`), the era marker ჰ.წ., „ასალამუ ალეიქუმ“ in the onboarding greeting. The religious articles (FiqhWomenIntro, MenstruationPurity, PrayerDuringMenstruation, ReturningToPrayer, RamadanFasting, FastingQadaa, Istihada, NifasFiqh, ReligiousFaq, ReligiousFaqAfterLoss) keep the neutral, school-agnostic wording of the English source; no ruling was added.

Medical: ბეიბი-ბლუზი, მშობიარობის შემდგომი დეპრესია, ლოხია, ანდროგენები, ჰირსუტიზმი, ინსულინრეზისტენტობა, ოსტეოპენია / ოსტეოპოროზი, დენსიტომეტრია, ფოლიკულური / ლუტეალური ფაზა, ბრაქსტონ-ჰიქსის შეკუმშვები, მეკონიუმი, ვერნიქსი, PCOS wording (the UI uses the Georgian long form in settings and the abbreviation PCOS in headings), contraception terms (პლასტირი, რგოლი, სპირალი), „ორსულობის თვითნებური შეწყვეტა“ for miscarriage.

UI choices to confirm: `onboarding.welcome.brandPrefix` is empty (as for bn/ja/ko) with title „მოგესალმებით“; the discreet app name „დღიური“; Premium plan wording; the notification texts.

Content note: `MenopauseTransition` keeps the English source's "in France … around age 51" statement (საფრანგეთში) — decide whether to keep a country-specific figure.
