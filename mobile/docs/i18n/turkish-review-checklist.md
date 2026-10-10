# Turkish (tr) — human review checklist

Status of every Turkish string in AWA: **model-generated, validated by scripts, NOT reviewed by a person.**
Automated checks (key parity, placeholders, plural pairs, no foreign sentences, correct letters, structure of
articles and pregnancy weeks) prove the text is complete and mechanically sound. They do **not** prove that it is
natural, medically accurate, religiously appropriate or legally valid. Nothing below is claimed as reviewed.

## 1. Native-speaker review (UI copy — all 6,145 dictionary keys)

Reviewer: a native Turkish speaker, ideally one who uses a health / women's-health app.

Highest-traffic namespaces to read first (key count in brackets): `onboarding` (183), `cycleHome` (95), `calendar` (96),
`statistics` (78), `profile` (236), `dailyJournalSheet` (41), `journalOptions` (201), `notifications` (78),
`premium` (57), `auth` (52), `help` (263), `awaADeux` (268), `backupUtility` / `portableBackup` / `dataSafety`
(83 / 38 / 24).

Specific questions for the reviewer:

| # | Topic | Current choice | Question |
|---|---|---|---|
| 1 | Register | informal singular ("sen") everywhere | Right tone for an intimate health app, or prefer "siz"? |
| 2 | Lochia | "Loşyan" (7 occurrences) | "Loğusalık akıntısı / lohusalık kanaması" is the usual lay term; is "Loşyan" understood? |
| 3 | Pregnancy | "Gebelik" 52× vs "hamile" 34× | Mixed by context (clinical vs personal). Keep, or unify? Glossary required "Gebelik". |
| 4 | Menstruation | "Adet" (160×), "regl" (2×) | Is "regl" acceptable colloquially or should it be removed? |
| 5 | Pregnancy loss | "düşük" (5×) + softer phrasings | Is the wording gentle enough for the loss objective (sensitive context)? |
| 6 | Postpartum | "Doğum sonrası" (43×) | Fine as the objective name? |
| 7 | Premium / paywall | Premium 23× | Natural phrasing for purchase prompts. |
| 8 | Date strings | typographic apostrophe in suffixes ("AWA’yı") | Suffix harmony around product names and numbers (e.g. "5. gün’ü"). |
| 9 | Confirmation word | "SİL" (accepts SİL / sil / SIL) | Natural? |
| 10 | Length | longer than English in places | Check clipping on a small phone in each objective (see Visual validation). |

## 2. Medical review (content a clinician or midwife must approve)

Not invented, not "improved": translated from the existing English/French editorial text. A medical reviewer must
confirm the Turkish preserves clinical meaning, thresholds and "when to consult" advice.

* **Pregnancy weeks 1–41** (`src/data/pregnancyWeekData.ts`, `tr` block): baby size comparisons, body changes,
  "good to know" lists. Numbers were verified identical to English by test; wording was not clinically reviewed.
* **Library articles (72)** under `src/screens/library/*ArticleScreen.tsx`, `tr:` block — in particular
  contraception methods, pills, hormonal method choice, fertility awareness (basal temperature, cervical mucus,
  LH), PCOS / irregular cycles, menopause and perimenopause, postpartum (baby blues, breastfeeding, lochia),
  pregnancy-loss support, bone health, medical-appointment preparation.
* **Statistics / health labels**: `statistics`, `*Statistics`, `generalHealth`, `pregnancyMedicalInformation`,
  `postpartumLochia`, `journalCervicalMucus`, `journalLHTest`, `journalTemperature`, `contraceptionLabels`,
  `pillSchedule`.
* **Medical PDF / CSV export** (`export`, 235 keys): headings and category labels printed for a doctor.
* **Illustration wording** proposed for the four artworks is listed separately in
  `turkish-illustration-localization-spec.md` (items marked NEEDS MEDICAL REVIEW).

## 3. Religious review (a qualified scholar / organisation must approve)

Marker used elsewhere in the project: `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`.

* `qadaa` (122 keys): qaḍāʼ fasting wording ("kaza orucu", "kaza borcu"), automatic / manual ledger, reminders.
* `prayerTimes` (46), `spiritualGuidance` (28): purity ("temizlik") status, Nifas, prayer-time notes, "next prayer".
* `library.religiousDisclaimer`: "Bu içerik tamamen eğitim amaçlıdır… âlimlere danışılarak teyit edilmelidir."
  Confirm the register of "âlim", "fetva", "dinî hüküm".
* Nifas / purity / Hijri articles in the library and the postpartum Nifas reminder (`postpartumReminders`).
* Terminology differs between schools and between Turkish and Arabic usage (nifas / loğusalık, hayız / adet,
  kaza / ödeme). The content is written to stay neutral and educational; a reviewer must confirm this holds in Turkish.

## 4. Legal review

* `src/screens/LegalDocumentScreen.tsx` → `TERMS.tr` and `PRIVACY.tr` are **provisional placeholder text**, like
  their fr / en / es siblings. They are not a binding legal document and must be replaced by counsel-approved text
  (including KVKK — Turkish personal-data law — considerations for health data) before any public release in Turkey.
* `about`, `privacyScreen`, `privacySecurity`, `dataPrivacy`, `anonymous`: statements about what data is stored and
  how it is protected must match the product's real behaviour.
* Store / consent copy for notifications and location permissions.

## 5. Visual validation (not possible in Jest)

Needs a person with a device or emulator set to a small screen (≈ 360×740) and a large one, light + dark:

* No clipped or overlapping Turkish text on Home, Calendar, Statistics, Journal, onboarding, dialogs, paywall.
* Uppercase eyebrows show İ / I correctly **with the phone language set to something other than Turkish**
  (the case the casing fix targets).
* The four text-in-image illustrations still show English lettering (no Turkish artwork yet).
* Medical PDF generated in Turkish: letters ğ ş ı İ draw, headings are regular weight (no bold available).
