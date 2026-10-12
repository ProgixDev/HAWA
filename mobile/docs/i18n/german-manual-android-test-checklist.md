# German (de) — manual Android test checklist

Purpose: verify on a real phone what Jest cannot: Hermes behaviour, wrapping of long German compounds, fonts,
notification delivery and PDF output. Nothing in this list has been run; no result is claimed.

## 0. Ground rules

- Use the isolated audit build (`com.hawa.audit`) and synthetic data only; never `com.hawa`; no real health data.
- Do not change the clock, time zone or battery settings (separate approval needed).
- Phones: one small (about 360 x 720 dp, Samsung A13 class) and one large (about 412 x 915 dp); repeat the layout
  items at the default and the largest system font size.
- A build with this localization is NOT installed yet. A new audit APK has to be built and approved separately.

## 1. Language selection and persistence

| # | Step | Expected |
|---|---|---|
| 1.1 | Profile → Appearance → Language | **Seven** cards: English, Français, Español, Italiano, Türkçe, Русский, **Deutsch** (🇩🇪, «AWA auf Deutsch verwenden»). The sheet scrolls; Apply stays reachable. |
| 1.2 | Select Deutsch, Apply | UI switches immediately; tab bar «Start / Kalender / Statistik / Profil»; the language row reads «Deutsch». |
| 1.3 | Force-stop and relaunch | Still German; stored value `de` (a brief English first frame is by design before the preference loads). |
| 1.4 | Switch DE → FR → DE → RU → DE | Each switch immediate; no data change. |
| 1.5 | Invalid stored language | English (never German by accident). |

## 2. Plurals (German has only «eins» / «andere»)

| # | Where | Expected |
|---|---|---|
| 2.1 | Home «In N Tagen» (next period / fertile window) | 1 → «In 1 Tag», every other number → «In N Tagen» (also 0, 2, 5, 11, 21) |
| 2.2 | Statistics «N Tage», cycles, entries | same rule |
| 2.3 | Qada count labels and the add-days button | «1 Tag», «2 Tage …» |
| 2.4 | Home header bell (TalkBack) | «1 ungelesene Benachrichtigung» / «N ungelesene Benachrichtigungen» |

Unlike Russian there are no few/many forms, so the Hermes fallback is not exercised here; the check is that the
numbers read naturally and that no «Tag(e)» / «{{count}}» artefact appears.

## 3. All eight objectives

Check Home, Calendar, Statistics, the journal sheet and the reminder settings of each objective in German: no raw
keys, no English/French leftovers, no clipped text, no wrong gender/case. Cycle tracking, Trying to conceive,
Contraception, PCOS (irregular), Menopause, Pregnancy (weeks 1, 12, 28, 40), Postpartum, Pregnancy loss (check the
gentle tone). Library: one article per category; headings, meta («6 Min. Lesezeit», «Geprüfter Inhalt») and the
religious disclaimer render in German; hero images keep English lettering (spoken note says so).

## 4. German text expansion and wrapping (the main risk)

| # | Check | Expected |
|---|---|---|
| 4.1 | Cycle ring on Home | «Follikelphase», «Menstruation», «Lutealphase», «Eisprung» fit the disc; none is split mid-word (the font shrinks, never below 7) |
| 4.2 | Bottom tab bar at 360 dp | «Start», «Kalender», «Statistik», «Profil» fully visible |
| 4.3 | Long compounds in titles and rows: «Veröffentlichungsdatum», «Zyklusregelmäßigkeit», «Menstruationstasse», «Nutzungsbedingungen», «Benachrichtigungen» | Wrap or shrink inside their container; no horizontal overflow; CTA never below the fold |
| 4.4 | Chips and journal options with long words («Berührungsempfindlichkeit», «Konzentrationsprobleme») | Wrap inside the chip |
| 4.5 | Two-line titles with a forced break (`\n`) | Break is natural; «Verhütungs-» / «pflaster» is a deliberate hyphen |
| 4.6 | Calendar | Header Mo Di Mi Do Fr Sa So, Monday first; month «Oktober 2026», «März» with the umlaut |
| 4.7 | Dates and times | «5. Oktober 2026», 24-hour («18:05», «00:30», never «24:30») |
| 4.8 | Uppercase eyebrows | «ZYKLUSPHASEN», «GUT ZU WISSEN»; umlauts survive («ÜBERSICHT»); ß becomes «SS» |
| 4.9 | Largest font + larger display size | No clipped primary actions; scrolling reaches everything |
| 4.10 | German keyboard input | ä ö ü ß accepted in notes and names; typed confirmation «LÖSCHEN» accepted in any case |

## 5. Notification localization

Audit app, synthetic profile, reminders 5–10 min ahead, app backgrounded (not force-stopped), clock unchanged.

| # | Reminder | Expected |
|---|---|---|
| 5.1 | Channel name in Android settings | German name |
| 5.2 | Cycle (daily journal, period check-in, upcoming period, fertile window / ovulation) | German title and body; generic text when discreet notifications are on |
| 5.3 | Conceive, contraception, irregular, menopause, postpartum (incl. Nifas), loss | German |
| 5.4 | Pregnancy (weekly, daily journal, vitamin/medication, custom, appointment/exam) | Fixed titles German; **user-typed text unchanged** |
| 5.5 | Qada reminder | German |
| 5.6 | Switch DE → EN → DE with a pending reminder | Same time, new text, no duplicate; a delivered one is not removed |
| 5.7 | Tap a delivered notification | Opens the audit app on the right screen |

## 6. Medical PDF export

| # | Check | Expected |
|---|---|---|
| 6.1 | Export a synthetic report in German | PDF created and shared/opened |
| 6.2 | Headings, date lines, category labels (bold), bullets | Umlauts and ß are drawn (ä ö ü Ä Ö Ü ß „ “ – €); no boxes, no `?` |
| 6.3 | Long note with compounds and a very long token | Wraps inside the margins |
| 6.4 | File size | Small (Helvetica, nothing embedded) |
| 6.5 | Same export in RU / TR / FR | Unchanged (DejaVu / Cairo / Helvetica as before) |
| 6.6 | CSV | UTF-8 umlauts intact; headers «datum, kategorie, wert» |

## 7. Regression spot checks

Switch to French, Turkish and Russian once: language sheet, plurals (Russian 1 день / 5 дней / 21 день) and the
cycle ring label (the ring font change must not alter short names).

## 8. Reporting

Record build id, device + Android version, language, objective, screen, a screenshot, and whether text was clipped,
wrong or missing. Terminology disagreements go to `german-review-checklist.md`, not to the bug list.
