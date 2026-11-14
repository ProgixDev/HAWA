# Português (`pt-PT` + `pt-BR`) — human review checklist

Portuguese was added as AWA's 14th language in two variants: **Portugal** (`pt-PT`, the complete base: `ptPT.ts`, the `'pt-PT'` article/week blocks, legal pages) and **Brasil** (`pt-BR`, an overlay: `ptBR.ts`,
`ptBrEditorialOverlay.ts`, `legal TERMS/PRIVACY['pt-BR']`). See [portuguese-regional-variants.md](portuguese-regional-variants.md). The translation was produced and mechanically validated (key parity,
placeholders, line breaks, singular/plural pairs, Brazil-only / tu-form / pre-AO90 detectors, accents) and compared with the English by **five independent reviewers for Portugal** and **three for Brazil**,
but it has **not** been reviewed by a native Portuguese or Brazilian speaker, a medical reviewer or a religious reviewer. Tick each item once a reviewer has confirmed or corrected the wording;
corrections go into `ptPT.ts` / the `'pt-PT'` blocks (Portugal) or `ptBR.ts` / `ptBrEditorialOverlay.ts` (Brazil — add a path only where Brazil really differs).

Voice: warm and respectful; the reader is addressed in the **polite third person without a pronoun** (“o seu ciclo”, “Escolha…”, “Consulte…”) — correct in Portugal and natural in Brazil; no *tu* forms;
the brand is feminine (“a AWA”, “da AWA”, “na AWA”) everywhere. Digits are Western digits; the decimal separator in prose is a comma; ordinals “1.º trimestre”.

## Already checked mechanically and by independent passes
* Key parity with the other twelve languages (6,246 keys, the two new endonym keys included); the Brazilian overlay adds no key, keeps every placeholder and line break, contains no Portugal-only word and
  no raw key; both plural categories exist and differ; no Brazilian-only word, *tu* form, pre-AO90 spelling or decomposed accent in the Portugal base (`PhasePortugueseLocalization.test.ts`).
* Every number of the English pregnancy-week texts is present in both variants (41 weeks); no figure changed in any article.
* Independent comparison with the English — Portugal: 11 religious articles + religious strings (65 findings), 13 safety-relevant medical articles (10), the whole interface dictionary (55); Brazil: the overlay
  of the dictionary (28) and of the articles and weeks (8): **1 high-severity finding** (a Portugal idiom “põe em causa” left in a Brazilian string), the rest medium/low, **all fixed**; no ruling, school-of-law
  statement, number of days, dose, threshold or warning sign was added, removed or changed. Fixed examples:
  * the reader's gender: masculine mood labels (*Estressado / Ansioso / Cansado*) → feminine/neutral; *Obrigado* → *Obrigada*; “o SOP” → “a SOP”; “a AWA” everywhere (the translators mixed “o AWA” / “a AWA”);
  * *hemorragia pós-parto* (= haemorrhage) for postpartum bleeding → *sangramento pós-parto*; “window” rendered as *período* → *janela*; *Fraco/Ligeiro* for flow unified; the Arabic greeting keeps its ʿayn mark;
  * Brazil: *perdas de sangue* → *sangramento*; a mechanical *Salve* where the source means “keep track”; dropped-subject forms (*Poderá / Escolheu*); Portugal ordinals (*12.ª*, *3.º*) → Brazilian forms.

## Things a reviewer must decide (open items)

### Medical / clinical terminology (Portugal)
- [ ] *terapêutica hormonal (de substituição) / THS* vs *terapia hormonal*; *perturbação disfórica pré-menstrual (PDPM)* for PMDD; *tristeza pós-parto (baby blues)* vs *disforia pós-parto*.
- [ ] *consulta de revisão do puerpério*; *quarentena* (traditional term kept for the first weeks postpartum) — is it used in Portugal?
- [ ] *ecografia morfológica*; *translucência da nuca*; *rastreio de anticorpos irregulares*; *azia / refluxo ácido*; *rabiote* (week 20: colloquial for “bottom”) vs *nádegas*.
- [ ] *hirsutismo, pelos terminais, androgénios*; *perfil lipídico*, *glicemia*; *espessa o muco cervical* (patch); *amenorreia pós-parto*; *DPP* (data prevista do parto) as an abbreviation; *biberão*.
- [ ] *Clara de ovo / textura elástica* (fertile cervical mucus), *Fraco / Abundante / Muito abundante* (flow intensity), *Nevoeiro mental* (brain fog), *pequenas perdas de sangue (spotting)*.
- [ ] `MenopauseTransition`: the English source says “In France …” (a country-specific figure kept as written) — product owner to decide whether to localise for Portugal/Brazil.
- [ ] **Note on a Portugal-wide choice:** *Qada* and the other religious terms below are written as in the guide (see “Religious terminology”).

