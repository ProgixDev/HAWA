import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {
  disableBiometricCredential,
  enableBiometricCredential,
  getAvailableBiometry,
} from '../../services/appSecurityService';
import {setBiometricEnabled} from '../../state/securityPreferences';

// Turns the biometric unlock on or off from a switch, in place (the system biometric prompt confirms the change). Shared by the
// "Verrouillage de l'appli" settings and the onboarding "Protège ton espace" screen so both behave the same way.
export function useBiometricToggle(onChanged: () => void) {
  const {t} = useTranslation();
  const [label, setLabel] = useState(t('biometrics.genericLabel'));
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAvailableBiometry().then(value => {
      setAvailable(Boolean(value));
      if (value) {setLabel(value.label);}
    }).catch(() => {});
  }, []);

  const toggle = useCallback(async (value: boolean) => {
    if (busy) {return;}
    if (value && !available) {
      setError(t('faceIdSetup.noCapability'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = value ? await enableBiometricCredential() : await disableBiometricCredential();
      if (ok) {
        await setBiometricEnabled(value);
      } else {
        setError(t('faceIdSetup.authFailedOrCancelled'));
      }
    } catch {
      setError(t('security.authCancelledOrUnavailable'));
    } finally {
      onChanged();
      setBusy(false);
    }
  }, [available, busy, onChanged, t]);

  return {label, error, toggle};
}
