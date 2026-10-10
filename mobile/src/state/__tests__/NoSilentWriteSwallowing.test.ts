import fs from 'fs';
import path from 'path';

// GUARD for the write-failure contract (services/saveFailure.ts): the stores that keep sensitive data (every store
// that reads and writes through secureAsyncStorage) must not swallow a failed or refused write again.
//
// This is deliberately a small, text-level check — it only looks for the exact shapes the audit removed:
//   - a persist/setItem/removeItem call whose rejection is discarded (`.catch(() => {})`, `() => undefined`, `() => null`)
//   - the old "Never throw out of a save action" comment that documented the swallowing
//   - an empty `catch {}` right around a setItem
// Deliberate, documented exceptions use markSaveFailureHandled (a derived migration write that is retried by the next
// load) and are therefore not matched.

const STATE_DIR = path.join(__dirname, '..');

const sensitiveStoreFiles = (): string[] =>
  fs
    .readdirSync(STATE_DIR)
    .filter(name => name.endsWith('.ts'))
    .map(name => path.join(STATE_DIR, name))
    .filter(file => /from '\.\.\/services\/secureAsyncStorage'/.test(fs.readFileSync(file, 'utf8')));

const SWALLOWED_WRITE =
  /(persist\w*\(\)|\.(?:setItem|removeItem)\([^;]*?\))\s*\.catch\(\s*\(\)\s*=>\s*(?:\{\s*\}|undefined|null)\s*\)/;
const OLD_SWALLOW_COMMENT = /never throw out of a save action/i;
const EMPTY_CATCH_AROUND_SET_ITEM =
  /try\s*\{[^{}]*\.setItem\([^{}]*\}\s*catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*\n\s*)*\}/;

describe('sensitive stores never swallow a failed or refused write', () => {
  const files = sensitiveStoreFiles();

  it('finds the stores to audit (guard against the scan silently matching nothing)', () => {
    const names = files.map(file => path.basename(file));
    expect(names.length).toBeGreaterThanOrEqual(25);
    expect(names).toEqual(
      expect.arrayContaining([
        'dailyJournalStore.ts',
        'onboardingPreferences.ts',
        'postpartumJournalStore.ts',
        'miscarriageJournalStore.ts',
        'contraceptionJournalStore.ts',
        'menopauseJournalStore.ts',
        'generalHealthStore.ts',
        'personalInformationStore.ts',
        'qadaaLedgerStore.ts',
      ]),
    );
  });

  it.each(files.map(file => [path.basename(file), file]))('%s', (_name, file) => {
    const source = fs.readFileSync(file as string, 'utf8');
    expect(source).not.toMatch(SWALLOWED_WRITE);
    expect(source).not.toMatch(OLD_SWALLOW_COMMENT);
    expect(source).not.toMatch(EMPTY_CATCH_AROUND_SET_ITEM);
  });

  it('the guard itself matches the shapes it is meant to catch', () => {
    expect('persist().catch(() => {});').toMatch(SWALLOWED_WRITE);
    expect('AsyncStorage.setItem(KEY, JSON.stringify(x)).catch(() => undefined)').toMatch(SWALLOWED_WRITE);
    expect('// Never throw out of a save action — in-memory state is unaffected.').toMatch(OLD_SWALLOW_COMMENT);
    expect('try { await AsyncStorage.setItem(k, v); } catch {\n // ignore\n }').toMatch(EMPTY_CATCH_AROUND_SET_ITEM);
    expect('persistCycle().catch(markSaveFailureHandled);').not.toMatch(SWALLOWED_WRITE);
  });
});
