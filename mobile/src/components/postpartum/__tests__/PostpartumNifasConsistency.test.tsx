import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PostpartumDashboard from '../PostpartumDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setSpiritualMarkersEnabled} from '../../../state/onboardingPreferences';
import {confirmDelivery} from '../../../state/postpartumPreferences';
import {
  markPostpartumLochiaEnded,
  reopenPostpartumLochiaTracking,
  savePostpartumLochiaEntry,
} from '../../../state/postpartumLochiaStore';
import {
  NIFAS_REFERENCE_APPROACHING_HEADLINE,
  NIFAS_REFERENCE_DAYS,
  NIFAS_REFERENCE_REACHED_HEADLINE,
  NIFAS_WARNING_DAYS,
} from '../../../config/nifasReminderConfig';
import {getNifasReminderStatus} from '../../../utils/postpartumTrackingUtils';
import {addDays} from '../../../utils/cycleMath';

// E — the Nifas banner (SpiritualGuidanceCard) and the completion popup are two
// presentations of ONE state, getNifasReminderStatus(). No religious rule is
// asserted here: only that the thresholds already encoded in the project
// (NIFAS_WARNING_DAYS / NIFAS_REFERENCE_DAYS) and the lochia state produce the
// SAME answer for both.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

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

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PostpartumDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
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

/** The banner shows its headline in a Text; the popup title is inside the Modal. */
const bannerTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const texts = textsOf(renderer);
  return {
    present: texts.includes('Repère du nifas'),
    reached: texts.includes(`${NIFAS_REFERENCE_REACHED_HEADLINE}.`),
    approaching: texts.includes(`${NIFAS_REFERENCE_APPROACHING_HEADLINE}.`),
  };
};
const modalVisible = (renderer: ReactTestRenderer.ReactTestRenderer): boolean =>
  renderer.root.findAllByType(Modal).some(modal => modal.props.visible === true);

const dayKey = (date: Date) => date.toLocaleDateString('en-CA');
/** postpartum day N ⇒ delivery date = today − (N − 1) */
const deliveredForDay = (day: number) => confirmDelivery(addDays(new Date(), -(day - 1)));

beforeEach(async () => {
  resetPremiumStateForTests();
  setSpiritualMarkersEnabled(true);
  await reopenPostpartumLochiaTracking();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('getNifasReminderStatus — the single canonical state (thresholds unchanged)', () => {
  it('is none before the warning day, approaching from it, reference_reached from the reference day', () => {
    expect(getNifasReminderStatus({postpartumDay: NIFAS_WARNING_DAYS - 1, lochiaEnded: false})).toBe('none');
    expect(getNifasReminderStatus({postpartumDay: NIFAS_WARNING_DAYS, lochiaEnded: false})).toBe('approaching');
    expect(getNifasReminderStatus({postpartumDay: NIFAS_REFERENCE_DAYS - 1, lochiaEnded: false})).toBe('approaching');
    expect(getNifasReminderStatus({postpartumDay: NIFAS_REFERENCE_DAYS, lochiaEnded: false})).toBe('reference_reached');
  });
  it('is none whenever the lochia are ended, whatever the day', () => {
    for (const day of [1, NIFAS_WARNING_DAYS, NIFAS_REFERENCE_DAYS, NIFAS_REFERENCE_DAYS + 20]) {
      expect(getNifasReminderStatus({postpartumDay: day, lochiaEnded: true})).toBe('none');
    }
  });
  it('the constants themselves are unchanged (35 / 40)', () => {
    expect(NIFAS_WARNING_DAYS).toBe(35);
    expect(NIFAS_REFERENCE_DAYS).toBe(40);
  });
});

describe('Dashboard — banner and popup follow the SAME state', () => {
  it('before the warning threshold (day 34): no banner, no popup', async () => {
    await deliveredForDay(NIFAS_WARNING_DAYS - 1);
    const renderer = await renderDashboard();
    expect(bannerTexts(renderer).present).toBe(false);
    expect(modalVisible(renderer)).toBe(false);
  });

  it('at the warning threshold (day 35): the "approaching" banner, still no popup', async () => {
    await deliveredForDay(NIFAS_WARNING_DAYS);
    const renderer = await renderDashboard();
    expect(bannerTexts(renderer)).toMatchObject({present: true, approaching: true, reached: false});
    expect(modalVisible(renderer)).toBe(false);
  });

  it('at the reference threshold (day 40), lochia ACTIVE: "reached" banner AND popup, same headline', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS);
    await savePostpartumLochiaEntry(dayKey(new Date()), {
      flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: [],
    });
    const renderer = await renderDashboard();
    expect(bannerTexts(renderer)).toMatchObject({present: true, reached: true});
    expect(modalVisible(renderer)).toBe(true);
    // the popup title is the very same headline as the banner's
    expect(textsOf(renderer)).toContain(NIFAS_REFERENCE_REACHED_HEADLINE);
  });

  it('at the reference threshold (day 40), lochia ENDED: neither banner nor popup — no contradiction', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS);
    await markPostpartumLochiaEnded(dayKey(addDays(new Date(), -3)));
    const renderer = await renderDashboard();
    expect(bannerTexts(renderer).present).toBe(false);
    expect(modalVisible(renderer)).toBe(false);
    expect(textsOf(renderer).some(text => text.includes('même si les lochies ou les saignements persistent'))).toBe(false);
  });

  it('past the threshold (day 45), lochia ended: still neither', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS + 5);
    await markPostpartumLochiaEnded(dayKey(addDays(new Date(), -10)));
    const renderer = await renderDashboard();
    expect(bannerTexts(renderer).present).toBe(false);
    expect(modalVisible(renderer)).toBe(false);
  });

  it('marking the lochia ended while the Dashboard is open closes the popup and hides the banner together', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS);
    const renderer = await renderDashboard();
    expect(modalVisible(renderer)).toBe(true);
    expect(bannerTexts(renderer).present).toBe(true);

    await act(async () => {
      await markPostpartumLochiaEnded(dayKey(new Date()));
    });
    await settle();
    expect(modalVisible(renderer)).toBe(false);
    expect(bannerTexts(renderer).present).toBe(false);
  });

  it('acknowledging the popup ("Compris") closes it and silences the banner for this delivery date', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS);
    const renderer = await renderDashboard();
    expect(modalVisible(renderer)).toBe(true);
    await act(async () => {
      renderer.root.find(node => node.props.accessibilityLabel === 'Compris' && typeof node.props.onPress === 'function').props.onPress();
    });
    await settle();
    expect(modalVisible(renderer)).toBe(false);
    expect(bannerTexts(renderer).present).toBe(false);
  });
});
