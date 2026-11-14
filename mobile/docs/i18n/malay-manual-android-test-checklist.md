# Malay (Bahasa Melayu) — Manual Android Test Checklist

**Device requirement:** real Android device (not an emulator), per project policy. Nothing here has been run yet.

## Pre-conditions

1. Build a debug APK that includes Malay.
2. Install on the device.
3. Either set the phone language to Bahasa Melayu (Malaysia) before the **first** launch (AWA detects it once), or use Profile → Appearance → App language.

## Language switching

- [ ] The language sheet shows "🇲🇾 Bahasa Melayu" with the subtitle "Gunakan AWA dalam Bahasa Melayu" (42 cards in total, no "System" card)
- [ ] Selecting it re-renders the whole app in Malay without a restart; reopening the app keeps Malay
- [ ] Profile → Personal information → "Bahasa" row shows "Bahasa Melayu"
- [ ] Other languages still show the endonym "Bahasa Melayu" for this card

## Layout (Malay strings are longer than English)

- [ ] Bottom tabs: Utama · Kalendar · Statistik · Profil — no truncation on a Galaxy A13-class screen
- [ ] Onboarding screens (objective, cycle questions, reminders, summary): CTAs stay visible, no clipped titles
- [ ] Journal sheets and toasts ("Aliran berjaya disimpan ✨") fit on one or two lines
- [ ] Cycle ring (Home): phase label and day caption stay inside the disc

## Calendar

- [ ] Week header: Isn Sel Rab Kha Jum Sab Ahd (Monday-first)
- [ ] Month names Januari … Disember (March = Mac); Western digits
- [ ] Hijri / double mode: "27 Syaaban 1445H" style dates, month names Muharam … Zulhijjah
- [ ] Today cell keeps the dashed border + lavender fill

## Content

- [ ] Library: open 5+ articles (cycle, PCOS, postpartum, one religious) — Malay text, no English/French leakage, related-article titles consistent
- [ ] "Memahami kitaran anda" (UnderstandCycle) shows Malay
- [ ] Pregnancy week screen (weeks 1, 12, 20, 40, 41) — Malay description, lengths with a decimal point ("Kira-kira 25.6 cm")
- [ ] Terms of Use / Privacy Policy show the Malay placeholder sections

## Prayer / spiritual markers

- [ ] Spiritual markers card, Qadha tracker, nifas reminder: wording neutral and consistent with the review checklist

## Notifications

- [ ] A scheduled reminder arrives with a Malay title/body; discreet mode shows the generic Malay body

## Map (Location screen)

- [ ] Search "Kuala Lumpur" / "Johor Bahru": results returned; labels readable (Latin, local names)
- [ ] No tofu / empty labels

## PDF / CSV export

- [ ] Medical PDF: Malay headings, no broken characters; CSV headers in Malay

## Result

- [ ] Date, device model, Android version, build number, tester, issues found
