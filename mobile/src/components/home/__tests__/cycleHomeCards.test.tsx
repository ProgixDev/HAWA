import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import HeroCycleCard from '../HeroCycleCard';
import CycleOverviewCard, {type OverviewItem} from '../CycleOverviewCard';
import MotivationCard from '../MotivationCard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderWithTheme(children: React.ReactNode) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AwaThemeProvider>{children}</AwaThemeProvider>);
  });
  activeRenderers.push(renderer!);
  return renderer!;
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

describe('HeroCycleCard — theme reactivity + semantic phase colors', () => {
  it('generic chrome (today title) responds to palette changes', async () => {
    const renderer = await renderWithTheme(
      <HeroCycleCard currentDay={5} cycleLength={28} phase="follicular" />,
    );
    const title = renderer.root.findAll(node => node.props.children === 'Aujourd’hui')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(flattenStyle(title.props.style).color).toBe('#4A2E37');
  });

  it('the menstruation phase ring color stays fixed across palette changes', async () => {
    const renderer = await renderWithTheme(
      <HeroCycleCard currentDay={2} cycleLength={28} phase="menstruation" />,
    );
    const phaseLabel = () => renderer.root.findAll(node => node.props.children === 'Phase menstruelle')[0];
    expect(flattenStyle(phaseLabel().props.style).color).toBe('#DC7B82');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(flattenStyle(phaseLabel().props.style).color).toBe('#DC7B82');
  });

  it('the ovulation phase ring color stays fixed even though it currently equals the brand primary', async () => {
    const renderer = await renderWithTheme(
      <HeroCycleCard currentDay={14} cycleLength={28} phase="ovulation" />,
    );
    const phaseLabel = () => renderer.root.findAll(node => node.props.children === 'Ovulation')[0];
    expect(flattenStyle(phaseLabel().props.style).color).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    // Must NOT silently follow warm-sand's own primary (#B08A5C) — it's a
    // fixed cycle-phase identity color, not a decorative brand reference.
    expect(flattenStyle(phaseLabel().props.style).color).toBe('#6D4AE8');
  });

  it('the fertile phase ring color stays fixed across palette changes', async () => {
    const renderer = await renderWithTheme(
      <HeroCycleCard currentDay={12} cycleLength={28} phase="fertile" />,
    );
    const phaseLabel = () => renderer.root.findAll(node => node.props.children === 'Fenêtre fertile')[0];
    expect(flattenStyle(phaseLabel().props.style).color).toBe('#8B6FD1');

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(flattenStyle(phaseLabel().props.style).color).toBe('#8B6FD1');
  });
});

describe('CycleOverviewCard — theme reactivity + preserved caller-supplied colors', () => {
  const items: OverviewItem[] = [
    {key: 'next-period', icon: 'water', iconColor: '#DC7B82', iconBg: '#F7D7D6', label: 'Prochaines règles', value: '12 mars', subtitle: 'Dans 3 jours'},
  ];

  it('generic chrome (title) responds to palette changes', async () => {
    const renderer = await renderWithTheme(<CycleOverviewCard items={items} />);
    const title = renderer.root.findAll(node => node.props.children === 'Aperçu de ton cycle')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(flattenStyle(title.props.style).color).toBe('#233238');
  });

  it('never recolors the caller-supplied semantic period icon color', async () => {
    const renderer = await renderWithTheme(<CycleOverviewCard items={items} />);
    const icon = renderer.root.findAll(node => node.props.name === 'water')[0];
    expect(icon.props.color).toBe('#DC7B82');

    await act(async () => {
      await setSelectedThemeId('lavender-night');
    });

    expect(icon.props.color).toBe('#DC7B82');
  });
});

describe('MotivationCard — theme reactivity, fixed text over fixed image', () => {
  it('card fallback background responds to palette changes', async () => {
    const renderer = await renderWithTheme(<MotivationCard />);
    const image = renderer.root.findByProps({resizeMode: 'cover'});
    expect(flattenStyle(image.props.style).backgroundColor).toBe('#F7F3FF');

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(flattenStyle(image.props.style).backgroundColor).toBe('#EFE1CC');
  });

  it('title/subtitle text stay fixed regardless of palette or dark mode (calibrated against the fixed photo)', async () => {
    const renderer = await renderWithTheme(<MotivationCard />);
    const title = renderer.root.findAll(node => node.props.children === 'Prends soin de toi, tu es précieuse ✨')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
      await setAppearanceMode('dark');
    });

    expect(flattenStyle(title.props.style).color).toBe('#2F2258');
  });
});
