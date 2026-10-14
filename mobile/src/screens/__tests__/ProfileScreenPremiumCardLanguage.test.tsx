import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {hasPremiumArticles} from '../../data/libraryContent';
import i18n from '../../i18n';
import {fr} from '../../i18n/locales/fr';
import {en} from '../../i18n/locales/en';
import {es} from '../../i18n/locales/es';
import {it as itDictionary} from '../../i18n/locales/it';
import {tr} from '../../i18n/locales/tr';
import {ru} from '../../i18n/locales/ru';
import {de} from '../../i18n/locales/de';
import {zh} from '../../i18n/locales/zh';

// The Profile "AWA Premium" card: the title (premium.sheet.heroTitle, shared with the Premium sheet; "AWA" stays, the
// Premium designation is adapted per language), subtitle, benefit list and CTA follow the selected app language and must update at runtime (no restart) through the real setAppLanguage → i18n subscription.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

type PremiumCardCopy = {
  inactiveSubtitle: string;
  activeSubtitle: string;
  discoverPremium: string;
  activeSubscription: string;
  features: Record<'advancedStatistics' | 'pdfCsvExport' | 'unlimitedHistory' | 'inDepthEducationalContent' | 'additionalThemes', string>;
};
const titleOf = (dictionary: unknown): string => (dictionary as {premium: {sheet: {heroTitle: string}}}).premium.sheet.heroTitle;
const cardOf = (dictionary: unknown): PremiumCardCopy =>
  (dictionary as {profile: {premiumCard: PremiumCardCopy}}).profile.premiumCard;

const LANGUAGES = [
  ['en', en],
  ['fr', fr],
  ['es', es],
  ['it', itDictionary],
  ['tr', tr],
  ['ru', ru],
  ['de', de],
  ['zh', zh],
] as const;

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function renderProfile() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

async function selectLanguage(language: (typeof LANGUAGES)[number][0]) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  updatePrivacySecuritySettings({anonymousMode: false});
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await selectLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await selectLanguage('fr');
});

const expectedBenefits = (copy: PremiumCardCopy): string[] => [
  copy.features.advancedStatistics,
  copy.features.pdfCsvExport,
  copy.features.unlimitedHistory,
  ...(hasPremiumArticles() ? [copy.features.inDepthEducationalContent] : []),
  copy.features.additionalThemes,
];

describe('Profile Premium card — every language', () => {
  it.each(LANGUAGES)('%s: subtitle, every benefit and the CTA are in the selected language; the product name is unchanged', async (code, dictionary) => {
    await selectLanguage(code);
    const copy = cardOf(dictionary);
    const texts = textsOf(await renderProfile());
    expect(titleOf(dictionary)).toMatch(/^AWA /);
    expect(texts).toContain(titleOf(dictionary));
    expect(texts).toContain(copy.inactiveSubtitle);
    expect(texts).toContain(copy.discoverPremium);
    expectedBenefits(copy).forEach(benefit => expect(texts).toContain(benefit));
  });

  it.each(LANGUAGES)('%s: the active-subscription variant uses the translated subtitle and label', async (code, dictionary) => {
    await selectLanguage(code);
    updatePremiumState({isPremium: true, initialized: true});
    const copy = cardOf(dictionary);
    const texts = textsOf(await renderProfile());
    expect(texts).toContain(titleOf(dictionary));
    expect(texts).toContain(copy.activeSubtitle);
    expect(texts).toContain(copy.activeSubscription);
  });

  it.each(LANGUAGES.filter(([key]) => key !== 'en'))('%s: no raw key and no English leftover on the card', async (code, dictionary) => {
    await selectLanguage(code);
    const texts = textsOf(await renderProfile());
    const english = cardOf(en);
    expect(texts.some(text => text.startsWith('profile.premiumCard'))).toBe(false);
    [english.inactiveSubtitle, english.discoverPremium, english.features.advancedStatistics].forEach(leftover => {
      expect(texts.includes(leftover)).toBe(false);
    });
    expect(cardOf(dictionary).discoverPremium).not.toBe(english.discoverPremium);
  });
});

describe('Profile Premium card — runtime language switching', () => {
  it('re-renders the same mounted card through all seven languages and back, without a remount', async () => {
    const renderer = await renderProfile();
    const order = ['en', 'ru', 'zh', 'de', 'tr', 'it', 'es', 'fr', 'zh', 'en'] as const;
    for (const code of order) {
      await selectLanguage(code);
      const copy = cardOf(LANGUAGES.find(([key]) => key === code)![1]);
      const texts = textsOf(renderer);
      expect([code, texts.includes(copy.inactiveSubtitle)]).toEqual([code, true]);
      expect([code, texts.includes(copy.discoverPremium)]).toEqual([code, true]);
      expectedBenefits(copy).forEach(benefit => expect([code, benefit, texts.includes(benefit)]).toEqual([code, benefit, true]));
      expect([code, texts.includes(titleOf(LANGUAGES.find(([key]) => key === code)![1]))]).toEqual([code, true]);
    }
  });

  it('the Russian title is the adapted «AWA Премиум» (never a stale Latin one) and switching back restores it', async () => {
    const renderer = await renderProfile();
    await selectLanguage('ru');
    expect(textsOf(renderer)).toContain('AWA Премиум');
    expect(textsOf(renderer)).not.toContain('AWA Premium');
    await selectLanguage('de');
    expect(textsOf(renderer)).toContain('AWA Premium');
    expect(textsOf(renderer)).not.toContain('AWA Премиум');
  });

  it('switches language when Premium state changes underneath without losing translation', async () => {
    const renderer = await renderProfile();
    await selectLanguage('ru');
    await act(async () => {
      updatePremiumState({isPremium: true, initialized: true});
    });
    expect(textsOf(renderer)).toContain(cardOf(ru).activeSubscription);
    await selectLanguage('de');
    expect(textsOf(renderer)).toContain(cardOf(de).activeSubscription);
    expect(textsOf(renderer)).not.toContain(cardOf(ru).activeSubscription);
  });
});

describe('Premium sheet shows the same localized title as the Profile card', () => {
  it.each(LANGUAGES)('%s: sheet hero title equals the card title', async (code, dictionary) => {
    await selectLanguage(code);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <HawaPremiumBottomSheet onClose={jest.fn()} visible />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    expect(textsOf(renderer)).toContain(titleOf(dictionary));
  });
});
