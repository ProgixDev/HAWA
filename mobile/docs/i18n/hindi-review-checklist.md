# हिन्दी (Hindi, `hi`) — human review checklist

Hindi was added as AWA's 10th language (Intl locale `hi-IN`, Devanagari script, left-to-right). The translation was produced
and mechanically validated (key parity, placeholders, line breaks, script, terminology) but has **not** been reviewed by a native
speaker or by a medical / religious reviewer. Tick each item once a reviewer has confirmed or corrected the wording; corrections go
into `mobile/src/i18n/locales/hi.ts`, the `hi:` blocks of the article screens (`src/screens/library/*ArticleScreen.tsx`) and
`src/data/pregnancyWeekData.ts`.

Voice: polite **आप** throughout. Western digits 0-9 everywhere (never ०-९). Hindi has two plural forms (`_one` for 0 and 1, `_other`).

## Already checked mechanically and by an independent comparison with the English

* Key parity with the other nine languages, placeholders, line breaks, plural pairs, script, Western digits, no raw keys and no ordinary English words left in Latin letters (tests: `PhaseHindiLocalization.test.ts`).
* Every number of the English pregnancy-week texts is present in the Hindi text; the only six differences in the articles are ordinals written as words (« 1st trimester » → « पहली तिमाही »).
* A second, independent read of the religious content (the 11 religious articles and the 610 prayer / fasting / purity / nifas dictionary strings) compared each Hindi text with the English for **added, omitted or altered rulings**. It led to these corrections, now in the source:
  * *वाजिब* (a specific fiqh grade) → *देय* in the prayer-due badge and subtitle (the English only says « due »);
  * *मत* (school of thought) → *संदर्भ* in the nifas dialog (the English says « reference »);
  * *बड़ा वुज़ू* (not a correct name for ghusl) → *बड़ी रस्मी सफ़ाई*, the wording the article body already used;
  * the technical term *हैज़* removed from 16 labels / topics that only say « menstruation » in the English;
  * *फ़िदया* (FastingQadaa), *इज्तिहाद* (ReligiousFaq), *क़ियास* / *इज्मा* / *नुसूस* (FiqhWomenIntro) and the gloss « शरीअत के क़ानूनी अध्ययन » removed or replaced by the neutral wording of the English; « Perform the ritual purification » is no longer narrowed to *ग़ुस्ल*.
  The items below are what remains for a human.

## [!] RELIGIOUS-CONTENT VALIDATION REQUIRED

The wording below touches Islamic practice (prayer, fasting, purity, nifas, istihada, schools of thought). It must stay educational and
neutral across schools of thought; no ruling may be added, removed or hardened. Terms follow the forms common among Hindi / Urdu-speaking
Indian Muslims (नमाज़, रोज़ा, क़ज़ा, निफ़ास, इस्तिहाज़ा, ग़ुस्ल, फ़िक़्ह, उलमा). A scholar or an organisation must validate them.

**Library articles**

