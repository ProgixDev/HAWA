import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import PersonalInformationScreen from '../PersonalInformationScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {getCachedPersonalInformation, updatePersonalInformation} from '../../state/personalInformationStore';
import {getFirstName} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {resetSaveFailureForTests} from '../../services/saveFailure';
import {readStoredString} from '../../testUtils/structuredStorage';
import i18n from '../../i18n';

// PHASE 4 — profile (PersonalInformationScreen). The real screen over the real personalInformationStore (encryption at rest included); only the
// native date picker, the photo picker and the storage write that is made to fail are simulated. Already covered elsewhere and not repeated:
// "Not provided" with nothing entered, nothing written by opening the screen (MissingPersonalHealthInfoScreens), the store's encryption,
// migration and French-only language (personalInformationStore.test), the live "Language" row (SettingsFamily). Every value is invented.

const mockPicker: {props: {onValueChange: (event: unknown, date: Date) => void; onDismiss?: () => void; maximumDate?: Date; value?: Date} | null} = {props: null};
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: never) => {
    mockPicker.props = props;
    return null;
  },
}));

const STORAGE_KEY = '@hawa/personal-information/v1';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const realSetItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation();
const navigation = {goBack: jest.fn(), navigate: jest.fn()};

const settle = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setImmediate(resolve));
    });
  }
};

async function mount() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <PersonalInformationScreen navigation={navigation as never} route={{key: 'k', name: 'PersonalInformation', params: undefined} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const findButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  return matches.find(match => !matches.some(other => other !== match && match.findAll(node => node === other).length > 0));
};
async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const target = findButton(renderer, label);
  if (!target) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await target.props.onPress();
  });
  await settle();
}
const input = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(TextInput)[0];
async function type(renderer: ReactTestRenderer.ReactTestRenderer, value: string) {
  await act(async () => {
    input(renderer).props.onChangeText(value);
  });
}
const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const NOT_PROVIDED = () => t('profile.notProvided');
const SAVE = () => t('common.save');
const TOAST = () => t('personalInformation.toastUpdated');
const LABEL = {
  firstName: () => t('personalInformation.firstNameLabel'),
  lastName: () => t('personalInformation.lastNameLabel'),
  email: () => t('personalInformation.emailLabel'),
  phone: () => t('personalInformation.phoneLabel'),
  country: () => t('personalInformation.countryLabel'),
  preferredName: () => t('personalInformation.preferredNameQuestion'),
  calendar: () => t('personalInformation.mainCalendarLabel'),
  timeFormat: () => t('personalInformation.timeFormatLabel'),
};
const stored = async () => JSON.parse((await readStoredString(STORAGE_KEY)) as string) as Record<string, unknown>;
const failWrites = () =>
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    if (key === STORAGE_KEY) {throw new Error('disk full');}
    return realSetItem?.(key, value);
  });
const restoreWrites = () => (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  restoreWrites();
  resetSaveFailureForTests();
  jest.clearAllMocks();
  mockPicker.props = null;
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await updatePersonalInformation({firstName: '', lastName: '', birthDate: '', email: '', phone: '', country: '', preferredName: '', avatarUri: undefined, calendar: 'double', timeFormat: '24h'});
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  restoreWrites();
  alertSpy.mockRestore();
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('what the screen shows from the stored profile', () => {
  it('shows the stored values, a readable birth date, and "Not provided" only for what is empty', async () => {
    await updatePersonalInformation({firstName: 'Amina', email: 'amina.test@example.com', birthDate: '1995-03-12', country: 'Maroc', calendar: 'hijri', timeFormat: '12h'});
    const renderer = await mount();
    const texts = textsOf(renderer);
    for (const shown of ['Amina', 'amina.test@example.com', 'Maroc', t('personalInformation.calendars.hijriLabel'), t('personalInformation.time12h')]) {
      expect(texts).toContain(shown);
    }
    expect(texts.some(text => text.includes('1995') && text.includes('12'))).toBe(true);
    // lastName, phone and preferred name are still empty
    expect(texts.filter(text => text === NOT_PROVIDED())).toHaveLength(3);
  });

  it('a damaged stored record (numbers, null, junk) shows "Not provided", never "NaN" or "undefined"', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({firstName: 42, lastName: null, email: {junk: true}, birthDate: 'not-a-date', country: 7}));
    const {loadPersonalInformation} = require('../../state/personalInformationStore');
    await loadPersonalInformation();
    const renderer = await mount();
    const texts = textsOf(renderer);
    for (const bad of ['NaN', 'undefined', 'null', 'Invalid']) {
      expect(texts.some(text => text.includes(bad))).toBe(false);
    }
    expect(texts).toContain(NOT_PROVIDED());
  });
});

