import {AppState, type AppStateStatus} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

const BACKGROUND_LOCK_DELAY_MS = 60_000;
let intimacyUnlocked = false;
let backgroundedAt: number | undefined;

export const isIntimacyUnlocked = (): boolean => intimacyUnlocked;
export const unlockIntimacy = (): void => {intimacyUnlocked = true;};
export const lockIntimacy = (): void => {intimacyUnlocked = false;};

export type IntimacyTarget =
  | 'cycle'
  | 'conception'
  | 'photos'
  | 'contraceptionNotes'
  | 'cycleNotes'
  | 'miscarriageNotes'
  | 'menopauseNotes'
  | undefined;

/** Single source for "where does the private-section flow go once unlocked" —
 * PrivateIntimacyUnlockScreen, PrivateIntimacyPinScreen and
 * PrivateIntimacyFaceIdScreen each used to hand-duplicate this same ternary
 * (once each, twice in the Pin screen). Adding a new `target` (e.g.
 * Contraception's "Notes du jour", which needs params — not just a bare
 * route name — to reach `ContraceptionJournalEntry`) now happens in one
 * place instead of three/four. `cycleNotes`/`miscarriageNotes`/
 * `menopauseNotes` follow the exact same pattern for each objective's own
 * private personal-notes field — never a second PIN/biometric system. */
export const replaceWithIntimacyDestination = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  target: IntimacyTarget,
): void => {
  if (target === 'conception') {navigation.replace('JournalConceptionReports'); return;}
  if (target === 'photos') {navigation.replace('PrivatePhotoEntry'); return;}
  if (target === 'contraceptionNotes') {navigation.replace('ContraceptionJournalEntry', {category: 'notes'}); return;}
  if (target === 'cycleNotes') {navigation.replace('NoteEntry'); return;}
  if (target === 'miscarriageNotes') {navigation.replace('MiscarriageJournalEntry', {category: 'personalNotes'}); return;}
  if (target === 'menopauseNotes') {navigation.replace('MenopauseJournalEntry', {category: 'notes'}); return;}
  navigation.replace('IntimacyEntry');
};

const handleAppState = (nextState: AppStateStatus): void => {
  if (nextState === 'background' || nextState === 'inactive') {
    backgroundedAt = Date.now();
    return;
  }
  if (nextState === 'active' && backgroundedAt !== undefined) {
    if (Date.now() - backgroundedAt >= BACKGROUND_LOCK_DELAY_MS) {lockIntimacy();}
    backgroundedAt = undefined;
  }
};

AppState.addEventListener('change', handleAppState);
