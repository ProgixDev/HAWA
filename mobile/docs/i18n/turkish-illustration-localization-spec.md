# Turkish localization spec: 4 text-in-image editorial illustrations

Audience: designer. Status: DRAFT. Every Turkish string below is a PROPOSAL that needs native-speaker review
(and, where marked, medical/editorial review) before it is lettered into artwork. Nothing in this document changes
any source file.

Coordinates are in pixels of the shipped artwork (origin top-left), measured on the English variants and read
off the images; treat them as +/- 10 px. Colours are sampled from the darkest lettering pixels (approximate).

## Summary table

| # | Asset base name | Image role | Size (px) | Text elements | Turkish files to deliver | Used by (hero height) |
|---|---|---|---|---|---|---|
| 1 | `cycle-phases-hero` | Linen book cover, title embossed on the cover | 1672 x 941 | 1 (2 lines) | `cycle-phases-hero.tr.webp` | 15+ library articles (cover/hero, 245 dp or 270 dp) + Library "popular" thumbnail 56 x 56 dp |
| 2 | `grossesse_semiane` | Doctor + pregnant woman, headline panel on right | 1774 x 887 | 4 text blocks (title 2 lines, subtitle 2 lines) | `grossesse_semiane.tr.webp` | `PregnancyWeeklyArticleScreen` hero (245 dp) |
| 3 | `activité_grossesse` | Pregnant woman lunge, headline top-left + framed poster | 1774 x 887 | 2 text blocks (title 2 lines, poster 4 lines) | `activité_grossesse.tr.webp` | `PregnancyExerciseArticleScreen` hero (245 dp) |
| 4 | `activité` | Woman lunge, headline top-left + framed poster | 1774 x 887 | 2 text blocks (title 2 lines, poster 3 lines) + "2 KG" on a dumbbell | `activité.tr.webp` | `ExerciseCycleSupportArticleScreen` hero (245 dp) |

Medical content check: none of the four images contains a diagram, number of days, hormone name, phase boundary
or exercise instruction. The lettering is a title/tagline/slogan only. Items that still make a health claim
(slogans) are flagged "NEEDS MEDICAL REVIEW" below. Despite its file name, `cycle-phases-hero` is NOT a cycle-phase
diagram; it is a decorative book cover that says "The body and its cycles".

## 0. Common requirements

### 0.1 Files and naming
- Deliver, for each image, a lossless master PNG and a shipped WebP, both with the SAME pixel size as the other
  variants (table above), RGB, no alpha.
- Master (lossless, outside the bundle): `design-sources/editorial-images/<base>.tr.png`
- Shipped: `src/assets/images/library/<base>.tr.webp`
- Exact base names (note the accented `é`, NFC-normalized, same as the existing files):
  `cycle-phases-hero`, `grossesse_semiane`, `activité_grossesse`, `activité`
  - `cycle-phases-hero.tr.webp`
  - `grossesse_semiane.tr.webp`
  - `activité_grossesse.tr.webp`
  - `activité.tr.webp`
- WebP size budget enforced by tests: more than 50 KB and less than 600 KB per file (existing variants are about
  165-180 KB for 1774 x 887 and about 320 KB for the cover). Export from the tr master and run
  `python scripts/validate-editorial-images.py` (needs `tr` added, see 0.4).
- Do NOT leave a `*.tr.png` in `src/assets/images/library/`. (The stale-PNG test only looks for
  `.en/.fr/.es/.it.png`, but masters belong in `design-sources/`.)
- The French hero originals (`<base>.png` in `src/assets/images/library/`) are the untouched French masters. For
  `activité`, `cycle-phases-hero` and `grossesse_semiane` there is no `.fr.png` in `design-sources`; use the
  English master (same layout) as the base for the Turkish edit. `activité_grossesse` has all four masters.

