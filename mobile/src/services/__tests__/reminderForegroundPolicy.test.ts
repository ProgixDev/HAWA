import {
  createForegroundResyncPolicy,
  currentTimeBasis,
  FOREGROUND_REFRESH_INTERVAL_MS,
} from '../reminderForegroundPolicy';

// Phase 2 — F14: what the foreground transition does about a changed time zone / clock and about long absences.
// Pure policy with an injected clock and zone: no storage, no native module, nothing about her location persisted.

function harness(initialBasis = 'Europe/Paris|-120') {
  let nowMs = Date.UTC(2026, 5, 1, 8, 0, 0);
  let basis = initialBasis;
  const policy = createForegroundResyncPolicy({now: () => nowMs, readBasis: () => basis});
  return {
    policy,
    advance: (ms: number) => {nowMs += ms;},
    setClock: (ms: number) => {nowMs = ms;},
    setBasis: (next: string) => {basis = next;},
    now: () => nowMs,
  };
}

const HOUR = 60 * 60 * 1000;

describe('onForeground', () => {
  it('right after the process started with nothing changed: nothing to do', () => {
    const h = harness();
    expect(h.policy.onForeground()).toBe('none');
  });

  it('several quick foregrounds inside the interval stay quiet', () => {
    const h = harness();
    for (let i = 0; i < 5; i += 1) {
      h.advance(30 * 60 * 1000);
      expect(h.policy.onForeground()).toBe('none');
    }
  });

  it('a changed time zone forces a full re-derivation (travel)', () => {
    const h = harness('Europe/Paris|-120');
    h.setBasis('America/Toronto|240');
    expect(h.policy.onForeground()).toBe('force');
  });

  it('a daylight-saving switch (same zone, new UTC offset) is detected too', () => {
    const h = harness('Europe/Paris|-60');
    h.setBasis('Europe/Paris|-120');
    expect(h.policy.onForeground()).toBe('force');
  });

  it('the change is reported ONCE: the next foreground is quiet again', () => {
    const h = harness('Europe/Paris|-120');
    h.setBasis('America/Toronto|240');
    expect(h.policy.onForeground()).toBe('force');
    expect(h.policy.onForeground()).toBe('none');
  });

  it('a clock set BACKWARDS (negative elapsed) forces a re-derivation', () => {
    const h = harness();
    h.advance(10 * 60 * 1000);
    h.setClock(h.now() - 3 * HOUR);
    expect(h.policy.onForeground()).toBe('force');
  });

  it('a long absence refreshes (window-based schedules are topped up) without forcing', () => {
    const h = harness();
    h.advance(FOREGROUND_REFRESH_INTERVAL_MS);
    expect(h.policy.onForeground()).toBe('refresh');
  });

  it('...and the refresh restarts the interval', () => {
    const h = harness();
    h.advance(FOREGROUND_REFRESH_INTERVAL_MS);
    expect(h.policy.onForeground()).toBe('refresh');
    h.advance(HOUR);
    expect(h.policy.onForeground()).toBe('none');
    h.advance(FOREGROUND_REFRESH_INTERVAL_MS);
    expect(h.policy.onForeground()).toBe('refresh');
  });

  it('a zone change wins over a long absence: it must force, not merely refresh', () => {
    const h = harness('Europe/Paris|-120');
    h.advance(24 * HOUR);
    h.setBasis('America/Toronto|240');
    expect(h.policy.onForeground()).toBe('force');
  });
});

describe('noteResync', () => {
  it('a resync done for another reason restarts the interval', () => {
    const h = harness();
    h.advance(FOREGROUND_REFRESH_INTERVAL_MS - 1000);
    h.policy.noteResync();
    h.advance(2000);
    expect(h.policy.onForeground()).toBe('none');
  });

  it('...and adopts the current zone so the same change is not forced a second time', () => {
    const h = harness('Europe/Paris|-120');
    h.setBasis('America/Toronto|240');
    h.policy.noteResync();
    expect(h.policy.onForeground()).toBe('none');
  });
});

describe('currentTimeBasis', () => {
  it('follows the UTC offset of the moment it is asked for', () => {
    const date = new Date(2026, 0, 15, 12, 0, 0);
    expect(currentTimeBasis(date)).toMatch(new RegExp(`\\|${date.getTimezoneOffset()}$`));
  });

  it('survives an engine without Intl zone support (offset only)', () => {
    const original = Intl.DateTimeFormat;
    (Intl as unknown as {DateTimeFormat: unknown}).DateTimeFormat = () => {
      throw new Error('no Intl');
    };
    try {
      const date = new Date(2026, 0, 15, 12, 0, 0);
      expect(currentTimeBasis(date)).toBe(`|${date.getTimezoneOffset()}`);
    } finally {
      (Intl as unknown as {DateTimeFormat: unknown}).DateTimeFormat = original;
    }
  });
});
