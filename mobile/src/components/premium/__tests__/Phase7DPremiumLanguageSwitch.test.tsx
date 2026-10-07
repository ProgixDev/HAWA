import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {HawaPremiumBottomSheet} from '../HawaPremiumBottomSheet';
import {PremiumLockedCard} from '../PremiumLockedCard';
import {ArticlePremiumBadge} from '../../library/ArticlePremiumBadge';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import i18n from '../../../i18n';

// Phase 7D — the Premium paywall, locked-feature card and article badge must
// follow the app language exactly like every other migrated component. This
// file exercises the DEFAULT, real PURCHASE_PROVIDER_AVAILABLE=false state
// (no purchase SDK installed), so the "coming soon" / unavailable framing is
// what's actually shown in production today — the "available" scenario
// (plan selection, CTA, restore) is covered separately in
// Phase7DPremiumAvailableLanguageSwitch.test.tsx with the flag mocked true.

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  resetPremiumStateForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — HawaPremiumBottomSheet renders French/English copy', () => {
  it('French: hero title, intro and the "coming soon" framing', () => {
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    expect(textsOf(renderer)).toContain('AWA Premium');
    expect(textsOf(renderer)).toContain('Plus de possibilités,\nsimplement.');
    expect(textsOf(renderer)).toContain('Abonnement bientôt disponible');
  });

  it('English: hero title, intro and the "coming soon" framing, no known French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    expect(textsOf(renderer)).toContain('AWA Premium');
    expect(textsOf(renderer)).toContain('More possibilities,\nmade simple.');
    expect(textsOf(renderer)).toContain('Subscription coming soon');
    expect(textsOf(renderer)).not.toContain('Abonnement bientôt disponible');
  });
});

describe('TEST 7/8 — purchase-unavailable messaging follows the app language', () => {
  it('French: the unavailable card explains no purchase is possible yet', () => {
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    expect(textsOf(renderer)).toContain('AWA Premium n’est pas encore disponible à l’achat.');
    expect(textsOf(renderer)).toContain('Aucun achat n’est possible pour le moment et aucun paiement ne sera demandé.');
  });

  it('English: the same unavailable card in English', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    expect(textsOf(renderer)).toContain('AWA Premium isn’t available to purchase yet.');
    expect(textsOf(renderer)).toContain('No purchase is possible yet and no payment will be requested.');
  });
});

describe('TEST 13 — subscription state is unaffected by a language switch', () => {
  it('isPremium stays false across FR→EN (the sheet never shows the active-subscription card)', async () => {
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    expect(textsOf(renderer)).not.toContain('Abonnement actif');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    expect(textsOf(renderer)).not.toContain('Active subscription');
    expect(textsOf(renderer)).not.toContain('Abonnement actif');
  });
});

describe('PremiumLockedCard follows the app language', () => {
  it('French: default CTA and badge', () => {
    const renderer = renderDirect(
      <PremiumLockedCard description="desc" onUpgrade={jest.fn()} title="Statistiques avancées" />,
    );
    expect(textsOf(renderer)).toContain('Découvrir Premium');
    expect(textsOf(renderer)).toContain('Premium');
  });

  it('English: default CTA translates, a custom ctaLabel override is never translated', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <PremiumLockedCard description="desc" onUpgrade={jest.fn()} title="Advanced statistics" />,
    );
    expect(textsOf(renderer)).toContain('Discover Premium');

    const customRenderer = renderDirect(
      <PremiumLockedCard ctaLabel="Custom CTA" description="desc" onUpgrade={jest.fn()} title="t" />,
    );
    expect(textsOf(customRenderer)).toContain('Custom CTA');
  });
});

describe('ArticlePremiumBadge follows the app language', () => {
  it('French: locked badge accessibility label', () => {
    const renderer = renderDirect(<ArticlePremiumBadge article={{premium: true}} />);
    expect(renderer.root.findByProps({accessibilityLabel: 'Contenu Premium verrouillé'})).toBeTruthy();
    expect(textsOf(renderer)).toContain('Premium');
  });

  it('English: locked badge accessibility label translates', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<ArticlePremiumBadge article={{premium: true}} />);
    expect(renderer.root.findByProps({accessibilityLabel: 'Locked Premium content'})).toBeTruthy();
  });

  it('a non-Premium article renders nothing, regardless of language', () => {
    const renderer = renderDirect(<ArticlePremiumBadge article={{premium: false}} />);
    expect(textsOf(renderer)).toHaveLength(0);
  });
});