- [ ] FiqhWomenIntro: हैसियत (status of menstrual blood) / फ़र्ज़ vs छूट vs पसंदीदा सलाह (obligation/exemption/recommendation) — check fiqh wording
- [ ] ReligiousFaq: ग़ुस्ल described as "पूरे शरीर को धोकर की जाने वाली बड़ी पाकी की क्रिया" (source: major ablution) — religious reviewer should confirm wording
- [ ] ReligiousFaq: "फ़िक़्ही मत (मदहब)" for schools of jurisprudence, "आलिम/उलमा" for scholars, "सदक़ा" for charity — check usage
- [ ] Lochia/NifasMedical: लोकिया — transliteration of the medical term; check if a Hindi term (e.g. प्रसवोत्तर स्राव) is preferred by clinicians.
- [ ] NifasMedical: निफ़ास / "इस्लामी फ़िक़्ह के नियमों के दायरे" — religious framing sentence; a religious reviewer should confirm neutrality.
- [ ] Istihada: आलिम/आलिमा (scholar, gender-inclusive) used in place of source "scholar" — check wording; "इस्तिहाज़ा" kept per glossary
- [ ] Istihada: "फ़िक़्ही मसलक" for "schools of jurisprudence" — confirm preferred term
- [ ] MenstruationPurity: "तहारत" and ghusl description (ग़ुस्ल) — religious reviewer should confirm wording
- [ ] NifasFiqh: "फ़िक़्ह के मसलक", "योग्य उलमा/आलिम", "फ़र्ज़ रोज़ा ... क़ज़ा" — the source says "school of jurisprudence"; used मसलक/फ़िक़्ही मत; a religious reviewer should confirm neutral wording and that "हैसियत" (status) reads naturally.
- [ ] NifasFiqh: लोकिया (lochia) — transliteration used; a medical reviewer may prefer प्रसवोत्तर स्राव.
- [ ] ReturningToPrayer: "पाकी" for tahara / "मसलक" for school — check the term preference and the 6-day example wording
- [ ] RamadanFasting: "सदक़ा", "ज़िक्र", "आलिम" — check religious term choices
- [ ] ReligiousFaqAfterLoss: "हुक्म" (status/ruling), "आलिम", "ज़िक्र", "सब्र" — check wording is neutral and matches the source's non-ruling tone for Indian Muslim readers
- [ ] ReligiousFaqAfterLoss: "आज़माइश" for "trial" — reviewer to confirm register

**Interface dictionary (hi.ts)**

- [ ] notifications.postpartum.nifas.reachedBody: "रक्तस्राव जारी रहने पर भी आप अपनी नमाज़ फिर से शुरू कर सकती हैं" — religious ruling statement (40-day nifas reference); needs scholar validation
- [ ] notifications.postpartum.nifas.*: निफ़ास संदर्भ बिंदु — religious term wording needs native reviewer
- [ ] notifications.qadaa.title: क़ज़ा रोज़े — check wording with native religious reviewer
- [ ] help.faq.spiritual-*: रूहानी निशानियाँ for "spiritual markers" — religious reviewer to confirm term (vs. धार्मिक संकेत)
- [ ] help.faq.spiritual-prayer-return.answer: "लाज़िम" for "due again" — religious reviewer to confirm wording
- [ ] library.articles.nifasfiqh-repere-fiqh.summary: निफ़ास/नमाज़/रोज़ा wording — needs native religious reviewer
- [ ] library.articles.religiousfaq-reperes-apres-une-perte.title: रूहानी सहारे (spiritual landmarks) — check tone with a native reviewer
- [ ] library.articles.istihada-comprendre-les-saignements.title: इस्तिहाज़ा — religious term spelling to confirm

## Medical, terminology and wording

**Library articles**

