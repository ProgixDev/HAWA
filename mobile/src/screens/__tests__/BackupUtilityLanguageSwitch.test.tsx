import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {TextInput} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import BackupDataScreen from '../BackupDataScreen';
import {RestoreBackupScreen, DataExportScreen, DeleteTrackedDataScreen} from '../BackupUtilityScreens';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import i18n from '../../i18n';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(Screen: React.ComponentType<any>) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()};
  const route = {key: 'test', name: 'test'};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Screen navigation={navigation} route={route} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

beforeEach(async () => {
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

// Phase 6 localization — the Backup/Restore/Export/Delete screens must
// switch to English, while real stored data (e.g. a backup's size/date) is
// never affected. The DELETE/SUPPRIMER confirmation word is the one
// behavioral (not just textual) change: the required typed word itself
// follows the app language, per the explicit product decision for this
// phase (never a real password, so this changes no security property).
describe('BackupDataScreen — language switch', () => {
  it('owner wording switches to English', async () => {
    const texts = textsOf(await renderScreen(BackupDataScreen));
    expect(texts).toContain('Tes données, toujours en sécurité 💜');

    await i18n.changeLanguage('en');
    const enTexts = textsOf(await renderScreen(BackupDataScreen));
    expect(enTexts).toContain('Your data, always safe 💜');
    expect(enTexts).toContain('Back up now');
    expect(enTexts).toContain('Restore a backup');
    expect(enTexts).toContain('Download my data');
    expect(enTexts).toContain('Export my data');
    expect(enTexts).toContain('Delete my data');
    expect(enTexts).not.toContain('Sauvegarder maintenant');
  });
});

describe('RestoreBackupScreen — language switch', () => {
  it('the "no backup" hero state switches to English', async () => {
    const texts = textsOf(await renderScreen(RestoreBackupScreen));
    expect(texts).toContain('Aucune sauvegarde');

    await i18n.changeLanguage('en');
    const enTexts = textsOf(await renderScreen(RestoreBackupScreen));
    expect(enTexts).toContain('No backup');
    expect(enTexts).not.toContain('Aucune sauvegarde');
  });
});

describe('DataExportScreen — language switch', () => {
  it('period/format/category chrome switches to English; CSV/PDF format names stay the same', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const texts = textsOf(await renderScreen(DataExportScreen));
    expect(texts).toContain('Objectif actif : Suivre mon cycle');
    expect(texts).toContain('Tout l’historique');
    expect(texts).toContain('Catégories');

    await i18n.changeLanguage('en');
    const enTexts = textsOf(await renderScreen(DataExportScreen));
    expect(enTexts).toContain('Active objective : Cycle tracking');
    expect(enTexts).toContain('Entire history');
    expect(enTexts).toContain('Categories');
    expect(enTexts).toContain('CSV');
    expect(enTexts).toContain('PDF');
  });
});

describe('DeleteTrackedDataScreen — language switch, including the confirmation word itself', () => {
  it('French: typing "SUPPRIMER" validates; typing "DELETE" does not', async () => {
    const renderer = await renderScreen(DeleteTrackedDataScreen);
    const input = renderer.root.findByType(TextInput);

    await act(async () => {
      input.props.onChangeText('DELETE');
    });
    expect(textsOf(renderer)).not.toContain('Confirmation correcte');

    await act(async () => {
      input.props.onChangeText('SUPPRIMER');
    });
    expect(textsOf(renderer)).toContain('Confirmation correcte');
  });

  it('English: the required word becomes "DELETE" — "SUPPRIMER" no longer validates', async () => {
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(DeleteTrackedDataScreen);
    const input = renderer.root.findByType(TextInput);
    expect(input.props.placeholder).toBe('DELETE');

    await act(async () => {
      input.props.onChangeText('SUPPRIMER');
    });
    expect(textsOf(renderer)).not.toContain('Confirmation correct');

    await act(async () => {
      input.props.onChangeText('DELETE');
    });
    expect(textsOf(renderer)).toContain('Confirmation correct');
  });

  it('the irreversible-action chrome switches to English', async () => {
    await i18n.changeLanguage('en');
    const texts = textsOf(await renderScreen(DeleteTrackedDataScreen));
    expect(texts).toContain('Irreversible action');
    expect(texts).toContain('Your AWA account will not be deleted.');
    expect(texts).not.toContain('Action irréversible');
  });
});
