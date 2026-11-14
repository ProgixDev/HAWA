# বাংলা (Bengali) — Android visual-validation plan (before the next client Release APK)

Status: PLAN ONLY. Nothing here builds, installs or runs anything. It narrows `bengali-manual-android-test-checklist.md` (the full list) to what is most likely to reveal a defect, in priority order, and says what a pass and a failure look like. Production code changes only for a **reproducible** defect (see "Reporting").

## 0. Ground rules

* **Device:** an isolated test phone (not the user's Huawei BUEQY19527041001; no emulator). Any use of a device that is not a throw-away one needs the owner's per-action approval first. Preferred: a Samsung Galaxy A13-class phone plus one large phone; a Xiaomi/Redmi if available (common in Bangladesh).
* **Build under test:** the Release APK the team builds next; this plan does not build it. Signing is untouched.
* **Setup A (fresh):** phone language বাংলা (বাংলাদেশ), fresh install → AWA must start in Bengali. **Setup B:** phone in English, AWA switched to Bengali in Appearance. **Setup C (once):** phone language Hindi, AWA in Bengali (the Devanagari fallback must not leak).
* **Evidence:** one screenshot per screen, taken at the stated font scale, with the status bar visible; for PDFs a screenshot at 300 % zoom of the stated region. Screenshots are enough for every visual check below; only notifications, keyboard, TalkBack and the live map need the device in hand.
* **Known, accepted behaviours (not defects):** map labels are Latin (section 4); `উন্মুক্ত` may show one u-kar mark slightly off in a PDF (section 5); Bengali text in the PDF may not be selectable/searchable; the Hijri line uses composed month names.

## Priority P0 — block the release if these fail

| # | Check | Expected result | Evidence | A failure is |
|---|---|---|---|---|
| P0-1 | **Conjuncts and vowel signs** on Home, Calendar, Journal, Library, Premium, Onboarding. Look at: ন্ধ ক্ষ জ্ঞ স্থ ন্ত ত্র ব্য ক্র শ্র; vowel signs ি ী ু ূ ে ৈ ো ৌ; reph র্ম; ঁ ং ঃ | every conjunct is one joined glyph (no visible hasanta between letters); vowel signs sit on their consonant (ি/ে/ৈ before it, ু/ূ below, া after); matra line continuous; no □ boxes; no Devanagari-looking letters | screenshot with the word circled, plus the exact string | a boxed/unjoined/overlapping glyph, a vowel sign detached or on the wrong letter, a broken matra line |
| P0-2 | **Cycle ring** (Home, 116 dp; partner view 100 dp) for each phase: মাসিক পর্যায়, ফলিকুলার পর্যায়, উর্বর সময়, ডিম্বস্ফোটন, লিউটিয়াল পর্যায়; caption « চক্রের দিন » | caption, number and phase name stay fully inside the white disc on a 320 dp and a 412 dp phone; nothing clipped at top/bottom (Bengali is ~1.4× tall); no word cut | screenshot of each phase (use a date that yields each phase, or the demo profile) | any glyph touching/crossing the disc edge, clipped marks, a name wrapped to 3 lines |
| P0-3 | **Daughter Mood title** (daughter profile → Mood), names: short, long (e.g. « নুসরাত জাহান »), longest you can type | one line at 20 sp, or one smaller line, or two lines at 16 sp; never an ellipsis, never overlapping the back/save buttons | screenshot at normal and largest font scale | cut text, overlap with a button, a 3rd line |
| P0-4 | **Largest font scale** (Settings → Display → Font size *and* Display size at maximum) on Home, Calendar, Journal sheet, Library tabs, Profile, Appearance, Premium, a modal with 2 buttons | no clipped or overlapping Bengali, every button reachable above the navigation bar, scrolls where needed | screenshot per screen at max scale | clipped marks above/below a line, a CTA hidden, overlapping texts |
| P0-5 | **Language selection & persistence** (Setups A/B) | 16 cards, « বাংলা » card 🇧🇩 « AWA বাংলায় ব্যবহার করুন »; no « System » card; persists after restart; changing the phone language afterwards does not change AWA | 2 screenshots + note | wrong start language, flash of English, lost choice |

## Priority P1 — fix before the Release APK if possible

| # | Check | Expected result | Evidence | A failure is |
|---|---|---|---|---|
| P1-1 | **PDF at 300 % zoom.** Export the medical PDF in Bengali, open in the phone's PDF viewer and Google Drive. Zoom 300 % on: a heading, « ট্র্যাকিং », « স্বাস্থ্য », « রক্তক্ষরণ », « ভ্রূণ », « স্ক্রিনিং » (the PDF shaping was verified against HarfBuzz on a desktop render, not in these viewers) | glyphs match the in-app text; conjuncts joined; marks (ra-phala, u-kar, chandrabindu ঁ) on the right letter; bold headings bold; spaces between words; lines wrap at spaces; no text past the right margin; page breaks clean; a Latin word/number (AWA, 36.7 °C) sits normally in the line | screenshot of each zoomed region + the PDF file | a mark displaced or overlapping the next word, a visible hasanta, □ or « […] » for everyday text, text beyond the margin |
| P1-2 | **User-entered Bengali in a PDF**: type a note (with Gboard and with Avro/Ridmik) containing conjuncts and a very long unspaced word; export | typed text appears exactly as typed; the long word breaks between syllables, never inside one, never off the page | PDF screenshots + the typed string | a changed or missing letter, a syllable cut in two |
| P1-3 | **Map and search** (Location screen, onboarding location) in Bengali | labels on the map are **Latin** (expected: MapLibre cannot shape Bengali) with no □ and no broken Bengali; the default shows « Greater London, যুক্তরাজ্য »-style text, the map does not move; switching the language does not move the camera; search « ঢাকা », « কলকাতা », « Dhaka » returns Bengali addresses in the list (shaped by Android) and selecting one stores the same coordinates; offline, the saved place still shows | screenshots of map, search list, selected card | Bengali glyphs drawn unshaped on the map (that would mean the fallback is not applied), boxes, the camera jumping, a Bengali list entry with broken conjuncts |
| P1-4 | **Notifications**: grant permission; create a vitamin reminder, an appointment (own titles in Bengali), a cycle reminder; also discreet mode | title/body in Bengali, conjuncts joined in the shade and lock screen; the user's own text unchanged; discreet mode shows the generic Bengali text; channel names in Android settings are Bengali; after switching language to Bengali existing reminders are rebuilt in Bengali and still fire after a phone restart | screenshot of the shade, lock screen and channel settings | English text, a changed user title, a broken glyph in the system notification font, a reminder that no longer fires |
| P1-5 | **Keyboard input**: Gboard Bengali, Avro Phonetic, Ridmik. Fields: name, journal note, search, daughter name, delete-confirmation word « মুছুন » | composition underline and cursor behave; after a conjunct the cursor is not inside it; no duplicated vowel sign; the typed text is stored and re-displayed identically; « মুছুন » typed on each keyboard is accepted (all spellings fold to the same word) | screen recording or screenshots + keyboard name/version | lost/duplicated character, cursor jump, the confirmation word rejected |
| P1-6 | **TalkBack** (Bengali TTS voice installed): Home + ring, a calendar cell, the language cards, a journal chip, the Library tabs | each control read once, in Bengali, as words (not letter by letter, not as Latin); the ring reads day number + phase; the Hijri line and numbers read as one phrase | short audio/screen recording + notes on what was heard | letter-by-letter reading, silence, English reading of a Bengali label, focus order that skips a control |

## Priority P2 — confirm, low risk

| # | Check | Expected result | A failure is |
|---|---|---|---|
| P2-1 | Dates: « 21 অক্টোবর, 2026 » (Intl puts a comma), Latin digits everywhere, weekdays সোম…রবি, calendar header one-letter forms সো ম বু বৃ শু শ র; Hijri « 12 রমজান 1447 হিজরি » | no Bengali digits, no « AH », no numeric month | a numeric Hijri month, Bengali digits |
| P2-2 | Counters read right: « 0 দিন », « 1 দিন », « 2 দিন » | same wording for every number | a raw `{{count}}` |
| P2-3 | Library tabs on one line (strip scrolls if needed); long article paragraphs wrap at spaces without a one-syllable last line; the 4 illustrations still carry English lettering and the alt text says so | as described | broken tabs, a word cut mid-syllable |
| P2-4 | Themes: Light, Dark, True Black, six palettes, Bengali palette names | no contrast/clipping change | clipped palette names |
| P2-5 | Welcome lockup « স্বাগতম / AWA », discreet launcher text « এজেন্ডা » | reads naturally | an empty gap in the lockup |
| P2-6 | Other languages unchanged: one French and one Hindi screen, and a French/Hindi PDF | identical to before | any change |

## Reporting a failure

One report per defect, in this form (screenshot attached):

```
ID: P0-2
Device / Android / One UI-EMUI-MIUI: …
Phone language / AWA language / font scale / display size / theme / palette: …
Screen + steps (≤ 5): …
Expected: … (from this plan)
Actual: … (what is wrong, which glyph/word)
Exact string (copy-paste) and its key if shown in the screenshot: …
Reproducible? always / sometimes / once — on a second launch? on a second device?
Severity: blocks release / should fix / cosmetic
```

Triage rule: a defect is **reproducible** when it appears twice on the same build; only then does it go to engineering. Wording problems (term choice, register) are **not** code defects: they go to `bengali-review-checklist.md`. A defect in the three *accepted behaviours* above is logged, not fixed.

## What is already covered without a device (do not repeat)

Key parity, placeholders, plurals, detection and persistence, dashboards for every objective incl. Daughter and Profile, notifications (scheduler level), map-language rewriting and request language, ring/Daughter width fitting on shaped widths, typography rules, PDF glyph-for-glyph shaping against HarfBuzz for 4,400 / 4,401 words (Regular and Bold) with PNG comparison of the previously broken words, CSV round trip.

## Remaining known exceptions, and what to expect

* **PDF shaping exception — `উন্মুক্ত`:** HarfBuzz places one u-kar mark 172 font units (≈ 1.7 pt at 10 pt) from where our PDF puts it. Expect that single word to look slightly different (mark closer to its base). It is one word in the 4,401 the app contains; if the team wants it fixed, it is a separate, deliberate change in `fontkitOpenTypeFixes.ts`, re-verified against HarfBuzz — not part of this validation.
* **Unverified PDF behaviour:** real viewers (Google PDF Viewer, Samsung, Petal) were not available; P1-1 is the first look at them. Selecting/searching Bengali text in the PDF is not guaranteed; CSV is the lossless export.
* **MapLibre Latin-label fallback:** by design the map shows Latin names (`name:latin` → `name:en` → local name) because MapLibre Native has no complex-script shaping. Expected, not a defect. The same limitation probably affects Hindi map labels (unverified, untouched).
