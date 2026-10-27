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

/** CLDR cardinal rule for Polish. Integers: one (exactly 1), few (2–4, 22–24 … but not 12–14), many (0, 5–21, 25–31 … and every other integer);
 * any non-integer is "other" (1,5 dnia). Without this rule Hermes would use one/other and "2 dni", "5 dni", "22 dni" would all take the wrong form. */
export function polishCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {return 'other';}
  const n = Math.abs(value);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) {return 'one';}
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {return 'few';}
  return 'many';
}

/** CLDR cardinal rule for Hindi: "one" when the integer part is 0 or the value is exactly 1, otherwise "other". */
export function hindiCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const n = Math.abs(value);
  return Math.trunc(n) === 0 || n === 1 ? 'one' : 'other';
}

/** CLDR cardinal rule for Sinhala: "one" for 0 and 1 and for a value with integer part 0 and a single fractional digit 1 (0,1); otherwise "other". */
export function sinhalaCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const n = Math.abs(value);
  if (n === 0 || n === 1) {return 'one';}
  return Math.trunc(n) === 0 && Math.abs(n * 10 - 1) < 1e-9 ? 'one' : 'other';
}

/** CLDR cardinal rule for Portuguese. Brazil ('pt', 'pt-BR'): one = integer part 0 or 1 (0, 0.5, 1, 1.5 → one). Portugal ('pt-PT'): one = exactly 1
 * (the integer 1 with no decimals), so "0 dias" but "1 dia". Values of a million and more also have a "many" category in CLDR; AWA never counts that high. */
export function portugueseCardinal(value: number, portugal: boolean): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const n = Math.abs(value);
  if (portugal) {return n === 1 ? 'one' : 'other';}
  return Math.trunc(n) === 0 || Math.trunc(n) === 1 ? 'one' : 'other';
}

/** CLDR cardinal rule for Czech. Integers: one (exactly 1), few (2–4), other (0 and 5 upwards); any non-integer is "many" (1,5 dne). */
export function czechCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  if (!Number.isInteger(value)) {return 'many';}
  const n = Math.abs(value);
  if (n === 1) {return 'one';}
  if (n >= 2 && n <= 4) {return 'few';}
  return 'other';
}

/** CLDR cardinal rule for Romanian. one: exactly 1; few: 0, any non-integer, or an integer other than 1 whose last two digits are 01-19 (2, 12, 19, 101, 119); other: the rest (20, 100, 120). */
export function romanianCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  if (!Number.isInteger(value)) {return 'few';}
  const n = Math.abs(value);
  if (n === 1) {return 'one';}
  const mod100 = n % 100;
  if (n === 0 || (mod100 >= 1 && mod100 <= 19)) {return 'few';}
  return 'other';
}

/** CLDR cardinal rule for Serbian, Croatian and Bosnian. Integers: one (1, 21, 101… but not 11), few (2–4, 22–24… but not 12–14), other (the rest); decimals use their fractional digits the same way (0,1 → one; 0,2 → few; 1,5 → other). */
export function southSlavicCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const text = String(Math.abs(value));
  const [intPart, fracPart] = text.split('.');
  const digits = fracPart !== undefined ? fracPart : intPart;
  const last = Number(digits.slice(-1));
  const lastTwo = Number(digits.slice(-2));
  if (last === 1 && lastTwo !== 11) {return 'one';}
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {return 'few';}
  return 'other';
}

/** CLDR cardinal rule for Slovenian (has a dual). Integers: one (…01), two (…02), few (…03, …04), other (the rest); any non-integer is "few" (0,5 dneva). */
export function slovenianCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  if (!Number.isInteger(value)) {return 'few';}
  const mod100 = Math.abs(value) % 100;
  if (mod100 === 1) {return 'one';}
  if (mod100 === 2) {return 'two';}
  if (mod100 === 3 || mod100 === 4) {return 'few';}
  return 'other';
}

/** CLDR cardinal rule for Armenian: "one" when the integer part is 0 or 1 (0, 0.5, 1, 1.5 → one), otherwise "other" (2, 2.5, 11, 21 → other).
 * The default one/other rule (exactly 1) would put 0 and 1.5 in "other". */
export function armenianCardinal(value: number): PluralCategory {
  if (!Number.isFinite(value)) {return 'other';}
  const integerPart = Math.trunc(Math.abs(value));
  return integerPart === 0 || integerPart === 1 ? 'one' : 'other';
}

class AwaPluralRules {
  private readonly language: string;
  /** Portuguese only: true for 'pt-PT' (Portugal), false for 'pt' / 'pt-BR'. */
  private readonly portugal: boolean;

  constructor(locales?: string | string[], _options?: {type?: 'cardinal' | 'ordinal'}) {
    const requested = Array.isArray(locales) ? locales[0] : locales;
    this.language = baseLanguage(requested ?? 'en');
    this.portugal = /^pt[-_](pt|ao|mz|cv|gw|st|tl|mo|gq|ch|lu)(?![a-z])/i.test(requested ?? '');
  }

  select(value: number): PluralCategory {
    if (this.language === 'ru' || this.language === 'uk') {return russianCardinal(value);}
    if (this.language === 'pl') {return polishCardinal(value);}
    if (this.language === 'cs' || this.language === 'sk') {return czechCardinal(value);}
    if (this.language === 'ro') {return romanianCardinal(value);}
    if (this.language === 'sr' || this.language === 'hr' || this.language === 'bs') {return southSlavicCardinal(value);}
    if (this.language === 'sl') {return slovenianCardinal(value);}
    // Chinese has no grammatical number: CLDR has the single category "other".
    if (this.language === 'zh' || this.language === 'id' || this.language === 'ja' || this.language === 'ko' || this.language === 'th' || this.language === 'vi') {return 'other';}
    // Indonesian, Japanese and Korean likewise have no grammatical number (CLDR: only "other").
    // Hindi (CLDR): one = integer part 0, or exactly 1 (0, 0.5, 1 → one; 1.5, 2 → other).
    // Bengali (CLDR) follows the same rule as Hindi: one = integer part 0, or exactly 1 (0, 0.5, 1 → one; 1.5, 2 → other).
    if (this.language === 'hi' || this.language === 'bn') {return hindiCardinal(value);}
    if (this.language === 'si') {return sinhalaCardinal(value);}
    // Armenian (CLDR): one = integer part 0 or 1 (see armenianCardinal).
    if (this.language === 'hy') {return armenianCardinal(value);}
    // Portuguese: 'pt-PT' differs from 'pt' / 'pt-BR' at 0 (see portugueseCardinal).
    if (this.language === 'pt') {return portugueseCardinal(value, this.portugal);}
    return value === 1 ? 'one' : 'other';
  }

  resolvedOptions(): {locale: string; pluralCategories: PluralCategory[]} {
    return {
      locale: this.language,
      pluralCategories:
        this.language === 'ru' || this.language === 'uk' || this.language === 'pl' || this.language === 'cs' || this.language === 'sk' ? ['one', 'few', 'many', 'other'] : this.language === 'ro' || this.language === 'sr' || this.language === 'hr' || this.language === 'bs' ? ['one', 'few', 'other'] : this.language === 'sl' ? ['one', 'two', 'few', 'other'] : this.language === 'he' || this.language === 'iw' ? ['one', 'two', 'other'] : this.language === 'zh' || this.language === 'id' || this.language === 'ja' || this.language === 'ko' || this.language === 'th' || this.language === 'vi' ? ['other'] : ['one', 'other'],
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