### 0.2 Typeface
The lettering is raster artwork, apparently generated imagery rather than live fonts, so an exact font identity
cannot be established and no brand font is asserted. Observed styles:
- Cover (image 1): a soft old-style/transitional serif, regular weight, with an embossed (blind-debossed) effect.
- Headlines (images 2-4): TWO styles per headline. A light-weight humanist/geometric sans-serif, sentence case,
  slightly letter-spaced (first line in images 3-4, second line in image 2); and a flowing connected brush/hand
  script, mauve, slightly slanted, that carries the emphasis (first line in image 2, second line in images 3-4).
- Posters and subtitle (images 2-4): small light/medium sans-serif; poster text is ALL CAPS, centred, wide
  tracking.
Requirement: choose open-licence faces that look closest to these and that contain complete Latin Extended-A
(Turkish). Candidates to evaluate (not a claim that they are the originals): a Montserrat/Poppins-like sans, a
Dancing Script-like script, a Lora/Playfair-like serif. VERIFY that the chosen script font draws `ç ğ ı İ ö ş ü
Ç Ğ Ö Ş Ü` correctly (dotted capital `İ`, dotless `ı`, breve on `ğ` not colliding with ascenders). Do not
compose accents by overlaying marks.

### 0.3 Layout and fidelity rules
- Edit only the lettering. Do not alter, redraw, recolour or re-light the illustration; repaint only the
  background pixels uncovered by removing the English text (clone/in-paint from the immediately adjacent
  background; for image 1 reproduce the cover linen weave).
- Keep each text block inside the original bounding box with at least 12 px safe margin; keep alignment (centred
  or left), baseline spacing, colours and contrast of the English version. If Turkish is wider than the box, reduce
  size/tracking uniformly inside the block; never overflow into the illustration.
- Keep decorative elements untouched: heart/ECG icons, divider lines with heart or leaf, ornaments.
- Turkish uppercase rules in all-caps posters: `i` becomes `İ`, `ı` becomes `I`. Never write `I` for `İ`
  (e.g. `BİR`, `ENERJİ`).
- Use the typographic apostrophe if one is ever needed (the English art uses `’`). No Turkish line below needs it.
- Keep Turkish phrasing consistent with the app (`src/i18n/locales/tr.ts`), see terms below.

### 0.4 Cropping safe zones (applies to images 2-4; image 1 is safe)
The heroes render with `resizeMode="cover"`, `width: '100%'`, `height: 245` dp. At 245 dp tall the 1774 x 887 art
is 490 dp wide, so on narrower phones the sides are cropped (centred):

| Phone width (dp) | Visible source px | Cropped each side (source px) |
|---|---|---|
| 320 | x 308 .. 1466 | 308 |
| 360 | x 235 .. 1539 | 235 |
| 393 | x 176 .. 1598 | 176 |
| 412 | x 141 .. 1633 | 141 |

Cover image (1672 x 941): 245 dp tall gives 435 dp wide: at 360 dp visible x 145 .. 1527; at 320 dp x 222 .. 1450.
At 270 dp tall (CyclePhasesArticleScreen) at 360 dp visible x 209 .. 1463.

Overlay buttons: the back circle (40 dp, 16 dp from the left) and the bookmark + share circles (2 x 40 dp, 8 dp
gap, 16 dp from the right) sit on the hero starting at `max(insets.top,16) + 20` dp from the top. For a
status-bar inset of 24-48 dp that is about y 159..391 source px (1774-wide art), over the 58..203 px and
58..377 px strips next to the visible left/right edges. Arithmetic only, not a device screenshot:
- Image 2: the existing English/FR/ES/IT title (x 1231..1658, y 212..358) already extends beyond the 360 dp
  visible edge (x 1539) and its first line sits under the bookmark/share circles (x about 1162..1481). This is a
  PRE-EXISTING issue shared by all four languages. Turkish should at least not be wider than the English block;
  the designer should preferably also keep the block within x <= 1535 (re-set the panel text slightly left, within
  the pale rounded panel, which spans about x 1195..1774) so it is fully visible at 360 dp. This moves text only,
  never the illustration. Product to confirm.
