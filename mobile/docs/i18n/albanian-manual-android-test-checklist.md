# Shqip (Albanian) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one). It was not done: no Albanian build was made or installed,
and nothing in this work touched a device. Jest, TypeScript, ESLint and a desktop rendering of the PDF pass; what they cannot show is how the Android text
engine, fonts and share sheet behave.

Setup: install a debug or release build, then test with (a) the phone in Albanian (Settings → System → Languages → Shqip) on a fresh install, (b) the phone in
English and AWA switched to Albanian from Appearance, (c) a phone whose region is Kosovo or North Macedonia (`sq-XK`, `sq-MK`) if the device offers it.

## 1. Language selection and persistence

- [ ] Fresh install, phone in Albanian (Albania, Kosovo or North Macedonia) → AWA starts in Albanian (onboarding and splash already in Albanian, no flash of English).
- [ ] Fresh install, phone in an unsupported language (Serbian, Greek, Macedonian) → English.
- [ ] Appearance → Language: eleven cards, « Shqip » with 🇦🇱 and the subtitle « Përdor AWA në shqip »; no « System » card; the row shows « Shqip ».
- [ ] Choose another language, then Albanian, then restart the app: Albanian persists. Change the phone language afterwards: AWA keeps its language.
- [ ] An install whose language was already chosen is not changed by this build.

## 2. Albanian characters and layout — look for these defects on every screen below

Missing ë / Ë / ç / Ç (shown as e / E / c / C or as a box), accent drawn apart from its letter, text cut at the end of a button / chip / tab / card / modal
title, overlapping lines, a label that wraps onto a second line where it should not.

- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode.
- [ ] Home / cycle dashboard, including the **cycle ring**: the caption, the day number and the phase names (all five) stay inside the circle on a 320 dp and a 412 dp phone.
- [ ] Calendar (month title, weekday header Hën … Die), journal sheet and the seven journal screens; the physical-activity grid with « Ecje në natyrë » and « Cardio » before « Tjetër ».
- [ ] **Library category tabs** (« Të gjitha », « Mjekësore », « Fetare », « Të zgjedhura »): every label on one line; the strip scrolls if the tabs do not fit.
- [ ] Statistics, history, Premium sheet, Profile, Appearance (the palette names under the six cards), notifications centre, AWA Together (partner) screens, daughter profiles and
  daughter onboarding; the **Daughter Mood** title (« Disponimi i … » followed by her name) is complete on one line (or two at the smallest size) between the back and save buttons.
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 24, 38, 41; postpartum, loss, menopause, contraception, irregular cycles (PCOS).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance.
- [ ] Forms: validation messages and an Albanian name with ë / ç in the name field; the delete-confirmation word.
- [ ] Light, Dark and True Black themes, and each of the six palettes.
- [ ] Settings → Display size and Font size at the **largest** values: no clipped or overlapping Albanian text, buttons stay reachable above the navigation bar.

## 3. Dates, numbers, plurals

- [ ] Month names in lower case Albanian (« 19 tetor 2026 »), Western digits, weekday abbreviations Hën Mar Mër Enj Pre Sht Die.
- [ ] « 0 ditë », « 1 ditë », « 2 ditë » / « 1 muaj », « 2 muaj » / « 1 javë », « 2 javë » read correctly (cycle length, period length, pregnancy weeks, counters).
- [ ] Hijri date line and prayer-time cards (the five prayers) and the month name **Dhul-Hixhe**.

## 4. Notifications and reminders

- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder; wait for them: the title / body are Albanian, the user's own text (vitamin name, appointment title) is untouched.
- [ ] Discreet-notification mode (hide preview) still shows the generic Albanian text.
- [ ] Notification channel name in Android settings is Albanian.
- [ ] Switch the language to Albanian **after** reminders exist: they are rebuilt in Albanian at the same time.

## 5. Export (PDF and CSV)

- [ ] Medical export → PDF with the app in Albanian: open it in the phone's PDF viewer and in Google Drive. ë / Ë / ç / Ç are drawn (headings in capitals too, e.g. « PËRMBLEDHJE »), no box, no « […] » marker.
- [ ] A long report (≥ 3 pages): no text runs past the right margin, page breaks are clean.
- [ ] CSV export opened in Excel and in Google Sheets: Albanian headers and values correct (UTF-8 with BOM, `;` delimiter).
- [ ] The PDF of another language (French, Russian, Chinese, Hindi) is unchanged.

## 6. Backup, privacy, security

- [ ] Backup / restore and the portable backup flow with the app in Albanian (labels only; data is unchanged).
- [ ] App lock, the intimacy section PIN and biometric prompts: texts in Albanian, behaviour unchanged.

## 7. Report back

Note the phone model, Android version, font scale, theme and screen for every defect, with a screenshot; wording corrections go in `albanian-review-checklist.md` first.
