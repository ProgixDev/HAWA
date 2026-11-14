# हिन्दी (Hindi) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one). It was not done: no Hindi
build was made or installed, and nothing in this work touched a device. Jest, TypeScript, ESLint and a desktop rendering of the PDF
pass; what they cannot show is how the Android text engine, fonts and share sheet behave.

Setup: install a debug or release build, then test with (a) the phone in Hindi (Settings → System → Languages → हिन्दी (भारत)) on a
fresh install, (b) the phone in English and AWA switched to Hindi from Appearance, (c) a phone in Hindi **Latin** (`hi-Latn`, if the
device offers it).

## 1. Language selection and persistence

- [ ] Fresh install, phone in Hindi → AWA starts in Hindi (onboarding and splash already in Devanagari, no flash of English).
- [ ] Fresh install, phone in an unsupported language (e.g. Marathi, Tamil) → English.
- [ ] Phone in `hi-Latn` → English (AWA's Hindi is Devanagari).
- [ ] Appearance → Language: ten cards, « हिन्दी » with 🇮🇳 and the subtitle « AWA को हिन्दी में इस्तेमाल करें »; no « System » card; the row shows « हिन्दी ».
- [ ] Choose another language, then Hindi, then restart the app: Hindi persists. Change the phone language afterwards: AWA keeps its language.
- [ ] An install whose language was already chosen (French, Indonesian…) is not changed by this build.

## 2. Devanagari rendering — look for these defects on every screen below

Clipped matras above the headline (शिरोरेखा) or marks below the baseline, conjuncts drawn as their parts (क + ् + ष instead of क्ष),
detached vowel signs, replacement boxes (□), text cut at the end of a button / chip / tab / card / modal title, overlapping lines.

- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode.
- [ ] Home / cycle dashboard, including the **cycle ring**: « चक्र का दिन », the day number and the phase name (all five phases) stay inside the circle on a 320 dp and a 412 dp phone and at 116 / 100 / 96 dp ring sizes.
- [ ] Calendar (month title in Devanagari, weekday header सोम … रवि), journal sheet and the seven journal screens.
- [ ] Statistics, history, Premium sheet, Profile, Appearance, notifications centre, AWA Together (partner) screens, daughter profiles and daughter onboarding (the saved-values note under the cycle set-up).
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 24, 38, 41; postpartum, loss, menopause, contraception, irregular cycles (PCOS).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance.
- [ ] Forms: validation messages, the keyboard in Hindi (Gboard हिन्दी) and a Devanagari name in the name field; the delete-confirmation word « हटाएं » (typing « हटाएँ » is accepted too).
- [ ] Light, Dark and True Black themes, and each of the six palettes.
- [ ] Settings → Display size and Font size at the **largest** values: no clipped or overlapping Hindi text, buttons stay reachable above the navigation bar.
- [ ] Letter-spacing: no gap between a letter and its vowel sign anywhere (Hindi text has its tracking reset to 0).

## 3. Dates, numbers, plurals

- [ ] Month names and the full date in Devanagari (e.g. « 19 अक्तूबर 2026 »), digits Western (0-9) everywhere.
- [ ] « 0 दिन », « 1 दिन », « 2 दिन » / « 1 महीना », « 2 महीने » style counts read correctly (cycle length, period length, pregnancy weeks, counters).
- [ ] Hijri date line and prayer-time cards (the five prayers फ़ज्र, ज़ुहर, अस्र, मग़रिब, इशा).

## 4. Notifications and reminders

- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder; wait for them: the title / body are Hindi, the user's own text (vitamin name, appointment title) is untouched.
- [ ] Discreet-notification mode (hide preview) still shows the generic Hindi text.
- [ ] Notification channel name in Android settings is Hindi.
- [ ] Switch the language to Hindi **after** reminders exist: they are rebuilt in Hindi at the same time.

## 5. Export (PDF and CSV)

- [ ] Medical export → PDF with the app in Hindi: open it in the phone's PDF viewer **and** in Google Drive / a second viewer. Headings, dates, labels and the list lines show correct conjuncts and vowel signs; Latin words (« AWA », « PDF ») and digits are readable; nothing is a box or a « […] » marker.
- [ ] A note typed by the user with Devanagari, Latin and an emoji / Cyrillic character: the unsupported character becomes « […] » with the notice about the CSV.
- [ ] A long report (≥ 3 pages): no text runs past the right margin, page breaks are clean.
- [ ] Export time for a long Hindi report is acceptable (the shaper is JavaScript; note the seconds on the slowest phone).
- [ ] CSV export opened in Excel and in Google Sheets: Hindi headers and values correct (UTF-8 with BOM, `;` delimiter).
- [ ] The PDF of another language (French, Russian, Chinese) is unchanged.

## 6. Backup, privacy, security

- [ ] Backup / restore and the portable backup flow with the app in Hindi (labels only; data is unchanged).
- [ ] App lock, the intimacy section PIN and biometric prompts: texts in Hindi, behaviour unchanged.

## 7. Report back

Note the phone model, Android version, font scale, theme and screen for every defect, with a screenshot; corrections to wording go
in `hindi-review-checklist.md` first.
