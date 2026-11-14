# Simplified Chinese (zh) — manual Android test checklist

Purpose: verify on a real phone what Jest cannot: Hermes behaviour, CJK glyph rendering and wrapping, notification
delivery and PDF output. Nothing in this list has been run; no result is claimed.

## 0. Ground rules

- Use the isolated audit build (`com.hawa.audit`) and synthetic data only; never `com.hawa`; no real health data.
- Do not change the clock, time zone or battery settings (separate approval needed).
- Phones: one small (about 360 x 720 dp, Samsung A13 class) and one large (about 412 x 915 dp); repeat the layout
  items at the default and the largest system font size.
- A build with this localization is NOT installed yet. A new audit APK has to be built and approved separately.

## 1. Language selection and persistence

| # | Step | Expected |
|---|---|---|
| 1.1 | Profile → Appearance → Language | **Eight** cards: English, Français, Español, Italiano, Türkçe, Русский, Deutsch, **简体中文** (🇨🇳, «使用简体中文的 AWA»). The sheet scrolls; Apply stays reachable. |
| 1.2 | Select 简体中文, Apply | UI switches immediately; tab bar in Chinese; the language row reads «简体中文». |
| 1.3 | Force-stop and relaunch | Still Chinese (a brief English first frame is by design before the preference loads). |
| 1.4 | Switch ZH → FR → ZH → DE → ZH | Each switch immediate; no data change; no stale text. |

## 2. Glyphs and typography (the main risk)

| # | Check | Expected |
|---|---|---|
| 2.1 | Every screen of the eight objectives | No square boxes (tofu), no missing characters; serif titles fall back to a CJK face. |
| 2.2 | Wrapping of long sentences, chips, buttons, cards | Wraps inside its container; no horizontal overflow; CTA never below the fold. |
| 2.3 | Cycle ring phase names (卵泡期, 月经期, 排卵期, 黄体期) | Fit the disc at the base size. |
| 2.4 | Tab bar at 360 dp | «首页/日历/统计/我的»-style labels fully visible. |
| 2.5 | Calendar | Header 周一 … 周日, Monday first; month «10月»; Hijri labels. |
| 2.6 | Dates and times | «2026年10月5日», 24-hour («18:05», «00:30», never «24:30»). |
| 2.7 | Largest font + larger display size | No clipped primary actions; scrolling reaches everything. |
| 2.8 | Premium card and sheet | Title «AWA 高级版»; benefits and CTA wrap; arrow does not overlap the CTA. |
| 2.9 | Chinese keyboard input | Pinyin / handwriting accepted in notes and names; typed confirmation «删除». |

## 3. Counts

Chinese has one plural category. «N 天», «N 条记录»: check the number reads naturally for 0, 1, 2, 11, 21 and that no
«{{count}}» or key text appears (Home, Statistics, Qada, notification bell accessibility label).

## 4. Notification localization

Audit app, synthetic profile, reminders 5–10 min ahead, app backgrounded (not force-stopped), clock unchanged.
Channel name, every objective's reminders, pregnancy vitamin / custom / appointment reminders (user-typed text stays
unchanged), Qada reminder; switch ZH → EN → ZH with a pending reminder: same time, new text, no duplicate.

## 5. Medical PDF export

| # | Check | Expected |
|---|---|---|
| 5.1 | Export a synthetic report in Chinese | PDF created and opened |
| 5.2 | Headings, dates, categories, bullets, notes | All hanzi drawn (Noto Sans SC); no boxes, no «[…]» for everyday characters |
| 5.3 | Long note without spaces | Wraps inside the margins |
| 5.4 | File size | About 1–2 MB (two embedded CJK subsets) |
| 5.5 | Same export in RU / TR / DE / FR | Unchanged (DejaVu / Cairo / Helvetica as before) |
| 5.6 | CSV | UTF-8 hanzi intact |

## 6. Regression spot checks

Switch to French, Russian and German once: language sheet, plurals (Russian 1 день / 5 дней), cycle ring label.

## 7. Reporting

Record build id, device + Android version, language, objective, screen, a screenshot, and whether text was clipped,
wrong or missing. Terminology disagreements go to `chinese-review-checklist.md`, not to the bug list.
