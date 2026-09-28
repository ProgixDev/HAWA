// In-memory (never persisted) draft for the daughter-profile CREATION flow
// (src/screens/managedProfile/). Deliberately NOT AsyncStorage-backed:
//   - Values must survive back-navigation within the flow (Information → First
//     period → Back must still show the typed first name / birth date).
//   - Leaving the flow before the final "Créer le profil" step must NEVER leave a
//     partial profile behind — since this draft never touches storage, there is
//     nothing to clean up on cancel/exit; it simply stops being read.
// The persisted result of a completed flow lives in managedProfilesStore.ts.

import type {CycleRegularity} from './onboardingPreferences';

export type ManagedProfileDraftType = 'daughter' | null;

export type ManagedProfileDraft = {
  type: ManagedProfileDraftType;
  firstName: string;
  birthDate: Date | null;
  hasHadFirstPeriod: boolean | null;
  /** Only ever set when `hasHadFirstPeriod` is true — never fabricated for "Non". */
  lastPeriodDate: Date | null;
  periodLength: number | null;
  cycleLength: number | null;
  /** Only ever set when `hasHadFirstPeriod` is true — same canonical
   * 'yes'/'no'/'unknown' representation onboardingPreferences.ts's own
   * CyclePreferences.regularity already uses everywhere else (mother's own
   * CycleInformationScreen.tsx, ProfileScreen.tsx's daughter regularity
   * editor) — never a second, incompatible representation. */
  regularity: CycleRegularity | null;
  /** Local file URI of a camera/gallery photo chosen on the Daughter Information
   * screen. Optional — null means "use the default fille.png illustration". Never a
   * remote URL: the photo stays on-device (see managedProfilesStore.ts). */
  profileImageUri: string | null;
};

const emptyDraft = (): ManagedProfileDraft => ({
  type: null,
  firstName: '',
  birthDate: null,
  hasHadFirstPeriod: null,
  lastPeriodDate: null,
  periodLength: null,
  cycleLength: null,
  regularity: null,
  profileImageUri: null,
});

let draft: ManagedProfileDraft = emptyDraft();

export const getManagedProfileDraft = (): ManagedProfileDraft => draft;

/** Call once, when "+ Ajouter un profil" is pressed — starts a clean draft so a
 * previous, abandoned attempt can never leak into a new one. */
export const startManagedProfileDraft = (): ManagedProfileDraft => {
  draft = emptyDraft();
  return draft;
};

export const updateManagedProfileDraft = (patch: Partial<ManagedProfileDraft>): ManagedProfileDraft => {
  draft = {...draft, ...patch};
  return draft;
};

/** Discards the in-progress draft — used on cancel/exit before creation, and after
 * a successful creation (its data now lives in managedProfilesStore instead). */
export const clearManagedProfileDraft = (): void => {
  draft = emptyDraft();
};