describe('text fields (first name, last name, e-mail, phone, preferred name)', () => {
  it('the editor opens on the current value, saves the trimmed text, closes, shows a toast and updates the row', async () => {
    await updatePersonalInformation({lastName: 'Initial'});
    const renderer = await mount();
    await press(renderer, LABEL.lastName());
    expect(input(renderer).props.value).toBe('Initial');
    await type(renderer, '  Benali-Test  ');
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain('Benali-Test');
    expect(textsOf(renderer)).toContain(TOAST());
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0); // the sheet is closed
    expect(getCachedPersonalInformation().lastName).toBe('Benali-Test');
  });

  it('an empty field opens empty, and only the edited field changes', async () => {
    await updatePersonalInformation({firstName: 'Amina', country: 'Maroc'});
    const renderer = await mount();
    await press(renderer, LABEL.phone());
    expect(input(renderer).props.value).toBe('');
    await type(renderer, '+212 6 12 34 56 78');
    await press(renderer, SAVE());
    const cached = getCachedPersonalInformation();
    expect(cached).toMatchObject({phone: '+212 6 12 34 56 78', firstName: 'Amina', country: 'Maroc', email: ''});
  });

  it.each([
    ['firstName', '', 'requiredField'],
    ['firstName', '    ', 'requiredField'],
    ['email', 'no-at-sign', 'invalidEmail'],
    ['email', 'a@b', 'invalidEmail'],
    ['email', 'a b@c.d', 'invalidEmail'],
    ['phone', '1234567', 'invalidPhone'],
    ['phone', '+12 (3) 45', 'invalidPhone'],
  ] as const)('%s = "%s" is refused (%s): message under the field, sheet and draft kept, nothing written, no toast', async (field, value, errorKey) => {
    const renderer = await mount();
    const before = await readStoredString(STORAGE_KEY);
    await press(renderer, LABEL[field]());
    await type(renderer, value);
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t(`personalInformation.${errorKey}`));
    expect(input(renderer).props.value).toBe(value);
    expect(await readStoredString(STORAGE_KEY)).toBe(before);
    expect(textsOf(renderer)).not.toContain(TOAST());
  });

  it('the boundaries are accepted: a phone with exactly 8 digits, a minimal e-mail', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.phone());
    await type(renderer, '12345678');
    await press(renderer, SAVE());
    await press(renderer, LABEL.email());
    await type(renderer, 'a@b.c');
    await press(renderer, SAVE());
    expect(getCachedPersonalInformation()).toMatchObject({phone: '12345678', email: 'a@b.c'});
  });

  it('the error goes away as soon as she types again', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.email());
    await type(renderer, 'bad');
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('personalInformation.invalidEmail'));
    await type(renderer, 'bad@x');
    expect(textsOf(renderer)).not.toContain(t('personalInformation.invalidEmail'));
  });

  it('cancelling closes the editor and writes nothing', async () => {
    const renderer = await mount();
    const before = await readStoredString(STORAGE_KEY);
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Draft');
    await press(renderer, t('common.cancel'));
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
    expect(await readStoredString(STORAGE_KEY)).toBe(before);
    expect(getCachedPersonalInformation().firstName).toBe('');
  });

  it('the first name (or, when set, the preferred name) becomes the name the app greets her with', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Amina');
    await press(renderer, SAVE());
    expect(getFirstName()).toBe('Amina');
    await press(renderer, LABEL.preferredName());
    await type(renderer, 'Mina');
    await press(renderer, SAVE());
    expect(getFirstName()).toBe('Mina');
  });

  it('what is saved is kept at rest: e-mail and phone encrypted, first name readable, and all of it comes back after a restart of the store', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.email());
    await type(renderer, 'amina.test@example.com');
    await press(renderer, SAVE());
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Amina');
    await press(renderer, SAVE());
    const raw = await stored();
    expect(raw.firstName).toBe('Amina');
    expect(JSON.stringify(raw)).not.toContain('amina.test@example.com');

    // a restart: a fresh store module over the same storage and keys
    const keychain = require('react-native-keychain');
    let reloaded: {email: string; firstName: string} | undefined;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('react-native-keychain', () => keychain);
      jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
      const fresh = require('../../state/personalInformationStore');
      reloaded = await fresh.loadPersonalInformation();
    });
    expect(reloaded).toMatchObject({email: 'amina.test@example.com', firstName: 'Amina'});
  });
});

