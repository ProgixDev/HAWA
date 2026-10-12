# Russian (ru) — manual Android test checklist

Purpose: verify on a real phone what Jest cannot: Hermes behaviour, wrapping, fonts, real notification delivery
and PDF output. Nothing in this list has been run; no result is claimed.

## 0. Ground rules

- Use the **isolated audit build** (`com.hawa.audit`, debug variant, bundled JS) and **synthetic** data only.
  Do not open `com.hawa` and do not create real health records.
- Do not change the phone's clock, time zone or battery settings for these tests (separate approval needed for
  time-zone tests).
- Phones: one small (about 360 x 720 dp, e.g. Samsung Galaxy A13 class) and one large (about 412 x 915 dp).
  Repeat the layout items at system font size "Default" and "Largest" and at display size "Larger".
- Mark each item PASS / FAIL / N/A and note the screen and device.

## 1. Language selection and persistence

| # | Step | Expected |
|---|---|---|
| 1.1 | Profile → Appearance → Language | Six cards: English, Français, Español, Italiano, Türkçe, **Русский** (🇷🇺). The Russian card reads «Использовать AWA на русском». The sheet scrolls; Apply stays reachable. |
| 1.2 | Select Русский, tap Apply | UI switches immediately (tab bar: Главная / Календарь / Статистика / Профиль), no restart. The language row subtitle reads «Русский». |
| 1.3 | Force-stop the app, relaunch | Still Russian from the first frame (no flash of English). |
| 1.4 | Switch RU → FR → RU → EN → RU | Each switch is immediate; nothing stale. |
| 1.5 | Switch the active profile (owner / managed profile) | Language does not change (it is app-wide). |
| 1.6 | Switch language with existing data | Records are unchanged (open the journal/calendar before and after). |
| 1.7 | Fresh install state: first launch | English (the default), never Russian automatically. |

## 2. Russian plurals on Hermes (the highest-risk item)

Hermes has no `Intl.PluralRules`; the app installs a fallback (`src/i18n/pluralRules.ts`). Verify on the device:

| # | Where | Action | Expected |
|---|---|---|---|
| 2.1 | Home quick action «Каза постов» (or Hijri calendar → «Посты для восполнения») → add days (stepper, button label) | Step the count 1, 2, 3, 4, 5, 10, 11, 12, 14, 15, 20, 21, 22, 25 | Button reads «Добавить N день / дня / дней для восполнения» — **1 день, 2 дня, 4 дня, 5 дней, 11 дней, 12 дней, 14 дней, 21 день, 22 дня, 25 дней** |
| 2.2 | Same screen, after saving N days | Hero count and «…дней для восполнения» | Forms follow the same rule |
| 2.3 | Statistics (any objective with data) | Counts of days / cycles | «N дней с записями», «Проанализировано циклов: N» |
| 2.4 | Home header bell with 1, 2, 5, 21 unread in-app notifications (create synthetic reminders); read it with TalkBack | Accessibility label | «1 непрочитанное уведомление», «2 непрочитанных уведомления», «5 непрочитанных уведомлений», «21 непрочитанное уведомление» |
| 2.5 | Any place showing `0` of something | | «0 дней» uses the **many** form, never «0 день» |

FAIL signature: without the fallback i18next knows only "one" (n = 1) and "other", and the Russian "other" text is
the genitive-singular form. So only 1 is right and EVERY other count shows «… дня»: «5 дня», «11 дня», «21 дня»,
«0 дня» (expected «5 дней», «11 дней», «21 день», «0 дней»). Counts 2, 3 and 4 look correct even without the
fallback («2 дня»), so **5, 11, 21 and 0 are the decisive values**: check those first.
Any «N дня» for N = 5, 11, 21 or 0 means the fallback was not installed — stop and report.

## 3. All eight objectives

For each objective (switch via onboarding or Profile → objective): check Home, Calendar, Statistics, the journal
sheet and the objective's reminder settings in Russian. Look for raw keys (`a.b.c`), English/French leftovers,
clipped text, and wrong gender/case.

| Objective | Screens to open (Russian) |
|---|---|
| Cycle tracking | Home, Calendar (period/fertile legend), Statistics, Daily journal (all categories), Reminders (daily journal, period, fertile window), Hijri calendar, prayer times |
| Trying to conceive | Dashboard, Calendar, Statistics, LH test and temperature journal, fertile-window reminder |
| Contraception | Method selection, Dashboard, pill schedule, Calendar, Statistics, intake journal, reminders |
| PCOS (irregular) | Onboarding, Dashboard, Calendar, Statistics, journal overview, unrecorded-period reminder |
| Menopause | Stage, symptoms, hormonal treatment, labs, Dashboard, Calendar, Statistics, reminders |
| Pregnancy | Dating setup, week screen (try weeks 1, 12, 28, 40), weight, symptoms, medical events and appointment form, Calendar, Statistics, reminders |
| Postpartum | Delivery date/type, lochia, feeding, cycle return, Nifas card, journal, Calendar, Statistics, reminders |
| Pregnancy loss | Journal, bleeding, cycle return, trying again, Calendar, Statistics, Qadaa shortcut, reminders — check the tone is gentle |

