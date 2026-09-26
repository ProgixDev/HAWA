import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import SummaryScreen from '../SummaryScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {getMiscarriagePreferences, setMiscarriagePreferences} from '../../state/miscarriagePreferences';
import {CYCLE_RETURN_DATE_TO_CHECK} from '../../utils/lossDateValidation';

// M36 - a LEGACY invalid stored cycle-return date (future / before the loss /
// unparsable) is never displayed as a date by Profile or Summary: the same
// canonical check and wording as the Dashboard, and the stored value is kept.
// Today is pinned to 2026-09-26; the loss date is 2026-09-10.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const LOSS_DATE = '2026-09-10';

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

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
  await settle();
  return renderer;
}

const renderProfile = () =>
  renderScreen(<ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'p', name: 'Profile'}} />);
const renderSummary = () =>
  renderScreen(<SummaryScreen navigation={{navigate: jest.fn(), push: jest.fn(), reset: jest.fn(), goBack: jest.fn()} as never} route={{key: 's', name: 'Summary'} as never} />);

/** The value shown next to `label` in the rendered text order: Profile's
 * StatCard renders the value BEFORE its label, Summary's rows AFTER it (icon
 * glyphs - private-use characters - are skipped). */
const valueFor = (renderer: ReactTestRenderer.ReactTestRenderer, label: string, where: 'before' | 'after'): string | undefined => {
  const texts = textsOf(renderer);
  const index = texts.indexOf(label);
  if (index < 0) {return undefined;}
  const isGlyph = (text: string) => /^[-\u{F0000}-\u{FFFFD}]+$/u.test(text);
  return where === 'after'
    ? texts.slice(index + 1).find(text => !isGlyph(text))
    : texts.slice(0, index).reverse().find(text => !isGlyph(text));
};

const seed = async (cycleReturnDate: string | null, status: 'yes' | 'no' = 'yes') => {
  await setMiscarriagePreferences({
    ...getMiscarriagePreferences(),
    miscarriageDate: LOSS_DATE,
    bleedingStatus: 'no',
    cycleReturnStatus: status,
    firstReturnedPeriodDate: cycleReturnDate,
    tryingAgainStatus: 'not_now',
  });
};

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
  resetPremiumStateForTests();
  await setSelectedObjective('loss');
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

const PROFILE_LABEL = 'Date du retour des règles';
const SUMMARY_LABEL = 'Premières règles revenues';

describe.each([
  ['Profile', renderProfile, PROFILE_LABEL, 'before'],
  ['Summary', renderSummary, SUMMARY_LABEL, 'after'],
] as const)('%s - stored cycle-return date', (_name, render, label, where) => {
  it('a VALID date (after the loss, not in the future) is displayed as a date', async () => {
    await seed('2026-09-20');
    const renderer = await render();
    const value = valueFor(renderer, label, where);
    expect(value).toBeDefined();
    expect(value).not.toBe(CYCLE_RETURN_DATE_TO_CHECK);
    expect(value).toMatch(/20/);
  });

  it('a legacy FUTURE date shows "Date à vérifier" and never the date', async () => {
    await seed('2026-10-20');
    const renderer = await render();
    expect(valueFor(renderer, label, where)).toBe(CYCLE_RETURN_DATE_TO_CHECK);
    expect(textsOf(renderer).some(text => /20 octobre/i.test(text))).toBe(false);
    // Kept exactly as stored.
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-10-20');
  });

  it('a legacy date BEFORE the loss shows "Date à vérifier"', async () => {
    await seed('2026-09-01');
    const renderer = await render();
    expect(valueFor(renderer, label, where)).toBe(CYCLE_RETURN_DATE_TO_CHECK);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-01');
  });

  it('an unparsable legacy value shows "Date à vérifier" and is kept', async () => {
    await seed('not-a-date');
    const renderer = await render();
    expect(valueFor(renderer, label, where)).toBe(CYCLE_RETURN_DATE_TO_CHECK);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('not-a-date');
  });

  it('no stored date (or an answer other than "yes") shows no date row', async () => {
    await seed(null);
    const renderer = await render();
    expect(textsOf(renderer)).not.toContain(label);
  });
});
