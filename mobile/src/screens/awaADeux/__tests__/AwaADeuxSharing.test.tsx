import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Switch, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import {PartnerPreviewModal} from '../AwaADeuxDialogs';
import {sharingSections, supportContent} from '../awaADeuxDemo';
import {
  AWA_A_DEUX_SHARING_STORAGE_KEY,
  DEFAULT_SHARING_TOGGLES,
  SHARING_KEYS,
  getSharingToggles,
  setSharingToggle,
  type SharingKey,
} from '../../../state/awaADeuxSharingStore';
import {buildPartnerSnapshot, computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// "Choisissez ce que vous souhaitez partager": four categories, eleven saved choices,
// pregnancy category only in pregnancy mode, and a partner preview built from the
// saved choices through the single visibility rule.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxSharingScreen as never} name="AwaADeuxSharing" />
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

const switches = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Switch);
const labelOf = (key: SharingKey) => sharingSections().flatMap(section => section.items).find(item => item.key === key)!.label;
const toggle = (renderer: ReactTestRenderer.ReactTestRenderer, key: SharingKey) =>
  switches(renderer).filter(node => node.props.accessibilityLabel === labelOf(key))[0];
const flip = async (renderer: ReactTestRenderer.ReactTestRenderer, key: SharingKey, value: boolean) => {
  await act(async () => {
    toggle(renderer, key).props.onValueChange(value);
  });
  await settle();
};
// The preview button/entry point was intentionally removed from THIS screen
// ("Choisissez ce que vous souhaitez partager") — see AwaADeuxSharingScreen.tsx's header
// comment. `PartnerPreviewModal` itself (AwaADeuxDialogs.tsx) is untouched and still used
// elsewhere (AwaADeuxPartnerConnectedScreen.tsx's own "Voir l’aperçu partenaire"), so its
// reactivity to the SAME saved sharing choices is exercised here by rendering it directly
// — always visible, reacting live to setSharingToggle()/setSelectedObjective() through its
// own useAwaADeuxSharing() subscription, exactly as it does wherever it is actually opened.
async function renderPreview() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PartnerPreviewModal onClose={() => {}} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}
const previewTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

// What the preview shows for each choice (the label of its block).
const PREVIEW_LABEL: Record<SharingKey, string> = {
  cycleDay: 'Jour du cycle',
  nextPeriod: 'Prochaines règles',
  periodStatus: 'Règles',
  fertileWindow: 'Fenêtre fertile',
  ovulation: 'Ovulation estimée',
  fertilityStatus: 'Fertilité',
  pregnancyWeek: 'Grossesse',
  dueDate: 'Accouchement prévu',
  babyDevelopment: 'Développement de bébé',
  mood: 'Humeur',
  dailyAdvice: 'Conseil du jour',
};
const PREGNANCY_KEYS: SharingKey[] = ['pregnancyWeek', 'dueDate', 'babyDevelopment'];

type Store = typeof import('../../../state/awaADeuxSharingStore');
// An app restart for the store only: a fresh module registry, scoped so React itself is not duplicated.
const restartStore = (): {store: Store; asyncStorage: {getItem: jest.Mock}} => {
  let result!: {store: Store; asyncStorage: {getItem: jest.Mock}};
  jest.isolateModules(() => {
    result = {
      asyncStorage: require('@react-native-async-storage/async-storage').default,
      store: require('../../../state/awaADeuxSharingStore'),
    };
  });
  return result;
};

const allOff = async () => {
  for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
};

