import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {setSpiritualMarkersEnabled} from '../../../state/onboardingPreferences';
import {updatePersonalInformation} from '../../../state/personalInformationStore';

import CalendarScreen from '../../../screens/CalendarScreen';
import MenopauseCalendarContent from '../../menopause/MenopauseCalendarContent';
import IrregularCalendarContent from '../../irregular/IrregularCalendarContent';
import ContraceptionCalendarContent from '../../contraception/ContraceptionCalendarContent';
import ConceiveCalendarContent from '../../conceive/ConceiveCalendarContent';
import PostpartumCalendarContent from '../../postpartum/PostpartumCalendarContent';
import MiscarriageCalendarContent from '../../miscarriage/MiscarriageCalendarContent';
import PregnancyCalendarContent from '../../pregnancy/PregnancyCalendarContent';

// M47 — Hijri day/month labels inside the Gregorian calendars follow the
// spiritual-markers toggle ("Calendrier hijri" is one of the features that
// toggle controls: SpiritualPreferencesScreen / Profile copy). The separate
// Grégorien/Hijri/Double display preference (personalInformationStore) is
// still respected when the toggle is ON and is never reset when it is OFF.
//
// A Hijri label is detected through its Hijri YEAR (14xx): the Hijri month
// range header ("<mois> 14xx") is present in every calendar that shows Hijri
// labels, and no Gregorian string rendered by these screens contains it.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const navigationStub = {navigate: jest.fn()} as never;
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCalendar(renderScreen: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{renderScreen}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  // Let the async personal-information preference load settle.
  await act(async () => {
    await Promise.resolve();
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

const showsHijri = (renderer: ReactTestRenderer.ReactTestRenderer): boolean =>
  /\b14[3-9]\d\b/.test(JSON.stringify(renderer.toJSON()));

type CalendarCase = {
  name: string;
  /** Calendars that expose the Grégorien/Hijri/Double display preference. */
  hasDisplayPreference: boolean;
  render: () => React.ReactElement;
};

const CALENDARS: CalendarCase[] = [
  {
    // The Cycle display-preference cases live in MonthCalendarCard.test.tsx:
    // the Cycle selected-day card (SelectedDayCard) has always shown its Hijri
    // date whatever the Grégorien/Hijri/Double preference, so a whole-screen
    // "Grégorien => no Hijri" assertion would not isolate the month grid.
    name: 'Cycle (CalendarScreen)',
    hasDisplayPreference: false,
    render: () => <CalendarScreen navigation={navigationStub} route={{key: 'test', name: 'Calendar'} as never} />,
  },
  {name: 'TTC / Conceive', hasDisplayPreference: true, render: () => <ConceiveCalendarContent />},
  {name: 'Contraception', hasDisplayPreference: false, render: () => <ContraceptionCalendarContent />},
  {name: 'SOPK / Irregular', hasDisplayPreference: false, render: () => <IrregularCalendarContent />},
  {name: 'Menopause', hasDisplayPreference: false, render: () => <MenopauseCalendarContent />},
  {name: 'Pregnancy', hasDisplayPreference: true, render: () => <PregnancyCalendarContent />},
  {name: 'Postpartum', hasDisplayPreference: true, render: () => <PostpartumCalendarContent />},
  {name: 'Miscarriage / Loss', hasDisplayPreference: true, render: () => <MiscarriageCalendarContent />},
];

beforeEach(async () => {
  setSpiritualMarkersEnabled(true);
  await updatePersonalInformation({calendar: 'double'});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe.each(CALENDARS)('$name — Hijri labels vs the spiritual-markers toggle', ({render, hasDisplayPreference}) => {
  it('toggle ON: Hijri labels are shown', async () => {
    const renderer = await renderCalendar(render);
    expect(showsHijri(renderer)).toBe(true);
  });

  it('toggle OFF: no Hijri label anywhere in the calendar', async () => {
    setSpiritualMarkersEnabled(false);
    const renderer = await renderCalendar(render);
    expect(showsHijri(renderer)).toBe(false);
  });

  if (hasDisplayPreference) {
    it('toggle ON + "Grégorien" display preference: still no Hijri label (separate preference respected)', async () => {
      await updatePersonalInformation({calendar: 'gregorian'});
      const renderer = await renderCalendar(render);
      expect(showsHijri(renderer)).toBe(false);
    });

    it('toggle OFF keeps the stored display preference untouched (turning ON again restores Hijri labels)', async () => {
      setSpiritualMarkersEnabled(false);
      await renderCalendar(render);
      const {loadPersonalInformation} = require('../../../state/personalInformationStore');
      expect((await loadPersonalInformation()).calendar).toBe('double');

      setSpiritualMarkersEnabled(true);
      const again = await renderCalendar(render);
      expect(showsHijri(again)).toBe(true);
    });
  }
});