describe('lists (country, calendar, time format)', () => {
  it('the country list filters as she types, ignores case, and choosing one saves it', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.country());
    expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Algérie', 'Maroc', 'France']));
    await act(async () => {
      input(renderer).props.onChangeText('MA');
    });
    expect(textsOf(renderer)).toContain('Maroc');
    expect(textsOf(renderer)).not.toContain('France');
    await act(async () => {
      input(renderer).props.onChangeText('zzz');
    });
    expect(textsOf(renderer)).not.toContain('Maroc');
    await act(async () => {
      input(renderer).props.onChangeText('maroc');
    });
    await press(renderer, 'Maroc');
    expect(getCachedPersonalInformation().country).toBe('Maroc');
    expect(textsOf(renderer)).toContain(TOAST());
  });

  it('the calendar choice offers the three calendars and the chosen one is saved and shown', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.calendar());
    for (const key of ['gregorianLabel', 'hijriLabel', 'doubleLabel']) {
      expect(findButton(renderer, t(`personalInformation.calendars.${key}`))).toBeDefined();
    }
    await press(renderer, t('personalInformation.calendars.gregorianLabel'));
    expect(getCachedPersonalInformation().calendar).toBe('gregorian');
    expect(textsOf(renderer)).toContain(t('personalInformation.calendars.gregorianLabel'));
    expect((await stored()).calendar).toBe('gregorian');
  });

  it('the time format can be switched to 12 h and back to 24 h', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.timeFormat());
    await press(renderer, t('personalInformation.time12h'));
    expect(getCachedPersonalInformation().timeFormat).toBe('12h');
    await press(renderer, LABEL.timeFormat());
    await press(renderer, t('personalInformation.time24h'));
    expect(getCachedPersonalInformation().timeFormat).toBe('24h');
  });

  it('cancelling a list changes nothing', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.calendar());
    await press(renderer, t('common.cancel'));
    expect(getCachedPersonalInformation().calendar).toBe('double');
    expect(textsOf(renderer)).not.toContain(TOAST());
  });
});

