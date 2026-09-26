import {CommonActions, type NavigationProp} from '@react-navigation/native';

import type {RootStackParamList} from '../../navigation/AppNavigator';

// Navigation rules of the "AWA à deux" frontend flow (routes live in the root stack).
//
// Onboarding is ONE linear stack:
//   Intro → PartnerName → PartnerView → Benefits → Sharing (mode "onboarding") → Pairing
// and the connected state is the end of it. Two moves must not simply `navigate`,
// because in React Navigation 7 `navigate` to a screen that is already deeper in the
// stack PUSHES a second copy instead of going back to it:
//   - "Continuer" on the association screen  → the connected screen REPLACES the whole
//     onboarding history (Back from it goes to where the user entered the feature);
//   - "Arrêter le partage" (confirmed)        → the onboarding stack is REBUILT up to the
//     association screen (Back walks the steps in order), so nobody repeats the
//     onboarding after simply stopping the sharing.
// Both are idempotent, so a rapid double tap cannot leave duplicate screens.

type Nav = Pick<NavigationProp<RootStackParamList>, 'dispatch' | 'getState'>;
type ResetState = Parameters<typeof CommonActions.reset>[0];

const ONBOARDING_ROUTES = [
  'AwaADeuxIntro',
  'AwaADeuxPartnerName',
  'AwaADeuxPartnerView',
  'AwaADeuxBenefits',
  'AwaADeuxSharing',
  'AwaADeuxPairing',
] as const;

/** The routes below the first AWA à deux screen: where the user entered the feature from. */
const routesBeforeFeature = (navigation: Nav) => {
  const routes = navigation.getState().routes;
  const first = routes.findIndex(route => route.name.startsWith('AwaADeux'));
  return first === -1 ? routes : routes.slice(0, first);
};

/** Where "AWA à deux" in the Profile leads: the connected screen when a partner is (demo-)connected, else the introduction. */
export const awaADeuxEntryRoute = (partnerConnected: boolean): 'AwaADeuxPartnerConnected' | 'AwaADeuxIntro' =>
  partnerConnected ? 'AwaADeuxPartnerConnected' : 'AwaADeuxIntro';

/** Frontend demo progression: shows "Partenaire associé" in place of the whole onboarding stack. */
export function replaceOnboardingWithConnected(navigation: Nav): void {
  const routes = navigation.getState().routes;
  if (routes[routes.length - 1]?.name === 'AwaADeuxPartnerConnected') {return;}
  const kept = routesBeforeFeature(navigation);
  navigation.dispatch(
    CommonActions.reset({index: kept.length, routes: [...kept, {name: 'AwaADeuxPartnerConnected'}]} as ResetState),
  );
}

/** After "Arrêter le partage": the onboarding stack rebuilt up to "Associer votre partenaire". */
export function rebuildStackToAssociation(navigation: Nav): void {
  const routes = navigation.getState().routes;
  if (routes[routes.length - 1]?.name === 'AwaADeuxPairing') {return;}
  const kept = routesBeforeFeature(navigation);
  const onboarding = ONBOARDING_ROUTES.map(name => (name === 'AwaADeuxSharing' ? {name, params: {mode: 'onboarding' as const}} : {name}));
  navigation.dispatch(
    CommonActions.reset({index: kept.length + onboarding.length - 1, routes: [...kept, ...onboarding]} as ResetState),
  );
}
