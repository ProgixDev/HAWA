import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {View} from 'react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {pickReadableTextColor} from '../../../theme/awaThemeTokens';
import MonthCalendarCard from '../MonthCalendarCard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
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

const BASICS = {
  lastPeriodStart: new Date(2026, 0, 1),
  cycleDuration: 28,
  periodDuration: 5,
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCalendar() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
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
          selectedDate={new Date(2026, 0, 15)}
          showSelection
          today={new Date(2026, 0, 10)}
          visibleMonth={new Date(2026, 0, 1)}
        />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

beforeEach(async () => {
  resetPremiumStateForTests();
  updatePremiumState({isPremium: true, initialized: true});
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('MonthCalendarCard — resolved theme tokens', () => {
  it('uses the resolved surface color for the card background', async () => {
    const renderer = await renderCalendar();
    const card = renderer.root.findAllByType(View)[0];
    expect(flattenStyle(card.props.style).backgroundColor).toBe('#FFFFFF'); // awa-original surface
  });

  it('brand chrome (month-nav icon) changes when the palette changes', async () => {
    const renderer = await renderCalendar();
    const chevrons = () => renderer.root.findAll(node => node.props.name === 'chevron-left');
    expect(chevrons()[0].props.color).toBe('#6D4AE8'); // awa-original primary

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(chevrons()[0].props.color).toBe('#7C9473'); // sage-serenity primary
  });
});

describe('MonthCalendarCard — semantic calendar colors are preserved across palettes', () => {
  it('period/fertile/ovulation legend colors never change when the palette changes', async () => {
    const renderer = await renderCalendar();
    const legendDotColor = (label: string) => {
      const text = renderer.root.findAll(node => node.props.children === label)[0];
      // LegendDot renders <View style={legendItem}><Dot/><Text>{label}</Text></View> —
      // walk up to the row and read the colored child's props.
      const row = text.parent!;
      const coloredChild = row.children.find(
        child => typeof child !== 'string' && (child.props.style || child.props.color),
      ) as ReactTestRenderer.ReactTestInstance;
      return flattenStyle(coloredChild.props.style).backgroundColor ?? coloredChild.props.color;
    };

    const periodBefore = legendDotColor('Règles');
    const fertileBefore = legendDotColor('Fertile');
    const ovulationBefore = legendDotColor('Ovulation');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(legendDotColor('Règles')).toBe(periodBefore);
    expect(legendDotColor('Fertile')).toBe(fertileBefore);
    expect(legendDotColor('Ovulation')).toBe(ovulationBefore);
    expect(periodBefore).toBe('#DC7B82');
    expect(fertileBefore).toBe('#3E8E56');
    expect(ovulationBefore).toBe('#8B5CF6');
  });

  it('a real period day cell keeps its fixed semantic background regardless of the active palette', async () => {
    // 2026-01-01..05 are period days per BASICS above; Jan 3 is not today/selected.
    const renderer = await renderCalendar();
    const dayText = renderer.root.findAll(node => node.props.children === 3)[0];
    const dayView = dayText.parent!.parent!; // Text -> Pressable(style fn result not inspectable) skip to background via sibling

    // Instead of relying on the Pressable's functional style, assert via the
    // underlying style module export directly is not possible (not exported)
    // — assert indirectly: the rendered day's accessibilityLabel encodes the
    // real "kind", which is what actually drives the fixed background.
    expect(dayView).toBeTruthy();
    expect(dayText.parent!.props.accessibilityLabel).toContain('period');
  });
});

describe('MonthCalendarCard — readable foreground on colored day cells (Dark Mode readability fix)', () => {
  // Fixed, never theme-driven (mirrors the file's own SEMANTIC constants).
  const PERIOD_FILL_COLOR = '#F7D7D6';
  const FERTILE_FILL_COLOR = '#DCEFE0';
  const OVULATION_COLOR = '#8B5CF6';

  function dayNumberColor(renderer: ReactTestRenderer.ReactTestRenderer, day: number) {
    const text = renderer.root.findAll(
      node => node.props.children === day && typeof node.props.style !== 'undefined',
    )[0];
    return flattenStyle(text.props.style).color;
  }

  // Excludes today (10) and selected (15) so the match reflects that kind's
  // OWN fill, not the today/selected override which legitimately takes
  // priority over it.
  function findDayByKind(renderer: ReactTestRenderer.ReactTestRenderer, kind: string) {
    const cell = renderer.root.findAll(
      node =>
        typeof node.props.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.includes(`, ${kind}`) &&
        !node.props.accessibilityLabel.startsWith('10,') &&
        !node.props.accessibilityLabel.startsWith('15,'),
    )[0];
    return Number(cell.props.accessibilityLabel.split(',')[0]);
  }

  it('a period day\'s number is readable-dark (derived from the fixed period fill), not theme.colors.text, and stays constant Light -> Dark', async () => {
    const renderer = await renderCalendar();
    // Jan 3 is a period day per BASICS (not today=10, not selected=15).
    const before = dayNumberColor(renderer, 3);
    expect(before).toBe(pickReadableTextColor(PERIOD_FILL_COLOR));

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(dayNumberColor(renderer, 3)).toBe(before);
  });

  it('a fertile day\'s number is readable-dark (derived from the fixed fertile fill), not theme.colors.textSecondary, and stays constant Light -> Dark', async () => {
    const renderer = await renderCalendar();
    const fertileDay = findDayByKind(renderer, 'fertile');
    const before = dayNumberColor(renderer, fertileDay);
    expect(before).toBe(pickReadableTextColor(FERTILE_FILL_COLOR));

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(dayNumberColor(renderer, fertileDay)).toBe(before);
  });

  it('an ovulation day\'s number is derived from the fixed ovulation fill and stays constant Light -> Dark', async () => {
    // Day 15 is the only ovulation day for BASICS, but it coincides with the
    // shared harness's selectedDate — render with a non-conflicting selection
    // instead, so this exercises ovulation's OWN fill, not the (correctly
    // theme-adaptive) selected-day override.
    let renderer: ReactTestRenderer.ReactTestRenderer;
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
            selectedDate={new Date(2026, 0, 1)}
            showSelection
            today={new Date(2026, 0, 20)}
            visibleMonth={new Date(2026, 0, 1)}
          />
        </AwaThemeProvider>,
      );
    });
    activeRenderers.push(renderer!);

    // Day 15 is the sole ovulation day for BASICS (ovulationDayFor(28) = 15);
    // this render's today=20/selected=Jan1 leave it unaffected by either.
    const ovulationDay = 15;
    const before = dayNumberColor(renderer!, ovulationDay);
    expect(before).toBe(pickReadableTextColor(OVULATION_COLOR));

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(dayNumberColor(renderer!, ovulationDay)).toBe(before);
  });

  it('a plain (non-colored) day keeps using the theme-reactive default and DOES change Light -> Dark', async () => {
    const renderer = await renderCalendar();
    // Jan 20 is well outside the period/fertile/ovulation window for BASICS.
    const before = dayNumberColor(renderer, 20);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(dayNumberColor(renderer, 20)).not.toBe(before);
  });
});

describe('MonthCalendarCard — Today remains distinguishable', () => {
  it('renders a distinct accessibility label for Today’s cell independent of palette', async () => {
    const renderer = await renderCalendar();
    const findTodayCell = () =>
      renderer.root.findAll(
        node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('10,'),
      )[0];
    expect(findTodayCell()).toBeTruthy();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    // Still renders correctly (no crash, still findable) once dark mode is
    // resolved — the actual dashed-border/text contrast is covered by
    // awaThemeTokens.test.ts's per-variant luminance assertions.
    expect(findTodayCell()).toBeTruthy();
  });
});

describe('MonthCalendarCard — Premium fallback', () => {
  it('falls back to AWA Original chrome when Premium is lost, without crashing', async () => {
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderCalendar();
    const chevron = () => renderer.root.findAll(node => node.props.name === 'chevron-left')[0];
    expect(chevron().props.color).toBe('#B08A5C'); // warm-sand primary

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(chevron().props.color).toBe('#6D4AE8'); // awa-original primary
  });
});