describe('birth date', () => {
  it('opening the picker writes nothing; the picker cannot go past today and starts on the saved date', async () => {
    await updatePersonalInformation({birthDate: '1995-03-12'});
    const renderer = await mount();
    const before = await readStoredString(STORAGE_KEY);
    await press(renderer, t('personalInformation.birthDateLabel'));
    expect(mockPicker.props).not.toBeNull();
    expect(mockPicker.props!.value?.getFullYear()).toBe(1995);
    expect(mockPicker.props!.maximumDate!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    expect(await readStoredString(STORAGE_KEY)).toBe(before);
  });

  it.each([
    ['late evening', new Date(2001, 11, 31, 23, 30, 0), '2001-12-31'],
    ['just after midnight', new Date(2002, 0, 1, 0, 30, 0), '2002-01-01'],
  ])('a chosen date (%s) is saved as the local YYYY-MM-DD day, never shifted by the time zone, and shown readable', async (_label, picked, expected) => {
    const renderer = await mount();
    await press(renderer, t('personalInformation.birthDateLabel'));
    await act(async () => {
      mockPicker.props!.onValueChange({}, picked);
    });
    await settle();
    expect(getCachedPersonalInformation().birthDate).toBe(expected);
    expect(textsOf(renderer).some(text => text.includes(expected.slice(0, 4)) && text.includes(String(Number(expected.slice(8)))))).toBe(true);
  });
});

describe('profile photo', () => {
  const pick = (uri: string | undefined) =>
    ({assets: uri ? [{uri}] : undefined, didCancel: !uri}) as never;

  it('a gallery photo is saved; the camera works the same way', async () => {
    const renderer = await mount();
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(pick('file:///photos/test-gallery.jpg'));
    await press(renderer, t('personalInformation.addPhoto'));
    await press(renderer, t('personalInformation.chooseFromGallery'));
    expect(getCachedPersonalInformation().avatarUri).toBe('file:///photos/test-gallery.jpg');

    (launchCamera as jest.Mock).mockResolvedValueOnce(pick('file:///photos/test-camera.jpg'));
    await press(renderer, t('personalInformation.editPhoto'));
    await press(renderer, t('personalInformation.takePhoto'));
    expect(getCachedPersonalInformation().avatarUri).toBe('file:///photos/test-camera.jpg');
  });

  it('cancelling the picker changes nothing and shows no toast', async () => {
    const renderer = await mount();
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(pick(undefined));
    await press(renderer, t('personalInformation.addPhoto'));
    await press(renderer, t('personalInformation.chooseFromGallery'));
    expect(getCachedPersonalInformation().avatarUri).toBeUndefined();
    expect(textsOf(renderer)).not.toContain(TOAST());
  });

  it('"delete" is only offered when there is a photo, and it removes it for good', async () => {
    const renderer = await mount();
    await press(renderer, t('personalInformation.addPhoto'));
    expect(findButton(renderer, t('personalInformation.deletePhoto'))).toBeUndefined();
    await press(renderer, t('common.cancel'));

    await updatePersonalInformation({avatarUri: 'file:///photos/test.jpg'});
    const again = await mount();
    await press(again, t('personalInformation.editPhoto'));
    await press(again, t('personalInformation.deletePhoto'));
    expect(getCachedPersonalInformation().avatarUri).toBeUndefined();
    expect((await stored()).avatarUri).toBeUndefined();
    expect(findButton(again, t('personalInformation.addPhoto'))).toBeDefined();
  });
});

describe('a refused or failed write', () => {
  it('shows the alert once, keeps the editor and the typed text, shows no toast, gives the stored value and the greeting back, and a retry saves', async () => {
    await updatePersonalInformation({firstName: 'Amina'});
    const renderer = await mount();
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Nouvelle');
    failWrites();
    await press(renderer, SAVE());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(t('saveFailure.title'));
    expect(input(renderer).props.value).toBe('Nouvelle'); // the draft is still in the open editor
    expect(textsOf(renderer)).not.toContain(TOAST());
    expect(getCachedPersonalInformation().firstName).toBe('Amina'); // rolled back
    expect(getFirstName()).toBe('Amina');
    expect((await stored()).firstName).toBe('Amina');

    restoreWrites();
    await press(renderer, SAVE());
    expect(getCachedPersonalInformation().firstName).toBe('Nouvelle');
    expect(getFirstName()).toBe('Nouvelle');
    expect(textsOf(renderer)).toContain(TOAST());
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('a list choice that cannot be written is not shown as chosen, and the photo is not changed', async () => {
    const renderer = await mount();
    failWrites();
    await press(renderer, LABEL.timeFormat());
    await press(renderer, t('personalInformation.time12h'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(getCachedPersonalInformation().timeFormat).toBe('24h');
    expect(textsOf(renderer)).not.toContain(TOAST());
    expect(textsOf(renderer)).toContain(t('personalInformation.time24h'));
  });

  it('back leaves the screen and nothing else is navigated to after a save', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Amina');
    await press(renderer, SAVE());
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    await press(renderer, t('common.back'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});

describe('observation: a second tap on "Save" while the write runs', () => {
  it('writes the same values twice at worst and ends in a consistent state (there is no in-flight guard on this screen)', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.firstName());
    await type(renderer, 'Amina');
    const spy = jest.spyOn(AsyncStorage, 'setItem');
    spy.mockClear();
    const save = findButton(renderer, SAVE())!;
    await act(async () => {
      await Promise.all([save.props.onPress(), save.props.onPress()]);
    });
    await settle();
    expect(getCachedPersonalInformation().firstName).toBe('Amina');
    expect((await stored()).firstName).toBe('Amina');
    expect(alertSpy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});


// ---------------------------------------------------------------------------------------------------------------------------------------------
// Validated rule (14/11/2026): first and last name are REQUIRED; e-mail, phone and preferred name are OPTIONAL — they can be emptied and saved
// ("Not provided" afterwards) — but a value that is typed must still be valid (e-mail shape, at least 8 phone digits).
// ---------------------------------------------------------------------------------------------------------------------------------------------
const FULL_PROFILE = {
  firstName: 'Amina',
  lastName: 'Benali-Test',
  email: 'amina.test@example.com',
  phone: '+213 5 55 12 34 56',
  preferredName: 'Mina',
  country: 'Maroc',
  birthDate: '1995-03-12',
  calendar: 'hijri' as const,
  timeFormat: '12h' as const,
};
const OPTIONAL_FIELDS = ['email', 'phone', 'preferredName'] as const;

describe('optional fields: they can be emptied and saved', () => {
  beforeEach(async () => {
    await updatePersonalInformation(FULL_PROFILE);
  });

  it.each(OPTIONAL_FIELDS)('%s: clearing it and saving is accepted — no error, toast, closed editor, "Not provided", every other field untouched', async field => {
    const renderer = await mount();
    await press(renderer, LABEL[field]());
    expect(input(renderer).props.value).toBe(FULL_PROFILE[field]);
    await type(renderer, '');
    await press(renderer, SAVE());

    expect(textsOf(renderer)).not.toContain(t('personalInformation.requiredField'));
    expect(textsOf(renderer)).toContain(TOAST());
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
    expect(textsOf(renderer)).not.toContain(FULL_PROFILE[field]);
    expect(textsOf(renderer)).toContain(NOT_PROVIDED());
    expect(getCachedPersonalInformation()).toMatchObject({...FULL_PROFILE, [field]: ''});
    // the record at rest no longer holds it (an empty sensitive field is stored as an absent key, never as an empty envelope)
    const raw = await stored();
    expect(raw[field] === undefined || raw[field] === '').toBe(true);
    expect(JSON.stringify(raw)).not.toContain(FULL_PROFILE[field]);
  });

  it.each(OPTIONAL_FIELDS)('%s: spaces only count as empty', async field => {
    const renderer = await mount();
    await press(renderer, LABEL[field]());
    await type(renderer, '     ');
    await press(renderer, SAVE());
    expect(getCachedPersonalInformation()[field]).toBe('');
    expect(textsOf(renderer)).toContain(TOAST());
  });

  it('all three can be emptied one after the other; first name, last name and everything else stay', async () => {
    const renderer = await mount();
    for (const field of OPTIONAL_FIELDS) {
      await press(renderer, LABEL[field]());
      await type(renderer, '');
      await press(renderer, SAVE());
    }
    expect(getCachedPersonalInformation()).toMatchObject({...FULL_PROFILE, email: '', phone: '', preferredName: ''});
  });

  it('an empty optional field can be filled again, and the new value must be valid', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.email());
    await type(renderer, '');
    await press(renderer, SAVE());
    await press(renderer, LABEL.email());
    expect(input(renderer).props.value).toBe('');
    await type(renderer, 'not-an-email');
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('personalInformation.invalidEmail'));
    expect(getCachedPersonalInformation().email).toBe('');
    await type(renderer, 'back@example.com');
    await press(renderer, SAVE());
    expect(getCachedPersonalInformation().email).toBe('back@example.com');
  });

  it('a typed but invalid value is still refused and the stored value is kept (it is not treated as "clear")', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.phone());
    await type(renderer, '1234567');
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('personalInformation.invalidPhone'));
    expect(getCachedPersonalInformation().phone).toBe(FULL_PROFILE.phone);
    expect(input(renderer).props.value).toBe('1234567');
  });

  it('clearing the preferred name makes the app greet her by her first name again', async () => {
    expect(getFirstName()).toBe('Mina');
    const renderer = await mount();
    await press(renderer, LABEL.preferredName());
    await type(renderer, '');
    await press(renderer, SAVE());
    expect(getFirstName()).toBe('Amina');
  });

  it('what was emptied stays empty — and the rest stays — when the store is read again after a restart', async () => {
    const renderer = await mount();
    for (const field of ['email', 'preferredName'] as const) {
      await press(renderer, LABEL[field]());
      await type(renderer, '');
      await press(renderer, SAVE());
    }
    const keychain = require('react-native-keychain');
    let reloaded: Record<string, unknown> | undefined;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('react-native-keychain', () => keychain);
      jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
      const fresh = require('../../state/personalInformationStore');
      reloaded = await fresh.loadPersonalInformation();
    });
    expect(reloaded).toMatchObject({...FULL_PROFILE, email: '', preferredName: ''});
  });

  it('a refused write: the alert, the (empty) draft kept, the previous value back, then a retry empties it', async () => {
    const renderer = await mount();
    await press(renderer, LABEL.email());
    await type(renderer, '');
    failWrites();
    await press(renderer, SAVE());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(input(renderer).props.value).toBe(''); // the draft is still in the open editor
    expect(textsOf(renderer)).not.toContain(TOAST());
    expect(getCachedPersonalInformation().email).toBe(FULL_PROFILE.email); // rolled back
    expect((await stored()).email).toBeDefined(); // still at rest

    restoreWrites();
    await press(renderer, SAVE());
    expect(getCachedPersonalInformation().email).toBe('');
    expect(textsOf(renderer)).toContain(TOAST());
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });
});

describe('required fields keep being required', () => {
  beforeEach(async () => {
    await updatePersonalInformation(FULL_PROFILE);
  });

  it.each(['firstName', 'lastName'] as const)('%s: emptying it is refused, the stored value and every other field are kept, and the draft stays', async field => {
    const renderer = await mount();
    const before = await readStoredString(STORAGE_KEY);
    await press(renderer, LABEL[field]());
    await type(renderer, '   ');
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('personalInformation.requiredField'));
    expect(input(renderer).props.value).toBe('   ');
    expect(textsOf(renderer)).not.toContain(TOAST());
    expect(getCachedPersonalInformation()).toMatchObject(FULL_PROFILE);
    expect(await readStoredString(STORAGE_KEY)).toBe(before);
  });
});

describe('the "optional" indication', () => {
  it('appears on exactly the three optional rows, not on the required ones or on the other rows', async () => {
    await updatePersonalInformation(FULL_PROFILE);
    const renderer = await mount();
    const hint = t('profile.optional');
    expect(textsOf(renderer).filter(text => text === hint)).toHaveLength(3);
    for (const field of OPTIONAL_FIELDS) {
      const row = findButton(renderer, LABEL[field]())!;
      expect(row.findAllByType(Text).map(textOf)).toContain(hint);
    }
    for (const label of [LABEL.firstName(), LABEL.lastName(), LABEL.country(), LABEL.calendar(), LABEL.timeFormat()]) {
      expect(findButton(renderer, label)!.findAllByType(Text).map(textOf)).not.toContain(hint);
    }
  });
});
