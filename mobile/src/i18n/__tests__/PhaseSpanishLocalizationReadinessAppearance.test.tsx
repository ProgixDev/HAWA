import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../../screens/AppearanceScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {getAppLanguage, resetAppLanguageForTests, setSelectedThemeId} from '../../state/themePreferences';
import i18n from '../index';

// Spanish localization readiness — PART 2: the real "Langue de
// l'application" / "App language" / "Idioma de la aplicación" selector in
// AppearanceScreen.tsx, rendered for real (same SafeAreaProvider +
// AwaThemeProvider wrapper, act(), renderer.root.findAllByType(Text)
// pattern as src/screens/__tests__/AppearanceScreen.test.tsx and
// Phase7EAppearanceLibraryLanguageSwitch.test.tsx). The sheet's real
// interaction model (read from AppearanceScreen.tsx's LanguageBottomSheet):
// a draft selection via radio Pressables, committed only by the "Appliquer"/
// "Apply"/"Aplicar" button, or discarded by the backdrop Pressable
// (accessibilityLabel === t('common.close')).

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

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

// The row's own accessibilityLabel IS the translated row title
// (t('appearance.languageRowTitle')), and the Apply/backdrop buttons are
// likewise translated — so every helper below matches any of the three
// shipped languages rather than assuming one, exactly like the
// "regardless of locale" helpers in AppearanceScreen.test.tsx.
const ROW_LABELS = ['App language', 'Langue de l’application', 'Idioma de la aplicación'];
const APPLY_LABELS = ['Apply', 'Appliquer', 'Aplicar'];
const CLOSE_LABELS = ['Close', 'Fermer', 'Cerrar'];

const openLanguageSheet = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const row = renderer.root.findAll(
    node => ROW_LABELS.includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button',
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
    node => APPLY_LABELS.includes(node.props.accessibilityLabel) && node.props.accessibilityRole === 'button',
  )[0];
  await act(async () => {
    apply.props.onPress();
  });
};

const dismissBackdrop = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const backdrop = renderer.root.findAll(node => CLOSE_LABELS.includes(node.props.accessibilityLabel))[0];
  await act(async () => {
    backdrop.props.onPress();
  });
};

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await resetAppLanguageForTests(); // PHASE 7M default: English, no saved preference
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('TEST — AppearanceScreen "Langue de l\'application" selector (cases 10-15)', () => {
  it('10. English is shown as selected by default, with no saved preference', async () => {
    const renderer = await renderScreen();
    expect(textsOf(renderer)).toContain('English'); // the row's own subtitle

    await openLanguageSheet(renderer);
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'Français')[0].props.accessibilityState).toEqual({checked: false});
    expect(radios(renderer, 'Español')[0].props.accessibilityState).toEqual({checked: false});
  });

  it('11. French is present as a selectable option', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    // findAll can surface more than one matching fiber for a single logical
    // Pressable (RN's Pressable forwards accessibilityLabel/accessibilityRole
    // through internal wrapper layers) — presence, not an exact tree-shape
    // count, is what "is a selectable option" means here; every match is
    // still required to actually be checkable (a real radio).
    const matches = radios(renderer, 'Français');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].props.accessibilityState).toEqual({checked: false});
  });

  it('12. Spanish is present as a selectable option', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    const matches = radios(renderer, 'Español');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].props.accessibilityState).toEqual({checked: false});
  });

  it('13. selecting Spanish and pressing Apply makes Spanish the real active app language', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    await selectLanguage(renderer, 'Español');
    await pressApply(renderer);

    expect(getAppLanguage()).toBe('es');
    // The whole screen re-renders in Spanish — not just the store value.
    expect(textsOf(renderer)).toContain('Apariencia');
    expect(textsOf(renderer)).not.toContain('Appearance');
    expect(renderer.root.findAllByProps({children: 'Español'}).length).toBeGreaterThan(0);
  });

  it('14. opening the selector and dismissing via the backdrop WITHOUT applying leaves the saved language untouched', async () => {
    const renderer = await renderScreen();
    expect(getAppLanguage()).toBe('en');

    await openLanguageSheet(renderer);
    await selectLanguage(renderer, 'Español'); // draft only, not yet committed
    expect(getAppLanguage()).toBe('en');

    await dismissBackdrop(renderer);
    expect(getAppLanguage()).toBe('en');
    expect(textsOf(renderer)).toContain('Appearance'); // still English chrome
  });

  it('15. reopening the selector after Spanish was saved shows Spanish as the current selection', async () => {
    const renderer = await renderScreen();
    await openLanguageSheet(renderer);
    await selectLanguage(renderer, 'Español');
    await pressApply(renderer);
    expect(getAppLanguage()).toBe('es');

    await openLanguageSheet(renderer); // the row's own label is now Spanish too — matched via ROW_LABELS
    expect(radios(renderer, 'Español')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: false});
    expect(radios(renderer, 'Français')[0].props.accessibilityState).toEqual({checked: false});
  });
});
