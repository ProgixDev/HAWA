import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import BackupDataScreen from '../BackupDataScreen';
import {DataExportScreen, DeleteTrackedDataScreen} from '../BackupUtilityScreens';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

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
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('BackupDataScreen — managed daughter profile wording, never hardcoded', () => {
  it('shows daughter-aware wording throughout, INCLUDING "Exporter les données de Lina" (PDF/CSV export is now profile-scoped and available)', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen(BackupDataScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Les données de Lina, toujours en sécurité 💜');
    expect(texts).toContain('Sauvegarder les données de Lina');
    expect(texts).toContain('Restaurer les données de Lina');
    expect(texts).toContain('Télécharger les données de Lina');
    expect(texts).toContain('Exporter les données de Lina');
    expect(texts).toContain('Supprimer les données de Lina');
    expect(texts).not.toContain('Exporter mes données'); // the owner's own wording never leaks in
  });

  it('a second daughter (Hanane) gets HER OWN name — proving the wording is never hardcoded to "Lina"', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    const texts = textsOf(await renderScreen(BackupDataScreen));
    expect(texts).toContain('Les données de Hanane, toujours en sécurité 💜');
  });

  it('the owner sees the existing, unchanged wording throughout', async () => {
    const texts = textsOf(await renderScreen(BackupDataScreen));
    expect(texts).toContain('Tes données, toujours en sécurité 💜');
    expect(texts).toContain('Sauvegarder maintenant');
    expect(texts).toContain('Restaurer une sauvegarde');
    expect(texts).toContain('Exporter mes données');
    expect(texts).toContain('Télécharger mes données');
    expect(texts).toContain('Supprimer mes données');
  });
});

describe('DeleteTrackedDataScreen — managed daughter profile wording', () => {
  it('the title, description and account-notice all name the active daughter, never claim to delete "her account"', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const texts = textsOf(await renderScreen(DeleteTrackedDataScreen));
    expect(texts).toContain('Supprimer les données de Lina');
    expect(texts.some(text => text.includes('les données de suivi locales de Lina'))).toBe(true);
    expect(texts.some(text => text.includes('Le profil de Lina ne sera pas supprimé'))).toBe(true);
    expect(texts).not.toContain('Ton compte AWA ne sera pas supprimé.');
  });

  it('the owner keeps the existing, unchanged copy', async () => {
    const texts = textsOf(await renderScreen(DeleteTrackedDataScreen));
    expect(texts).toContain('Supprimer mes données');
    expect(texts).toContain('Ton compte AWA ne sera pas supprimé.');
  });
});

describe('DataExportScreen — managed daughter profile: forced "Suivre mon cycle" objective, PDF/CSV available, "Vie intime" excluded', () => {
  it('is visible and daughter-worded, forces the Cycle objective even when the mother\'s own real objective is something else, and never offers "Vie intime"', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await setSelectedObjective('pregnancy'); // the mother's own real objective
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);

    const texts = textsOf(await renderScreen(DataExportScreen));
    expect(texts).toContain('Exporter les données de Lina');
    expect(texts).toContain('Objectif actif : Suivre mon cycle'); // forced — never "Suivi de grossesse"
    expect(texts).not.toContain('Objectif actif : Suivi de grossesse');
    expect(texts).not.toContain('Vie intime');
    // The rest of Cycle's own categories are still offered.
    expect(texts).toContain('Symptômes');
    expect(texts).toContain('Humeur');

    await setSelectedObjective('cycle');
  });

  it('the owner keeps the existing, unchanged behavior — her real objective is used, and "Vie intime" still appears for her own Cycle export', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const texts = textsOf(await renderScreen(DataExportScreen));
    expect(texts).toContain('Exporter mes données');
    expect(texts).toContain('Objectif actif : Suivre mon cycle');
    expect(texts).toContain('Vie intime');
  });
});
