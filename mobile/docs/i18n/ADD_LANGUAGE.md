# AWA — Add a New Language

**Reference language:** the most recently added one (currently `da`/Danish — see `src/i18n/locales/da.ts`).

---

## 1. Pre-flight (run once, read nothing twice)

```bash
node scripts/check-language-parity.js <code>   # key count + placeholder report
```

---

## 2. Registry touch-points (copy the `bn`/`da` pattern exactly)

| File | What to add |
|------|------------|
| `src/state/themePreferences.ts` | `\| '<code>'` to `AwaAppLanguage`; alias set `XX_ALIASES`; `normalizeAppLanguage` branch |
| `src/i18n/index.ts` | `import {xx} from './locales/xx'` + resource entry |
| `src/i18n/editorialLanguage.ts` | `EditorialLanguage` type + resolver branch + return list |
| `src/screens/AppearanceScreen.tsx` | `LANGUAGE_SELF_LABELS`, `LANGUAGE_NAME_KEYS`, `LANGUAGE_OPTIONS` |
| `src/screens/PersonalInformationScreen.tsx` | ternary branch |
| `src/screens/LegalDocumentScreen.tsx` | `LegalLanguage` type + `TERMS`/`PRIVACY` placeholder blocks + resolver |
| `src/utils/cycleMath.ts` | `WEEK_DAYS_XX`, `localizedWeekDays`, `dateFormatLocale` |
| `src/screens/CycleInformationScreen.tsx` | single-letter weekday array + branch |
| `src/screens/pregnancy/PregnancyMedicalInformationScreen.tsx` | same |
| `src/services/maps/mapLanguage.ts` | append to `MAP_LANGUAGES` (omit if script is unsupported — add to `NON_LATIN_SCRIPT` or `UNSHAPED_SCRIPT` if needed) |
| `src/i18n/editorialImages.ts` | `LocalizedImageSet.xx?` field + missing-images export + alt texts |

### Script-automatable steps
```bash
node scripts/register-language.js <code> <NativeName> <flag> <locale> <weekdays-3letter> <weekdays-1letter>
```
This patches `themePreferences.ts`, `index.ts`, `editorialLanguage.ts`, `AppearanceScreen.tsx`, `cycleMath.ts`, and `LegalDocumentScreen.tsx`. Review the diff before proceeding.

---

## 3. Dictionary (`src/i18n/locales/<code>.ts`)

- Mirror `en.ts` exactly: same keys, same placeholders, real translations only.
- Add `<language>Name: '<NativeName>'` after the preceding language's `Name` entry.
- Plural forms: check CLDR for the language; most need only `_one`/`_other`. Russian needs `_few`/`_many` too.
- Verify: `node scripts/check-language-parity.js <code>` → 0 errors.

---

## 4. Articles (73 files) and pregnancy weeks (41 entries)

Each article screen has a `CONTENT = withBrazilianPortuguese('Name', {...})` object.  
Add `<code>:` block after the last existing language block (currently `bn:`), before `} as const)`.  
Update the language-selector expression inside the component: add `i18n.language === '<code>' ? '<code>' :` before the final `'fr'` fallback.

`pregnancyWeekData.ts`: add a `<code>:` block to every week entry.

Process in batches of ≤ 15 files per agent call to stay within context limits.

---

## 5. Infrastructure notes by language type

| Situation | Action |
|-----------|--------|
| Latin script | Nothing extra. Helvetica WinAnsi covers Latin-1 supplement (accented letters ≤ U+00FF). Beyond that, check cycleRingLayout glyph widths. |
| Cyrillic | No new PDF font (existing Noto Sans KR subset covers Cyrillic for the ring). Russian plural shim already exists. |
| Arabic / Hebrew (RTL) | Add RTL layout work — not yet implemented in AWA. Flag and scope separately. |
| Devanagari / Bengali / complex script | Check `UNSHAPED_SCRIPT` for map; add PDF font subset; test HarfBuzz shaping in `DaughterMoodTitle` test. |
| CJK | Add Noto Sans subset for PDF (`pdfXXFont.ts`). One plural category. |
| ICU Hijri month names missing | Add `COMPOSED_HIJRI` entry in `cycleMath.ts` (see Japanese/Korean/Albanian). |

---

## 6. Tests to update

```
src/i18n/__tests__/PhaseBengaliLocalization.test.ts    ALL_LANGUAGES array
src/i18n/__tests__/PhasePortugueseLocalization.test.ts ALL_LANGUAGES array
src/state/__tests__/initialLanguage.test.ts            ALL_LANGUAGES array
src/i18n/__tests__/PhaseItalianRuntimeIntegration.test.ts  TERMS/PRIVACY sorted key list
src/screens/__tests__/PhaseItalianEditorial.test.tsx   editorial key order string
src/services/maps/__tests__/mapLanguage.test.ts        registered Record + mapLanguageFor cases
src/screens/__tests__/AppearanceLanguageSheet.test.tsx UI_LANGUAGES + SELF_LABELS
src/screens/journal/__tests__/DaughterMoodTitle.test.tsx   DICTIONARIES object
src/components/home/__tests__/cycleRingLayout.test.ts  DICTIONARIES object
```

Create `src/i18n/__tests__/PhaseXXLocalization.test.ts` (copy `PhaseDanishLocalization.test.ts`, adapt).

---

## 7. Validation sequence

```bash
# After dictionary is complete:
node scripts/check-language-parity.js <code>         # 0 key errors, 0 placeholder mismatches

# After all registrations and tests:
npx tsc --noEmit -p mobile/tsconfig.json             # 0 errors
npx eslint mobile/src --max-warnings=0               # 0 warnings

# Focused test (fast):
cd mobile && npx jest --testPathPattern="PhaseXX|initialLanguage|mapLanguage|AppearanceLanguageSheet" --no-coverage

# Full suite (only after everything passes focused):
cd mobile && npx jest --no-coverage
cd mobile && npx jest --no-coverage --testPathPattern="encrypted"
```

---

## 8. Docs to create

```
mobile/docs/i18n/<code>-review-checklist.md
mobile/docs/i18n/<code>-illustration-localization-spec.md
mobile/docs/i18n/<code>-manual-android-test-checklist.md
```

Add a one-line entry to `mobile/docs/maps-localization.md`.  
Add a memory note at `~/.claude/projects/d--HAWA/memory/awa-<code>-localization-notes.md` + MEMORY.md index line.

---

## 9. Constraints (always)

- Never claim Android visual validation is complete until tested on a real device.
- Never use English text as a completed translation (use a placeholder comment instead).
- Never touch cycle math, auth, theme colors, signing config, or unrelated features.
- Do not commit or push.
