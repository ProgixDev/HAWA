import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import MenopauseJournalEntryScreen from '../MenopauseJournalEntryScreen';
import {
  setMenopauseLabTracking,
  setMenopauseTrackedSymptoms,
  type MenopauseSymptom,
} from '../../../state/menopausePreferences';
import {
  addMenopauseLabResult,
  getMenopauseJournalEntry,
  getMenopauseLabResults,
  saveMenopauseJournalField,
} from '../../../state/menopauseJournalStore';

// The date picker is a native component: replaced by a stub that exposes its
// props so the test can "pick" a date.
let mockPickerProps: {
  onValueChange: (event: unknown, date?: Date) => void;
  maximumDate?: Date;
  value: Date;
} | null = null;
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: never) => {
    mockPickerProps = props;
    return null;
  },
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const editScreenParams: unknown[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderJournal(category: 'symptoms' | 'labResults') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category}} name="MenopauseJournalEntry">
                {() => <MenopauseJournalEntryScreen />}
              </Stack.Screen>
              <Stack.Screen name="MenopauseSymptoms">
                {({route}) => {
                  editScreenParams.push(route.params);
                  return <Text>symptoms-edit-screen</Text>;
                }}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('MenopauseJournalEntry');
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const buttonWithText = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  return matches[0];
};

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await buttonWithText(renderer, label).props.onPress();
  });
  await settle();
};

const SYMPTOM_LABELS: Record<MenopauseSymptom, string> = {
  hot_flashes: 'Bouffées de chaleur',
  night_sweats: 'Sueurs nocturnes',
  sleep_disturbances: 'Troubles du sommeil',
  fatigue: 'Fatigue',
  mood_changes: 'Variations d’humeur',
  brain_fog: 'Brouillard mental',
};

const offered = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  (Object.keys(SYMPTOM_LABELS) as MenopauseSymptom[]).filter(id => allTexts(renderer).includes(SYMPTOM_LABELS[id]));

const localKey = (date: Date) => date.toLocaleDateString('en-CA');

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  mockPickerProps = null;
  editScreenParams.length = 0;
});

describe('Menopause symptom journal — driven by the tracked-symptom preference', () => {
  beforeEach(async () => {
    jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
    // the store is a module singleton: start each test with no symptom recorded today
    await saveMenopauseJournalField('2026-09-25', 'symptoms', []);
  });

  it('A. onboarding selected [hot flashes, night sweats, brain fog]: only those are offered', async () => {
    await setMenopauseTrackedSymptoms(['hot_flashes', 'night_sweats', 'brain_fog']);
    const renderer = await renderJournal('symptoms');
    expect(offered(renderer)).toEqual(['hot_flashes', 'night_sweats', 'brain_fog']);
  });

  it('a symptom recorded earlier today but no longer tracked is still offered (nothing silently dropped)', async () => {
    await saveMenopauseJournalField('2026-09-25', 'symptoms', ['fatigue']);
    await setMenopauseTrackedSymptoms(['hot_flashes']);
    const renderer = await renderJournal('symptoms');
    expect(offered(renderer)).toEqual(['hot_flashes', 'fatigue']);
    expect(getMenopauseJournalEntry('2026-09-25')?.symptoms).toEqual(['fatigue']);
  });

  it('B. editing the preference while the journal is open updates the offered symptoms; history stays', async () => {
    await saveMenopauseJournalField('2026-09-20', 'symptoms', ['night_sweats']); // an older day
    await setMenopauseTrackedSymptoms(['hot_flashes', 'night_sweats']);
    const renderer = await renderJournal('symptoms');
    expect(offered(renderer)).toEqual(['hot_flashes', 'night_sweats']);

    await act(async () => {
      await setMenopauseTrackedSymptoms(['hot_flashes', 'mood_changes']);
    });
    await settle();
    expect(offered(renderer)).toEqual(['hot_flashes', 'mood_changes']);
    expect(getMenopauseJournalEntry('2026-09-20')?.symptoms).toEqual(['night_sweats']);
  });

  it('zero tracked symptoms: a graceful empty state with a CTA — never "all six" again', async () => {
    await setMenopauseTrackedSymptoms([]);
    const renderer = await renderJournal('symptoms');
    expect(offered(renderer)).toEqual([]);
    expect(allTexts(renderer)).toContain('Aucun symptôme suivi');
    expect(allTexts(renderer)).toContain('Choisir mes symptômes');
  });

  it('the empty-state CTA opens the symptom preference screen in EDIT mode, and the journal follows the change', async () => {
    await setMenopauseTrackedSymptoms([]);
    const renderer = await renderJournal('symptoms');
    await press(renderer, 'Choisir mes symptômes');
    expect(editScreenParams).toContainEqual({mode: 'edit'});

    await act(async () => {
      await setMenopauseTrackedSymptoms(['fatigue']);
    });
    await settle();
    expect(offered(renderer)).toEqual(['fatigue']);
  });

  it('saving with nothing to track does not write an empty entry', async () => {
    await setMenopauseTrackedSymptoms([]);
    const renderer = await renderJournal('symptoms');
    await press(renderer, 'Enregistrer le suivi');
    expect(allTexts(renderer).some(text => text.includes('Choisis d’abord les symptômes'))).toBe(true);
    expect(getMenopauseJournalEntry('2026-09-25')?.symptoms).toEqual([]);
  });
});

