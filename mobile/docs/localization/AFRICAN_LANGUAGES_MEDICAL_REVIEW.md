# AWA — African languages: medical-terminology review (kab, om, ti, rw, rn, ig, yo, zu, xh, sn, ln, ff)

Review date: 2026-11-02. Reviewer: an AI assistant (Claude), working from the repository sources.

## 1. Executive summary

- All 12 languages are **technically integrated** (6306 dictionary keys each, 73/73 library articles, 41/41 pregnancy weeks, legal text, image descriptions, PDF support).
- This review is an **AI review**, not a native-speaker or clinical review. The original text was also written by an AI. Two AI passes do not replace a native speaker: a shared blind spot can survive both.
- The review combined (a) automated scans of every dictionary string, article leaf and pregnancy-week leaf, and (b) a side-by-side comparison of how each key medical concept is rendered across all keys that use it (terminology-consistency tables).
- **9 distinct corrections (30 strings)** were applied in this phase (section 5). They are limited to cases where the current text was demonstrably wrong (a different word with a clearly different meaning) or where an untranslated English label had an established in-language equivalent in the same file.
- **No language may be marked Native reviewed or Ready for release.** Evidence for neither exists.

## 2. Methodology and limits

1. Scans (script `audit.js`, run on all dictionary values, every article block and every pregnancy-week block): stray English words, stray Greek / CJK / Cyrillic letters, mojibake, replacement characters, double spaces, non-NFC text (outside the tone-mark languages), values identical to the English source, Latin words inside Tigrinya (Ethiopic) text.
2. Terminology tables (script `terms.js`): for ~30 concepts (cervical mucus, ovulation, fertile window, menopause, breastfeeding, contraception, postpartum, Nifas, Istihada, lochia, period, cycle, pregnancy, spotting, cramps, hot flashes, basal temperature, LH test, trimester, partner, fertility, intimacy, symptoms, mood …) every key whose English value is exactly that concept was compared across the 12 languages, looking for (a) several different renderings of one concept and (b) a word whose ordinary meaning is something else.
3. Limits: I am not a native speaker of any of the 12 languages and have no access to a dictionary or corpus for most of them. I judged words by recognised meaning and by consistency inside the file. Sentence-level grammar of 3,800 article/week leaves per language was **not** read line by line; only mechanically detectable defects and concept-level terms were reviewed. Nothing here is a clinical validation.
4. Not changed: dictionary keys, placeholders, plural structure, article and week structure, tests. Parity was re-checked after the edits (all 12: 6306 keys, 0 missing, 0 placeholder mismatch, 73/73, 41/41).

## 3. Findings per language

Severity: Critical / High / Medium / Low. Confidence: H / M / L. "NR" = native review required (always yes unless stated).

### Tigrinya (ti)
| # | Where | Source | Was | Problem | Action | Sev | Conf |
|---|---|---|---|---|---|---|---|
| 1 | `ti.ts` hot-flashes labels (4 keys) | Hot flashes | ድንገታዊ ሃሞት | ሃሞት means bile / gall, not heat | **Fixed** → ድንገታዊ ሙቐት ኣካል (as used elsewhere for hot flashes) | High | M-H |
| 2 | `ti.ts` help FAQ | Can I export my data? | ዳታይ ክኣቱ (export) | "ክኣቱ" means "enter" (import direction) | **Fixed** → ዳታይ ከውጽእ (export) | Medium | M |
| 3 | partner (earlier phase) | Partner | መበቆል | means origin | Fixed earlier → ብጻይ | High | M |
| 4 | `PcosSkinHairArticleScreen` line 1344 | stress-related hair loss text | "ትርፊ ሃሞት" | ሃሞት again; probably intended "excess stress" or "excess hormone" | **Not changed** | Medium | L |
| 5 | Terms | Menopause / Perimenopause | 4–5 different renderings (ምውዳእ ወርሓዊ ኣበባ, ማረፊ ወርሓዊ ደም, መኖፓውዝ …) | Inconsistent | Document; choose one with a native reviewer | Medium | — |
| 6 | Terms | Period | ወርሓዊ ደም ×13 vs ወርሓዊ ኣበባ ×3 | Inconsistent | Document | Low | — |
| 7 | Terms | Ovulation | ኦቭዩላሽን / ኦቭዩሌሽን / ኦቩሌሽን; objectiveConfirmation uses "ምጽባሕ ውልዲ (ovulation)" | 3 spellings | Document | Low | — |
| 8 | Old-blood wording | "older blood" | ቀደም ዝነበረ ደም | Earlier phase replaced "ዕቱብ ደም"; own wording | Document (NR) | Medium | L |

