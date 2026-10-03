import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import PrivacyScreen from '../PrivacyScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Real-device finding (post-Phase-7M audit): PrivacyScreen.tsx (the onboarding
// privacy/data-protection step) had zero i18n — every one of its 17 strings
// was a hardcoded French literal, so an English-default fresh install still
// showed this step entirely in French. This file covers the fix: the whole
// screen now follows the app language like every other migrated screen.

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 375, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderPrivacyScreen() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PrivacyScreen navigation={navigation as never} route={{key: 'p', name: 'Privacy', params: undefined} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeEach(async () => {
  await resetAppLanguageForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('TEST 1 — Privacy screen, English default', () => {
  it('renders every guarantee/commitment string in English, with no leftover French', async () => {
    const renderer = await renderPrivacyScreen();
    const texts = textsOf(renderer).join(' | ');

    expect(texts).toContain('Your privacy');
    expect(texts).toContain('is our priority');
    expect(texts).toContain('No data resale');
    expect(texts).toContain('Full control');
    expect(texts).toContain('No external export');
    expect(texts).toContain('Encrypted and anonymized');
    expect(texts).toContain('Our commitment');
    expect(texts).toContain('You stay free');
    expect(texts).toContain('Next');

    // No known hardcoded French string remains.
    expect(texts).not.toContain('confidentialité');
    expect(texts).not.toContain('Aucune revente de données');
    expect(texts).not.toContain('Contrôle absolu');
    expect(texts).not.toContain('Notre engagement');
    expect(texts).not.toContain('Suivant');
  });
});

describe('TEST 2 — Privacy screen, explicit French', () => {
  it('renders every guarantee/commitment string in French when FR is explicitly selected', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');

    const renderer = await renderPrivacyScreen();
    const texts = textsOf(renderer).join(' | ');

    expect(texts).toContain('Ta confidentialité');
    expect(texts).toContain('est notre priorité');
    expect(texts).toContain('Aucune revente de données');
    expect(texts).toContain('Contrôle absolu');
    expect(texts).toContain('Aucune exportation');
    expect(texts).toContain('Données chiffrées et anonymisées');
    expect(texts).toContain('Notre engagement');
    expect(texts).toContain('Tu restes libre');
    expect(texts).toContain('Suivant');
  });
});

describe('TEST 3 — Privacy screen, same-mounted EN ↔ FR ↔ EN', () => {
  it('updates every string live across a language switch without remounting', async () => {
    const renderer = await renderPrivacyScreen();
    expect(textsOf(renderer)).toContain('No data resale');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    expect(textsOf(renderer)).toContain('Aucune revente de données');
    expect(textsOf(renderer)).not.toContain('No data resale');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    expect(textsOf(renderer)).toContain('No data resale');
    expect(textsOf(renderer)).not.toContain('Aucune revente de données');
  });
});
