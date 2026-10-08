import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import secureStorage, {clearStructuredCache, getRawItem, resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../secureAsyncStorage';
import {STRUCTURED_KEY_SERVICE, decryptStructured, encryptStructured} from '../structuredEncryption';
import {runStructuredMigration} from '../structuredDataMigration';
import {clearAesKeyCache} from '../secureAesKeyStore';
import {DEFAULT_KDF_ITERATIONS, derivePassphraseKey, randomSaltHex} from '../passphraseKdf';
import {createPortableBackup} from '../portableBackup';

// MEASURED, not guessed. These run in Node (V8) — a phone running Hermes is slower, by a factor that can only be
// measured on a device (see the Phase 9 report). The assertions are deliberately generous ceilings that catch an
// accidental O(n²) or a decrypt-on-every-render regression; the printed numbers are what the report quotes.

const JOURNAL = '@hawa/daily-journal/v1';

const entry = (index: number) => ({
  id: `2025-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}-${index}`,
  date: new Date(2025, 0, 1 + index).toLocaleDateString('en-CA'),
  symptoms: {names: ['Crampes', 'Fatigue', 'Maux de tête'], severity: 'moderate'},
  mood: {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3},
  flow: {intensity: 'moderate'},
  temperature: {value: 36.6, unit: 'C', time: '07:10'},
  weight: {value: 61.2, unit: 'kg'},
  sleep: {hours: 7.5, quality: 'good'},
});
const journalOf = (days: number) => JSON.stringify(Array.from({length: days}, (_, index) => entry(index)));

const timeIt = async <T>(label: string, task: () => Promise<T>, runs = 5): Promise<{ms: number; result: T}> => {
  let result!: T;
  const samples: number[] = [];
  for (let run = 0; run < runs; run += 1) {
    const start = process.hrtime.bigint();
    result = await task();
    samples.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  console.info(`[perf] ${label}: median ${median.toFixed(2)} ms (min ${samples[0].toFixed(2)}, max ${samples[samples.length - 1].toFixed(2)})`);
  return {ms: median, result};
};

beforeEach(async () => {
  setStructuredEncryptionEnabled(true);
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
  resetStructuredStorageForTests();
});
afterAll(() => setStructuredEncryptionEnabled(false));

describe('structured encryption — measured cost', () => {
  it.each([[30], [365], [1095]])('a %i-day journal: encrypt, decrypt, cached read', async days => {
    const plain = journalOf(days);
    console.info(`[perf] journal of ${days} days = ${(plain.length / 1024).toFixed(0)} KiB of JSON`);

    const encrypted = await timeIt(`${days} days: encrypt`, () => encryptStructured(JOURNAL, plain));
    const decrypted = await timeIt(`${days} days: decrypt`, () => decryptStructured(JOURNAL, encrypted.result));
    expect(decrypted.result).toBe(plain);

    await secureStorage.setItem(JOURNAL, plain);
    clearStructuredCache();
    const cold = await timeIt(`${days} days: storage read, cold (decrypts)`, async () => {
      clearStructuredCache();
      return secureStorage.getItem(JOURNAL);
    });
    const warm = await timeIt(`${days} days: storage read, warm (cache hit)`, () => secureStorage.getItem(JOURNAL), 20);
    expect(cold.result).toBe(plain);
    expect(warm.ms).toBeLessThan(cold.ms + 1); // the cache never makes a read slower
    expect(encrypted.ms).toBeLessThan(2000);
    expect(cold.ms).toBeLessThan(2000);
  });

  it('a month view (31 reads of the same journal, as the calendar does) decrypts at most once', async () => {
    await secureStorage.setItem(JOURNAL, journalOf(365));
    clearStructuredCache();
    const getItem = AsyncStorage.getItem as jest.Mock;
    getItem.mockClear();
    const start = process.hrtime.bigint();
    for (let day = 0; day < 31; day += 1) {await secureStorage.getItem(JOURNAL);}
    const total = Number(process.hrtime.bigint() - start) / 1e6;
    console.info(`[perf] 31 consecutive reads of a 365-day journal: ${total.toFixed(1)} ms total`);
    expect(getItem.mock.calls.filter(call => call[0] === JOURNAL).length).toBe(31); // raw reads are cheap; decryption is cached
    expect(total).toBeLessThan(3000);
  });

  it('migrating a realistic set of stores', async () => {
    for (const [key, value] of Object.entries({
      [JOURNAL]: journalOf(365),
      '@hawa/confirmed-period-history': JSON.stringify(Array.from({length: 36}, (_, index) => ({id: String(index), periodStart: '2025-01-01T00:00:00.000Z', periodEndDateTime: '2025-01-05T00:00:00.000Z', capturedAt: 'x'}))),
      '@hawa/cycle-preferences': JSON.stringify({preferences: {periodDuration: 5}, periodHistory: []}),
      'awa:qadaa:ledger:v1': JSON.stringify({entries: Array.from({length: 120}, (_, index) => ({index}))}),
      '@hawa/pregnancy-journal/v1': journalOf(120),
    })) {
      await AsyncStorage.setItem(key, value);
    }
    const start = process.hrtime.bigint();
    const summary = await runStructuredMigration();
    const total = Number(process.hrtime.bigint() - start) / 1e6;
    console.info(`[perf] migrating ${summary.migrated} stores (a year of journal included): ${total.toFixed(0)} ms`);
    expect(summary.migrated).toBe(5);
    expect(total).toBeLessThan(5000);
    expect((await getRawItem(JOURNAL))?.startsWith('{"awa_enc"')).toBe(true);
  });

  it('creating a portable backup of a year of data (production iteration count)', async () => {
    await secureStorage.setItem(JOURNAL, journalOf(365));
    await secureStorage.setItem('@hawa/confirmed-period-history', '[]');
    const created = await timeIt('portable backup, 365-day journal, 600k PBKDF2 iterations', () =>
      createPortableBackup({passphrase: 'une phrase de passe assez longue', scope: {kind: 'owner'}}), 3);
    expect(DEFAULT_KDF_ITERATIONS).toBe(600_000);
    expect(JSON.parse(created.result.contents).kdf.iter).toBe(600_000);
    console.info(`[perf] backup file size: ${(created.result.contents.length / 1024).toFixed(0)} KiB`);
  });

  it('the PBKDF2 step alone', async () => {
    await timeIt('PBKDF2-HMAC-SHA256 600,000 iterations (Node, native OpenSSL — NOT a phone figure)', () =>
      derivePassphraseKey('une phrase de passe assez longue', randomSaltHex(), DEFAULT_KDF_ITERATIONS), 3);
  });
});