### Lingala (ln)
| # | Where | Problem | Action |
|---|---|---|---|
| 1 | Cervical mucus: "Mai ya mongongo ya libumu" (×5), "Mucus ya col", "Mai ya kingo ya libumu" | 3 renderings; "mai" (water) conveys fluid, not mucus | Document; native review (High) |
| 2 | `mucusEvolutionInfo` "left to right" idiom | Previously corrected to "from start to end" | Applied earlier |
| 3 | Typo `bloodTypeSheetSubtitle` | corrected earlier | Applied earlier |
| 4 | Period: "Sanza" (×10, also means month/moon) vs "Règles" (×3) | Ambiguous / inconsistent | Document (Medium) |
| 5 | Cycle rendered "Cycle" or "Sanza" | Inconsistent | Document |
| 6 | Hot flashes: "Molunge makasi (hot flashes)" ... "Hot flashes" | mixed | Document |
| 7 | Many French loanwords kept (ovulation, hormone, symptôme, trimestre, fertilité) | Acceptable for Lingala medical use; consistency uneven (Menopause/Ménopause) | Document (Low) |

### Fulfulde (ff)
| # | Problem | Action |
|---|---|---|
| 1 | Greek γ in "Wiγtere" (comment) | Fixed earlier → ɣ |
| 2 | Regional/dialect terms differ widely (Pulaar vs Fulfulde Adamawa): period appears as Mensturasiyoŋ / mense / Regle / haila / lewru; pregnancy as reedu / Ɓesngu / Ɓernde | Document; dialect decision needed (High) |
| 3 | `NutritionCycle#31` left in English: "Salmon, sardines, walnuts, flaxseed." | **Not changed** (no reliable terms); NR (Low) |
| 4 | Hot flashes "Tiimɗe" (once) | Unclear meaning — NR (Medium) |
| 5 | Mixed spellings of the same loanword (ovulation / Ovulasiyoŋ; Teeste / Test) | Document |
| 6 | Fruit names untranslated in one week | see section 7 |

### Igbo (ig)
| # | Problem | Action |
|---|---|---|
| 1 | "drinking" left in English in 6 article sentences | Fixed earlier → ịṅụ mmiri |
| 2 | "Fertile window" left in English in one label | **Fixed** → "Oge ịtụrụ ime" (the form used in 5 other keys) |
| 3 | Cervical mucus: "Mmiri ọnụ akpa nwa" ("water of the mouth of the womb sac"), "Mucus cervical", English label ×5 | Mixed; NR (Medium) |
| 4 | Period: "Oge nsọ" (×5), "Nsọ ọnwa", "Ịhụ ọnwa" | 5 renderings (Medium) |
| 5 | Intimacy: "Mmekọrịta nzuzo" (private relationship) | Acceptable; NR |
| 6 | Combining marks: text has a few U+030D/U+0300 sequences | Rendering checked in PDF (see report to user); no text change |
| 7 | 20 pregnancy-week fruit/vegetable names left in English | section 7 |

### Yoruba (yo)
| # | Problem | Action |
|---|---|---|
| 1 | Cervical mucus rendered "Ìfun ọ̀nà ilé-ọmọ" (×5) — "ìfun" = intestines | **Fixed** → "Cervical mucus" (the loanword form already used in 2 other keys) until a native term is chosen (High, M) |
| 2 | Intimacy = "Ìbálòpọ̀" (sexual intercourse) — more explicit than "intimacy/private" | Document; NR (Medium) |
| 3 | Period: Oṣù / Nǹkan oṣù / Àsìkò | 3 renderings |
| 4 | Pregnancy-week produce names: 12 left in English | section 7 |
| 5 | Mixed NFC and combining-mark spellings (ẹ́, ọ́ built from base + mark) | Normal; PDF renderer shapes them |

