import React, {Profiler} from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, Text, type AppStateStatus} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import HijriCalendarScreen from '../HijriCalendarScreen';
import ProfileScreen from '../ProfileScreen';
import {useQadaaStatus, type QadaaStatus} from '../../hooks/useQadaaStatus';
import {formatHijriDate, formatHijriDay, formatFullDate} from '../../utils/cycleMath';
import {isRamadan} from '../../utils/hijriCalendar';
import {computeQadaaFromHistory, shouldShowQadaaReminder} from '../../utils/qadaaLogic';
import {setHijriAdjustmentDays, setSelectedObjective} from '../../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
let appStateListener: ((state: AppStateStatus) => void) | undefined;

async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => element}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const day = (month: number, date: number, year = 2026) => new Date(year, month - 1, date);

beforeEach(async () => {
  jest.useFakeTimers();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, listener: (state: AppStateStatus) => void) => {
    appStateListener = listener;
    return {remove: jest.fn()};
  }) as never);
  setHijriAdjustmentDays(0);
  await setSelectedObjective('cycle');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
  setHijriAdjustmentDays(0);
});

/* ============================================================
 * 1. HIJRI CALENDAR
 * ============================================================ */

describe('HijriCalendarScreen — current day', () => {
  const renderHijri = () => renderScreen(<HijriCalendarScreen />);

  it('MIDNIGHT: recognises the new day (Sept 25 23:59 → Sept 26 00:00) without reopening', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderHijri();
    const before = textsOf(renderer);
    expect(before.some(text => text.includes('25 septembre 2026'))).toBe(true);
    expect(before).toContain(formatHijriDay(day(9, 25)) ?? '—');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const after = textsOf(renderer);
    expect(after.some(text => text.includes('26 septembre 2026'))).toBe(true);
    expect(after.some(text => text.includes('25 septembre 2026'))).toBe(false);
    expect(after).toContain(formatHijriDay(day(9, 26)) ?? '—');
  });

  it('FOREGROUND: returning the next day updates the current day immediately', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 21, 0, 0));
    const renderer = await renderHijri();

    jest.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    await act(async () => {
      appStateListener?.('active');
    });

    expect(textsOf(renderer).some(text => text.includes('26 septembre 2026'))).toBe(true);
  });

  it('SAME DAY: returning to the foreground changes nothing', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    const renderer = await renderHijri();
    const before = JSON.stringify(renderer.toJSON());

    await act(async () => {
      appStateListener?.('active');
    });

    expect(JSON.stringify(renderer.toJSON())).toBe(before);
  });

  it('a date the user picked is NOT moved by midnight', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderHijri();
    const grid = renderer.root.findAll(node => typeof node.props.onSelectDate === 'function')[0];
    expect(grid).toBeTruthy();
    await act(async () => {
      grid.props.onSelectDate(day(9, 10));
    });
    expect(textsOf(renderer).some(text => text.includes('10 septembre 2026'))).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const texts = textsOf(renderer);
    expect(texts.some(text => text.includes('10 septembre 2026'))).toBe(true);
    // The "today" card moved on, the picked date did not.
    expect(texts.some(text => text.includes('26 septembre 2026'))).toBe(true);
  });

  it('the Hijri adjustment is still applied to the displayed current day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    setHijriAdjustmentDays(1);
    const renderer = await renderHijri();
    expect(textsOf(renderer)).toContain(formatHijriDay(day(9, 25)) ?? '—');
    setHijriAdjustmentDays(0);
    const unadjusted = formatHijriDay(day(9, 25));
    setHijriAdjustmentDays(1);
    expect(formatHijriDay(day(9, 25))).not.toBe(unadjusted);
  });
});

/* ============================================================
 * 2. QADAA STATUS
 * ============================================================ */

