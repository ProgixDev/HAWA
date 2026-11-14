# Tajik (tg) — localization notes and review checklist

Status: dictionary (6,274 keys), 73 library articles, 41 pregnancy weeks, legal placeholders and registration are in place. **Nothing here has been reviewed by a native Tajik speaker, a physician or a scholar.** Do not ship before the items below are checked.

## What was integrated

- `src/i18n/locales/tg.ts` — full dictionary (parity with `en.ts`, zero placeholder mismatches). Tajik Cyrillic, formal «Шумо», quotation marks «», `_one` and `_other` strings identical (the noun stays singular after a numeral).
- Plural: CLDR `tg` gives `one` for 0, 0.5, 1, 1.5 and `other` for 2, 2.5, 5, 11, 21 (checked with Node `Intl.PluralRules`). Because every `_one`/`_other` pair has the same Tajik text, Hermes' default rule (`value === 1 ? 'one' : 'other'`) produces identical output, so `src/i18n/pluralRules.ts` was NOT changed.
- Library: all 73 article screens have a `tg` block; `UnderstandCycleArticleScreen` has its hand-written language selector extended with `tg` (its base text is the French block, as for the other languages).
- `src/data/pregnancyWeekData.ts` — 41 weeks, `tg` block after `hy`, plus the type line.
- Registration: `themePreferences` (aliases `tg-tj`, `tgk`, `tajik`, `tg-cyrl`, `tg-cyrl-tj`), `i18n/index.ts`, `editorialLanguage.ts`, `editorialImages.ts` (alt texts say the lettering in the artwork is English), `AppearanceScreen`, `PersonalInformationScreen`, `LegalDocumentScreen` (placeholder terms/privacy), weekday labels (`WEEK_DAYS_TG`: Душ Сеш Чор Пан Ҷум Шан Яқш), `tg-TJ` date locale, composed Hijri dates (`COMPOSED_HIJRI.tg`, era marker «ҳ.»).
- Maps: `tg` is in `MAP_LANGUAGES` (non-Latin set). Verified on 2026-10-27 with the project's public MapTiler key: geocoder `language=tg` → HTTP 200 and returns Tajik names («Душанбе, Тоҷикистон»; an unknown code → 400), and the `Noto Sans Regular` glyph range 1280–1535 is served. **The vector tiles carry NO `name:tg` property** (checked on tiles at zoom 3, 5, 6, 7 and 9 around Dushanbe, Khujand/Pamir and a Russian city; `name:ru`, `name:hy`, `name:fa` are present). Consequence: map labels fall back to the local name (`name`) — right in Tajikistan, but foreign places show in their own script. Search results and addresses are in Tajik. Decide whether to keep `tg` in `MAP_LANGUAGES` or to remove it (map labels would then stay English). `mapLanguage.test.ts` has `tg` cases (not run).
- PDF: **no new font.** Tajik is Cyrillic, so the existing DejaVu Sans Cyrillic subset (`pdfCyrillicFont.ts`, whole block U+0400–04FF) draws it. Checked with fontTools: all of Ғ ғ Ӣ ӣ Қ қ Ӯ ӯ Ҳ ҳ Ҷ ҷ are in both the Regular and Bold subsets, and every Cyrillic code point used by the Tajik dictionary, articles and weeks is covered (no decomposed macron sequences are used). Cyrillic needs no shaping or reordering; a sample page wraps inside the margins (pdf-lib + fontkit).

## Not done / not verified

- No Jest, `tsc`, ESLint, Gradle, Metro, APK or device run was performed (instruction for this work). Run them before merging. Only syntax (TypeScript `transpileModule`), dictionary parity, article key-set (73/73, 0 missing, 0 extra), week completeness (41/41) and font checks were run.
- No Tajik-specific typography tuning; Android's system fonts should render the UI, but check on a real device (Huawei BUEQY19527041001 included).
- No Tajik artwork exists for the text-in-image illustrations (English lettering remains).
- Legal documents are placeholders — they need real legal text.
- The tiles lack `name:tg` (see Maps above).

## Terms flagged for native / medical / scholarly review

Religious (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`): нифос (nifas), истиҳоза (istihada), ғусл (ghusl), қазо (qadaa), зикр, дуо, фиқҳ, мазҳаб, фатво, ҳайз, таҳорат, Зулқаъда / Зулҳиҷҷа and the other Hijri month transliterations (`COMPOSED_HIJRI.tg`: Муҳаррам, Сафар, Рабеъ-ул-аввал, Рабеъ-ус-сонӣ, Ҷумоди-ул-аввал, Ҷумоди-ус-сонӣ, Раҷаб, Шаъбон, Рамазон, Шаввол, Зулқаъда, Зулҳиҷҷа), the era marker «ҳ.», «Ассалому алайкум» in the onboarding greeting, «Алҳамдулиллоҳ» in the make-up fasts screen. The religious articles (FiqhWomenIntro, MenstruationPurity, PrayerDuringMenstruation, ReturningToPrayer, RamadanFasting, FastingQadaa, Istihada, NifasFiqh, ReligiousFaq, ReligiousFaqAfterLoss) keep the neutral, school-agnostic wording of the English source; no ruling was added.

Medical: бейби-блюз, депрессияи баъдизоӣ, лохия, андрогенҳо, гирсутизм, муқовимати инсулин, остеопения / остеопороз, денситометрия, марҳилаи фолликулярӣ / лютеалӣ, кашишҳои Брэкстон-Хикс, меконий, верникс, PCOS (kept in Latin letters everywhere — a native review should decide whether to use a Tajik long form), «вижиш» for miscarriage, contraception terms (пластир, ҳалқаи маҳбалӣ, спирали гормонӣ, имплант), овуляция, менопауза / перименопауза, СРҶ (STI), СПҲ / ИДПҲ (PMS / PMDD), «дарридагӣ» for a perineal tear, pregnancy-week size comparisons (fruit names, e.g. Қулфинай, Норҷил, Бодинҷон, Тарбуз, Каду).

UI choices to confirm: `onboarding.welcome.brandPrefix` is empty with title «Хуш омадед»; the discreet app name «Рӯзнома»; the confirmation word «НЕСТ» (delete); Premium plan wording; the notification texts; the three-letter weekday labels (also used where other languages use a single letter); the decimal comma in numbers («1,5 литр»); the abbreviation «см»/«мм».

Content note: `MenopauseTransition` keeps the English source's "in France … around age 51" statement (Фаронса) — decide whether to keep a country-specific figure.
