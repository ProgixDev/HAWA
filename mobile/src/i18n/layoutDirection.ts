import {I18nManager} from 'react-native';

// Layout direction: no AWA language is right-to-left. A previous build stored a forced direction natively (I18nManager.forceRTL /
// allowRTL are persisted by React Native and only take effect at the NEXT cold start): allowRTL(false) for every language and
// forceRTL(true) for the since-removed Hebrew. Called once at startup, this puts both flags back to React Native's defaults
// (allowRTL true, no forced direction), so a user who had Hebrew selected gets a left-to-right layout from the next launch on and
// everyone else behaves exactly as before that build.
export function restoreDefaultLayoutDirection(): void {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(false);
  } catch {
    // keep the direction React Native already has
  }
}
