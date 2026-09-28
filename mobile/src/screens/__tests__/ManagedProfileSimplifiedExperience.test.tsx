import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import GeneralHealthScreen from '../GeneralHealthScreen';
import HelpSupportScreen from '../HelpSupportScreen';
import {FAQScreen} from '../SupportResourcesScreens';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';

// Two DIFFERENT managed daughters are used across this file's tests (Hanane / Lina)
// so no single test accidentally proves isolation with only one profile.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function withProviders(children: React.ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={TEST_METRICS}>
      <AwaThemeProvider>{children}</AwaThemeProvider>
    </SafeAreaProvider>
  );
}

async function renderGeneralHealth() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      withProviders(<GeneralHealthScreen navigation={navigation} route={{key: 'test', name: 'GeneralHealth'}} />),
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

async function renderHelpSupport() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      withProviders(<HelpSupportScreen navigation={navigation} route={{key: 'test', name: 'HelpSupport'}} />),
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

async function renderFAQ() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(withProviders(<FAQScreen navigation={navigation} route={{key: 'test', name: 'FAQ'}} />));
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
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('GeneralHealthScreen — "Objectifs de santé" hidden for a managed daughter profile', () => {
  it('is not rendered for a daughter, with no empty gap, but is unchanged for the owner', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    const daughterRenderer = await renderGeneralHealth();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('Objectifs de santé');
    expect(daughterTexts).not.toContain('Mon objectif actuel');
    // The rest of Santé générale is untouched for her.
    expect(daughterTexts).toContain('Tu peux modifier toutes ces informations à tout moment.');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const ownerRenderer = await renderGeneralHealth();
    const ownerTexts = textsOf(ownerRenderer);
    expect(ownerTexts).toContain('Objectifs de santé');
    expect(ownerTexts).toContain('Mon objectif actuel');
  });
});

describe('HelpSupportScreen — "Aide & support" limited to cycle-tracking topics for a managed daughter profile', () => {
  it('shows only cycle-tracking FAQ topics for a daughter, and excludes unrelated objective/feature topics', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderHelpSupport();
    const texts = textsOf(renderer);

    // Kept: cycle-tracking topics (predictions explain fertile window & ovulation too).
    expect(texts).toContain('Comment enregistrer mes règles ?');
    expect(texts).toContain('Comment sont calculées mes prochaines règles ?');
    expect(texts).toContain('Que signifient les repères du calendrier ?');

    // Excluded: other objectives / AWA à deux / spiritual / unrelated topics.
    expect(texts).not.toContain('Comment connaître ma fenêtre fertile ?'); // conceive-objective phrasing
    expect(texts).not.toContain('Comment est calculé mon terme estimé ?'); // pregnancy
    expect(texts).not.toContain('Comment fonctionne le calendrier hijri ?'); // spiritual
    expect(texts).not.toContain('Quelles contraceptions puis-je suivre ?'); // contraception
    expect(texts).not.toContain('Un cycle long est-il considéré comme un retard ?'); // SOPK
  });

  it('shows the FULL, unfiltered FAQ list for the owner', async () => {
    const renderer = await renderHelpSupport();
    const texts = textsOf(renderer);
    expect(texts).toContain('Comment enregistrer mes règles ?');
    expect(texts).toContain('Comment connaître ma fenêtre fertile ?');
    expect(texts).toContain('Comment fonctionne le calendrier hijri ?');
  });
});

describe('FAQScreen (full list) — same cycle-tracking-only filtering for a managed daughter profile', () => {
  it('a daughter sees only cycle-tracking questions; the owner sees everything', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    const daughterTexts = textsOf(await renderFAQ());
    expect(daughterTexts).toContain('Comment enregistrer mes règles ?');
    expect(daughterTexts).not.toContain('Comment connaître ma fenêtre fertile ?');
    expect(daughterTexts).not.toContain('Comment fonctionne le calendrier hijri ?'); // spiritual topic excluded too

    await setActiveProfileId(OWNER_PROFILE_ID);
    const ownerTexts = textsOf(await renderFAQ());
    expect(ownerTexts).toContain('Comment connaître ma fenêtre fertile ?');
  });
});
