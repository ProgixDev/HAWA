import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MonthCalendarCard from '../MonthCalendarCard';
import {calendarDayKindFor, computeCyclePredictionStatus, type RecordedPeriod} from '../../../utils/cycleMath';
import type {CalendarFilters} from '../../../state/calendarFilters';

// M9 — navigating backwards: recorded periods stay painted, unrecorded
// predictions do not; the current and future prediction is unchanged.
const FILTERS: CalendarFilters = {
  rules: true,
  symptoms: true,
  mood: true,
  notes: true,
  activity: true,
  sleep: true,
  hydration: true,
  intimacy: true,
};
const BASICS = {lastPeriodStart: new Date(2026, 8, 1), cycleDuration: 28, periodDuration: 5};
const TODAY = new Date(2026, 8, 3);
const RECORDED: RecordedPeriod[] = [
  {startDate: '2026-08-04', endDate: '2026-08-08'},
  {startDate: '2026-09-01', endDate: '2026-09-05'},
];
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

async function renderMonth(visibleMonth: Date) {
  const status = computeCyclePredictionStatus(BASICS, 'yes', RECORDED.map(p => new Date(`${p.startDate}T12:00:00`)), null, TODAY);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <MonthCalendarCard
          basics={BASICS}
          displayMode="gregorian"
          filters={FILTERS}
          journalFlagsByDate={{}}
          onChangeDisplayMode={() => {}}
          onChangeMonth={() => {}}
          onSelectDate={() => {}}
          resolveKind={date => calendarDayKindFor(date, BASICS, status, RECORDED, TODAY)}
          selectedDate={TODAY}
          showSelection={false}
          today={TODAY}
          visibleMonth={visibleMonth}
        />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const kindOfDay = (renderer: ReactTestRenderer.ReactTestRenderer, dayOfMonth: number): string => {
  const cell = renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith(`${dayOfMonth}, `),
  )[0];
  return (cell.props.accessibilityLabel as string).split(', ')[1];
};

describe('Calendar past months', () => {
  it('August (past): the recorded period is painted, the projected fertile window / ovulation are not', async () => {
    const renderer = await renderMonth(new Date(2026, 7, 1));
    expect(kindOfDay(renderer, 5)).toBe('period');
    expect(kindOfDay(renderer, 14)).toBe('normal');
    expect(kindOfDay(renderer, 18)).toBe('normal');
  });

  it('July (older, never recorded): nothing is painted retroactively', async () => {
    const renderer = await renderMonth(new Date(2026, 6, 1));
    for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
      expect(kindOfDay(renderer, dayOfMonth)).toBe('normal');
    }
  });

  it('September (current): unchanged — recorded period, fertile window, ovulation, then the next projected period', async () => {
    const renderer = await renderMonth(new Date(2026, 8, 1));
    expect(kindOfDay(renderer, 2)).toBe('period');
    expect(kindOfDay(renderer, 12)).toBe('fertile');
    expect(kindOfDay(renderer, 15)).toBe('ovulation');
    expect(kindOfDay(renderer, 29)).toBe('period');
  });
});
