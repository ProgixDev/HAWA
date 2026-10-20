// Plural categories for i18next on devices whose JavaScript engine has no Intl.PluralRules.
//
// i18next (v26) picks the plural form of a key (`days_one`, `days_few`, `days_many`, `days_other`) with
// `new Intl.PluralRules(lng)`. Hermes on Android does not implement Intl.PluralRules; when it is missing i18next
// silently falls back to a built-in rule that only knows "one" (n === 1) and "other". That is exactly right for
// French (as it behaved so far), English, Spanish, Italian and Turkish — but wrong for Russian, which needs four
// forms ("1 день", "2 дня", "5 дней", "1,5 дня"). Without this file every Russian count would use `_other`.
//
// Behavior:
//   - When the engine already provides Intl.PluralRules (Node/Jest, other engines) nothing is installed.
//   - Otherwise a minimal implementation is installed on `Intl`. Russian follows the CLDR cardinal rules; every
//     other language keeps the one/other rule i18next already used on-device, so no existing language changes.
//
// Only what i18next calls is implemented: `select()` and `resolvedOptions().pluralCategories`.

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

const baseLanguage = (locale: string): string => locale.toLowerCase().split(/[-_]/)[0];

/** CLDR cardinal rule for Russian. Integers: one (1, 21, 31 … but not 11), few (2–4, 22–24 … but not 12–14),
 * many (0, 5–20, 25–30 …); any non-integer is "other" (1,5 дня). */
export function russianCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {return 'other';}
  const n = Math.abs(value);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) {return 'one';}
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {return 'few';}
  return 'many';
}

/** CLDR cardinal rule for Hindi: "one" when the integer part is 0 or the value is exactly 1, otherwise "other". */
export function hindiCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const n = Math.abs(value);
  return Math.trunc(n) === 0 || n === 1 ? 'one' : 'other';
}

class AwaPluralRules {
  private readonly language: string;

  constructor(locales?: string | string[], _options?: {type?: 'cardinal' | 'ordinal'}) {
    const requested = Array.isArray(locales) ? locales[0] : locales;
    this.language = baseLanguage(requested ?? 'en');
  }

  select(value: number): PluralCategory {
    if (this.language === 'ru') {return russianCardinal(value);}
    // Chinese has no grammatical number: CLDR has the single category "other".
    if (this.language === 'zh' || this.language === 'id' || this.language === 'ja') {return 'other';}
    // Indonesian and Japanese likewise have no grammatical number (CLDR: only "other").
    // Hindi (CLDR): one = integer part 0, or exactly 1 (0, 0.5, 1 → one; 1.5, 2 → other).
    if (this.language === 'hi') {return hindiCardinal(value);}
    return value === 1 ? 'one' : 'other';
  }

  resolvedOptions(): {locale: string; pluralCategories: PluralCategory[]} {
    return {
      locale: this.language,
      pluralCategories:
        this.language === 'ru' ? ['one', 'few', 'many', 'other'] : this.language === 'zh' || this.language === 'id' || this.language === 'ja' ? ['other'] : ['one', 'other'],
    };
  }

  static supportedLocalesOf(locales?: string | string[]): string[] {
    return Array.isArray(locales) ? locales : locales ? [locales] : [];
  }
}

export function installPluralRulesIfMissing(): boolean {
  const intl = (globalThis as {Intl?: Record<string, unknown>}).Intl;
  if (!intl || typeof intl.PluralRules === 'function') {return false;}
  try {
    Object.defineProperty(intl, 'PluralRules', {value: AwaPluralRules, writable: true, configurable: true});
    return true;
  } catch {
    return false;
  }
}

installPluralRulesIfMissing();

/** Exposed for tests only (a deterministic handle on the fallback, whether or not the test engine has the native one). */
export const AwaPluralRulesForTests = AwaPluralRules;
