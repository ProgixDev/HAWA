import {useCallback, useEffect, useState} from 'react';

import {getPinLockoutRemainingMs, type PinScope} from '../../services/pinAttemptLimiter';

// What a PIN screen needs about the wait that follows repeated wrong entries: whether it is running, how long is left (counted down every second),
// and refresh() to re-read it after an entry. The wait itself lives in pinAttemptLimiter.ts (persisted, one counter per PIN).
export function usePinLockout(scope: PinScope) {
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (): Promise<number> => {
    const remaining = await getPinLockoutRemainingMs(scope);
    const at = Date.now();
    setNow(at);
    setDeadline(remaining > 0 ? at + remaining : 0);
    return remaining;
  }, [scope]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const remainingMs = Math.max(0, deadline - now);
  const locked = remainingMs > 0;

  useEffect(() => {
    if (!locked) {return undefined;}
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  return {locked, remainingMs, minutes: Math.max(1, Math.ceil(remainingMs / 60000)), refresh};
}
