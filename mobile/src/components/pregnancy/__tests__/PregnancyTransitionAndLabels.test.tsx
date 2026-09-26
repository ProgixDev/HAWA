import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, View} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../PregnancyDashboard';
import PregnancyCalendarContent from '../PregnancyCalendarContent';
import DeliveryDateSheet from '../DeliveryDateSheet';
import PregnancyStatisticsScreen from '../../../screens/pregnancy/PregnancyStatisticsScreen';
import InlineCalendarPickerModal from '../../onboarding/InlineCalendarPickerModal';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setPregnancyDating} from '../../../state/pregnancyPreferences';
import {
  getPostpartumPreferences,
  setPostpartumPreferences,
  type PostpartumPreferences,
} from '../../../state/postpartumPreferences';
import {savePregnancySymptoms} from '../../../state/pregnancyJournalStore';
import {addDays, startOfDay} from '../../../utils/cycleMath';

// M31 (40-week boundary label), M32/M34 (Pregnancy -> Postpartum transition
// with earlier postpartum history) and M33 (calendar dot = "Suivi", not "Note").
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
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
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);
const ctaLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  Array.from(
    new Set(
      renderer.root
        .findAll(node => typeof node.props.onPress === 'function' && typeof node.props.accessibilityLabel === 'string')
        .map(node => node.props.accessibilityLabel as string)
        .filter(label => label === 'J’ai accouché' || label === 'Démarrer mon suivi post-partum'),
    ),
  );

const renderDashboard = () =>
  renderScreen(<PregnancyDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />);

const key = (date: Date) => date.toLocaleDateString('en-CA');
const lmp = (elapsedDays: number) => startOfDay(addDays(new Date(), -elapsedDays));
const setElapsed = (elapsedDays: number) =>
  setPregnancyDating({method: 'lastPeriod', date: lmp(elapsedDays).toISOString()});

const EMPTY_POSTPARTUM: PostpartumPreferences = {
  deliveryDate: null,
  startedAt: null,
  deliveryType: null,
  feedingType: null,
  firstPostpartumPeriodDate: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};
// A completed EARLIER journey (a previous baby): all answers filled in.
const PREVIOUS_JOURNEY: PostpartumPreferences = {
  deliveryDate: key(addDays(new Date(), -600)),
  startedAt: addDays(new Date(), -599).toISOString(),
  deliveryType: 'vaginal',
  feedingType: 'mixed',
  firstPostpartumPeriodDate: key(addDays(new Date(), -540)),
  dailyTrackingReminderEnabled: true,
  dailyTrackingReminderTime: '20:00',
};

beforeEach(() => {
  resetPremiumStateForTests();
});