### Xhosa (xh)
| # | Problem | Action |
|---|---|---|
| 1 | Cervical mucus label rendered "Ubomvu bomlomo wesibeleko" (×5) — "ubomvu" = redness | **Fixed** → "Ulwelo lomlomo wesibeleko" ("fluid of the cervix") |
| 2 | Body text still uses "intlama yomlomo wesibeleko" ("paste") — differs from the label | Document: terminology not unified (Medium). Not changed: grammatical agreement inside sentences would need a native check |
| 3 | `pregnancyNotifications.sections.pregnancy.title` = "Ubumnyama" (darkness) | **Fixed** → "Ukukhulelwa" (used 6× for Pregnancy) |
| 4 | Contraception: "Unqanaba-mitha" ×2 (pregnancy-stage word?) and "Ukthintela" (typo) | Document; NR (Medium) — the typo "Ukthintela inzala" should be reviewed |
| 5 | Several different forms for I-/i- prefix (I-Menopause / Imenopause) | Low |

### Zulu (zu)
| # | Problem | Action |
|---|---|---|
| 1 | Cervical mucus label "Ubomvu bomlomo wesibeletho" (×5) | **Fixed** → "Ulwelo lomlomo wesibeletho" |
| 2 | `pregnancyNotifications.sections.pregnancy.title` = "Isisu" (stomach) | **Fixed** → "Ukukhulelwa" |
| 3 | Other cervical-mucus forms: "Amafinyila", "Ubuthi" (poison/medicine) | Document; NR (High) |
| 4 | Typos from earlier phase ("Ngenkathi ulinde", "ezikusekela ohambweni") | Applied earlier |
| 5 | Period = "Isikhathi" ×15 ("time") | Common colloquial use but ambiguous; NR (Medium) |

### Shona (sn)
| # | Problem | Action |
|---|---|---|
| 1 | "Ovulation & fertile window" left in English; "Fertile window" ×5 in English | **Fixed** → "Ovulation uye nguva yekubata nhumbu" / "Nguva yekubata nhumbu" (rendering the translator used for the same concept elsewhere) |
| 2 | 17 pregnancy-week fruit names untranslated | section 7 |
| 3 | Period: "Kuenda kumwedzi" / "Nguva yekumwedzi" / "Mwedzi" | Inconsistent (Medium) |
| 4 | Many dictionary values equal English (331 identical values; most are placeholders, brands, units) | scan counts; no wrong meaning found |
| 5 | Cervical mucus kept as English "Cervical mucus" ×7 | acceptable placeholder; needs term |

### Kirundi (rn)
| # | Problem | Action |
|---|---|---|
| 1 | One article share message untranslated (PcosHormonalAcne) | Fixed earlier |
| 2 | Cervical mucus: "Ibinyaruzi", "Ibinyoro" (the second may mean worms), "Ibisohoka" | Document; NR (High) |
| 3 | Period: "Imihango" ×13 and "Igihe" | consistent enough |
| 4 | Lots of English kept in brackets, e.g. "(cramps)", "(hot flashes)" | gloss style; Low |

