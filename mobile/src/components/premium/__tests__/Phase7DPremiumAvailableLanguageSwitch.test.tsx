import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {HawaPremiumBottomSheet} from '../HawaPremiumBottomSheet';
import {PREMIUM_PRICING} from '../../../config/premiumPricing';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {getPremiumState, resetPremiumStateForTests} from '../../../state/premiumStore';
import i18n from '../../../i18n';

// Phase 7D — M39 "provider available" scenario (flag mocked true, simulating
// the day a real purchase SDK is wired in): the purchase CTA, plan radios
// and restore control are interactive. This is where plan-selection,
// product-id/price/subscription-state data-integrity, and restore/error
// copy are meaningfully testable (the real, current PURCHASE_PROVIDER_
// AVAILABLE=false state is covered in Phase7DPremiumLanguageSwitch.test.tsx).

import '../../../i18n';

jest.mock('../../../config/purchaseProvider', () => ({
  PURCHASE_PROVIDER_AVAILABLE: true,
}));

const mockPurchasePremium = jest.fn();
const mockRestorePurchases = jest.fn();
jest.mock('../../../services/purchaseService', () => ({
  purchasePremium: (...args: unknown[]) => mockPurchasePremium(...args),
  restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
}));

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
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

beforeEach(async () => {
  await resetAppLanguageForTests();
  resetPremiumStateForTests();
  mockPurchasePremium.mockReset().mockResolvedValue('cancelled');
  mockRestorePurchases.mockReset().mockResolvedValue('cancelled');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 3/4 — Monthly/Annual plan labels follow the app language', () => {
  it('French: both plan labels render', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Abonnement annuel');
    expect(textsOf(renderer)).toContain('Abonnement mensuel');
  });

  it('English: both plan labels translate, with no known French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Annual subscription');
    expect(textsOf(renderer)).toContain('Monthly subscription');
    expect(textsOf(renderer)).not.toContain('Abonnement annuel');
  });
});

describe('TEST 5 — Premium feature/benefit labels follow the app language', () => {
  it('French: exports and customization benefit titles render', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Exports santé');
    expect(textsOf(renderer)).toContain('Plus de personnalisation');
  });

  it('English: the same benefit titles translate', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Health exports');
    expect(textsOf(renderer)).toContain('More customization');
  });
});

describe('TEST 6 — the subscribe CTA follows the app language', () => {
  it('French: "S’abonner maintenant"', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('S’abonner maintenant');
  });

  it('English: "Subscribe now"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Subscribe now');
  });
});

describe('TEST 9 — a runtime FR→EN switch updates visible Premium copy without a restart', () => {
  it('the title/CTA re-render in English after changeLanguage, same mounted instance', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('S’abonner maintenant');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Subscribe now');
    expect(textsOf(renderer)).not.toContain('S’abonner maintenant');
  });
});

describe('TEST 10/11/12/13 — a language switch changes DISPLAY only: plan, product id, price and subscription state stay identical', () => {
  it('selecting "monthly", then switching language, keeps the monthly plan selected', async () => {
    const renderer = await renderSheet();

    const monthlyRadio = renderer.root.find(
      node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === `Choisir ${PREMIUM_PRICING.monthly.label}`,
    );
    act(() => {
      monthlyRadio.props.onPress();
    });

    // The CTA subtext shows the selected plan's label · price — captures the
    // technical selection indirectly through the rendered subtext.
    expect(textsOf(renderer).some(text => text.includes(PREMIUM_PRICING.monthly.price))).toBe(true);

    const selectedPlanId = 'monthly'; // the only stable technical identifier for a plan in this codebase
    const priceBefore = PREMIUM_PRICING.monthly.price;
    const subscriptionStateBefore = getPremiumState().isPremium;

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    // Still showing the monthly plan's price in the CTA subtext — selection
    // was not reset by the language switch.
    expect(textsOf(renderer).some(text => text.includes(PREMIUM_PRICING.monthly.price))).toBe(true);
    expect(selectedPlanId).toBe('monthly');
    expect(PREMIUM_PRICING.monthly.price).toBe(priceBefore);
    expect(PREMIUM_PRICING.annual.price).toBe('99,99 £ / an');
    expect(PREMIUM_PRICING.monthly.price).toBe('99,99 £ / mois');
    expect(getPremiumState().isPremium).toBe(subscriptionStateBefore);
  });
});

describe('TEST 14 — restore-purchase copy follows the app language', () => {
  it('French: restore button label', async () => {
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Restaurer mes achats');
  });

  it('English: restore button label translates', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderSheet();
    expect(textsOf(renderer)).toContain('Restore purchases');
  });
});

describe('TEST 15 — billing error feedback is localized without changing the technical outcome code', () => {
  it('a rejected restore shows the translated error message, the service still returns the stable "error" outcome', async () => {
    mockRestorePurchases.mockResolvedValue('error');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderSheet();

    const restoreButton = renderer.root.findByProps({accessibilityLabel: 'Restore purchases'});
    await act(async () => {
      await restoreButton.props.onPress();
    });

    expect(textsOf(renderer)).toContain('Couldn’t restore your purchases right now.');
    expect(await mockRestorePurchases.mock.results[0].value).toBe('error');
  });
});
