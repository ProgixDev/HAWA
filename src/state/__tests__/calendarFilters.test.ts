import {DEFAULT_CALENDAR_FILTERS, type CalendarFilterKey} from '../calendarFilters';

describe('calendarFilters — Cycle Calendar Temperature/Weight removal', () => {
  it('no longer exposes "temperature" or "weight" as a Cycle Calendar filter key', () => {
    expect(Object.keys(DEFAULT_CALENDAR_FILTERS)).not.toContain('temperature');
    expect(Object.keys(DEFAULT_CALENDAR_FILTERS)).not.toContain('weight');
  });

  it('keeps every other pre-existing filter enabled by default, unaffected by the removal', () => {
    const remainingKeys: CalendarFilterKey[] = ['rules', 'symptoms', 'mood', 'notes', 'activity', 'sleep', 'hydration', 'intimacy'];
    remainingKeys.forEach(key => {
      expect(DEFAULT_CALENDAR_FILTERS[key]).toBe(true);
    });
    expect(Object.keys(DEFAULT_CALENDAR_FILTERS)).toHaveLength(remainingKeys.length);
  });
});