- [ ] PerineumStrengthening: पेरिनियम / पेल्विक फ़्लोर / एपिसियोटॉमी / यूरिनरी कैथेटर — transliterated anatomical and procedure terms; a native medical reviewer should confirm everyday Hindi usage.
- [ ] PcosIntro: ऊसाइट (oocyte) and "एंड्रोजन का अपेक्षाकृत ज़्यादा होना" (relative androgen excess) — technical terms, check wording with a native medical reviewer.
- [ ] PcosIntro: "आहार पूरक (सप्लीमेंट)" — confirm the common term.
- [ ] PostpartumRecovery: “क्वारंटाइन” (for French “quarantaine”) — traditional postpartum 40-day term; a native reviewer may prefer “चालीसा/चिल्ला”.
- [ ] HotFlashes: हॉट फ़्लैश — confirm preferred Hindi term vs. “गर्म लहर/गर्मी की लहर”.
- [ ] PcosSkinHair: हर्सुटिज़्म / एंड्रोजन — medical terms kept transliterated; check
- [ ] MissedPills: "पैकेज इन्सर्ट" for package insert — check whether "दवा के साथ मिला पर्चा" is preferred
- [ ] PcosDiagnosis: "बाँझपन" for infertility, "फ़ॉलिकल", "एंड्रोजन" — medical reviewer should check
- [ ] ChooseHormonalMethod: "कॉन्ट्राइंडिकेशन" glossed as "मनाही" — medical reviewer should check
- [ ] HormonalTreatmentsPanorama: कॉन्ट्राइंडिकेशन "मना किए जाने के कारण" — check clinical phrasing; "कामेच्छा" (libido) in SideEffects too.
- [ ] MenopauseTransition: "रजोनिवृत्ति" in parentheses on first mention of menopause in body1a (the French age 51 figure kept as in source)
- [ ] CycleVitalSign: "पाँचवाँ जीवन-संकेत" (fifth vital sign) — check it reads naturally to Hindi medical readers.
- [ ] Breastfeeding: लैच / लैक्टेशन कंसल्टेंट — loanwords chosen; confirm they are understood by a lay audience.
- [ ] PcosHormonalAcne: एंड्रोजन / सीबम / त्वचा रोग विशेषज्ञ — confirm terms.
- [ ] BasalTemperature: "सर्वाइकल म्यूकस" — check if a more common Hindi term is preferred
- [ ] MiscarriageFertility: "दाई-नर्स (मिडवाइफ़)" for midwife — confirm term familiar to Indian users
- [ ] MenopauseTreatments: "हॉट फ़्लैश" rendered as "गर्मी की लहरें (हॉट फ़्लैश)" — check the common Hindi term
- [ ] PregnancyWeekly: "ब्रैक्सटन हिक्स" / "अभ्यास संकुचन" — check the term used by Hindi obstetric sources
- [ ] BoneHealth: ऑस्टियोपीनिया / बोन डेंसिटोमेट्री — transliterated; check preferred Hindi medical wording
- [ ] FlowColorsTextures: "ऊतक" for tissue and "तंतुनुमा" for stringy — check natural wording for users
- [ ] MedicalExams: न्यूकल ट्रांसलूसेंसी / मॉर्फ़ोलॉजी अल्ट्रासाउंड / सीरोलॉजी (टॉक्सोप्लाज़मोसिस, रूबेला) — transliterated clinical terms; reviewer should confirm the wording commonly used by Indian doctors
- [ ] MedicalExams: गर्भावधि मधुमेह (gestational diabetes) — check the common term (जेस्टेशनल डायबिटीज़ vs गर्भावधि मधुमेह)
- [ ] Ovulation: मिटलश्मेर्ज़ (mittelschmerz) — German loanword transliterated; reviewer may prefer a descriptive phrase (ओव्यूलेशन के समय का दर्द)
- [ ] Patch: कंबाइंड गोली / गर्भाशय ग्रीवा का म्यूकस — confirm terms for combined pill and cervical mucus
- [ ] Nidation: इम्प्लांटेशन (transliteration, no Hindi gloss) — reviewer may prefer "गर्भाशय में रोपण" in the educational text
- [ ] ChildbirthPrep: बर्थ प्लान / प्रसवोत्तर पैड — check these are the terms Indian users actually say
- [ ] PregnancyExercise: संकुचन for "contractions" — check against common lay term (जैसे "प्रसव पीड़ा/कॉन्ट्रैक्शन")

**Interface dictionary (hi.ts)**

- [ ] journalIntimacy.libidoTitle: यौन इच्छा — sensitive term for libido; native reviewer should confirm tone is discreet enough
- [ ] journalCycleEvolution.phase.follicular/luteal: फ़ॉलिकुलर / ल्यूटियल चरण — transliterated medical terms; confirm preferred Hindi usage
- [ ] postpartumLochia.*: लोकिया — transliteration used without a Hindi gloss; a native medical reviewer should confirm whether to add "प्रसव के बाद का रक्तस्राव"
- [ ] miscarriageStatistics.tracking.notesCount_one/_other: "नोट दर्ज" — source has no count in string; check the UI composes count + label naturally
- [ ] objectiveConfirmation.postpartum.nextStep: लोकिया — medical loanword for lochia; confirm with native medical reviewer
- [ ] help.faq.conceive-cervical-mucus: सर्वाइकल म्यूकस — medical loanword; confirm with native medical reviewer
- [ ] help.faq.postpartum-lochia: लोकिया (प्रसव के बाद का स्राव) — transliterated term; medical reviewer should confirm preferred Hindi wording
- [ ] help.helpSupport.modal.placeholderEmail: "आपका@email.com" — checker requires Devanagari; confirm placeholder choice
- [ ] export.data.postpartum.consistency: गाढ़ापन (lochia consistency) — medical term to confirm
- [ ] dataPrivacy.deleteAccount.confirmWord: "हटाएँ" (typed confirmation word, was DELETE; checker required Devanagari) — confirm the app's comparison logic accepts the localized word and that Hindi-keyboard typing is acceptable