- Images 3-4: the left block sits next to the back circle (visible-left + 58..203 px). Keep Turkish no wider than
  English so it does not creep further left.
Please confirm on a 360 x 800 and a 412 x 915 emulator after integration.

### 0.5 Turkish terminology already in `tr.ts` (reuse)
Adet (period), Adet döngüsü / Döngü (cycle), Yumurtlama (ovulation), Doğurganlık dönemi (fertile window),
Gebelik (pregnancy; "Gebelik takibi", "Gebelik kontrol takvimi"), Doğum sonrası (postpartum), Tıbbi takip
(`medicalFollowUpLabel`), "Gebelikte aktif kalmak" (article title of the pregnancy exercise article),
"Döngünü desteklemek için hareket etmek" (title of the cycle exercise article), "İyi hissetmek için hareket et ✦"
(existing Turkish hero title for the same slogan as image 4, `tr.ts` line 494), Enerji, Denge/dengeni,
Beden/Bedenin (app uses "Bedenin" for body; "Vücut" also appears), anne (e.g. "anne sütü"), bebeğin, "iyi oluşu".
Register: informal second person ("sen") is used across the app; the slogans below are impersonal or
imperative "-et".

---

## 1. `cycle-phases-hero` (book cover)

### Files (all four existing variants, `src/assets/images/library/`)
- `cycle-phases-hero.fr.webp` : "Le corps / et ses cycles"
- `cycle-phases-hero.en.webp` : "The body / and its cycles"
- `cycle-phases-hero.es.webp` : "El cuerpo / y sus ciclos"
- `cycle-phases-hero.it.webp` : "Il corpo / e i suoi cicli"
- Also present: `cycle-phases-hero.png` (French master/original), masters in
  `design-sources/editorial-images/cycle-phases-hero.{en,es,it}.png`.
- Dimensions: 1672 x 941 px (aspect 1.777) for every variant. FR/ES/IT confirmed to share the identical layout;
  only the embossed title differs.

### Text elements (English, verbatim)
| # | Text | Position | Style | Count |
|---|---|---|---|---|
| 1a | `The body` | centre of the book cover, line 1; box about x 762..940, y 400..440 | serif, regular, about 40 px line height (x-height about 20 px), blind-embossed tone-on-tone (lighter than the linen, `#D0C2AC`-ish ground, soft highlight/shadow), centred | 8 |
| 1b | `and its cycles` | line 2 of the same block; about x 738..968, y 455..490 | same | 14 |

Full title string: `The body and its cycles` (23 characters), 2 lines, centred horizontally on the book cover
(cover spans about x 628..1062, y 183..862).

- Inside a banner/box: no; the text is on the book cover itself (embossed).
- Purely illustrative, do not change: vases, dried flowers, candle, linen, light, the book (spine, cloth texture).

### Where used
`CyclePhasesArticleScreen` (hero, 270 dp), and via `CYCLE_PHASES_HERO` as hero/thumbnail in:
FirstPeriod*/FertilityWindow/PcosSkinHair/Patch/RamadanFasting/HormonalTreatmentsPanorama/FiqhWomenIntro article
screens (hero 245 dp, cover crop) and `LibraryScreen` POPULAR list (56 x 56 dp square thumbnail, cover crop of
the centre 941 x 941 px: title is at the centre but only about 14 dp wide, effectively decorative there).
Title block (x 738..968) is inside every safe zone; it is not covered by the overlay buttons at any phone width.
No accessibility label is attached (decorative); `EDITORIAL_IMAGE_ALT` has no entry for this image.

### Turkish proposal (needs native-speaker review; not medical)
| # | English | Turkish proposal | Chars EN -> TR | Note |
|---|---|---|---|---|
| 1a | The body | `Beden` | 8 -> 5 | |
| 1b | and its cycles | `ve döngüleri` | 14 -> 12 | uses "döngü" |

