// The single place that decides which language an editorial content object
// (a Library article's CONTENT, the pregnancy week reference data) is shown in.
// Explicit opt-ins for the languages that have real editorial text; anything
// else — an unrecognized or not-yet-loaded value included — resolves to
// English, never to French or Spanish.
export type EditorialLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id';

export function resolveEditorialLanguage(language: string | null | undefined): EditorialLanguage {
  // Simplified Chinese aliases (zh-CN, zh-Hans …) resolve to the canonical 'zh' block.
  if (typeof language === 'string' && /^zh([-_](cn|hans|sg|hans-cn|hans-sg))?$/i.test(language.trim())) {
    return 'zh';
  }
  // Indonesian aliases (id-ID, and the legacy Java code 'in') resolve to the canonical 'id' block.
  if (typeof language === 'string' && /^(id|in)([-_]id)?$/i.test(language.trim())) {
    return 'id';
  }
  return language === 'fr' || language === 'es' || language === 'it' || language === 'tr' || language === 'ru' || language === 'de' || language === 'zh' ? language : 'en';
}
