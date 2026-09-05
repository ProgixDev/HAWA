import {randomBytes} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from '../secureAesKeyStore';
import {encryptNoteSection, withResolvedNoteForDisplay} from '../privateNotesEncryption';
import type {DailyJournalEntry} from '../../types/journal';

// secureAesKeyStore.ts reads/writes the OS Keychain via react-native-keychain,
// unavailable in Jest — mocked with a fixed real AES-256 key so the actual
// @noble/ciphers encrypt/decrypt round-trip (pure JS) still runs for real,
// exactly like the app does, only the Keychain-backed key retrieval itself
// is faked.
jest.mock('../secureAesKeyStore', () => ({getOrCreateAesKey: jest.fn()}));

const mockGetOrCreateAesKey = getOrCreateAesKey as jest.Mock;

beforeEach(() => {
  mockGetOrCreateAesKey.mockResolvedValue(randomBytes(32));
});

describe('withResolvedNoteForDisplay — Cycle Dashboard "Suivi du jour" completion', () => {
  it('resolves to a truthy, content-free marker when a real encrypted note exists — never the decrypted text', async () => {
    const payload = await encryptNoteSection({text: 'PRIVATE NOTE TEST 123', updatedAt: '2026-08-24T10:00:00.000Z'});
    const entry: DailyJournalEntry = {id: '1', date: '2026-08-24', encryptedNote: payload};

    const resolved = await withResolvedNoteForDisplay(entry);

    expect(resolved?.note).toBeDefined();
    expect(resolved?.note?.text).toBe('');
    expect(JSON.stringify(resolved)).not.toContain('PRIVATE NOTE TEST 123');
  });

  it('resolves to undefined when no note was ever saved for the day', async () => {
    const entry: DailyJournalEntry = {id: '1', date: '2026-08-24'};
    const resolved = await withResolvedNoteForDisplay(entry);
    expect(resolved?.note).toBeUndefined();
  });

  it('resolves to undefined (not a crash, not garbage) when the encrypted payload is corrupted', async () => {
    const entry: DailyJournalEntry = {
      id: '1',
      date: '2026-08-24',
      encryptedNote: {version: 1, iv: 'not-valid-hex-zz', ciphertext: 'also-not-valid'},
    };
    const resolved = await withResolvedNoteForDisplay(entry);
    expect(resolved?.note).toBeUndefined();
  });

  it('returns undefined for an undefined entry, never throws', async () => {
    await expect(withResolvedNoteForDisplay(undefined)).resolves.toBeUndefined();
  });
});
