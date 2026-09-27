import {CommonActions, type NavigationProp} from '@react-navigation/native';

import type {RootStackParamList} from '../../navigation/AppNavigator';

// Navigation rules of the "AWA à deux" frontend flow (routes live in the root stack).
//
// Onboarding is ONE linear stack:
//   Intro → PartnerName → PartnerView → Benefits → Sharing (mode "onboarding") → Pairing
// "Continuer" on the association screen then pushes ONE demo step further, Pending
// (awaADeuxDemoStore's connectionStatus becomes 'pending') — the owner side stops there;
// the (simulated) partner accepting is a SEPARATE, partner-side demo journey
// (AwaADeuxInvitation → AwaADeuxAcceptInvitation → PartnerMainTabs) that never pushes
// anything onto the owner's stack. Once accepted, connectionStatus is 'connected' and the
// owner reaches "Partenaire associé" the same way she always reaches AWA à deux — through
// Profile (awaADeuxEntryRoute) — not through a reset of the onboarding history.
//
// "Arrêter le partage" (confirmed) still REBUILDS the onboarding stack up to the
// association screen (Back walks the steps in order), so nobody repeats the onboarding
// after simply stopping the sharing. This reset is idempotent, so a rapid double tap
// cannot leave duplicate screens; the Pending push below is guarded the same way.

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

/**
 * "Continuer" on the association screen: pushes the Pending step exactly once, even on a
 * rapid double tap (a plain `navigation.navigate` would push a second copy since Pending
 * isn't yet on the stack the first time either — the guard below covers both cases).
 */
export function advanceToPending(navigation: Nav): void {
  const routes = navigation.getState().routes;
  if (routes[routes.length - 1]?.name === 'AwaADeuxPending') {return;}
  navigation.dispatch(CommonActions.navigate('AwaADeuxPending'));
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
