import {useEffect, useState} from 'react';

// FRONTEND DEMO STATE of "AWA à deux": whether — and how far — a partner connection has
// progressed. The partner's NAME is not here: it is the user's own input
// (awaADeuxPartnerStore). There is no backend, no account and no real pairing: this is
// only a switch that lets the pending/connected screens be tried out. It is deliberately
// IN MEMORY ONLY — no AsyncStorage, no schema, no record anywhere — so it resets when the
// app restarts, which is expected for this phase. The sharing permissions are not here:
// they are the (already saved) choices of src/state/awaADeuxSharingStore.ts.
//
// Three states, one linear demo progression:
//   not_invited  — nothing sent yet (the association screen, "Associer votre partenaire").
//   pending      — "Continuer" simulated sending an invitation; waiting for an acceptance.
//   connected    — the invitation was (simulated as) accepted.
// The transition pending → connected only ever happens through an explicit action (the
// partner-preview "Accepter l'invitation" button) — never a timer, never automatically.

export type AwaADeuxDemoConnectionStatus = 'not_invited' | 'pending' | 'connected';

type DemoPartnerState = {
  connectionStatus: AwaADeuxDemoConnectionStatus;
  /**
   * Back-compat convenience for callers that only ever cared about "is a partner
   * connected" (Profile's entry route, the existing connected-screen tests): exactly
   * `connectionStatus === 'connected'`. Never read independently of connectionStatus by
   * new code — it is a derived projection, not a second source of truth.
   */
  partnerConnected: boolean;
};

const deriveState = (connectionStatus: AwaADeuxDemoConnectionStatus): DemoPartnerState => ({
  connectionStatus,
  partnerConnected: connectionStatus === 'connected',
});

let state: DemoPartnerState = deriveState('not_invited');
const listeners = new Set<() => void>();

const setState = (next: DemoPartnerState) => {
  state = next;
  listeners.forEach(listener => listener());
};

export const getDemoPartnerState = (): DemoPartnerState => state;

export const subscribeDemoPartner = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/** "Continuer" on the association screen (AwaADeuxPairingScreen): simulates sending the invitation. */
export const simulateInvitationSent = () => setState(deriveState('pending'));

/** "Annuler l'invitation" on AwaADeuxPendingScreen: back to not having invited anyone. */
export const cancelInvitation = () => setState(deriveState('not_invited'));

/** The invited partner's "Accepter l'invitation" (AwaADeuxAcceptInvitationScreen): pending → connected. */
export const simulatePartnerAccepted = () => setState(deriveState('connected'));

/**
 * Test / back-compat convenience: jumps straight from any state to 'connected', skipping
 * 'pending'. Existing tests and fixtures that only need "a partner is already connected"
 * (not the invitation mechanics themselves) use this; it is not called by the sharing UI.
 */
export const simulatePartnerConnected = () => setState(deriveState('connected'));

/** "Arrêter le partage" (frontend only, from the connected screen): back to not_invited. No backend action. */
export const stopDemoSharing = () => setState(deriveState('not_invited'));

export function useDemoPartner(): DemoPartnerState {
  const [current, setCurrent] = useState(getDemoPartnerState);
  useEffect(() => {
    setCurrent(getDemoPartnerState());
    return subscribeDemoPartner(() => setCurrent(getDemoPartnerState()));
  }, []);
  return current;
}
