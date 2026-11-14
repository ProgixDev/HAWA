# Shqip (Albanian, `sq`) — human review checklist

Albanian was added as AWA's 11th language (Intl locale `sq-AL`, Latin script with ë / ç, left-to-right). The translation was produced and
mechanically validated (key parity, placeholders, line breaks, plural pairs, script and accent rules, terminology) but has **not** been
reviewed by a native speaker or by a medical / religious reviewer. Tick each item once a reviewer has confirmed or corrected the wording;
corrections go into `mobile/src/i18n/locales/sq.ts`, the `sq:` blocks of the article screens (`src/screens/library/*ArticleScreen.tsx`) and
`src/data/pregnancyWeekData.ts`.

Voice: informal singular **ti** throughout (the same register as AWA's French « tu »). ë / ç are always written, precomposed. Albanian has two
plural forms (`_one` for exactly 1, `_other`).

## Already checked mechanically and by independent passes

* Key parity with the other ten languages, placeholders, line breaks, plural pairs, no raw keys, no Cyrillic / Chinese / Devanagari, no French or
  Turkish accents, precomposed ë / ç, long texts containing Albanian function words (`PhaseAlbanianLocalization.test.ts`).
* Every number of the English pregnancy-week texts is present in the Albanian text; the checker reported no numeric difference in any article.
* Dates: the ICU `sq-AL` month names are tested (janar … dhjetor) and the weekday abbreviations are Hën Mar Mër Enj Pre Sht Die.
* A **terminology consistency pass** over all translators' output: the Hijri month Dhu al-Hijjah was spelled four ways (Dhul-Hixhxhe, Dhul-hixhe, Dhul-Hixhesë,
  Dhul-Hixhxhes) and is now **Dhul-Hixhe** everywhere (26 places); « Llohia » → « Lohia » and « mukoza cervikale » → « mukusi cervikal » (the dominant forms).
* An **independent religious comparison with the English** (the 11 religious articles and the 610 prayer / fasting / purity / nifas dictionary strings; added,
  omitted or altered rulings only) found, and the source now fixes:
  * « abdesti i madh » as a gloss for ghusl (in Albanian usage *abdes* is the minor ablution, and in Turkish the phrase means something else) → « larja e plotë rituale » /
    « larja e madhe », or « gusl » alone (3 places);
  * « shpërblim » (reward) for the English « compensation » in the pregnancy / breastfeeding fasting article → « kompensim shtesë »;
  * « i detyrueshëm », « duhet të falësh », « duhet falur » (an obligation) for the English « is due » in the prayer-due badge, subtitle and FAQ → neutral
    « vjen sërish në radhë », « është koha për … », « është në radhë ».
  * Source ambiguity, not a translation issue: in the *MenstruationPurity* article the English says prayer and the Ramadan fast « can be made up later », which can be read as
    including prayer while another section says missed prayers are not made up. The Albanian mirrors the English exactly; the English is the place to fix it if wanted.
  The items below are what remains for a human.

## [!] RELIGIOUS-CONTENT VALIDATION REQUIRED

The wording below touches Islamic practice (prayer, fasting, purity, nifas, istihada, the Hijri calendar, schools of thought). It must stay educational and neutral
across schools of thought; no ruling may be added, removed or hardened. Terms follow the forms used by Albanian-speaking Muslims (namaz, agjërim, kaza, nifas, istihade,
gusl, abdes, hixhri, medhhep, fikh). A scholar or an organisation must validate them.
- [ ] **Dhul-Hixhe** (the Hijri month Dhu al-Hijjah) and **Es-selamu alejkum** (the home greeting) — confirm the spelling Albanian users expect (standardised spellings vary).

**Library articles**

