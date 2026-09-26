import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../../theme/spacing';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {PostpartumSuccessToast} from '../PostpartumSuccessToast';
import PostpartumJournalEntryScreen from '../../../screens/PostpartumJournalEntryScreen';
import {
  clearPostpartumSuccessToast,
  getPostpartumSuccessToast,
  showPostpartumSuccessToast,
} from '../../../state/postpartumSuccessToastStore';
import {
  clearPostpartumJournalCategory,
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
} from '../../../state/postpartumJournalStore';
import {
  POSTPARTUM_FATIGUE_OPTIONS,
  POSTPARTUM_PAIN_OPTIONS,
  POSTPARTUM_RECOVERY_OPTIONS,
  POSTPARTUM_SLEEP_OPTIONS,
} from '../../../config/postpartumJournalConfig';

// Postpartum save confirmations: requested by the entry screen through
// postpartumSuccessToastStore, shown on the Postpartum Home by
// PostpartumSuccessToast — now AWA's shared save toast (JournalSaveToast), at the
// BOTTOM (above the floating tab bar + bottom inset) and colored by the selected
// theme.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const BOTTOM_INSET = 24;
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 30, left: 0, right: 0, bottom: BOTTOM_INSET},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderTree(element: React.ReactElement, params?: Record<string, unknown>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen initialParams={params} name="Journal">{() => element}</Stack.Screen>
              <Stack.Screen name="MainTabs">{() => <Text>home</Text>}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const flat = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const findButtons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label);
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = findButtons(renderer, label);
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};

/** The toast card: the absolutely positioned, elevated view of the shared save toast. */
const toastCard = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAll(node => {
      const style = flat(node.props?.style);
      return style.position === 'absolute' && style.zIndex === 100;
    })
    .map(node => flat(node.props.style))[0];

const showToast = async (title = 'Fatigue enregistrée') => {
  await act(async () => {
    showPostpartumSuccessToast({title, message: 'Ton suivi du jour est à jour.'});
  });
  await settle();
};

beforeEach(async () => {
  clearPostpartumSuccessToast();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await hydratePostpartumJournal();
  // Answers saved by earlier tests must not leak into the next one.
  for (const category of ['fatigue', 'sleep', 'mood', 'pain', 'physicalRecovery'] as const) {
    await clearPostpartumJournalCategory(todayKey(), category);
  }
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  clearPostpartumSuccessToast();
});

describe('Postpartum confirmations are requested after each save (same store, same persistence)', () => {
  const cases: Array<{category: string; pick: string; title: string; field: 'fatigue' | 'sleep' | 'mood' | 'pain' | 'physicalRecovery'}> = [
    {category: 'fatigue', pick: POSTPARTUM_FATIGUE_OPTIONS[2], title: 'Fatigue enregistrée', field: 'fatigue'},
    {category: 'sleep', pick: POSTPARTUM_SLEEP_OPTIONS[3], title: 'Sommeil enregistré', field: 'sleep'},
    {category: 'mood', pick: 'Bien', title: 'Humeur enregistrée', field: 'mood'},
    {category: 'pain', pick: POSTPARTUM_PAIN_OPTIONS[1], title: 'Douleurs enregistrées', field: 'pain'},
    {category: 'physicalRecovery', pick: POSTPARTUM_RECOVERY_OPTIONS[1], title: 'Récupération enregistrée', field: 'physicalRecovery'},
  ];

  it.each(cases)('$category: saving still persists the answer and requests "$title"', async ({category, pick, title, field}) => {
    const renderer = await renderTree(React.createElement(PostpartumJournalEntryScreen as never), {category});
    expect(getPostpartumSuccessToast()).toBeNull();
    await press(renderer, pick);
    await press(renderer, 'Enregistrer');
    expect(getPostpartumJournalEntry(todayKey())?.[field]).toBe(pick);
    expect(getPostpartumSuccessToast()).toEqual({title, message: 'Ton suivi du jour est à jour.'});
  });

  it('nothing is requested when the save is refused (no answer chosen)', async () => {
    const renderer = await renderTree(React.createElement(PostpartumJournalEntryScreen as never), {category: 'fatigue'});
    await press(renderer, 'Enregistrer');
    expect(getPostpartumSuccessToast()).toBeNull();
  });

  it('Lochia has no toast: its confirmation is a modal, untouched by this change', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../screens/PostpartumLochiaScreen.tsx'), 'utf8');
    expect(source).not.toContain('showPostpartumSuccessToast');
    expect(source).not.toContain('JournalSaveToast');
  });

  it('the only two producers of this toast are the entry screen’s save and clear actions', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../screens/PostpartumJournalEntryScreen.tsx'), 'utf8');
    expect(source.match(/showPostpartumSuccessToast\(/g)).toHaveLength(2);
  });
});