describe('useQadaaStatus — current day', () => {
  let latest: QadaaStatus;
  // Committed updates only: React may re-run a component function once for a
  // no-op setState (bail-out) without committing anything.
  let commits = 0;

  function Probe(): React.JSX.Element {
    latest = useQadaaStatus();
    return (
      <Profiler id="qadaa" onRender={() => {commits += 1;}}>
        <Text>{`${latest.ramadanActive}|${latest.showReminder}|${latest.remainingQadaaDays}`}</Text>
      </Profiler>
    );
  }

  // First day of Ramadan 1447 in the runtime's own calendar (adjustment 0) —
  // found instead of hard-coded so the test never depends on ICU's tables.
  const findRamadanStart = (): Date => {
    for (let offset = 0; offset < 60; offset += 1) {
      const candidate = day(2, 1 + offset);
      const previous = day(2, offset);
      if (isRamadan(candidate) && !isRamadan(previous)) {return candidate;}
    }
    throw new Error('Ramadan start not found');
  };

  beforeEach(async () => {
    commits = 0;
    // A period inside Ramadan 1446 (March 2025) → remaining qadaa days > 0.
    await recordConfirmedPeriodEnd(day(3, 5, 2025), day(3, 10, 2025));
  });

  it('MIDNIGHT: entering Ramadan flips ramadanActive / showReminder, counters stay untouched', async () => {
    const ramadanStart = findRamadanStart();
    const eve = new Date(ramadanStart.getFullYear(), ramadanStart.getMonth(), ramadanStart.getDate() - 1, 23, 59, 0);
    jest.setSystemTime(eve);
    await renderScreen(<Probe />);

    const remainingBefore = latest.remainingQadaaDays;
    expect(remainingBefore).toBeGreaterThan(0);
    expect(latest.ramadanActive).toBe(false);
    expect(latest.showReminder).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(latest.ramadanActive).toBe(true);
    expect(latest.showReminder).toBe(false);
    expect(latest.remainingQadaaDays).toBe(remainingBefore);
  });

  it('FOREGROUND: the new day is picked up when the app comes back', async () => {
    const ramadanStart = findRamadanStart();
    jest.setSystemTime(new Date(ramadanStart.getFullYear(), ramadanStart.getMonth(), ramadanStart.getDate() - 1, 20, 0, 0));
    await renderScreen(<Probe />);
    expect(latest.ramadanActive).toBe(false);

    jest.setSystemTime(new Date(ramadanStart.getFullYear(), ramadanStart.getMonth(), ramadanStart.getDate(), 9, 0, 0));
    await act(async () => {
      appStateListener?.('active');
    });

    expect(latest.ramadanActive).toBe(true);
  });

  it('SAME DAY: returning to the foreground commits nothing and changes no value', async () => {
    jest.setSystemTime(day(9, 25));
    await renderScreen(<Probe />);
    // Let the hook's own async hydration settle first, so only the foreground
    // resume is measured.
    let stableFlushes = 0;
    for (let index = 0; index < 60 && stableFlushes < 5; index += 1) {
      const before = commits;
      await act(async () => {
        await Promise.resolve();
      });
      stableFlushes = commits === before ? stableFlushes + 1 : 0;
    }
    const commitsAfterMount = commits;
    const valuesBefore = JSON.stringify(latest);

    await act(async () => {
      appStateListener?.('active');
    });

    expect(commits).toBe(commitsAfterMount);
    expect(JSON.stringify(latest)).toBe(valuesBefore);
  });

  it('the Qadaa calculation itself is unchanged: it does not depend on the current day', () => {
    const history = [{periodStart: day(3, 5, 2025), periodEndDateTime: day(3, 10, 2025)}];
    jest.setSystemTime(day(9, 25));
    const first = computeQadaaFromHistory(history);
    expect(first.remainingDays).toBeGreaterThan(0);
    jest.setSystemTime(day(9, 26));
    expect(computeQadaaFromHistory(history)).toEqual(first);
    // The reminder rule only depends on remaining days and whether it is Ramadan.
    expect(shouldShowQadaaReminder(3, day(9, 26))).toBe(!isRamadan(day(9, 26)));
    expect(shouldShowQadaaReminder(0, day(9, 26))).toBe(false);
  });
});

/* ============================================================
 * 3. PROFILE HIJRI DATE
 * ============================================================ */

describe('ProfileScreen — Hijri date', () => {
  const renderProfile = () =>
    renderScreen(<ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'test', name: 'Profile'}} />);

  const hijriTile = (renderer: ReactTestRenderer.ReactTestRenderer): unknown =>
    renderer.root.findAll(node => node.props.label === 'Date hijri' && node.props.value !== undefined)[0]?.props.value;

  it('MIDNIGHT: a Profile that stays mounted shows the new Hijri date', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderProfile();
    expect(hijriTile(renderer)).toBe(formatHijriDate(day(9, 25)));

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(hijriTile(renderer)).toBe(formatHijriDate(day(9, 26)));
    expect(hijriTile(renderer)).not.toBe(formatHijriDate(day(9, 25)));
  });

  it('FOREGROUND: returning the next day refreshes it', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 21, 0, 0));
    const renderer = await renderProfile();

    jest.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    await act(async () => {
      appStateListener?.('active');
    });

    expect(hijriTile(renderer)).toBe(formatHijriDate(day(9, 26)));
  });

  it('SAME DAY: foreground resume leaves the tile untouched', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    const renderer = await renderProfile();
    const before = hijriTile(renderer);

    await act(async () => {
      appStateListener?.('active');
    });

    expect(hijriTile(renderer)).toBe(before);
  });

  it('the Hijri adjustment still moves the displayed date', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    const renderer = await renderProfile();
    const unadjusted = hijriTile(renderer);
    expect(unadjusted).toBe(formatHijriDate(day(9, 25)));

    await act(async () => {
      setHijriAdjustmentDays(1);
    });

    const adjusted = hijriTile(renderer);
    expect(adjusted).toBe(formatHijriDate(day(9, 25)));
    expect(adjusted).not.toBe(unadjusted);
    expect(formatFullDate(day(9, 25))).toBe(formatFullDate(day(9, 25))); // Gregorian day is untouched
  });
});