beforeEach(async () => {
  await AsyncStorage.clear();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setSelectedObjective('cycle');
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('the visibility rule (what the partner may see)', () => {
  const values = Object.fromEntries(SHARING_KEYS.map(key => [key, `value-${key}`])) as Record<SharingKey, string>;

  it('the documented example: only cycle day, next period and mood are visible — the others are ABSENT, not just false', () => {
    const toggles = {...DEFAULT_SHARING_TOGGLES, cycleDay: true, nextPeriod: true, periodStatus: false, fertileWindow: false, ovulation: false, fertilityStatus: false, pregnancyWeek: false, dueDate: false, babyDevelopment: false, mood: true, dailyAdvice: false};
    const snapshot = buildPartnerSnapshot(values, toggles, {isPregnant: false});
    expect(Object.keys(snapshot).sort()).toEqual(['cycleDay', 'mood', 'nextPeriod']);
    expect(snapshot).toEqual({cycleDay: 'value-cycleDay', nextPeriod: 'value-nextPeriod', mood: 'value-mood'});
    // Even with pregnancy mode on, the pregnancy switches are off, so nothing pregnancy-related is included.
    expect(Object.keys(buildPartnerSnapshot(values, toggles, {isPregnant: true})).sort()).toEqual(['cycleDay', 'mood', 'nextPeriod']);
  });

  it.each(SHARING_KEYS)('%s: visible only when its own switch is ON', key => {
    const on = {...DEFAULT_SHARING_TOGGLES, [key]: true};
    const off = Object.fromEntries(SHARING_KEYS.map(k => [k, false])) as Record<SharingKey, boolean>;
    const context = {isPregnant: true};
    expect(Object.keys(buildPartnerSnapshot(values, {...off, [key]: true}, context))).toEqual([key]);
    expect(Object.keys(buildPartnerSnapshot(values, off, context))).toEqual([]);
    expect(computePartnerVisibility(on, context).fields[key]).toBe(true);
  });

  it('pregnancy information is never visible outside pregnancy mode, whatever the saved switches say', () => {
    const everything = Object.fromEntries(SHARING_KEYS.map(key => [key, true])) as Record<SharingKey, boolean>;
    const outside = computePartnerVisibility(everything, {isPregnant: false});
    PREGNANCY_KEYS.forEach(key => expect(outside.fields[key]).toBe(false));
    expect(Object.keys(buildPartnerSnapshot(values, everything, {isPregnant: false}))).not.toEqual(expect.arrayContaining(PREGNANCY_KEYS));
    const inside = computePartnerVisibility(everything, {isPregnant: true});
    PREGNANCY_KEYS.forEach(key => expect(inside.fields[key]).toBe(true));
  });

  it('recommendations adapt to the phase only when the cycle day / phase is shared (they cannot reveal a hidden phase)', () => {
    expect(computePartnerVisibility({...DEFAULT_SHARING_TOGGLES, cycleDay: true}, {isPregnant: false}).recommendations).toBe('phase');
    expect(computePartnerVisibility({...DEFAULT_SHARING_TOGGLES, cycleDay: false}, {isPregnant: false}).recommendations).toBe('general');
    expect(computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false}).supportTips).toBe(true);
  });
});