### Kinyarwanda (rw)
| # | Problem | Action |
|---|---|---|
| 1 | Cervical mucus: three different phrases (Ururenda … umuhogo / nkondo y'umura / Ibyuka …) | NR (Medium) |
| 2 | Menopause: "Gucura" ×2 vs "Menopause" ×4 | Inconsistent (Low) |
| 3 | Pregnancy "Inda" used ×7 (belly/womb; common in pregnancy phrases) | acceptable |
| 4 | Partner = "Uwo babana" (the one you live with) | NR (Low) |
| 5 | Quality otherwise looks the most uniform of the 12 in scans | — |

### Kabyle (kab)
| # | Problem | Action |
|---|---|---|
| 1 | Greek letters ε γ from the translator | removed at injection → ɛ ɣ |
| 2 | Cervical mucus: "Aman n tgenfut" ×5 (unclear) | NR (Medium) |
| 3 | Period: "Lḥiḍ" (Arabic-derived, also medical Arabic term) / "Tanzagt" / "Lɛada" | NR (Medium) |
| 4 | Menopause kept as French "Ménopause" / "Menopause" | Low |
| 5 | Partner = "Amdan" ("person") | NR (Medium) |

### Oromo (om)
| # | Problem | Action |
|---|---|---|
| 1 | Cervical mucus "Dhangala'aa afaan gadaa" ×6 | NR (Medium) |
| 2 | Fertile window: 5 phrasings ("Yeroo ulfaa'uu danda'u", "Yeroo da'oo" …) | Inconsistent (Medium) |
| 3 | Pregnancy: "Ulfaa" / "Ulfa" / "Ulfaa'uu" | Inconsistent (Low) |
| 4 | Partner = "Hiriyaa" (friend) | NR (Medium) |
| 5 | Pregnancy-week produce names: 13 untranslated | section 7 |
| 6 | One dictionary file had a broken JSON entry in the source output, repaired earlier | Applied |

## 4. Critical medical-terminology issues (summary)

The words that most affect user understanding, and that need native + clinical review before release in every language:

- **Cervical mucus** — 3–5 renderings per language; two languages (zu, xh) had a word meaning "redness" and one (yo) a word meaning "intestine" (now corrected/replaced).
- **Fertile window / ovulation** — 3–5 renderings per language; users may read "ovulation day" and "fertile window" as different things.
- **Menstruation / period / cycle** — many languages use a general word for "time" or "month" (zu isikhathi, ln sanza, sn mwedzi, rw/rn imihango is established).
- **Postpartum bleeding (lochia), Nifas, Istihada** — kept as loanwords; no definition shipped in-language; religious wording must be reviewed by a scholar (see `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED` convention).
- **Miscarriage / pregnancy loss** — sensitive: tone and register unverified in all 12.
- **Hot flashes / basal temperature / LH test** — medical terms often glossed with the English term.

## 5. Corrections applied in this phase

1. ti: ድንገታዊ ሃሞት (bile) → ድንገታዊ ሙቐት ኣካል — 3 keys, plus the related subtitle (4 strings).
2. ti: "ክኣቱ (export)" → "ከውጽእ (export)".
3. yo: "Ìfun ọ̀nà ilé-ọmọ" → "Cervical mucus" — 5 keys.
4. xh: "Ubomvu bomlomo wesibeleko" → "Ulwelo lomlomo wesibeleko" — 5 keys.
5. xh: pregnancy section title "Ubumnyama" → "Ukukhulelwa" — 1 key.
6. zu: "Ubomvu bomlomo wesibeletho" → "Ulwelo lomlomo wesibeletho" — 5 keys.
7. zu: pregnancy section title "Isisu" → "Ukukhulelwa" — 1 key.
8. sn: "Fertile window" labels → "Nguva yekubata nhumbu" (5 keys), "fertile window" (1 key), reminder title (1 key).
9. ig: "Fertile window" → "Oge ịtụrụ ime" — 1 key.

Total: 9 decisions, 30 strings (ti 5, yo 5, xh 6, zu 6, sn 7, ig 1). Earlier-phase corrections (ti partner, ln mucus guide and typo, ff gamma, ig "drinking", xh mucus term, zu typos, rn share text) are listed in the per-language tables.

## 6. Items requiring native-speaker review (priority)

1. **ff, ti, ln, rn** — lowest-resource languages in this set; the whole medical vocabulary needs a professional pass. ff also needs a dialect decision.
2. **zu, xh, yo, ig** — cervical-mucus, period and fertile-window terms.
3. **sn, om, kab, rw** — consistency and the terms in sections 3–4.
4. **All 12** — Nifas / Istihada / lochia explanations, fasting and prayer wording (religious content), miscarriage and postpartum sensitivity.

## 7. Dialect and cultural considerations

- **Fulfulde**: spoken in 20+ countries with different standards (Pulaar in Senegal/Guinea, Fulfulde Adamawa, Maasina …). The translator mixed vocabulary; the intended target region (the selector flag is Senegal) is not defined.
- **Kinyarwanda / Kirundi**: very close; terms should be harmonised only with native input (rw "gusama"/"ubuvuke" vs rn "kuvyara").
- **Kabyle**: Latin Berber orthography is used; the Arabic-derived medical loanwords (lḥiḍ, lxṣuba) are common in practice.
- **Tigrinya**: Eritrean (flag) vs Ethiopian usage differs in loanwords and spelling.
- **Zulu / Xhosa**: euphemism and register around menstruation, sexuality and the cervix; hlonipha-type avoidance may make clinical terms sound harsh or ambiguous.
- **Shona, Oromo, Igbo, Yoruba, Lingala**: strong preference for English or French loanwords in medical contexts; whether to keep loanwords or use native terms is a product decision.
- **Produce comparisons** in the 41 pregnancy weeks (raspberry, plum, peach, kiwi …) are left in English in om (13), rw (3), rn (7), ig (20), yo (12), sn (17), ln (1), ff (1). Many fruit names are unfamiliar locally; a native reviewer should substitute locally known fruit.

## 8. Translation-quality risks

- Entire long-form text (73 articles, 41 weeks) is unreviewed AI writing; unnatural grammar, repetition and filler phrasing are expected, especially in ff and ti (translators said so).
- Wrong-but-plausible words (examples found: bile for heat, redness for fluid, stomach for pregnancy, darkness for pregnancy, intestine for cervix) imply more undetected cases exist.
- Religious terms are transliterated, not explained.
- Medical advice and urgency phrases were preserved structurally, but their strength in the target language was not verified.
- Date/Hijri month names are transliterated Latin (Ethiopic for ti), not native names.

## 9. Checklist for professional reviewers

For each language, a native speaker with health-communication experience should:

- [ ] Confirm one term each for: period, cycle, cervical fluid/mucus, ovulation, fertile window, fertility, pregnancy, miscarriage, postpartum, lochia, breastfeeding, contraception (pill, IUD, ring, patch), menopause/perimenopause, hot flashes, cramps, spotting, PCOS, midwife, doctor, partner, intimacy.
- [ ] Read the 20 highest-traffic screens (Home, Calendar, Journal, Statistics, Settings) in the app.
- [ ] Read all medical safety lines ("see a doctor", warnings) in the articles; confirm urgency is unchanged.
- [ ] Review miscarriage / pregnancy-loss / postpartum text for tone.
- [ ] Review religious text (prayer, fasting, qada, Nifas, Istihada) with a qualified person; keep it neutral across schools.
- [ ] Replace English produce names in pregnancy weeks with familiar local items.
- [ ] Confirm Hijri month names, weekday names and number formatting.
- [ ] Check legal text (terms, privacy) with a qualified translator.
- [ ] Check text length on a small phone and in the PDF export.
- [ ] Sign the review with name, date and scope.

## 10. Release-readiness assessment

| Code | Language | Status | Evidence |
|---|---|---|---|
| kab | Kabyle | Technically integrated; AI-reviewed; Native review pending | scans + terminology table |
| om | Oromo | Technically integrated; AI-reviewed; Native review pending | same |
| ti | Tigrinya | Technically integrated; AI-reviewed; Native review pending (priority) | same; 2 corrections |
| rw | Kinyarwanda | Technically integrated; AI-reviewed; Native review pending | same |
| rn | Kirundi | Technically integrated; AI-reviewed; Native review pending (priority) | same |
| ig | Igbo | Technically integrated; AI-reviewed; Native review pending | same |
| yo | Yoruba | Technically integrated; AI-reviewed; Native review pending | same; 1 correction |
| zu | Zulu | Technically integrated; AI-reviewed; Native review pending | same; 2 corrections |
| xh | Xhosa | Technically integrated; AI-reviewed; Native review pending | same; 2 corrections |
| sn | Shona | Technically integrated; AI-reviewed; Native review pending | same; 1 correction |
| ln | Lingala | Technically integrated; AI-reviewed; Native review pending (priority) | same |
| ff | Fulfulde | Technically integrated; AI-reviewed; Native review pending (priority; dialect decision) | same |

None is **Native reviewed** or **Ready for release**: no native or clinical reviewer has examined any of them.


---

# Round 2 — remaining terminology issues (2026-11-02)

Same limits as above: AI review, no native speaker, no dictionary or corpus access. **Verified mistake** = the word clearly has a different meaning from the English source, or the same file contradicts itself. **Suspected** = unusual or ambiguous; kept and flagged.

## 11. Terminology review table

| Language | Location (file / key) | Source | Current | Problem | Proposed | Conf. | Sev. | Action |
|---|---|---|---|---|---|---|---|---|
| Tigrinya `ti` | `screens/library/PcosSkinHairArticleScreen.tsx`, ti block, `section6Body1` | "…limit repeated stress on it: excessive heat, very tight hairstyles…" | …ከም ትርፊ ሃሞት… | ሃሞት = bile; the source says "excessive heat" (same wrong word as the hot-flashes labels fixed last round) | ትርፊ ሙቐት | High | Medium | **Corrected** (verified mistake) |
| Kirundi `rn` | `src/i18n/locales/rn.ts`: `export.fields.cervicalMucus`, `export.sectionNotes.cervicalMucus`, `export.data.conceive.categories.cervicalMucus`, `export.ui.categories.conceive.cervicalMucus`, `onboarding.summary.rows.indicatorCervicalMucus` | Cervical mucus | Ibinyoro vyo mu nkondo y'umura | The main journal screen of the same file (`journalCervicalMucus.*`) says "Ibinyaruzi vyo mu nkondo y'umura"; "ibinyoro" is a different word (probably "worms") | Ibinyaruzi vyo mu nkondo y'umura (the file's own term) | Medium | High | **Unified** to the file's primary term. Whether "ibinyaruzi" itself is the right Kirundi word is **not verified**; native review required |
| Xhosa `xh` | `xh.ts`, contraception method label (line ~6958) | Contraception | Ukthintela inzala | Typo: missing "u" | Ukuthintela inzala | High | Low | **Corrected** |
| Xhosa `xh` | `xh.ts` lines 727, 729, 744, 760, 1526, 1873, 1970, 1983-1987, 2074, 2085, 2099 | Cervical mucus (journal text, statistics) | intlama yomlomo wesibeleko ("paste / dough") | Two terms in one file: "intlama" in the journal screens versus "ulwelo" (fluid) in help and article text (lines 5979, 6140, 6290, 6357) and in the export labels | One term; the independent use of "ulwelo" in two places points to it | Low | Medium | **Not changed**: switching needs noun-class agreement edits inside sentences (e.g. lines 744 and 760); native review required |
| Yoruba `yo` | `yo.ts`, 5 `cervicalMucus` keys | Cervical mucus | Cervical mucus (loanword, provisional) | No established Yoruba term could be confirmed; "ìfun ọ̀nà ilé-ọmọ" was wrong | none | n/a | Medium | **Keep loanword**; native and clinical review. An unverified descriptive candidate, not applied: "omi ọ̀nà ilé-ọmọ" (fluid of the womb canal) |
| Lingala `ln` | `ln.ts`, `journalCervicalMucus.*` and export labels | Cervical mucus | "Mai ya kingo ya libumu" / "Mai ya mongongo ya libumu" ×5 / "Mucus ya col" | Three renderings; "mai" means water | One term, chosen by a reviewer | Low | Medium | **Native review required** |
| Lingala `ln` | `ln.ts`, period labels | Period | "Sanza" ×10, "Règles" ×3, "Ntango" ×2 | "sanza" also means month or moon; mixed with French "règles" | none | Low | Medium | **Native review required** |
| Lingala `ln` | `ln.ts`, `cyclePhase.fertile` and related | Fertile window | "Ntango ya kozwa zemi" ×3 / "Eleko ya kobota" ×2 / "Ntango ya fertilité" ×4 | "kobota" means to give birth, not to conceive | none | Low | Medium | **Native review required** |
| Lingala `ln` | `ln.ts`, `objectives.loss` | After pregnancy loss | Nsima ya kobungisa zemi | Causative "kobungisa" = to make lose (implies agency) | passive form (unverified) | Low | High | **Native review required** |
| Fulfulde `ff` | `ff.ts` | many | see section 12 | dialect mix | none | n/a | High | **Decision required** |
| Fulfulde `ff` | `screens/library/NutritionCycleArticleScreen.tsx`, ff block, line 1600 | "Omega-3: Salmon, sardines, walnuts, flaxseed." | identical English | not translated | none | n/a | Low | **Left in English** (no reliable terms); native review |
| Shona `sn` | `NutritionCycleArticleScreen.tsx`, sn block, line 1472 | same | "…mbeu dze flax" | "dze" looks like another dialect; "flax" is a loanword | none | Low | Low | Native review |
| Zulu `zu` | `zu.ts`, `cyclePhase.fertile` | Fertile window | "Isikhathi sokuvundisa" ×3 | "ukuvundisa" means to ferment or rot | "Isikhathi sokukhulelwa" (already used ×5) | Medium | Medium | **Not changed** (consistency only); native review |
| Zulu `zu` | `zu.ts`, `library.categories.acne.label` | Hormonal acne | Ubuhlungu bebuso be-hormone | "ubuhlungu" = pain | none | Low | Medium | Native review |
| Xhosa `xh` | `xh.ts`, `library.categories.acne.label` | Hormonal acne | Iziphumo ze-hormone | "iziphumo" = results | none | Low | Medium | Native review |
| Yoruba `yo` | `yo.ts`, `library.categories.acne.label` and `export.data.contraception.methods.pill` | Hormonal acne / Pill | Ìrorẹ́ ojú nítorí hormone / Èèlò | unusual words; "èèlò" unconfirmed | none | Low | Medium | Native review |
| Igbo `ig` | `ig.ts`, `objectives.contraception` | Contraception | Ịkọwa afọ (once) versus "Contraception" ×4 | "ịkọwa" = to explain | none | Low | Medium | Native review |
| Kinyarwanda `rw` | `rw.ts`, `objectives.loss` | After pregnancy loss | Nyuma yo gukuramo inda | "gukuramo inda" commonly means induced abortion; a sensitive change of meaning | "Nyuma yo gutakaza inda" (unverified) | Medium | **Critical (sensitivity)** | **Not changed**; priority native review |
| Kirundi `rn` | `rn.ts`, `objectives.loss` | After pregnancy loss | Nyuma yo gukuramo inda | same | same | Medium | **Critical (sensitivity)** | **Not changed**; priority native review |
| Yoruba `yo` | `yo.ts`, `objectives.loss` | After pregnancy loss | Lẹ́yìn ìṣẹ́yún | "ìṣẹ́yún" covers both induced abortion and miscarriage | add a qualifier for spontaneous loss (unverified) | Low | High | Native review |
| Kabyle `kab` | `kab.ts`, cervical mucus ×5 | Cervical mucus | Aman n tgenfut | "tagenfut" unclear | none | Low | Medium | Native review |
| Kabyle `kab` | `kab.ts`, partner | Partner | Amdan ("person") | too generic | none | Low | Low | Native review |
| Oromo `om` | `om.ts`, partner | Partner | Hiriyaa ("friend") | may read as "friend" | none | Low | Medium | Native review |
| Oromo `om` | `om.ts`, fertile window | Fertile window | five phrasings | inconsistent | none | Low | Medium | Native review |
| Shona `sn` | `sn.ts`, period | Period | Kuenda kumwedzi / Nguva yekumwedzi / Mwedzi | inconsistent | none | Low | Medium | Native review |
| Zulu `zu` | `zu.ts`, period | Period | Isikhathi ×15 ("time") | ambiguous | none | Low | Medium | Native review |

Verified mistakes corrected this round: 2 (ti PCOS article, xh typo). One further change, the Kirundi unification (5 strings), is a consistency fix, not a confirmed correction.

## 12. Fulfulde: regional varieties

Evidence in the current text:

- Infinitives and nouns end in **-ugo / -ugol** (nonnugo, danyugo, ndaarugo, Hunnugol, hoosugo): the pattern of Maasina / Adamawa-type Fulfulde (Mali, Nigeria, Cameroon). Senegalese and Guinean **Pulaar** uses **-ude / -ɗe** instead.
- Pregnancy appears as **reedu**, **Ɓesngu** and **Ɓernde**; period as **mensturasiyoŋ / mense / regle / haila / lewru** (French, Hausa-influenced and Fulfulde words side by side); birth as **danyugo / danyeere**.
- The selector uses the Senegal flag and the locale `ff-Latn-SN` (a Pulaar country), and AWA's primary audience is francophone.

Conclusion: the text is a **mixture** of mostly Maasina/Adamawa-style morphology, French loanwords for medical terms, and a Senegal locale.

Recommendation (a product decision, not applied): choose **Pulaar (Senegal/Guinea)** if the target audience is francophone West Africa. That matches the flag, the locale and the French medical loanwords already in use. Choose **Fulfulde Adamawa/Nigeria** only if the audience is in Nigeria or Cameroon (more speakers). A native reviewer of the chosen variety should then rewrite verbs and nouns consistently. No dialect was changed silently.

## 13. Pregnancy-week produce names still in English

These are the second text unit of each week's block (`weekN#2`), left identical to the English source.

| Week | Source | Languages still in English |
|---|---|---|
| 8 | Raspberry | om, rn, ig, yo, sn |
| 9 | Strawberry | om, rw, rn, ig, yo, sn |
| 12 | Plum | om, rn, ig, yo, sn |
| 13 | Peach | om, rn, ig, yo, sn |
| 14 | Kiwi | om, rw, rn, ig, yo, sn, ln, ff |
| 15 | Apple | om |
| 16 | Avocado | ig, yo, sn |
| 17 | Pomegranate | om, rn, ig, yo, sn |
| 18 | Bell pepper | om, ig, sn |
| 20 | Banana | ig, sn |
| 25 | Zucchini | om, rn, ig, yo, sn |
| 26 | Cucumber | ig |
| 27 | Cauliflower | om, ig, yo, sn |
| 28 | Eggplant | om, ig, yo |
| 29 | Butternut squash | om, ig, yo, sn |
| 34 | Cantaloupe melon | ig, sn |
| 35 | Honeydew melon | ig, sn |
| 36 | Romaine lettuce | ig, sn |
| 37 | Leek | om, ig, yo, sn |
| 38 | Rhubarb stalk | ig, sn |
| 39 | Watermelon | rw, ig |

No produce name was translated: I could not confirm a natural, widely understood equivalent for any of them, and several fruits are rare locally (kiwi, rhubarb, leek, romaine). Recommendation: ask native reviewers to substitute locally familiar fruit and vegetables of a similar size, rather than translating the names.

## 14. Release risks by language (updated)

| Language | Highest risks | Status |
|---|---|---|
| kab | cervical-mucus, partner and period terms | AI-reviewed; native review pending |
| om | partner = "friend"; five fertile-window phrasings; 13 produce names | AI-reviewed; native review pending |
| ti | menopause and period spellings; the "old blood" wording; other ሃሞት-type confusions may remain | AI-reviewed; native review pending (priority) |
| rw | "gukuramo inda" for pregnancy loss (sensitive); cervical-mucus phrases | AI-reviewed; native review pending (priority for the loss objective) |
| rn | the same loss wording; "ibinyaruzi" unverified | AI-reviewed; native review pending (priority) |
| ig | contraception "Ịkọwa afọ"; 20 produce names | AI-reviewed; native review pending |
| yo | cervical mucus is a loanword; "ìṣẹ́yún" for loss; acne and pill words | AI-reviewed; native review pending |
| zu | "isikhathi sokuvundisa"; acne term; "isikhathi" for period | AI-reviewed; native review pending |
| xh | intlama versus ulwelo; acne term; contraception "unqanaba-mitha" | AI-reviewed; native review pending |
| sn | inconsistent period term; produce names; "mbeu dze flax" | AI-reviewed; native review pending |
| ln | mucus, fertile-window and loss wording ("kobungisa") | AI-reviewed; native review pending (priority) |
| ff | dialect mix; weakest overall quality | AI-reviewed; native review pending (priority; blocked on a dialect decision) |

None is native reviewed or ready for release.
