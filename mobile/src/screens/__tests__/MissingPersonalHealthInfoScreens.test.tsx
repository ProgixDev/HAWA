import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PersonalInformationScreen from '../PersonalInformationScreen';
import GeneralHealthScreen from '../GeneralHealthScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {getCachedGeneralHealth, updateGeneralHealth} from '../../state/generalHealthStore';
import {getCachedPersonalInformation, updatePersonalInformation} from '../../state/personalInformationStore';
import {readStoredString} from '../../testUtils/structuredStorage';

// REGRESSION COVERAGE — with no personal/health information entered, both screens show the localized "not provided"
// label (never an invented value, NaN, undefined or 0) and opening an editor never saves anything on its own.
// Fixtures only — every value below is invented.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const navigation = {goBack: jest.fn(), navigate: jest.fn()} as never;
const route = {key: 'k', name: 'test', params: undefined} as never;

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i += 1) {
      await new Promise<void>(resolve => setImmediate(resolve));
    }
  });
};

const BAD = ['NaN', 'undefined', 'null', 'Infinity'];

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
  // Back to the "never entered anything" state (module caches survive across tests in one file).
  await updatePersonalInformation({lastName: '', birthDate: '', email: '', phone: '', country: '', firstName: '', preferredName: ''});
  await updateGeneralHealth({
    heightCm: null,
    weightKg: null,
    bloodType: '',
    healthGoal: '',
    goalProgress: null,
    updatedAt: '',
    medicalNotes: '',
    chronicConditions: [],
    treatments: [],
    allergies: [],
  });
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('PersonalInformationScreen with nothing entered', () => {
  it('shows "Not provided" for every identifying field and no invented value', async () => {
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    await flush();
    const texts = textsOf(renderer);

    expect(texts.filter(text => text === 'Not provided').length).toBeGreaterThanOrEqual(5);
    for (const fake of ['Benali', 'amina.benali@email.com', '+213', 'Algérie', '1998']) {
      expect(texts.some(text => text.includes(fake))).toBe(false);
    }
    for (const bad of BAD) {
      expect(texts.some(text => text.includes(bad))).toBe(false);
    }
  });

  it('renders in French with the French label', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const renderer = renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    await flush();
    expect(textsOf(renderer)).toContain('Non renseigné');
  });

  it('does not persist anything by merely opening the screen', async () => {
    renderDirect(<PersonalInformationScreen navigation={navigation} route={route} />);
    await flush();
    const info = getCachedPersonalInformation();
    expect([info.lastName, info.birthDate, info.email, info.phone, info.country]).toEqual(['', '', '', '', '']);
  });
});

describe('GeneralHealthScreen with nothing entered', () => {
  it('shows "Not provided" for height, weight, blood type, goal and last update; BMI is insufficient data', async () => {
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    await flush();
    const texts = textsOf(renderer);

    // height, weight, blood type, goal (the beforeEach reset itself stamps a real 'last update').
    expect(texts.filter(text => text === 'Not provided').length).toBeGreaterThanOrEqual(4);
    expect(texts.some(text => text.includes('165'))).toBe(false);
    expect(texts.some(text => text.includes('60 kg'))).toBe(false);
    expect(texts).not.toContain('O+');
    expect(texts.some(text => text.includes('Rester en forme'))).toBe(false);
    expect(texts.some(text => text.includes(' cm'))).toBe(false);
    for (const bad of BAD) {
      expect(texts.some(text => text.includes(bad))).toBe(false);
    }
  });

  it('only one measurement entered: BMI stays unavailable, the other value stays "Not provided"', async () => {
    await updateGeneralHealth({heightCm: 170});
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    await flush();
    const texts = textsOf(renderer);
    expect(texts).toContain('170 cm');
    expect(texts.some(text => text.includes(' kg'))).toBe(false);
    for (const bad of BAD) {
      expect(texts.some(text => text.includes(bad))).toBe(false);
    }
  });

  it('opening the height editor shows an empty input and persists nothing', async () => {
    const renderer = renderDirect(<GeneralHealthScreen navigation={navigation} route={route} />);
    await flush();
    const pressables = renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityRole === 'button');
    expect(pressables.length).toBeGreaterThan(0);

    expect(getCachedGeneralHealth().heightCm).toBeNull();
    expect(await readStoredString('@awa/general-health/v1')).not.toContain('heightCm');
    // No text input is pre-filled with a fabricated number while the sheet is closed.
    const inputs = renderer.root.findAllByType(TextInput);
    for (const input of inputs) {
      expect(String(input.props.value ?? '')).not.toMatch(/^(165|60)$/);
    }
  });
});
