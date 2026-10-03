import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {ContraceptionMethod} from '../state/contraceptionPreferences';
import type {ContraceptionIntakeStatus} from '../state/contraceptionIntakeHistoryStore';
import type {ContraceptionEvent, ContraceptionEventType} from '../state/contraceptionEventStore';

// i18n (Phase 3/7B): this is a plain data/config file, not a component, so
// its exports can't call useTranslation() themselves. Every map/function
// below (except CONTRACEPTION_REMINDER_NOTIFICATION_TITLE/
// CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE, which stay French — see
// their own comment) is a `function xxxLabels(t) {...}` factory that a
// component calls with its own `t` from useTranslation(), same pattern as
// JournalCervicalMucusScreen.tsx's mucusLabels(t).
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Single shared source for contraception method/reminder copy — consumed by
// SummaryScreen, ContraceptionRemindersScreen and ContraceptionDashboard so
// they can never drift into describing the same persisted preference
// differently (same pattern as the per-objective journal-category configs
// in this directory, e.g. conceptionJournalConfig.ts).
export function contraceptionMethodLabels(t: TranslateFn): Record<ContraceptionMethod, string> {
  return {
    pill: t('contraceptionLabels.method.pill'),
    ring: t('contraceptionLabels.method.ring'),
    patch: t('contraceptionLabels.method.patch'),
    other: t('contraceptionLabels.method.other'),
  };
}

type MaterialDesignIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Same per-method icons as ContraceptionMethodScreen's OPTIONS — reused
// (not invented) wherever a method needs a neutral, content-accurate icon.
// Icon identifiers, not user-facing text — never translated.
export const CONTRACEPTION_METHOD_ICONS: Record<ContraceptionMethod, MaterialDesignIconName> = {
  pill: 'pill',
  ring: 'circle-outline',
  patch: 'bandage',
  other: 'needle',
};

export type ContraceptionReminderContent = {
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
};

export function contraceptionReminderContent(t: TranslateFn): Record<ContraceptionMethod, ContraceptionReminderContent> {
  return {
    pill: {
      subtitle: t('contraceptionLabels.reminderContent.pill.subtitle'),
      cardTitle: t('contraceptionLabels.reminderContent.pill.cardTitle'),
      cardDescription: t('contraceptionLabels.reminderContent.pill.cardDescription'),
    },
    ring: {
      subtitle: t('contraceptionLabels.reminderContent.ring.subtitle'),
      cardTitle: t('contraceptionLabels.reminderContent.ring.cardTitle'),
      cardDescription: t('contraceptionLabels.reminderContent.ring.cardDescription'),
    },
    patch: {
      subtitle: t('contraceptionLabels.reminderContent.patch.subtitle'),
      cardTitle: t('contraceptionLabels.reminderContent.patch.cardTitle'),
      cardDescription: t('contraceptionLabels.reminderContent.patch.cardDescription'),
    },
    other: {
      subtitle: t('contraceptionLabels.reminderContent.other.subtitle'),
      cardTitle: t('contraceptionLabels.reminderContent.other.cardTitle'),
      cardDescription: t('contraceptionLabels.reminderContent.other.cardDescription'),
    },
  };
}

export function contraceptionDefaultReminderContent(t: TranslateFn): ContraceptionReminderContent {
  return {
    subtitle: t('contraceptionLabels.reminderContent.default.subtitle'),
    cardTitle: t('contraceptionLabels.reminderContent.default.cardTitle'),
    cardDescription: t('contraceptionLabels.reminderContent.default.cardDescription'),
  };
}

// Method-adaptive title for the "Prise / utilisation du jour" Journal
// quotidien category and Dashboard "Suivi du jour" row — consumed by
// ContraceptionDashboard, the JournalSheetHost's contraception branch, and
// ContraceptionJournalEntryScreen, so all three always agree on the same
// wording instead of assuming every user takes a pill.
export function contraceptionIntakeActionLabels(t: TranslateFn): Record<ContraceptionMethod, string> {
  return {
    pill: t('contraceptionLabels.intakeActionLabel.pill'),
    ring: t('contraceptionLabels.intakeActionLabel.ring'),
    patch: t('contraceptionLabels.intakeActionLabel.patch'),
    other: t('contraceptionLabels.intakeActionLabel.other'),
  };
}

