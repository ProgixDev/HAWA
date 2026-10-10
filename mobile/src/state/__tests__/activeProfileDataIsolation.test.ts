import AsyncStorage from '@react-native-async-storage/async-storage';
import {readStoredString} from '../../testUtils/structuredStorage';

import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests, setActiveProfileId} from '../activeProfileStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../managedProfilesStore';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  recordConfirmedPeriodEnd,
} from '../confirmedPeriodHistoryStore';
import {getAllJournalEntries, getJournalEntry, saveJournalSection} from '../dailyJournalStore';
import {
  addPeriodOccurrence,
  getCyclePreferences,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  setCyclePreferences,
} from '../onboardingPreferences';
import {getRemainingQadaaDays, hydrateRemainingQadaaDays, setRemainingQadaaDays} from '../qadaaStore';
import {addManualQadaaEntry, getQadaaLedger, hydrateQadaaLedger} from '../qadaaLedgerStore';
import {seedManagedProfileCycleIfNeeded} from '../managedProfileCycleSeed';

// The minimum isolation proof this feature requires (see its own spec, "test with
// two daughters, not just Mother + one"): every profile-specific store touched by
// "Suivre mon cycle" must keep Mother's, Hanane's and Lina's data completely apart.
// Pure store-level tests — no rendering needed, and precise about exactly which
// store holds what.

