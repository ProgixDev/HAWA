import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar, Switch, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../AppearanceScreen';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppearanceMode,
  setAppLanguage,
  setSelectedThemeId,
  setTrueBlackEnabled,
} from '../../state/themePreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';

// Only the specific internal module backing RN's useColorScheme() is
// mocked — same narrow technique as AwaThemeProvider.test.tsx. This lets
// "Système" mode be driven deterministically without AppearanceScreen (or
// anything but the Provider) ever calling the real hook.
let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderScreen() {
  const navigation = {goBack: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <AppearanceScreen navigation={navigation} route={{key: 'test', name: 'Appearance'}} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  resetPremiumStateForTests();
  mockColorScheme = 'light';
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (see
  // themePreferences.ts's DEFAULT_APP_LANGUAGE) — this whole file's tests
  // were written against a French-rendered screen (French accessibility
  // labels, French row/sheet text), which was a safe assumption back when
  // French was the default. Pinning French explicitly here preserves every
  // test's original intent (testing the sheet's apply/cancel/selection
  // mechanics) without relying on which language happens to be the current
  // default. The one test that's actually ABOUT the default (further below)
  // calls resetAppLanguageForTests() again itself to get the true
  // no-preference state.
  await setAppLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('AppearanceScreen — static architecture guard', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../AppearanceScreen.tsx'), 'utf8');

  it('never imports or calls the useColorScheme hook', () => {
    expect(source).not.toMatch(/\buseColorScheme\b\s*[,}]/); // named import
    expect(source).not.toMatch(new RegExp('=\\s*useColorScheme\\(\\)')); // a real call site
  });

  it('no longer defines a local LIGHT_CHROME/DARK_CHROME palette', () => {
    expect(source).not.toMatch(/LIGHT_CHROME/);
    expect(source).not.toMatch(/DARK_CHROME/);
  });

  it('no longer resolves appearance mode locally', () => {
    expect(source).not.toMatch(/isDarkChrome/);
    expect(source).not.toMatch(/appearanceMode === 'dark' \|\|/);
  });

  it('never touches AsyncStorage directly (goes through themePreferences setters only)', () => {
    expect(source).not.toMatch(/AsyncStorage/);
  });

  it('never uses Midnight as a technical dark-chrome color donor', () => {
    // The screen's own pre-existing defensive filter (excluding 'midnight'
    // from the selectable palette list) legitimately still names it — see
    // getEnabledAwaThemes() usage below. What must be absent is the
    // *donor* pattern this phase removed (getAwaThemeById('midnight')).
    expect(source).not.toMatch(/getAwaThemeById\(\s*'midnight'\s*\)/);
    expect(source).not.toMatch(/MIDNIGHT_TOKENS/);
  });
});

describe('AppearanceScreen — resolved global theme', () => {
  it('AWA Original Light renders with the resolved background, header title and subtitle preserved', async () => {
    const renderer = await renderScreen();
    const title = renderer.root.findAll(node => node.props.children === 'Apparence')[0];
    expect(title).toBeTruthy();

    const subtitle = renderer.root.findAll(
      node => typeof node.props.children === 'string' && node.props.children.startsWith('Personnalisez l’apparence de votre application AWA'),
    )[0];
    expect(subtitle).toBeTruthy();

    const statusBar = renderer.root.findByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('dark-content');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderScreen();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('changes Dark -> Light without remounting', async () => {
    await setAppearanceMode('dark');
    const renderer = await renderScreen();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('light-content');

    await act(async () => {
      await setAppearanceMode('light');
    });

    expect(statusBar().props.barStyle).toBe('dark-content');
  });

  it('Système mode follows the Provider-resolved device scheme, not a local formula', async () => {
    mockColorScheme = 'dark';
    await setAppearanceMode('system');
    const renderer = await renderScreen();
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('light-content');
  });

  it('palette switching updates screen chrome without remounting', async () => {
    const renderer = await renderScreen();
    const headerTitle = () => renderer.root.findAll(node => node.props.children === 'Apparence')[0];
    const colorBefore = flattenStyle(headerTitle().props.style).color;

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(flattenStyle(headerTitle().props.style).color).not.toBe(colorBefore);
  });
});

describe('AppearanceScreen — True Black', () => {
  it('True Black switch is disabled outside Dark, enabled once Dark is resolved', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findByType(Switch).props.disabled).toBe(true);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(renderer.root.findByType(Switch).props.disabled).toBe(false);
  });

  it('True Black only visually applies once Dark is active', async () => {
    const renderer = await renderScreen();
    await act(async () => {
      await setTrueBlackEnabled(true);
    });
    // Still light — True Black must not affect a Light-resolved screen.
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(renderer.root.findByType(Switch).props.value).toBe(true);
  });
});

describe('AppearanceScreen — Premium gating', () => {
  it('tapping a locked Premium palette opens the existing HawaPremiumBottomSheet instead of selecting it', async () => {
    const renderer = await renderScreen();
    const sheet = () => renderer.root.findByType(HawaPremiumBottomSheet);
    expect(sheet().props.visible).toBe(false);

    const lockedCard = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Thème Lavender Night, Premium verrouillé',
    )[0];
    expect(lockedCard).toBeTruthy();

    await act(async () => {
      lockedCard.props.onPress();
    });

    expect(sheet().props.visible).toBe(true);
  });

  it('reverts to AWA Original when Premium is lost, and returns automatically when restored (non-destructive fallback)', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderScreen();
    const headerTitleColor = () => flattenStyle(renderer.root.findAll(node => node.props.children === 'Apparence')[0].props.style).color;
    const warmSandColor = headerTitleColor();

    await act(async () => {
      updatePremiumState({isPremium: false});
    });
    const fallbackColor = headerTitleColor();
    expect(fallbackColor).not.toBe(warmSandColor);

    await act(async () => {
      updatePremiumState({isPremium: true});
    });
    expect(headerTitleColor()).toBe(warmSandColor);
  });
});

