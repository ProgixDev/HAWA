import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import IrregularCalendarContent from '../IrregularCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {saveIrregularJournalEntry} from '../../../state/irregularJournalStore';
import {deleteJournalSection, saveJournalSection} from '../../../state/dailyJournalStore';
import type {FlowIntensity} from '../../../types/journal';

// The SOPK calendar must tell apart "Non", "Spotting" and an ACTUAL period.
// "Non" and "Spotting" are both stored with flow.intensity 'none' — a non-empty
// string, which used to make them count as period days.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <IrregularCalendarContent />}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

// Icon glyphs render as private-use-area Text nodes - not user-visible copy.
const isGlyph = (text: string) => /^[-\u{F0000}-\u{FFFFF}]+$/u.test(text);
const visibleTextsIn = (node: ReactTestRenderer.ReactTestInstance): string[] =>
  node.findAllByType(Text).map(textOf).filter(text => !isGlyph(text));

/** The value rendered next to the "Règles" row of the selected-day card. */
const selectedRulesValue = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  for (const label of renderer.root.findAllByType(Text).filter(node => textOf(node) === 'Règles')) {
    const value = label.parent ? visibleTextsIn(label.parent).find(text => text !== 'Règles') : undefined;
    if (value) {return value;}
  }
  return undefined;
};

/** "Jours de règles" tile value of the monthly summary. */
const periodDaysTile = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  const label = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Jours de règles');
  return label?.parent ? visibleTextsIn(label.parent)[0] : undefined;
};

const todayCellLabel = (renderer: ReactTestRenderer.ReactTestRenderer): string => {
  const day = String(new Date().getDate());
  const cell = renderer.root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      (node.props.accessibilityLabel === day || node.props.accessibilityLabel.startsWith(`${day},`)),
  )[0];
  return cell?.props.accessibilityLabel as string;
};

const todayKey = () => new Date().toLocaleDateString('en-CA');
const FLOW: Record<string, FlowIntensity> = {Légère: 'light', Modérée: 'moderate'};

async function answerToday(status: 'yes' | 'no' | 'spotting', level = 'Modérée') {
  await saveJournalSection(todayKey(), 'flow', {intensity: status === 'yes' ? FLOW[level] : 'none'});
  await saveIrregularJournalEntry(
    todayKey(),
    'period',
    status === 'no' ? 'Non' : `${status === 'spotting' ? 'Spotting' : 'Oui'}${status === 'yes' ? ` · ${level}` : ''}`,
    {status, flowIntensity: status === 'yes' ? level : undefined},
  );
}

beforeEach(() => {
  resetPremiumStateForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await deleteJournalSection(todayKey(), 'flow');
});

describe('IrregularCalendarContent — Non / Spotting / actual period', () => {
  it('B. "Non": shown as "Non", NOT a period marker, NOT a period day in the month summary', async () => {
    await answerToday('no');
    const renderer = await renderCalendar();

    expect(selectedRulesValue(renderer)).toBe('Non');
    expect(todayCellLabel(renderer)).not.toContain('suivi enregistré');
    expect(periodDaysTile(renderer)).toBe('0');
  });

  it('C. "Spotting": stays "Spotting" — not a period marker, not a full period day', async () => {
    await answerToday('spotting');
    const renderer = await renderCalendar();

    expect(selectedRulesValue(renderer)).toBe('Spotting');
    expect(todayCellLabel(renderer)).not.toContain('suivi enregistré');
    expect(periodDaysTile(renderer)).toBe('0');
  });

  it('D. actual flow: period marker, real flow label, counted as a period day', async () => {
    await answerToday('yes', 'Modérée');
    const renderer = await renderCalendar();

    expect(selectedRulesValue(renderer)).toBe('Moyen');
    expect(todayCellLabel(renderer)).toContain('suivi enregistré');
    expect(periodDaysTile(renderer)).toBe('1');
  });

  it('a Non / Spotting day still counts as recorded data (not "Aucun suivi pour ce jour")', async () => {
    await answerToday('spotting');
    const renderer = await renderCalendar();
    expect(allTexts(renderer)).not.toContain('Aucun suivi pour ce jour');
  });

  it('switching Oui → Spotting removes the period marker and the period-day count', async () => {
    await answerToday('yes');
    const renderer = await renderCalendar();
    expect(periodDaysTile(renderer)).toBe('1');

    await act(async () => {
      await answerToday('spotting');
    });
    // the calendar re-reads the shared journal when focused again
    const fresh = await renderCalendar();
    expect(selectedRulesValue(fresh)).toBe('Spotting');
    expect(periodDaysTile(fresh)).toBe('0');
  });
});
