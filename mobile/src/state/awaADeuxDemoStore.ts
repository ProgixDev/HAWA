import {useEffect, useState} from 'react';

// FRONTEND DEMO STATE of "AWA à deux": whether a partner is "connected". The partner's NAME is not here: it is the user's own input (awaADeuxPartnerStore).
//
// There is no backend, no account and no pairing: this is only a switch that lets the
// connected-partner screens be tried out (it is set by the __DEV__-only "Simuler
// l'association" button). It is deliberately IN MEMORY ONLY — no AsyncStorage, no
// schema, no record anywhere — so it resets when the app restarts, which is expected
// for this phase. The sharing permissions are not here: they are the (already saved)
// choices of src/state/awaADeuxSharingStore.ts.

type DemoPartnerState = {
  partnerConnected: boolean;
};

let state: DemoPartnerState = {partnerConnected: false};
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

/** DEV / DEMO only: pretends a partner has just been associated. Nothing is sent or stored. */
export const simulatePartnerConnected = () => setState({partnerConnected: true});

/** "Arrêter le partage" (frontend only): back to "not connected". No backend action. */
export const stopDemoSharing = () => setState({partnerConnected: false});

export function useDemoPartner(): DemoPartnerState {
  const [current, setCurrent] = useState(getDemoPartnerState);
  useEffect(() => {
    setCurrent(getDemoPartnerState());
    return subscribeDemoPartner(() => setCurrent(getDemoPartnerState()));
  }, []);
  return current;
}
