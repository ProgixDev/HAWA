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
//   not_invited  — nothing sent yet (the invite screen, "Inviter votre partenaire").
//   pending      — "Envoyer l'invitation" simulated sending an invitation by email;
//                  waiting for an acceptance. partnerEmail holds the address it was
//                  (simulated as) sent to.
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
  /** The address the (simulated) invitation email was sent to; null while not_invited. */
  partnerEmail: string | null;
};

const deriveState = (connectionStatus: AwaADeuxDemoConnectionStatus, partnerEmail: string | null): DemoPartnerState => ({
  connectionStatus,
  partnerConnected: connectionStatus === 'connected',
  partnerEmail,
});

let state: DemoPartnerState = deriveState('not_invited', null);
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

/** "Envoyer l'invitation" on the invite screen (AwaADeuxPairingScreen): simulates sending the invitation email. */
export const simulateInvitationSent = (email: string) => setState(deriveState('pending', email));

/** "Annuler l'invitation" on AwaADeuxPendingScreen: back to not having invited anyone. */
export const cancelInvitation = () => setState(deriveState('not_invited', null));

/** The invited partner's "Accepter l'invitation" (AwaADeuxAcceptInvitationScreen): pending → connected. */
export const simulatePartnerAccepted = () => setState(deriveState('connected', state.partnerEmail));

/**
 * Test / back-compat convenience: jumps straight from any state to 'connected', skipping
 * 'pending'. Existing tests and fixtures that only need "a partner is already connected"
 * (not the invitation mechanics themselves) use this; it is not called by the sharing UI.
 */
export const simulatePartnerConnected = () => setState(deriveState('connected', state.partnerEmail));

/** "Arrêter le partage" (frontend only, from the connected screen): back to not_invited. No backend action. */
export const stopDemoSharing = () => setState(deriveState('not_invited', null));

export function useDemoPartner(): DemoPartnerState {
  const [current, setCurrent] = useState(getDemoPartnerState);
  useEffect(() => {
    setCurrent(getDemoPartnerState());
    return subscribeDemoPartner(() => setCurrent(getDemoPartnerState()));
  }, []);
  return current;
}
