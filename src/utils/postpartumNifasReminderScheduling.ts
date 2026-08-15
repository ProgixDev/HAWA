import {
  cancelLocalNotifications,
  scheduleLocalNotification,
} from '../services/pregnancyNotifications';
import {
  NIFAS_EDUCATIONAL_ARTICLE_ID,
  NIFAS_REFERENCE_CONFIG_VERSION,
  NIFAS_REFERENCE_DAYS,
  NIFAS_WARNING_DAYS,
} from '../config/nifasReminderConfig';
import {
  getActiveObjective,
  getSpiritualMarkersEnabled,
  hydrateActiveObjective,
  hydrateSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';
import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
} from '../state/postpartumLochiaStore';
import { hydratePostpartumPreferences } from '../state/postpartumPreferences';
import {
  getPostpartumNifasReminderState,
  hydratePostpartumNifasReminderState,
  setPostpartumNifasReminderState,
} from '../state/postpartumNifasReminderStore';
import {
  getPrivacySecuritySettings,
  loadSecurityPreferences,
} from '../state/securityPreferences';
import { addInAppNotification } from '../state/inAppNotificationStore';
import { computePostpartumLochiaSummary } from './postpartumTrackingUtils';

export const NIFAS_WARNING_NOTIFICATION_ID = 'postpartum-nifas-warning';
export const NIFAS_REFERENCE_NOTIFICATION_ID = 'postpartum-nifas-reference';
export const NIFAS_NOTIFICATION_IDS = [
  NIFAS_WARNING_NOTIFICATION_ID,
  NIFAS_REFERENCE_NOTIFICATION_ID,
] as const;

type ReminderType = 'warning' | 'reference';

const localThresholdDate = (deliveryDate: string, day: number): Date => {
  const [year, month, date] = deliveryDate.split('-').map(Number);
  return new Date(year, month - 1, date + day - 1, 9, 0, 0, 0);
};

const occurrenceIdFor = (
  type: ReminderType,
  deliveryDate: string,
  fireDate: Date,
): string => `postpartum-nifas-${type}:${deliveryDate}:${fireDate.getTime()}`;

const notificationBody = (type: ReminderType): string => {
  const privacy = getPrivacySecuritySettings();
  if (privacy.discreetNotifications || privacy.hideNotificationPreview) {
    return 'Tu as un nouveau rappel AWA.';
  }
  return type === 'warning'
    ? 'Un repère concernant ton suivi post-partum approche.'
    : 'Un repère concernant ton suivi post-partum a été atteint.';
};

const internalContent = (type: ReminderType) =>
  type === 'warning'
    ? {
        title: 'Repère du nifas à venir',
        message: 'Le repère présenté par AWA approche.',
      }
    : {
        title: 'Repère du nifas atteint',
        message: 'Le repère présenté par AWA a été atteint.',
      };

const log = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log('[NIFAS]', ...args);
  }
};

const saveDeliveredOccurrence = async (
  type: ReminderType,
  fireAt: string | null,
  occurrenceId: string | null,
): Promise<void> => {
  if (!fireAt || !occurrenceId) {
    return;
  }
  const fireDate = new Date(fireAt);
  if (Number.isNaN(fireDate.getTime()) || fireDate.getTime() > Date.now()) {
    return;
  }
  const content = internalContent(type);
  log('reconciliation', type, occurrenceId);
  await addInAppNotification({
    id: occurrenceId,
    type: 'postpartum-nifas',
    title: content.title,
    message: content.message,
    receivedAt: fireDate.toISOString(),
    read: false,
    route: 'ArticleReader',
    data: { articleId: NIFAS_EDUCATIONAL_ARTICLE_ID },
  });
};

/** Reconciles only trigger snapshots whose scheduled time has actually passed. */
export async function reconcilePostpartumNifasInAppNotifications(): Promise<void> {
  await hydratePostpartumNifasReminderState();
  const state = getPostpartumNifasReminderState();
  await Promise.all([
    saveDeliveredOccurrence(
      'warning',
      state.warningFireAt,
      state.warningOccurrenceId,
    ),
    saveDeliveredOccurrence(
      'reference',
      state.referenceFireAt,
      state.referenceOccurrenceId,
    ),
  ]);
}