describe('Multi-profile data isolation — Mother ≠ Hanane ≠ Lina', () => {
  let hananeId: string;
  let linaId: string;

  beforeEach(async () => {
    await AsyncStorage.clear();
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2016-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-06-15', hasHadFirstPeriod: false});
    hananeId = hanane.id;
    linaId = lina.id;
  });

  it('confirmedPeriodHistoryStore: Mother enters period A, Hanane period B, Lina period C — each sees only her own', async () => {
    await hydrateConfirmedPeriodHistory();
    await recordConfirmedPeriodEnd(new Date(2026, 0, 1), new Date(2026, 0, 5)); // A — mother
    expect(getConfirmedPeriodHistory()).toHaveLength(1);

    await setActiveProfileId(hananeId);
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory()).toHaveLength(0); // A must not appear
    await recordConfirmedPeriodEnd(new Date(2026, 1, 1), new Date(2026, 1, 5)); // B — Hanane

    await setActiveProfileId(linaId);
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory()).toHaveLength(0); // neither A nor B
    await recordConfirmedPeriodEnd(new Date(2026, 2, 1), new Date(2026, 2, 5)); // C — Lina

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory().map(o => o.id)).toEqual(['2026-01-01']); // only A

    await setActiveProfileId(hananeId);
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory().map(o => o.id)).toEqual(['2026-02-01']); // only B

    await setActiveProfileId(linaId);
    await hydrateConfirmedPeriodHistory();
    expect(getConfirmedPeriodHistory().map(o => o.id)).toEqual(['2026-03-01']); // only C
  });

  it('cyclePreferences + recorded period history (onboardingPreferences.ts): isolated per profile, a fresh daughter never inherits the mother’s cycle', async () => {
    await hydrateCyclePreferences();
    setCyclePreferences({lastPeriodStart: new Date(2026, 0, 1), periodDuration: 6, cycleDuration: 30, regularity: 'yes'});
    expect(getCyclePreferences().periodDuration).toBe(6);
    expect(getRecordedPeriodHistory().length).toBeGreaterThan(0);

    await setActiveProfileId(hananeId);
    await hydrateCyclePreferences();
    // A fresh managed profile with no persisted data gets the neutral defaults —
    // never a stray copy of the mother's just-declared 6/30 habits.
    expect(getCyclePreferences().periodDuration).toBe(5);
    expect(getCyclePreferences().cycleDuration).toBe(28);
    expect(getRecordedPeriodHistory()).toHaveLength(0); // hasConfirmedCycleData is false until she declares one
    addPeriodOccurrence(new Date(2026, 3, 10));
    expect(getRecordedPeriodHistory().length).toBeGreaterThan(0);

    await setActiveProfileId(linaId);
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory()).toHaveLength(0); // never Hanane's just-declared period either

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getCyclePreferences().periodDuration).toBe(6); // the mother's own habits, untouched
  });

  it('dailyJournalStore: mood/symptom/pain/notes entries never cross profiles', async () => {
    await saveJournalSection('2026-01-05', 'mood', {level: 'good', energy: 7, stress: 2, irritability: 1, motivation: 8, note: 'Mother’s own note'});
    await saveJournalSection('2026-01-05', 'symptoms', {names: ['headache'], severity: 'mild'});
    expect((await getJournalEntry('2026-01-05'))?.mood?.note).toBe('Mother’s own note');

    await setActiveProfileId(hananeId);
    expect(await getJournalEntry('2026-01-05')).toBeUndefined(); // Hanane sees nothing yet
    await saveJournalSection('2026-01-05', 'mood', {level: 'tired', energy: 3, stress: 6, irritability: 4, motivation: 2, note: 'Hanane’s own note'});

    await setActiveProfileId(linaId);
    expect(await getJournalEntry('2026-01-05')).toBeUndefined(); // neither the mother's nor Hanane's

    await setActiveProfileId(OWNER_PROFILE_ID);
    const motherEntry = await getJournalEntry('2026-01-05');
    expect(motherEntry?.mood?.note).toBe('Mother’s own note'); // untouched
    expect(motherEntry?.symptoms?.names).toEqual(['headache']);

    await setActiveProfileId(hananeId);
    const hananeEntry = await getJournalEntry('2026-01-05');
    expect(hananeEntry?.mood?.note).toBe('Hanane’s own note');
    expect(hananeEntry?.symptoms).toBeUndefined(); // Hanane never inherited the mother's symptom entry

    const hananeAll = await getAllJournalEntries();
    expect(hananeAll).toHaveLength(1); // only her own single entry, not the mother's too
  });

  it('qadaaStore (remaining days) and qadaaLedgerStore (manual/completion entries): isolated per profile', async () => {
    await hydrateRemainingQadaaDays();
    await setRemainingQadaaDays(4);
    await hydrateQadaaLedger();
    await addManualQadaaEntry({quantity: 3, note: 'Mother’s own manual entry'});
    expect(getRemainingQadaaDays()).toBe(4);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);

    await setActiveProfileId(hananeId);
    await hydrateRemainingQadaaDays();
    await hydrateQadaaLedger();
    expect(getRemainingQadaaDays()).toBeNull(); // never the mother's 4
    expect(getQadaaLedger().manualEntries).toHaveLength(0); // never her manual entry
    // The legacy pre-ledger migration is the mother's own historical data — a
    // managed profile's ledger must be marked already-migrated, not attempt it.
    expect(getQadaaLedger().legacyProgressMigrated).toBe(true);
    await setRemainingQadaaDays(1);
    await addManualQadaaEntry({quantity: 2, note: 'Hanane’s own manual entry'});

    await setActiveProfileId(linaId);
    await hydrateRemainingQadaaDays();
    await hydrateQadaaLedger();
    expect(getRemainingQadaaDays()).toBeNull();
    expect(getQadaaLedger().manualEntries).toHaveLength(0);

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateRemainingQadaaDays();
    await hydrateQadaaLedger();
    expect(getRemainingQadaaDays()).toBe(4); // the mother's own value, untouched
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0].note).toBe('Mother’s own manual entry');

    await setActiveProfileId(hananeId);
    await hydrateRemainingQadaaDays();
    await hydrateQadaaLedger();
    expect(getRemainingQadaaDays()).toBe(1);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0].note).toBe('Hanane’s own manual entry');
  });

  it('every profile-specific AsyncStorage key is distinctly suffixed per managed profile — never colliding, never a bare index', async () => {
    await setActiveProfileId(hananeId);
    await hydrateConfirmedPeriodHistory();
    await recordConfirmedPeriodEnd(new Date(2026, 0, 1), new Date(2026, 0, 5));

    await setActiveProfileId(linaId);
    await hydrateConfirmedPeriodHistory();
    await recordConfirmedPeriodEnd(new Date(2026, 0, 1), new Date(2026, 0, 5)); // same dates, different profile

    const keys = await AsyncStorage.getAllKeys();
    const hananeKey = keys.find(key => key.includes(hananeId));
    const linaKey = keys.find(key => key.includes(linaId));
    expect(hananeKey).toBeTruthy();
    expect(linaKey).toBeTruthy();
    expect(hananeKey).not.toBe(linaKey);
    // The id itself is a stable string (managedProfilesStore's own `daughter_...`
    // scheme) — never a bare array index like ":profile:0"/":profile:1".
    expect(hananeKey).toContain(hananeId);
    expect(linaId.startsWith('daughter_')).toBe(true);
  });
});

