# বাংলা (Bengali) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one; Samsung One UI, Xiaomi / Redmi and Huawei are common in Bangladesh and West Bengal). It was not done:
no Bengali build was made or installed, and nothing in this work touched a device or an emulator. Jest, TypeScript, ESLint and a desktop rendering of the PDF compared with HarfBuzz pass; what they cannot
show is how the Android text engine, the system fonts, the Bengali keyboards (Gboard, Avro, Ridmik) and the share sheet behave.

Setup: install a debug or release build, then test with (a) the phone in Bengali (Settings → System → Languages → বাংলা (বাংলাদেশ) and, separately, বাংলা (ভারত)) on a fresh install, (b) the phone in
English and AWA switched to Bengali from Appearance, (c) a phone with the system **Hindi** language and AWA in Bengali (the Devanagari fallback must not leak into Bengali text).

## 1. Language selection and persistence

- [ ] Fresh install, phone in বাংলা (বাংলাদেশ) and again in বাংলা (ভারত) → AWA starts in Bengali (onboarding and splash already in Bengali, no flash of English).
- [ ] Fresh install, phone in an unsupported language (Thai, Vietnamese) → English.
- [ ] Appearance → Language: sixteen cards, « বাংলা » with 🇧🇩 and the subtitle « AWA বাংলায় ব্যবহার করুন »; no « System » card; the row shows « বাংলা ».
- [ ] Choose another language, then Bengali, then restart the app: Bengali persists. Change the phone language afterwards: AWA keeps its language.
- [ ] An install whose language was already chosen is not changed by this build.

## 2. Bengali script and layout — look for these defects on every screen below

Boxes (□) or missing glyphs, **a conjunct drawn as consonant + visible hasanta** (ক্‌ষ instead of ক্ষ; check ন্ধ ক্ষ জ্ঞ স্থ ন্ত ত্র ব্য), a vowel sign (ি ী ু ূ ে ৈ ো ৌ) detached from its consonant or
overlapping the next letter, the reph (র্) or ra-phala (্র) missing or misplaced, a **broken matra line**, text cut at the end of a button / chip / tab / card / modal title, marks clipped at the top or
bottom of a line (Bengali is about 1.4 × the font size tall), a word broken in the middle where a space was available, a label that wraps onto a second line where it should not, a danda । at the start
of a line.

- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode; the welcome lockup « স্বাগতম / AWA ».
- [ ] Home / cycle dashboard, including the **cycle ring**: the caption « চক্রের দিন », the day number and the phase names (মাসিক পর্যায়, ফলিকুলার পর্যায়, উর্বর সময়, ডিম্বস্ফোটন, লিউটিয়াল পর্যায়) stay inside the
  circle on a 320 dp and a 412 dp phone, lines not clipped, conjuncts (ম্ব, ক্ষ) intact.
- [ ] Calendar (month title, weekday header সো ম বু বৃ শু শ র), journal sheet and the seven journal screens; the physical-activity grid with « হাইকিং » and « কার্ডিও » before « অন্যান্য ».
- [ ] **Library category tabs**: every label on one line; the strip scrolls if the tabs do not fit.
- [ ] Statistics, history, Premium sheet, Profile, Appearance (the palette names under the six cards), notifications centre, AWA Together (partner) screens, daughter profiles and daughter onboarding; the
  **Daughter Mood** title is complete on one line (or two at the smallest size) between the back and save buttons.
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 24, 34, 38, 41; postpartum, loss, menopause, contraception, irregular cycles (PCOS).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance; long Bengali paragraphs wrap at word spaces without a single orphan syllable on the last line.
- [ ] Forms: validation messages, a Bengali name in the name field (keyboard composition, cursor position after a conjunct, no duplicated vowel sign), the delete-confirmation word « মুছুন » typed with Gboard
  and with Avro / Ridmik (all spellings accepted).
- [ ] Light, Dark and True Black themes, and each of the six palettes.
- [ ] Settings → Display size and Font size at the **largest** values: no clipped or overlapping Bengali text, buttons stay reachable above the navigation bar.