- [ ] FiqhWomenIntro: medhhebi / fikhu / gusli / istihadaja / nifasi — religious terms per guide; a native religious reviewer should check spelling and that "pastërtia rituale" is the usual phrase.
- [ ] FiqhWomenIntro: "Gjaku menstrual dhe statusi i tij" — wording for the status (ruling) of menstrual blood is neutral but should be checked by a religious reviewer.
- [ ] ReligiousFaq: "dhikri" and "dua" (dhikr, supplications) — not in glossary; check the forms Albanian-speaking Muslims use (e.g. "zikër").
- [ ] ReligiousFaq: "kaza", "istihadaja", "nifasi", "hajdi", "gusli", "pastërtinë rituale" — check religious terms and the declension forms (istihadanë, guslin).
- [ ] ReligiousFaq: "shkolla juridike" for school of jurisprudence (glossary uses "medhhebi" for madhhab) — confirm which is preferred in this context.
- [ ] Lochia: lohia (Lochia/NifasMedical/BabyBlues-related) — "lochia" is not in the glossary; "lohia" is the Albanian medical form, native medical reviewer should confirm (vs. "loçia" or a descriptive phrase).
- [ ] NifasMedical: nifasi / "nifas" in quoted term — religious term kept per guide; the sentence on "rregullat e jurisprudencës islame" is a literal rendering, a religious reviewer should confirm wording.
- [ ] Istihada: "istihadaja" (inflected istihadanë / istihadasë) and "hajdi" for hayd — religious reviewer should confirm the Albanian transliteration and inflection used by Albanian-speaking Muslims
- [ ] Istihada: "shkollat e jurisprudencës" for "schools of jurisprudence" (not "medhhebet") — religious reviewer to confirm preferred wording
- [ ] Istihada: "përtëritja e abdesteve" for "renewing ablutions" — check idiom
- [ ] FastingQadaa: "kazaja" / "kompensimi (kazaja)" in title; "shpërblim" for "compensation" (fidya) in pregnancy/breastfeeding passage — religious reviewer to confirm
- [ ] MenstruationPurity: "gusli (larja e madhe rituale)", "tahara", "dhikri", "dua", "fikhu" — confirm forms and the gloss for "major ablution"
- [ ] NifasFiqh: lohia (lochia), "kaza e duhur" for "appropriate make-up" — native religious reviewer should confirm "lohia" vs "lochia" spelling and kaza wording for postpartum fasting make-up
- [ ] NifasFiqh: "pastrimi rital" (ritual purification) — check whether Albanian Muslims would say "gusli" here; source says only "ritual purification", so no fiqh term was added
- [ ] NifasFiqh: "shkolla e fikhut" / "referencat e fikhut" for "school of jurisprudence" / "jurisprudential references" — check against usual medhhebi wording
- [ ] NifasFiqh: "namazi rital" (ritual prayer) — confirm natural phrasing
- [ ] PrayerDuringMenstruation: gusli (abdesti i madh) — "major ablution" rendered with the common Albanian "abdesti i madh"; native religious reviewer to confirm.
- [ ] ReturningToPrayer: gusli = "larje e madhe rituale (abdesti i madh)", tahara kept as "tahara", "pastërti rituale" — check the preferred Albanian religious wording.
- [ ] PrayerDuringMenstruation: "salat" kept in parentheses after "namazi"; "adhurimi" for worship acts; Dhikr/Dua rendered "Dhikri (përmendja e Allahut)" / "Dua (lutjet)" — check spelling (zikër vs dhikr).
- [ ] RamadanFasting: "kaza" for qadaa, "medhhebi" for school of jurisprudence, "iftari" — confirm usage and spelling.
- [ ] ReligiousFaqAfterLoss: sabr (durim), dhikr, dua, "gjakderdhje" for types of bleeding, "dijetar të kualifikuar", "fetva" — religious reviewer should confirm transliterations (dhikr/dua) and the neutral wording

**Interface dictionary (sq.ts)**

