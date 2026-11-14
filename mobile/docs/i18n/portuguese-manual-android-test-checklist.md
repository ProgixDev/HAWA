# Português (Portugal and Brasil) — manual Android test checklist

Everything below needs a **real Android phone** (a Samsung Galaxy A13-class device and a large one). It was not done: no Portuguese build was made or installed, and nothing in this work touched a device or an emulator.
Jest, TypeScript, ESLint and a desktop rendering of the PDF pass; what they cannot show is how the Android text engine, system fonts, keyboard (IME), share sheet and map renderer behave.

Setup: install a debug or release build, then test with (a) the phone in **Português (Portugal)** and again in **Português (Brasil)** on a fresh install, (b) the phone in English and AWA switched to each variant from Appearance.

## 1. Language selection and persistence
- [ ] Fresh install, phone in Português (Portugal) → AWA starts in Portuguese (Portugal) (onboarding already translated, “Guardar”, “Definições”, no flash of English); phone in Português (Brasil) → AWA starts in Portuguese (Brasil) (“Salvar”, “Configurações”).
- [ ] Phone in Angolan / Mozambican Portuguese (pt-AO / pt-MZ) → Portugal text. Phone in an unsupported language (Vietnamese, Thai) → English.
- [ ] Appearance → Language: **fifteen cards**, *Português (Portugal)* 🇵🇹 « Usar o AWA em português de Portugal » and *Português (Brasil)* 🇧🇷 « Usar o AWA em português do Brasil »; no « System » card; the row shows the chosen one.
- [ ] Switch Portugal ↔ Brasil ↔ another language: texts change at once, no restart; restart the app: the choice persists; change the phone language afterwards: AWA keeps its language.

## 2. Accents and layout — look for these defects on every screen below
Missing or boxed accents (á à â ã é ê í ó ô õ ú ç), text cut at the end of a button / chip / tab / card / modal title (Portuguese words are about 10–20 % longer than English), a label that wraps where it should not, clipped diacritics at the top of a line.
- [ ] Splash, onboarding (objective choice, name, birth date, cycle set-up), anonymous mode; the welcome lockup « Bem-vinda / à / AWA ».
- [ ] Home / cycle dashboard, including the **cycle ring**: caption « Dia do ciclo » and the phase names (« Fase menstrual », « Fase folicular », « Janela fértil », « Ovulação », « Fase lútea ») stay inside the circle on a 320 dp and a 412 dp phone.
- [ ] Calendar (weekday header Seg Ter Qua Qui Sex Sáb Dom), journal sheet and the seven journal screens; the physical-activity grid with « Caminhada na natureza » (Brasil: « Trilha ») and « Cardio » before « Outro ».
- [ ] **Library category tabs** (« Tudo », « Médico », « Religioso », « Em destaque »): every label on one line; the strip scrolls if the tabs do not fit.
- [ ] Statistics, history, Premium sheet, Profile, Appearance (palette names under the six cards: Brasil reads « Serenidade de Sálvia »), notifications centre, AWA Together (partner) screens, daughter profiles and daughter onboarding; the **Daughter Mood** title is complete between the back and save buttons.
- [ ] Pregnancy dashboard and the week screen for weeks 1, 12, 20, 24, 38, 41; postpartum, loss, menopause, contraception, irregular cycles (SOP).
- [ ] Library: open at least one article of each category, plus the three that contain religious guidance, **in both variants** and compare a few words (*ecografia / ultrassonografia*, *penso / absorvente*, *equipa / equipe*, *afrontamentos / ondas de calor*).
- [ ] Forms: validation messages, a name with accents (*Inês, João, Conceição*) in the name field, the delete-confirmation word « ELIMINAR » (Brasil: « EXCLUIR ») typed with the keyboard.
- [ ] Light, Dark and True Black themes, and each of the six palettes; Settings → Display size and Font size at the **largest** values: no clipped or overlapping text, buttons reachable above the navigation bar.

## 3. Dates, numbers, plurals
- [ ] « 21 de outubro de 2026 », « 21 de outubro »; Hijri line « 12 de Ramadan de 1447 AH » in the calendar; prayer-time cards (Fajr, Dhuhr, Asr, Maghrib, Isha).
- [ ] Counters: Portugal « 0 dias », « 1 dia », « 2 dias »; Brasil « 0 dia », « 1 dia », « 2 dias » (CLDR) — cycle length, period length, pregnancy weeks, postpartum days. Decimals with a comma (« 36,7 °C »).

## 4. Notifications and reminders
- [ ] Grant the permission, create a vitamin reminder, an appointment reminder and a cycle reminder in each variant; wait for them: title / body are Portuguese, the user's own text (vitamin name, appointment title) is untouched.
- [ ] Discreet-notification mode still shows the generic Portuguese text; the notification channel name in Android settings is Portuguese.
- [ ] Switch the language after reminders exist: they are rebuilt in the new variant at the same time; restart the phone and check one still arrives.

## 5. Map (MapLibre / MapTiler)
- [ ] Location screen in Portuguese: the default shows « Grande Londres, Reino Unido » (not « London, United Kingdom »), the map does not move.
- [ ] Switch to Portuguese on the live map: labels re-draw (« Lisboa », « Londres », « Espanha »…) without the camera moving; a place without a Portuguese name keeps its local name.
- [ ] Search « Lisboa » and « São Paulo »: results and addresses come back in Portuguese (« Lisboa, Portugal », « São Paulo, Brasil »); selecting one stores the coordinates unchanged; offline, the saved place still shows.

## 6. Export (PDF and CSV)
- [ ] Medical export → PDF in each variant: accents (ç ã õ é ê …), « 36,7 °C », long notes wrap inside the margins, page breaks are clean, titles bold, no « […] » marker for everyday text.
- [ ] CSV opened in Excel and Google Sheets: Portuguese headers and accents correct (UTF-8 with BOM, `;` delimiter). The PDF of another language is unchanged.
- [ ] App size: no new font or asset was added for Portuguese (about +0.6 MB of JavaScript text for the two dictionaries and the Portuguese article/week blocks).

## 7. Backup, privacy, security, accessibility
- [ ] Backup / restore and the portable backup flow; app lock, intimacy-section PIN and biometric prompts: texts in Portuguese, behaviour unchanged. Discreet launcher says the app appears as « Agenda ».
- [ ] TalkBack in Portuguese (both TTS voices, *pt-PT* and *pt-BR*): buttons, tabs, the cycle ring, the calendar cells and the language cards are read correctly; Arabic terms (Fajr, nifas, istihada) are pronounced acceptably.

## 8. Report back
Note the phone model, Android version, system language, font scale, theme and screen for every defect, with a screenshot; wording corrections go in `portuguese-review-checklist.md` first.