async function clearNifasReminders(): Promise<void> {
  await cancelLocalNotifications(NIFAS_NOTIFICATION_IDS);
  await setPostpartumNifasReminderState({
    deliveryDate: null,
    configVersion: NIFAS_REFERENCE_CONFIG_VERSION,
    warningScheduled: false,
    referenceScheduled: false,
    warningFireAt: null,
    referenceFireAt: null,
    warningOccurrenceId: null,
    referenceOccurrenceId: null,
  });
}

/**
 * Central idempotent sync. Notifee IDs stay stable for OS update/cancel
 * semantics; history uses the different immutable occurrence ID.
 */
export async function syncPostpartumNifasReminders(): Promise<void> {
  await Promise.all([
    hydrateActiveObjective(),
    hydrateSpiritualMarkersEnabled(),
    hydratePostpartumLochia(),
    loadSecurityPreferences(),
    hydratePostpartumNifasReminderState(),
  ]);

  const preferences = await hydratePostpartumPreferences();
  const summary = computePostpartumLochiaSummary(
    preferences.deliveryDate,
    getAllPostpartumLochiaEntries(),
    getPostpartumLochiaTracking(),
  );
  if (
    getActiveObjective() !== 'postpartum' ||
    !getSpiritualMarkersEnabled() ||
    !preferences.deliveryDate ||
    summary.status === 'ended'
  ) {
    await clearNifasReminders();
    return;
  }

  const previous = getPostpartumNifasReminderState();
  const canReuseSchedule =
    previous.deliveryDate === preferences.deliveryDate &&
    previous.configVersion === NIFAS_REFERENCE_CONFIG_VERSION &&
    Boolean(previous.warningFireAt) &&
    Boolean(previous.referenceFireAt) &&
    Boolean(previous.warningOccurrenceId) &&
    Boolean(previous.referenceOccurrenceId);

  if (canReuseSchedule) {
    await reconcilePostpartumNifasInAppNotifications();
    return;
  }

  const warningDate = localThresholdDate(
    preferences.deliveryDate,
    NIFAS_WARNING_DAYS,
  );
  const referenceDate = localThresholdDate(
    preferences.deliveryDate,
    NIFAS_REFERENCE_DAYS,
  );
  const warningOccurrenceId = occurrenceIdFor(
    'warning',
    preferences.deliveryDate,
    warningDate,
  );
  const referenceOccurrenceId = occurrenceIdFor(
    'reference',
    preferences.deliveryDate,
    referenceDate,
  );
  log('scheduled warning', warningOccurrenceId);
  log('scheduled reference', referenceOccurrenceId);

  const baseData = {
    hawaNotificationKind: 'postpartum-nifas',
    articleId: NIFAS_EDUCATIONAL_ARTICLE_ID,
  };
  const [warningScheduled, referenceScheduled] = await Promise.all([
    scheduleLocalNotification({
      id: NIFAS_WARNING_NOTIFICATION_ID,
      title: 'AWA',
      body: notificationBody('warning'),
      fireDate: warningDate,
      data: {
        ...baseData,
        nifasReminderType: 'warning',
        inAppOccurrenceId: warningOccurrenceId,
        inAppTitle: internalContent('warning').title,
        inAppMessage: internalContent('warning').message,
      },
    }),
    scheduleLocalNotification({
      id: NIFAS_REFERENCE_NOTIFICATION_ID,
      title: 'AWA',
      body: notificationBody('reference'),
      fireDate: referenceDate,
      data: {
        ...baseData,
        nifasReminderType: 'reference',
        inAppOccurrenceId: referenceOccurrenceId,
        inAppTitle: internalContent('reference').title,
        inAppMessage: internalContent('reference').message,
      },
    }),
  ]);

  await setPostpartumNifasReminderState({
    deliveryDate: preferences.deliveryDate,
    configVersion: NIFAS_REFERENCE_CONFIG_VERSION,
    warningScheduled,
    referenceScheduled,
    warningFireAt: warningDate.toISOString(),
    referenceFireAt: referenceDate.toISOString(),
    warningOccurrenceId,
    referenceOccurrenceId,
  });
}

export async function cancelPostpartumNifasReminders(): Promise<void> {
  await clearNifasReminders();
}
