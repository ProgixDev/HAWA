import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {PREMIUM_PRICING} from '../../../config/premiumPricing';
import {purchasePremium, restorePurchases} from '../../../services/purchaseService';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {HawaPremiumBottomSheet} from '../HawaPremiumBottomSheet';

// M39 — provider AVAILABLE (flag mocked to true, simulating the day a real
// purchase SDK is integrated): the purchase CTA, prices, plan radios and the
// restore control are shown again, wired to the (mocked) service. This proves
// the unavailable state is a pure flag flip away from the full flow.

jest.mock('../../../config/purchaseProvider', () => ({
  PURCHASE_PROVIDER_AVAILABLE: true,
}));

jest.mock('../../../services/purchaseService', () => ({
  purchasePremium: jest.fn().mockResolvedValue('cancelled'),
  restorePurchases: jest.fn().mockResolvedValue('cancelled'),
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

describe('HawaPremiumBottomSheet — purchase provider available (mocked flag)', () => {
  it('shows the purchase CTA with the selected plan price, the restore control and both plan radios', async () => {
    const renderer = await renderSheet();
    const texts = textsOf(renderer);
    expect(texts).toContain('S’abonner maintenant');
    expect(texts).toContain('Restaurer mes achats');
    expect(texts).toContain(PREMIUM_PRICING.annual.price);
    expect(texts).toContain(PREMIUM_PRICING.monthly.price);
    expect(texts).not.toContain('Abonnement bientôt disponible');
    expect(renderer.root.findAllByProps({accessibilityLabel: `Choisir ${PREMIUM_PRICING.annual.label}`}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: `Choisir ${PREMIUM_PRICING.monthly.label}`}).length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.accessibilityRole === 'radio').length).toBeGreaterThan(0);
  });

  it('the CTA drives the purchase service with the chosen plan; restore drives restorePurchases', async () => {
    const renderer = await renderSheet();
    const subscribe = renderer.root.findAllByProps({accessibilityLabel: 'S’abonner à AWA Premium'}).find(node => typeof node.props.onPress === 'function');
    await act(async () => {
      await subscribe!.props.onPress();
    });
    expect(purchasePremium).toHaveBeenCalledWith('annual');

    const restore = renderer.root.findAllByProps({accessibilityLabel: 'Restaurer mes achats'}).find(node => typeof node.props.onPress === 'function');
    await act(async () => {
      await restore!.props.onPress();
    });
    expect(restorePurchases).toHaveBeenCalledTimes(1);
  });
});
