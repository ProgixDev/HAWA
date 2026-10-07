import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PrivacySecurityScreen from '../PrivacySecurityScreen';
import BackupDataScreen from '../BackupDataScreen';
import HelpSupportScreen from '../HelpSupportScreen';
import {DataManagementScreen, DeleteAccountScreen} from '../DataPrivacyScreens';
import PersonalInformationScreen from '../PersonalInformationScreen';
import {resetAppLanguageForTests, setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import i18n from '../../i18n';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

// PrivacySecurityScreen uses useFocusEffect and needs a real
// NavigationContainer ancestor, same minimal harness as every dashboard test.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

async function renderWithNavigation(Component: React.ComponentType<any>) {
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Component navigation={navigation} route={{key: 'test', name: 'Test'}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

async function renderStandalone(Component: React.ComponentType<any>, navigation: object) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Component navigation={navigation as never} route={{key: 'test', name: 'Test'} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

const FILES: Array<[string, string]> = [
  ['PrivacySecurityScreen', '../PrivacySecurityScreen.tsx'],
  ['BackupDataScreen', '../BackupDataScreen.tsx'],
  ['HelpSupportScreen', '../HelpSupportScreen.tsx'],
  ['DataPrivacyScreens', '../DataPrivacyScreens.tsx'],
  ['PersonalInformationScreen', '../PersonalInformationScreen.tsx'],
];

describe('E2 Settings family — static architecture guard', () => {
  it.each(FILES)('%s never calls useColorScheme, defines no LIGHT_CHROME/DARK_CHROME, and never exposes Midnight', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).not.toMatch(new RegExp('=\\s*useColorScheme\\(\\)'));
    expect(source).not.toMatch(/LIGHT_CHROME|DARK_CHROME/);
    expect(source).not.toMatch(/getAwaTheme\(|resolveEffectiveThemeId\(/);
    expect(source).not.toMatch(/midnight/i);
  });
});

describe('PrivacySecurityScreen — resolved global theme', () => {
  it('StatusBar follows the resolved theme and changes Light -> Dark without remounting', async () => {
    const renderer = await renderWithNavigation(PrivacySecurityScreen);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('preserves the destructive "Delete my account" row', async () => {
    const renderer = await renderWithNavigation(PrivacySecurityScreen);
    // Default app language is English (Phase 7M); this row is i18n-driven.
    expect(renderer.root.findAll(node => node.props.children === 'Delete my account').length).toBeGreaterThan(0);
  });
});

describe('BackupDataScreen — resolved global theme', () => {
  it('background follows theme.colors.background and reacts to palette switch', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(BackupDataScreen, navigation);
    const safe = () => renderer.root.findAll(node => node.props.style && node.props.style.flex === 1 && 'backgroundColor' in node.props.style)[0];
    const before = flattenStyle(safe().props.style).backgroundColor;

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });
    expect(flattenStyle(safe().props.style).backgroundColor).not.toBe(before);
  });
});

describe('HelpSupportScreen — resolved global theme', () => {
  it('renders without crashing and reacts to Dark mode', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(HelpSupportScreen, navigation);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

describe('HelpSupportScreen — "Comment pouvons-nous t\'aider ?" no longer offers Chat en direct', () => {
  it('removes Chat en direct entirely (title, CTA value, and helper text)', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(HelpSupportScreen, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'Chat en direct').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'Discuter maintenant').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'Disponible 9h – 18h').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.name === 'chat-processing-outline').length).toBe(0);
  });

  it('keeps exactly the two remaining contact methods, E-mail and FAQ, evenly balanced (flex: 1 each)', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(HelpSupportScreen, navigation);

    // Default app language is English (Phase 7M): the Email method title is
    // i18n-driven ("E-mail" -> "Email"); "FAQ" is unchanged across languages.
    expect(renderer.root.findAll(node => node.props.children === 'Email').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'FAQ').length).toBeGreaterThan(0);

    const methodTitles = renderer.root.findAll(
      node => node.props.children === 'Email' || node.props.children === 'FAQ',
    );
    // Both remaining Method cards share the exact same flex:1 sizing rule —
    // the layout naturally rebalances from 3 -> 2 without a dedicated
    // "2-card" style variant.
    for (const titleNode of methodTitles) {
      let node: ReactTestRenderer.ReactTestInstance | null = titleNode;
      while (node && !flattenStyle(node.props.style).flex) {
        node = node.parent;
      }
      expect(node).not.toBeNull();
      expect(flattenStyle(node!.props.style).flex).toBe(1);
    }
  });

  it('FAQ list and "See all" remain untouched', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(HelpSupportScreen, navigation);
    // Default app language is English (Phase 7M); both strings are i18n-driven.
    expect(renderer.root.findAll(node => node.props.children === 'Frequently asked questions').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => typeof node.props.children === 'string' && node.props.children.includes('See all')).length).toBeGreaterThan(0);
  });
});

