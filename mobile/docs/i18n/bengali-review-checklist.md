# বাংলা (Bengali, `bn`) — human review checklist

Bengali was added as AWA's 15th language (the 16th code of the registry; Intl locale `bn-BD`, Bengali script, horizontal left-to-right; `bn-IN` / `bn_BD` / `bn_IN` all resolve to `bn`). The translation was produced
and mechanically validated (key parity, placeholders, line breaks, plural handling, script and punctuation rules, terminology) and compared with the English by six independent reviewers, but it
has **not** been reviewed by a native Bengali speaker, a medical reviewer or a religious (Bangladeshi / West Bengal Muslim community) reviewer. Tick each item once a reviewer has confirmed or
corrected the wording; corrections go into `mobile/src/i18n/locales/bn.ts`, the `bn:` blocks of the article screens (`src/screens/library/*ArticleScreen.tsx`) and `src/data/pregnancyWeekData.ts`.

Voice: polite **আপনি** forms (-ন verbs) everywhere; buttons and labels are short noun phrases or verb stems; the subject is omitted whenever Bengali allows it. Digits are **Western digits** (the
rest of AWA's numbers, dates and counters are Latin digits; Bengali digits ০–৯ were deliberately not used, see `bengali-regional-locales.md`), the sentence end is the **dari ।**, other punctuation
is ASCII (`, ? ! : ( )`), quotes “ ”. Counters are attached with a space (`28 দিন`) or as `{{count}}টি`. A Bengali case ending is never written directly after a non-numeric `{{variable}}`.
Bengali has no grammatical number after a numeral: every `_one` key carries the wording of its `_other` (the one exception is `miscarriageDate.conflicts.journal_one`, a different English sentence,
translated separately). Plural categories: *one* = integer part 0 or exactly 1 (CLDR `bn`), *other* otherwise; the on-device `Intl.PluralRules` shim implements it like Hindi.

## Already checked mechanically and by independent passes

* Key parity with the other fifteen language codes (6,247 leaf keys), placeholders, `\n` counts, no raw keys, NFC-normalised (ড় ঢ় য় as the standard letters), no Devanagari / Assamese ৰ ৱ /
  Han / kana / Hangul / Cyrillic / Arabic, no Bengali digits, no zero-width joiners, no ASCII full stop after Bengali text, no double danda, Bengali letters present in every long text
  (`PhaseBengaliLocalization.test.ts`).
* All **73 articles** (72 generated + the hand-written *Understand your cycle*) and all **41 pregnancy weeks** have a `bn` block of the same structure as the English one; every figure
  (days, weeks, percentages, thresholds) of the English is present in the Bengali.
* Dates: `bn-BD-u-nu-latn` Intl (Latin digits), weekdays সোম মঙ্গল বুধ বৃহ শুক্র শনি রবি (one-letter forms সো ম বু বৃ শু শ র in the calendar headers). **Hijri dates**: ICU prints the month
  as a number, so `cycleMath.ts` composes the Hijri date for Bengali (as for Japanese and Korean): «12 রমজান 1447 হিজরি» with the months মুহাররম, সফর, রবিউল আউয়াল, রবিউস সানি,
  জমাদিউল আউয়াল, জমাদিউস সানি, রজব, শাবান, রমজান, শাওয়াল, জিলকদ, জিলহজ.
* **Independent comparison with the English** by six reviewers (11 religious articles + the religious-keyed dictionary strings — 1,130 pairs; 13 safety-relevant medical articles — 672 pairs;
  the whole interface dictionary — 5,297 pairs; the other articles and the pregnancy weeks — 1,306 pairs): 201 findings (**1 high**, 30 medium, 170 low), **all applied** to the source.
  The high one reversed a ruling («রোজার মতো … কাজা করতে হয় না», "unlike fasting"); the mediums included a softened medical caveat, wrong size comparisons (cantaloupe → খরমুজ, rhubarb
  → a familiar vegetable), "Most frequent X" labels that read as "greatest X", an «illegal» used for an invalid LH test, and one term for each of ঘনিষ্ঠ / অন্তরঙ্গ, শ্লেষ্মা / নিঃসরণ, হালকা / কম / অল্প
  (flow). No ruling, school-of-law statement, number of days, dose, threshold or warning sign was added, removed or changed after the fixes.
* "Premium", "AWA", "PIN", "PDF", "CSV", "FSH", "LH", "hCG" stay Latin (product names / lab abbreviations); the delete-confirmation word is the typed word **মুছুন**, compared after NFC and
  removal of zero-width joiners (`foldForConfirmation`), so every Bengali keyboard's spelling is accepted.

## Things a reviewer must decide (open items)

### Medical / clinical terminology
- [ ] এপিসিওটমি / পেরিনিয়াল কাটা (episiotomy) — transliteration vs descriptive Bengali.
- [ ] হিরসুটিজম (hirsutism), আপেক্ষিক অ্যান্ড্রোজেনের আধিক্য, ইনসুলিন রেজিস্ট্যান্স (PCOS) — confirm with an endocrinology reviewer.
- [ ] জরায়ুমুখের শ্লেষ্মা vs জরায়ুমুখের নিঃসরণ (cervical mucus) — the dictionary uses শ্লেষ্মা; the help FAQ and one onboarding row use নিঃসরণ: pick one, and the three descriptive types
  (আঠালো / ক্রিমের মতো / ডিমের সাদা অংশের মতো; egg-white = স্বচ্ছ ও প্রসারণশীল).
- [ ] ফলিকল-উদ্দীপক হরমোন for FSH and the Latin abbreviations in lab-tracking screens (FSH / ইস্ট্রাডিওল) — usage in Bangladeshi lab reports.
- [ ] ব্রেন ফগ (মনোযোগে ঝাপসা ভাব) — colloquial symptom term; no settled Bengali term.
- [ ] অ্যামেনোরিয়া vs মাসিক বন্ধ থাকা; ল্যাকটেশনাল অ্যামেনোরিয়া (postpartum / breastfeeding).
- [ ] সম্মিলিত বড়ি / শুধু প্রোজেস্টিনযুক্ত বড়ি; নন-হরমোনাল / হরমোন থেরাপি (hormonal-treatments panorama, missed pills, hot flashes).
- [ ] ডিম্বাণু জরায়ুতে স্থাপিত হওয়া (implantation); যৌন আকাঙ্ক্ষা (libido) — register.
- [ ] অধিক আঘাতজনিত কার্যকলাপ ("high-impact activities") — natural phrasing.
- [ ] কোয়ারেন্টিন (*quarantaine*, the traditional French postpartum term) — keep as a loan word or replace by a Bengali cultural equivalent (আঁতুড়ঘর / চল্লিশা).
- [ ] The two size comparisons the audit replaced (week 34 → খরমুজ, week 38 → a familiar item) and the other fruit/vegetable comparisons: are they familiar in Bangladesh and West Bengal?
- [ ] গর্ভধারণ হারানোর তারিখ and the rest of the pregnancy-loss wording — tone.

### Religious terminology (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`)
- [ ] Vocabulary follows Bangladeshi Muslim usage: নামাজ, রোজা, রমজান, কাজা, নিফাস, ইস্তিহাযা, হায়েজ, গোসল, অজু, তায়াম্মুম, হিজরি, ফতোয়া, মাযহাব, ফিকহ, ইজমা, কুরআন, সুন্নাহ, কিবলা, আযান,
  আল্লাহ, মুসলিম. A Bangladeshi and a West Bengal reviewer should confirm each (spellings vary: নামাজ / নামায, রোজা / রোযা, রমজান / রমযান, আযান / আজান).
- [ ] «ফিকহের মাযহাবসমূহ» for "schools of jurisprudence (madhab)"; ইজমা for "consensus" (FiqhWomenIntro).
- [ ] «দিনের চিহ্ন» for the AWA nifas day marker (`spiritualGuidance.nifasReferenceReachedHeadline`) and the single name chosen for "Spiritual markers" (the audit unified four variants).
- [ ] «মাযহাবভেদে ভিন্ন হতে পারে» — neutral phrasing of the school differences (nifas maximum duration, `help.faq.postpartum-nifas`).
- [ ] «নামাজ আবার শুরু করতে পারেন» (postpartum nifas modal, `notifications.postpartum.nifas.reachedBody`) and `prayerTimes.purity.*` («পবিত্রতা ফিরে এসেছে», «নামাজ আদায় করতে হবে»).
- [ ] `qadaa.aboutText` («কাজা করতে হয়») and `miscarriageDashboard.quickActions.qadaa` («কাজা রোজা»).
- [ ] Hijri month spellings in `cycleMath.ts` (`COMPOSED_HIJRI.bn`) — e.g. জিলকদ / জিলক্বদ, জিলহজ / জিলহজ্জ.
- [ ] `FiqhWomenIntro`, `Istihada`, `MenstruationPurity`, `NifasMedical`, `NifasFiqh`, `ReturningToPrayer`, `RamadanFasting`, `PrayerDuringMenstruation`: religious framing sentences.
- [ ] **Source-level issue (not a Bengali one):** as in the other languages, the English `MenstruationPurity.section2Body` says prayer and the fast "can be made up later"; the Bengali mirrors it
  faithfully. A content owner must correct the source, then the Bengali is re-aligned.

### Wording / UX
- [ ] Welcome screen: the English lockup "Welcome / to / AWA" is split in three Texts; Bengali says «স্বাগতম» + (empty prefix) + «AWA». Check it reads naturally.
- [ ] Palette names (six) and the discreet launcher name «এজেন্ডা» (the real Android launcher label is native).
- [ ] Email / name placeholders: «উদাহরণ: example@email.com» and `your@email.com` — plain Latin examples are intentional.
- [ ] Date placeholders and the abbreviated weekday forms (বৃহ vs বৃহঃ; one-letter calendar headers).

## How to correct

Edit `bn.ts` / the `bn:` blocks directly; keep the placeholders, `\n` counts, NFC and the dari. Run `npx jest src/i18n/__tests__/PhaseBengaliLocalization.test.ts` afterwards.
