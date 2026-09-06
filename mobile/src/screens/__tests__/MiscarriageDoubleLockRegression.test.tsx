import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';

// Bug: "Après une fausse couche" -> "Notes personnelles" required TWO
// consecutive private authentications. Root cause: MiscarriageDashboard.tsx
// and MainTabNavigator.tsx's JournalSheetHost both special-cased
// item.key === 'personalNotes' to pre-gate through requirePrivateAccess()
// (System A, PrivateAccessScreen, purpose: 'miscarriagePersonalNotes')
// BEFORE navigating to MiscarriageJournalEntryScreen — which already has its
// OWN, separate gate (System B: isIntimacyUnlocked()/PrivateIntimacyUnlock,
// target: 'miscarriageNotes'). System A's success never sets
// isIntimacyUnlocked(), so the destination's own gate fired a SECOND time
// immediately after the first succeeded. Fix: both callers now navigate
// directly to MiscarriageJournalEntry, exactly like every other objective's
// personal-notes/daily-notes quick action (Contraception, Menopause) —
// leaving exactly one authentication boundary: the destination screen's own
// System B gate.

const mockReplace = jest.fn();
const mockNavigation = {replace: mockReplace};
const mockRoute = {params: {category: 'personalNotes' as const}};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

jest.mock('../../state/privateSectionAuthStore', () => ({
  isIntimacyUnlocked: jest.fn(),
  unlockIntimacy: jest.fn(),
  lockIntimacy: jest.fn(),
  replaceWithIntimacyDestination: jest.fn(),
}));

jest.mock('../../state/miscarriageJournalStore', () => ({
  getMiscarriageJournalEntry: jest.fn().mockReturnValue(undefined),
  hydrateMiscarriageJournal: jest.fn().mockResolvedValue({}),
  saveMiscarriageJournalField: jest.fn().mockResolvedValue(undefined),
  isMiscarriageCategoryCompleted: jest.fn().mockReturnValue(false),
  subscribeMiscarriageJournal: jest.fn().mockReturnValue(() => {}),
}));

import {isIntimacyUnlocked} from '../../state/privateSectionAuthStore';
import MiscarriageJournalEntryScreen from '../MiscarriageJournalEntryScreen';

const mockedIsIntimacyUnlocked = isIntimacyUnlocked as jest.Mock;

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <MiscarriageJournalEntryScreen />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(() => {
  mockReplace.mockClear();
  mockedIsIntimacyUnlocked.mockReset();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

/* ============================================================
   STATIC GUARD — the redundant pre-gate is gone from both callers,
   and the destination screen's own single gate is untouched.
============================================================ */

describe('Miscarriage double-lock — static guard', () => {
  it('MiscarriageDashboard.tsx no longer routes personalNotes through requirePrivateAccess', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../components/miscarriage/MiscarriageDashboard.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/import\s*{\s*requirePrivateAccess\s*}/);
    expect(source).not.toMatch(/requirePrivateAccess\(navigation/);
    expect(source).not.toContain('miscarriagePersonalNotes');
  });

  it('MainTabNavigator.tsx (JournalSheetHost) no longer routes Miscarriage personalNotes through requirePrivateAccess', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../navigation/MainTabNavigator.tsx'), 'utf8');
    expect(source).not.toContain('miscarriagePersonalNotes');
    expect(source).not.toMatch(/requirePrivateAccess\(navigation, 'miscarriagePersonalNotes'\)/);
    // Pregnancy's medical-information purpose is untouched and must remain.
    expect(source).toContain("requirePrivateAccess(navigation, 'pregnancyMedicalInformation')");
  });

  it('MiscarriageJournalEntryScreen keeps exactly one, unmodified, shared gate (no bypass, no hardcoded unlock)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../MiscarriageJournalEntryScreen.tsx'), 'utf8');
    expect(source).toMatch(/if \(category === 'personalNotes' && !isIntimacyUnlocked\(\)\)/);
    expect(source).toMatch(/navigation\.replace\('PrivateIntimacyUnlock', \{ target: 'miscarriageNotes' \}\)/);
    expect(source).not.toMatch(/notesUnlocked\s*=\s*true/);
    expect(source).not.toMatch(/isIntimacyUnlocked\s*=\s*\(\)\s*=>\s*true/);
  });

  it('other objectives keep navigating directly (no pre-gate ever existed for them, confirming the fix is Miscarriage-specific)', () => {
    const contraception = fs.readFileSync(
      path.resolve(__dirname, '../contraception/ContraceptionJournalEntryScreen.tsx'),
      'utf8',
    );
    const menopause = fs.readFileSync(path.resolve(__dirname, '../menopause/MenopauseJournalEntryScreen.tsx'), 'utf8');
    expect(contraception).not.toMatch(/requirePrivateAccess\(navigation/);
    expect(menopause).not.toMatch(/requirePrivateAccess\(navigation/);
  });
});

/* ============================================================
   RUNTIME — Case 1: locked state, exactly one authentication boundary.
============================================================ */

describe('Case 1 — locked private session', () => {
  it('redirects to PrivateIntimacyUnlock exactly once, with the correct target, and renders no content', async () => {
    mockedIsIntimacyUnlocked.mockReturnValue(false);
    const renderer = await renderScreen();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('PrivateIntimacyUnlock', {target: 'miscarriageNotes'});

    // No "Notes personnelles" content leaks before authentication.
    const titleNodes = renderer.root.findAll(
      node => typeof node.props?.children === 'string' && node.props.children === 'Notes personnelles',
    );
    expect(titleNodes.length).toBe(0);
  });
});

/* ============================================================
   RUNTIME — Case 2: already-unlocked session, no second authentication.
============================================================ */

describe('Case 2 — already-unlocked private session', () => {
  it('opens Personal Notes content directly, with zero navigation to any lock screen', async () => {
    mockedIsIntimacyUnlocked.mockReturnValue(true);
    const renderer = await renderScreen();

    expect(mockReplace).not.toHaveBeenCalled();

    const titleNodes = renderer.root.findAll(
      node => typeof node.props?.children === 'string' && node.props.children === 'Notes personnelles',
    );
    expect(titleNodes.length).toBeGreaterThan(0);
  });
});

/* ============================================================
   Case 3 — auto-lock/session expiry: governed entirely by the existing,
   unmodified privateSectionAuthStore.ts (AppState-based BACKGROUND_LOCK_
   DELAY_MS timer / isIntimacyUnlocked()) — not touched by this fix. Once
   that shared store reports locked again, Case 1's exact redirect behavior
   applies again; there is no Miscarriage-specific override or permanent
   unlock introduced by this change (see the static guard above).
============================================================ */

describe('Case 3 — after the shared private session re-locks', () => {
  it('re-locking isIntimacyUnlocked() causes the same single-redirect behavior as Case 1 (no special-cased permanent unlock)', async () => {
    mockedIsIntimacyUnlocked.mockReturnValue(true);
    await renderScreen();
    expect(mockReplace).not.toHaveBeenCalled();

    mockReplace.mockClear();
    mockedIsIntimacyUnlocked.mockReturnValue(false);
    await renderScreen();
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('PrivateIntimacyUnlock', {target: 'miscarriageNotes'});
  });
});