describe('DataManagementScreen / DeleteAccountScreen — resolved global theme, destructive action preserved', () => {
  it('DataManagementScreen renders with resolved theme', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(DataManagementScreen as never, navigation);
    // Default app language is English (Phase 7M) — title is now i18n-driven.
    expect(renderer.root.findAll(node => node.props.children === 'Data management').length).toBeGreaterThan(0);
  });

  it('DeleteAccountScreen preserves the DELETE confirmation and stays destructive', async () => {
    const navigation = {goBack: jest.fn(), reset: jest.fn()};
    const renderer = await renderStandalone(DeleteAccountScreen as never, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'Type DELETE to confirm').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Permanently delete').length).toBeGreaterThan(0);
  });
});

// LOCALIZATION FIX — DataPrivacyScreens.tsx was entirely hardcoded French
// (reachable from PrivacySecurityScreen's fully-localized "Data management"/
// "Delete account" rows), including the irreversible account-deletion
// confirmation ("Écris SUPPRIMER pour confirmer"). Now localized FR/EN/ES,
// with the displayed confirmation word and the validation check both reading
// the SAME translation key (dataPrivacy.deleteAccount.confirmWord) so the
// required word can never drift out of sync with what's actually validated.
describe('DataPrivacyScreens — FR/EN/ES localization (destructive confirmation never a language-dependent safety bug)', () => {
  afterEach(async () => {
    await resetAppLanguageForTests();
    await i18n.changeLanguage('en');
  });

  it('DataManagementScreen renders fully in French, English and Spanish, never leaking another language', async () => {
    for (const [language, title, hero, exportTitle] of [
      ['fr', 'Gestion des données', 'Tes données AWA', 'Exporter mes données'],
      ['en', 'Data management', 'Your AWA data', 'Export my data'],
      ['es', 'Gestión de datos', 'Tus datos AWA', 'Exportar mis datos'],
    ] as const) {
      await setAppLanguage(language);
      await i18n.changeLanguage(language);
      const renderer = await renderStandalone(DataManagementScreen as never, {goBack: jest.fn()});
      const texts = renderer.root.findAllByType(require('react-native').Text).map(node => [node.props.children].flat(Infinity).join(''));
      expect(texts).toContain(title);
      expect(texts).toContain(hero);
      expect(texts).toContain(exportTitle);
    }
  });

  it.each([
    ['fr', 'SUPPRIMER', 'DELETE', 'Écris SUPPRIMER pour confirmer', 'Supprimer définitivement', 'Supprimer définitivement mon compte'],
    ['en', 'DELETE', 'SUPPRIMER', 'Type DELETE to confirm', 'Permanently delete', 'Permanently delete my account'],
    ['es', 'ELIMINAR', 'DELETE', 'Escribe ELIMINAR para confirmar', 'Eliminar definitivamente', 'Eliminar definitivamente mi cuenta'],
  ] as const)('DeleteAccountScreen (%s): the wrong-language word never deletes the account; the correct one does', async (language, correctWord, wrongWord, confirmLabel, deleteLabel, deleteA11y) => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const reset = jest.fn();
    const renderer = await renderStandalone(DeleteAccountScreen as never, {goBack: jest.fn(), reset});
    const Text = require('react-native').Text as typeof import('react-native').Text;
    const TextInput = require('react-native').TextInput as typeof import('react-native').TextInput;
    const texts = () => renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
    expect(texts()).toContain(confirmLabel);
    expect(texts()).toContain(deleteLabel);

    const input = renderer.root.findByType(TextInput);
    // The delete Pressable carries its own localized accessibilityLabel
    // (dataPrivacy.deleteAccount.deleteButtonAccessibility) — never ambiguous.
    const deletePressable = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === deleteA11y,
    )[0];
    expect(deletePressable).toBeTruthy();

    // The wrong-language word (e.g. typing "DELETE" while the UI is in
    // French) must never satisfy the check.
    await act(async () => {
      input.props.onChangeText(wrongWord);
    });
    await act(async () => {
      deletePressable!.props.onPress();
    });
    expect(reset).not.toHaveBeenCalled();

    // The correct word for the active language deletes the account.
    await act(async () => {
      input.props.onChangeText(correctWord);
    });
    await act(async () => {
      deletePressable!.props.onPress();
    });
    expect(reset).toHaveBeenCalledWith({index: 0, routes: [{name: 'Welcome'}]});
  });
});