describe('Menopause lab results — sample date', () => {
  beforeEach(async () => {
    jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
    await setMenopauseLabTracking('fsh');
  });

  const typeValue = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
    await act(async () => {
      renderer.root.find(node => node.props.accessibilityLabel === 'Valeur de l’analyse' && node.type === TextInput).props.onChangeText(value);
    });
  };

  const pickDate = async (date: Date) => {
    await act(async () => {
      mockPickerProps?.onValueChange({}, date);
    });
  };

  it('F. today is Sept 25, sample date picked = Sept 20 → stored date is Sept 20; recordedAt is still "now"', async () => {
    const renderer = await renderJournal('labResults');
    await press(renderer, 'Date du prélèvement : 25 septembre 2026. Modifier');
    expect(mockPickerProps).not.toBeNull();
    // no future sample date can be picked
    expect(localKey(mockPickerProps!.maximumDate!)).toBe('2026-09-25');

    await pickDate(new Date(2026, 8, 20, 12, 0, 0));
    expect(allTexts(renderer)).toContain('20 septembre 2026');
    expect(allTexts(renderer)).toContain('Date choisie');

    await typeValue(renderer, '41,5');
    await press(renderer, 'Enregistrer le résultat');

    const saved = getMenopauseLabResults('fsh').find(result => result.value === 41.5);
    expect(saved?.date).toBe('2026-09-20');
    // created/recorded timestamp semantics unchanged: it is when it was entered (Sept 25)
    expect(localKey(new Date(saved!.recordedAt))).toBe('2026-09-25');
    expect(allTexts(renderer).some(text => text.includes('20 septembre 2026'))).toBe(true);
  });

  it('a date that is today (or later) is treated as "Aujourd’hui" — a future sample date is impossible', async () => {
    const renderer = await renderJournal('labResults');
    await press(renderer, 'Date du prélèvement : 25 septembre 2026. Modifier');
    await pickDate(new Date(2026, 8, 30, 12, 0, 0));
    expect(allTexts(renderer)).toContain('Aujourd’hui');

    await typeValue(renderer, '12');
    await press(renderer, 'Enregistrer le résultat');
    expect(getMenopauseLabResults('fsh').find(result => result.value === 12)?.date).toBe('2026-09-25');
  });

  it('without touching the date field the result is dated today (existing behavior)', async () => {
    const renderer = await renderJournal('labResults');
    await typeValue(renderer, '55');
    await press(renderer, 'Enregistrer le résultat');
    expect(getMenopauseLabResults('fsh').find(result => result.value === 55)?.date).toBe('2026-09-25');
  });
});

describe('G — Menopause lab history affordances are honest', () => {
  beforeEach(async () => {
    jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 12, 0, 0)});
    await setMenopauseLabTracking('fsh');
  });

  const chevronRights = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAllByType(MaterialDesignIcons).filter(node => node.props.name === 'chevron-right');

  it('result rows do not carry a "go to detail" chevron (there is no detail screen)', async () => {
    await addMenopauseLabResult({type: 'fsh', value: 30, date: '2026-09-01'});
    const renderer = await renderJournal('labResults');
    expect(allTexts(renderer)).toContain('Mes derniers résultats');
    expect(chevronRights(renderer)).toHaveLength(0);
  });

  it('"Voir tout" is only present when it has something to reveal, and it really expands the list', async () => {
    const before = await renderJournal('labResults');
    const fewCount = getMenopauseLabResults('fsh').length;
    if (fewCount <= 5) {
      expect(allTexts(before)).not.toContain('Voir tout');
    }
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });

    for (let day = 2; day <= 8; day += 1) {
      await addMenopauseLabResult({type: 'fsh', value: 30 + day, date: `2026-09-0${day}`});
    }
    const total = getMenopauseLabResults('fsh').length;
    expect(total).toBeGreaterThan(5);

    const renderer = await renderJournal('labResults');
    const rows = () => allTexts(renderer).filter(text => text.includes(' · ') && /\d{4}/.test(text)).length;
    expect(rows()).toBe(5);
    await press(renderer, 'Voir tout');
    expect(rows()).toBe(total);
    expect(allTexts(renderer)).toContain('Réduire');
    await press(renderer, 'Réduire');
    expect(rows()).toBe(5);
  });

  it('the sample-date field is an actual button with an action', async () => {
    const renderer = await renderJournal('labResults');
    const field = buttonWithText(renderer, 'Date du prélèvement : 25 septembre 2026. Modifier');
    expect(typeof field.props.onPress).toBe('function');
    expect(field.props.accessibilityRole).toBe('button');
  });
});
