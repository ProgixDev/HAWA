import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import {OBJECTIVE_ICONS} from '../../components/onboarding/ObjectiveIcon';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {getActiveObjective, setSelectedObjective, type ObjectiveId} from '../../state/onboardingPreferences';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import i18n from '../../i18n';

// "Modifier mon objectif" bottom sheet of the Profile: it draws the same outlined icons and 46 dp frames as the onboarding
// ObjectiveScreen (one shared ObjectiveIcon), with no emoji and no pastel tiles; choosing an objective still saves it.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const ORDER: ObjectiveId[] = ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss'];

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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function openSheet(renderer: ReactTestRenderer.ReactTestRenderer) {
  const label = renderer.root.findAllByType(Text).find(node => textOf(node) === i18n.t('profile.myObjective'))!;
  let node: ReactTestRenderer.ReactTestInstance | null = label;
  while (node && typeof node.props.onPress !== 'function') {
    node = node.parent;
  }
  await act(async () => {
    node!.props.onPress();
  });
}

// Each option is a Pressable (composite + host nodes carry the same role): keep only the outermost node of each option.
const options = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAll(node => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function')
    .filter(node => !(node.parent && node.parent.props.accessibilityRole === 'radio'));

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  updatePrivacySecuritySettings({anonymousMode: false});
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await setSelectedObjective('cycle');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Profile "Modifier mon objectif" sheet — shared objective icons', () => {
  it('shows all eight objectives with the same icons and 46 dp frames as the onboarding picker', async () => {
    const renderer = await renderProfile();
    await openSheet(renderer);
    const radios = options(renderer);
    expect(radios).toHaveLength(8);
    radios.forEach((radio, index) => {
      const icon = radio.findAll(node => node.props.name === OBJECTIVE_ICONS[ORDER[index]] && node.props.size === 26)[0];
      expect(icon).toBeDefined();
      const frame = StyleSheet.flatten(icon.parent!.props.style) as {width: number; height: number; borderWidth: number; borderRadius: number};
      expect([frame.width, frame.height, frame.borderWidth, frame.borderRadius]).toEqual([46, 46, 1.5, 12]);
      // no emoji anywhere in the option
      const texts = radio.findAllByType(Text).map(textOf).join('');
      expect(texts).not.toMatch(/\p{Extended_Pictographic}/u);
    });
  });

  it('highlights the chosen objective\'s frame with the primary border and keeps the other frames quiet', async () => {
    await setSelectedObjective('pregnancy');
    const renderer = await renderProfile();
    await openSheet(renderer);
    const borders = options(renderer).map(radio => {
      const icon = radio.findAll(node => typeof node.props.name === 'string' && node.props.size === 26)[0];
      return (StyleSheet.flatten(icon.parent!.props.style) as {borderColor: string}).borderColor;
    });
    const selectedIndex = ORDER.indexOf('pregnancy');
    borders.forEach((border, index) => {
      if (index === selectedIndex) {
        expect(border).not.toMatch(/^rgba/);
      } else {
        expect(border).toMatch(/^rgba/);
      }
    });
  });

  it('choosing an objective still saves it', async () => {
    const renderer = await renderProfile();
    await openSheet(renderer);
    await act(async () => {
      options(renderer)[ORDER.indexOf('postpartum')].props.onPress();
    });
    for (let index = 0; index < 10; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    expect(getActiveObjective()).toBe('postpartum');
  });
});
