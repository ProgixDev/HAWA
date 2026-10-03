import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import HijriMonthGrid from '../../components/hijri/HijriMonthGrid';
import PostpartumDashboard from '../../components/postpartum/PostpartumDashboard';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {confirmDelivery} from '../../state/postpartumPreferences';
import {reopenPostpartumLochiaTracking, savePostpartumLochiaEntry} from '../../state/postpartumLochiaStore';
import {
  nifasReferenceApproachingHeadline,
  NIFAS_REFERENCE_CONFIG_VERSION,
  NIFAS_REFERENCE_DAYS,
  nifasReferenceReachedHeadline,
  NIFAS_WARNING_DAYS,
} from '../../config/nifasReminderConfig';
import {getNifasReminderStatus} from '../../utils/postpartumTrackingUtils';
import {addDays} from '../../utils/cycleMath';
import {hijriMonthStart} from '../../utils/hijriCalendar';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7F.1 — the two explicitly deferred gaps from Phase 7F: WEEK_DAYS
// (now localizedWeekDays(), unit-tested thoroughly in
// localizedWeekDays.test.ts; here: representative integration consumers)
// and the two Nifas reference headlines (now functions reading the live
// app language, never a module-load-time snapshot).

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function settle() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

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

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PostpartumDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const modalVisible = (renderer: ReactTestRenderer.ReactTestRenderer): boolean =>
  renderer.root.findAllByType(Modal).some(modal => modal.props.visible === true);
const deliveredForDay = (day: number) => confirmDelivery(addDays(new Date(), -(day - 1)));

beforeEach(async () => {
  await resetAppLanguageForTests();
  resetPremiumStateForTests();
  setSpiritualMarkersEnabled(true);
  await reopenPostpartumLochiaTracking();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 6/8 — a representative WEEK_DAYS consumer (HijriMonthGrid): labels, selection and runtime switch', () => {
  const today = new Date(2026, 8, 15);
  const monthStart = hijriMonthStart(today);
  const selectedDate = today;

  it('French: Monday-first French weekday abbreviations render', () => {
    const renderer = renderDirect(
      <HijriMonthGrid direction={1} monthLabel="Septembre 2026" monthStart={monthStart} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={selectedDate} today={today} />,
    );
    expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']));
  });

  it('English: the same grid shows English weekday abbreviations, no French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <HijriMonthGrid direction={1} monthLabel="September 2026" monthStart={monthStart} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={selectedDate} today={today} />,
    );
    const texts = textsOf(renderer);
    expect(texts).toEqual(expect.arrayContaining(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']));
    expect(texts).not.toContain('Lun');
  });

  it('TEST 6 — the selected day (accessibilityState.selected) is unaffected by a language switch', async () => {
    const renderer = renderDirect(
      <HijriMonthGrid direction={1} monthLabel="Septembre 2026" monthStart={monthStart} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={selectedDate} today={today} />,
    );
    const selectedLabelsBefore = new Set(
      renderer.root
        .findAll(node => node.props.accessibilityState?.selected === true && typeof node.props.accessibilityLabel === 'string')
        .map(node => node.props.accessibilityLabel),
    );
    expect(selectedLabelsBefore.size).toBe(1);
    const [selectedLabelBefore] = [...selectedLabelsBefore];

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    const selectedLabelsAfter = new Set(
      renderer.root
        .findAll(node => node.props.accessibilityState?.selected === true && typeof node.props.accessibilityLabel === 'string')
        .map(node => node.props.accessibilityLabel),
    );
    expect(selectedLabelsAfter.size).toBe(1);
    // Same underlying day is still selected — only the weekday-row text differs.
    expect([...selectedLabelsAfter][0].split(',')[0]).toBe(selectedLabelBefore.split(',')[0]);
  });

  it('TEST 5/16 — a runtime FR → EN switch updates the weekday row without remounting', async () => {
    const renderer = renderDirect(
      <HijriMonthGrid direction={1} monthLabel="Septembre 2026" monthStart={monthStart} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={selectedDate} today={today} />,
    );
    expect(textsOf(renderer)).toContain('Lun');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Mon');
    expect(textsOf(renderer)).not.toContain('Lun');
  });
});