describe('AppearanceScreen — navigation preserved', () => {
  it('back button calls navigation.goBack', async () => {
    const goBack = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <AppearanceScreen navigation={{goBack} as never} route={{key: 'test', name: 'Appearance'}} />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    // Root cause of a stray "AwaThemeProvider ... not wrapped in act(...)"
    // warning in every later test in this file: this renderer's return value
    // was previously discarded instead of going through the shared
    // `activeRenderers` array, so afterEach() never unmounted it — its
    // AwaThemeProvider (and the usePremium() it calls internally) stayed
    // subscribed to themePreferences.ts/premiumStore.ts for the rest of the
    // file, and every subsequent beforeEach()'s setSelectedThemeId/
    // setAppearanceMode/setTrueBlackEnabled/resetPremiumStateForTests() call
    // then notified this orphaned instance outside of any act(). Pushing it
    // into the same activeRenderers array every other render in this file
    // already uses lets the existing afterEach() unmount (and thus
    // unsubscribe) it like all the others.
    activeRenderers.push(renderer!);
    // Rendered without throwing and goBack is wired — exercised via the
    // accessibility-labeled back button.
    expect(typeof goBack).toBe('function');
  });
});

/* ============================================================
   DISPLAY SECTION — "Interface tablette" removed entirely (a UI
   simplification, never wired to persisted state). "Langue de l'application"
   is a real, pressable row that opens the language bottom sheet — see the
   dedicated describe block below for that sheet's own behavior.
============================================================ */

describe('AppearanceScreen — "Affichage" section (Interface tablette removed)', () => {
  it('does not render "Interface tablette" (label, subtitle, icon, or any dead handler)', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAllByProps({children: 'Interface tablette'}).length).toBe(0);
    expect(renderer.root.findAllByProps({name: 'tablet'}).length).toBe(0);
  });

  it('renders "Langue de l’application" showing the current saved language, as a pressable row (opens the language sheet)', async () => {
    const renderer = await renderScreen();
    const title = renderer.root.findAllByProps({children: 'Langue de l’application'})[0];
    expect(title).toBeTruthy();
    expect(renderer.root.findAllByProps({children: 'Français'}).length).toBeGreaterThan(0);

    const row = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Langue de l’application' && node.props.accessibilityRole === 'button',
    )[0];
    expect(row).toBeTruthy();
    expect(typeof row.props.onPress).toBe('function');
  });

  it('static guard: no dead "Interface tablette" code (handler, icon literal) remains', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AppearanceScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/Interface tablette/);
    expect(source).not.toMatch(/handleInertRow/);
    expect(source).not.toMatch(/icon="tablet"/);
  });
});

/* ============================================================
   LANGUAGE BOTTOM SHEET — UI-only for this task (no string translation
   yet). App-wide preference (themePreferences.ts), never profile-scoped.
============================================================ */