describe('PostpartumSuccessToast — bottom position', () => {
  it('appears at the BOTTOM, above the floating tab bar and the bottom inset, never at the top', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    expect(toastCard(renderer)).toBeUndefined(); // nothing before a request
    await showToast();
    const card = toastCard(renderer);
    expect(card).toBeDefined();
    expect(card.bottom).toBe(getFloatingTabBarClearance(BOTTOM_INSET, 8));
    expect(card.top).toBeUndefined();
    // Clears both the safe-area inset and the tab bar pill (58 + 4 + max(inset, 8)).
    expect(card.bottom as number).toBeGreaterThan(BOTTOM_INSET + 58);
  });

  it('shows the requested title and message, for every postpartum category', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    for (const title of ['Fatigue enregistrée', 'Sommeil enregistré', 'Humeur enregistrée', 'Douleurs enregistrées', 'Récupération enregistrée']) {
      await showToast(title);
      expect(textsOf(renderer)).toContain(title);
      expect(textsOf(renderer)).toContain('Ton suivi du jour est à jour.');
      expect(toastCard(renderer).bottom).toBe(getFloatingTabBarClearance(BOTTOM_INSET, 8));
    }
  });

  it('the bottom offset follows the device inset (a device without inset still clears the tab bar)', async () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumSuccessToast.tsx'), 'utf8');
    expect(source).toContain('getFloatingTabBarClearance(insets.bottom');
    expect(getFloatingTabBarClearance(0, 8)).toBeGreaterThan(58);
    expect(getFloatingTabBarClearance(34, 8)).toBeGreaterThan(getFloatingTabBarClearance(0, 8));
  });

  it('is cleared from the store once it has faded out or was dismissed (the X)', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    await showToast();
    expect(getPostpartumSuccessToast()).not.toBeNull();
    const close = renderer.root.find(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === 'Fermer');
    await act(async () => {
      close.props.onPress();
    });
    await settle();
    expect(getPostpartumSuccessToast()).toBeNull();
  });
});

describe('PostpartumSuccessToast — Light / Dark through the existing theme', () => {
  it('Light: surface + accent + secondary text come from the resolved light theme', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    await showToast();
    const light = resolveAwaTheme('awa-original', false, false);
    expect(toastCard(renderer).backgroundColor).toBe(light.colors.surface);
    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Fatigue enregistrée')!;
    expect(flat(title.props.style).color).toBe(light.colors.accent);
    const message = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Ton suivi du jour est à jour.')!;
    expect(flat(message.props.style).color).toBe(light.colors.textSecondary);
  });

  it('Dark: the same tokens resolve to the dark theme', async () => {
    await setAppearanceMode('dark');
    const renderer = await renderTree(<PostpartumSuccessToast />);
    await showToast();
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(toastCard(renderer).backgroundColor).toBe(dark.colors.surface);
    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Fatigue enregistrée')!;
    expect(flat(title.props.style).color).toBe(dark.colors.accent);
    expect(dark.colors.surface).not.toBe(resolveAwaTheme('awa-original', false, false).colors.surface);
  });

  it('switching Light → Dark → Light while the toast is visible never keeps stale colors', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    await showToast();
    const light = resolveAwaTheme('awa-original', false, false);
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(toastCard(renderer).backgroundColor).toBe(light.colors.surface);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(toastCard(renderer).backgroundColor).toBe(dark.colors.surface);
    expect(toastCard(renderer).borderColor).not.toBe(light.colors.primary);

    await act(async () => {
      await setAppearanceMode('light');
    });
    expect(toastCard(renderer).backgroundColor).toBe(light.colors.surface);
  });

  it('follows a palette change too (existing theme system, no Postpartum palette)', async () => {
    const renderer = await renderTree(<PostpartumSuccessToast />);
    await showToast();
    const before = toastCard(renderer).backgroundColor;
    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });
    expect(toastCard(renderer).backgroundColor).toBe(resolveAwaTheme('ocean-calm', false, false).colors.surface);
    expect(before).toBe(resolveAwaTheme('awa-original', false, false).colors.surface);
  });

  it('no color literal and no Postpartum-specific palette remain in the component', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumSuccessToast.tsx'), 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).not.toMatch(/StyleSheet\.create/);
    expect(source).toContain("from '../journal/JournalSaveToast'");
  });
});

describe('Other objectives keep their toast', () => {
  it('the shared JournalSaveToast component itself is not touched: still absolute, still driven by its `bottom` prop', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../journal/JournalSaveToast.tsx'), 'utf8');
    expect(source).toContain("position: 'absolute'");
    expect(source).toContain('bottom,');
    expect(source).not.toMatch(/postpartum/i);
  });
});
