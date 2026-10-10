# Running the test suite with structured-data encryption ON

Under Jest, structured-data encryption (`src/services/secureAsyncStorage.ts`) is **off by default**
(`jest.setup.js` sets `globalThis.__AWA_STRUCTURED_ENCRYPTION_DEFAULT__ = false` unless the environment variable
`AWA_STRUCTURED_ENCRYPTION=1` is present). The encrypted path is exercised by its own suites, but the store/screen suites
normally run on plaintext. To prove they also behave when every eligible record is an AES-256-GCM envelope:

```
npm run test:encrypted                       # whole suite, encryption forced ON (about 20+ minutes with --runInBand)
npm run test:encrypted -- src/state          # any jest arguments are passed through
```

`npm run test:encrypted` runs `scripts/test-encrypted.js`, a cross-platform wrapper that sets
`AWA_STRUCTURED_ENCRYPTION=1` and calls Jest. PowerShell equivalent without the script:
`$env:AWA_STRUCTURED_ENCRYPTION='1'; npx jest --runInBand`.

Every fix below keeps the suite green in the **default** mode too (`npm test`).

## Writing a test that is valid in both modes

1. **Never read the mocked AsyncStorage raw to inspect what a store persisted.** Under encryption the value is an
   envelope (`{"awa_enc":2,...}`), so `JSON.parse(await AsyncStorage.getItem(KEY))` is no longer the store's JSON.
   Use `readStoredString(key)` / `readStoredJson(key)` from `src/testUtils/structuredStorage.ts`: they read through the
   production path (`secureAsyncStorage`) and return the stored JSON text in both modes. Field-level ciphertext inside
   it (notes etc.) is untouched, so "the note is encrypted at rest" assertions keep their meaning.
   Seeding legacy plaintext with `AsyncStorage.setItem(KEY, plainJson)` is still valid: the production read path
   accepts legacy plaintext and migrates it.
2. **A snapshot taken by the backup service holds the stored strings as stored** (envelopes under encryption). To
   inspect the field-level ciphertext inside, decrypt with `decryptStructured(key, value)` (see
   `backupVersusMedicalExport.test.ts`). The local backup slot is itself encrypted: read it back with
   `getBackupSnapshot()`, not `JSON.parse(rawSlot)`.
3. **Persistence and hydration take several async steps.** A setter such as `setCyclePreferences()` persists
   fire-and-forget; after `setActiveProfileId()` a store is *neutral* until its read lands. Wait for the real
   operation (`await hydrateCyclePreferences()`, or a `readStoredString(key)` which queues behind in-flight writes of
   that record) rather than assuming a fixed number of microtasks.
4. **Reads and removals of one encrypted record are serialized per key** (`withKeyLock`). A test that holds a read
   open and then `await`s a deletion of the same record must start the deletion, release the read, then await the
   deletion. Reads that are issued only after a previous one finishes need a release loop, not a single release pass.

## Classification of the suites that failed under `AWA_STRUCTURED_ENCRYPTION=1`

First encrypted run: 341 suites, 39 failed (119 tests). Classes:

* **A** obsolete raw-storage assertion: the test read the mocked AsyncStorage raw and expected plaintext JSON.
* **B** mock / timing limitation: the test (or the jest storage mock) assumes storage resolves within a fixed number of
  ticks, or that a held read does not block a removal of the same key. Production behaviour is correct.
* **C** actual production incompatibility: none found (see "Production observations").
* **T** transient: not an encryption problem; passed on re-run (working tree was being edited during the first run).

| Class | Suites | Status |
| --- | --- | --- |
| A | 30 | fixed (assertion intent unchanged) |
| B | 6 | fixed (test synchronisation only) |
| C | 0 | none |
| T | 3 | pass on re-run, no change |

### A — obsolete raw-storage assertion (30)

Root cause for all: `JSON.parse(await AsyncStorage.getItem(KEY))` / `.toBe('cycle')` / `.toContain('ciphertext')` against
an envelope. Fix: read through `readStoredString` (or decrypt with `decryptStructured` for the backup snapshot).

