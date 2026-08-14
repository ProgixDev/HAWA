import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {RootStackParamList} from './AppNavigator';
import {isBiometricEnabled, isPinEnabled, loadSecurityPreferences} from '../state/securityPreferences';

/**
 * Every destination PrivateAccessScreen can protect. Add a new entry here
 * (plus a branch in openPrivateDestination) instead of passing raw
 * screen/params through route params — keeps navigation fully typed and
 * avoids exposing arbitrary targets.
 */
export type PrivateAccessPurpose = 'miscarriagePersonalNotes' | 'pregnancyMedicalInformation';

// Only `navigate` is needed here, so callers can pass either a plain
// stack navigation prop or a bottom-tabs/stack composite one (Dashboards,
// JournalSheetHost) — requiring the full NativeStackNavigationProp shape
// would reject composite props over an unrelated `dispatch` signature
// mismatch that has nothing to do with how this helper actually navigates.
type PrivateAccessNavigation = Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>;

/** Navigates straight to the protected screen for a given purpose. */
export function openPrivateDestination(
  navigation: PrivateAccessNavigation,
  purpose: PrivateAccessPurpose,
): void {
  if (purpose === 'miscarriagePersonalNotes') {
    navigation.navigate('MiscarriageJournalEntry', {category: 'personalNotes'});
    return;
  }
  navigation.navigate('PregnancyMedicalInformation');
}

/**
 * Single reusable entry point for every "Notes personnelles"/"Informations
 * médicales personnelles" button. If the user has PIN or biometric
 * protection enabled (SecuritySetupScreen), routes through PrivateAccessScreen
 * first; otherwise opens the destination directly. Call this instead of
 * `navigation.navigate` at each protected button so the PIN/biometric check
 * never has to be duplicated per screen.
 */
export async function requirePrivateAccess(
  navigation: PrivateAccessNavigation,
  purpose: PrivateAccessPurpose,
): Promise<void> {
  await loadSecurityPreferences();
  if (isPinEnabled() || isBiometricEnabled()) {
    navigation.navigate('PrivateAccess', {purpose});
    return;
  }
  openPrivateDestination(navigation, purpose);
}
