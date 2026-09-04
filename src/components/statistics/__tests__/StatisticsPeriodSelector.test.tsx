import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable} from 'react-native';

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import StatisticsPeriodSelector, {STATISTICS_PERIOD_LABELS} from '../StatisticsPeriodSelector';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderSelector(props: Partial<React.ComponentProps<typeof StatisticsPeriodSelector>> = {}) {
  const onSelectPeriod = jest.fn();
  const onRequestPremium = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <StatisticsPeriodSelector
          isPremium={false}
          onRequestPremium={onRequestPremium}
          onSelectPeriod={onSelectPeriod}
          period="1"
          {...props}
        />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return {renderer: renderer!, onSelectPeriod, onRequestPremium};
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('StatisticsPeriodSelector — resolved theme tokens', () => {
  it('active-period text uses theme.colors.primary', async () => {
    const {renderer} = await renderSelector({period: '1'});
    const activeLabel = renderer.root.findAll(
      node => node.props.children === STATISTICS_PERIOD_LABELS['1'],
    )[0];
    expect(flattenStyle(activeLabel.props.style).color).toBe('#6D4AE8');
  });

  it('changes when the palette changes', async () => {
    const {renderer} = await renderSelector({period: '1'});
    const activeLabelColor = () => {
      const label = renderer.root.findAll(node => node.props.children === STATISTICS_PERIOD_LABELS['1'])[0];
      return flattenStyle(label.props.style).color;
    };
    expect(activeLabelColor()).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(activeLabelColor()).toBe('#C08B93'); // rose-quartz primary
  });
});

describe('StatisticsPeriodSelector — FREE/PREMIUM period rules unchanged', () => {
  it('a locked (Premium-only) period opens the paywall instead of selecting it — Free user', async () => {
    const {renderer, onSelectPeriod, onRequestPremium} = await renderSelector({period: '1', isPremium: false});
    const buttons = renderer.root.findAllByType(Pressable);
    // '3 mois' is the second button, Premium-only.
    act(() => {
      buttons[1].props.onPress();
    });
    expect(onRequestPremium).toHaveBeenCalledTimes(1);
    expect(onSelectPeriod).not.toHaveBeenCalled();
  });

  it('a Premium user can select a longer period normally', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const {renderer, onSelectPeriod, onRequestPremium} = await renderSelector({period: '1', isPremium: true});
    const buttons = renderer.root.findAllByType(Pressable);
    act(() => {
      buttons[1].props.onPress();
    });
    expect(onSelectPeriod).toHaveBeenCalledWith('3');
    expect(onRequestPremium).not.toHaveBeenCalled();
  });

  it('active/inactive contrast still works in Dark mode', async () => {
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const {renderer} = await renderSelector({period: '1'});
    const activeLabel = renderer.root.findAll(node => node.props.children === STATISTICS_PERIOD_LABELS['1'])[0];
    const inactiveLabel = renderer.root.findAll(node => node.props.children === STATISTICS_PERIOD_LABELS['3'])[0];
    const activeColor = flattenStyle(activeLabel.props.style).color;
    const inactiveColor = flattenStyle(inactiveLabel.props.style).color;
    expect(activeColor).not.toBe(inactiveColor);
  });
});