describe('persistence', () => {
  it('a switch is saved under the versioned key and only that key of the health data world is written', async () => {
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();
    await setSharingToggle('mood', true);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem.mock.calls[0][0]).toBe(AWA_A_DEUX_SHARING_STORAGE_KEY);
    expect(AWA_A_DEUX_SHARING_STORAGE_KEY).toBe('@hawa/awa-a-deux-sharing/v1');
    const saved = JSON.parse(setItem.mock.calls[0][1]);
    expect(saved.version).toBe(1);
    expect(saved.toggles.mood).toBe(true);
    expect(Object.keys(saved.toggles).sort()).toEqual([...SHARING_KEYS].sort());
  });

  it('every one of the eleven choices survives an app restart (fresh module registry)', async () => {
    for (const key of SHARING_KEYS) {await setSharingToggle(key, !DEFAULT_SHARING_TOGGLES[key]);}
    const expected = {...getSharingToggles()};

    const {store: fresh} = restartStore();
    expect(fresh.getSharingToggles()).toEqual(fresh.DEFAULT_SHARING_TOGGLES); // nothing in memory yet
    const restored = await fresh.hydrateSharingToggles();
    expect(restored).toEqual(expected);
    SHARING_KEYS.forEach(key => expect(restored[key]).toBe(!DEFAULT_SHARING_TOGGLES[key]));
  });

  it('a damaged, older or partial save falls back to defaults per choice and drops unknown keys', async () => {
    await AsyncStorage.setItem(AWA_A_DEUX_SHARING_STORAGE_KEY, JSON.stringify({version: 1, toggles: {mood: true, cycleDay: 'yes', notes: true, intimacy: true}}));
    const {store: fresh} = restartStore();
    const restored = await fresh.hydrateSharingToggles();
    expect(restored.mood).toBe(true);
    expect(restored.cycleDay).toBe(fresh.DEFAULT_SHARING_TOGGLES.cycleDay); // not a boolean → default
    expect(Object.keys(restored).sort()).toEqual([...fresh.SHARING_KEYS].sort()); // "notes" / "intimacy" are never kept

    await AsyncStorage.setItem(AWA_A_DEUX_SHARING_STORAGE_KEY, '{not json');
    const {store: broken} = restartStore();
    expect(await broken.hydrateSharingToggles()).toEqual(broken.DEFAULT_SHARING_TOGGLES);
  });

  it('an unreadable save is never overwritten by the defaults', async () => {
    await setSharingToggle('mood', true);
    const before = await AsyncStorage.getItem(AWA_A_DEUX_SHARING_STORAGE_KEY);
    const {store: fresh, asyncStorage: AsyncStorageFresh} = restartStore();
    AsyncStorageFresh.getItem.mockImplementationOnce(async () => {
      throw new Error('storage unavailable');
    });
    await fresh.hydrateSharingToggles();
    AsyncStorageFresh.getItem.mockImplementationOnce(async () => {
      throw new Error('storage unavailable');
    });
    await expect(fresh.setSharingToggle('ovulation', true)).rejects.toThrow(/refusing to write/);
    expect(await AsyncStorage.getItem(AWA_A_DEUX_SHARING_STORAGE_KEY)).toBe(before);
  });

  it('the screen shows the saved choices again when it is reopened', async () => {
    const first = await renderScreen();
    await flip(first, 'mood', true);
    await flip(first, 'cycleDay', false);
    act(() => first.unmount());
    activeRenderers.length = 0;

    const reopened = await renderScreen();
    expect(toggle(reopened, 'mood').props.value).toBe(true);
    expect(toggle(reopened, 'cycleDay').props.value).toBe(false);
    expect(toggle(reopened, 'nextPeriod').props.value).toBe(true);
  });
});

