# Malay (Bahasa Melayu) — Localization Review Checklist

**Language code:** `ms` | **Locale:** `ms-MY` | **Script:** Latin (Rumi) | **Direction:** LTR | **Variety:** standard Malaysian Malay (Bahasa Melayu Malaysia, DBP orthography)
**Added:** 2026-10-28 | **Status:** machine-assisted translation, **NOT yet reviewed by a native speaker, a clinician or a religious scholar**

## 1. Dictionary (`src/i18n/locales/ms.ts`)

- [x] All 6273 leaf keys present (`node scripts/check-language-parity.js ms` → 0 key errors, 0 placeholder mismatches)
- [x] `malayName: 'Bahasa Melayu'` present in `en.ts` and every other locale dictionary
- [ ] **Native-speaker review** of tone: neutral-informal "anda" throughout (never "kamu"/"awak"); consistent device vocabulary ("telefon", "aplikasi", "pemberitahuan", "tetapan")
- [ ] Malaysian vs Indonesian vocabulary pass (e.g. "tuala wanita" not "pembalut", "doktor" not "dokter", "seluar dalam" not "celana dalam", "pil perancang kelahiran", "tetapan" not "pengaturan")
- [ ] AWA brand always written "AWA"
- [ ] Greeting `As-salamu ‘alaykum,` kept in Arabic transliteration (same convention as every other language)
- [ ] `_one` / `_other` pairs both present with identical text (CLDR: Malay has the single category `other`)
- [ ] Destructive-confirmation word `PADAM` (data deletion) is natural and matches the on-screen wording
- [ ] Disguise launcher name "Agenda" (Settings → Discreet appearance) is a neutral, believable app name in Malaysia

## 2. Medical terminology (clinician review REQUIRED)

- [ ] haid / kitaran haid / ovulasi / fasa folikular / fasa luteal / tempoh subur
- [ ] lendir serviks, suhu badan basal, ujian ovulasi (LH), bintik darah
- [ ] kontraseptif: pil, tampalan, cincin faraj, IUD hormon, implan
- [ ] PCOS (kept as the international acronym; "sindrom ovari polikistik" spelled out in the article)
- [ ] selepas bersalin (postpartum), lokia, amenorea laktasi, keguguran (miscarriage / pregnancy loss)
- [ ] perimenopaus / menopaus, kepanasan mendadak (hot flashes), berpeluh malam, kabut otak
- [ ] Reference ranges and figures unchanged from English (21–35 day cycles, 3–7 days of bleeding, 12-month TTC threshold, 40-day nifas marker, etc.); decimals use a **point** (Malaysian convention)
- [ ] Nothing reads as a diagnosis or a stronger claim than the English source ("boleh" / "mungkin" for "may")

## 3. Religious content (scholar review REQUIRED) — `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`

- [ ] Terms: haid, nifas, istihadah, ghusl, taharah/kesucian, qadha, Ramadan, Zulhijjah, solat, puasa, zikir, doa — spelling per Malaysian usage (JAKIM / DBP)
- [ ] Neutral wording between mazhab preserved (articles: FiqhWomenIntro, MenstruationPurity, Istihada, NifasFiqh, PrayerDuringMenstruation, ReturningToPrayer, FastingQadaa, RamadanFasting, ReligiousFaq, ReligiousFaqAfterLoss) — **no ruling was added or strengthened**
- [ ] Malaysian practice is predominantly Shafi‘i; the content deliberately does **not** present any single mazhab as universal — scholar to confirm the neutral phrasing is acceptable to the target audience
- [ ] The "40 days" nifas marker is still presented as a commonly used reference, never as a universal rule
- [ ] Every article keeps the disclaimer that AWA issues no fatwa

## 4. Articles (73) and UnderstandCycle

- [x] Every `*ArticleScreen.tsx` has an `ms:` block after the last language block, same key order as `en:` (checked by tooling)
- [x] `UnderstandCycleArticleScreen` has an `ms:` block and the manual selector `i18n.language === 'ms' ? 'ms'` before the final `'fr'`
- [ ] Native review of the longest articles (PerineumStrengthening, PcosIntro, HotFlashes, MenopauseHormones, ExerciseCycleSupport)
- [ ] Cross-article titles in the `related:` lists match the library titles in `ms.ts` (`library.articles.*`)

## 5. Pregnancy weeks (41)

- [x] All 41 weeks have an `ms:` block (`babyDescription`, `length`, `comparison`, `bodyChanges`, `toKnow`)
- [ ] Fruit/vegetable comparisons are the ones Malaysian readers know (e.g. "Kacang pis", "Delima", "Lada benggala", "Terung", "Labu butternut", "Tembikai cantaloupe") — adjust if a more familiar local fruit exists, **keeping the measurements untouched**

## 6. Legal documents

- [x] `TERMS.ms` and `PRIVACY.ms` — provisional placeholder sections (4 each), same structure as the other languages
- [ ] `[!] LEGAL-CONTENT VALIDATION REQUIRED` — final Terms of Use / Privacy Policy (Malaysia PDPA 2010 context) to be written and reviewed by a legal professional

## 7. Calendar and dates

- [x] `WEEK_DAYS_MS = ['Isn','Sel','Rab','Kha','Jum','Sab','Ahd']` (Monday-first), same array in CycleInformation and PregnancyMedicalInformation screens
- [x] `dateFormatLocale('ms')` → `'ms-MY'`
- [x] Hijri dates composed from the numeric Islamic parts (`COMPOSED_HIJRI.ms`): Muharam, Safar, Rabiulawal, Rabiulakhir, Jamadilawal, Jamadilakhir, Rejab, Syaaban, Ramadan, Syawal, Zulkaedah, Zulhijjah — `27 Syaaban 1445H`
- [ ] Confirm on device that Hermes formats Gregorian dates for `ms-MY` correctly (month names Januari … Disember; March = Mac)
- [ ] Native/scholar check of the Hijri month spellings and of the "H" suffix

## 8. Map (LocationScreen) — verified live 2026-10-28

- [x] MapTiler geocoder accepts `language=ms` (HTTP 200; an unknown code is rejected with HTTP 400) → `ms` is in `MAP_LANGUAGES`
- [x] The vector tiles do **not** carry `name:ms` (checked in tiles z4–z6 over South-East Asia: `name:id`, `name:ko`, `name:latin` present, `name:ms` absent) → map labels use the existing fallback chain `name:ms` → `name:latin` → `name` (local name, Latin script). Search results/addresses are requested in Malay.
- [ ] Device check: Location screen in Malay shows readable Latin labels; Malaysian places show their Malay/local names

## 9. PDF / CSV export

- [x] Malay uses only Latin-1 letters (verified: no letter above U+00FF in the dictionary outside the endonym list) → Helvetica WinAnsi covers it; **no new font**
- [ ] Exported PDF headers/labels read correctly in Malay (device check)

## 10. Illustrations

- [x] `EDITORIAL_IMAGES_MISSING_MALAY` exported; `EDITORIAL_IMAGE_ALT.*.ms` present for the 3 illustrations and says that the lettering is in English
- [ ] `[!] ILLUSTRATION-LOCALIZATION` — Malay artwork pending (see `malay-illustration-localization-spec.md`)

## 11. Android visual validation

- [ ] **Not done.** Never claim completion before the manual checklist (`malay-manual-android-test-checklist.md`) is run on a real device.
