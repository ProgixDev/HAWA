import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import StatisticsScreen from '../StatisticsScreen';
import DataRecoveryScreen from '../DataRecoveryScreen';
import DataAvailabilityBanner from '../../components/security/DataAvailabilityBanner';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {reloadActiveProfileData, resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import secureStorage, {__markUnavailableForTests, isAnyStructuredDataUnavailable, resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../../services/secureAsyncStorage';
import * as Keychain from 'react-native-keychain';
import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {clearAesKeyCache} from '../../services/secureAesKeyStore';

// What the person SEES when protected records cannot be read: never "no statistics yet", never an empty history.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef<{DataRecovery: undefined}>();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function render(children: React.ReactNode) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <>{children}</>}</Stack.Screen>
              <Stack.Screen name="DataRecovery" component={DataRecoveryScreen as never} />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return renderer;
}

/** A REAL unreadable record: an envelope written under one key, read after the key changed — what a lost key looks like. */
const makeUnreadable = async (key: string) => {
  setStructuredEncryptionEnabled(true);
  await secureStorage.setItem(key, '[{"id":"secret"}]');
  await Keychain.setGenericPassword('x', '77'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
  resetStructuredStorageForTests();
  reloadActiveProfileData(); // make every store read its (now unreadable) record afresh, as at the next launch
};

beforeEach(async () => {
  setStructuredEncryptionEnabled(false);
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
});
afterEach(() => {
  setStructuredEncryptionEnabled(false);
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  resetStructuredStorageForTests();
  jest.restoreAllMocks();
});

describe('Statistics with unreadable data', () => {
  const screen = <StatisticsScreen navigation={{} as never} route={{key: 'k', name: 'Statistics'} as never} />;

  it('says the statistics cannot be shown — it does not claim there is no data', async () => {
    await makeUnreadable('@hawa/daily-journal/v1');
    const all = texts(await render(screen));
    expect(all).toContain('Your statistics can’t be shown right now');
    expect(all).not.toContain('No statistics yet');
  });

  it('is language-aware (French)', async () => {
    await setAppLanguage('fr');
    await makeUnreadable('@hawa/confirmed-period-history');
    expect(texts(await render(screen))).toContain('Tes statistiques ne peuvent pas être affichées');
  });

  it('an unreadable record of ANOTHER profile does not hide this profile’s statistics', async () => {
    __markUnavailableForTests('@hawa/daily-journal/v1:profile:somebody-else');
    const all = texts(await render(screen));
    expect(all).not.toContain('Your statistics can’t be shown right now');
    expect(all).toContain('No statistics yet');
  });

  it('returns to the normal view once the data can be read again', async () => {
    await makeUnreadable('@hawa/daily-journal/v1');
    const renderer = await render(screen);
    expect(texts(renderer)).toContain('Your statistics can’t be shown right now');
    await AsyncStorage.removeItem('@hawa/daily-journal/v1'); // the user chose to erase the unreadable record
    await act(async () => {
      resetStructuredStorageForTests();
      reloadActiveProfileData(); // what "Try again" does
    });
    await flush();
    expect(texts(renderer)).not.toContain('Your statistics can’t be shown right now');
  });
});

describe('the data-availability banner', () => {
  it('is invisible when everything can be read, and appears (with the reassurance) when something cannot', async () => {
    const renderer = await render(<DataAvailabilityBanner />);
    expect(texts(renderer)).not.toContain('Some protected data can’t be read');

    await act(async () => {
      __markUnavailableForTests('@hawa/pregnancy-dating', 'key-lost');
    });
    await flush();
    const all = texts(renderer);
    expect(all).toContain('Some protected data can’t be read');
    expect(all).toContain('Your records were not deleted or changed.');
  });

  it('opens the recovery screen when pressed', async () => {
    __markUnavailableForTests('@hawa/pregnancy-dating');
    const renderer = await render(<DataAvailabilityBanner />);
    const press = renderer.root.findAll(node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      press.props.onPress();
    });
    await flush();
    expect(navRef.getCurrentRoute()?.name).toBe('DataRecovery');
  });
});

describe('the recovery screen', () => {
  const recovery = <DataRecoveryScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'r', name: 'DataRecovery'} as never} />;

  it('explains a lost key, offers every option, and says nothing was written over', async () => {
    __markUnavailableForTests('@hawa/pregnancy-dating', 'key-lost');
    const all = texts(await render(recovery));
    expect(all).toContain('Protected data unavailable');
    expect(all.some(text => text.includes('protection key is no longer available'))).toBe(true);
    for (const option of ['Try again', 'Restore from a backup', 'Create a new protection key', 'Erase unreadable records']) {
      expect(all).toContain(option);
    }
    expect(all.some(text => text.includes('does not write over those records'))).toBe(true);
  });

  it('offers no "new key" when the problem is not a lost key, and no destructive option when nothing is unreadable', async () => {
    __markUnavailableForTests('@hawa/pregnancy-dating', 'authentication-failed');
    const all = texts(await render(recovery));
    expect(all).not.toContain('Create a new protection key');
    expect(all).toContain('Erase unreadable records');

    await act(async () => {
      resetStructuredStorageForTests();
    });
    await flush();
    expect(texts(renderers[renderers.length - 1])).not.toContain('Erase unreadable records');
  });

  it('erasing needs an explicit confirmation — pressing the button alone removes nothing', async () => {
    await AsyncStorage.setItem('@hawa/pregnancy-dating', 'unreadable-envelope-stand-in');
    __markUnavailableForTests('@hawa/pregnancy-dating');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const renderer = await render(recovery);
    const erase = renderer.root.findAll(node => node.props.accessibilityRole === 'button' && node.findAllByType(Text).some(text => text.props.children === 'Erase unreadable records'))[0];
    await act(async () => {
      erase.props.onPress();
    });
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Erase unreadable records?');
    expect(await AsyncStorage.getItem('@hawa/pregnancy-dating')).toBe('unreadable-envelope-stand-in');
    expect(isAnyStructuredDataUnavailable()).toBe(true);
  });
});
