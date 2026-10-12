# Russian (ru) — human review checklist

Status of every Russian string in AWA: **model-generated, validated by scripts, NOT reviewed by a person.**
No native-speaker review, no medical review and no religious review has taken place. Automated checks (key parity,
placeholders, the four plural forms, no foreign sentences, Cyrillic everywhere a word is expected, structure of the
72 articles and 41 pregnancy weeks, a terminology-consistency scan) prove the text is complete and mechanically
sound. They do **not** prove that it is natural, medically accurate, religiously appropriate or legally valid.
Nothing below is claimed as reviewed.

Corrections already applied by the automated terminology audit (so the reviewer sees consistent text):
Hijri month spellings unified («Зуль-хиджа», «Зуль-каада»; there were three spellings of Dhu al-Hijjah) and the two
renderings of "healthcare professional" unified to «медицинский специалист» (47 replacements). Everything else
below is a question, not a fix.

## 1. Native-speaker review (UI copy — 6,356 dictionary keys)

Reviewer: a native Russian speaker, ideally one who uses a health / women's-health app.

Highest-traffic namespaces first (key count): `onboarding` (183), `cycleHome` (97), `calendar` (98),
`statistics` (98), `profile` (240), `journalOptions` (201), `notifications` (78) + `notificationPermission` (12),
`help` (263), `library` (295), `premium` (57), `awaADeux` (272), `export` (237),
`backupUtility` / `portableBackup` / `dataSafety` (85 / 38 / 24).

| # | Topic | Current choice | Question |
|---|---|---|---|
| 1 | Register | formal «вы» everywhere (the Turkish text uses informal "sen") | Right tone for an intimate health app, or «ты» for the younger first-period articles? |
| 2 | "Period" | «месячные» (433 uses, UI) vs «менструация/менструальный» (129, educational text) | Mixed by context on purpose; acceptable, or unify? |
| 3 | Pregnancy loss | «потеря беременности» (objective name) / «выкидыш» (educational, 22 uses) | Gentle enough for the loss objective? |
| 4 | Make-up fasts | «каза» (term) and «посты для восполнения» (descriptive); chips «Каза постов» / «Каза поста» | Which one should be the headline term? Chips differ only in plural. |
| 5 | Nifas / Istihada / Ghusl / Hayd | «нифас», «истихада», «гусль», «хайд» | Spelling and whether lay readers understand them. |
| 6 | Hijri | «Зуль-хиджа», «Зуль-каада», years «г. х.» | Standard Russian spellings and abbreviation. |
| 7 | Abbreviations | «ПДР» (EDD), «ПМДР» (PMDD, some sources use «ПМДР»/«ПДР»), «СПКЯ», «ВМС», «МГТ», «ИППП», «ЛГ» | Are they understood without expansion on small chips? |
| 8 | Short chip | «Медданные» for "Medical info" | Natural, or spell out? |
| 9 | Postpartum mood | «послеродовая хандра» («беби-блюз» once in parentheses) | Which term do clinicians use with patients? |
| 10 | Gender | feminine where the user speaks of herself («Забыла», «Я родила», «оставайтесь активной») | Consistent? Neutral wording preferred anywhere? |
| 11 | Baby | «малыш» (warm) / «ребёнок» / «плод», «эмбрион» (clinical) | Mixed by context; check week-by-week text. |
| 12 | Numbers in sentences | «Проанализировано циклов: N», «Дней с записями: N», «Выбрано: N» (no declension) | Acceptable? |
| 13 | Strings reworded to pass a Cyrillic check | e.g. `postpartumJournalEntry.mood.noteCounter` «{{count}} из 300» | Fine as is? |
| 14 | Confirmation word | «УДАЛИТЬ» (accepts any case) | Natural? |
| 15 | Length | Cyrillic is 15-35% longer than English | Check clipping on a small phone in each objective (see the manual Android checklist). |

## 2. Medical review (content a clinician or midwife must approve)

Not invented and not "improved": translated from the existing English/French editorial text. A medical reviewer must
confirm the Russian preserves clinical meaning, thresholds and "when to consult" advice.

* **Pregnancy weeks 1–41** (`src/data/pregnancyWeekData.ts`, `ru` block): baby size comparisons (fruit and
  vegetable names were adapted: «болгарский перец», «стебель ревеня», «дыня канталупа»), body changes,
  "good to know" lists. Numbers were verified identical to English by test; wording was not clinically reviewed.
* **Library articles (72)** under `src/screens/library/*ArticleScreen.tsx`, `ru:` block — in particular
  contraception methods, pills and missed pills, hormonal method choice, fertility awareness (basal temperature,
  cervical mucus, LH), PCOS / irregular cycles, menopause and perimenopause (HRT = «менопаузальная гормональная
  терапия (МГТ)»), postpartum (baby blues, breastfeeding, lochia), pregnancy-loss support, bone health,
  medical-appointment preparation (nuchal translucency = «воротниковое пространство плода»).
* **Statistics / health labels**: `statistics`, `*Statistics`, `generalHealth`, `pregnancyMedicalInformation`,
  `postpartumLochia`, `journalCervicalMucus`, `journalLHTest`, `journalTemperature`, `contraceptionLabels`,
  `pillSchedule`.
* **Medical PDF / CSV export** (`export`, 237 keys): headings and category labels printed for a doctor
  (CSV headers are lower-case «дата», «категория», «значение»).
* **Illustration wording** proposed for the four artworks: `russian-illustration-localization-spec.md`.
* **The legacy article «Как устроен менструальный цикл»** (`UnderstandCycleArticleScreen`, now with a Russian
  block; unreachable from navigation today).

## 3. Religious review (a qualified scholar / organisation must approve)

Marker used elsewhere in the project: `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`.

* `qadaa` (142 keys): make-up fasting wording, automatic / manual ledger, reminders.
* `prayerTimes` (46), `spiritualGuidance` (30), `hijriCalendar` (17): purity status, Nifas, prayer-time notes.
* `library.religiousDisclaimer` and the articles on Nifas, Istihada, prayer during menstruation, fasting and
  Qadaa, Fiqh of women, religious FAQ (also after loss): transliterations «фикх», «мазхаб», «фетва», «тахара»,
  «богослов»/«учёный».
* The notification «Посты для восполнения» and the Nifas reminders (`notifications.postpartum.nifas.*`).
* Terminology differs between schools and between Russian and Arabic usage; the content was written to stay
  neutral and educational — a reviewer must confirm this still holds in Russian.

## 4. Legal

`LegalDocumentScreen` Terms/Privacy are a provisional placeholder in every language (no approved legal text
exists); the Russian carries the same four sections and no added clause. It is not legally validated.

## 5. Visual / device validation

See `russian-manual-android-test-checklist.md`. Not performed: the Russian UI has not been run on a device.
