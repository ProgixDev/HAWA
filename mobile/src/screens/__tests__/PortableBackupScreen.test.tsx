import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PortableBackupScreen from '../PortableBackupScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {createPortableBackup} from '../../services/portableBackup';
import {__setKdfIterationsForTests} from '../../services/passphraseKdf';
import {resyncAllReminderNotifications} from '../../services/reminderResync';
import {pickBackupFile, shareBackupFile} from '../../services/portableBackupFiles';
import secureStorage, {resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../../services/secureAsyncStorage';
import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import {es} from '../../i18n/locales/es';
import {it as itLocale} from '../../i18n/locales/it';

jest.mock('../../services/portableBackupFiles', () => ({
  purgeBackupShareCache: jest.fn(() => Promise.resolve()),
  shareBackupFile: jest.fn(() => Promise.resolve('shared')),
  pickBackupFile: jest.fn(),
}));
// Re-deriving the reminders is every objective's scheduler plus the notification layer; this file is about the screen.
jest.mock('../../services/reminderResync', () => ({
  resyncAllReminderNotifications: jest.fn(() => Promise.resolve()),
}));

// Fixtures only. The passphrase screen: validation, the create/restore flows, and honest failures in four languages.

const Stack = createNativeStackNavigator();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const PASS = 'une phrase de passe assez longue';

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <PortableBackupScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'k', name: 'PortableBackup'} as never} />}</Stack.Screen>
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
const inputs = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(TextInput);
const type = async (input: ReactTestRenderer.ReactTestInstance, value: string) => {
  await act(async () => {
    input.props.onChangeText(value);
  });
};
const buttonByText = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'button' && node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === label))[0];

beforeEach(async () => {
  jest.clearAllMocks();
  setStructuredEncryptionEnabled(false);
  __setKdfIterationsForTests(100_000);
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
});
afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});
afterAll(() => __setKdfIterationsForTests(null));

describe('creating a backup', () => {
  it('explains the loss risk and what is not included, before anything is entered', async () => {
    const all = textsOf(await renderScreen());
    expect(all).toContain('Create a backup');
    expect(all.some(text => text.includes('If you lose this passphrase, the backup can’t be recovered'))).toBe(true);
    expect(all).toContain('Private photos are not included in this backup.');
  });

  it('refuses a short passphrase and a mismatch, and enables the button only when both are fine', async () => {
    const renderer = await renderScreen();
    const [pass, confirm] = inputs(renderer);
    await type(pass, 'short');
    expect(textsOf(renderer)).toContain('The passphrase is too short.');
    await type(pass, PASS);
    await type(confirm, 'something else entirely');
    expect(textsOf(renderer)).toContain('The two passphrases do not match.');
    expect(buttonByText(renderer, 'Create and share the backup').props.disabled).toBe(true);
    await type(confirm, PASS);
    expect(buttonByText(renderer, 'Create and share the backup').props.disabled).toBe(false);
  });

  it('creates an encrypted file, hands it to the share sheet, and wipes the passphrases from the form', async () => {
    await AsyncStorage.setItem('@hawa/daily-journal/v1', '[{"id":"a","date":"2026-09-20","symptoms":{"names":["Crampes"]}}]');
    const renderer = await renderScreen();
    const [pass, confirm] = inputs(renderer);
    await type(pass, PASS);
    await type(confirm, PASS);
    await act(async () => {
      buttonByText(renderer, 'Create and share the backup').props.onPress();
    });
    await flush();

    expect(shareBackupFile).toHaveBeenCalledTimes(1);
    const [fileName, contents] = (shareBackupFile as jest.Mock).mock.calls[0] as [string, string, string];
    expect(fileName).toMatch(/^awa-backup-\d{12}\.awabackup$/);
    expect(contents).not.toContain('Crampes');
    expect(contents).not.toContain(PASS);
    expect(textsOf(renderer)).toContain('Backup created.');
    expect(inputs(renderer)[0].props.value).toBe('');
    expect(inputs(renderer)[1].props.value).toBe('');
  });

  it('says so — and creates no file — when records cannot be read on this phone', async () => {
    setStructuredEncryptionEnabled(true);
    await secureStorage.setItem('@hawa/daily-journal/v1', '[{"id":"a"}]');
    const Keychain = jest.requireMock('react-native-keychain') as {setGenericPassword: (u: string, p: string, o: {service: string}) => Promise<unknown>};
    await Keychain.setGenericPassword('x', '88'.repeat(32), {service: 'com.hawa.private.structured-health-data.encryption-key'});
    (jest.requireActual('../../services/secureAesKeyStore') as {clearAesKeyCache: () => void}).clearAesKeyCache();
    resetStructuredStorageForTests();

    const renderer = await renderScreen();
    const [pass, confirm] = inputs(renderer);
    await type(pass, PASS);
    await type(confirm, PASS);
    await act(async () => {
      buttonByText(renderer, 'Create and share the backup').props.onPress();
    });
    await flush();
    expect(shareBackupFile).not.toHaveBeenCalled();
    expect(textsOf(renderer).some(text => text.includes('a complete backup can’t be made'))).toBe(true);
    setStructuredEncryptionEnabled(false);
  });
});

