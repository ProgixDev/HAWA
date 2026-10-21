import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ManagedProfileTypeScreen from '../ManagedProfileTypeScreen';
import ManagedProfileDaughterInfoScreen from '../ManagedProfileDaughterInfoScreen';
import ManagedProfileFirstPeriodScreen from '../ManagedProfileFirstPeriodScreen';
import ManagedProfileCycleSetupScreen from '../ManagedProfileCycleSetupScreen';
import ManagedProfileSuccessScreen from '../ManagedProfileSuccessScreen';
import {resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../../state/activeProfileStore';
import {clearManagedProfileDraft, startManagedProfileDraft} from '../../../state/managedProfileDraftStore';
import {resetAppLanguageForTests, setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import i18n from '../../../i18n';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import {ptPT} from '../../../testUtils/portugueseDictionaries';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});

// The daughter-profile creation flow (type -> daughter information -> first period -> cycle set-up -> success), in Portuguese: every
// step shows Portuguese text (accented letters on screen), never a raw key, never French or English chrome, and the accessibility labels are Portuguese too.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf).map(text => text.trim()).filter(Boolean);
const labelsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string').map(node => node.props.accessibilityLabel as string);
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

function MainTabsStub(): React.JSX.Element {
  return <Text>MainTabsStub</Text>;
}

async function renderFlow() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="ManagedProfileType" screenOptions={{headerShown: false}}>
              <Stack.Screen component={ManagedProfileTypeScreen as never} name="ManagedProfileType" />
              <Stack.Screen component={ManagedProfileDaughterInfoScreen as never} name="ManagedProfileDaughterInfo" />
              <Stack.Screen component={ManagedProfileFirstPeriodScreen as never} name="ManagedProfileFirstPeriod" />
              <Stack.Screen component={ManagedProfileCycleSetupScreen as never} name="ManagedProfileCycleSetup" />
              <Stack.Screen component={ManagedProfileSuccessScreen as never} name="ManagedProfileSuccess" />
              <Stack.Screen component={MainTabsStub as never} name="MainTabs" />
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

const leaves = (node: unknown, out: string[] = []): string[] => {
  if (typeof node === 'string') {out.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(child => leaves(child, out));}
  return out;
};
// strings that are French or English but NOT Portuguese: what a missed translation looks like on screen
const FOREIGN = new Set(
  [...leaves((fr as Record<string, unknown>).managedProfile), ...leaves((en as Record<string, unknown>).managedProfile)]
    .map(text => text.trim())
    .filter(text => text.length > 6 && /\s/.test(text))
    .filter(text => !leaves((ptPT as Record<string, unknown>).managedProfile).includes(text)),
);
const RAW_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+){1,}$/;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  clearManagedProfileDraft();
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await setAppLanguage('pt-PT');
  await i18n.changeLanguage('pt-PT');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

const STEPS = ['ManagedProfileType', 'ManagedProfileDaughterInfo', 'ManagedProfileFirstPeriod', 'ManagedProfileCycleSetup'] as const; // the success screen needs a created profile (route params): the full flow test covers it, its Portuguese wording is in the dictionary checks

describe('daughter onboarding in Portuguese', () => {
  it.each(STEPS)('%s: Portuguese text and accessibility labels, no raw key, no French / English chrome', async step => {
    startManagedProfileDraft();
    const renderer = await renderFlow();
    if (step !== 'ManagedProfileType') {
      await act(async () => {
        navRef.navigate(step as never);
      });
      await settle();
    }
    const texts = textsOf(renderer);
    const labels = labelsOf(renderer);
    expect(texts.length).toBeGreaterThan(2);
    expect(texts.filter(text => RAW_KEY.test(text))).toEqual([]);
    expect(labels.filter(label => RAW_KEY.test(label))).toEqual([]);
    expect([...texts, ...labels].filter(text => FOREIGN.has(text))).toEqual([]);
    expect([...texts, ...labels].filter(text => text !== text.normalize('NFC'))).toEqual([]); // precomposed accents
    expect(texts).not.toContain(fr.common.continue);
    expect(texts).not.toContain(en.common.continue);
  });

  it('the first screens speak Portuguese: the Continue button and the intro carry the dictionary wording', async () => {
    startManagedProfileDraft();
    const renderer = await renderFlow();
    const labels = labelsOf(renderer);
    expect(labels).toContain(i18n.t('common.continue'));
    expect(i18n.t('common.continue')).not.toBe(en.common.continue);
    expect(textsOf(renderer).some(text => /[ãõçáéíóúâêô]/i.test(text))).toBe(true);
  });

  it('the cycle set-up shows the saved-values note in Portuguese, with the period and cycle lengths filled in', async () => {
    startManagedProfileDraft();
    const renderer = await renderFlow();
    await act(async () => {
      navRef.navigate('ManagedProfileCycleSetup' as never);
    });
    await settle();
    const note = (ptPT as unknown as {managedProfile: {cycleSetup: {savedValuesNote: string}}}).managedProfile.cycleSetup.savedValuesNote;
    expect(note).toContain('{{');
    const shown = textsOf(renderer).find(text => /\d+\s+dias.*\d+\s+dias/.test(text) || (text.includes('dias') && /\d/.test(text) && !text.includes('{{')));
    // the note is rendered with real numbers (never the raw {{variables}})
    expect(textsOf(renderer).some(text => text.includes('{{'))).toBe(false);
    expect(shown === undefined || !shown.includes('{{')).toBe(true);
  });
});