afterEach(() => {
  jest.restoreAllMocks();
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('M31 - Statistics progress line at the 40-week boundary', () => {
  it('day 279: "Semaine 40 sur 40"', async () => {
    await setElapsed(279);
    const texts = textsOf(await renderScreen(<PregnancyStatisticsScreen />));
    expect(texts).toContain('Semaine 40 sur 40');
    expect(texts).not.toContain('Terme atteint');
  });

  it('day 280 (exact boundary) and beyond: never "Semaine 41 sur 40"; "Terme atteint"; SA + jours untouched', async () => {
    for (const elapsed of [280, 285]) {
      await setElapsed(elapsed);
      const texts = textsOf(await renderScreen(<PregnancyStatisticsScreen />));
      expect(texts).toContain('Terme atteint');
      expect(texts).not.toContain('Semaine 41 sur 40');
      expect(texts.some(text => /Semaine\s*41\s*sur/.test(text))).toBe(false);
      expect(texts.some(text => text.includes('40 SA + 0'))).toBe(true);
    }
  });
});

describe('M32 - Pregnancy Dashboard CTA with earlier postpartum history', () => {
  it('previous postpartum history + NEW pregnancy at week 20: no delivery CTA at all (was: "Démarrer mon suivi post-partum")', async () => {
    await setPostpartumPreferences(PREVIOUS_JOURNEY);
    await setElapsed(140);
    expect(ctaLabels(await renderDashboard())).toEqual([]);
  });

  it('previous postpartum history + NEW late pregnancy: "J’ai accouché" (date step), not "Démarrer mon suivi post-partum"', async () => {
    await setPostpartumPreferences(PREVIOUS_JOURNEY);
    await setElapsed(265);
    expect(ctaLabels(await renderDashboard())).toEqual(['J’ai accouché']);
  });

  it('delivery confirmed during the CURRENT pregnancy: "Démarrer mon suivi post-partum" (whatever the week)', async () => {
    await setElapsed(265);
    await setPostpartumPreferences({...EMPTY_POSTPARTUM, deliveryDate: key(addDays(new Date(), -2)), startedAt: new Date().toISOString()});
    expect(ctaLabels(await renderDashboard())).toEqual(['Démarrer mon suivi post-partum']);
  });

  it('no postpartum history: late pregnancy -> "J’ai accouché"; early pregnancy -> no CTA', async () => {
    await setPostpartumPreferences(EMPTY_POSTPARTUM);
    await setElapsed(265);
    expect(ctaLabels(await renderDashboard())).toEqual(['J’ai accouché']);
    await setElapsed(100);
    expect(ctaLabels(await renderDashboard())).toEqual([]);
  });
});

describe('M34 - Pregnancy -> Postpartum delivery sheet', () => {
  const START_ELAPSED = 260;

  async function renderSheet() {
    const onConfirmed = jest.fn();
    const onClose = jest.fn();
    const renderer = await renderScreen(
      <DeliveryDateSheet
        onClose={onClose}
        onConfirmed={onConfirmed}
        pregnancyStart={lmp(START_ELAPSED)}
        visible
      />,
    );
    return {renderer, onConfirmed};
  }
  const pick = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date) => {
    await act(async () => {
      await renderer.root.findByType(InlineCalendarPickerModal).props.onSelect(date);
    });
  };

  it('the date picker is bounded: [pregnancy start, today]', async () => {
    await setPostpartumPreferences(EMPTY_POSTPARTUM);
    const {renderer} = await renderSheet();
    const picker = renderer.root.findByType(InlineCalendarPickerModal);
    expect(key(picker.props.minimumDate)).toBe(key(lmp(START_ELAPSED)));
    expect(key(picker.props.maximumDate)).toBe(key(new Date()));
  });

  it('date before the pregnancy start is rejected: nothing saved, no transition', async () => {
    await setPostpartumPreferences(PREVIOUS_JOURNEY);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const {renderer, onConfirmed} = await renderSheet();
    await pick(renderer, addDays(lmp(START_ELAPSED), -1));

    expect(alert).toHaveBeenCalledWith('Date invalide', 'La date d’accouchement ne peut pas précéder le début de ta grossesse.');
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(getPostpartumPreferences()).toEqual(PREVIOUS_JOURNEY);
  });

  it('a future date is rejected', async () => {
    await setPostpartumPreferences(EMPTY_POSTPARTUM);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const {renderer, onConfirmed} = await renderSheet();
    await pick(renderer, addDays(new Date(), 1));

    expect(alert).toHaveBeenCalledWith('Date invalide', 'La date d’accouchement ne peut pas être dans le futur.');
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(getPostpartumPreferences().deliveryDate).toBeNull();
  });

  it('valid date, no history: saved; optional fields stay unset (editable later from Profile); reminders untouched', async () => {
    await setPostpartumPreferences({...EMPTY_POSTPARTUM, dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '07:30'});
    const {renderer, onConfirmed} = await renderSheet();
    const delivery = addDays(new Date(), -3);
    await pick(renderer, delivery);

    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(getPostpartumPreferences()).toMatchObject({
      deliveryDate: key(delivery),
      deliveryType: null,
      feedingType: null,
      firstPostpartumPeriodDate: null,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '07:30',
    });
  });

  it('valid date replacing an EARLIER journey: the old baby’s answers are not carried over, reminders and the rest are untouched', async () => {
    await setPostpartumPreferences(PREVIOUS_JOURNEY);
    const {renderer, onConfirmed} = await renderSheet();
    await act(async () => {
      const press = renderer.root.findAll(
        node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => textOf(text) === 'J’ai accouché aujourd’hui'),
      )[0];
      await press.props.onPress();
    });

    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(getPostpartumPreferences()).toMatchObject({
      deliveryDate: key(new Date()),
      deliveryType: null,
      feedingType: null,
      firstPostpartumPeriodDate: null,
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '20:00',
    });
  });
});

describe('M33 - the Pregnancy Calendar dot means "daily entry" and is labelled "Suivi"', () => {
  const TEAL = '#2AA7A1';
  const tealDots = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAllByType(View).filter(node => {
      const style = Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
      return style.backgroundColor === TEAL;
    }).length;

  it('empty day: legend says "Suivi" (never "Note") and no day cell carries the dot', async () => {
    await setElapsed(70);
    const renderer = await renderScreen(<PregnancyCalendarContent />);
    expect(textsOf(renderer)).toContain('Suivi');
    expect(textsOf(renderer)).not.toContain('Note');
    expect(tealDots(renderer)).toBe(1); // legend only
  });

  it('entry WITHOUT a note: the day is marked, still called "Suivi"', async () => {
    await setElapsed(70);
    await savePregnancySymptoms({date: key(new Date()), symptoms: ['Nausées'], updatedAt: new Date().toISOString()});
    const renderer = await renderScreen(<PregnancyCalendarContent />);
    expect(tealDots(renderer)).toBeGreaterThanOrEqual(2);
    expect(textsOf(renderer)).not.toContain('Note');
    expect(textsOf(renderer)).not.toContain('Aucune note');
  });

  it('entry WITH a note: same marker and wording (the marker never claims to be a note)', async () => {
    await setElapsed(70);
    await savePregnancySymptoms({
      date: key(new Date()),
      symptoms: ['Nausées'],
      note: 'Une note libre',
      updatedAt: new Date().toISOString(),
    });
    const renderer = await renderScreen(<PregnancyCalendarContent />);
    expect(tealDots(renderer)).toBeGreaterThanOrEqual(2);
    expect(textsOf(renderer)).toContain('Suivi');
    expect(textsOf(renderer)).not.toContain('Note');
  });
});