describe('PersonalInformationScreen — resolved global theme', () => {
  it('renders core fields and reacts to Dark mode', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(PersonalInformationScreen, navigation);
    // Default app language is English (Phase 7M); the screen title is i18n-driven.
    expect(renderer.root.findAll(node => node.props.children === 'Personal information').length).toBeGreaterThan(0);

    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

/* ============================================================
   LIVE-LANGUAGE ROW — PersonalInformationScreen's "Langue"/"Language" row is
   informational (not pressable) and now reflects the CURRENT app language
   (French, English, or Spanish — Phase 7M made English the default and
   fixed a real display bug where this row always showed "Français" from the
   stale personalInformationStore.ts field, even after switching the app to
   English; see PersonalInformationScreen.tsx's languageDisplayValue comment).
   A LATER audit found a second, narrower instance of the same bug class:
   languageDisplayValue's own 3-way resolution was itself only a binary
   en/fr ternary, so Spanish fell through to "Français" here specifically —
   fixed below (now a real 3-way, matching AppearanceScreen.tsx's language
   row). العربية is still not offered anywhere in this screen (no Arabic
   support exists in the app at all).
============================================================ */

describe('PersonalInformationScreen — "Language" reflects the live app language', () => {
  it('displays "English" (the app default) and offers no unsupported language', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(PersonalInformationScreen, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'English').length).toBeGreaterThan(0);
    for (const unsupported of ['Français', 'Español', 'العربية']) {
      expect(renderer.root.findAll(node => node.props.children === unsupported).length).toBe(0);
    }
  });

  it.each([
    ['fr', 'Français'],
    ['en', 'English'],
    ['es', 'Español'],
  ] as const)('shows "%s" as "%s" (previously fell through to Français when Spanish)', async (language, expectedLabel) => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(PersonalInformationScreen, navigation);
    expect(renderer.root.findAll(node => node.props.children === expectedLabel).length).toBeGreaterThan(0);
    for (const other of ['Français', 'English', 'Español'].filter(label => label !== expectedLabel)) {
      expect(renderer.root.findAll(node => node.props.children === other).length).toBe(0);
    }
  });

  it('the "Language" row is not pressable (no selector to open — informational only)', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(PersonalInformationScreen, navigation);
    const label = renderer.root.findAll(node => node.props.children === 'Language')[0];
    let pressable: ReactTestRenderer.ReactTestInstance | null = label;
    while (pressable && pressable.props.disabled === undefined) {
      pressable = pressable.parent;
    }
    expect(pressable).toBeTruthy();
    expect(pressable!.props.disabled).toBe(true);
    expect(pressable!.props.onPress).toBeUndefined();
  });

  it('static guard: no dead English/Spanish/Arabic language-option code remains', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PersonalInformationScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/LANGUAGES/);
    expect(source).not.toMatch(/'English'/);
    expect(source).not.toMatch(/'Español'/);
    expect(source).not.toMatch(/العربية/);
    expect(source).not.toMatch(/Choisir la langue/);
  });
});