Full: `Beden ve döngüleri` (18 vs 23, shorter). No line is more than 15% longer. Alternative if the owner prefers
second person: `Bedenin ve döngülerin` (21; 1a `Bedenin` 7, 1b `ve döngülerin` 13). Keep the same
2-line break, centred, embossed effect re-created on the same cover position, no other change to the cover.

---

## 2. `grossesse_semiane` (medical follow-up during pregnancy)

### Files
- `grossesse_semiane.fr.webp` : "Suivi médical / pendant la grossesse" + "Pour la santé de maman / et le bien-être de bébé"
- `grossesse_semiane.en.webp`
- `grossesse_semiane.es.webp` : "Control médico / durante el embarazo" + "Por la salud de mamá / y el bienestar del bebé"
- `grossesse_semiane.it.webp` : "Controlli medici / in gravidanza" + "Per la salute della mamma / e il benessere del bambino"
- Also: `grossesse_semiane.png` (French original), masters `design-sources/editorial-images/grossesse_semiane.{en,es,it}.png`.
- Dimensions: 1774 x 887 px (aspect 2.0) for every variant. FR/ES/IT confirmed to share the identical layout
  (pale rounded panel at right with icon, two-style title, divider with heart, two-line subtitle).

### Text elements (English, verbatim)
Panel is a pale blush rounded shape on the right (about x 1195..1774, y 20..560) over the window; all text is
centred on x about 1445.

| # | Text | Position (px) | Style | Count |
|---|---|---|---|---|
| 2a | `Medical care` | top of panel, x 1231..1658, y 212..285 | brush script, mauve `#9F5A66`-ish, large (about 75 px line height), centred | 12 |
| 2b | `during pregnancy` | x 1251..1655, y 317..358 | light sans, mauve `#A86771`, about 40 px cap-to-descender, centred | 16 |
| 2c | `For mom’s health` | subtitle line 1, x 1321..1573, y 450..475 | small sans, `#9C7275`, about 22 px, centred; uses a curly apostrophe | 16 |
| 2d | `and baby’s well-being` | subtitle line 2, x 1321..1573, y 480..504 | same | 21 |

Full title (2a+2b): `Medical care during pregnancy` (29). Full subtitle (2c+2d): `For mom’s health and baby’s
well-being` (38). Not boxed or arced; text sits directly on the panel, separated by a thin line + small heart
divider (x 1246..1651, y 385..412).

Purely illustrative, do not change: heart-with-ECG icon (x 1386..1478, y 108..192; contains no letters),
divider line and heart, panel shape, both women, ultrasound monitor (screen shows an image, no readable text),
framed picture, plants, pen holder.

### Where used
`PregnancyWeeklyArticleScreen` (article `pregnancy-semaine-par-semaine`): hero 245 dp, `cover`, with
`accessibilityLabel` from `EDITORIAL_IMAGE_ALT.pregnancyFollowUp[lang]`. Safe zones: see 0.4 (title extends
past the 360 dp visible edge and under the share/bookmark buttons; pre-existing, same for FR/EN/ES/IT).

### Turkish proposal
Terms from `tr.ts`: "Tıbbi takip", "Gebelik", "Gebelik kontrol takvimi" (article `medicalexams-suivi-medical`),
"iyi oluş".

| # | English | Turkish proposal (primary) | Chars EN -> TR | Flag |
|---|---|---|---|---|
| 2a (script) | Medical care | `Tıbbi takip` | 12 -> 11 | NEEDS MEDICAL REVIEW: "care" rendered as "takip" (follow-up/monitoring), as in the app's `medicalFollowUpLabel`; "bakım" would mean nursing/personal care and shifts the meaning |
| 2b (sans) | during pregnancy | `gebelik boyunca` | 16 -> 15 | |
| 2c | For mom’s health | `Annenin sağlığı ve` | 16 -> 18 (+12.5%) | within 15% |
| 2d | and baby’s well-being | `bebeğin iyi oluşu için` | 21 -> 22 (+4.8%) | |