export function contraceptionDefaultIntakeActionLabel(t: TranslateFn): string {
  return t('contraceptionLabels.defaultIntakeActionLabel');
}

// Short, notification-length title per method (distinct from
// CONTRACEPTION_REMINDER_CONTENT.cardTitle above, which is longer, multi-line
// UI copy) — the exact string passed to scheduleLocalNotification's `title`.
// Single source so contraceptionReminderScheduling.ts and any settings UI
// showing "what the notification will say" never disagree.
// Phase 4: a factory (not a static object), called fresh at every schedule/
// resync so it always reflects the CURRENT app language.
export function contraceptionReminderNotificationTitle(t: TranslateFn): Record<ContraceptionMethod, string> {
  return {
    pill: t('notifications.contraception.reminderTitle.pill'),
    ring: t('notifications.contraception.reminderTitle.ring'),
    patch: t('notifications.contraception.reminderTitle.patch'),
    other: t('notifications.contraception.reminderTitle.other'),
  };
}

export function contraceptionDefaultReminderNotificationTitle(t: TranslateFn): string {
  return t('notifications.contraception.defaultReminderTitle');
}


// Status wording shared by Dashboard/Calendar/Journal/History for pill and
// other (the two methods tracked via contraceptionIntakeHistoryStore) — one
// place so "En retard" (the new, additive 'late' status) reads identically
// everywhere it appears, and so existing "Effectuée"/"Oubliée" copy doesn't
// silently drift between screens as they're migrated to read from here.
export function contraceptionIntakeStatusLabels(t: TranslateFn): Record<ContraceptionIntakeStatus, string> {
  return {
    taken: t('contraceptionLabels.intakeStatusLabels.taken'),
    missed: t('contraceptionLabels.intakeStatusLabels.missed'),
    late: t('contraceptionLabels.intakeStatusLabels.late'),
  };
}

// Dashboard hero quick-action button wording — deliberately more colloquial
// than contraceptionIntakeStatusLabels above ("Prise effectuée"/"J'ai
// oublié" read more naturally as a tappable button label than the neutral
// "Effectuée"/"Oubliée" do, but only for pill, whose wording this already
// was before the 3-button hero existed). Only 'pill' is overridden here;
// every other intake-tracked method (currently just 'other') falls back to
// the shared, method-neutral contraceptionIntakeStatusLabels — never
// hardcode pill-specific wording ("prise") for a non-pill method.
export function contraceptionHeroActionLabels(
  t: TranslateFn,
): Partial<Record<ContraceptionMethod, Record<ContraceptionIntakeStatus, string>>> {
  return {
    pill: {
      taken: t('contraceptionLabels.heroActionLabels.pill.taken'),
      late: t('contraceptionLabels.heroActionLabels.pill.late'),
      missed: t('contraceptionLabels.heroActionLabels.pill.missed'),
    },
  };
}

// Event-type wording/icons for ring/patch (tracked via
// contraceptionEventStore.ts) — reused by the Daily Journal, Calendar,
// History and Dashboard so none of them invent their own phrasing for the
// same event type. Insertion/application share one icon, removal shares
// another, and replacement (a corrective/renewal action) gets its own —
// deliberately generic MaterialDesignIcons already used elsewhere in AWA,
// no new icon family introduced.
export function contraceptionEventLabels(t: TranslateFn): Record<ContraceptionEventType, string> {
  return {
    ring_insertion: t('contraceptionLabels.eventLabels.ring_insertion'),
    ring_removal: t('contraceptionLabels.eventLabels.ring_removal'),
    ring_replacement: t('contraceptionLabels.eventLabels.ring_replacement'),
    patch_application: t('contraceptionLabels.eventLabels.patch_application'),
    patch_removal: t('contraceptionLabels.eventLabels.patch_removal'),
    patch_replacement: t('contraceptionLabels.eventLabels.patch_replacement'),
  };
}

