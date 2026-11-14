import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, Text} from 'react-native';

import {JOURNAL_MAX_DAYS_BACK, useJournalDay} from '../useJournalDay';

// The day a journal entry edits (Mood, Sleep): today by default, or one of the previous days. It is built on useToday(), so it must follow
// midnight and never go past today / more than JOURNAL_MAX_DAYS_BACK days back. Behaviour of the real hook, real fake clock (only timers + Date).

let latest: ReturnType<typeof useJournalDay>;
function Probe(): React.JSX.Element {
  latest = useJournalDay();
  return <Text>{latest.dayKey}</Text>;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((() => ({remove: jest.fn()})) as never);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function mount(now: Date) {
  jest.setSystemTime(now);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  return renderer;
}

describe('useJournalDay', () => {
  it('starts on today, as a local YYYY-MM-DD key, with no way forward', async () => {
    const renderer = await mount(new Date(2026, 9, 15, 15, 0, 0));
    expect(latest.dayKey).toBe('2026-10-15');
    expect(latest.isToday).toBe(true);
    expect(latest.canGoNext).toBe(false);
    expect(latest.canGoPrevious).toBe(true);
    act(() => renderer.unmount());
  });

  it('goes back one day at a time, comes forward again, and exposes the days the arrows lead to', async () => {
    const renderer = await mount(new Date(2026, 9, 15, 15, 0, 0));
    act(() => latest.goPrevious());
    expect(latest.dayKey).toBe('2026-10-14');
    expect(latest.isToday).toBe(false);
    expect(latest.canGoNext).toBe(true);
    expect(latest.previousDay.toLocaleDateString('en-CA')).toBe('2026-10-13');
    expect(latest.nextDay.toLocaleDateString('en-CA')).toBe('2026-10-15');
    act(() => latest.goNext());
    expect(latest.dayKey).toBe('2026-10-15');
    act(() => latest.goNext());
    expect(latest.dayKey).toBe('2026-10-15'); // never past today
    act(() => renderer.unmount());
  });

  it(`stops ${JOURNAL_MAX_DAYS_BACK} days back`, async () => {
    const renderer = await mount(new Date(2026, 9, 15, 15, 0, 0));
    for (let step = 0; step < JOURNAL_MAX_DAYS_BACK + 5; step += 1) {
      act(() => latest.goPrevious());
    }
    expect(latest.dayKey).toBe('2026-09-15');
    expect(latest.canGoPrevious).toBe(false);
    act(() => renderer.unmount());
  });

  it('crosses a month and a year boundary correctly', async () => {
    const renderer = await mount(new Date(2027, 0, 2, 9, 0, 0));
    act(() => latest.goPrevious());
    act(() => latest.goPrevious());
    expect(latest.dayKey).toBe('2026-12-31');
    act(() => renderer.unmount());
  });

  it('follows midnight while the app stays open: the edited day moves to the new day (23:59 → 00:00)', async () => {
    const renderer = await mount(new Date(2026, 9, 15, 23, 59, 0));
    expect(latest.dayKey).toBe('2026-10-15');
    await act(async () => {
      jest.advanceTimersByTime(60_000 + 1_000);
    });
    expect(latest.dayKey).toBe('2026-10-16');
    expect(latest.isToday).toBe(true);
    act(() => renderer.unmount());
  });

  it('a previous day chosen before midnight stays the same number of days back after midnight (the offset is kept, so the edited date moves with today)', async () => {
    const renderer = await mount(new Date(2026, 9, 15, 23, 59, 0));
    act(() => latest.goPrevious());
    expect(latest.dayKey).toBe('2026-10-14');
    await act(async () => {
      jest.advanceTimersByTime(60_000 + 1_000);
    });
    expect(latest.dayKey).toBe('2026-10-15');
    expect(latest.isToday).toBe(false);
    act(() => renderer.unmount());
  });
});