describe('restoring a backup', () => {
  const makeFile = async () => {
    await AsyncStorage.setItem('@hawa/daily-journal/v1', '[{"id":"from-backup"}]');
    return createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});
  };

  it('shows what was picked, then refuses a wrong passphrase without touching anything', async () => {
    const backup = await makeFile();
    (pickBackupFile as jest.Mock).mockResolvedValue({contents: backup.contents, name: backup.fileName});
    await AsyncStorage.setItem('@hawa/daily-journal/v1', '[{"id":"current"}]');
    const renderer = await renderScreen();

    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    expect(textsOf(renderer).some(text => text.startsWith('Backup of '))).toBe(true);

    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
    const restoreInput = inputs(renderer)[2];
    await type(restoreInput, 'the wrong passphrase!');
    await act(async () => {
      buttonByText(renderer, 'Restore this backup').props.onPress();
    });
    await flush();

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Restore this backup?');
    expect(textsOf(renderer).some(text => text.startsWith('Wrong passphrase, or the file is damaged'))).toBe(true);
    expect(await AsyncStorage.getItem('@hawa/daily-journal/v1')).toBe('[{"id":"current"}]');
  });

  it('restores with the right passphrase after an explicit confirmation', async () => {
    const backup = await makeFile();
    (pickBackupFile as jest.Mock).mockResolvedValue({contents: backup.contents, name: backup.fileName});
    await AsyncStorage.setItem('@hawa/daily-journal/v1', '[{"id":"current"}]');
    const renderer = await renderScreen();
    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
    await type(inputs(renderer)[2], PASS);
    await act(async () => {
      buttonByText(renderer, 'Restore this backup').props.onPress();
    });
    await flush();

    expect(textsOf(renderer).some(text => /^Backup restored \(\d+ records\)\.$/.test(text))).toBe(true);
    expect(await AsyncStorage.getItem('@hawa/daily-journal/v1')).toBe('[{"id":"from-backup"}]');
  });

  it('re-derives every reminder from the restored records (forced), once, after a successful restore', async () => {
    const backup = await makeFile();
    (pickBackupFile as jest.Mock).mockResolvedValue({contents: backup.contents, name: backup.fileName});
    const renderer = await renderScreen();
    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
    await type(inputs(renderer)[2], PASS);
    expect(resyncAllReminderNotifications).not.toHaveBeenCalled();

    await act(async () => {
      buttonByText(renderer, 'Restore this backup').props.onPress();
    });
    await flush();

    expect(resyncAllReminderNotifications).toHaveBeenCalledTimes(1);
    expect(resyncAllReminderNotifications).toHaveBeenCalledWith({force: true});
  });

  it('a refused restore (wrong passphrase) re-derives nothing: the records were not replaced', async () => {
    const backup = await makeFile();
    (pickBackupFile as jest.Mock).mockResolvedValue({contents: backup.contents, name: backup.fileName});
    const renderer = await renderScreen();
    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
    await type(inputs(renderer)[2], 'the wrong passphrase!');
    await act(async () => {
      buttonByText(renderer, 'Restore this backup').props.onPress();
    });
    await flush();

    expect(resyncAllReminderNotifications).not.toHaveBeenCalled();
  });

  it('says clearly when the chosen file is not a backup', async () => {
    (pickBackupFile as jest.Mock).mockResolvedValue({contents: 'hello', name: 'x.txt'});
    const renderer = await renderScreen();
    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    expect(textsOf(renderer)).toContain('This file is not an AWA backup.');
  });

  it('does nothing when the picker is cancelled', async () => {
    (pickBackupFile as jest.Mock).mockResolvedValue(null);
    const renderer = await renderScreen();
    await act(async () => {
      buttonByText(renderer, 'Choose a backup file').props.onPress();
    });
    await flush();
    expect(inputs(renderer)).toHaveLength(2); // no restore passphrase field appeared
  });
});

describe('four languages, same keys, same placeholders', () => {
  const leaves = (node: unknown, prefix = ''): Record<string, string> =>
    Object.entries(node as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'string' ? {...acc, [path]: value} : {...acc, ...leaves(value, path)};
    }, {});
  const pick = (locale: Record<string, unknown>) => ({...leaves(locale.portableBackup, 'portableBackup'), ...leaves(locale.dataSafety, 'dataSafety')});
  const reference = pick(en as never);
  const placeholders = (text: string) => (text.match(/{{\w+}}/g) ?? []).sort().join(',');

  it.each([['fr', fr], ['es', es], ['it', itLocale]] as const)('%s has every key, none empty, identical placeholders', (_name, locale) => {
    const translated = pick(locale as never);
    expect(Object.keys(translated).sort()).toEqual(Object.keys(reference).sort());
    for (const [key, text] of Object.entries(translated)) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(placeholders(text)).toBe(placeholders(reference[key]));
    }
  });

  it.each([
    ['fr', 'Sauvegarde chiffrée', 'Phrase secrète'],
    ['es', 'Copia de seguridad cifrada', 'Frase de contraseña'],
    ['it', 'Backup cifrato', 'Frase segreta'],
  ] as const)('renders in %s', async (language, title, label) => {
    await setAppLanguage(language);
    const all = textsOf(await renderScreen());
    expect(all).toContain(title);
    expect(all).toContain(label);
  });
});