| Suite | Failing assertion under encryption |
| --- | --- |
| state/dailyJournalStore | `JSON.parse(raw).find is not a function` |
| state/pregnancyCustomRemindersStore | `JSON.parse(raw).find is not a function` |
| state/pregnancyHealthRemindersStore | `JSON.parse(raw).find is not a function` |
| state/pregnancyMedicalEventsStore | `.find` / `persisted.notes` undefined |
| state/contraceptionJournalStore | `persisted.notes` undefined (envelope keys) |
| state/menopauseJournalStore | `persisted.notes` undefined |
| state/miscarriageJournalStore | `persisted.personalNotes` undefined |
| state/irregularJournalStore | `persisted.details` undefined |
| state/irregularFatigueSymptomsShape | `persisted.symptoms` undefined |
| state/postpartumJournalStore | `persisted.moodNote` undefined |
| state/postpartumLochiaStore | `persisted['2026-09-01']` undefined |
| state/pregnancyJournalStore | `persisted[0]` undefined |
| state/generalHealthStore | `typeof persisted.medicalNotes` is `undefined`, expected `object` |
| state/personalInformationStore | same, `typeof` of nested field |
| state/postpartumNifasAcknowledgement | stored acknowledgement keys read as `undefined` |
| state/postpartumJourneyPreservation | earlier answers read as `undefined` |
| state/cyclePeriodHistory | `persisted.map` of an envelope (undefined) |
| state/activeProfileDataIsolation | `toBeTruthy()` on the parsed record failed after the restart-shaped sequence |
| state/qadaaLedgerStore | `(await stored()).manualEntries` undefined |
| components/pregnancy/PregnancyTransitionAndLabels | earlier answers read as `undefined` |
| screens/PostpartumDeliveryDateJourneyValidation | earlier values read `undefined` from envelope |
| screens/conceive/Conceive01RapportsDeviceRuntime | `Object.keys(undefined)` on raw record |
| screens/conceive/ConceiveStatisticsCycleAndTemperature | raw string lacks `"value":36.5` (envelope) |
| screens/contraception/ContraceptionJournalEntryScreen | `persisted.notes` undefined |
| services/objectiveSwitch | `getItem('@hawa/active-objective')` is an envelope, expected `'cycle'` |
| services/objectiveSetupPersistence | same (active/pending objective keys) |
| services/medicalExportAuthorization | raw string lacks `ciphertext` (whole record is an envelope) |
| services/medicalExportSensitiveClassification | raw string lacks `ciphertext` |
| services/medicalExportEnumLabels | `persisted.mood` undefined |
| services/backupVersusMedicalExport | snapshot/portable JSON lack `ciphertext` / `"severity":"moderate"` (entries are envelopes; the local slot is encrypted) |

### B — mock / timing limitation (6)

| Suite | Failing assertion | Root cause | Fix |
| --- | --- | --- | --- |
| screens/ProfileScreen | `cycleDuration` expected 30, got 28 (neutral default) | after `setActiveProfileId()` the cycle store is neutral until its read lands; the test read it after a fixed tick budget | `await hydrateCyclePreferences()` before reading |
| screens/ManagedDaughterPreFirstPeriod | mother's `lastPeriodStart` got the daughter's value / default | same | same |
| state/profileScopedNotificationsAndBackup | reminder time `null`, cycle 28 vs 30; backup snapshot lacked the setter's value | same, plus `backupNow()` right after an un-awaited setter reads raw before the write landed | hydrate after switch; `settleCyclePersistence()` before backup |
| utils/cycleReminderConcurrency | test and following hooks time out | the second held read of an encrypted record is issued only after the first is released (per-key queue); test released once | release loop until the sync settles |
| services/managedProfileDeletion | timeout | deletion queues behind a deliberately held read of the same key and was awaited before the release | start deletion, release read, then await |
| state/cycleProfileSwitchHydration | timeout | same | same |

### T — transient (3)

`components/conceive/ConceiveNoCycleConfiguration`, `utils/conceptionReminderScheduling`,
`utils/notificationLanguageSwitch` failed once with `ReferenceError: areReminderSourcesUnavailable is not defined`
while the reminder-scheduler sources were being edited; they pass under encryption and in default mode on re-run.

## Production observations (no defect requiring a change)

* `backupService.readKeys` (`src/services/backupService.ts:102-106`) reads raw values without queuing behind in-flight
  structured writes of the same key. A snapshot taken in the few milliseconds after a save may miss that save.
  Severity: low (the user action is a deliberate tap, seconds after the save). Not changed.
* The in-memory stores are intentionally neutral between a profile switch and the end of the read (see the comment in
  `onboardingPreferences.ts`); UI listeners are notified when the read lands. Tests must await hydration (rule 3).