describe('TEST 9/10/11/12 — the two Nifas reference headlines follow the app language', () => {
  it('French: both headlines render their exact original wording', () => {
    expect(nifasReferenceReachedHeadline()).toBe(`Le repère des ${NIFAS_REFERENCE_DAYS} jours retenu par AWA est atteint`);
    expect(nifasReferenceApproachingHeadline()).toBe(`Le repère des ${NIFAS_REFERENCE_DAYS} jours retenu par AWA approche`);
  });

  it('English: both headlines translate, preserving the "AWA-retained marker" meaning', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    expect(nifasReferenceReachedHeadline()).toBe(`The ${NIFAS_REFERENCE_DAYS}-day marker used by AWA has been reached`);
    expect(nifasReferenceApproachingHeadline()).toBe(`The ${NIFAS_REFERENCE_DAYS}-day marker used by AWA is approaching`);
  });
});

describe('TEST 13/14 — PostpartumDashboard (completion popup) and SpiritualGuidanceCard (banner) render the localized headline', () => {
  it('French: at the reference threshold with active lochia, the banner and the popup show the same French headline', async () => {
    await deliveredForDay(NIFAS_REFERENCE_DAYS);
    await savePostpartumLochiaEntry(new Date().toLocaleDateString('en-CA'), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: []});
    const renderer = await renderDashboard();

    expect(modalVisible(renderer)).toBe(true);
    const texts = textsOf(renderer);
    expect(texts).toContain(nifasReferenceReachedHeadline());
    expect(texts).toContain(`${nifasReferenceReachedHeadline()}.`);
  });

  it('English: the same banner + popup pairing renders the English headline', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await deliveredForDay(NIFAS_WARNING_DAYS);
    const renderer = await renderDashboard();

    const texts = textsOf(renderer);
    expect(texts).toContain(`${nifasReferenceApproachingHeadline()}.`);
    expect(texts.some(text => text.includes('Le repère'))).toBe(false);
  });
});

describe('TEST 15 — a runtime FR → EN switch updates the visible Nifas headline', () => {
  it('the mounted PostpartumDashboard re-renders the English headline after changeLanguage', async () => {
    await deliveredForDay(NIFAS_WARNING_DAYS);
    const renderer = await renderDashboard();
    expect(textsOf(renderer)).toContain(`${nifasReferenceApproachingHeadline()}.`);

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain(`${nifasReferenceApproachingHeadline()}.`);
    expect(textsOf(renderer).some(text => text.includes('Le repère'))).toBe(false);
  });
});

describe('TEST 16/17/18 — Nifas business logic, reminder scheduling and notification IDs are unaffected', () => {
  it('TEST 16 — getNifasReminderStatus thresholds (35/40) stay numerically identical regardless of language', async () => {
    expect(NIFAS_WARNING_DAYS).toBe(35);
    expect(NIFAS_REFERENCE_DAYS).toBe(40);
    const before = getNifasReminderStatus({postpartumDay: NIFAS_REFERENCE_DAYS, lochiaEnded: false});

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const after = getNifasReminderStatus({postpartumDay: NIFAS_REFERENCE_DAYS, lochiaEnded: false});

    expect(after).toBe(before);
    expect(after).toBe('reference_reached');
  });

  it('TEST 17 — NIFAS_REFERENCE_CONFIG_VERSION (the reschedule-trigger version) is untouched by this cleanup', () => {
    expect(NIFAS_REFERENCE_CONFIG_VERSION).toBe(3);
  });

  it('TEST 18 — the scheduled-notification copy path (internalContent) is a separate, already-localized i18n.t() implementation, not driven by these two headline functions', async () => {
    // postpartumNifasReminderScheduling.ts's own notification title/body
    // never imports nifasReferenceReachedHeadline/ApproachingHeadline at
    // all (confirmed during the Phase 7F.1 audit) — it already calls
        // i18n.t('notifications.postpartum.nifas.*') directly (Phase 4).
    expect(i18n.t('notifications.postpartum.nifas.reachedTitle')).not.toBe('notifications.postpartum.nifas.reachedTitle');
    expect(i18n.t('notifications.postpartum.nifas.approachingTitle')).not.toBe('notifications.postpartum.nifas.approachingTitle');
  });
});