Library: open at least one article per category (cycle, fertility, pregnancy, postpartum, menopause, PCOS,
contraception, loss, spiritual) and confirm title, meta («6 мин чтения», «Проверенный материал»), headings, FAQ and
the religious disclaimer render in Russian. Hero images with English lettering are expected (no Russian artwork);
the screen-reader description says so.

## 4. Cyrillic text wrapping and layout

| # | Check | Expected |
|---|---|---|
| 4.1 | Bottom tab bar on 360 dp | «Главная», «Календарь», «Статистика», «Профиль» fully visible, no ellipsis, no overlap |
| 4.2 | Buttons and chips with long labels (journal categories, onboarding CTAs, premium sheet) | Wrap or shrink inside their container; the CTA is never below the fold or behind the navigation bar |
| 4.3 | Titles with a forced line break (`\n`) in articles and sheets | Break is natural, no orphaned one-letter line |
| 4.4 | Long words: «Фолликулярная фаза», «Менопаузальная гормональная терапия», «Профессиональное» | No horizontal overflow |
| 4.5 | Calendar grid headers Пн Вт Ср Чт Пт Сб Вс | Monday-first, aligned with the day cells |
| 4.6 | Dates: «5 октября», «5 октября 2026 г.»; times 24-hour («18:05», «00:30», never «24:30») | |
| 4.7 | Largest system font + larger display size | No clipped primary actions; scrolling reaches everything |
| 4.8 | Android keyboard (Russian layout) in text inputs, notes and search | Typing, selection and cursor work; ё and й accepted; the typed confirmation word «УДАЛИТЬ» is accepted in any case |
| 4.9 | Uppercase transforms (eyebrows, badges) | «ФАЗЫ ЦИКЛА», no mixed case; «ё» upper-cases to «Ё» |
| 4.10 | Text with Latin brand words next to Cyrillic (AWA, PIN, Premium) | Same baseline, no tofu boxes |

## 5. Notification localization

Use the audit app, a synthetic profile, and reminders a few minutes in the future. Do not change the clock.

| # | Reminder | Expected |
|---|---|---|
| 5.1 | Notification channel name (Android settings → app → notifications) | Russian name |
| 5.2 | Cycle: daily journal, period start check-in, upcoming period, fertile window / ovulation | Title and body in Russian; privacy-safe generic text when discreet notifications are on |
| 5.3 | Conceive, contraception, irregular, menopause (daily tracking + treatment), postpartum (daily + Nifas), loss | Russian title and body |
| 5.4 | Pregnancy: weekly update, daily journal, vitamin/medication, custom reminder, appointment/exam | Fixed titles Russian; **your own text (vitamin name, custom title, appointment title) is shown exactly as typed** |
| 5.5 | Qadaa reminder | «Посты для восполнения» |
| 5.6 | Switch language RU → EN → RU while reminders are pending | Same reminders, same fire times, now with the new language's text; no duplicates |
| 5.7 | Switch language while a notification is already delivered in the shade | The delivered notification is **not** removed or altered |
| 5.8 | Tap a delivered Russian notification | Opens the audit app on the right screen |
| 5.9 | Permission guidance (notifications blocked / channel silent) | Russian explanation and a working «Открыть настройки уведомлений» |

## 6. Medical PDF exports

| # | Check | Expected |
|---|---|---|
| 6.1 | Export a report with synthetic data (Profile → export) in Russian | PDF is created and shared/opened |
| 6.2 | Headings, objective and period labels, date headings, category labels (bold), bullet lines | All Cyrillic glyphs present — no empty boxes, no `?`; bold headings are visibly heavier |
| 6.3 | Long note (several lines) and a very long word/URL | Wraps inside the margins; nothing is cut at the right edge |
| 6.4 | Mixed content: Latin words, digits («120/80 мм рт. ст.»), «№», «—», ««»» | Rendered |
| 6.5 | Arabic phrase inside a Russian note | Both scripts drawn; Arabic stays right-to-left |
| 6.6 | Same export in FR / EN / TR / AR-content | Unchanged appearance (Helvetica/Cairo); file size not inflated |
| 6.7 | CSV export | Opens correctly in a spreadsheet; UTF-8 Cyrillic intact, headers «дата, категория, значение» |
| 6.8 | File size of a Russian PDF | About +150 KB for the embedded font; acceptable to share by messenger/e-mail |

## 7. Regression spot checks (other languages)

Switch to French and Turkish once and repeat 1.2, 2.5 (counts: «1 jour / 2 jours», «1 gün / 2 gün»), 5.2 and 6.6.
Plural behaviour of every non-Russian language must be exactly as before.

## 8. Reporting

For each FAIL record: build id, device model + Android version, language, objective, screen, a screenshot, and
whether the text was clipped, wrong, or missing. Terminology disagreements go to `russian-review-checklist.md`, not
into the bug list.
