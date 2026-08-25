/**
 * Educational product reference currently presented by HAWA. It must not be
 * interpreted as a universal fiqh ruling and is intentionally kept in one
 * place so validated content can update it later.
 */
export const NIFAS_REFERENCE_DAYS = 40;
export const NIFAS_WARNING_DAYS = 35;



// Bumped so already-scheduled J35/J40 reminders get cancelled and
// rescheduled with the new "repère des 40 jours retenu par AWA" wording
// (religious-neutrality fix — no longer presents 40 days as an unqualified
// universal fact) instead of silently keeping their old content
// (syncPostpartumNifasReminders only reschedules when this changes).
export const NIFAS_REFERENCE_CONFIG_VERSION = 3;

export const NIFAS_EDUCATIONAL_ARTICLE_ID = 'nifasfiqh-repere-fiqh';
