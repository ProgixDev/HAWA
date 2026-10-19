import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import AnonymousModeSuccessScreen from '../AnonymousModeSuccessScreen';
import AnonymousAvatar from '../../components/profile/AnonymousAvatar';
import AnonymousProfileIcon, {anonymousProfileIconColors} from '../../components/profile/AnonymousProfileIcon';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {resolveAwaTheme} from '../../theme/awaThemeTokens';
import {contrastRatio} from '../../theme/contrast';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {getHasCompletedOnboarding, setHasCompletedOnboarding} from '../../state/onboardingPreferences';
import {getProfileAvatarPreferences, setAnonymousAvatarPreferences} from '../../state/profileAvatarPreferences';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import i18n from '../../i18n';

// Anonymous mode (state/securityPreferences.ts `anonymousMode`) has NO avatar editing: no pencil/camera badge on the
// Profile header avatar, no camera / gallery / avatar picker, and the creation flow no longer passes through the avatar
// customizer. Its profile picture is a fixed neutral silhouette in a circular purple container (the cartoon avatar is
// gone from the Profile screen) and any stored avatar data is left alone. The authenticated profile keeps exactly the
// camera badge and photo sheet it had.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const active: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderProfile() {
  const navigation = {navigate: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation as never} route={{key: 'test', name: 'Profile'} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  active.push(renderer);
  return {renderer, navigation};
}

async function renderSuccess(params?: object) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), pop: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <AnonymousModeSuccessScreen navigation={navigation as never} route={{key: 'k', name: 'AnonymousModeSuccess', params} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  active.push(renderer);
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
const withLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
  updatePrivacySecuritySettings({anonymousMode: false});
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await setHasCompletedOnboarding(false);
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Profile — avatar editing in anonymous mode', () => {
  it('shows the silhouette icon with NO edit badge: no pencil, no camera, no avatar picker entry', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const {renderer, navigation} = await renderProfile();
    expect(renderer.root.findAllByType(AnonymousProfileIcon).length).toBeGreaterThan(0);
    expect(withLabel(renderer, i18n.t('profile.editAnonymousAvatarAccessibility'))).toHaveLength(0);
    expect(withLabel(renderer, i18n.t('profile.editAvatarAccessibility'))).toHaveLength(0);
    // the photo sheet (camera / gallery rows) is not rendered either
    expect(textsOf(renderer)).not.toContain(i18n.t('profile.photoModal.takePhoto'));
    expect(textsOf(renderer)).not.toContain(i18n.t('profile.photoModal.chooseFromGallery'));
    expect(navigation.navigate).not.toHaveBeenCalledWith('AnonymousAvatarCustomizer', expect.anything());
  });

  it('replaces the cartoon avatar: the identity card shows the 64 dp silhouette, the cartoon is nowhere on the screen', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const {renderer} = await renderProfile();
    expect(renderer.root.findAllByType(AnonymousAvatar)).toHaveLength(0);
    const icons = renderer.root.findAllByType(AnonymousProfileIcon);
    expect(icons.map(icon => icon.props.size)).toContain(64);
    // the silhouette is the project's own `account` glyph, centred in a circle
    const glyphs = icons[0].findAllByType(MaterialDesignIcons);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0].props.name).toBe('account');
  });

  it('the silhouette is static and non-interactive: no handler on it, none on any ancestor inside the identity card', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const {renderer} = await renderProfile();
    const icon = renderer.root.findAllByType(AnonymousProfileIcon).find(candidate => candidate.props.size === 64)!;
    const circle = icon.findAll(node => node.props.pointerEvents === 'none')[0];
    expect(circle).toBeDefined();
    expect(circle.props.accessibilityElementsHidden).toBe(true);
    expect(circle.props.importantForAccessibility).toBe('no-hide-descendants');
    icon.findAll(() => true).forEach(node => ['onPress', 'onLongPress', 'onPressIn', 'onResponderRelease'].forEach(handler => expect(node.props[handler]).toBeUndefined()));
    // no ancestor is pressable either (the identity card is plain Views inside the scroll content)
    for (let ancestor = icon.parent; ancestor; ancestor = ancestor.parent) {
      const {onPress, onLongPress} = ancestor.props;
      expect([onPress, onLongPress]).toEqual([undefined, undefined]);
    }
  });

  it('leaves stored avatar data untouched (the old anonymous style / colour are neither read nor deleted)', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    setAnonymousAvatarPreferences('hijab', '#123456');
    const before = getProfileAvatarPreferences();
    await renderProfile();
    expect(getProfileAvatarPreferences()).toEqual(before);
    expect(before.anonymousAvatarStyle).toBe('hijab');
  });
});