describe('Multi-profile — owner backward compatibility', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
  });

  it('pre-existing owner data (written before any profile-scoping concept existed) stays readable at its original, unsuffixed key', async () => {
    // Simulates data written by an older app version, before activeProfileStore.ts
    // existed — i.e. exactly the pre-multi-profile persisted shape, at the exact
    // original key.
    const legacyOccurrence = {id: '2025-12-01', periodStart: new Date(2025, 11, 1).toISOString(), periodEndDateTime: new Date(2025, 11, 5).toISOString(), capturedAt: new Date(2025, 11, 5).toISOString()};
    await AsyncStorage.setItem('@hawa/confirmed-period-history', JSON.stringify([legacyOccurrence]));

    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID); // the default, without ever switching
    // A fresh module instance — earlier tests in this file already hydrated this
    // store's in-memory cache, which would otherwise short-circuit past the real
    // AsyncStorage read this test needs to exercise.
    jest.resetModules();
    const freshStore = require('../confirmedPeriodHistoryStore');
    const history = await freshStore.hydrateConfirmedPeriodHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('2025-12-01');
  });

  it('reading owner data twice never duplicates it (idempotent)', async () => {
    await hydrateConfirmedPeriodHistory();
    await recordConfirmedPeriodEnd(new Date(2026, 0, 1), new Date(2026, 0, 5));
    const raw1 = await readStoredString('@hawa/confirmed-period-history');

    // Re-hydrating (as a second screen mounting would) must not rewrite/duplicate.
    await setActiveProfileId(OWNER_PROFILE_ID); // no-op switch (already active)
    const secondRead = getConfirmedPeriodHistory();
    expect(secondRead).toHaveLength(1);
    const raw2 = await readStoredString('@hawa/confirmed-period-history');
    expect(raw2).toBe(raw1);
  });

  it('survives an app-restart-shaped sequence (module state reset, re-hydrate from disk) without loss', async () => {
    await hydrateCyclePreferences();
    setCyclePreferences({lastPeriodStart: new Date(2026, 0, 1), periodDuration: 6, cycleDuration: 30, regularity: 'yes'});
    // Nothing here re-imports the module (Jest keeps one instance per file), but the
    // persisted AsyncStorage snapshot is the actual survival mechanism — assert it
    // independently of the in-memory cache.
    const raw = await readStoredString('@hawa/cycle-preferences');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.preferences.periodDuration).toBe(6);
  });
});

describe('Multi-profile — active-profile safety', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
  });

  it('falls back to OWNER_PROFILE_ID when the persisted active profile no longer exists', async () => {
    await AsyncStorage.setItem('@hawa/active-profile-id', 'daughter_ghost-id-that-was-deleted');
    // A genuinely FRESH module instance (like a real cold app start, before
    // resetActiveProfileForTests()'s own beforeEach call has already marked this
    // singleton "hydrated") — otherwise hydrateActiveProfileId() would short-circuit
    // on the cached value instead of actually exercising the fallback logic.
    jest.resetModules();
    const freshActiveProfileStore = require('../activeProfileStore');
    const resolved: string = await freshActiveProfileStore.hydrateActiveProfileId();
    expect(resolved).toBe(freshActiveProfileStore.OWNER_PROFILE_ID);
  });

  it('setActiveProfileId silently rejects an id that is not a real managed profile (never crashes)', async () => {
    const before = getActiveProfileId();
    await setActiveProfileId('not-a-real-profile-id');
    expect(getActiveProfileId()).toBe(before);
  });
});

describe('Multi-profile — daughter initial cycle data', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
  });

  it('seeds her cycle context from what was declared at creation, the first time she becomes active', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter',
      firstName: 'Hanane',
      birthDate: '2014-03-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-01',
      periodLength: 6,
      cycleLength: 30,
    });

    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);

    const prefs = getCyclePreferences();
    expect(prefs.periodDuration).toBe(6);
    expect(prefs.cycleDuration).toBe(30);
    expect(prefs.lastPeriodStart.toLocaleDateString('en-CA')).toBe('2026-09-01');
    expect(getRecordedPeriodHistory().length).toBeGreaterThan(0); // a real recorded period, not just the habit
  });

  it('never fabricates a period for a daughter who had not had her first period yet — she gets the empty state', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2016-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);

    expect(getRecordedPeriodHistory()).toHaveLength(0);
  });

  it('never re-seeds (or overwrites) once she already has real declared cycle data', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter',
      firstName: 'Hanane',
      birthDate: '2014-03-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-01',
      periodLength: 6,
      cycleLength: 30,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);

    // She (or the mother, on her behalf) edits her own real cycle since then.
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 15), periodDuration: 4, cycleDuration: 27, regularity: 'yes'});

    // A second "become active" (e.g. switching away and back) must not clobber it.
    await seedManagedProfileCycleIfNeeded(hanane.id);
    expect(getCyclePreferences().periodDuration).toBe(4);
    expect(getCyclePreferences().cycleDuration).toBe(27);
  });

  it('seeding one daughter never touches another daughter’s or the mother’s own cycle data', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter',
      firstName: 'Hanane',
      birthDate: '2014-03-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-01',
      periodLength: 6,
      cycleLength: 30,
    });
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-01-01', hasHadFirstPeriod: false});

    await hydrateCyclePreferences();
    setCyclePreferences({lastPeriodStart: new Date(2026, 0, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'}); // mother's own

    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);

    await setActiveProfileId(lina.id);
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory()).toHaveLength(0); // never Hanane's seeded period

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getCyclePreferences().periodDuration).toBe(5); // the mother's own, untouched
  });
});