Full title: `Tıbbi takip gebelik boyunca` (27). Full subtitle: `Annenin sağlığı ve bebeğin iyi oluşu
için` (40 vs 38, +5%). The English line break puts "and" at the start of line 2; the Turkish primary moves the
conjunction "ve" to the end of line 1, which reads naturally and balances widths.
Alternative title split (second option): 2a `Gebelikte` (9, script) / 2b `tıbbi takip` (11, sans) = "Gebelikte
tıbbi takip" (21 chars). Alternative subtitle if 2c is too wide: `Anne ve bebeğin` (15) / `sağlığı için` (12), but
this drops the "well-being" notion; use only if the longer version does not fit.
Keep script style for 2a and sans for 2b, the divider and heart untouched.

---

## 3. `activité_grossesse` (exercise during pregnancy)

### Files
- `activité_grossesse.fr.webp` : "Bouger pour / une grossesse en santé" ; poster "UNE MAMAN / EN BONNE SANTÉ / POUR UN BÉBÉ / ÉPANOUI"
- `activité_grossesse.en.webp`
- `activité_grossesse.es.webp` : "Muévete por / un embarazo saludable" ; poster "UNA MAMÁ EN / BUENA SALUD / PARA UN BEBÉ / FELIZ"
- `activité_grossesse.it.webp` : "Muoviti per / una gravidanza in salute" ; poster "UNA MAMMA / IN SALUTE / PER UN BAMBINO / SERENO"
- Also: `activité_grossesse.png` (French original) and masters `design-sources/editorial-images/activité_grossesse.{en,es,fr,it}.png`.
- Dimensions: 1774 x 887 px for every variant. FR/ES/IT confirmed identical layout; only the poster line breaks
  differ slightly.

### Text elements (English, verbatim)
| # | Text | Position (px) | Style | Count |
|---|---|---|---|---|
| 3a | `Move for` | headline line 1, x 437..607, y 236..274 | light sans, mauve `#B9766C`-ish, centred above the script line, about 38 px line height | 8 |
| 3b | `a healthy pregnancy` | headline line 2, x 301..782, y 275..347 | brush script, same mauve, about 70 px line height (descenders on `y`, `p`, `g`), centred | 19 |
| 3c | `A MOM IN` | poster line 1, within x about 1520..1650, y about 605..620 | small sans, ALL CAPS, `#B17960`-ish, centred, wide tracking | 8 |
| 3d | `GOOD HEALTH` | poster line 2, y about 630..648 | same | 11 |
| 3e | `FOR A THRIVING` | poster line 3, y about 655..670 | same | 14 |
| 3f | `BABY` | poster line 4, y about 678..692 | same | 4 |

Full headline: `Move for a healthy pregnancy` (28). Full poster: `A MOM IN GOOD HEALTH FOR A
THRIVING BABY` (40 characters, 4 lines). The poster is a framed print (a rectangular picture frame leaning on a
shelf, about x 1485..1685, y 565..762) with a small heart under the text. The headline has a leaf-ended divider
(x 422..640, y 365..399) beneath it.

Purely illustrative, do not change: heart + baby-silhouette icon (x 464..583, y 116..220; no letters), divider,
woman, mat, bottle, dumbbell (the heart on the dumbbell has no text), plants, candle, books, framed print
border and heart.

### Where used
`PregnancyExerciseArticleScreen` (article `exercise-bouger-enceinte`): hero 245 dp, `cover`, with
`accessibilityLabel` from `EDITORIAL_IMAGE_ALT.pregnancyExercise[lang]`. Headline block x 301..782: left edge is
at or beside the visible-left edge on narrow phones (visible-left 308 at 320 dp, 235 at 360 dp) and right next
to the back button zone (see 0.4). The poster text (x about 1520..1650) lies mostly beyond the visible right edge at 360 dp (x 1539) and
is largely cropped on 320-360 dp phones; this is PRE-EXISTING and the same for FR/ES/IT. Keep the Turkish poster
text no wider than English.

