# 日本語 (Japanese, `ja`) — human review checklist

Japanese was added as AWA's 12th language (Intl locale `ja-JP`, hiragana + katakana + kanji, horizontal left-to-right). The translation was produced and
mechanically validated (key parity, placeholders, line breaks, one-category plurals, script and punctuation rules, terminology) and compared with the
English by five independent reviewers, but it has **not** been reviewed by a native Japanese speaker, a medical reviewer or a religious reviewer. Tick each item once a
reviewer has confirmed or corrected the wording; corrections go into `mobile/src/i18n/locales/ja.ts`, the `ja:` blocks of the article screens
(`src/screens/library/*ArticleScreen.tsx`) and `src/data/pregnancyWeekData.ts`.

Voice: polite **です・ます** style, no heavy keigo, subject (「あなた」) omitted whenever Japanese allows it. Digits are Western digits, punctuation is full-width
(、。「」（）！？：), no spaces between Japanese words, ranges use the wave dash 〜. Japanese has no grammatical number: every `_one` key carries the wording of its
`_other` (the one exception is `miscarriageDate.conflicts.journal_one`, a different English sentence, translated separately).

## Already checked mechanically and by independent passes

* Key parity with the other eleven languages (6,243 keys), placeholders, line breaks, no raw keys, no Hangul / Cyrillic / Devanagari / Arabic, no half-width
  katakana, no combining dakuten, no Simplified-Chinese-only kanji, no ASCII comma / period / quote after Japanese text, no space between two Japanese words,
  kana present in every long text (`PhaseJapaneseLocalization.test.ts`).
* Every number of the English pregnancy-week texts is present in the Japanese text (41 weeks); the checker reported no figure change in any article.
* Dates: `ja-JP` Intl (2026年10月19日, 10月19日), weekdays 月 火 水 木 金 土 日. **Hijri dates**: ICU has no Japanese Hijri month names ("AH1447年9月12日" looks like a
  Gregorian September), so `cycleMath.ts` composes the Hijri date for Japanese only: 「ヒジュラ暦1447年ラマダーン12日」 with the twelve month names listed in the glossary of the
  translation guide (ムハッラム … ズー・アル＝ヒッジャ).
* **Independent comparison with the English** by five reviewers (the 11 religious articles, 599 religious-keyed dictionary strings and 10 safety-relevant medical articles —
  missed pills, contraception, hormone therapy, side effects, miscarriage recovery / grief, LH tests, basal temperature): **0 high-severity findings** (no ruling, school-of-law
  statement, number of days, dose, threshold or warning sign was added, removed or changed). Two medium and about thirty low findings were fixed in the source:
  * 「けいれん」 (= convulsions) for "cramps / cramping" → 「さしこむ痛み」 (journal options) and 「下腹部の痛み」 (miscarriage recovery);
  * 「経過観察中」 (a clinical term implying a doctor is monitoring) for "Medical tracking in progress" → 「医療面の記録を続けています」;
  * strength of the wording restored: "must be made up" (qadaa) → 「埋め合わせなければなりません」, "is due today" → 「今日行う必要があります」, "suspended" → 「一時的に免除されます」 (instead of
    "is not performed"), "without guilt" no longer an obligation (「〜すべき」 removed), "may be higher" no longer "is said to be";
  * 「崇拝行為」 (veneration, idol-worship overtones) for "acts of worship" → 「信仰上の行為」; 「償い」 (atonement) for "compensation" → 「代償」; 「信頼できる」 (trustworthy) for
    "qualified / recognized" → 「資格のある」 / 「認められた」 / 「広く認められている」;
  * « sanitary pad » (not in the English) → 「生理用品」; 「複合ピル」 and 「プロゲスチン単独のピル」 used everywhere (was 混合ピル / プロゲスチンだけのピル in places);
  * the three red-flag texts that were awkward noun chains now read as plain warning sentences (「突然、見えにくくなる、話しにくくなる、力が入りにくくなる」);
  * one term for "Spiritual markers" everywhere: **信仰の目印** (was 信仰の目安 / 信仰に関するマーク / 信仰に関する項目).