### Medical / clinical terminology (Brazil)
- [ ] *Escape* vs *Spotting* vs *pequenos sangramentos* (light bleeding between periods); *Ruim* for poor sleep; *Névoa mental* (brain fog); *Ressecamento vaginal*; *Seios* vs *Mamas*; *Prisão de ventre*.
- [ ] *contraceptivo* vs *anticoncepcional* in everyday UI; *data provável do parto (DPP)*; *enfermeira obstetra* for *parteira*; *Lóquios* — known to Brazilian users? (alternative *sangramento pós-parto*).
- [ ] *quarentena* vs *resguardo*; first period: *período* vs *primeira menstruação*; *pesquisa de anticorpos irregulares* (Coombs indireto).
- [ ] Fruit-size comparisons of the pregnancy weeks: *abóbora-manteiga* (cabotiá), *melão cantalupo*, *melão honeydew*; week 16 “leve bater de asas” vs *borboletas na barriga* for the first movements.

### Religious terminology (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`)
- [ ] Spellings follow the conventions of the Lusophone Muslim community as given in the translation guide: *oração (salá)*, *Fajr, Dhuhr, Asr, Maghrib, Isha*, *jejum*, *Ramadão*, *Eid*, *Qada (compensação)*, *nifas*, *istihada*, *hayd*,
  *ghusl (banho ritual)*, *wudu (ablução)*, *pureza ritual (tahara)*, *calendário hegírico*, *fatwa*, *escola jurídica (madhhab)*, *sábios / estudiosos (ulemás)*, *fiqh (jurisprudência islâmica)*, *Alcorão*, *Suna*,
  *Qibla*, *adhan*, *Meca*, *Alá*, *Islão* (Brazil: *Islã*), *dhikr*, *dua*. A reviewer should confirm each (variants exist: *Dhul Hijjah / Dhu al-Hijjah / Dhou al-Hijja*, *Ramadão / Ramadã*, *ablução maior / ghusl*).
- [ ] *Dhu al-Hijjah* spelling in the calendar legends (used in 6 dictionary sections); Hijri dates themselves come from ICU (“12 de Ramadan de 1447 AH”), so the month is written *Ramadan* there and *Ramadão* in the text.
- [ ] Wording of rulings that touch practice: *dispensa reconhecida*, *reparação / compensação adequada* (fidya / make-up of fasts), *pode retomar as suas orações mesmo que o sangramento persista* (nifas), *Em pureza* (status label),
  *escolas de pensamento* vs *escolas jurídicas*, “window of the prayer” → *janela da oração*.
- [ ] Brazil: *Qada / qadá*, *sábio qualificado* vs *estudioso*, *recordação de Deus* vs *lembrança de Deus*, *Ramadão vs Ramadã*.
- [ ] **Source-level issue (not a Portuguese one):** `MenstruationPurity.section2Body` says in English/French that prayer and the Ramadan fast “can be made up later”, which contradicts the rest of the corpus
  (prayer is generally not made up). A content owner must correct the source, then the Portuguese is re-aligned.

### Wording / UX
- [ ] Welcome screen: the lockup is *Bem-vinda* / *à* / *AWA* (three Texts). Check it reads naturally on screen.
- [ ] Postpartum hero prefix *Dia* + number; date placeholders *DD / MM / AAAA*; confirmation word *ELIMINAR* (Brazil: *EXCLUIR*); discreet-launcher name *Agenda*; palette names (*Noite de Lavanda, Quartzo Rosa, Serenidade de Salva (Brazil: Sálvia), Calma do Oceano, Areia Quente, Meia-noite*).
- [ ] Hiking = *Caminhada na natureza* (Brazil: *Trilha*), Cardio = *Cardio*.
- [ ] Brazilian plural of zero: CLDR makes *0* “one” in `pt-BR` (“0 dia”) and “other” in `pt-PT` (“0 dias”). If Brazilian reviewers prefer “0 dias”, change the `pt-BR` rule in `i18n/pluralRules.ts` and the test.

## How to correct
Portugal: edit `ptPT.ts` or the `'pt-PT'` block. Brazil: edit/add the string in `ptBR.ts` (keep both halves of a plural pair) or the path in `ptBrEditorialOverlay.ts`; delete an overlay entry when Brazil should read the Portugal text.
Run `npx jest src/i18n/__tests__/PhasePortugueseLocalization.test.ts` afterwards.