## 3. Dates, numbers, counters

- [ ] « 21 অক্টোবর 2026 », Western digits everywhere (decide with the reviewer whether Bengali digits ২১ should be offered later), weekdays সোম … রবি.
- [ ] Hijri line « 12 রমজান 1447 হিজরি » and the calendar header « রমজান 1447 হিজরি » (month names from the glossary; no « 9 » for the month), prayer-time cards.
- [ ] « 0 দিন », « 1 দিন », « 2 দিন » / « 1 মাস » / « 1 সপ্তাহ » read correctly (cycle length, period length, pregnancy weeks, counters) — Bengali takes no plural form after a number.

## 4. Notifications and reminders

- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder; wait for them: the title / body are Bengali, the user's own text is untouched.
- [ ] Discreet-notification mode (hide preview) still shows the generic Bengali text.
- [ ] Notification channel names in Android settings are Bengali.
- [ ] Switch the language to Bengali **after** reminders exist: they are rebuilt in Bengali; restart the phone and check a scheduled one still arrives in Bengali.

## 5. Map (MapLibre / MapTiler) — Bengali place names cannot be drawn on the map; this is expected

MapLibre Native has **no complex-script shaping engine** (no HarfBuzz) and MapTiler's Bengali glyph ranges would be drawn unshaped (broken conjuncts). With the app in Bengali the **map labels fall back to
Latin names** (`name:latin` → `name:en` → local name; documented in `docs/maps-localization.md`); the search box, the address line and the result list are React Native text and are shaped by Android.

- [ ] Location screen in Bengali: the default shows « গ্রেটার লন্ডন, যুক্তরাজ্য »-style text in the address line, the map does not move; map labels are Latin (not boxes, not broken Bengali).
- [ ] Switch the language to Bengali on the live map: labels re-draw in Latin without the camera moving.
- [ ] Search « ঢাকা » / « Dhaka » / « কলকাতা » / « Kolkata »: results and addresses come back in Bengali in the list; selecting one stores the coordinates unchanged.
- [ ] Offline, the saved place still shows.

## 6. Export (PDF and CSV)

- [ ] Medical export → PDF with the app in Bengali: open it in the phone's PDF viewer and in Google Drive. **Zoom to 300 % on conjuncts, vowel signs, the reph and the chandrabindu.** Bengali, Latin words, digits and
  punctuation are drawn in one typeface, no box, no « […] » marker for everyday text; compare a page with the same text in the app (the pixel-level comparison with HarfBuzz is in `bengali-pdf-font.md`).
- [ ] A long report (≥ 3 pages): no text runs past the right margin, lines break at word spaces, page breaks are clean, bold titles are bold.
- [ ] User-entered Bengali notes (typed with the keyboard, including a long unspaced token) appear correctly.
- [ ] CSV export opened in Excel and in Google Sheets: Bengali headers and values correct (UTF-8 with BOM, `;` delimiter).
- [ ] The PDF of another language (French, Russian, Chinese, Japanese, Hindi) is unchanged.
- [ ] App size: the release APK grows by about 0.3 MB of JavaScript for the two Noto Sans Bengali subsets (check against the size budget).

## 7. Backup, privacy, security

- [ ] Backup / restore and the portable backup flow with the app in Bengali (labels only; data is unchanged).
- [ ] App lock, the intimacy section PIN and biometric prompts: texts in Bengali, behaviour unchanged.
- [ ] Discreet launcher: the screen says the app appears as « এজেন্ডা »; the real launcher label is native (« Agenda »).

## 8. Accessibility

- [ ] TalkBack in Bengali (Google TTS Bengali voice installed): buttons, tabs, the cycle ring, the calendar cells and the language cards are read correctly (no letter-by-letter reading, no Latin reading of Bengali labels).
- [ ] The Hijri line and the numbers inside counters are read as one phrase.

## 9. Report back

Note the phone model, Android version, system language, font scale, theme and screen for every defect, with a screenshot; wording corrections go in `bengali-review-checklist.md` first.
