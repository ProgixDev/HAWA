// The single place that decides which language an editorial content object
// (a Library article's CONTENT, the pregnancy week reference data) is shown in.
// Explicit opt-ins for the languages that have real editorial text; anything
// else — an unrecognized or not-yet-loaded value included — resolves to
// English, never to French or Spanish.
export type EditorialLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id' | 'hi' | 'sq' | 'ja';

export function resolveEditorialLanguage(language: string | null | undefined): EditorialLanguage {
  // Simplified Chinese aliases (zh-CN, zh-Hans …) resolve to the canonical 'zh' block.
  if (typeof language === 'string' && /^zh([-_](cn|hans|sg|hans-cn|hans-sg))?$/i.test(language.trim())) {
    return 'zh';
  }
  // Indonesian aliases (id-ID, and the legacy Java code 'in') resolve to the canonical 'id' block.
  if (typeof language === 'string' && /^(id|in)([-_]id)?$/i.test(language.trim())) {
    return 'id';
  }
  // Hindi (hi, hi-IN, hi-Deva) resolves to the canonical 'hi' block; 'hi-Latn' (Roman-letter Hindi) is not Devanagari Hindi.
  if (typeof language === 'string' && /^hi([-_](in|deva|deva-in))?$/i.test(language.trim())) {
    return 'hi';
  }
  // Albanian (sq, sq-AL, sq-XK …) resolves to the canonical 'sq' block.
  if (typeof language === 'string' && /^sq([-_](al|xk|mk|me|latn|latn-al))?$/i.test(language.trim())) {
    return 'sq';
  }
  // Japanese (ja, ja-JP, ja-Jpan …) resolves to the canonical 'ja' block.
  if (typeof language === 'string' && /^ja([-_](jp|jpan|jpan-jp))?$/i.test(language.trim())) {
    return 'ja';
  }
  return language === 'fr' || language === 'es' || language === 'it' || language === 'tr' || language === 'ru' || language === 'de' || language === 'zh' || language === 'id' ? language : 'en';
}