### Turkish proposal
| # | English | Turkish proposal (primary) | Chars EN -> TR | Flag |
|---|---|---|---|---|
| 3a (sans) | Move for | `Hareket et` | 8 -> 10 (+25%) | longer than 15%; shorter alternative below |
| 3b (script) | a healthy pregnancy | `sağlıklı gebelik için` | 19 -> 21 (+10.5%) | |
| 3c | A MOM IN | `SAĞLIKLI` | 8 -> 8 | NEEDS MEDICAL REVIEW (health-claim slogan) |
| 3d | GOOD HEALTH | `BİR ANNE` | 11 -> 8 | |
| 3e | FOR A THRIVING | `MUTLU BİR` | 14 -> 9 | "thriving" is ambiguous; ES uses "feliz" (happy), IT "sereno", FR "épanoui"; "mutlu" follows ES. Alternative "SAĞLIKLA BÜYÜYEN" (17) is accurate but too long for the frame |
| 3f | BABY | `BEBEK İÇİN` | 4 -> 10 | |

Full headline: `Hareket et sağlıklı gebelik için` (31 vs 28, +10.7%). Full poster: `SAĞLIKLI BİR ANNE MUTLU BİR BEBEK
İÇİN` (36 vs 40, shorter).
- 3a is 25% longer than English. Shorter: `Hareket et` is already the minimal imperative; if it still does not
  fit in the original block (it is only 25 px wider), reduce tracking; do not move the script line.
  Alternative with natural word order: line 1 (sans) `Sağlıklı bir gebelik için` (25) + line 2 (script)
  `hareket et` (10); this changes which words carry the script emphasis and breaks the +15% rule on the sans
  line; use only if the designer prefers it.
- Poster in Turkish is 4 lines like English. Original wording has no comma; keep none.
- Capitals: `BİR` with dotted İ; `SAĞLIKLI` with Ğ and dotless I.
Mark 3c-3f NEEDS MEDICAL REVIEW only in the sense that the claim "healthy mother, happy baby" must not be read
as a promise; final wording by the product/medical owner.

---

## 4. `activité` (exercise, general)

### Files
- `activité.fr.webp` : "Bouger pour / se sentir bien" ; poster "CORPS / ÉQUILIBRE / ÉNERGIE"
- `activité.en.webp`
- `activité.es.webp` : "Muévete para / sentirte bien" ; poster "CUERPO / EQUILIBRIO / ENERGÍA"
- `activité.it.webp` : "Muoviti per / sentirti bene" ; poster "CORPO / EQUILIBRIO / ENERGIA"
- Also: `activité.png` (French original), masters `design-sources/editorial-images/activité.{en,es,it}.png`.
- Dimensions: 1774 x 887 px for every variant. FR/ES/IT confirmed identical layout.

### Text elements (English, verbatim)
| # | Text | Position (px) | Style | Count |
|---|---|---|---|---|
| 4a | `Move to` | headline line 1, x 422..541, y 226..246 | light sans, mauve `#B77D73`-ish, centred, about 28 px line height | 7 |
| 4b | `feel good` | headline line 2, x 385..578, y 256..322 | brush script, mauve, about 60 px line height | 9 |
| 4c | `BODY` | poster line 1, x about 1507..1555, y about 625..642 | small sans, ALL CAPS, `#B37B69`-ish, centred, tracking | 4 |
| 4d | `BALANCE` | poster line 2, y about 656..675 | same | 7 |
| 4e | `ENERGY` | poster line 3, y about 686..705 | same | 6 |
| 4f | `2 KG` | printed on the front dumbbell weight, about x 285..325, y 790..805 (very small) | tiny sans, embossed on the weight | 4 |

