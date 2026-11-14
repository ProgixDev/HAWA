import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import HeroCycleCard from '../HeroCycleCard';
import CycleOverviewCard, {type OverviewItem} from '../CycleOverviewCard';
import MotivationCard from '../MotivationCard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';

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
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text lookups ('Aujourd’hui', 'Phase menstruelle', 'Fenêtre
  // fertile', 'Aperçu de ton cycle', 'Voir plus', etc.) were written against
  // the French default. Pinning French here preserves every test's original
  // intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
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
    // Material 3 migration: the label is now an AwaText, so the first match is the composite; the host Text (last match) carries the resolved style.
    const title = renderer.root.findAll(node => node.props.children === 'Aujourd’hui').slice(-1)[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(flattenStyle(title.props.style).color).toBe('#4A2E37');
  });

  it.each([
    ['menstruation', 2, 'Phase menstruelle', '#DC7B82', 'ocean-calm'],
    ['ovulation', 14, 'Ovulation', '#6D4AE8', 'warm-sand'],
    ['fertile', 12, 'Fenêtre fertile', '#8B6FD1', 'sage-serenity'],
  ] as const)('the ring shows only the cycle day, not the %s phase name, and keeps its fixed phase color', async (phase, day, phaseName, color, otherTheme) => {
    const renderer = await renderWithTheme(<HeroCycleCard currentDay={day} cycleLength={28} phase={phase} />);
    const ringHasPhaseName = () => renderer.root.findAll(node => node.props.accessibilityLabel === phaseName || node.props.children === phaseName).length > 0;
    const ringHasColor = () => renderer.root.findAll(node => flattenStyle(node.props.style)?.backgroundColor === color).length > 0;
    expect(ringHasPhaseName()).toBe(false);
    expect(ringHasColor()).toBe(true);

    await act(async () => {
      await setSelectedThemeId(otherTheme);
    });

    // A fixed cycle-phase identity color: it must NOT follow the palette's own primary.
    expect(ringHasPhaseName()).toBe(false);
    expect(ringHasColor()).toBe(true);
  });
});

describe('CycleOverviewCard — theme reactivity + preserved caller-supplied colors', () => {
  const items: OverviewItem[] = [
    {key: 'next-period', icon: 'water', iconColor: '#DC7B82', iconBg: '#F7D7D6', label: 'Prochaines règles', value: '12 mars', subtitle: 'Dans 3 jours'},
  ];

  it('generic chrome (title) responds to palette changes', async () => {
    const renderer = await renderWithTheme(<CycleOverviewCard items={items} />);
    // Material 3 migration: the label is now an AwaText, so the first match is the composite; the host Text (last match) carries the resolved style.
    const title = renderer.root.findAll(node => node.props.children === 'Aperçu de ton cycle').slice(-1)[0];
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
    const title = renderer.root.findAll(node => node.props.children === 'Prends soin de toi,\n tu es précieuse ✨')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
      await setAppearanceMode('dark');
    });

    expect(flattenStyle(title.props.style).color).toBe('#2F2258');
  });
});

describe('CycleOverviewCard — layout', () => {
  const items: OverviewItem[] = [
    {key: 'next-period', icon: 'water', iconColor: '#DC7B82', iconBg: '#F7D7D6', label: 'Prochaines règles', value: '12 mars', subtitle: 'Dans 3 jours'},
  ];

  it('has no "Voir plus" button', async () => {
    const renderer = await renderWithTheme(<CycleOverviewCard items={items} />);
    expect(renderer.root.findAll(node => node.props.children === 'Voir plus')).toHaveLength(0);
  });

  it('scrolls sideways, with columns wide enough to keep their text on few lines', async () => {
    const renderer = await renderWithTheme(<CycleOverviewCard items={items} />);
    const scroll = renderer.root.findAll(node => node.props.horizontal === true)[0];
    expect(scroll).toBeTruthy();
    const column = renderer.root.findAll(node => flattenStyle(node.props.style)?.width === 128)[0];
    expect(column).toBeTruthy();
  });
});
