import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {disablePrivateBiometry, enablePrivateBiometry, getBiometryType} from '../../services/privateSectionAuth';
import {setPrivateBiometricEnabled} from '../../state/securityPreferences';

// Turns the biometric unlock of the PRIVATE sections on or off from a switch, in place (the system biometric prompt confirms the change). It is
// its own setting and its own credential: it has nothing to do with the app lock's biometric switch (useBiometricToggle), and the private PIN
// stays the fallback.
export function usePrivateBiometricToggle(onChanged: () => void) {
  const {t} = useTranslation();
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBiometryType().then(type => setAvailable(Boolean(type))).catch(() => {});
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
      const ok = value ? await enablePrivateBiometry() : await disablePrivateBiometry();
      if (ok) {
        await setPrivateBiometricEnabled(value);
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

  return {error, toggle};
}
