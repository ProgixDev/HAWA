import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Image, Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {DocumentDirectoryPath, mkdir, readFile, unlink, writeFile} from '@dr.pogodin/react-native-fs';

import JournalPrivatePhotosScreen from '../JournalPrivatePhotosScreen';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {isIntimacyUnlocked, lockIntimacy, unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {copyPrivatePhotoToAppStorage} from '../../../services/privatePhotoStorage';
import {clearAesKeyCache} from '../../../services/secureAesKeyStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// PHASE 3 — "Photos privées": access gate, picking, encrypted saving, display of stored (and unreadable) photos, replacing / removing, failures.
// Real dailyJournalStore, privatePhotoStorage and privatePhotoEncryption (real AES-GCM) over an in-memory fake of the file system; only the OS
// pickers and the file system are scripted.

const ROOT = `${DocumentDirectoryPath}/journal-private-photos`;
const MARKER = 'SECRET-PRIVATE-PHOTO-MARKER';
const photoBase64 = (): string => Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.from(MARKER), 1, 2, 3, 4, 5]).toString('base64');
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const todayKey = (): string => new Date().toLocaleDateString('en-CA');

const files = new Map<string, string>();
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const mockedRead = readFile as jest.Mock;
const mockedWrite = writeFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;

const flush = async () => {
  for (let index = 0; index < 16; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount() {
  const navigation = {replace: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <JournalPrivatePhotosScreen navigation={navigation as never} route={{key: 'k', name: 'PrivatePhotoEntry'} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').replace(/[\u{F0000}-\u{FFFFF}]/gu, '').trim());

const buttons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label);

async function tap(renderer: ReactTestRenderer.ReactTestRenderer, label: string, index = 0) {
  const target = buttons(renderer, label)[index];
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await flush();
}

const iconButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label)[0];

const count = (n: number) => i18n.t('journalPrivatePhotos.photoCount', {count: n, max: 5});

/** The picker's answer for one photo; the source file exists on the fake disk. */
const picked = (path = '/storage/emulated/0/DCIM/Camera/IMG_0042.jpg', type = 'image/jpeg') => {
  files.set(path, photoBase64());
  return {assets: [{uri: `file://${path}`, type, fileName: path.split('/').pop()}]};
};

/** A photo already stored by a previous session: encrypted file on disk + journal entry. */
async function seedStoredPhoto(id = 'photo-seed-1') {
  const source = `/tmp/seed-${id}.jpg`;
  files.set(source, photoBase64());
  const uri = await copyPrivatePhotoToAppStorage(`file://${source}`, todayKey(), id, 'image/jpeg');
  await saveJournalSection(todayKey(), 'privatePhotos', [{id, uri, addedAt: '2026-01-01T10:00:00.000Z'}]);
  return uri;
}

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await AsyncStorage.clear();
  files.clear();
  clearAesKeyCache();
  jest.clearAllMocks();
  // reset (not just clear): unused one-shot answers of a previous test must never leak into the next one
  (launchImageLibrary as jest.Mock).mockReset().mockResolvedValue({didCancel: true});
  (launchCamera as jest.Mock).mockReset().mockResolvedValue({didCancel: true});
  (mkdir as jest.Mock).mockResolvedValue(undefined);
  mockedRead.mockImplementation(async (path: string) => {
    const content = files.get(path);
    if (content === undefined) {throw new Error(`ENOENT: ${path}`);}
    return content;
  });
  mockedWrite.mockImplementation(async (path: string, content: string) => {
    files.set(path, content);
  });
  mockedUnlink.mockImplementation(async (path: string) => {
    if (!files.delete(path)) {throw new Error(`ENOENT: ${path}`);}
  });
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  unlockIntimacy();
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  lockIntimacy();
  jest.restoreAllMocks();
});

describe('access', () => {
  it('a locked session is sent to the private-section unlock and shows nothing', async () => {
    await seedStoredPhoto();
    mockedRead.mockClear(); // (seeding read the fake source file)
    lockIntimacy();
    const {renderer, navigation} = await mount();
    expect(navigation.replace).toHaveBeenCalledWith('PrivateIntimacyUnlock', {target: 'photos'});
    expect(renderer.root.findAllByType(Image).length).toBe(0);
    expect(textsOf(renderer)).not.toContain(count(1));
    expect(mockedRead).not.toHaveBeenCalled(); // no stored photo was even opened
  });

  it('"Masquer" locks the session at once and goes back to the unlock', async () => {
    const {renderer, navigation} = await mount();
    await act(async () => {
      iconButton(renderer, i18n.t('journalPrivatePhotos.hide')).props.onPress();
    });
    expect(isIntimacyUnlocked()).toBe(false);
    expect(navigation.replace).toHaveBeenCalledWith('PrivateIntimacyUnlock', {target: 'photos'});
  });
});

describe('empty day', () => {
  it('offers the gallery and the camera, with a zero count', async () => {
    const {renderer} = await mount();
    expect(textsOf(renderer)).toContain(count(0));
    expect(buttons(renderer, i18n.t('journalPrivatePhotos.gallery')).length).toBeGreaterThan(0);
    expect(buttons(renderer, i18n.t('journalPrivatePhotos.camera')).length).toBeGreaterThan(0);
  });

  it('a cancelled pick changes nothing and shows no error', async () => {
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    expect(textsOf(renderer)).toContain(count(0));
    expect(renderer.root.findAll(node => node.props.accessibilityRole === 'alert').length).toBe(0);
  });

  it.each([
    ['permission', 'journalPrivatePhotos.permissionDenied'],
    ['camera_unavailable', 'journalPrivatePhotos.cameraUnavailable'],
    ['others', 'journalPrivatePhotos.genericPickerError'],
  ])('a picker error "%s" is explained in plain words and adds nothing', async (errorCode, key) => {
    (launchCamera as jest.Mock).mockResolvedValue({errorCode});
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.camera'));
    expect(textsOf(renderer).some(text => text.includes(i18n.t(key)))).toBe(true);
    expect(textsOf(renderer)).toContain(count(0));
  });

  it('a picker that throws, or returns no file, shows the generic message', async () => {
    (launchImageLibrary as jest.Mock).mockRejectedValueOnce(new Error('no activity'));
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    expect(textsOf(renderer).some(text => text.includes(i18n.t('journalPrivatePhotos.genericPickerError')))).toBe(true);

    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({assets: [{}]});
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    expect(textsOf(renderer).some(text => text.includes(i18n.t('journalPrivatePhotos.genericPickerError')))).toBe(true);
    expect(textsOf(renderer)).toContain(count(0));
  });
});

describe('adding and saving', () => {
  it('a picked photo is only a draft: nothing is copied or written until Save', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(picked());
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    expect(textsOf(renderer)).toContain(count(1));
    expect(mockedWrite).not.toHaveBeenCalled();
    expect(await getJournalEntry(todayKey())).toBeFalsy();
  });

  it('Save encrypts the photo into the private folder and stores only that encrypted reference, never the gallery path', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(picked('/storage/emulated/0/DCIM/Camera/IMG_0042.jpg'));
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    await tap(renderer, i18n.t('common.save'));

    expect(mockedWrite).toHaveBeenCalledTimes(1);
    const writtenPath = mockedWrite.mock.calls[0][0] as string;
    expect(writtenPath.startsWith(`${ROOT}/${todayKey()}/`)).toBe(true);
    expect(writtenPath.endsWith('.jpg.awaenc')).toBe(true);
    expect(Buffer.from(files.get(writtenPath)!, 'base64').includes(Buffer.from(MARKER))).toBe(false);

    const entry = await getJournalEntry(todayKey());
    expect(entry?.privatePhotos).toHaveLength(1);
    expect(entry?.privatePhotos?.[0].uri).toBe(`file://${writtenPath}`);
    expect(JSON.stringify(entry)).not.toContain('IMG_0042');
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockedUnlink).not.toHaveBeenCalled(); // the gallery original is never touched
    expect(textsOf(renderer)).toContain(i18n.t('journalPrivatePhotos.savedTitle'));
  });

  it('after the confirmation toast the screen closes by itself', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(picked());
    const {renderer, navigation} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    await tap(renderer, i18n.t('common.save'));
    expect(navigation.goBack).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  }, 12000);

  it('a photo that cannot be copied is kept as a reference, the other one is saved encrypted, and the toast says so', async () => {
    (launchImageLibrary as jest.Mock)
      .mockResolvedValueOnce(picked('/storage/a/ok.jpg'))
      .mockResolvedValueOnce({assets: [{uri: 'file:///storage/b/gone.jpg', type: 'image/jpeg', fileName: 'gone.jpg'}]}); // not on the fake disk
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    await tap(renderer, i18n.t('journalPrivatePhotos.addAPhoto'));
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    expect(textsOf(renderer)).toContain(count(2));
    await tap(renderer, i18n.t('common.save'));

    const entry = await getJournalEntry(todayKey());
    expect(entry?.privatePhotos).toHaveLength(2);
    expect(entry?.privatePhotos?.filter(photo => photo.uri.endsWith('.awaenc'))).toHaveLength(1);
    expect(entry?.privatePhotos?.some(photo => photo.uri === 'file:///storage/b/gone.jpg')).toBe(true);
    expect(textsOf(renderer)).toContain(i18n.t('journalPrivatePhotos.savedWithCopyFailure'));
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('when the journal cannot be saved, an error is shown, nothing is claimed as saved, and the draft stays', async () => {
    const store = require('../../../state/dailyJournalStore') as typeof import('../../../state/dailyJournalStore');
    jest.spyOn(store, 'saveJournalSection').mockRejectedValueOnce(new Error('storage full'));
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(picked());
    const {renderer, navigation} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    await tap(renderer, i18n.t('common.save'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(i18n.t('journalPrivatePhotos.errorTitle'));
    expect(textsOf(renderer)).not.toContain(i18n.t('journalPrivatePhotos.savedTitle'));
    expect(textsOf(renderer)).toContain(count(1));
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(JSON.stringify(alertSpy.mock.calls)).not.toContain('storage full');
  });

  it('five photos is the limit: the add button disappears', async () => {
    const photos = Array.from({length: 5}, (_unused, index) => ({id: `p${index}`, uri: `file:///elsewhere/p${index}.jpg`, addedAt: '2026-01-01T10:00:00.000Z'}));
    await saveJournalSection(todayKey(), 'privatePhotos', photos);
    const {renderer} = await mount();
    expect(textsOf(renderer)).toContain(count(5));
    expect(buttons(renderer, i18n.t('journalPrivatePhotos.addAPhoto')).length).toBe(0);
  });
});

describe('stored photos', () => {
  it('an encrypted photo is decrypted in memory for display, and nothing is written to disk', async () => {
    await seedStoredPhoto();
    mockedWrite.mockClear();
    const {renderer} = await mount();
    const image = renderer.root.findAllByType(Image)[0];
    expect(image.props.source.uri).toBe(`data:image/jpeg;base64,${photoBase64()}`);
    expect(mockedWrite).not.toHaveBeenCalled();
    expect(textsOf(renderer)).toContain(count(1));
  });

  it('a corrupted file shows "Photo indisponible" instead of crashing or showing garbage', async () => {
    const uri = await seedStoredPhoto();
    const path = uri.slice('file://'.length);
    const payload = Buffer.from(files.get(path)!, 'base64');
    payload[40] ^= 0x01; // eslint-disable-line no-bitwise
    files.set(path, payload.toString('base64'));
    const {renderer} = await mount();
    expect(renderer.root.findAllByType(Image).length).toBe(0);
    expect(buttons(renderer, i18n.t('journalPrivatePhotos.photoUnavailable')).length).toBeGreaterThan(0);
    expect(JSON.stringify(renderer.toJSON())).not.toContain(MARKER);
  });

  it('a missing file is also shown as unavailable', async () => {
    const uri = await seedStoredPhoto();
    files.delete(uri.slice('file://'.length));
    const {renderer} = await mount();
    expect(buttons(renderer, i18n.t('journalPrivatePhotos.photoUnavailable')).length).toBeGreaterThan(0);
  });

  it('removing a stored photo and saving deletes its encrypted file only after the journal is saved, and the journal forgets it', async () => {
    const uri = await seedStoredPhoto();
    const path = uri.slice('file://'.length);
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.viewPhoto'));
    await tap(renderer, i18n.t('journalPrivatePhotos.delete'));
    expect(textsOf(renderer)).toContain(count(0));
    expect(files.has(path)).toBe(true); // still on disk: nothing is deleted before Save
    await tap(renderer, i18n.t('common.save'));
    expect(mockedUnlink).toHaveBeenCalledWith(path);
    expect(files.has(path)).toBe(false);
    expect((await getJournalEntry(todayKey()))?.privatePhotos).toBeUndefined();
  });

  it('removing without saving leaves both the file and the journal untouched', async () => {
    const uri = await seedStoredPhoto();
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.viewPhoto'));
    await tap(renderer, i18n.t('journalPrivatePhotos.delete'));
    expect(mockedUnlink).not.toHaveBeenCalled();
    expect(files.has(uri.slice('file://'.length))).toBe(true);
    expect((await getJournalEntry(todayKey()))?.privatePhotos).toHaveLength(1);
  });

  it('replacing a stored photo and saving writes a NEW encrypted file, then deletes the old one — never the gallery source', async () => {
    const oldUri = await seedStoredPhoto();
    const oldPath = oldUri.slice('file://'.length);
    const source = '/storage/emulated/0/DCIM/Camera/NEW.jpg';
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce(picked(source));
    const {renderer} = await mount();
    await tap(renderer, i18n.t('journalPrivatePhotos.viewPhoto'));
    await tap(renderer, i18n.t('journalPrivatePhotos.replace'));
    await tap(renderer, i18n.t('journalPrivatePhotos.gallery'));
    await tap(renderer, i18n.t('common.save'));

    const entry = await getJournalEntry(todayKey());
    const newPath = entry!.privatePhotos![0].uri.slice('file://'.length);
    expect(newPath).not.toBe(oldPath);
    expect(newPath.endsWith('.awaenc')).toBe(true);
    expect(files.has(newPath)).toBe(true);
    expect(files.has(oldPath)).toBe(false);
    expect(mockedUnlink).toHaveBeenCalledTimes(1);
    expect(mockedUnlink).toHaveBeenCalledWith(oldPath);
    expect(files.has(source)).toBe(true); // the gallery original is untouched
  });
});