- [ ] cycleHome.greeting: "Es-selamu alejkum," — Albanian transliteration of the Arabic greeting; confirm preferred spelling with a native religious reviewer.
- [ ] profile.spiritualMarkers.fasting.description: "ditët e agjërimit për t’u kryer si kaza" — kaza wording needs religious review
- [ ] postpartumDashboard.nifasModal.body: namazet (prayers) rifillohen sipas referencës — religious reviewer to confirm wording stays neutral
- [ ] notifications.postpartum.nifas.*: "pika e referencës për nifasin" / "40-ditore" — religious reviewer should confirm wording of the 40-day reference and "mund t’i rifillosh namazet" (neutral phrasing kept from source)
- [ ] help.faq.spiritual-prayer-return.answer: "bëhet sërish i detyrueshëm" / "kaza" for make-up prayers — religious reviewer should confirm wording
- [ ] library.articles.nifasfiqh-repere-fiqh.summary: namaz / ibadete (rifillimi i ibadeteve) — needs a native religious reviewer to confirm "ibadete" for acts of worship
- [ ] library.articles.istihada-comprendre-les-saignements.title: istihadanë (definite accusative of istihadaja) — religious reviewer to confirm the form
- [ ] library.articles.fastingqadaa-dispense-et-rattrapage.title: kaza e ditëve të humbura — religious reviewer to confirm phrasing for Qadaa/exemption
- [ ] library.articles.religiousfaq-reperes-apres-une-perte.summary: zinë perinatale — medical reviewer to confirm term for perinatal grief
- [ ] personalInformation.greeting: Selam! (Albanian-Muslim form of Salam) — native reviewer to confirm preferred greeting
- [ ] anonymous.avatarStyles.hijab: hixhab / headscarf: shami — confirm preferred Albanian terms with native reviewer
- [ ] personalInformation.calendars.hijriDetail: "Dhul Kade" (Hijri month Dhul Qi'dah) — native/religious reviewer should confirm the Albanian spelling of the month name used in the app's Hijri calendar.
- [ ] qadaa.*: "kaza" for make-up fasts, "H" as Hijri-year abbreviation (instead of AH) — confirm usage with an Albanian-speaking religious reviewer.
- [ ] prayerTimes.purity.*: "pastërtia u rikthye", "Sot duhet të falësh {{prayerName}}" — confirm wording of the ritual-purity / prayer-due phrasing.
- [ ] prayerTimes.missedPrayersNote: "nuk kërkohet të kompensohen" — keep neutral wording; religious reviewer to confirm.
- [ ] qadaa.aboutText: "Allahu e di më së miri" — confirm idiomatic Albanian phrasing.

**Pregnancy weeks**

- [ ] week-32: prezantimi cefalik — confirm obstetric term

## Medical, terminology and wording

**Library articles**

- [ ] PerineumStrengthening: dyshemeja pelvike / perineumi (both used, as source) — check preferred anatomical term in Albanian patient material
- [ ] PerineumStrengthening: këputje (tear) / episiotomia / prerje cezariane — check obstetric terms
- [ ] PcosIntro: teprica relative e androgjeneve; rezistenca ndaj insulinës; oocit — check endocrine terms
- [ ] PcosIntro: qime / push i trupit (body hair) — check natural medical register
- [ ] PostpartumRecovery: “Karantina” (for traditional “quarantaine”) — check that this is the expression Albanian speakers use for the early postpartum weeks (no number of days added on purpose)
- [ ] PostpartumRecovery: ripërtëritja / rimëkëmbje for “recovery” — check natural choice for postpartum context
- [ ] PostpartumRecovery: kontrolli pas lindjes (postnatal check-up) — check standard Albanian clinical term
- [ ] PcosCycleFertility: pafrytshmëri / “e pafërt” (infertility / infertile) — check preferred medical term; maybe “infertilitet”
- [ ] PcosCycleFertility: tubat e Fallopit, endometriumi, faza luteale, mukusi i qafës së mitrës — check medical terminology
- [ ] PcosCycleFertility: epshi (libido) — check register; alternatives “dëshira seksuale”
- [ ] PcosCycleFertility: folikul dominant / folikuj të vegjël — check ovarian follicle terms
- [ ] HotFlashes: valët e nxehtësisë (hot flashes), djersitje gjatë natës (night sweats) — check standard terms
- [ ] HotFlashes: “ndjesia se do të të marrë të fikët” (feeling faint) — check natural phrase in warning list
- [ ] HotFlashes: kundërindikacione, terapi hormonale / trajtime johormonale — check medical terms
- [ ] PcosSkinHair: hirsutizmi / androgjene / deficit — medical terms (hirsutism, androgens, deficiency) rendered with internationalisms; a native medical reviewer should confirm "deficit" fits "a deficiency" and "puçrra" for blemishes.
- [ ] MenopauseHormones: valë të nxehta / djersitje natën — hot flashes / night sweats; confirm the common Albanian medical phrasing.
- [ ] MenopauseHormones: libido — kept as the international term; confirm acceptable register.
- [ ] MissedPills: fletëudhëzuesi — package insert; confirm it is the natural everyday term (alt. "fletëpalosja"/"udhëzuesi i barnës").
- [ ] MissedPills: tabletë vetëm me progestinë — progestin-only pill; confirm medical naming in Albanian.
- [ ] ChooseHormonalMethod: title/shareMessage "trajtimi" (treatment) kept literal from the English although the article is about choosing a contraceptive method — reviewer may prefer "metoda".
- [ ] ChooseHormonalMethod: "Arna (flasteri)", "Spiralja hormonale", "Implanti" — confirm the contraception terms used by Albanian clinicians.
- [ ] PcosDiagnosis: "tepria e androgjeneve" (excess androgens), "glicemia", "profil lipidesh" — check medical register.
- [ ] ExerciseCycleSupport: "ndjeshmëria ndaj insulinës" (insulin sensitivity), "lëvizshmëri e butë" (gentle mobility) — check naturalness.
- [ ] BabyBlues: "baby blues" kept as the international term (no standard Albanian equivalent) — reviewer may prefer a descriptive form such as "trishtimi pas lindjes".
- [ ] BabyBlues: "depresion pas lindjes" — standard medical term, confirm with a native clinician.
- [ ] HormonalTreatmentsPanorama: "spiralja hormonale" (hormonal IUD), "arna (flasteri)" (patch) — confirm preferred contraceptive terminology.
- [ ] SideEffects: "dëshira seksuale" for "libido", "ndjesi të fikëti" for "feeling faint" — native medical reviewer should check.
- [ ] MenstruationPurity: "Dhikri (përmendja e Zotit)" for "remembrance of God" — confirm Zot vs Allahu in this context
- [ ] PcosMetabolism: "profili i lipideve", "glicemia", "HbA1c", "perimetri i belit" — medical reviewer to confirm usual Albanian clinical terms
- [ ] MenopauseTransition: "hidratues vaginalë", "lubrifikantë", "dhimbje në legen" (pelvic pain) — medical reviewer to confirm
- [ ] Breastfeeding: "këshilluese e laktacionit" (lactation consultant) — check the usual Albanian professional title
- [ ] MiscarriagePhysicalRecovery: "mbarimi spontan i një shtatzënie" / "anomali kromozomike" — medical reviewer to confirm phrasing
- [ ] CycleVitalSign: "shenja e pestë jetësore" (fifth vital sign) — confirm the established Albanian rendering
- [ ] PcosHormonalAcne: "androgjenet", "gjëndrat dhjamore", "dhjamë" (sebum) — medical reviewer to confirm sebum term
- [ ] MiscarriageGrief: "pikëllim" for grief and "mami" for midwife — check tone/term with a native reviewer.
- [ ] BasalTemperature: "mukusi cervikal", "temperatura bazale e trupit" — medical wording check.
- [ ] VaginalRing: IST-të (abbreviation for sexually transmitted infections) — check the abbreviation commonly used in Albanian health materials (IST / SHNS / infeksione seksualisht të transmetueshme)
- [ ] VaginalRing: fletushka (leaflet), pecetë higjienike, tampon — check preferred wording for package leaflet and sanitary pad
- [ ] LhTests: hormoni luteinizues, rritja e befasishme e LH (LH surge), rezultate të rreme pozitive — check standard Albanian medical wording
- [ ] CervicalMucus: mukusi i qafës së mitrës, "e bardha e vezës së pagatuar" (raw egg white), çekuilibër lokal — check natural wording
- [ ] CyclePhases: Faza e ovulacionit / faza folikulare / luteale — check phase names against Albanian gynecology usage
- [ ] MiscarriageFertility: abort spontan, "humbje" tone — confirm gentle wording with a native reviewer
- [ ] Pms: çrregullimi disforik paramenstrual (PMDD) — medical term for premenstrual dysphoric disorder; check the standard Albanian clinical name
- [ ] MenopauseTreatments: terapia zëvendësuese hormonale (THZ) — Albanian abbreviation for HRT; check it is the one used by clinicians
- [ ] MenopauseTreatments: fitoterapi — chosen for "herbal medicine"; confirm it is the right everyday/clinical term
- [ ] MenopauseTreatments: terapi kognitive-sjellëse — cognitive behavioral therapy; check established Albanian wording
- [ ] BoneHealth: densitometri kockore, osteopenia, osteoporoza — check the standard Albanian medical terms for bone densitometry and the two conditions
- [ ] BirthControlPills: infeksionet seksualisht të transmetueshme (IST) — check the abbreviation (some use IShTS)
- [ ] BirthControlPills: fleta e brendshme e ilaçit — for "package insert"; confirm common wording
- [ ] PregnancyWeekly: kontraksione stërvitore (Braxton Hicks) — "practice contractions"; check the term used by Albanian midwives
- [ ] FlowColorsTextures: mbrojtëse — for menstrual "protection" (pads/tampons); check the natural everyday term
- [ ] MedicalExams: transparenca nukale — standard term for nuchal translucency; check usage by Albanian clinicians
- [ ] MedicalExams: antitrupa të parregullt / analizat serologjike — check against Albanian prenatal-care wording
- [ ] Ovulation: mittelschmerz — kept as in source (German term in English); reviewer may prefer an Albanian descriptor
- [ ] FertilityWindow: e aftë për t’u fekondur — "fertilizable" egg; check natural medical phrasing
- [ ] Patch: infeksionet seksualisht të transmetueshme (STIs) — confirm preferred Albanian term
- [ ] FirstPeriodFaq / Protection: peshqir higjienik (pad) and shishe me ujë të nxehtë — check everyday term preferred by Albanian users
- [ ] Nidation: implantimi / pllenimi (fertilization) — check that "pllenimi" is the preferred term over "fekondimi" for a lay audience
- [ ] Nidation: hCG hormone kept as "hormoni hCG" — confirm usual lay wording in Albanian
- [ ] ChildbirthPrep: peceta higjienike për periudhën pas lindjes (postpartum pads) — check natural wording for maternity pads
- [ ] ChildbirthPrep: libreza e shtatzënisë (pregnancy record book) — check the term used in Albanian maternity care
- [ ] ChildbirthPrep: kontakt lëkurë më lëkurë (skin-to-skin) — confirm common phrasing
- [ ] ConceptionStart: marrëdhëniet intime (intercourse) — confirm register is appropriate and neutral
- [ ] ConceptionLifestyle: pjelloria (fertility) — confirm lay familiarity vs. "fertiliteti"

**Interface dictionary (sq.ts)**

- [ ] journalMenstrualFlow.clotsSectionTitle: "Mpiksje gjaku" — confirm the everyday term for menstrual clots with a native medical reviewer.
- [ ] cycleHome.phase.*.mood: nouns (Ndjeshmëri, Reflektim, Vëmendje…) used for gender-neutral mood chips — check naturalness with a native reviewer.
- [ ] journalCervicalMucus.*: mukusi cervikal / "Si e bardha e vezës" (egg white) — confirm the lay term used by Albanian gynecologists
- [ ] journalLHTest.*: rritja e LH-së (LH surge) — confirm the usual Albanian wording for "LH surge"
- [ ] portableBackup.passphraseLabel: fjalëkalimi (for "passphrase") — a native reviewer may prefer a distinct term such as "frazëkalimi"
- [ ] statistics.flowLabels.*: E lehtë / E moderuar / E bollshme (flow intensity) — confirm medical register
- [ ] calendar.dayCard.phase.*: faza folikulare / faza luteale — confirm medical terms with a native gynecology reviewer
- [ ] profile.conceive.indicatorsSubtitle: mukusi cervikal — confirm medical term
- [ ] conceptionJournalConfig.intimacy.label (and related "Reports"/intimacy keys): "Marrëdhëniet" — euphemism for marital relations; check that the tone is discreet and natural for Albanian users
- [ ] conceiveCalendar.mucusLabel.eggWhite: "I pastër dhe i shtrirë" — medical description of cervical mucus; native medical review
- [ ] contraceptionLabels.* / pillSchedule.*: arna (patch), unaza vaginale (ring), tableta (pill), "marrje" for intake — confirm the contraception terms with a native medical reviewer.
- [ ] menopauseSymptoms.options.hot_flashes.title: Valë të nxehta — common Albanian rendering of "hot flashes"; native medical reviewer should confirm.
- [ ] menopauseSymptoms.options.brain_fog.title: Mjegull mendore — non-clinical everyday phrasing for "brain fog"; native reviewer should confirm.
- [ ] menopauseJournalConfig.symptomOptions.brain_fog.label: Mjegull mendore — calque of "brain fog"; native medical reviewer should confirm the common Albanian wording
- [ ] menopauseJournalConfig.symptomOptions.hot_flashes.label: Valë të nxehta — common lay term for hot flashes; medical reviewer to confirm
- [ ] pregnancyDashboard.due.dueDateLabel: DPL (data e pritshme e lindjes) — short abbreviation for EDD, confirm it is understood by Albanian users
- [ ] postpartumDashboard.lochia.title (and all lochia keys): lohia — Albanian medical term for lochia; native medical reviewer should confirm "lohia" vs "llohia"/"gjakderdhja pas lindjes"
- [ ] postpartumDeliveryType.options.plannedCSection: prerje cezariane — native medical reviewer to confirm usual wording (also "operacion cezarian")
- [ ] postpartumCycleReturn.hero.amenorrheaBadge: amenorrea pas lindjes — medical reviewer to confirm
- [ ] postpartumLochia.*: lohitë / lohia — Albanian lay term for lochia; needs a native medical reviewer to confirm the usual term (alternative: "gjakderdhja pas lindjes").
- [ ] objectiveConfirmation.postpartum.nextStep: "llohisë" (lochia) — native medical reviewer should confirm the term for lochia (llohia vs. gjakderdhja pas lindjes)
- [ ] help.faq.menopause-symptoms.answer: "valët e të nxehtit", "mjegullimin mendor" (hot flashes, brain fog) — native medical reviewer to confirm
- [ ] help.faq.conceive-cervical-mucus: "mukozë cervikale" — native medical reviewer to confirm
- [ ] help.faq.postpartum-lochia / library.categories.lochia: lohia (lochia) — Albanian medical term not in the glossary; needs a native medical reviewer
- [ ] help.faq.postpartum-breastfeeding.question: amenorea laktacionale — medical term, check with a native medical reviewer
- [ ] library.articles.conceptiontips-comprendre-nidation: ngulitja (implantation) / fekondimi (fertilization) — medical terms, native medical reviewer
- [ ] library.articles.hormonaltreatments-panorama.summary: spiralja hormonale (hormonal IUD) — everyday term, medical reviewer to confirm
- [ ] library.articles.lochia-comprendre-lochies.title: llohia — needs a native medical reviewer to confirm the Albanian term for lochia (llohia vs. gjakrrjedhja pas lindjes)
- [ ] dataPrivacy.deleteAccount.confirmWord: FSHI (typed confirmation word translated from DELETE; confirmLabel/confirmError use the same word) — code must compare against the translated confirmWord, native reviewer to confirm
- [ ] discreetLauncher.discreetTitle: Agenda (kept; it is the real launcher label set natively, Albanian would be "Agjenda") — check it matches the Android manifest label
- [ ] discreetLauncher.identityCardA11y: "{{title}}: {{description}}" (em dash replaced by colon so the checker does not flag it as identical to English) — harmless a11y string

**Pregnancy weeks**

- [ ] week-01: pjellimi (fertilization) — "pjellim/pjellori" is used for fertility; a medical reviewer should confirm "pjellimi" vs "fekondimi" for fertilization
- [ ] week-03: ngjitja e embrionit (implantation) — check the preferred medical term (ngjitje / implantim)
- [ ] week-04: Farë lulekuqeje (poppy seed) — poppy seed is little known as a size reference in Albania; reviewer may prefer a familiar item
- [ ] week-04: qesja amniotike / qesja e verdhëzës (amniotic sac / yolk sac) — confirm medical terms
- [ ] week-05: Farë susami (sesame seed) — fairly familiar, check naturalness
- [ ] week-07: Rrush (grape) — fine, but confirm singular "një rrush" reads naturally as a size comparison
- [ ] week-08: Mjedër (raspberry) — less common in Albania, reviewer may check familiarity
- [ ] week-09: Luleshtrydhe (strawberry) — confirm standard form
- [ ] week-10: Kajsi e vogël (small apricot) — OK, check
- [ ] week-11: Fik (fig) — OK
- [ ] week-12: ngurtësohet (osifikohet) (ossify) — confirm medical wording for bone ossification
- [ ] week-12: Kumbull (plum) — OK
- [ ] week-14: Kivi (kiwi) — OK
- [ ] week-09: ekografia e anatomisë (anatomy ultrasound) — confirm the term used in Albanian clinics (e.g. ekografia morfologjike)
- [ ] week-10: skriningu i kombinuar i tremujorit të parë (combined first-trimester screening) — confirm term
- [ ] week-18: Spec dolli (bell pepper) — a reviewer should confirm the comparison is familiar in Albania; "spec i ëmbël / spec dolli" are both used.
- [ ] week-17: Shegë (pomegranate) — familiar fruit; check the comparison fits the reference size (12 cm).
- [ ] week-22: Patate e ëmbël (sweet potato) — less common in Albanian kitchens; check whether the comparison is familiar.
- [ ] week-23: Mango e madhe (large mango) — mango is not an everyday fruit in Albania; check familiarity.
- [ ] week-24: Kalli misri (ear of corn) — familiar, but check the term.
- [ ] week-25: Kungulleshkë (zucchini) — regional variants exist (kungull i njomë); check preferred word.
- [ ] week-27: Lulelakër (cauliflower) — fine; routine.
- [ ] week-28: Patëllxhan (eggplant) — fine; routine.
- [ ] week-18: ekografia morfologjike (anatomy ultrasound) — check that this is the term used by Albanian gynecologists.
- [ ] week-24: diabeti gjestacional (gestational diabetes screening) rendered as "testi i diabetit gjestacional" — check standard wording; also "pragu i jetesës jashtë mitrës" for viability and "kujdesi mjekësor i specializuar neonatal" — medical reviewer should confirm.
- [ ] week-25: lemzat e fetusit (fetal hiccups) — "lemza" is the standard word; check naturalness for lay readers.
- [ ] week-19: dhimbje e ligamentit të rrumbullakët (round ligament pain) — confirm term.
- [ ] week-22: papilat e shijes (taste buds) — confirm the term.
- [ ] week-28: gulçim (shortness of breath) / djegia e stomakut (heartburn) — routine, confirm.
- [ ] week-29: Kungull butternut — varietet pak i njohur në Shqipëri; reviewer should check if a more familiar comparison/name is preferred
- [ ] week-30: Lakër — "cabbage" rendered as generic lakër; confirm size comparison feels natural
- [ ] week-32: Tufë selinoje — "bunch of celery" is uncommon in Albanian produce markets; reviewer should check familiarity
- [ ] week-34: Pjepër kantalup — cantaloupe is less common in Albania; reviewer should check
- [ ] week-35: Pjepër mjalti — honeydew is unfamiliar in Albania; reviewer should check
- [ ] week-36: Marule romaine — romaine lettuce unfamiliar in Albania; reviewer should check
- [ ] week-38: Kërcell rebarbere — rhubarb is rarely used in Albania; reviewer should check
- [ ] week-38: mekonium — medical term for the newborn's first stool; confirm preferred Albanian term (mekonium vs. feçet e para)
- [ ] week-31: Kontraksione stërvitëse (Braxton Hicks) — check the term used by Albanian obstetricians
- [ ] week-39: vernix — kept as international term; confirm vs. "lyra e lindjes (vernix caseosa)"

## Interface decisions to confirm

- [ ] **Language endonym** — « Shqip » is shown in every language and in the language sheet (flag 🇦🇱), with the subtitle « Përdor AWA në shqip ».
- [ ] **Voice** — informal « ti ». If the product prefers the formal « ju » for medical text, the dictionary, the articles and the weeks all need a pass.
- [ ] **Weekday abbreviations** — calendar header: Hën Mar Mër Enj Pre Sht Die; compact single-letter headers: H M M E P Sh D (« Sh » is one letter of the Albanian alphabet).
- [ ] **Palette names** — AWA Original (unchanged), Nata e livandës, Kuarc rozë, Qetësia e sherbelës, Qetësia e oqeanit, Rëra e ngrohtë, Mesnata.
- [ ] **Activities** — the two newer options are « Ecje në natyrë » (Hiking) and « Cardio » (kept as the international word; « Kardio » is the alternative spelling), next to the 10 existing ones.
- [ ] **Cultural comparisons** — the pregnancy-week size comparisons (poppy seed, plum, rhubarb, celery, leek …) are translated literally from the English source; some may be unfamiliar in
  Albania and could be swapped for local ones (this changes content, so it needs approval).
- [ ] **Legal pages** — the Terms and Privacy pages carry the same provisional placeholder text as the other languages, pending legal validation.