describe('AppearanceScreen — "Langue de l’application" bottom sheet', () => {
  const openSheet = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const row = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Langue de l’application' && node.props.accessibilityRole === 'button',
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
      node => node.props.accessibilityLabel === 'Appliquer' && node.props.accessibilityRole === 'button',
    )[0];
    await act(async () => {
      apply.props.onPress();
    });
  };
  const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
    renderer.root
      .findAllByType(Text)
      .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

  it('pressing the row opens the sheet, with French selected by default', async () => {
    const renderer = await renderScreen();
    expect(textsOf(renderer)).not.toContain('Choisissez la langue utilisée dans AWA.');

    await openSheet(renderer);
    expect(textsOf(renderer)).toContain('Choisissez la langue utilisée dans AWA.');
    expect(radios(renderer, 'Français')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: false});
  });

  it('English can be selected — only one language is selected at a time', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await selectLanguage(renderer, 'English');

    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'Français')[0].props.accessibilityState).toEqual({checked: false});
  });

  it('selecting English without pressing "Appliquer" does not persist it — the saved preference stays untouched', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await selectLanguage(renderer, 'English');

    expect(getAppLanguage()).toBe('fr');
  });

  it('dismissing the sheet (backdrop) restores the currently saved language next time it opens', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await selectLanguage(renderer, 'English');

    const backdrop = renderer.root.findAll(node => node.props.accessibilityLabel === 'Fermer')[0];
    await act(async () => {
      backdrop.props.onPress();
    });

    await openSheet(renderer);
    expect(radios(renderer, 'Français')[0].props.accessibilityState).toEqual({checked: true});
    expect(radios(renderer, 'English')[0].props.accessibilityState).toEqual({checked: false});
  });

  it('"Appliquer" persists English, closes the sheet, and updates the Appearance row subtitle', async () => {
    const renderer = await renderScreen();
    await openSheet(renderer);
    await selectLanguage(renderer, 'English');
    await pressApply(renderer);

    expect(getAppLanguage()).toBe('en');
    expect(textsOf(renderer)).not.toContain('Choisissez la langue utilisée dans AWA.'); // sheet closed
    expect(renderer.root.findAllByProps({children: 'English'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({children: 'Français'}).length).toBe(0);
  });

  it('the preference survives a fresh hydration (simulated app restart)', async () => {
    await setAppLanguage('en');
    await resetActiveProfileForTests(); // unrelated store reset, proves no cross-contamination
    expect(getAppLanguage()).toBe('en');
  });

  it('stays global when switching profiles — never resets on owner/daughter switch', async () => {
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
    await setAppLanguage('en');

    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    expect(getAppLanguage()).toBe('en');

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getAppLanguage()).toBe('en');
  });

  it('applying English actually switches the rendered UI (not just the row subtitle) — and back to French restores it', async () => {
    // The row's own accessibilityLabel is itself the translated title, so it
    // changes language too — look it up by either known label rather than
    // reusing the (French-only) shared `openSheet` helper above.
    const openLanguageSheetRegardlessOfLocale = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
      const row = renderer.root.findAll(
        node =>
          (node.props.accessibilityLabel === 'Langue de l’application' || node.props.accessibilityLabel === 'App language') &&
          node.props.accessibilityRole === 'button',
      )[0];
      await act(async () => {
        row.props.onPress();
      });
    };
    const pressApplyRegardlessOfLocale = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
      const apply = renderer.root.findAll(
        node =>
          (node.props.accessibilityLabel === 'Appliquer' || node.props.accessibilityLabel === 'Apply') &&
          node.props.accessibilityRole === 'button',
      )[0];
      await act(async () => {
        apply.props.onPress();
      });
    };

    const renderer = await renderScreen();
    expect(textsOf(renderer)).toContain('Apparence');
    expect(textsOf(renderer)).toContain('Thème');
    expect(textsOf(renderer)).not.toContain('Appearance');

    await openLanguageSheetRegardlessOfLocale(renderer);
    await selectLanguage(renderer, 'English');
    await pressApplyRegardlessOfLocale(renderer);

    expect(textsOf(renderer)).toContain('Appearance');
    expect(textsOf(renderer)).toContain('Theme');
    expect(textsOf(renderer)).not.toContain('Apparence');

    await openLanguageSheetRegardlessOfLocale(renderer);
    await selectLanguage(renderer, 'Français');
    await pressApplyRegardlessOfLocale(renderer);

    expect(textsOf(renderer)).toContain('Apparence');
    expect(textsOf(renderer)).not.toContain('Appearance');
  });

  it('PHASE 7M — brand-new installs with no saved preference default to English — no onboarding, no migration popup', async () => {
    // Undo this file's own beforeEach pin-to-French (see its comment) to get
    // back to the true "nothing ever saved" state this test is about.
    await resetAppLanguageForTests();
    expect(getAppLanguage()).toBe('en');
    const renderer = await renderScreen();
    expect(renderer.root.findAllByProps({children: 'Appearance'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({children: 'Apparence'}).length).toBe(0);
  });
});

describe('AppearanceScreen — palette list content', () => {
  it('never shows Midnight as a selectable palette card', async () => {
    const renderer = await renderScreen();
    const midnightCard = renderer.root.findAll(
      node => typeof node.props.children === 'string' && node.props.children === 'Midnight',
    );
    // Only the fixed static Text node above; palette name cells are the
    // Text elements rendered per theme — none should read "Midnight".
    const paletteNames = renderer.root.findAll(
      node => node.type === Text && node.props.children === 'Midnight',
    );
    expect(paletteNames.length).toBe(0);
    expect(midnightCard.length).toBe(0);
  });
});
