import type { MiscarriageTryingAgainStatus } from '../state/miscarriagePreferences';

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
      label: 'Prête à reprendre',
      icon: 'check-circle-outline',
      tone: 'ready',
    };
  }
  if (status === 'not_now' || status === 'soon') {
    return {
      label: 'Pas pour le moment',
      icon: 'clock-outline',
      tone: 'neutral',
    };
  }
  return {
    label: 'Non renseignée',
    icon: 'help-circle-outline',
    tone: 'unknown',
  };
}
