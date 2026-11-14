# Bahasa Indonesia (id) — review checklist

Audience: a native Indonesian speaker with medical knowledge, and a religious reviewer (ulama / ustazah) for the Islamic
terms. The translation is complete (6,230 dictionary leaves, 73 educational articles, 41 pregnancy weeks) but has NOT
been reviewed by a native medical professional or a religious specialist. Voice used: informal-respectful **kamu**.

`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED` marks wording that touches rulings; the English source's neutrality between
schools of thought was preserved and nothing was added, removed or hardened.

## 1. Medical terms to confirm

| Where | Term used | Question |
|---|---|---|
| `journalOptions.cycleSymptom.discharge` | Keputihan | Often read as pathological; prefer "cairan vagina"? |
| `journalCervicalMucus.types.eggWhite`, `conceiveCalendar.mucusLabel.eggWhite` | Putih telur / Bening dan elastis | Natural lay term for egg-white mucus? |
| `profile.conceive.indicatorsSubtitle` | lendir serviks | vs "lendir leher rahim" |
| `menopauseSymptoms…hot_flashes`, HotFlashes article | Semburan panas / hot flash | vs "gelombang panas" |
| `menopauseSymptoms…brain_fog` | Otak berkabut | Informal calque; natural term? |
| `profile.menopause.hormonalTreatmentLabel`, MenopauseTreatments | Terapi hormon / terapi sulih hormon (TSH) | TSH also means thyroid-stimulating hormone |
| `pregnancyDashboard.due.dueDateLabel` | HPL (hari perkiraan lahir) | Native usage of the abbreviation |
| `postpartumLochia.*`, Lochia article | lokia | vs "darah nifas" in everyday use |
| `postpartumCycleReturn.hero.amenorrheaBadge`, FAQ | Amenore pascapersalinan / amenore laktasi | Standard terms |
| BabyBlues article | baby blues | vs "postpartum blues" |
| PcosSkinHair | hirsutisme | vs "pertumbuhan rambut berlebih" |
| ChooseHormonalMethod | AKDR hormonal | vs "IUD hormonal / spiral KB" |
| VaginalRing | IMS | Abbreviation for infeksi menular seksual |
| BoneHealth | densitometri tulang | Lay term (tes kepadatan tulang / DEXA) |
| `contraception.treatmentBreakLabel` | Jeda pemakaian | Wording for the pill-free interval |
| Pregnancy weeks 9, 11, 12, 24, 31, 32 | USG morfologi, kantung kuning telur, mengeras, ambang viabilitas, diabetes gestasional, kontraksi latihan (Braxton Hicks), presentasi kepala | Standard lay/medical phrasing |
| `calendar.dayCard.phase.*` | fase menstruasi / folikular / ovulasi / luteal | Phase naming |
| `conceiveStatistics.summary.intercourseThisCycle` | Hubungan intim | Discreet but clear wording |

## 2. Religious terms `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`

| Where | Term / wording | Question |
|---|---|---|
| Whole Islamic section | salat, puasa, puasa qada, nifas, istihadah, mandi wajib, bersuci, fatwa, mazhab, Kalender Hijriah | Spelling conventions (zikir vs dzikir, Al-Qur'an, ijmak, madhab/mazhab) |
| `prayerTimes.missedPrayersNote` | "salat yang terlewat selama menstruasi tidak perlu diganti" | Scholar validation of the statement |
| `prayerTimes.aboutHijriParagraph1` | rukyat hilal | Moon-sighting term |
| `postpartumDashboard.nifasModal.body`, `notifications.postpartum.nifas.reachedBody` | 40-day reference, return to salat | Ruling wording must stay neutral |
| NifasFiqh, NifasMedical, Istihada, ReturningToPrayer, PrayerDuringMenstruation, FastingQadaa, FiqhWomenIntro, ReligiousFaq, ReligiousFaqAfterLoss | mandi wajib timing, "rukun bulan", "utang" for owed fasting days, "rujukan fikih", "mazhab fikih" | Confirm each wording matches the source's neutrality |
| PostpartumRecovery | "Quarantaine" in quotes | Prefer "masa nifas / pantang"? |
| `qadaa.ramadanYear*` | "H" for AH (Hijriah) | Abbreviation convention |

## 3. Product names

| Where | Term | Question |
|---|---|---|
| `awaADeux.*` | AWA Berdua | Product-name translation needs team confirmation (AWA à deux / Together) |
| Premium | AWA Premium | Unchanged brand name |

## 4. Known decisions (not defects)

- `_one` and `_other` plural forms carry identical wording (Indonesian has one plural category); the only exception is
  `miscarriageDate.conflicts.journal_one`, whose English source uses different placeholders.
- Icon identifiers (for example `calendar-clock-outline`) are intentionally unchanged.
- Hijri month names come from `Intl` (`id-ID` islamic calendar); weekday initials in the compact picker are
  `S R K J S M S` (Senin…Minggu).
- The four text-in-image illustrations keep English lettering; see `indonesian-illustration-localization-spec.md`.
