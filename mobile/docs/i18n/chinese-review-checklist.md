# Simplified Chinese (zh-CN) — human review checklist

Status of every Chinese string in AWA: **model-generated, validated by scripts, NOT reviewed by a person.** No
native-speaker review, no medical review and no religious review has taken place. Automated checks (exact key parity
with English, placeholders, line breaks, plural pairs, hanzi presence, no foreign-language leftovers, terminology scan,
structure of the 72 articles and 41 pregnancy weeks, preserved numbers) prove the text is complete and mechanically
sound. They do **not** prove that it is natural, medically accurate, religiously appropriate or legally valid.

Language code: the bare `zh` (stored as `zh` in `@awa/appearance/language-v1`); Intl locale `zh-CN`; display name
«简体中文». `zh-CN`, `zh-Hans`, `zh-Hans-CN` (any case, `-` or `_`) are accepted as aliases, normalised to `zh` and
rewritten under the canonical code without losing the preference; Traditional Chinese (`zh-TW`, `zh-Hant`) is NOT
supported and falls back to English like any unknown value.

## 1. Native-speaker review (UI copy — 6,182 dictionary keys)

Highest-traffic namespaces first: `onboarding`, `cycleHome`, `calendar`, `statistics`, `profile`, `journalOptions`,
`notifications` + `notificationPermission`, `help`, `library`, `premium`, `awaADeux`, `export`, `backupData`.

| # | Topic | Current choice | Question |
|---|---|---|---|
| 1 | Register | 你 (never 您), calm, supportive | Right tone for an intimate health app? |
| 2 | Period | 月经 (medical) / 经期 (UI) | Mixed by context; unify? |
| 3 | Daily journal | 每日记录 / 日记 | Which one for the feature name? |
| 4 | Trying to conceive | 备孕 | Fine as the objective name? |
| 5 | Pregnancy loss | 妊娠丢失 (objective), 失去宝宝 (gentle text), 流产 (educational) | Gentle enough? |
| 6 | Lochia / Nifas | 恶露 / 产后恶露期（Nifas） | Overlap between the two terms for a lay reader |
| 7 | Hijri month Dhu al-Hijjah | 都尔黑哲月 | Standard Chinese name? (also used for the other month names shown in calendars) |
| 8 | Purity | 洁净 (Taharah) | Understood by a non-Muslim Chinese reader? |
| 9 | Qada / Ghusl / Istihada | 补斋 / 大净 / 伊斯提哈达 | Established Chinese Muslim terminology |
| 10 | Fiqh / fatwa / madhab | 教法（学） / 法特瓦 / 教法学派 | Consistent across the app? |
| 11 | "Allah knows best" | 真主最知晓 | Wording |
| 12 | Premium | «AWA 高级版» everywhere (never "Premium") | Product designation |
| 13 | Partner feature | «AWA 同行» | Name |
| 14 | Intimacy | 亲密生活 / 同房 | Tone and register |
| 15 | Article meta | 入门 / 进阶 (levels), 已审阅内容 (reviewed content), 阅读约 N 分钟 | Wording |
| 16 | Legal | Terms/Privacy are a provisional placeholder in every language | Not legal text; needs the real document |
| 17 | Confirmation word | «删除» typed to confirm deletion | Natural? |
| 18 | "四十天" for the traditional postpartum period | kept as a literal 40-day statement, not 坐月子 | Cultural fit |

## 2. Medical review (content a clinician or midwife must approve)

Translated from the existing English editorial text; nothing invented. A medical reviewer must confirm that the
Chinese preserves clinical meaning, thresholds and "when to consult" advice.

* **Pregnancy weeks 1–41** (`src/data/pregnancyWeekData.ts`, `zh` block): size comparisons, body changes, tips.
  Numbers were verified identical to English by test; wording was not clinically reviewed.
* **Library articles (72)** (`src/screens/library/*ArticleScreen.tsx`, `zh:` block), in particular contraception,
  fertility awareness, PCOS (多囊卵巢综合征), menopause / perimenopause (围绝经期, 激素治疗), postpartum, pregnancy loss,
  bone health, medical exams («颈项透明层», «胎儿结构超声检查», «妊娠期糖尿病筛查»).
* **Statistics / health labels**, **medical PDF / CSV export** (printed for a doctor), and the legacy article
  «了解你的月经周期».

## 3. Religious review (a qualified scholar / organisation must approve)

Marker used elsewhere in the project: `[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`.

* `qadaa`, `prayerTimes`, `spiritualGuidance`, `hijriCalendar`: make-up fasting, purity status, Nifas, prayer times.
* `library.religiousDisclaimer` and the articles on Nifas, Istihada, prayer during menstruation, fasting and Qada,
  Fiqh of women, religious FAQ (also after loss).
* The Qada and Nifas notifications.
* Terminology differs between schools and between Chinese Muslim and general usage; the content stays neutral and
  educational — a reviewer must confirm this holds in Chinese.

## 4. Visual / device validation

See `chinese-manual-android-test-checklist.md`. Not performed: the Chinese UI has not been run on a device.
