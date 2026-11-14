# 한국어 (Korean, `ko`) — human review checklist

Korean was added as AWA's 13th language (Intl locale `ko-KR`, Hangul, horizontal left-to-right). The translation was produced and mechanically validated (key parity,
placeholders, line breaks, one-category plurals, script and punctuation rules, terminology) and compared with the English by five independent reviewers, but it has **not**
been reviewed by a native Korean speaker, a medical reviewer or a religious (Korean Muslim community) reviewer. Tick each item once a reviewer has confirmed or corrected the wording;
corrections go into `mobile/src/i18n/locales/ko.ts`, the `ko:` blocks of the article screens (`src/screens/library/*ArticleScreen.tsx`) and `src/data/pregnancyWeekData.ts`.

Voice: polite **해요체** (-아요/-어요) everywhere in the interface and articles; buttons/labels are short noun phrases or verb stems; the subject (당신 / 너) is omitted whenever Korean
allows it. Digits are Western digits, punctuation is ASCII (`. , ? ! : ( )`), curly quotes “ ”, ranges use `~` (21~35일), counters are attached to the number (28일, 3개월, 12주차), no Hanja.
Korean has no grammatical number: every `_one` key carries the wording of its `_other` (the one exception is `miscarriageDate.conflicts.journal_one`, a different English sentence, translated
separately). A Korean particle is never written directly after a `{{variable}}`.

## Already checked mechanically and by independent passes

* Key parity with the other twelve languages (6,244 keys), placeholders, line breaks, no raw keys, no Hanja / kana / Cyrillic / Devanagari / Arabic, no conjoining jamo, no full-width
  punctuation, no particle glued to a variable, no space between a number and its counter, Hangul present in every long text (`PhaseKoreanLocalization.test.ts`).
* Every number of the English pregnancy-week texts is present in the Korean text (41 weeks); the checker reported no figure change in any article.
* Dates: `ko-KR` Intl (2026년 10월 21일, 10월 21일), weekdays 월 화 수 목 금 토 일. **Hijri dates**: ICU prints the month as a number ("AH 1447년 9월 12일", which reads like a Gregorian
  September), so `cycleMath.ts` composes the Hijri date for Korean (and Japanese) only: 「히즈라력 1447년 라마단 12일」 with the Unicode locale data's month names (무하람 사파르 라비 알 아왈
  라비 알 쎄니 주마다 알 아왈 주마다 알 쎄니 라잡 쉐아반 라마단 쉐왈 듀 알 까다 듀 알 히자).
* **Independent comparison with the English** by five reviewers (the 11 religious articles and the religious-keyed dictionary strings — 1,130 pairs; 13 safety-relevant medical articles — 672 pairs;
  the whole interface dictionary — 5,305 pairs): **1 high-severity finding** (a garbled pregnancy-week notification title) and 37 medium ones, all fixed in the source; no ruling, school-of-law
  statement, number of days, dose, threshold or warning sign was added, removed or changed. Fixed examples:
  * one name for "Spiritual markers" (영적 표시) instead of five variants (신앙 지표, 신앙 마커, 종교 마커, 종교 표시, 영적 이정표); one name for women's fiqh (여성 이슬람 법학);
  * `prayerTimes.purity.dueSubtitle` no longer adds an unsourced "다음" (next) prayer;
  * "다시 시도" (= retry, an error idiom) for "Trying again" in the loss objective → "다시 임신 준비"; "부부 관계" (marital) for "intimate" → "성관계" / "성생활" (no marital meaning added);
  * "위험한 관계" (dangerous relationship) → "임신 위험이 있는 성관계"; "임신 가능성 관련 치료" → "난임 치료"; 당신 removed; particles moved off variables;
  * "Premium" stays Latin (product name).

## Things a reviewer must decide (open items)

