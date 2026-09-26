import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, Text, type AppStateStatus} from 'react-native';

import {localDayKey, msUntilNextLocalMidnight, useToday} from '../useToday';

let appStateListener: ((state: AppStateStatus) => void) | undefined;
const removeListener = jest.fn();

let renderCount = 0;
let latest: ReturnType<typeof useToday>;

function Probe(): React.JSX.Element {
  latest = useToday();
  renderCount += 1;
  return <Text>{latest.todayKey}</Text>;
}

beforeEach(() => {
  jest.useFakeTimers();
  renderCount = 0;
  appStateListener = undefined;
  removeListener.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, listener: (state: AppStateStatus) => void) => {
    appStateListener = listener;
    return {remove: removeListener};
  }) as never);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('msUntilNextLocalMidnight', () => {
  it('returns the time left until the next local midnight', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 25, 23, 59, 0))).toBe(60_000);
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 25, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });
});

describe('useToday — day rollover', () => {
  it('moves to the new day when midnight passes while the app stays open (23:59 → 00:00)', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    expect(latest.todayKey).toBe('2026-09-25');
    expect(latest.today.getTime()).toBe(new Date(2026, 8, 25).getTime());
    const firstToday = latest.today;

    await act(async () => {
      jest.advanceTimersByTime(60_000 + 1_000);
    });

    expect(latest.todayKey).toBe('2026-09-26');
    expect(latest.today.getTime()).toBe(new Date(2026, 8, 26).getTime());
    expect(latest.today).not.toBe(firstToday);
    act(() => renderer.unmount());
  });

  it('keeps the SAME today identity while the day does not change (no render loop)', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 10, 0, 0));
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    const firstToday = latest.today;
    const rendersAfterMount = renderCount;

    await act(async () => {
      jest.advanceTimersByTime(3 * 60 * 60 * 1000);
    });

    expect(latest.today).toBe(firstToday);
    expect(renderCount).toBe(rendersAfterMount);
    act(() => renderer.unmount());
  });

  it('refreshes when the app returns to the foreground after the day changed while backgrounded', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 22, 0, 0));
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    expect(latest.todayKey).toBe('2026-09-25');

    // Simulates JS timers being frozen while the app sits in the background:
    // the clock jumps a day without any timer firing.
    jest.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    expect(latest.todayKey).toBe('2026-09-25');

    await act(async () => {
      appStateListener?.('active');
    });

    expect(latest.todayKey).toBe('2026-09-26');
    act(() => renderer.unmount());
  });

  it('does nothing on foreground when the day is unchanged', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    const firstToday = latest.today;
    const rendersAfterMount = renderCount;

    await act(async () => {
      appStateListener?.('active');
    });

    expect(latest.today).toBe(firstToday);
    expect(renderCount).toBe(rendersAfterMount);
    act(() => renderer.unmount());
  });

  it('cleans up its timer and AppState subscription on unmount', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });

    // The hook's own wake-up timer: the only setTimeout with a multi-minute delay.
    const hookTimerIndex = setTimeoutSpy.mock.calls.map(call => call[1] as number).lastIndexOf(30 * 60 * 1000);
    expect(hookTimerIndex).toBeGreaterThanOrEqual(0);
    const hookTimerId = setTimeoutSpy.mock.results[hookTimerIndex].value;

    act(() => renderer.unmount());

    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(hookTimerId);
  });
});

describe('localDayKey', () => {
  it('uses the local calendar day (never a UTC slice)', () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
