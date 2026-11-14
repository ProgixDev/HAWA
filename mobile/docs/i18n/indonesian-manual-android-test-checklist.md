# Bahasa Indonesia (id) — manual Android test checklist

Purpose: verify on a real phone what Jest cannot: Hermes behaviour, wrapping of long Indonesian words, notification
delivery, PDF output and the Android system-language detection. Nothing in this list has been run; no result is claimed.

## 0. Ground rules

- Use the isolated audit build (`com.hawa.audit`) and synthetic data only; never `com.hawa`; no real health data.
- Do not change the clock, time zone or battery settings (separate approval needed).
- Phones: one small (about 360 x 720 dp, Samsung A13 class) and one large (about 412 x 915 dp); repeat the layout
  items at the default and the largest system font size, and in Light, Dark and True Black with several palettes.
- A build with this localization is NOT installed yet. The `AwaDeviceLocales` native module also needs a rebuild.

## 1. Language selection, system language and persistence

| # | Step | Expected |
|---|---|---|
| 1.1 | Profile → Appearance → Language | System default plus **nine** languages incl. **Bahasa Indonesia** (🇮🇩). Sheet scrolls; Apply stays reachable. |
| 1.2 | Select Bahasa Indonesia, Apply | UI switches immediately; tab bar and language row in Indonesian. |
| 1.3 | Force-stop and relaunch | Still Indonesian. |
| 1.4 | Android language set to Bahasa Indonesia (`id-ID`, legacy `in`), choose "System default" | AWA follows Indonesian; with an unsupported system language AWA shows English. |
| 1.5 | Switch ID → FR → ID → ZH → ID | Each switch immediate; no data change; no stale text. |

## 2. Layout with long words

| # | Check | Expected |
|---|---|---|
| 2.1 | Every screen of the eight objectives | No clipped text; chips, buttons, cards wrap; CTA never below the fold. |
| 2.2 | Cycle ring phase names (Menstruasi, Folikuler, Ovulasi, Luteal) | Fit the disc at the base size. |
| 2.3 | Tab bar at 360 dp | Labels fully visible. |
| 2.4 | Calendar | Header Senin … Minggu, Monday first; month name e.g. «Oktober»; Hijri labels. |
| 2.5 | Dates and times | «19 Oktober 2026», short «19 Okt 2026», 24-hour («18:05», «00:30», never «24:30»). |
| 2.6 | Largest font + larger display size | No clipped primary actions; scrolling reaches everything. |
| 2.7 | Premium card and sheet | Title «AWA Premium»; benefits and CTA wrap; arrow does not overlap the CTA. |

## 3. Counts

Indonesian has one plural category. «{{count}} hari», «{{count}} catatan»: check 0, 1, 2, 11, 21 and that no
«{{count}}» or key text appears (Home, Statistics, Qada, notification bell accessibility label).

## 4. Content

Open a sample of the 73 articles (cycle, pregnancy weekly, Islamic fiqh, nifas, Qada) and several pregnancy weeks
(1, 12, 24, 40, 41): no English/French leftovers, headings and lists complete. The four illustrations keep English
lettering and the spoken description says so.

## 5. Notification localization

Audit app, synthetic profile, reminders 5–10 min ahead, app backgrounded (not force-stopped), clock unchanged.
Channel name, every objective's reminders, pregnancy vitamin / custom / appointment reminders (user-typed text stays
unchanged), Qada reminder; switch ID → EN → ID with a pending reminder: same time, new text, no duplicate.

## 6. Medical PDF / CSV export

| # | Check | Expected |
|---|---|---|
| 6.1 | Export a synthetic report in Indonesian | PDF created and opened |
| 6.2 | Headings, dates, categories, bullets, notes | All characters drawn (Helvetica); no «[…]» for everyday text |
| 6.3 | Long note without spaces | Wraps inside the margins |
| 6.4 | Same export in RU / ZH / TR / FR | Unchanged |
| 6.5 | CSV | Indonesian headers (tanggal;kategori;nilai), `;` delimiter, UTF-8 |

## 7. Regression spot checks

Switch to French, English and Chinese once: language sheet, plurals, cycle ring label.

## 8. Reporting

Record build id, device + Android version, language, objective, screen, a screenshot, and whether text was clipped,
wrong or missing. Terminology disagreements go to `indonesian-review-checklist.md`, not to the bug list.