Full headline: `Move to feel good` (17). Poster: `BODY BALANCE ENERGY` (19, 3 lines). The poster sits in a
framed print (about x 1440..1620, y 570..775) with a small heart under the text; the headline has a
leaf-ended divider (x 412..591, y 337..368).

Language-neutral, DO NOT CHANGE: `2 KG` (the Turkish unit is also "kg"; the weight label stays), heart + ECG
icon (x 436..528, y 122..205), divider, framed print border and heart, everything else.

### Where used
`ExerciseCycleSupportArticleScreen` (article `exercise-bouger-pour-le-cycle`): hero 245 dp, `cover`, with
`accessibilityLabel` from `EDITORIAL_IMAGE_ALT.exercise[lang]`. Headline block x 385..578 sits exactly where the
back circle (visible-left + 58..203 px, i.e. x 293..438 at 360 dp) overlays; pre-existing for all languages.
Poster (x about 1505..1580) is inside the visible area for 360 dp and wider (<= 1539 at 360 dp; at 320 dp the
visible right edge is 1466, so the poster is cropped, pre-existing).

### Turkish proposal
| # | English | Turkish proposal (primary) | Chars EN -> TR | Flag |
|---|---|---|---|---|
| 4a (sans) | Move to | `İyi hissetmek için` | 7 -> 18 (+157%) | longer than 15%; shorter alternative below |
| 4b (script) | feel good | `hareket et` | 9 -> 10 (+11%) | |
| 4c | BODY | `BEDEN` | 4 -> 5 (+25%) | within 1 character, the poster box has room |
| 4d | BALANCE | `DENGE` | 7 -> 5 | |
| 4e | ENERGY | `ENERJİ` | 6 -> 6 | dotted İ |

Primary full headline: `İyi hissetmek için hareket et` (29 vs 17); this is exactly the app's existing Turkish
hero title ("İyi hissetmek için hareket et ✦", `tr.ts` line 494) so the picture and the screen copy match, but
4a will be about 2.5x wider than the English 4a (about 17 px/char x 18 = 306 px) and must be re-set in the
original block (centred on x 480, within x 330..630; do not let it run into the plant leaves left of x 270 or
under the heart icon above). Preferred shorter alternative that keeps the hierarchy and box width:
4a `Hareket et,` (11, +57%) / 4b `iyi hisset` (10, +11%) = "Hareket et, iyi hisset" (21 vs 17, +24% overall).
Both options need native review; the primary has the benefit of identical wording to the in-app title.
Poster: `BEDEN / DENGE / ENERJİ`. NOTE: Turkish uses "Beden" in the app; "Vücut" would also be valid; "Beden" is
used for consistency with the app tagline. Not medical content; no medical review needed.

---

## 5. Code wiring (to be done by a developer after the files exist; NOT done here)

### 5.1 `src/i18n/editorialImages.ts`
Add a `tr` entry to each set (the static `require()` form must be kept; the test forbids dynamic paths):

```ts
export const CYCLE_PHASES_HERO: LocalizedImageSet = {
  fr: require('../assets/images/library/cycle-phases-hero.fr.webp'),
  en: require('../assets/images/library/cycle-phases-hero.en.webp'),
  es: require('../assets/images/library/cycle-phases-hero.es.webp'),
  it: require('../assets/images/library/cycle-phases-hero.it.webp'),
  tr: require('../assets/images/library/cycle-phases-hero.tr.webp'),
};
// same for PREGNANCY_FOLLOW_UP_HERO (grossesse_semiane.tr.webp),
// PREGNANCY_EXERCISE_HERO (activité_grossesse.tr.webp), EXERCISE_HERO (activité.tr.webp)
```

- `EDITORIAL_IMAGES_MISSING_TURKISH` filters on `tr === undefined`, so it empties itself as each `tr` entry is
  added; no manual removal of names is required (the array literal of `[name, set]` pairs can stay).
  Once all four exist it becomes `[]`; the constant and its pins may then be removed.
