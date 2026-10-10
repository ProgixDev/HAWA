import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../AppearanceScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {getAppLanguage, resetAppLanguageForTests, setSelectedThemeId} from '../../state/themePreferences';
import i18n from '../../i18n';

// Italian integration — the real "App language" selector in AppearanceScreen.tsx
// rendered for real (same harness as PhaseSpanishLocalizationReadinessAppearance
// .test.tsx). Covers: four options, Italian card with its OWN-language subtitle,
// the four self-descriptions never changing with the active language, Apply /
// cancel semantics, persistence in the store, and EN -> IT -> FR -> ES -> IT
// switching on a mounted screen.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const SELF_DESCRIPTIONS = [
  ['English', 'Use AWA in English'],
  ['Français', 'Utiliser AWA en français'],
  ['Español', 'Usar AWA en español'],
  ['Italiano', 'Usare AWA in italiano'],
] as const;

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen() {
  const navigation = {goBack: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <AppearanceScreen navigation={navigation} route={{key: 'test', name: 'Appearance'} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAllByType(Text)
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const rowLabels = () => (['en', 'fr', 'es', 'it'] as const).map(lng => i18n.t('appearance.languageRowTitle', {lng}));
const applyLabels = () => (['en', 'fr', 'es', 'it'] as const).map(lng => i18n.t('common.apply', {lng}));
const closeLabels = () => (['en', 'fr', 'es', 'it'] as const).map(lng => i18n.t('common.close', {lng}));

const openLanguageSheet = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const row = renderer.root.findAll(
    node => rowLabels().includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button',
  )[0];
  await act(async () => {
    row.props.onPress();
  });
};

const radios = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'radio');

const selectLanguage = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    radios(renderer, label)[0].props.onPress();
  });
};

const pressApply = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const apply = renderer.root.findAll(
    node => applyLabels().includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button',
  )[0];
  await act(async () => {
    apply.props.onPress();
  });
};

const dismissBackdrop = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const backdrop = renderer.root.findAll(node => closeLabels().includes(node.props.accessibilityLabel))[0];
  await act(async () => {
    backdrop.props.onPress();
  });
};

const applyLanguage = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await openLanguageSheet(renderer);
  await selectLanguage(renderer, label);
  await pressApply(renderer);
};

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('Italian language selector — the Italian card among the five options', () => {
  it('shows exactly five language cards: English, Français, Español, Italiano, Türkçe', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    for (const [label] of SELF_DESCRIPTIONS) {
      expect(radios(renderer, label).length).toBeGreaterThan(0);
    }
    const allRadioLabels = new Set(
      renderer.root.findAll(node => node.props.accessibilityRole === 'radio').map(node => node.props.accessibilityLabel),
    );
    expect(allRadioLabels).toEqual(new Set([...SELF_DESCRIPTIONS.map(([label]) => label), 'Türkçe']));
  });

  it('the Italian card has the 🇮🇹 flag and the native-language subtitle "Usare AWA in italiano"', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    const texts = textsOf(renderer);
    expect(texts).toContain('🇮🇹');
    expect(texts).toContain('Italiano');
    expect(texts).toContain('Usare AWA in italiano');
  });

  it('English is not special-cased: no "Default language" wording anywhere, and it is selected by default', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    const texts = textsOf(renderer);
    expect(texts).toContain('Use AWA in English');
    expect(texts.some(text => /default language|langue par d[ée]faut|idioma predeterminado|lingua predefinita/i.test(text))).toBe(false);
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'Italiano')[0].props.accessibilityState).toEqual({checked: false});
  });

  it.each(['en', 'fr', 'es', 'it'] as const)(
    'with the app in "%s", all four cards still describe themselves in their OWN language',
    async language => {
      await act(async () => {
        await i18n.changeLanguage(language);
      });
      const renderer = await renderScreen();
      await openLanguageSheet(renderer);
      const texts = textsOf(renderer);
      for (const [label, subtitle] of SELF_DESCRIPTIONS) {
        expect(texts).toContain(label);
        expect(texts).toContain(subtitle);
      }
    },
  );
});

describe('Italian language selector — Apply, cancel, persistence', () => {
  it('selecting Italiano and pressing Apply makes Italian the active, persisted language and re-renders the screen in Italian', async () => {
    const renderer = await renderScreen();
    await applyLanguage(renderer, 'Italiano');

    expect(getAppLanguage()).toBe('it');
    expect(i18n.language).toBe('it');
    expect(textsOf(renderer)).toContain(i18n.t('appearance.headerTitle', {lng: 'it'}));
    expect(textsOf(renderer)).not.toContain(i18n.t('appearance.headerTitle', {lng: 'en'}));
  });

  it('the Appearance row subtitle shows the current language name ("Italiano") once Italian is applied', async () => {
    const renderer = await renderScreen();
    await applyLanguage(renderer, 'Italiano');
    expect(renderer.root.findAllByProps({children: 'Italiano'}).length).toBeGreaterThan(0);
  });

  it('opening the sheet and dismissing via the backdrop WITHOUT applying leaves English untouched', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    await selectLanguage(renderer, 'Italiano'); // draft only
    expect(getAppLanguage()).toBe('en');

    await dismissBackdrop(renderer);
    expect(getAppLanguage()).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('reopening the sheet after Italian was applied shows Italiano as the current selection', async () => {
    const renderer = await renderScreen();
    await applyLanguage(renderer, 'Italiano');
    await openLanguageSheet(renderer);
    expect(radios(renderer, 'Italiano')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: false});
  });
});

describe('Italian language selector — runtime switching on a mounted screen', () => {
  it('EN -> IT -> FR -> ES -> IT: every step switches the chrome immediately, with no restart and no stale text', async () => {
    const renderer = await renderScreen();
    const title = (lng: 'en' | 'fr' | 'es' | 'it') => i18n.t('appearance.headerTitle', {lng});

    expect(textsOf(renderer)).toContain(title('en'));

    await applyLanguage(renderer, 'Italiano');
    expect(getAppLanguage()).toBe('it');
    expect(textsOf(renderer)).toContain(title('it'));

    await applyLanguage(renderer, 'Français');
    expect(getAppLanguage()).toBe('fr');
    expect(textsOf(renderer)).toContain(title('fr'));
    expect(textsOf(renderer)).not.toContain(title('it'));

    await applyLanguage(renderer, 'Español');
    expect(getAppLanguage()).toBe('es');
    expect(textsOf(renderer)).toContain(title('es'));
    expect(textsOf(renderer)).not.toContain(title('fr'));

    await applyLanguage(renderer, 'Italiano');
    expect(getAppLanguage()).toBe('it');
    expect(i18n.language).toBe('it');
    expect(textsOf(renderer)).toContain(title('it'));
    expect(textsOf(renderer)).not.toContain(title('es'));
  });
});