// Icon identifiers, not user-facing text — never translated.
export const CONTRACEPTION_EVENT_ICONS: Record<ContraceptionEventType, MaterialDesignIconName> = {
  ring_insertion: 'plus-circle-outline',
  ring_removal: 'minus-circle-outline',
  ring_replacement: 'autorenew',
  patch_application: 'plus-circle-outline',
  patch_removal: 'minus-circle-outline',
  patch_replacement: 'autorenew',
};

// The 3 event types offered for each non-pill, event-based method — single
// source for the Daily Journal's event picker so the offered choices can
// never drift from the labels/icons above. Enum values, not text — never
// translated.
export const CONTRACEPTION_METHOD_EVENT_TYPES: Partial<Record<ContraceptionMethod, ContraceptionEventType[]>> = {
  ring: ['ring_insertion', 'ring_removal', 'ring_replacement'],
  patch: ['patch_application', 'patch_removal', 'patch_replacement'],
};

/** The single canonical check for "does this event belong to the CURRENTLY
 * selected method" — every screen that reads contraceptionEventStore.ts
 * events for current-method operational UI (Dashboard "Suivi du jour",
 * Calendar markers/selected-day, Statistics, the Daily Journal's "already
 * recorded today" summary) must filter through this, never re-derive it
 * locally, so they can never disagree. A ring_* event only ever belongs to
 * 'ring', a patch_* event only to 'patch' — the event's own `type` already
 * encodes its method (no separate `method` field exists or is needed on the
 * event). This is a DISPLAY-time filter only: it never deletes or migrates
 * a persisted event — an old method's events remain in the store untouched
 * so switching back to that method still shows its real history. */
export const isContraceptionEventForMethod = (
  type: ContraceptionEventType,
  method: ContraceptionMethod | null,
): boolean => (method ? (CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? []).includes(type) : false);

/** The intake-history equivalent of isContraceptionEventForMethod above —
 * pill and other hormonal treatment share the exact same
 * contraceptionIntakeHistoryStore shape/store (both use a single daily
 * taken/late/missed status), so a record's own `method` tag is the only
 * thing that can tell a Pill-era record apart from an Other-era one after a
 * method switch. `undefined` (a record written before this tag existed, or
 * never tagged) is treated as belonging to EITHER intake method — it is
 * real history that must stay visible, never hidden or reassigned by a
 * guess. Ring/patch never call this — they have no intake records. */
export const isContraceptionIntakeRecordForMethod = (
  recordMethod: 'pill' | 'other' | undefined,
  currentMethod: ContraceptionMethod | null,
): boolean =>
  (currentMethod === 'pill' || currentMethod === 'other') &&
  (recordMethod === undefined || recordMethod === currentMethod);

/** Compact, non-truncating label for a day's real ring/patch events —
 * ContraceptionDashboard's "Suivi du jour" row is a single line, so joining
 * every event's label with commas (e.g. "Anneau remplacé, Anneau inséré,
 * Anneau retiré, Anneau inséré") clips on small screens and reads as noise.
 * This never hides or drops data — the full itemized, timestamped list
 * remains exactly where it already lives (Journal "déjà enregistré", the
 * Calendar's selected-day card, History, Statistics counts); this is only
 * the ONE-LINE Dashboard summary of whichever real events already exist.
 * Deliberately makes no claim about a current device state ("en place" /
 * "absent" / "à remplacer dans X jours") — those aren't safely derivable
 * from an append-only event log with no schedule model, so this only ever
 * describes what was actually recorded, never what it might imply. */
export const getContraceptionEventSummaryLabel = (
  t: TranslateFn,
  events: ContraceptionEvent[],
): string => {
  if (events.length === 0) {
    return t('contraceptionLabels.eventSummary.empty');
  }
  if (events.length === 1) {
    return contraceptionEventLabels(t)[events[0].type];
  }
  return t('contraceptionLabels.eventSummary.count', {count: events.length});
};
