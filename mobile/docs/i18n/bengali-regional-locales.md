# বাংলা (Bengali) — regional locale strategy (`bn-BD` primary, `bn-IN` additional)

AWA's registry (`AwaAppLanguage`, `state/themePreferences.ts`) now has **one Bengali app language, `bn`**. Unlike Portuguese (where Portugal and Brazil read different words and are two selectable languages
sharing one translation), written standard Bengali is the same in Bangladesh and West Bengal for everything AWA says, and CLDR's `bn-BD` and `bn-IN` data agree on dates, numbers, plural rules and weekday
names. So there is a single dictionary (`locales/bn.ts`), one selector card and one set of articles.

| Phone / tag | Resolves to | Where |
|---|---|---|
| `bn`, `bn-BD`, `bn-IN`, `bn_BD`, `bn_IN`, `bn-BD.UTF-8`, `bn-Beng`, `bn-Beng-BD`, `bn-Beng-IN`, `bn-BD-u-…` | `bn` | `languageFromLocaleTag` (bare-language retry), `normalizeAppLanguage` (`BN_ALIASES`), `resolveEditorialLanguage` (`^bn([-_](bd|in|beng|beng-bd|beng-in))?$`) |
| Assamese `as`, Chittagonian / Sylheti, `bn` written in Latin | not Bengali → English fallback (never silently mapped) | unchanged |

* **Intl locale:** `bn-BD-u-nu-latn` (`cycleMath.ts` → `dateFormatLocale`). The default numbering system of `bn` is Bengali digits (০–৯); AWA uses **Western digits everywhere** — every other language does, the
  article and dictionary text keeps its Latin numerals, Hermes' ICU is not guaranteed to carry Bengali digit data on every device, and a mixed «১২ দিন / 12 days» presentation would make the PDF, the CSV and
  the notifications inconsistent. The `-u-nu-latn` extension pins it. If a reviewer wants Bengali digits, that is a deliberate, separate change (dictionary numbers, counters, ring, PDF, CSV, tests).
* **Plural rules:** CLDR `bn` = *one* for an integer part of 0 or exactly 1, *other* otherwise (same as Hindi); `pluralRules.ts` implements it on Hermes (no `Intl.PluralRules`). Bengali has no inflection after
  a numeral, so `_one` and `_other` carry the same wording (87 `_one` keys are copies, one hand-translated exception).
* **Dates:** weekdays সোম মঙ্গল বুধ বৃহ শুক্র শনি রবি; months from ICU (জানুয়ারী … vs জানুয়ারি spelling follows the engine); Hijri dates composed by `cycleMath.ts` («12 রমজান 1447 হিজরি») because ICU prints the Hijri month as a number.
* **Map:** MapTiler accepts `bn` (not `bn-BD`: HTTP 400), so `mapLanguageFor()` reduces any `bn-*` to `bn`; the map **labels** fall back to Latin because MapLibre Native cannot shape Bengali (see `docs/maps-localization.md`).
* **Vocabulary:** Bangladeshi Muslim vocabulary (নামাজ, রোজা, কাজা, পানি…) is used throughout; a West Bengal reviewer may prefer নমাজ/নামাজ, জল for পানি. Differences like these are listed in
  `bengali-review-checklist.md`; if they become numerous enough to matter, a `bn-IN` overlay can be added the way `pt-BR` overlays `pt-PT` (fallback chain `bn-IN → bn → en`) without changing any caller.
