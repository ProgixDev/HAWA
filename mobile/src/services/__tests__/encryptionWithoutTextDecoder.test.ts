import {decryptFieldValue, encryptFieldValue} from '../atRestFieldEncryption';
import {decryptNoteSection, encryptNoteSection} from '../privateNotesEncryption';
import {decryptIntimacySection, encryptIntimacySection} from '../privateJournalEncryption';

// Hermes (the release runtime) has no TextDecoder: every AES-GCM payload of the
// app must decrypt WITHOUT it (CONCEIVE-01). The same decoding sat in the three
// encryption modules, so all three are covered here with the global removed.
const realTextDecoder = globalThis.TextDecoder;

beforeAll(() => {
  delete (globalThis as {TextDecoder?: unknown}).TextDecoder;
});
afterAll(() => {
  (globalThis as {TextDecoder?: unknown}).TextDecoder = realTextDecoder;
});

const TEXT = 'Note : اليوم كنت متعبة 😊 fatiguée — é « » €';

describe('decryption never needs TextDecoder', () => {
  it('runtime check: TextDecoder is really absent, TextEncoder is not', () => {
    expect(typeof (globalThis as {TextDecoder?: unknown}).TextDecoder).toBe('undefined');
    expect(typeof TextEncoder).toBe('function');
  });

  it('atRestFieldEncryption (per-section notes, medical notes, reminders...)', async () => {
    const payload = await encryptFieldValue('com.hawa.test.field', TEXT);
    expect(await decryptFieldValue<string>('com.hawa.test.field', payload)).toBe(TEXT);
  });

  it('privateNotesEncryption ("Notes personnelles")', async () => {
    const payload = await encryptNoteSection({text: TEXT, updatedAt: '2026-09-25T10:00:00.000Z'});
    expect(await decryptNoteSection(payload)).toEqual({text: TEXT, updatedAt: '2026-09-25T10:00:00.000Z'});
  });

  it('privateJournalEncryption ("Vie intime" / "Rapports")', async () => {
    const payload = await encryptIntimacySection({answer: 'yes', note: TEXT});
    expect(await decryptIntimacySection(payload)).toEqual({answer: 'yes', note: TEXT});
  });
});
