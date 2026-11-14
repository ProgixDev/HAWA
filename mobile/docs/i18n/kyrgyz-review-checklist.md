# Kyrgyz (ky) — localization notes and review checklist

Status: dictionary (6,274 keys), 73 library articles (UnderstandCycle included), 41 pregnancy weeks, legal placeholders and registration are in place. **Nothing here has been reviewed by a native Kyrgyz speaker, a physician or a scholar.** Do not ship before the items below are checked.

## What was integrated

- `src/i18n/locales/ky.ts` — full dictionary (parity with `en.ts`, zero placeholder mismatches). Kyrgyz Cyrillic, formal «сиз», quotation marks «», `_one`/`_other` strings identical (the noun stays singular after a numeral).
- Plural: CLDR `ky` is `one` for exactly 1 and `other` for everything else (checked with Node `Intl.PluralRules`: 0, 0.5, 1.5, 2, 5, 11, 21 → `other`). Hermes' default one/other rule gives the same result, so `src/i18n/pluralRules.ts` was NOT changed. Two `_one`/`_other` pairs differ on purpose (journal date conflicts, qadaa surplus note), as in English.
- Library: all 73 article screens have a `ky` block; `UnderstandCycleArticleScreen` has its hand-written language selector extended with `ky`.
- `src/data/pregnancyWeekData.ts` — 41 weeks, `ky` block after `tg`, plus the type line.
- Registration (via `reg.js`): `themePreferences` (aliases `ky-kg`, `kir`, `kyrgyz`, `kirghiz`, `ky-cyrl`, `ky-cyrl-kg`), `i18n/index.ts`, `editorialLanguage.ts`, `editorialImages.ts` (alt texts say the lettering in the artwork is English), `AppearanceScreen`, `PersonalInformationScreen`, `LegalDocumentScreen` (placeholder terms/privacy), weekday labels (Дүй Шей Шар Бей Жум Ишм Жек in `cycleMath.ts`, `CycleInformationScreen`, `PregnancyMedicalInformationScreen`), `ky-KG` date locale.
- Composed Hijri dates: `COMPOSED_HIJRI.ky` in `cycleMath.ts`, era marker «х.ж.» (хижра жылы). ICU prints `AH 1447-ж. 23-Ramadan` for `ky-KG-u-ca-islamic` (English month name), which is why the dates are composed.
- Maps: `ky` is in `MAP_LANGUAGES` (non-Latin set). Verified on 2026-10-27 with the project's public MapTiler key: geocoder `language=ky` → HTTP 200 and returns Kyrgyz names («Бишкек шаары, Кыргызстан»; an unknown code → 400). **The vector tiles carry NO `name:ky` property** (zoom 4, 6, 8 around Bishkek; `name:kk` and `name:ru` are present), so map labels fall back to the local name. Decide whether to keep `ky` in `MAP_LANGUAGES`. `mapLanguage.test.ts` has `ky` cases (not run).
- PDF: the existing DejaVu Cyrillic subset (`pdfCyrillicFont.ts`) contains the whole block U+0400–04FF. Glyph check with fontkit on 2026-10-27: Ң ң Ө ө Ү ү present in both the Regular and Bold subsets, and no Cyrillic character used in `ky.ts` or in `pregnancyWeekData.ts` is missing. No new font; wrapping uses the same word-based path as the other Cyrillic languages (no shaping).

## Terminology decisions to review

- **Fertility.** «түшүмдүүлүк» was rejected: «түшүм» means a crop/harvest, so «түшүмдүүлүк» reads as agricultural productivity. Human reproductive fertility is written «бойго бүтүү жөндөмдүүлүгү»; the fertile window is «бойго бүтүү терезеси»; "fertile" is «бойго бүтүүгө ыңгайлуу». Trying to conceive is «боюна бүтүүгө аракет кылуу» (a few older strings use «кош бойлуу болуу»). A native speaker or a gynecologist should confirm these, and consider «туумдуулук» for statistical contexts.
- Pregnancy: «курсактуулук» (some older strings use «кош бойлуулук»). Check that one form is chosen and used everywhere.
- Period: «етек кирим»; lochia: «лохия»; nifas: «нифас»; istihaza: «истихаза»; ghusl: «гусул»; tahara: «тахара»; qadaa: «казо» (labels «Казо орозолор»); Ramadan: «Рамазан»; Dhu al-Hijjah: «Зулхижжа»; Hijri: «Хиджра». Scholar review required for the religious terms and for every sentence on nifas, istihaza, purity and qadaa (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`).
- Medical terms to confirm: ФСГ/ЛГ (FSH/LH), эстрадиол, перименопауза, аменорея, лактация, инсулин каршылыгы, PCOS (kept in Latin letters), ЖЖБИ (STIs), ЕЧС/ЕЧДБ (PMS/PMDD), жамбаш түбү/аралык (pelvic floor/perineum).
- Greeting: «Ассалому алейкум».

## Application-logic checks

- **Typed deletion words.** `backupUtility.delete.confirmWord` and `dataPrivacy.deleteAccount.confirmWord` are both `ӨЧҮРҮҮ` — one word, so it can be typed, and the displayed label and the validation read the same key. `confirmLabel`/`confirmError` contain the same word. Please confirm that the validation compares case-insensitively (Ө/Ү uppercase on a Kyrgyz keyboard) and that the word is the verb the team wants («өчүрүү» = delete).
- `dayPrefix` is `Күн ` (prefix + number, as the screen concatenates them).
- Templates keep the English structure (`{{count}}`, `{{date}}`, …); the order of words changes where Kyrgyz needs it.

## Linguistic review

- Natural Kyrgyz (not Russian calques): check «макала», «колдонмо» (guide), «КБС» (FAQ), «ыңгайлуулук», «жыргалчылык».
- Several Russian loanwords are used in medical text (спазм, лохия, гусул…); decide which should be replaced by native terms.
- Check long compounds in buttons and chips for overflow on a small phone (Galaxy A13 class).
- Legal terms/privacy texts are placeholders and must be replaced by lawyer-approved text.
