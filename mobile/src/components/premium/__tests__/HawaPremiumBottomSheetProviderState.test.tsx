import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {PREMIUM_PRICING} from '../../../config/premiumPricing';
import {LIBRARY_ARTICLES, type LibraryArticle} from '../../../data/libraryContent';
import {purchasePremium, restorePurchases} from '../../../services/purchaseService';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {HawaPremiumBottomSheet} from '../HawaPremiumBottomSheet';

// M39 — provider UNAVAILABLE (the real default: PURCHASE_PROVIDER_AVAILABLE
// is false). The sheet must not imply a transaction can be completed:
// no purchase/restore control, no price, no "Sécurisé" claim, no radio plan
// selection. The provider-available counterpart lives in
// HawaPremiumBottomSheetProviderAvailable.test.tsx (flag mocked to true).

jest.mock('../../../services/purchaseService', () => ({
  purchasePremium: jest.fn().mockResolvedValue('unavailable'),
  restorePurchases: jest.fn().mockResolvedValue('unavailable'),
}));

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function renderSheet() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <HawaPremiumBottomSheet onClose={jest.fn()} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

beforeEach(() => {
  resetPremiumStateForTests();
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('HawaPremiumBottomSheet — purchase provider unavailable (default)', () => {
  it('shows no actionable purchase CTA and no restore-purchases control', async () => {
    const renderer = await renderSheet();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('S’abonner maintenant');
    expect(texts).not.toContain('Restaurer mes achats');
    expect(renderer.root.findAllByProps({accessibilityLabel: 'S’abonner à AWA Premium'})).toHaveLength(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Restaurer mes achats'})).toHaveLength(0);
    expect(texts).toContain('Abonnement bientôt disponible');
  });

  it('shows no price and no payment / trial / security claim', async () => {
    const renderer = await renderSheet();
    const joined = textsOf(renderer).join(' | ');
    expect(joined).not.toMatch(/99,99|£|€|\/ ?an|\/ ?mois/);
    expect(joined).not.toMatch(/Sécurisé|Essai gratuit|Accès Premium pendant 12 mois|RECOMMANDÉ|Meilleur choix/);
    expect(joined).not.toMatch(/Choisis la formule|Choisir /);
    expect(joined).toMatch(/aucun paiement/i);
  });

  it('plans are non-interactive previews: no radio role, no selectable control', async () => {
    const renderer = await renderSheet();
    expect(renderer.root.findAll(node => node.props.accessibilityRole === 'radio')).toHaveLength(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: `${PREMIUM_PRICING.annual.label}, bientôt disponible`}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: `${PREMIUM_PRICING.monthly.label}, bientôt disponible`}).length).toBeGreaterThan(0);
    expect(textsOf(renderer)).toContain(PREMIUM_PRICING.annual.label);
    expect(textsOf(renderer)).toContain(PREMIUM_PRICING.monthly.label);
  });

  it('never calls the purchase service on its own, and the plan data is preserved for the future integration', async () => {
    await renderSheet();
    expect(purchasePremium).not.toHaveBeenCalled();
    expect(restorePurchases).not.toHaveBeenCalled();
    expect(PREMIUM_PRICING.annual.price).toBe('99,99 £ / an');
    expect(PREMIUM_PRICING.monthly.price).toBe('99,99 £ / mois');
  });

  it('an already-Premium state still shows the active-status card (unchanged)', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await renderSheet();
    const texts = textsOf(renderer);
    expect(texts).toContain('Abonnement actif');
    expect(texts).not.toContain('Abonnement bientôt disponible');
  });
});

describe('HawaPremiumBottomSheet — marketing list agrees with the gates (M38/M41)', () => {
  const PREMIUM_GUIDE: LibraryArticle = {
    id: 'sheet-test-premium-guide',
    title: 'Guide premium test',
    categoryId: 'cycle',
    level: 'beginner',
    type: 'guide',
    durationMinutes: 3,
    tags: [],
    summary: 's',
    content: ['c'],
    premium: true,
  };

  it('does not advertise "Guides approfondis" while no guide is Premium-gated', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).not.toContain('Guides approfondis');
  });

  it('advertises "Guides approfondis" as soon as one guide is really Premium-gated', async () => {
    LIBRARY_ARTICLES.push(PREMIUM_GUIDE);
    try {
      const renderer = await renderSheet();
      expect(textsOf(renderer)).toContain('Guides approfondis');
    } finally {
      LIBRARY_ARTICLES.splice(LIBRARY_ARTICLES.indexOf(PREMIUM_GUIDE), 1);
    }
  });

  it('keeps the enforced entitlements advertised: advanced statistics, exports, unlimited history, personalisation', async () => {
    const renderer = await renderSheet();
    const texts = textsOf(renderer);
    ['Statistiques avancées', 'Exports santé', 'Historique illimité', 'Plus de personnalisation'].forEach(title => {
      expect(texts).toContain(title);
    });
  });
});