describe('Profile — authenticated mode keeps its avatar editing exactly', () => {
  it('shows the camera badge, and pressing it opens the photo sheet (camera / gallery)', async () => {
    const {renderer} = await renderProfile();
    expect(renderer.root.findAllByType(AnonymousAvatar)).toHaveLength(0);
    expect(renderer.root.findAllByType(AnonymousProfileIcon)).toHaveLength(0);
    const badges = withLabel(renderer, i18n.t('profile.editAvatarAccessibility'));
    expect(badges.length).toBeGreaterThan(0);
    expect(withLabel(renderer, i18n.t('profile.editAnonymousAvatarAccessibility'))).toHaveLength(0);
    expect(textsOf(renderer)).not.toContain(i18n.t('profile.photoModal.takePhoto'));
    await act(async () => {
      badges[0].props.onPress();
    });
    expect(textsOf(renderer)).toContain(i18n.t('profile.photoModal.takePhoto'));
    expect(textsOf(renderer)).toContain(i18n.t('profile.photoModal.chooseFromGallery'));
  });
});

describe('AnonymousModeSuccessScreen — no avatar step any more', () => {
  it('fresh setup from AuthScreen: "Continue" completes onboarding and enters the app, never the avatar customizer', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const {renderer, navigation} = await renderSuccess({source: 'auth'});
    await act(async () => {
      withLabel(renderer, i18n.t('anonymous.success.continue'))[0].props.onPress();
    });
    expect(getHasCompletedOnboarding()).toBe(true);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('settings entry: "Done" still pops back to the screen that opened the flow, without touching onboarding', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const {renderer, navigation} = await renderSuccess({source: 'settings'});
    await act(async () => {
      withLabel(renderer, i18n.t('anonymous.success.finish'))[0].props.onPress();
    });
    expect(navigation.pop).toHaveBeenCalledWith(3);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(getHasCompletedOnboarding()).toBe(false);
  });
});

describe('AnonymousProfileIcon — theme tokens only, readable in every palette and mode', () => {
  const IDS = ['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const;
  const MODES: Array<['light' | 'dark' | 'true black', boolean, boolean]> = [
    ['light', false, false],
    ['dark', true, false],
    ['true black', true, true],
  ];

  it.each(IDS.flatMap(id => MODES.map(([mode, dark, black]) => [id, mode, dark, black] as const)))(
    '%s / %s: the silhouette reads on its container (AA 4.5:1) and the circle stands out from the card',
    (id, _mode, dark, black) => {
      const theme = resolveAwaTheme(id, dark, black);
      const {container, silhouette, outline} = anonymousProfileIconColors(theme);
      expect(contrastRatio(silhouette, container)).toBeGreaterThanOrEqual(4.5);
      // a tonal container, visibly different from the card it sits on, never the card colour itself
      expect(container).not.toBe(theme.colors.surface);
      expect(contrastRatio(container, theme.colors.surface)).toBeGreaterThan(1.1);
      expect(outline).toMatch(/^rgba\(/);
    },
  );

  it('Dark: the silhouette is the lighter purple on the deeper purple container; Light: the reverse tonal pair', () => {
    const dark = anonymousProfileIconColors(resolveAwaTheme('awa-original', true, false));
    const light = anonymousProfileIconColors(resolveAwaTheme('awa-original', false, false));
    const luminance = (hex: string) => contrastRatio(hex, '#000000');
    expect(luminance(dark.silhouette)).toBeGreaterThan(luminance(dark.container));
    expect(luminance(light.silhouette)).toBeLessThan(luminance(light.container));
  });
});
