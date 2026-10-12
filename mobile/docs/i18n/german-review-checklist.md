# German (de) — human review checklist

Status of every German string in AWA: **model-generated, validated by scripts, NOT reviewed by a person.**
No native-speaker review, no medical review and no religious review has taken place. Automated checks (key parity
with English, placeholders, line breaks, plural pairs, no foreign sentences, umlauts present, a terminology scan,
structure of the 72 articles and 41 pregnancy weeks, numbers) prove the text is complete and mechanically sound.
They do **not** prove that it is natural, medically accurate, religiously appropriate or legally valid. Nothing
below is claimed as reviewed.

Unifications already applied by the terminology audit: the month name «Dhu al-Hijjah» had five spellings and is now
«Dhu al-Hiddscha» everywhere; «Bildender Inhalt» → «Bildungsinhalt»; the German ring label for the menstrual phase is
«Menstruation» (the long compound «Menstruationsphase» would not fit the cycle ring); ellipsis after a word has no
space («Wird gespeichert…», 22 strings).

## 1. Native-speaker review (UI copy — 6,181 dictionary keys)

Highest-traffic namespaces first: `onboarding`, `cycleHome`, `calendar`, `statistics`, `profile`, `journalOptions`,
`notifications` + `notificationPermission`, `help`, `library`, `premium`, `awaADeux`, `export`,
`backupUtility` / `portableBackup` / `dataSafety`.

| # | Topic | Current choice | Question |
|---|---|---|---|
| 1 | Register | informal «du» everywhere (matches the French «tu» / Turkish «sen» copy; Russian uses formal «вы») | Right tone for an intimate health app, or prefer «Sie»? |
| 2 | Loanword «Tracking» | 258 uses («Tracking», «Zyklus-Tracking») | Keep, or use «Verfolgen / Erfassen / Aufzeichnung» in headings? |
| 3 | Period | «Periode» (UI, 356×) vs «Menstruation / Regelblutung» (educational) | Mixed by context; acceptable or unify? |
| 4 | Journal | «Tagesjournal» / «Journal» / «Tagebuch» | Which one for the daily journal feature? |
| 5 | Postpartum | «Wochenbett» / «nach der Geburt» | Fine as the objective name? |
| 6 | Pregnancy loss | «Schwangerschaftsverlust» (objective) / «Fehlgeburt» (educational) | Gentle enough for the loss objective? |
| 7 | Lochia | «Wochenfluss» (with «Lochien» in articles) | Lay term understood? |
| 8 | Trying again (loss objective) | «Neuanfang» / «Neuer Versuch» | Tone — never pushy |
| 9 | Make-up fasts | «Qada» (term), «Fastentage nachholen» (descriptive) | Headline term? |
| 10 | Hijri | «Hidschri-Kalender», month «Dhu al-Hiddscha», years «n. d. H.» | Standard German spelling and abbreviation |
| 11 | Terms kept as in Arabic | Nifas, Istihada, Ghusl, Hayd, Fiqh, Fatwa, Dhikr, Du’a | Explained enough for lay readers? |
| 12 | Scholars | «Gelehrte» / «Gelehrte oder Gelehrter» (no gender stars) | Too long? «fachkundige Person»? |
| 13 | Abbreviations | SSW, ET (Entbindungstermin), PCOS, PMS/PMDS, IUP/Spirale, HRT | Understood on small chips? |
| 14 | Hormone therapy | «Hormonersatztherapie (HRT)» (German also: «Hormontherapie», «HET») | Preferred term |
| 15 | Short chips | «Med. Angaben», «(gesch.)», «Nächtl. Aufwachen» | Abbreviations acceptable or spell out? |
| 16 | Legal | Terms/Privacy are a provisional placeholder in every language | Not legal text; needs the real document |
| 17 | Confirmation word | «LÖSCHEN» (accepted in any case) | Natural? Note: «ß» upper-cases to «SS» |
| 18 | «In Frankreich» in the menopause article | kept from the source (age figure is French) | Fit for a German audience? |

## 2. Medical review (content a clinician or midwife must approve)

Translated from the existing English/French editorial text; nothing invented. A medical reviewer must confirm that
the German preserves clinical meaning, thresholds and "when to consult" advice.

* **Pregnancy weeks 1–41** (`src/data/pregnancyWeekData.ts`, `de` block): size comparisons, body changes, tips.
  Numbers were verified identical to English by test; wording was not clinically reviewed.
* **Library articles (72)** (`src/screens/library/*ArticleScreen.tsx`, `de:` block), in particular contraception
  (pills, missed pills, ring, patch, hormonal method choice), fertility awareness, PCOS, menopause / HRT, postpartum
  (baby blues, breastfeeding, lochia), pregnancy loss, bone health, medical exams («Mutterpass», «Feinultraschall»).
* **Statistics / health labels**, **medical PDF / CSV export** (headings printed for a doctor; CSV header cells are
  lower-case German words «datum / kategorie / wert»), and the legacy article «So funktioniert dein
  Menstruationszyklus».
* **Illustration wording** proposed in `german-illustration-localization-spec.md`.

## 3. Religious review (a qualified scholar / organisation must approve)

Marker used elsewhere in the project: `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`.

* `qadaa`, `prayerTimes`, `spiritualGuidance`, `hijriCalendar`: make-up fasting wording, purity status («Reinheit /
  Reinheitsstatus»), Nifas, prayer-time notes.
* `library.religiousDisclaimer` and the articles on Nifas, Istihada, prayer during menstruation, fasting and Qada,
  Fiqh of women, religious FAQ (also after loss).
* The Qada notification and the Nifas reminders.
* Terminology differs between schools and between German and Arabic usage; the content stays neutral and
  educational — a reviewer must confirm this holds in German.

## 4. Visual / device validation

See `german-manual-android-test-checklist.md`. Not performed: the German UI has not been run on a device.
