# Danish (Dansk) — Manual Android Test Checklist

**Device requirement:** Real Android device (not emulator). Use the Huawei device available for AWA testing per project policy.

## Pre-conditions

1. Build the debug APK with Danish included (see `mobile/android/`)
2. Install on device
3. Go to Settings → Language and select Dansk (da-DK) OR use AWA in-app language switcher

## Language switching

- [ ] AWA Language menu shows "🇩🇰 Dansk" entry
- [ ] Subtitle shows "Brug AWA på dansk"
- [ ] Selecting Danish restarts the app in Danish
- [ ] All main tabs (Accueil → Hjem, Calendrier → Kalender, Statistiques → Statistik, etc.) show Danish labels
- [ ] Back navigation persists Danish setting

## Character rendering (æøå ÆØÅ)

- [ ] æ renders correctly in all text sizes
- [ ] ø renders correctly in all text sizes
- [ ] å renders correctly in all text sizes
- [ ] Capital variants ÆØÅ render correctly
- [ ] No tofu (□) or replacement characters
- [ ] No font fallback producing different visual weight for Danish characters

## Calendar screen

- [ ] Week header shows: Man Tir Ons Tor Fre Lør Søn
- [ ] Month name in Danish (Januar, Februar, Marts, April, Maj, Juni, Juli, August, September, Oktober, November, December)
- [ ] Today cell: dashed border + lavender fill (consistent with other calendars)
- [ ] Day of month numbers use Western digits (0–9)
- [ ] "Dag X" cycle day counter appears correctly

## Cycle ring (HomeScreen)

- [ ] Cycle phase label in Danish (no layout overflow or clipping)
- [ ] Weekday abbreviations render (M T O T F L S)
- [ ] æ/ø fallback to FALLBACK_EM (0.62 em) — visually acceptable, not broken

## Statistics screen

- [ ] Decimal separator is comma (e.g. 28,3 jours → 28,3 dage)
- [ ] Numbers formatted per da-DK locale

## Library / Articles

- [ ] Open at least 3 articles and verify Danish content is shown (not French or English)
- [ ] Share button shows Danish share message
- [ ] Pregnancy weekly article shows Danish week content

## Journal

- [ ] "Journal quotidien" → Danish label
- [ ] Save toast appears with Danish confirmation text
- [ ] Categories shown in Danish

## Notifications (if enabled)

- [ ] Prayer reminder notifications appear in Danish
- [ ] Cycle/ovulation reminder notifications appear in Danish
- [ ] Notification preview respects discreet mode (no health data in pull-down)

## Maps (LocationScreen)

- [ ] Map labels appear in Danish (city names, country names)
- [ ] Geocoder search returns results with Danish place names
- [ ] Non-translated labels fall back gracefully (local name or Latin)

## PDF/CSV export

- [ ] Export PDF headers in Danish
- [ ] Danish special characters (æøå) render in PDF (Helvetica WinAnsi)
- [ ] CSV headers in Danish

## Legal documents

- [ ] Terms of Use opens and shows Danish placeholder text
- [ ] Privacy Policy opens and shows Danish placeholder text
- [ ] No crash or empty screen

## Regression check (other languages)

- [ ] Switch to French → app functions correctly in French
- [ ] Switch to Arabic → app functions correctly in Arabic (RTL layout)
- [ ] Switch back to Danish → still correct

## Result

| Test area | Status | Notes |
|-----------|--------|-------|
| Language switching | | |
| Characters æøå | | |
| Calendar | | |
| Cycle ring | | |
| Articles | | |
| Journal | | |
| Maps | | |
| PDF export | | |
| No regression | | |

**Tester:**
**Date tested:**
**Device model + Android version:**
**AWA build:**