**Pregnancy weeks**

- [ ] week-04: उल्ब थैली (एम्नियोटिक सैक) / योक सैक — check the standard Hindi medical terms used for amniotic sac and yolk sac
- [ ] week-12: आलू बुखारा (plum) — check that this fruit name is the one familiar to Indian users
- [ ] week-04: खसखस का दाना (poppy seed) — check familiarity of the comparison for Indian users
- [ ] week-14: उल्ब द्रव (एम्नियोटिक फ़्लूइड) — check the standard term for amniotic fluid
- [ ] week-09: जननांग ... विभेदित होना — check wording for genital differentiation
- [ ] week-15: लैनुगो (lanugo) — transliterated; reviewer may prefer a Hindi term for fetal down
- [ ] week-17: उल्बीय द्रव (एम्नियोटिक फ़्लूइड) — check the Hindi term is the one used in Indian obstetrics
- [ ] week-19: राउंड लिगामेंट का दर्द — transliterated; confirm common usage
- [ ] week-24: जीवन-क्षमता की सीमा (viability) — sensitive wording, check tone and phrasing
- [ ] week-24: गर्भकालीन मधुमेह — confirm vs. "जेस्टेशनल डायबिटीज़"
- [ ] week-38: मेकोनियम — transliteration used for meconium; reviewer may prefer a Hindi everyday term
- [ ] week-39: वर्निक्स — transliteration of vernix caseosa; check the term used by Indian clinicians
- [ ] week-37: लीक (गंदना) — produce comparison; check the common name in India
- [ ] week-38: रूबार्ब का डंठल — rhubarb is uncommon in India; consider a more familiar comparison
- [ ] week-32: सेलरी का गुच्छा — celery comparison; check familiarity

## Interface decisions to confirm

- [ ] **Delete-confirmation word** — `dataPrivacy.deleteAccount.confirmWord` and `backupUtility.delete.confirmWord` are « हटाएं » (anusvara spelling). The comparison (`foldForConfirmation`, `src/utils/textCase.ts`) also accepts the chandrabindu spelling « हटाएँ » and either Unicode spelling of a nukta letter. Confirm the word reads naturally to users; « डिलीट » is the common alternative.
- [ ] **Language endonym** — « हिन्दी » is shown in every language and in the language sheet (flag 🇮🇳), with the subtitle « AWA को हिन्दी में इस्तेमाल करें ».
- [ ] **Weekday abbreviations** — calendar header: सोम मंगल बुध गुरु शुक्र शनि रवि; compact single-sheet headers: सो मं बु गु शु श र.
- [ ] **Loan-words** — पीरियड, ओव्यूलेशन, नोटिफ़िकेशन, बैकअप, प्रोफ़ाइल, लोकिया, … are written in Devanagari on purpose (the form Indian users actually say). A reviewer may prefer a Sanskritised word in some places.
- [ ] **Cultural comparisons** — the pregnancy-week size comparisons (poppy seed, plum, rhubarb, celery, leek …) are translated literally from the English source. Some fruits and vegetables are unfamiliar in India and may be swapped for local ones (this changes content, so it needs approval).
- [ ] **Legal pages** — the Terms and Privacy pages carry the same provisional placeholder text as the other languages, pending legal validation.