describe('the four categories', () => {
  it('outside pregnancy mode: Cycle, Fertilité et conception and Bien-être et soutien; no Pregnancy category', async () => {
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toEqual(expect.arrayContaining(['Cycle', 'Fertilité et conception', 'Bien-être et soutien']));
    expect(texts).not.toContain('Grossesse');
    PREGNANCY_KEYS.forEach(key => expect(toggle(renderer, key)).toBeUndefined());
    expect(switches(renderer)).toHaveLength(8);
  });

  it('in pregnancy mode the Pregnancy category appears (three switches), in the right place, live', async () => {
    const renderer = await renderScreen();
    await act(async () => {
      await setSelectedObjective('pregnancy');
    });
    await settle();
    const texts = textsOf(renderer);
    expect(texts).toContain('Grossesse');
    expect(texts.indexOf('Fertilité et conception')).toBeLessThan(texts.indexOf('Grossesse'));
    expect(texts.indexOf('Grossesse')).toBeLessThan(texts.indexOf('Bien-être et soutien'));
    PREGNANCY_KEYS.forEach(key => expect(toggle(renderer, key)).toBeDefined());
    expect(switches(renderer)).toHaveLength(11);

    await act(async () => {
      await setSelectedObjective('cycle');
    });
    await settle();
    expect(textsOf(renderer)).not.toContain('Grossesse'); // hidden again automatically
  });

  it('every item of every category has its own switch, with the default states', async () => {
    await setSelectedObjective('pregnancy');
    const renderer = await renderScreen();
    expect(sharingSections().map(section => section.title)).toEqual(['Cycle', 'Fertilité et conception', 'Grossesse', 'Bien-être et soutien']);
    for (const key of SHARING_KEYS) {
      expect(toggle(renderer, key)).toBeDefined();
      expect(toggle(renderer, key).props.value).toBe(DEFAULT_SHARING_TOGGLES[key]);
      expect(toggle(renderer, key).props.accessibilityState).toMatchObject({checked: DEFAULT_SHARING_TOGGLES[key]});
    }
    expect(SHARING_KEYS).toHaveLength(11);
  });

  it('the support tips and the phase recommendations are shown WITHOUT a switch', async () => {
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    supportContent().forEach(item => {
      expect(texts).toContain(item.label);
      expect(texts).toContain(item.note);
      expect(switches(renderer).some(node => node.props.accessibilityLabel === item.label)).toBe(false);
    });
    expect(texts).toContain('Humeur');
    expect(toggle(renderer, 'mood')).toBeDefined(); // personal information keeps its own switch
  });

  it('nothing sensitive is offered: no notes, intimacy, symptoms, medical results, medication, contraception, loss, lochia, Nifas or religious item', async () => {
    await setSelectedObjective('pregnancy');
    const renderer = await renderScreen();
    const text = textsOf(renderer).join(' | ').toLowerCase();
    for (const forbidden of ['note personnelle', 'rapport', 'intim', 'symptôme', 'analyse', 'médicament', 'contracepti', 'fausse couche', 'saignement', 'lochie', 'nifas', 'qadaa', 'prière', 'pureté', 'spirituel', 'jeûne']) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe('every switch', () => {
  it.each(SHARING_KEYS)('%s: turns ON and OFF, is saved each time, and touches no other choice', async key => {
    await setSelectedObjective('pregnancy');
    const renderer = await renderScreen();
    const before = {...getSharingToggles()};
    await flip(renderer, key, !before[key]);
    expect(toggle(renderer, key).props.value).toBe(!before[key]);
    expect(JSON.parse((await AsyncStorage.getItem(AWA_A_DEUX_SHARING_STORAGE_KEY)) as string).toggles).toEqual({...before, [key]: !before[key]});
    SHARING_KEYS.filter(other => other !== key).forEach(other => expect(toggle(renderer, other).props.value).toBe(before[other]));
    await flip(renderer, key, before[key]);
    expect(toggle(renderer, key).props.value).toBe(before[key]);
    expect(JSON.parse((await AsyncStorage.getItem(AWA_A_DEUX_SHARING_STORAGE_KEY)) as string).toggles).toEqual(before);
  });
});

describe('the partner preview follows the choices (rendered directly — see renderPreview()’s comment)', () => {
  it('shows a block only when its switch is ON — checked for each of the eleven choices', async () => {
    await setSelectedObjective('pregnancy');
    for (const key of SHARING_KEYS) {
      await allOff();
      await setSharingToggle(key, true);
      const renderer = await renderPreview();
      const texts = previewTexts(renderer);
      expect(texts).toContain(PREVIEW_LABEL[key]);
      SHARING_KEYS.filter(other => other !== key && PREVIEW_LABEL[other] !== PREVIEW_LABEL[key]).forEach(other => {
        expect(texts).not.toContain(PREVIEW_LABEL[other]);
      });
      act(() => renderer.unmount());
      activeRenderers.length = 0;
    }
  });

  it('"Fenêtre fertile" OFF → it does not appear; ON → it appears; turning it back off removes it again', async () => {
    await setSharingToggle('fertileWindow', false);
    const renderer = await renderPreview();
    expect(previewTexts(renderer)).not.toContain('Fenêtre fertile');

    await setSharingToggle('fertileWindow', true);
    await settle();
    expect(previewTexts(renderer)).toContain('Fenêtre fertile');
    expect(previewTexts(renderer)).toContain('Dans 3 jours');

    await setSharingToggle('fertileWindow', false);
    await settle();
    expect(previewTexts(renderer)).not.toContain('Fenêtre fertile');
    expect(previewTexts(renderer)).not.toContain('Dans 3 jours');
  });

  it('the documented example: cycle day, next period and mood only', async () => {
    await allOff();
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('nextPeriod', true);
    await setSharingToggle('mood', true);
    const renderer = await renderPreview();
    const texts = previewTexts(renderer);
    ['Jour du cycle', 'Prochaines règles', 'Humeur'].forEach(label => expect(texts).toContain(label));
    ['Règles', 'Fenêtre fertile', 'Ovulation estimée', 'Fertilité', 'Grossesse', 'Accouchement prévu', 'Développement de bébé', 'Conseil du jour'].forEach(label => expect(texts).not.toContain(label));
  });

  it('pregnancy items saved as ON never reach the preview outside pregnancy mode (and come back in pregnancy mode)', async () => {
    for (const key of PREGNANCY_KEYS) {await setSharingToggle(key, true);}
    const renderer = await renderPreview();
    expect(previewTexts(renderer)).not.toEqual(
      expect.arrayContaining(['Grossesse', 'Accouchement prévu', 'Développement de bébé']),
    );

    await act(async () => {
      await setSelectedObjective('pregnancy');
    });
    await settle();
    ['Grossesse', 'Accouchement prévu', 'Développement de bébé'].forEach(label => expect(previewTexts(renderer)).toContain(label));
  });

  it('the support tips are always in the preview; the recommendation is general unless the cycle day / phase is shared', async () => {
    const renderer = await renderPreview();
    let texts = previewTexts(renderer);
    expect(texts).toContain('Pour la soutenir');
    expect(texts).toContain('Phase actuelle : privilégiez le repos et la douceur.');

    await setSharingToggle('cycleDay', false);
    await settle();
    texts = previewTexts(renderer);
    expect(texts).toContain('Pour la soutenir');
    expect(texts).toContain('Restez à l’écoute et proposez votre aide.');
    expect(texts).not.toContain('Phase actuelle : privilégiez le repos et la douceur.');
    expect(texts).not.toContain('Phase actuelle');
    expect(texts).not.toContain('Jour du cycle');
  });

  it('with everything off the preview says nothing personal is shared (support content aside)', async () => {
    await allOff();
    const renderer = await renderPreview();
    const texts = previewTexts(renderer);
    ['Jour du cycle', 'Prochaines règles', 'Humeur', 'Conseil du jour'].forEach(label => expect(texts).not.toContain(label));
    expect(texts).toContain('Pour la soutenir');
  });
});

describe('the sharing screen no longer offers its own preview entry point', () => {
  it('does not render "Voir un aperçu du côté partenaire" (the preview stays reachable elsewhere, e.g. AwaADeuxPartnerConnectedScreen)', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Voir un aperçu du côté partenaire')).toHaveLength(0);
    expect(textsOf(renderer)).not.toContain('Voir un aperçu du côté partenaire');
  });

  it('no unused import/handler for the removed button remains in source', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxSharingScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/PartnerPreviewModal|previewOpen|setPreviewOpen/);
  });
});

describe('scope', () => {
  it('only the sharing screen and its hook read the saved choices; the other AWA à deux screens do not touch storage', () => {
    const dir = path.resolve(__dirname, '..');
    for (const name of ['AwaADeuxPartnerViewScreen.tsx', 'AwaADeuxBenefitsScreen.tsx', 'AwaADeuxStepLayout.tsx']) {
      const source = fs.readFileSync(path.join(dir, name), 'utf8');
      const imports = source.split('\n').filter(line => /^import |^} from /.test(line)).join('\n');
      expect(imports).not.toMatch(/async-storage|\/state\/|supabase|\/services\//i);
    }
    const store = fs.readFileSync(path.resolve(dir, '../../state/awaADeuxSharingStore.ts'), 'utf8');
    expect(store).not.toMatch(/supabase|fetch\(/);
  });
});
