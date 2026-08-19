import AsyncStorage from '@react-native-async-storage/async-storage';

import type {AnonymousAvatarIllustrationId} from '../components/profile/anonymousAvatarIllustrations';

// The Anonymous Mode avatar's style/color choice — kept separate from
// state/personalInformationStore.ts (which owns the NORMAL profile's
// avatarUri/name) precisely because the two must never mix: Anonymous Mode
// never reads or shows the real profile photo, and disabling Anonymous Mode
// never touches this preference either. Two small, independent sources of
// truth, one per mode.
//
// The id union itself lives in anonymousAvatarIllustrations.tsx (the actual
// illustration set) — re-exported here under its persisted-preference name
// so callers only need one import for "the anonymous avatar style id".
export type AnonymousAvatarStyleId = AnonymousAvatarIllustrationId;

export type ProfileAvatarPreferences = {
  anonymousAvatarStyle: AnonymousAvatarStyleId;
  anonymousAvatarColor: string;
};

const STORAGE_KEY = '@hawa/profile-avatar-preferences/v1';

const DEFAULT_PREFERENCES: ProfileAvatarPreferences = {
  anonymousAvatarStyle: 'minimal',
  anonymousAvatarColor: '#6848C8',
};

const VALID_STYLES: ReadonlySet<string> = new Set<AnonymousAvatarStyleId>([
  'hijab', 'glasses', 'hat', 'minimal', 'headscarfGlasses', 'silhouetteHat', 'turban', 'shortHair',
]);

let preferences: ProfileAvatarPreferences = {...DEFAULT_PREFERENCES};
let hydrated = false;
let hydration: Promise<ProfileAvatarPreferences> | null = null;
const listeners = new Set<() => void>();
const notify = (): void => listeners.forEach(listener => listener());

const isValid = (value: unknown): value is Partial<ProfileAvatarPreferences> => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<ProfileAvatarPreferences>;
  if (candidate.anonymousAvatarStyle !== undefined && !VALID_STYLES.has(candidate.anonymousAvatarStyle)) {return false;}
  if (candidate.anonymousAvatarColor !== undefined && typeof candidate.anonymousAvatarColor !== 'string') {return false;}
  return true;
};

export function getProfileAvatarPreferences(): ProfileAvatarPreferences {
  return {...preferences};
}

export function hydrateProfileAvatarPreferences(): Promise<ProfileAvatarPreferences> {
  if (hydrated) {return Promise.resolve(getProfileAvatarPreferences());}
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (isValid(parsed)) {preferences = {...DEFAULT_PREFERENCES, ...parsed};}
          } catch {}
        }
        return getProfileAvatarPreferences();
      })
      .catch(() => {
        hydrated = true;
        return getProfileAvatarPreferences();
      });
  }
  return hydration;
}

export function subscribeProfileAvatarPreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
}

export async function setAnonymousAvatarPreferences(
  style: AnonymousAvatarStyleId,
  color: string,
): Promise<ProfileAvatarPreferences> {
  preferences = {...preferences, anonymousAvatarStyle: style, anonymousAvatarColor: color};
  notify();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  return getProfileAvatarPreferences();
}
