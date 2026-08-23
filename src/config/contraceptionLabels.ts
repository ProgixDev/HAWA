import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {ContraceptionMethod} from '../state/contraceptionPreferences';
import type {ContraceptionIntakeStatus} from '../state/contraceptionIntakeHistoryStore';
import type {ContraceptionEventType} from '../state/contraceptionEventStore';

// Single shared source for contraception method/reminder copy — consumed by
// SummaryScreen, ContraceptionRemindersScreen and ContraceptionDashboard so
// they can never drift into describing the same persisted preference
// differently (same pattern as the per-objective journal-category configs
// in this directory, e.g. conceptionJournalConfig.ts).
export const CONTRACEPTION_METHOD_LABELS: Record<ContraceptionMethod, string> = {
  pill: 'Pilule contraceptive',
  ring: 'Anneau vaginal',
  patch: 'Patch contraceptif',
  other: 'Autre traitement hormonal',
};

type MaterialDesignIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Same per-method icons as ContraceptionMethodScreen's OPTIONS — reused
// (not invented) wherever a method needs a neutral, content-accurate icon.
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

export const CONTRACEPTION_REMINDER_CONTENT: Record<ContraceptionMethod, ContraceptionReminderContent> = {
  pill: {
    subtitle: 'Choisis si tu souhaites recevoir des rappels pour ta prise de pilule.',
    cardTitle: 'Rappels quotidiens\nde prise de pilule',
    cardDescription: 'Reçois une notification chaque jour pour ne pas oublier ta pilule.',
  },
  ring: {
    subtitle: 'Choisis si tu souhaites recevoir des rappels pour ton anneau vaginal.',
    cardTitle: 'Rappels pour ton\nanneau vaginal',
    cardDescription: 'Active les rappels liés à l’utilisation de ton anneau.',
  },
  patch: {
    subtitle: 'Choisis si tu souhaites recevoir des rappels pour ton patch contraceptif.',
    cardTitle: 'Rappels pour ton\npatch contraceptif',
    cardDescription: 'Active les rappels liés au changement de ton patch.',
  },
  other: {
    subtitle: 'Choisis si tu souhaites recevoir des rappels pour ton traitement.',
    cardTitle: 'Rappels pour\nton traitement',
    cardDescription: 'Active les rappels liés à ton traitement hormonal.',
  },
};

export const CONTRACEPTION_DEFAULT_REMINDER_CONTENT: ContraceptionReminderContent = {
  subtitle: 'Choisis si tu souhaites recevoir des rappels pour ta méthode de contraception.',
  cardTitle: 'Rappels liés à\nta méthode',
  cardDescription: 'Active les rappels liés à ta méthode de contraception.',
};

// Method-adaptive title for the "Prise / utilisation du jour" Journal
// quotidien category and Dashboard "Suivi du jour" row — consumed by
// ContraceptionDashboard, the JournalSheetHost's contraception branch, and
// ContraceptionJournalEntryScreen, so all three always agree on the same
// wording instead of assuming every user takes a pill.
export const CONTRACEPTION_INTAKE_ACTION_LABEL: Record<ContraceptionMethod, string> = {
  pill: 'Prise du jour',
  ring: 'Utilisation de l’anneau',
  patch: 'Utilisation du patch',
  other: 'Utilisation du traitement',
};

export const CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL = 'Prise / utilisation du jour';

// Short, notification-length title per method (distinct from
// CONTRACEPTION_REMINDER_CONTENT.cardTitle above, which is longer, multi-line
// UI copy) — the exact string passed to scheduleLocalNotification's `title`.
// Single source so contraceptionReminderScheduling.ts and any settings UI
// showing "what the notification will say" never disagree.
export const CONTRACEPTION_REMINDER_NOTIFICATION_TITLE: Record<ContraceptionMethod, string> = {
  pill: 'Rappel de prise',
  ring: 'Rappel lié à ton anneau',
  patch: 'Rappel lié à ton patch',
  other: 'Rappel de traitement',
};

export const CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE = 'Rappel de contraception';

// Status wording shared by Dashboard/Calendar/Journal/History for pill and
// other (the two methods tracked via contraceptionIntakeHistoryStore) — one
// place so "En retard" (the new, additive 'late' status) reads identically
// everywhere it appears, and so existing "Effectuée"/"Oubliée" copy doesn't
// silently drift between screens as they're migrated to read from here.
export const CONTRACEPTION_INTAKE_STATUS_LABELS: Record<ContraceptionIntakeStatus, string> = {
  taken: 'Effectuée',
  missed: 'Oubliée',
  late: 'En retard',
};

// Event-type wording/icons for ring/patch (tracked via
// contraceptionEventStore.ts) — reused by the Daily Journal, Calendar,
// History and Dashboard so none of them invent their own phrasing for the
// same event type. Insertion/application share one icon, removal shares
// another, and replacement (a corrective/renewal action) gets its own —
// deliberately generic MaterialDesignIcons already used elsewhere in AWA,
// no new icon family introduced.
export const CONTRACEPTION_EVENT_LABELS: Record<ContraceptionEventType, string> = {
  ring_insertion: 'Anneau inséré',
  ring_removal: 'Anneau retiré',
  ring_replacement: 'Anneau remplacé',
  patch_application: 'Patch posé',
  patch_removal: 'Patch retiré',
  patch_replacement: 'Patch remplacé',
};

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
// never drift from the labels/icons above.
export const CONTRACEPTION_METHOD_EVENT_TYPES: Partial<Record<ContraceptionMethod, ContraceptionEventType[]>> = {
  ring: ['ring_insertion', 'ring_removal', 'ring_replacement'],
  patch: ['patch_application', 'patch_removal', 'patch_replacement'],
};
