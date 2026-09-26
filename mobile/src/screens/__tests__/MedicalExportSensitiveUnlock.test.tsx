import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {DataExportScreen} from '../BackupUtilityScreens';
import PrivateIntimacyUnlockScreen from '../journal/PrivateIntimacyUnlockScreen';
import PrivateIntimacyPinScreen from '../journal/PrivateIntimacyPinScreen';
import {isIntimacyUnlocked, lockIntimacy} from '../../state/privateSectionAuthStore';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {buildMedicalExport} from '../../services/medicalExportOrchestrator';
import {purgeMedicalExportCache, shareExportFile} from '../../services/medicalExportShare';

// M44 — exporting a sensitive (decrypted) category must first go through the
// EXISTING private-section unlock (PIN screens / privateSectionAuthStore — the
// "Vie intime" gate, unchanged), resume the export on success, and export
// nothing on cancel / failed PIN. The real DataExportScreen, the real Unlock
// and PIN screens and the real privateSectionAuthStore run inside a real
// native-stack; only the native PIN verifier, the orchestrator (so we can
// count reads/decryptions) and the file/share sheet are mocked.

jest.mock('../../services/privateSectionAuth', () => ({
  hasPrivatePin: jest.fn().mockResolvedValue(true),
  verifyPrivatePin: jest.fn(async (pin: string) => pin === '123456'),
  savePrivatePin: jest.fn().mockResolvedValue(undefined),
  getBiometryType: jest.fn().mockResolvedValue(null),
  getBiometryLabel: jest.fn().mockReturnValue('Utiliser la biométrie'),
  getBiometryIcon: jest.fn().mockReturnValue('face-recognition'),
  authenticateWithBiometry: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  isBiometricEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock('../../services/medicalExportOrchestrator', () => ({
  buildMedicalExport: jest.fn(),
}));

jest.mock('../../services/medicalExportShare', () => ({
  buildExportFilename: jest.fn(() => 'AWA_suivi_test.csv'),
  purgeMedicalExportCache: jest.fn().mockResolvedValue(undefined),
  shareExportFile: jest.fn(),
}));

const mockBuildMedicalExport = buildMedicalExport as jest.Mock;
const mockShareExportFile = shareExportFile as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef<any>();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

let renderer: ReactTestRenderer.ReactTestRenderer;

async function renderExportFlow() {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="DataExport" screenOptions={{headerShown: false}}>
              <Stack.Screen component={DataExportScreen as React.ComponentType<any>} name="DataExport" />
              <Stack.Screen component={PrivateIntimacyUnlockScreen as React.ComponentType<any>} name="PrivateIntimacyUnlock" />
              <Stack.Screen component={PrivateIntimacyPinScreen as React.ComponentType<any>} name="PrivateIntimacyPin" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  await flush();
}

const flush = async (ms = 0) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
};

const currentRoute = () => navRef.getCurrentRoute();

function pressableAbove(node: ReactTestRenderer.ReactTestInstance): ReactTestRenderer.ReactTestInstance | null {
  let current: ReactTestRenderer.ReactTestInstance | null = node;
  while (current && typeof current.props?.onPress !== 'function') {current = current.parent;}
  return current;
}

// Several Texts can carry the same string (e.g. the screen title and the CTA):
// press the first one that actually sits inside a pressable.
const pressText = async (text: string) => {
  const target = renderer.root
    .findAll(node => node.type === Text && node.props.children === text)
    .map(pressableAbove)
    .find(Boolean);
  if (!target) {throw new Error(`pressable text not found: ${text}`);}
  await act(async () => {
    target.props.onPress();
  });
  await flush();
};

const pressLabel = async (label: string) => {
  const match = renderer.root.findAll(node => node.props?.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];
  if (!match) {throw new Error(`label not found: ${label}`);}
  await act(async () => {
    match.props.onPress();
  });
  await flush();
};

const typePin = async (pin: string) => {
  for (const digit of pin) {
    await pressLabel(digit);
  }
  await flush(250); // the PIN screen verifies 120 ms after the 6th digit
};

const hasText = (text: string) =>
  renderer.root.findAll(node => node.type === Text && node.props.children === text).length > 0;

beforeEach(() => {
  jest.clearAllMocks();
  lockIntimacy();
  resetPremiumStateForTests();
  updatePremiumState({isPremium: true, initialized: true});
  mockBuildMedicalExport.mockResolvedValue({kind: 'csv', content: 'date;categorie;valeur', fromKey: '2026-08-01', toKey: '2026-08-25'});
  mockShareExportFile.mockResolvedValue('shared');
});

afterEach(() => {
  act(() => {
    renderer.unmount();
  });
  lockIntimacy();
  resetPremiumStateForTests();
});

describe('DataExportScreen — sensitive export requires the private-section unlock (M44)', () => {
  it('a default (non-sensitive) selection exports directly: no unlock screen, no prompt', async () => {
    await renderExportFlow();
    // A previous (possibly decrypted, unencrypted-on-disk) export is purged on open.
    expect(purgeMedicalExportCache).toHaveBeenCalledTimes(1);
    await pressText('Exporter mes données');
    expect(currentRoute()?.name).toBe('DataExport');
    expect(mockBuildMedicalExport).toHaveBeenCalledTimes(1);
    expect(mockShareExportFile).toHaveBeenCalledTimes(1);
  });

  it('selecting a sensitive category shows the warning, and exporting opens the private unlock BEFORE any read/decryption', async () => {
    await renderExportFlow();
    expect(hasText('Donnée sensible')).toBe(true);
    await pressText('Notes privées'); // sensitive, off by default -> select it
    expect(
      renderer.root.findAll(
        node => node.type === Text && typeof node.props.children === 'string' && node.props.children.startsWith('Les catégories sensibles sont déchiffrées'),
      ).length,
    ).toBe(1);

    await pressText('Exporter mes données');

    expect(currentRoute()?.name).toBe('PrivateIntimacyUnlock');
    expect(currentRoute()?.params).toEqual({target: 'export'});
    expect(mockBuildMedicalExport).not.toHaveBeenCalled();
    expect(mockShareExportFile).not.toHaveBeenCalled();
    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('cancel: leaving the unlock flow returns to the export screen and exports nothing', async () => {
    await renderExportFlow();
    await pressText('Notes privées');
    await pressText('Exporter mes données');
    expect(currentRoute()?.name).toBe('PrivateIntimacyUnlock');

    await act(async () => {
      navRef.goBack();
    });
    await flush();

    expect(currentRoute()?.name).toBe('DataExport');
    expect(mockBuildMedicalExport).not.toHaveBeenCalled();
    expect(mockShareExportFile).not.toHaveBeenCalled();
    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('failed unlock (wrong PIN): stays locked, still on the PIN screen, nothing read or exported', async () => {
    await renderExportFlow();
    await pressText('Notes privées');
    await pressText('Exporter mes données');
    await pressLabel('Saisir le code privé');
    expect(currentRoute()?.name).toBe('PrivateIntimacyPin');
    expect(currentRoute()?.params).toEqual({target: 'export'});

    await typePin('000000');

    expect(currentRoute()?.name).toBe('PrivateIntimacyPin');
    expect(hasText('Code incorrect. Réessaie.')).toBe(true);
    expect(isIntimacyUnlocked()).toBe(false);
    expect(mockBuildMedicalExport).not.toHaveBeenCalled();
    expect(mockShareExportFile).not.toHaveBeenCalled();
  });

  it('successful unlock: returns to the SAME export screen (choices kept) and completes the export once', async () => {
    await renderExportFlow();
    await pressText('Notes privées');
    await pressText('Exporter mes données');
    await pressLabel('Saisir le code privé');

    await typePin('123456');

    expect(isIntimacyUnlocked()).toBe(true);
    expect(currentRoute()?.name).toBe('DataExport');
    // The continuation param was consumed (no re-export on the next render).
    expect((currentRoute()?.params as {sensitiveUnlockToken?: number} | undefined)?.sensitiveUnlockToken).toBeUndefined();
    expect(mockBuildMedicalExport).toHaveBeenCalledTimes(1);
    const [objective, period, format, categories] = mockBuildMedicalExport.mock.calls[0];
    expect(objective).toBe('cycle');
    expect(period).toBe('all');
    expect(format).toBe('csv');
    expect(categories).toContain('notes'); // the selection made BEFORE the unlock survived it
    expect(categories).toContain('symptoms');
    expect(mockShareExportFile).toHaveBeenCalledTimes(1);
  });

  it('once unlocked in this session, a further sensitive export goes straight through (same session rule as the other private screens)', async () => {
    await renderExportFlow();
    await pressText('Notes privées');
    await pressText('Exporter mes données');
    await pressLabel('Saisir le code privé');
    await typePin('123456');
    expect(mockShareExportFile).toHaveBeenCalledTimes(1);

    await pressText('Exporter mes données');
    expect(currentRoute()?.name).toBe('DataExport');
    expect(mockShareExportFile).toHaveBeenCalledTimes(2);
  });

  it('the private lock state is untouched by a non-sensitive export', async () => {
    await renderExportFlow();
    await pressText('Exporter mes données');
    expect(isIntimacyUnlocked()).toBe(false);
  });
});
