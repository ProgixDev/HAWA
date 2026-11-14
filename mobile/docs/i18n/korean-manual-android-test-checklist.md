# 한국어 (Korean) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one; Samsung One UI is the most common Korean device). It was not done: no Korean build was made or
installed, and nothing in this work touched a device or an emulator. Jest, TypeScript, ESLint and a desktop rendering of the PDF pass; what they cannot show is how the Android text engine,
system fonts, Korean keyboard (IME) and share sheet behave.

Setup: install a debug or release build, then test with (a) the phone in Korean (Settings → General management → Language → 한국어) on a fresh install, (b) the phone in English and AWA
switched to Korean from Appearance, (c) a phone whose system language is **Japanese or Chinese** with AWA in Korean (glyph-form check in section 2).

## 1. Language selection and persistence

- [ ] Fresh install, phone in Korean (ko-KR) → AWA starts in Korean (onboarding and splash already in Korean, no flash of English).
- [ ] Fresh install, phone in an unsupported language (Thai, Vietnamese) → English.
- [ ] Appearance → Language: thirteen cards, « 한국어 » with 🇰🇷 and the subtitle « AWA를 한국어로 사용 »; no « System » card; the row shows « 한국어 ».
- [ ] Choose another language, then Korean, then restart the app: Korean persists. Change the phone language afterwards: AWA keeps its language.
- [ ] An install whose language was already chosen is not changed by this build.

## 2. Hangul and layout — look for these defects on every screen below

Boxes (□) or missing glyphs, **Japanese / Chinese glyph forms** of any shared character (Hangul itself has none, but a few symbols such as ·, ~ and “ ” differ between CJK fonts), text cut at the end of a
button / chip / tab / card / modal title, syllables clipped at the top or bottom of a line, **a word broken in the middle** where a space was available (Android breaks Korean at syllables by default;
check long titles and card descriptions), a label that wraps onto a second line where it should not, particles separated from their noun at a line end.

- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode; the welcome lockup « 환영합니다 / AWA ».
- [ ] Home / cycle dashboard, including the **cycle ring**: the caption, the day number and the phase names (월경기 난포기 배란기 황체기 …) stay inside the circle on a 320 dp and a 412 dp phone, lines not clipped.
- [ ] Calendar (month title « 2026년 10월 », weekday header 월 화 수 목 금 토 일), journal sheet and the seven journal screens; the physical-activity grid with « 하이킹 » and « 유산소 운동 » before « 기타 ».
- [ ] **Library category tabs** (« 전체 », « 의학 », « 종교 », « 추천 »): every label on one line; the strip scrolls if the tabs do not fit.
- [ ] Statistics, history, Premium sheet, Profile, Appearance (the palette names under the six cards), notifications centre, AWA Together (partner) screens, daughter profiles and
  daughter onboarding; the **Daughter Mood** title (« 〇〇님의 기분 »-style, from `ko.ts`) is complete on one line (or two at the smallest size) between the back and save buttons.
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 24, 38, 41; postpartum (« 산후 일수: 12 » on the hero), loss, menopause, contraception, irregular cycles (PCOS).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance; long Korean paragraphs wrap at word spaces without a single orphan syllable on the last line.
- [ ] Forms: validation messages, a Korean name in the name field (IME composition underline, cursor, no duplicated last syllable), the delete-confirmation word « 삭제 » typed with the Korean keyboard.
- [ ] Light, Dark and True Black themes, and each of the six palettes.
- [ ] Settings → Display size and Font size at the **largest** values: no clipped or overlapping Korean text, buttons stay reachable above the navigation bar.

## 3. Dates, numbers, counters

- [ ] « 2026년 10월 21일 », « 10월 21일 », Western digits, weekdays 월 … 일.
- [ ] Hijri line « 히즈라력 1447년 라마단 12일 » and the calendar header « 히즈라력 1447년 라마단 » (month names from the glossary; no « 9월 »), prayer-time cards (파즈르 두흐르 아스르 마그리브 이샤).
- [ ] « 0일 », « 1일 », « 2일 » / « 1개월 », « 2개월 » / « 1주 », « 2주 » read correctly (cycle length, period length, pregnancy weeks « 12주차 », counters).

## 4. Notifications and reminders

- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder; wait for them: the title / body are Korean, the user's own text (vitamin name, appointment title) is untouched.
- [ ] Discreet-notification mode (hide preview) still shows the generic Korean text.
- [ ] Notification channel name in Android settings is Korean.
- [ ] Switch the language to Korean **after** reminders exist: they are rebuilt in Korean at the same time; restart the phone and check a scheduled one still arrives in Korean.

## 5. Map (MapLibre / MapTiler)

- [ ] Onboarding location / Location screen in Korean: the default shows « 그레이터런던, 영국 » (not « London, United Kingdom »), the map does not move.
- [ ] Switch the language to Korean on the live map: place labels re-draw in Hangul (cities, countries, seas, roads in Korea) without the camera moving; a place without a Korean name keeps its local / Latin name.
- [ ] Search « Seoul » / « 서울 » / « 부산 » / « Tokyo »: results and addresses come back in Korean; selecting one stores the coordinates unchanged.
- [ ] Hangul labels are visible at zoom 10–16 (no boxes); offline, the saved place still shows.

## 6. Export (PDF and CSV)

- [ ] Medical export → PDF with the app in Korean: open it in the phone's PDF viewer and in Google Drive. Hangul, Latin words, digits and punctuation are drawn in one typeface, no box, no « […] » marker for
  everyday text; a very rare syllable shows « […] » with the notice.
- [ ] A long report (≥ 3 pages): no text runs past the right margin, lines break at word spaces, page breaks are clean, bold titles are bold.
- [ ] CSV export opened in Excel and in Google Sheets: Korean headers and values correct (UTF-8 with BOM, `;` delimiter).
- [ ] The PDF of another language (French, Russian, Chinese, Japanese, Hindi) is unchanged.
- [ ] App size: the release APK grows by about 1.4 MB of JavaScript for the two Noto Sans KR subsets (check against the size budget).

## 7. Backup, privacy, security

- [ ] Backup / restore and the portable backup flow with the app in Korean (labels only; data is unchanged).
- [ ] App lock, the intimacy section PIN and biometric prompts: texts in Korean, behaviour unchanged.
- [ ] Discreet launcher: the screen says the app appears as « 다이어리 »; the real launcher label is native (« Agenda ») — decide whether to add a `values-ko` string.

## 8. Accessibility

- [ ] TalkBack in Korean: buttons, tabs, the cycle ring, the calendar cells and the language cards are read correctly (no spelled-out syllables, no Latin reading of Korean labels).
- [ ] The Hijri line and the numbers inside counters are read as one phrase.

## 9. Report back

Note the phone model, Android version, system language, font scale, theme and screen for every defect, with a screenshot; wording corrections go in `korean-review-checklist.md` first.
