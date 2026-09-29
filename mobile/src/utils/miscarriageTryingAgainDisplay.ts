import type { MiscarriageTryingAgainStatus } from '../state/miscarriagePreferences';
import i18n from '../i18n';

// i18n (Phase 3): a pure util, not a component, so it cannot call
// `useTranslation()`. `i18n.t()` is called at invocation time (never
// cached), so this already returns the current language on every call
// without needing a languageChanged listener. Consumed by
// MiscarriageCalendarContent.tsx and MiscarriageStatisticsScreen.tsx.

export type MiscarriageTryingAgainDisplay = {
  label: string;
  icon: 'check-circle-outline' | 'clock-outline' | 'help-circle-outline';
  tone: 'ready' | 'neutral' | 'unknown';
};

export function getMiscarriageTryingAgainDisplay(
  status: MiscarriageTryingAgainStatus | null | undefined,
): MiscarriageTryingAgainDisplay {
  if (status === 'ready') {
    return {
      label: i18n.t('miscarriageTryingAgain.display.ready'),
      icon: 'check-circle-outline',
      tone: 'ready',
    };
  }
  if (status === 'not_now' || status === 'soon') {
    return {
      label: i18n.t('miscarriageTryingAgain.display.neutral'),
      icon: 'clock-outline',
      tone: 'neutral',
    };
  }
  return {
    label: i18n.t('miscarriageTryingAgain.display.unknown'),
    icon: 'help-circle-outline',
    tone: 'unknown',
  };
}
