/**
 * Educational product reference currently presented by HAWA. It must not be
 * interpreted as a universal fiqh ruling and is intentionally kept in one
 * place so validated content can update it later.
 */
export const NIFAS_REFERENCE_DAYS = 40;
export const NIFAS_WARNING_DAYS = 35;



// Bumped so already-scheduled J40 reminders get cancelled and
// rescheduled with the new "Les 40 jours de nifâs sont terminés"
// notification copy instead of silently keeping their old content
// (syncPostpartumNifasReminders only reschedules when this changes).
export const NIFAS_REFERENCE_CONFIG_VERSION = 2;

export const NIFAS_EDUCATIONAL_ARTICLE_ID = 'nifasfiqh-repere-fiqh';
