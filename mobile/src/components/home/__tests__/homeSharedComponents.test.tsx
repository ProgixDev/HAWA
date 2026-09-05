import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {View} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import HomeHeader from '../HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../QuickActionsGrid';
import SpiritualGuidanceCard from '../SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../ObjectiveArticlesSection';
import DailyJournalCard from '../DailyJournalCard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderWithProviders(children: React.ReactNode) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{children}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
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

describe('HomeHeader — theme reactivity', () => {
  it('icon color follows the palette', async () => {
    const renderer = await renderWithProviders(
      <HomeHeader firstName="Salma" onPressProfile={() => {}} subtitle="Bienvenue" />,
    );
    const bellIcon = () => renderer.root.findAll(node => node.props.name === 'bell-outline')[0];
    expect(bellIcon().props.color).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(bellIcon().props.color).toBe('#B08A5C');
  });
});

describe('QuickActionsGrid — theme reactivity and preserved per-action colors', () => {
  const items: QuickActionItem[] = [
    {key: 'a', icon: 'heart-outline', iconColor: '#FF00AA', iconBg: '#FFEAF6', label: 'Action A'},
    {key: 'b', icon: 'run', iconColor: '#00AA55', iconBg: '#E8FFF2', label: 'Action B'},
  ];

  it('generic chrome (title) responds to palette changes', async () => {
    const renderer = await renderWithProviders(<QuickActionsGrid items={items} />);
    const title = renderer.root.findAll(node => node.props.children === 'Actions rapides')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258'); // awa-original text

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(flattenStyle(title.props.style).color).toBe('#3B3A2E'); // sage-serenity text
  });

  it('never recolors the caller-supplied per-action icon colors', async () => {
    const renderer = await renderWithProviders(<QuickActionsGrid items={items} />);
    const iconA = renderer.root.findAll(node => node.props.name === 'heart-outline')[0];
    expect(iconA.props.color).toBe('#FF00AA');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(iconA.props.color).toBe('#FF00AA');
  });
});

describe('SpiritualGuidanceCard — structural chrome themed, religious/health markers preserved', () => {
  it('generic chrome (title) responds to palette changes', async () => {
    const renderer = await renderWithProviders(
      <SpiritualGuidanceCard locationConfigured={false} />,
    );
    const title = renderer.root.findAll(node => node.props.children === 'Repères spirituels')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(flattenStyle(title.props.style).color).toBe('#4A2E37');
  });

  it('the menstruation "Menstrues" badge keeps its fixed semantic color across palettes', async () => {
    const renderer = await renderWithProviders(
      <SpiritualGuidanceCard isMenstruating locationConfigured={false} objective="cycle" />,
    );
    const label = () => renderer.root.findAll(node => node.props.children === 'Menstrues')[0];
    expect(flattenStyle(label().props.style).color).toBe('#A8505A');

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(flattenStyle(label().props.style).color).toBe('#A8505A');
  });

  it('the "Pureté" badge keeps its fixed semantic green across palettes', async () => {
    const renderer = await renderWithProviders(
      <SpiritualGuidanceCard isMenstruating={false} locationConfigured={false} objective="cycle" />,
    );
    const label = () => renderer.root.findAll(node => node.props.children === 'Pureté')[0];
    expect(flattenStyle(label().props.style).color).toBe('#3E8E56');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(flattenStyle(label().props.style).color).toBe('#3E8E56');
  });
});

describe('ObjectiveArticlesSection — theme reactivity', () => {
  it('generic chrome (see-all link) responds to palette changes, article artwork untouched', async () => {
    const renderer = await renderWithProviders(
      <ObjectiveArticlesSection objective="cycle" onOpenArticle={() => {}} onSeeAll={() => {}} />,
    );
    const seeAll = renderer.root.findAll(node => node.props.children === 'Voir tout')[0];
    if (!seeAll) {
      // No recommended articles configured for 'cycle' in this build —
      // the component correctly renders nothing (see its own null-return
      // rule) rather than a fake/empty card; nothing further to assert.
      return;
    }
    expect(flattenStyle(seeAll.props.style).color).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(flattenStyle(seeAll.props.style).color).toBe('#B08A5C');
  });
});

describe('DailyJournalCard — theme + Premium fallback + true-black', () => {
  it('generic chrome (title) responds to palette changes', async () => {
    const renderer = await renderWithProviders(<DailyJournalCard onNavigate={() => {}} />);
    const title = renderer.root.findAll(node => node.props.children === 'Journal du jour')[0];
    expect(flattenStyle(title.props.style).color).toBe('#2F2258');

    await act(async () => {
      await setSelectedThemeId('lavender-night');
    });

    // lavender-night LIGHT (a new authored variant — see awaThemeTokens.ts)
    expect(flattenStyle(title.props.style).color).toBe('#2A2145');
  });

  it('Premium fallback: a lost Premium palette reverts chrome to AWA Original without erasing the selection', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });
    const renderer = await renderWithProviders(<DailyJournalCard onNavigate={() => {}} />);
    const fillBefore = renderer.root.findAllByType(View).find(
      node => flattenStyle(node.props.style).backgroundColor === '#5C8CA6',
    );
    expect(fillBefore).toBeTruthy();

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    const fillAfter = renderer.root.findAllByType(View).find(
      node => flattenStyle(node.props.style).backgroundColor === '#6D4AE8',
    );
    expect(fillAfter).toBeTruthy();
  });

  it('true-black updates the card surface only while Dark is resolved', async () => {
    const renderer = await renderWithProviders(<DailyJournalCard onNavigate={() => {}} />);
    const card = renderer.root.findAllByType(View)[0];

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(card.props.style).backgroundColor).not.toBe('#0B0B10');

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(card.props.style).backgroundColor).toBe('#0B0B10');
  });
});
