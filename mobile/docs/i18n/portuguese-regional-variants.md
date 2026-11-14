# Português (Portugal and Brasil) — how the two regional variants are built

AWA's language registry (`AwaAppLanguage`, `state/themePreferences.ts`) had one code per language and no notion of a regional variant. Portuguese needed two readers
who do not use the same words — *Guardar / Salvar*, *ecrã / tela*, *utilizador / usuário*, *ecografia / ultrassonografia*, *pensos higiénicos / absorventes*, *contraceção / contracepção*
— so Portugal and Brazil are **two selectable app languages that share one translation**:

| App language | Code | Selector card | Intl locale | What it reads |
|---|---|---|---|---|
| Português (Portugal) | `pt-PT` | 🇵🇹 *Português (Portugal)* | `pt-PT` | the complete dictionary `locales/ptPT.ts` (European Portuguese, AO90) |
| Português (Brasil) | `pt-BR` | 🇧🇷 *Português (Brasil)* | `pt-BR` | `locales/ptBR.ts` — an **overlay** with only the words, spellings and constructions that differ — over `ptPT.ts` |

Language count: 13 languages before this work, **14** after (Portuguese counted once); the Appearance selector has **15 cards** (nothing else about the sheet changed; there is no “System language” card).

## Dictionary: i18next fallback, no duplication
`i18n/index.ts` registers `'pt-PT': {translation: ptPT}` and `'pt-BR': {translation: ptBR}` with `fallbackLng: {'pt-BR': ['pt-PT', 'en'], default: ['en']}`: a key is looked up in the Brazilian overlay,
then in the Portugal dictionary, then in English; every other language falls back to English exactly as before. The overlay has about 2,200 strings (a third of the dictionary). A **plural family is
always complete in the overlay** (`_one` and `_other` together), because i18next picks the plural form with the rules of the code it is trying: without that, “0 dia(s)” would depend on which half had
been overlaid. Plural rules: `pt-PT` (CLDR): *one* only for exactly 1 (“0 dias”, “1 dia”); `pt-BR` (CLDR `pt`): *one* for the integer part 0 or 1 (“0 dia”, “1 dia”, “2 dias”). The on-device
`Intl.PluralRules` shim (`i18n/pluralRules.ts`) implements both; a test compares it with the engine's own rules for 0–120 and common fractions.

## Articles and pregnancy weeks: one Portugal text + a reviewable overlay
* Every article screen has a complete `'pt-PT'` block (73 of 73, the structure of the English one) and its `const CONTENT` is wrapped: `withBrazilianPortuguese('<Name>', {…} as const)`
  (`i18n/ptBrEditorial.ts`) adds a `'pt-BR'` block = the Portugal block with that article's overlay applied.
* The overlay (`i18n/ptBrEditorialOverlay.ts`, generated) lists, per article and per pregnancy week, **only the strings that differ in Brazil**, by their path inside the block
  (`PT_BR_ARTICLE_OVERLAY.Lochia['comfortTips[2].title']`). A test checks that every path exists in the Portugal block as a string, differs from it, keeps the placeholders and contains no Portugal-only form.
* Pregnancy weeks: `pregnancyWeekData.ts` has a `'pt-PT'` block per week; `getPregnancyWeekData(week, 'pt-BR')` applies `PT_BR_WEEK_OVERLAY[week]`.
* `resolveEditorialLanguage`: `pt`, `pt-PT`, `pt-AO`, `pt-MZ` … → `'pt-PT'`; `pt-BR`, `pt_BR`, `pt-Latn-BR` → `'pt-BR'`; anything else not supported → English.

## Locale detection
`languageFromLocaleTag` decides by region: `pt-BR` (also `pt_BR`, `pt-Latn-BR`, `pt-BR.UTF-8`, `pt-BR-u-…`) → **pt-BR**; Portugal, Angola, Mozambique, Cabo Verde, Guinea-Bissau, São Tomé, Timor-Leste, Macau
and every other region follow the European norm → **pt-PT**. A bare `pt` is ambiguous: it resolves to **pt-PT** (the base text) and is **never silently mapped to Brazil**; a phone that reports Brazilian
Portuguese is never mapped to Portugal. First launch detects once and stores the result; a manual choice persists across restarts; no “System language” option.

## Dates, numbers, maps, PDF
* Dates: `pt-PT` / `pt-BR` Intl (“21 de outubro de 2026” in both), weekdays *Seg Ter Qua Qui Sex Sáb Dom* (single letters S T Q Q S S D), Hijri dates from ICU (“12 de Ramadan de 1447 AH”). Number format is the engine's
  per region (pt-PT groups with a space, pt-BR with a dot; both use the decimal comma); the cycle algorithms are untouched.
* Maps: MapTiler knows **one** Portuguese (`pt`); `pt-PT` / `pt-BR` are answered with HTTP 400. `mapLanguageFor()` reduces both to `pt`. Verified live: *Lisbon → Lisboa, Portugal*, *São Paulo → São Paulo, Brasil*, *London → Grande Londres, Reino Unido*.
* PDF/CSV: Portuguese is Latin text drawn by the standard Helvetica (WinAnsi contains á à â ã é ê í ó ô õ ú ç and ª º): no extra font, no APK growth; the other languages' faces are unchanged.
