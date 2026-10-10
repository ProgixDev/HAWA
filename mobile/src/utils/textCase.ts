import {getAppLanguage} from '../state/themePreferences';

// Locale-aware case conversion for the few places that change the case of text in JavaScript.
//
// Turkish has a dotted and a dotless i: the capital of "i" is "İ" and the lower case of "I" is "ı" — the
// default conversions give "I" and "i", which turns "iyi" into "IYI" (a different word, and not what a Turkish
// reader expects). Every other language AWA supports uses the default rules, so for them these helpers are
// exactly String.prototype.toUpperCase/toLowerCase.
//
// Implemented by hand instead of toLocaleUpperCase('tr') on purpose: Hermes' Intl support for locale-specific
// case mapping depends on the Android build, and the rule needed here is only the two letters.

const isTurkish = (language: string): boolean => language === 'tr';

export function upperCaseFor(value: string, language: string = getAppLanguage()): string {
  if (!isTurkish(language)) {return value.toUpperCase();}
  return value.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

export function lowerCaseFor(value: string, language: string = getAppLanguage()): string {
  if (!isTurkish(language)) {return value.toLowerCase();}
  return value.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

/** First letter upper-cased with the language's rule; the rest untouched. */
export function capitalizeFor(value: string, language: string = getAppLanguage()): string {
  if (value.length === 0) {return value;}
  const first = value.charAt(0);
  return upperCaseFor(first, language) + value.slice(1);
}

/**
 * What `textTransform: 'capitalize'` does, with the language's rule: the first letter of EVERY whitespace-separated
 * word is upper-cased and the rest is left alone. The native transform on Android follows the DEVICE locale, so a
 * Turkish "iyi gün" would come out as "Iyi Gün" on a phone that is not set to Turkish; this gives "İyi Gün".
 */
export function titleCaseFor(value: string, language: string = getAppLanguage()): string {
  return value.replace(/(^|\s)(\S)/g, (_match, space: string, letter: string) => space + upperCaseFor(letter, language));
}

/**
 * DISPLAY helpers for text that is also styled with `textTransform` ('uppercase' / 'capitalize'). The native
 * transform is left in place and still does the work for fr/en/es/it, so for them these return the string
 * UNCHANGED (rendered text, accessibility reads and test assertions stay exactly as before). Only Turkish is
 * converted in JavaScript, because the native transform follows the device locale and turns "iyi" into "IYI".
 */
export function displayUpperCase(value: string, language: string = getAppLanguage()): string {
  return isTurkish(language) ? upperCaseFor(value, language) : value;
}

export function displayTitleCase(value: string, language: string = getAppLanguage()): string {
  return isTurkish(language) ? titleCaseFor(value, language) : value;
}

/**
 * For comparing a typed confirmation word with the expected one ("DELETE", "SİL"…): upper-cases with the
 * language's rule and, for Turkish, folds İ/ı/I/i together — a person typing "sil", "SIL" or "SİL" on a Latin
 * keyboard means the same word, and none of them should be refused.
 */
export function foldForConfirmation(value: string, language: string = getAppLanguage()): string {
  const upper = upperCaseFor(value.trim(), language);
  return isTurkish(language) ? upper.replace(/İ/g, 'I') : upper;
}
