import {DocumentDirectoryPath, mkdir, readFile, unlink, writeFile} from '@dr.pogodin/react-native-fs';

import {
  copyPrivatePhotoToAppStorage,
  deletePrivatePhotoFile,
  isAppOwnedPrivatePhotoUri,
  isEncryptedPrivatePhotoUri,
  readPrivatePhotoAsDataUri,
} from '../privatePhotoStorage';
import {decryptPhotoBytes} from '../privatePhotoEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';

// PHASE 3 — durable, encrypted storage of the private photos (privatePhotoStorage.ts) on an in-memory fake of the file system:
// what is copied, where, in what form, what may be deleted, and what happens when a read or a write fails.

const ROOT = `${DocumentDirectoryPath}/journal-private-photos`;
const MARKER = 'SECRET-PRIVATE-PHOTO-MARKER';
const photoBase64 = (): string => Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.from(MARKER), 1, 2, 3, 4, 5]).toString('base64');

const files = new Map<string, string>();
const mockedRead = readFile as jest.Mock;
const mockedWrite = writeFile as jest.Mock;
const mockedMkdir = mkdir as jest.Mock;
const mockedUnlink = unlink as jest.Mock;

beforeEach(() => {
  files.clear();
  clearAesKeyCache();
  jest.clearAllMocks();
  mockedMkdir.mockResolvedValue(undefined);
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
});

const pick = (path = '/storage/emulated/0/DCIM/IMG_1.jpg'): string => {
  files.set(path, photoBase64());
  return `file://${path}`;
};

describe('ownership predicates', () => {
  it('only files inside the app-private photo folder are "ours"', () => {
    expect(isAppOwnedPrivatePhotoUri(`file://${ROOT}/2026-09-20/a.jpg.awaenc`)).toBe(true);
    expect(isAppOwnedPrivatePhotoUri('content://media/external/images/1')).toBe(false);
    expect(isAppOwnedPrivatePhotoUri('file:///storage/emulated/0/DCIM/IMG_1.jpg')).toBe(false);
    expect(isAppOwnedPrivatePhotoUri(`file://${DocumentDirectoryPath}/other-folder/a.jpg`)).toBe(false);
    expect(isAppOwnedPrivatePhotoUri(`${ROOT}/a.jpg`)).toBe(false); // no scheme: not the URI form this module hands out
  });

  it('only the .awaenc suffix marks an encrypted file; a legacy plaintext one is recognised as such', () => {
    expect(isEncryptedPrivatePhotoUri(`file://${ROOT}/d/a.jpg.awaenc`)).toBe(true);
    expect(isEncryptedPrivatePhotoUri(`file://${ROOT}/d/a.jpg`)).toBe(false);
    expect(isEncryptedPrivatePhotoUri(`file://${ROOT}/d/a.awaenc.jpg`)).toBe(false);
  });
});

