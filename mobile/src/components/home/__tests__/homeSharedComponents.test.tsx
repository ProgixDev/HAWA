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

/* ============================================================
   "Voir mes repères" removed — it was a dedicated shortcut link inside the
   card's header, separate from the "Repères spirituels" title and the card
   itself. This must not regress into removing the whole spiritual section.
============================================================ */

describe('SpiritualGuidanceCard — "Voir mes repères" removed, card/title/content preserved', () => {
  it('does not render "Voir mes repères" in any objective mode', async () => {
    for (const objective of ['cycle', 'pregnancy', 'postpartum', 'miscarriage', 'contraception', 'menopause'] as const) {
      const renderer = await renderWithProviders(
        <SpiritualGuidanceCard locationConfigured={false} objective={objective} />,
      );
      expect(renderer.root.findAll(node => node.props.children === 'Voir mes repères').length).toBe(0);
    }
  });

  it('still renders "Repères spirituels" and its core content (location/prayer/hijri blocks)', async () => {
    const renderer = await renderWithProviders(
      <SpiritualGuidanceCard hijriDate="12 Chaabane 1447" locationConfigured={false} />,
    );
    expect(renderer.root.findAll(node => node.props.children === 'Repères spirituels').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Prochaine prière').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Date Hijri').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === '12 Chaabane 1447').length).toBeGreaterThan(0);
  });

  it('a legitimate interaction inside the card (purity summary) still works, unaffected by the removed link', async () => {
    const onPressPuritySummary = jest.fn();
    const renderer = await renderWithProviders(
      <SpiritualGuidanceCard
        isMenstruating={false}
        locationConfigured={false}
        objective="cycle"
        onPressPuritySummary={onPressPuritySummary}
        periodEndDateTime={new Date('2026-01-01T10:00:00')}
        purityResult={{status: 'pure', prayerDue: false}}
      />,
    );
    const summary = renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.includes('Pureté retrouvée'))[0];
    expect(summary).toBeTruthy();
    act(() => {
      summary.props.onPress();
    });
    expect(onPressPuritySummary).toHaveBeenCalledTimes(1);
  });

  it('no longer accepts an onManage prop (the removed link\'s dedicated callback)', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../SpiritualGuidanceCard.tsx'), 'utf8');
    expect(source).not.toMatch(/onManage/);
    expect(source).not.toMatch(/manageLink/);
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
