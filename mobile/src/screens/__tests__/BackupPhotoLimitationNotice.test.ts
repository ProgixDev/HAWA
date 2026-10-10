import fs from 'fs';
import path from 'path';

import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import {es} from '../../i18n/locales/es';
import {it as itDictionary} from '../../i18n/locales/it';
import {tr} from '../../i18n/locales/tr';

// Private photo FILES are encrypted on disk but are not part of any backup (only their paths are). Every screen that
// offers or restores a backup must say so — not only the passphrase-protected one — in every supported language.

const read = (relative: string) => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

describe('the photo limitation is stated on every backup surface', () => {
  it.each([
    ['portable backup (create)', 'PortableBackupScreen.tsx'],
    ['local backup hub (save / restore / export)', 'BackupDataScreen.tsx'],
    ['local restore screen', 'BackupUtilityScreens.tsx'],
  ])('%s shows portableBackup.photosNote', (_name, file) => {
    expect(read(file)).toContain("t('portableBackup.photosNote')");
  });

  it('the note exists, is non-empty and is translated in en, fr, es, it and tr', () => {
    const notes = [en, fr, es, itDictionary, tr].map(dictionary => (dictionary as unknown as {portableBackup: {photosNote: string}}).portableBackup.photosNote);
    notes.forEach(note => expect(note.trim().length).toBeGreaterThan(10));
    expect(new Set(notes).size).toBe(5);
  });
});
