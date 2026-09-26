import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MenopauseStatisticsScreen from '../MenopauseStatisticsScreen';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setMenopauseLabTracking} from '../../../state/menopausePreferences';
import {
  addMenopauseLabResult,
  clearMenopauseJournalFields,
  deleteMenopauseLabResult,
  getMenopauseLabResults,
  saveMenopauseJournalField,
} from '../../../state/menopauseJournalStore';

// M28 — a period holding lab results but no daily journal entry is NOT empty.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderStats() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Stats">{() => <MenopauseStatisticsScreen />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const EMPTY = 'Pas encore assez de données';
const LAB_ONLY = 'Aucun suivi quotidien sur cette période';
const LAB_CARD = 'Historique des analyses';
const JOURNAL_CARD = 'Aperçu';

const selectPeriod = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === label),
  );
  await act(async () => {
    button.props.onPress();
  });
  await settle();
};

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 20, 30, 0)});
  resetPremiumStateForTests();
  await setMenopauseLabTracking('fsh');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

// Module-level stores persist for the whole file: the scenarios are ordered.
describe('MenopauseStatisticsScreen — lab-only periods (M28)', () => {
  it('NEITHER symptoms nor labs: the empty state is shown', async () => {
    const renderer = await renderStats();
    const texts = textsOf(renderer);
    expect(texts).toContain(EMPTY);
    expect(texts).not.toContain(LAB_CARD);
    expect(texts).not.toContain(JOURNAL_CARD);
  });

  it('LABS ONLY: the period is not presented as empty; the real lab data is shown, no symptom data is invented', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 44, unit: 'UI/L', date: '2026-09-20'});
    const renderer = await renderStats();
    const texts = textsOf(renderer);

    expect(texts).not.toContain(EMPTY);
    expect(texts).toContain(LAB_ONLY);
    expect(texts).toContain(LAB_CARD);
    expect(texts).toContain('FSH — 1 résultat');
    expect(texts.some(text => text.includes('44 UI/L'))).toBe(true);
    // no fabricated journal cards / zero-value tiles
    expect(texts).not.toContain(JOURNAL_CARD);
    expect(texts).not.toContain('Jours suivis');
    expect(texts).not.toContain('Symptômes les plus fréquents');
  });

  it('BOTH: journal cards and the lab card are shown, without the lab-only notice', async () => {
    await saveMenopauseJournalField('2026-09-21', 'symptoms', ['hot_flashes']);
    const renderer = await renderStats();
    const texts = textsOf(renderer);

    expect(texts).not.toContain(EMPTY);
    expect(texts).not.toContain(LAB_ONLY);
    expect(texts).toContain(JOURNAL_CARD);
    expect(texts).toContain('Symptômes les plus fréquents');
    expect(texts).toContain(LAB_CARD);
  });

  it('SYMPTOMS ONLY: journal cards are shown and the empty state is not', async () => {
    const lab = getMenopauseLabResults('fsh')[0];
    await deleteMenopauseLabResult(lab.id);
    const renderer = await renderStats();
    const texts = textsOf(renderer);

    expect(texts).not.toContain(EMPTY);
    expect(texts).not.toContain(LAB_ONLY);
    expect(texts).toContain(JOURNAL_CARD);
    expect(texts).toContain('Jours suivis');
  });

  it('period selection is respected: a lab older than 1 month is empty on 1 mois but shown on 3 mois', async () => {
    await clearMenopauseJournalFields('2026-09-21', ['symptoms']);
    await addMenopauseLabResult({type: 'fsh', value: 33, date: '2026-07-01'});
    updatePremiumState({isPremium: true});

    const renderer = await renderStats();
    // 1 mois (default): the July result is outside the window
    expect(textsOf(renderer)).toContain(EMPTY);
    expect(textsOf(renderer)).not.toContain(LAB_CARD);

    await selectPeriod(renderer, '3 mois');
    const texts = textsOf(renderer);
    expect(texts).not.toContain(EMPTY);
    expect(texts).toContain(LAB_ONLY);
    expect(texts).toContain('FSH — 1 résultat');
  });

  it('calendar-day window: a lab dated exactly one month ago is included even late in the day (H3 consistency)', async () => {
    // now = 2026-09-25 20:30; one month back = 2026-08-25. The sample date is anchored at noon,
    // which the old time-of-day cutoff (Aug 25 20:30) wrongly excluded.
    await addMenopauseLabResult({type: 'fsh', value: 55, date: '2026-08-25'});
    const renderer = await renderStats();
    expect(textsOf(renderer)).toContain('FSH — 1 résultat');
    expect(textsOf(renderer).some(text => text.includes('55'))).toBe(true);
  });
});
