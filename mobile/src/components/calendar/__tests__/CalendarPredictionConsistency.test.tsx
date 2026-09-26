import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MonthCalendarCard from '../MonthCalendarCard';
import SelectedDayCard from '../SelectedDayCard';
import {calendarDayKindFor, computeCyclePredictionStatus, type RecordedPeriod} from '../../../utils/cycleMath';
import type {CalendarFilters} from '../../../state/calendarFilters';

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

// Same fixture as the Dashboard tests: last period Sept 1, 28-day cycle.
const BASICS = {lastPeriodStart: new Date(2026, 8, 1), cycleDuration: 28, periodDuration: 5};
const TODAY = new Date(2026, 8, 3);
const RECORDED: RecordedPeriod[] = [{startDate: '2026-09-01', endDate: '2026-09-05'}];

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

async function renderMonth(regularity: 'yes' | 'no') {
  const status = computeCyclePredictionStatus(BASICS, regularity, [new Date(2026, 8, 1)], null, TODAY);
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
          resolveKind={date => calendarDayKindFor(date, BASICS, status, RECORDED)}
          selectedDate={TODAY}
          showSelection={false}
          today={TODAY}
          visibleMonth={new Date(2026, 8, 1)}
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

describe('Calendar cells follow the same prediction the Dashboard shows', () => {
  it('REGULAR cycle: the precise projection is painted (period, fertile window, ovulation)', async () => {
    const renderer = await renderMonth('yes');
    expect(kindOfDay(renderer, 2)).toBe('period');
    expect(kindOfDay(renderer, 12)).toBe('fertile');
    expect(kindOfDay(renderer, 15)).toBe('ovulation');
  });

  it('IRREGULAR cycle: only the recorded period is painted — no projected fertile window / ovulation as if certain', async () => {
    const renderer = await renderMonth('no');
    expect(kindOfDay(renderer, 2)).toBe('period'); // recorded
    expect(kindOfDay(renderer, 12)).toBe('normal');
    expect(kindOfDay(renderer, 15)).toBe('normal');
    expect(kindOfDay(renderer, 29)).toBe('normal'); // the modulo projection's "next period"
  });
});

describe('SelectedDayCard — no invented phase', () => {
  const baseProps = {
    date: new Date(2026, 8, 15),
    entry: undefined,
    filters: FILTERS,
    onEditPeriod: () => {},
    periodDuration: 5,
    periodEndDate: new Date(2026, 8, 5),
    periodStartDate: new Date(2026, 8, 1),
  };

  const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAll(node => (node.type as unknown) === 'Text').map(node =>
      Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children),
    );

  async function renderCard(extra: {cycleDay?: number; phase?: 'menstruation' | 'follicular'}) {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AwaThemeProvider>
          <SelectedDayCard {...baseProps} {...extra} />
        </AwaThemeProvider>,
      );
    });
    activeRenderers.push(renderer);
    return renderer;
  }

  it('shows the phase and cycle day when they can be derived', async () => {
    const texts = textsOf(await renderCard({cycleDay: 15, phase: 'follicular'}));
    expect(texts).toContain('Jour 15 du cycle');
    expect(texts).toContain('Phase folliculaire');
  });

  it('shows a neutral "not estimated" row and no cycle-day badge when they cannot', async () => {
    const texts = textsOf(await renderCard({}));
    expect(texts).toContain('Phase non estimée');
    expect(texts.some(text => text.startsWith('Jour '))).toBe(false);
    expect(texts).not.toContain('Phase folliculaire');
  });
});