The items below are what remains for a human.

## [!] RELIGIOUS-CONTENT VALIDATION REQUIRED

The wording below touches Islamic practice (prayer, fasting, purity, nifas, istihada, the Hijri calendar, schools of thought). It must stay educational and neutral
across schools of thought; no ruling may be added, removed or hardened. Terms follow the conventions of Japan's Muslim community (礼拝, 断食, ラマダーン, イード, カダー, ニファース,
イスティハーダ, ハイド, グスル, ウドゥー, 清浄（タハーラ）, ヒジュラ暦, ファトワー, 法学派（マズハブ）, イスラーム法学（フィクフ）, クルアーン, スンナ). A scholar or an organisation must validate them.

- [ ] **Transliterations**: confirm the spellings expected in Japan — クルアーン (vs コーラン), ニファース, イスティハーダ, ハイド, グスル, ウドゥー, ファトワー, ズィクル (dhikr), ドゥアー / 祈願 (du'a),
  サブル (sabr), イフタール, and the five prayers ファジュル / ズフル / アスル / マグリブ / イシャー.
- [ ] **Hijri month names** (ムハッラム, サファル, ラビーウ・アル＝アウワル, ラビーウ・アル＝アーヒル, ジュマーダー・アル＝ウーラー, ジュマーダー・アル＝アーヒラ, ラジャブ, シャアバーン, ラマダーン, シャウワール,
  ズー・アル＝カアダ, ズー・アル＝ヒッジャ) — used in the Hijri date line and the calendar header (`cycleMath.ts`, `HIJRI_MONTHS_JA`).
- [ ] **清浄（タハーラ）** for "(ritual) purity / Pure" (status label, article title « 清浄（タハーラ）の状態 », category « 生理と清浄 ») — confirm vs タハーラ alone.
- [ ] **グスル（全身を清める沐浴）** and **ウドゥー（小さな清め）** glosses, « 儀礼としての全身の清め » — confirm they are standard and neutral.
- [ ] **法学派（マズハブ）**, **法学上の典拠**, **宗教上の拠り所** for "school of jurisprudence", "jurisprudential references", "the religious reference you chose" (nifas modal, FAQ) — confirm
  the wording is neutral and does not read as a ruling; the nifas day marker is called 「目安」 everywhere.
- [ ] **カダー** — 「カダーの断食」, 「カダーの礼拝」, 「埋め合わせなければなりません（カダー）」; and 「代償」 for the compensation (fidya) in the pregnancy / breastfeeding passage.
- [ ] **学者たちの合意**, 推論 for "consensus", "reasoning" (ijma', qiyas) in *FiqhWomenIntro*.
- [ ] Missed-prayer note (`prayerTimes.missedPrayersNote`: 「生理中に行えなかった礼拝は、カダーの礼拝をする必要はありません」) — ruling wording; in the English it is the same statement.
- [ ] Source ambiguity, not a translation issue: in the *MenstruationPurity* article the English says prayer and the Ramadan fast « can be made up later » in one place while another section says missed prayers
  are not made up; the Japanese mirrors the English.
- [ ] 忍耐（サブル）, 祈願, 信仰の面で話に耳を傾けてもらうこと (*ReligiousFaqAfterLoss*) — tone and wording of the grief-and-faith texts.

## Medical / wording review

- [ ] **Pregnancy trimesters**: 妊娠初期 / 中期 / 後期 (Japan's usual terms) are used where the English says first / second / third trimester; the figures printed by the app (weeks 1–13, 14–27, 28–41) are unchanged.
- [ ] **更年期 / 閉経 / 更年期への移行期（ペリメノポーズ）**: « Menopause » as a *stage choice* is 閉経 (the event, "my periods have stopped") while the objective / dashboard uses 更年期; confirm which fits each place.
- [ ] **Hormonal IUD** rendered ホルモン放出IUD (official name: 子宮内黄体ホルモン放出システム / IUS); implant availability in Japan is limited — confirm wording; **ミニピル** as an alternative for the progestin-only pill.
- [ ] **おりもの / 頸管粘液 / 子宮頸管粘液** for cervical mucus (everyday vs clinical term used in different articles); **主席卵胞** (vs 優位卵胞 / 優勢卵胞); **卵母細胞**; **多毛症 / 終毛**; **月経前不快気分障害（PMDD）**;
  **骨粗しょう症 / 骨量減少症**; **ブラクストン・ヒックス収縮**; **NT**; **母子健康手帳** (Japan-specific booklet name used for "pregnancy follow-up booklet"); **抗体検査** vs 血清検査.
- [ ] **マタニティブルー / 産後うつ**, **ホルモンバランスによるニキビ** (vs ホルモン性ニキビ), **母乳育児コンサルタント** (vs IBCLC), **授乳性無月経**, **心理士**.
- [ ] **性交渉** for the discreet "Reports" (intimacy) category — confirm whether a softer wording is preferred. **体毛の増加** for the PCOS hair-growth tracking item.
- [ ] **頭のもやもや感（ブレインフォグ）**, **ほてり（ホットフラッシュ）**, **ホルモン補充療法（HRT）** benefit / risk wording, **FSH** and **エストラジオール** naming for lab tracking.
- [ ] **会陰（骨盤底筋）** — « perineum » and « pelvic floor » are used interchangeably by the English source; confirm with pelvic-floor physiotherapy terminology.
- [ ] **休薬期間 / 使用開始** for the contraception « treatment break » — pill wording; confirm it fits patch, ring and IUD users.
- [ ] **悪露** for lochia (written 「悪露」, an older medical term); **quarantaine** (a traditional term in the French-speaking community) is kept in Latin script in *PostpartumRecovery* with no number of days.

## Interface items a developer / designer should look at on a device

- [ ] **Welcome screen**: « Welcome / to AWA » is drawn as two lines; Japanese has no word between 「ようこそ」 and 「AWA」, so `onboarding.welcome.brandPrefix` is intentionally empty (the only non-English empty value;
  the accessibility label is « ようこそ  AWA »). Check the lockup looks balanced.
- [ ] **Postpartum hero**: the English « Day 12 » is a prefix plus a number appended in code; Japanese reads 「産後日数：12」 (`postpartumDashboard.hero.dayPrefix`). A 「産後12日目」 form would need a suffix key.
- [ ] **Discreet launcher**: the screen says the app will appear as 「手帳」 (the Japanese name for "Agenda"), but the Android launcher alias label is native (`app_name_discreet` = "Agenda" in `strings.xml`)
  and no `values-ja` resource was added (no native change was in scope). The same mismatch already exists for the other translated languages.
- [ ] **Typed confirmation**: the delete-account / delete-backup word is 「削除」 (`confirmWord`); the comparison folds the typed text the same way for every language — try it with an IME on a phone.
- [ ] **Product name**: « AWA Together » is kept in Latin letters (as « AWA Original », « AWA Premium », « Face ID »); other languages translate it (AWA 同行, AWA Gemeinsam …).
- [ ] **Palette names**: AWA Original · ラベンダーの夜 · ローズクォーツ · セージの静けさ · 穏やかな海 · ぬくもりの砂 · 真夜中 (the ids and colours are unchanged).
- [ ] **Activities**: ハイキング (Randonnée / Hiking) and 有酸素運動 (Cardio) before その他; **ヨガ / ピラティス / ウォーキング** etc. follow the guide glossary.
- [ ] **Cramps**: 「さしこむ痛み」 (journal options) — a native reviewer may prefer 「下腹部痛」 or 「生理痛」 in some of the five places.
