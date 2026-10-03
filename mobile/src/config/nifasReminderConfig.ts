import i18n from '../i18n';

/**
 * Educational product reference currently presented by HAWA. It must not be
 * interpreted as a universal fiqh ruling and is intentionally kept in one
 * place so validated content can update it later.
 */
export const NIFAS_REFERENCE_DAYS = 40;
export const NIFAS_WARNING_DAYS = 35;

/**
 * The ONE headline wording of the two Nifas reference states, shared by the
 * Dashboard banner and the completion popup, so the same underlying state
 * (see getNifasReminderStatus in utils/postpartumTrackingUtils.ts) is always
 * phrased the same way. Functions (not plain consts) so the French/English
 * choice is read fresh from the live app language on every call — never
 * cached at module-import time, so a runtime language switch is never stale.
 * Wording only — no rule lives here; the detailed body texts are unchanged
 * and stay under religious-content review. Scheduled notification payloads
 * do NOT go through these — utils/postpartumNifasReminderScheduling.ts's own
 * internalContent() already builds its own i18n.t()-driven copy (Phase 4);
 * these two are only ever used for on-screen UI and the in-app notification
 * history's legacy-entry fallback.
 */
export const nifasReferenceReachedHeadline = (): string =>
  i18n.t('spiritualGuidance.nifasReferenceReachedHeadline', {days: NIFAS_REFERENCE_DAYS});
export const nifasReferenceApproachingHeadline = (): string =>
  i18n.t('spiritualGuidance.nifasReferenceApproachingHeadline', {days: NIFAS_REFERENCE_DAYS});



// Bumped so already-scheduled J35/J40 reminders get cancelled and
// rescheduled with the new "repère des 40 jours retenu par AWA" wording
// (religious-neutrality fix — no longer presents 40 days as an unqualified
// universal fact) instead of silently keeping their old content
// (syncPostpartumNifasReminders only reschedules when this changes).
export const NIFAS_REFERENCE_CONFIG_VERSION = 3;

export const NIFAS_EDUCATIONAL_ARTICLE_ID = 'nifasfiqh-repere-fiqh';
