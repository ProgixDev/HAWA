# 日本語 (Japanese) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one). It was not done: no Japanese build was made or installed,
and nothing in this work touched a device. Jest, TypeScript, ESLint and a desktop rendering of the PDF pass; what they cannot show is how the Android text
engine, system fonts, IME and share sheet behave.

Setup: install a debug or release build, then test with (a) the phone in Japanese (Settings → System → Languages → 日本語) on a fresh install, (b) the phone in
English and AWA switched to Japanese from Appearance, (c) a phone whose system language is **Simplified Chinese** with AWA in Japanese (see the glyph-form check in section 2).

## 1. Language selection and persistence

- [ ] Fresh install, phone in Japanese → AWA starts in Japanese (onboarding and splash already in Japanese, no flash of English).
- [ ] Fresh install, phone in an unsupported language (Korean, Thai) → English.
- [ ] Appearance → Language: twelve cards, « 日本語 » with 🇯🇵 and the subtitle « AWAを日本語で使う »; no « System » card; the row shows « 日本語 ».
- [ ] Choose another language, then Japanese, then restart the app: Japanese persists. Change the phone language afterwards: AWA keeps its language.
- [ ] An install whose language was already chosen is not changed by this build.

## 2. Japanese characters and layout — look for these defects on every screen below

Boxes (□) or missing glyphs, **Chinese glyph forms** of shared kanji (on Android the system CJK font follows the phone's language list: with a Chinese phone, kanji such as 直 骨 角 令 刃 may be drawn
in Chinese forms because React Native cannot set a text language), text cut at the end of a button / chip / tab / card / modal title, characters clipped at the top or bottom of a line,
lines that break before 、 。 ー or a small kana (Android's line breaker should avoid it), unexpected gaps between characters (letter spacing is reset for Japanese), a label that wraps onto a second line where it should not.

- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode; the welcome lockup « ようこそ / AWA ».
- [ ] Home / cycle dashboard, including the **cycle ring**: the caption, the day number and the phase names (月経期 卵胞期 排卵期 黄体期 …) stay inside the circle on a 320 dp and a 412 dp phone, lines not clipped.
- [ ] Calendar (month title « 2026年10月 », weekday header 月 火 水 木 金 土 日), journal sheet and the seven journal screens; the physical-activity grid with « ハイキング » and « 有酸素運動 » before « その他 ».
- [ ] **Library category tabs** (« すべて », « 医療 », « 宗教 », « 注目 »): every label on one line; the strip scrolls if the tabs do not fit.
- [ ] Statistics, history, Premium sheet, Profile, Appearance (the palette names under the six cards), notifications centre, AWA Together (partner) screens, daughter profiles and
  daughter onboarding; the **Daughter Mood** title (« 〇〇さんの気分 »-style, from `ja.ts`) is complete on one line (or two at the smallest size) between the back and save buttons.
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 24, 38, 41 (« 産後日数：12 » on the postpartum hero); postpartum, loss, menopause, contraception, irregular cycles (PCOS).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance; long Japanese paragraphs wrap without orphaned punctuation.
- [ ] Forms: validation messages, a Japanese name with kanji in the name field (IME composition underline, cursor), the delete-confirmation word « 削除 » typed with the IME.
- [ ] Light, Dark and True Black themes, and each of the six palettes.
- [ ] Settings → Display size and Font size at the **largest** values: no clipped or overlapping Japanese text, buttons stay reachable above the navigation bar.

## 3. Dates, numbers, counters

- [ ] « 2026年10月19日 », « 10月19日 », Western digits, weekdays 月 … 日.
- [ ] Hijri line « ヒジュラ暦1447年ラマダーン12日 » and the calendar header « ヒジュラ暦1447年ラマダーン » (month names from the glossary; no « 9月 »), prayer-time cards (ファジュル ズフル アスル マグリブ イシャー).
- [ ] « 0日 », « 1日 », « 2日 » / « 1か月 », « 2か月 » / « 1週間 », « 2週間 » read correctly (cycle length, period length, pregnancy weeks, counters).

## 4. Notifications and reminders

- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder; wait for them: the title / body are Japanese, the user's own text (vitamin name, appointment title) is untouched.
- [ ] Discreet-notification mode (hide preview) still shows the generic Japanese text.
- [ ] Notification channel name in Android settings is Japanese.
- [ ] Switch the language to Japanese **after** reminders exist: they are rebuilt in Japanese at the same time; restart the phone and check a scheduled one still arrives in Japanese.

## 5. Export (PDF and CSV)

- [ ] Medical export → PDF with the app in Japanese: open it in the phone's PDF viewer and in Google Drive. Kanji (Japanese forms), hiragana, katakana, full-width punctuation and Latin words / digits are drawn
  in one typeface, no box, no « […] » marker for everyday text; a rare kanji (JIS level 2) shows « […] » with the notice.
- [ ] A long report (≥ 3 pages): no text runs past the right margin, no line starts with 、。ー or a small kana, page breaks are clean.
- [ ] CSV export opened in Excel and in Google Sheets: Japanese headers and values correct (UTF-8 with BOM, `;` delimiter).
- [ ] The PDF of another language (French, Russian, Chinese, Hindi) is unchanged; a Chinese report still uses the Chinese glyph forms.
- [ ] App size: the release APK grows by about 2.8 MB of JavaScript for the two Noto Sans JP subsets (check against the size budget).

## 6. Backup, privacy, security

- [ ] Backup / restore and the portable backup flow with the app in Japanese (labels only; data is unchanged).
- [ ] App lock, the intimacy section PIN and biometric prompts: texts in Japanese, behaviour unchanged.
- [ ] Discreet launcher: the screen says the app appears as « 手帳 »; the real launcher label is native (« Agenda ») — decide whether to add a `values-ja` string.

## 7. Accessibility

- [ ] TalkBack in Japanese: buttons, tabs, the cycle ring, the calendar cells and the language cards are read correctly (no spelled-out characters, no Latin reading of Japanese labels).
- [ ] The Hijri line and the numbers inside counters are read as one phrase.

## 8. Report back

Note the phone model, Android version, system language, font scale, theme and screen for every defect, with a screenshot; wording corrections go in `japanese-review-checklist.md` first.