- Update the header comment (lines 10-16) which says no Turkish variant exists.
- `EDITORIAL_IMAGE_ALT.*.tr` currently says "Görseldeki yazı İngilizcedir: ...". Replace per image once the
  artwork is Turkish (proposals; keep the `Illüstrasyon:` prefix the tests match, but note that standard
  Turkish spelling is `İllüstrasyon` with a dotted capital: native reviewer to decide, then update the test regex):
  - pregnancyFollowUp: `Illüstrasyon: Ultrason eşliğinde kontrol sırasında bir doktor ve hamile bir kadın. Yazı: Tıbbi takip gebelik boyunca, annenin sağlığı ve bebeğin iyi oluşu için.`
  - pregnancyExercise: `Illüstrasyon: Yoga matı üzerinde hamle pozunda esneyen hamile bir kadın. Yazı: Hareket et, sağlıklı gebelik için. Poster: sağlıklı bir anne, mutlu bir bebek için.`
  - exercise: `Illüstrasyon: Yoga matı üzerinde hamle pozunda esneyen bir kadın. Yazı: İyi hissetmek için hareket et. Poster: beden, denge, enerji.`
  The alt text must always describe what the picture actually shows (if only some images ship, update only those).

### 5.2 Tests and tooling that pin the current state (must change together)
- `src/i18n/__tests__/PhaseTurkishLocalization.test.ts`, describe `text-in-image illustrations` (about lines
  526-566):
  - `Turkish has no artwork of its own yet, resolves explicitly to ENGLISH...`: asserts
    `hasLocalizedEditorialImage(set,'tr') === false`, `resolveEditorialImage(set,'tr') === set.en` and
    `[...EDITORIAL_IMAGES_MISSING_TURKISH].sort()` equals the four base names. Change to
    `hasLocalizedEditorialImage === true`, `resolve === set.tr`, and `EDITORIAL_IMAGES_MISSING_TURKISH` equal to
    `[]` (or only the names still missing if shipping partially).
  - the "French, English, Spanish and Italian still resolve to their own artwork" test is unaffected.
  - the alt test requiring `/^Illüstrasyon:/` and `toContain('İngilizce')` must drop the `İngilizce` assertion
    for each image whose artwork is now Turkish.
- `src/screens/__tests__/PhaseEditorialImageLocalization.test.tsx`: `LANGS = ['fr','en','es','it']`, expects
  `requires` to have length 16 (lines about 129-146) and the shipped sets' keys to equal `['en','es','fr','it']`
  (line about 181). Update to 20 requires and include `'tr'` (file size 50-600 KB, exact pixel size,
  distinct digest per language, total < 5 MB: 20 files at about 0.2 MB is about 4.0 MB, close to the 5 MB cap;
  check the total).
- `scripts/validate-editorial-images.py`: add `'tr'` to `LANGS` and a `tr` master
  (`design-sources/editorial-images/<base>.tr.png`); update the lettering regions in `TEXT` if the Turkish
  block geometry differs; update the "16" in the docstring/messages.
- `src/screens/__tests__/PhaseItalianEditorial.test.tsx` only scans `require()` targets; no change expected.

### 5.3 Fallback behaviour (unchanged)
Until a `tr` entry exists the resolver returns the English variant (`image[resolved] ?? image.en`), never FR/ES/IT.
Each set is independent, so the four images can ship one at a time.

---

## 6. Open points for the product owner
1. Image 2 title/panel text is partly outside the 360 dp visible area and under the overlay buttons in every
   language today; decide whether the Turkish edit may re-set the text within the panel (recommended) or must
   keep the exact original position.
2. "Tıbbi takip" for "Medical care" (image 2) and the slogan wording for "thriving baby" (image 3): medical /
   editorial sign-off.
3. Whether the cover should use impersonal ("Beden ve döngüleri") or second person ("Bedenin ve döngülerin").
4. Spelling of the alt-text prefix: `Illüstrasyon` (current) vs `İllüstrasyon`.
5. All Turkish text above: native-speaker review before lettering.
