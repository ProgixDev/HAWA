import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PersonalInformationScreen from '../PersonalInformationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {getCachedPersonalInformation, updatePersonalInformation} from '../../state/personalInformationStore';

// REGRESSION COVERAGE — with no personal/health information entered, the screen shows the localized "not provided"
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