### Medical / clinical terminology
- [ ] 안드로겐(남성호르몬) 상대적 과잉 (PCOS intro) — confirm with an endocrinology reviewer.
- [ ] 소변 줄(요도 카테터) (perineum article) — everyday vs clinical term.
- [ ] 안면 홍조 (hot flashes; the glossary also allows 안면 홍조(열감)) and 야간 발한 (night sweats) — preferred lay terms.
- [ ] 월경 전 불쾌감 장애(PMDD) — official Korean term for PMDD.
- [ ] 골감소증 / 골다공증 / 골밀도 검사 — standard terms (bone health).
- [ ] 황체형성호르몬 (LH tests), 자궁 경부 점액 vs 질 분비물/냉 (cervical mucus article).
- [ ] 피임 임플란트, 질링, 호르몬 자궁 내 장치 (hormonal-treatments panorama) — preferred product terms.
- [ ] 목덜미 투명대 검사 (nuchal translucency), 정밀 초음파(형태 검사) (medical exams article).
- [ ] 자연 균총 / 질 세정 (flow article: natural flora / douching).
- [ ] 배란통 with the Latin “mittelschmerz” kept in parentheses (ovulation article) — keep or drop.
- [ ] 쿠아랑틴 (quarantaine; traditional French-origin postpartum term kept as a transliteration plus its original) — confirm it is understood in Korea or replace by 산후 조리 기간.
- [ ] `MenopauseTransition`: "프랑스에서는 평균 51세" — a France-specific figure kept as in the English source; product owner to decide if a Korean statistic should replace it.
- [ ] 폐경 vs 갱년기 usage (the guide: 갱년기 = the stage, 폐경 = the event) — a reviewer should confirm each occurrence reads naturally.

### Religious terminology (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`)
- [ ] Transliterations follow the conventions of Korea's Muslim community as given in the guide: 예배(살라트), 파즈르 두흐르 아스르 마그리브 이샤, 금식, 라마단, 카다, 니파스, 이스티하다, 하이드, 구슬, 우두,
  정결(타하라), 히즈라력, 파트와, 법학파(마드합), 학자(울라마), 이슬람 법학(피크흐), 꾸란, 순나, 키블라, 아잔, 알라, 무슬림. A Korean Muslim reviewer should confirm each (some are written with different
  spellings in different mosques: 꾸란/쿠란, 알라/알라흐, 메카/마카).
- [ ] 지크르 (dhikr), 두아(기도) (supplication), 사브르(인내) — not in the glossary; spellings/glosses chosen by the translators.
- [ ] 대정화 for the major ablution (next to 구슬(전신 정화 목욕)); 법학파 used without the (마드합) gloss in some articles — make it consistent.
- [ ] Hijri month spellings come from the Unicode locale data (e.g. 라비 알 쎄니, 듀 알 까다): confirm they are the spellings the community uses, or replace them in `cycleMath.ts` (`COMPOSED_HIJRI`).
- [ ] `qadaa.aboutText`: 가장 잘 아시는 분은 알라이세요 ("Allah knows best") — phrasing and honorific.
- [ ] `prayerTimes.purity.dueSubtitle` (fiqh wording about regaining purity within a prayer window).
- [ ] `FiqhWomenIntro` (월경 혈과 그 상태, 의례적 정결), `Istihada`, `NifasMedical`, `NifasFiqh`, `ReturningToPrayer`, `RamadanFasting`: religious framing sentences.
- [ ] **Source-level issue (not a Korean one):** `MenstruationPurity.section2Body` says in English/French that prayer and the Ramadan fast "can be made up later"; the Korean mirrors it faithfully but it contradicts
  the rest of the corpus (prayer is generally not made up). A content owner must correct the source, then the Korean is re-aligned.

### Wording / UX
- [ ] Welcome screen: the English lockup "Welcome / to / AWA" is split in three Texts; Korean says 「환영합니다」 + (empty) + 「AWA」. Check it reads naturally on screen; the alternative is a reordered
  lockup (AWA에 오신 것을 환영합니다) which needs a layout change.
- [ ] `postpartumDashboard.hero.dayPrefix` = 「산후 일수: 」 followed by the number (a counter cannot follow the number there).
- [ ] Palette names: 라벤더 나이트, 로즈 쿼츠, 세이지 세레니티, 고요한 바다, 따뜻한 모래, 미드나이트 (AWA Original unchanged).
- [ ] Discreet launcher name 「다이어리」 (the English app says “Agenda”): the real Android launcher label is native.
- [ ] Date placeholders 「년 / 월 / 일」 (English DD / MM / YYYY).

## How to correct

Edit `ko.ts` / the `ko:` blocks directly; keep the placeholders, `\n` counts and the polite 해요체. Run `npx jest src/i18n/__tests__/PhaseKoreanLocalization.test.ts` afterwards.
