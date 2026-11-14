# Turkmen (tk) — localization notes and review checklist

Status: dictionary (6,274 keys), 73 library articles (UnderstandCycle included), 41 pregnancy weeks, legal placeholders and registration are in place. **Nothing here has been reviewed by a native Turkmen speaker, a physician or a scholar.** Do not ship before the items below are checked.

## What was integrated

- `src/i18n/locales/tk.ts` — full dictionary (parity with `en.ts`, zero placeholder mismatches). Turkmen Latin alphabet (ä ç ž ň ö ş ü ý), formal «siz» («-ňyz/-ňiz»), quotation marks «», `_one`/`_other` strings identical (the noun stays singular after a numeral).
- Plural: CLDR `tk` is `one` for exactly 1 and `other` for everything else (checked with Node `Intl.PluralRules`: 0, 2, 5, 1.5 → `other`, 1 → `one`). Hermes' default one/other rule gives the same result, so `src/i18n/pluralRules.ts` was NOT changed.
- Library: all 73 article screens have a `tk` block; `UnderstandCycleArticleScreen` has its hand-written language selector extended with `tk`.
- `src/data/pregnancyWeekData.ts` — 41 weeks, `tk` block after `ky`, plus the type line. Fruit/vegetable size comparisons are translated by name (see terminology).
- Registration (via `reg.js`): `themePreferences` (aliases `tk-tm`, `tuk`, `turkmen`, `turkmence`, `tk-latn`, `tk-latn-tm`), `i18n/index.ts`, `editorialLanguage.ts`, `editorialImages.ts` (alt texts say the lettering in the artwork is English), `AppearanceScreen`, `PersonalInformationScreen`, `LegalDocumentScreen` (placeholder terms/privacy), weekday labels (Duş Siş Çar Pen Ann Şen Ýek in `cycleMath.ts`, `CycleInformationScreen`, `PregnancyMedicalInformationScreen`), `tk-TM` date locale. The language name key `turkmenName` was added to every locale file.
- Dates: `Intl` formats `tk-TM` dates correctly in Latin script (`27 oktýabr 2026`; weekday `Siş`/`Sişenbe`).
- Composed Hijri dates: `COMPOSED_HIJRI.tk` in `cycleMath.ts` (months Muharrem … Zylhijje, era marker «hijri»). ICU prints `17 Dört tirkeşik 3, 1448` for `tk-TM-u-ca-islamic` — ordinary Turkmen words used as month names that no Muslim reader would recognise — so the dates are composed.
- Maps: `tk` is in `MAP_LANGUAGES` as a **Latin-script** language (not in the non-Latin set). Verified on 2026-10-27 with the project's public MapTiler key: geocoder `language=tk` → HTTP 200 and returns Turkmen names («Aşgabat şäheri, Türkmenistan»; unknown code → 400). **The vector tiles carry NO `name:tk` property** (zoom 4, 6, 8 around Ashgabat; `name:tr` and `name:ru` are present), so map labels fall back to the local name. Decide whether to keep `tk` in `MAP_LANGUAGES`. `mapLanguage.test.ts` has `tk` cases (not run).
- PDF: all sixteen Turkmen letters (ä ç ž ň ö ş ü ý and capitals) are present in the Regular and Bold DejaVu subsets (`pdfCyrillicFont.ts`), checked with fontkit on 2026-10-27. Routing is unchanged: `ň` is in the existing Czech/Polish set, so a report containing it is drawn entirely with the DejaVu subset; `ä ç ž ö ü ý` are WinAnsi; a report with `ş` but no `ň` goes through the existing Turkish path (Cairo). No new font.

## Terminology decisions to review

- Fertility: «göwreli bolmak ukyby» (ability to become pregnant); fertile window «göwreli bolmak penjiresi» / «göwreli bolmaga ýeterlik döwür»; pregnancy «göwrelilik»; trying to conceive «göwreli bolmaga synanyşmak». A gynecologist should confirm, and consider «önelgelilik» for statistical contexts.
- Pregnancy loss / miscarriage: «göwreliligiň ýitirilmegi» (used consistently instead of a Turkish-looking «düşük»).
- Period: «aýbaşy»; cycle: «sikl»; lochia: «lohiýa»; nifas: «nifas»; istihaza: «istihaza»; ghusl: «gusul»; tahara: «tahara / dini arassalyk»; Ramadan: «Remezan»; Hijri: «hijri»; PMS: «AÖS»; PMDD: «AÖDB»; STIs: «JÝGÝ». Scholar review required for the religious terms and for every sentence on nifas, istihaza, purity and qadaa (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`).
- **Qadaa wording is not uniform.** The articles use «kazo» (makeup fast) while some dictionary labels use «Gaýtarylmaly orazalar» / «Oraza (Gaýtarma)». Pick one form and align the dictionary and the articles.
- Medical terms to confirm: FSG/LG (FSH/LH), estrogen, perimenopauza, insulin garşylygy, laktasiýa, PCOS (kept in Latin letters), dyrnak/follikul terms, «çanak düýbi» (pelvic floor), «aralyk» (perineum).
- Pregnancy-size comparisons (week data): Mak tohumy, Kunjut tohumy, Nohut, Üzüm, Malina, Ýer çigelegi, Kiçi erik, Injir, Alça, Şetdaly, Kiwi, Alma, Awokado, Nar, Bolgar burçy, Pomidor, Banan, Käşir, Süýji kartoşka, Mango, Mekgejöwen, Kabaçok, Hyýar, Gül kelem, Badyrjan, Gawun (butternut), Kelem, Kokos, Kereviz, Ananas, Gawun, Ak gawun, Romen salaty, Pyýaz-sarymsak (porey), Ravent, Garpyz, Kädi. A native speaker should confirm local names (especially apricot/plum «erik»/«alça», «ak gawun», «porey», «ravent»).
- Greeting: check the chosen form for the Muslim greeting.

## Application-logic checks

- **Typed deletion words.** `backupUtility.delete.confirmWord` and `dataPrivacy.deleteAccount.confirmWord` are both `POZ` — one ASCII word, so it can be typed on any keyboard, and the label and the validation read the same key. Confirm the validation is case-insensitive and that «poz» (delete) is the verb the team wants.
- `dayPrefix` is `Gün ` (prefix + number, as the screen concatenates them).
- Templates keep the English structure (`{{count}}`, `{{date}}`, …); word order changes where Turkmen needs it. Turkmen is agglutinative and has vowel harmony: strings that concatenate a number or name with a suffix (e.g. possessive/case endings) should be checked on screen.

## Linguistic review

- Natural Turkmen (not Turkish or Russian calques): check «makala», «gollanma» (guide), «KBS» (FAQ), «abadançylyk» (wellbeing), «hünärmen» (professional), «ugrukdyrma» (guidance).
- A few earlier strings may still have Turkish-style forms; a native read of the whole dictionary is recommended.
- Check long compounds in buttons and chips for overflow on a small phone (Galaxy A13 class).
- Legal terms/privacy texts are placeholders and must be replaced by lawyer-approved text.