describe('copying a picked photo into private storage', () => {
  it('writes ONE encrypted file in the app-private folder of that day, and returns its file:// URI', async () => {
    const source = pick();
    const uri = await copyPrivatePhotoToAppStorage(source, '2026-09-20', 'photo-1', 'image/jpeg');
    expect(mockedMkdir).toHaveBeenCalledWith(`${ROOT}/2026-09-20`);
    expect(uri.startsWith(`file://${ROOT}/2026-09-20/photo-1-`)).toBe(true);
    expect(uri.endsWith('.jpg.awaenc')).toBe(true);
    expect(isAppOwnedPrivatePhotoUri(uri)).toBe(true);
    expect(isEncryptedPrivatePhotoUri(uri)).toBe(true);
    expect(mockedWrite).toHaveBeenCalledTimes(1);
    expect(mockedWrite.mock.calls[0][0]).toBe(uri.slice('file://'.length));
    expect(mockedWrite.mock.calls[0][2]).toBe('base64');
  });

  it('what lands on disk is not the photo: no plaintext bytes, no marker', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    const stored = files.get(uri.slice('file://'.length))!;
    expect(stored).not.toBe(photoBase64());
    expect(Buffer.from(stored, 'base64').includes(Buffer.from(MARKER))).toBe(false);
    expect(Buffer.from(stored, 'base64')[0]).toBe(1); // encryption version
  });

  it('never alters or deletes the picker\'s source file', async () => {
    const source = pick();
    await copyPrivatePhotoToAppStorage(source, '2026-09-20', 'photo-1', 'image/jpeg');
    expect(files.get(source.slice('file://'.length))).toBe(photoBase64());
    expect(mockedUnlink).not.toHaveBeenCalled();
  });

  it('reads the source from its path, with or without the file:// scheme', async () => {
    const path = '/data/user/0/cache/rn_image_picker/x.png';
    files.set(path, photoBase64());
    await copyPrivatePhotoToAppStorage(path, '2026-09-20', 'a', 'image/png');
    await copyPrivatePhotoToAppStorage(`file://${path}`, '2026-09-20', 'b', 'image/png');
    expect(mockedRead.mock.calls.map(call => call[0])).toEqual([path, path]);
  });

  it.each([
    ['image/jpeg', undefined, 'jpg'],
    ['image/PNG', undefined, 'png'],
    ['image/heic', undefined, 'heic'],
    ['image/webp', undefined, 'webp'],
    [undefined, 'holiday.GIF', 'gif'],
    [undefined, undefined, 'jpg'],
    ['application/octet-stream', 'scan.tiff', 'tiff'],
  ])('mime %s / name %s keeps the extension %s in the file name', async (mime, name, ext) => {
    const uri = await copyPrivatePhotoToAppStorage(pick('/tmp/source-file'), '2026-09-20', 'p', mime, name);
    expect(uri.endsWith(`.${ext}.awaenc`)).toBe(true);
  });

  it('a replacement never reuses the path of the photo it replaces, even with the same id and extension', async () => {
    const first = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    const second = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    expect(second).not.toBe(first);
    expect(files.has(first.slice('file://'.length))).toBe(true); // the first file is untouched until the caller commits
  });

  it('a source that cannot be read fails cleanly: nothing is written', async () => {
    await expect(copyPrivatePhotoToAppStorage('file:///gone/IMG.jpg', '2026-09-20', 'photo-1', 'image/jpeg')).rejects.toThrow('ENOENT');
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('a write failure (disk full) rejects and leaves no file behind', async () => {
    const source = pick();
    mockedWrite.mockRejectedValueOnce(new Error('ENOSPC'));
    await expect(copyPrivatePhotoToAppStorage(source, '2026-09-20', 'photo-1', 'image/jpeg')).rejects.toThrow('ENOSPC');
    expect(Array.from(files.keys()).filter(path => path.startsWith(ROOT))).toEqual([]);
  });
});

describe('showing a stored photo', () => {
  it('decrypts in memory into a data: URI with the right mime type, and writes nothing to disk', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/png');
    mockedWrite.mockClear();
    const dataUri = await readPrivatePhotoAsDataUri(uri);
    expect(dataUri).toBe(`data:image/png;base64,${photoBase64()}`);
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('falls back to image/jpeg for an unknown extension', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick('/tmp/source-file'), '2026-09-20', 'photo-1', 'application/octet-stream', 'scan.xyz');
    expect((await readPrivatePhotoAsDataUri(uri)).startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('a corrupted file is refused with an error that carries neither the photo nor the stored text', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    const path = uri.slice('file://'.length);
    const payload = Buffer.from(files.get(path)!, 'base64');
    payload[40] ^= 0x01; // eslint-disable-line no-bitwise
    files.set(path, payload.toString('base64'));
    const error = await readPrivatePhotoAsDataUri(uri).then(
      () => null,
      (caught: Error) => caught,
    );
    expect(error).not.toBeNull();
    expect(`${error?.message} ${error?.stack}`).not.toContain(MARKER);
    expect(`${error?.message} ${error?.stack}`).not.toContain(files.get(path)!.slice(0, 40));
  });

  it('a missing file rejects (the screen then shows its "unavailable" state)', async () => {
    await expect(readPrivatePhotoAsDataUri(`file://${ROOT}/2026-09-20/nothing.jpg.awaenc`)).rejects.toThrow('ENOENT');
  });

  it('the decryption helper is what protects the bytes: the stored text alone is useless without the key', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    const stored = files.get(uri.slice('file://'.length))!;
    expect(stored).not.toContain(Buffer.from(MARKER).toString('base64').slice(0, 16));
    expect(await decryptPhotoBytes(stored)).toBe(photoBase64());
  });
});

describe('deleting', () => {
  it('removes a photo this app wrote', async () => {
    const uri = await copyPrivatePhotoToAppStorage(pick(), '2026-09-20', 'photo-1', 'image/jpeg');
    await deletePrivatePhotoFile(uri);
    expect(files.has(uri.slice('file://'.length))).toBe(false);
  });

  it.each([
    ['a gallery URI', 'content://media/external/images/media/7'],
    ['a file outside the private folder', 'file:///storage/emulated/0/DCIM/IMG_1.jpg'],
    ['another folder of the app', `file://${DocumentDirectoryPath}/other/IMG.jpg`],
    ['a path with no scheme', '/storage/emulated/0/DCIM/IMG_1.jpg'],
  ])('never touches %s', async (_label, uri) => {
    await deletePrivatePhotoFile(uri);
    expect(mockedUnlink).not.toHaveBeenCalled();
  });

  it('an already-missing file is not an error', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(deletePrivatePhotoFile(`file://${ROOT}/2026-09-20/already-gone.jpg.awaenc`)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
