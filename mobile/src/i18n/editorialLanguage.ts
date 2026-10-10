// The single place that decides which language an editorial content object
// (a Library article's CONTENT, the pregnancy week reference data) is shown in.
// Explicit opt-ins for the languages that have real editorial text; anything
// else — an unrecognized or not-yet-loaded value included — resolves to
// English, never to French or Spanish.
export type EditorialLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr';

export function resolveEditorialLanguage(language: string | null | undefined): EditorialLanguage {
  return language === 'fr' || language === 'es' || language === 'it' || language === 'tr' ? language : 'en';
}
