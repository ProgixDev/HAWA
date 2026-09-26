/**
 * Educational product reference currently presented by HAWA. It must not be
 * interpreted as a universal fiqh ruling and is intentionally kept in one
 * place so validated content can update it later.
 */
export const NIFAS_REFERENCE_DAYS = 40;
export const NIFAS_WARNING_DAYS = 35;

/**
 * The ONE headline wording of the two Nifas reference states, shared by the
 * Dashboard banner, the completion popup, the local notification and the
 * in-app notification history, so the same underlying state (see
 * getNifasReminderStatus in utils/postpartumTrackingUtils.ts) is always
 * phrased the same way. Wording only — no rule lives here; the detailed
 * body texts are unchanged and stay under religious-content review.
 */
export const NIFAS_REFERENCE_REACHED_HEADLINE = `Le repère des ${NIFAS_REFERENCE_DAYS} jours retenu par AWA est atteint`;
export const NIFAS_REFERENCE_APPROACHING_HEADLINE = `Le repère des ${NIFAS_REFERENCE_DAYS} jours retenu par AWA approche`;



// Bumped so already-scheduled J35/J40 reminders get cancelled and
// rescheduled with the new "repère des 40 jours retenu par AWA" wording
// (religious-neutrality fix — no longer presents 40 days as an unqualified
// universal fact) instead of silently keeping their old content
// (syncPostpartumNifasReminders only reschedules when this changes).
export const NIFAS_REFERENCE_CONFIG_VERSION = 3;

export const NIFAS_EDUCATIONAL_ARTICLE_ID = 'nifasfiqh-repere-fiqh';
