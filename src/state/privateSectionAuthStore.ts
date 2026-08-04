import {AppState, type AppStateStatus} from 'react-native';

const BACKGROUND_LOCK_DELAY_MS = 60_000;
let intimacyUnlocked = false;
let backgroundedAt: number | undefined;

export const isIntimacyUnlocked = (): boolean => intimacyUnlocked;
export const unlockIntimacy = (): void => {intimacyUnlocked = true;};
export const lockIntimacy = (): void => {intimacyUnlocked = false;};

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
