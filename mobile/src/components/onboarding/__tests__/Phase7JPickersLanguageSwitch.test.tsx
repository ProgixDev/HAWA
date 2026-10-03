import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import InlineCalendarPickerModal from '../InlineCalendarPickerModal';
import BirthDatePickerModal from '../BirthDatePickerModal';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// PHASE 7J — TEST 3/4/5 (InlineCalendarPickerModal) and TEST 6/7
// (BirthDatePickerModal): both confirmed by Phase 7I to hardcode French
// weekdays/months/navigation accessibility regardless of app language,
// reachable from ~19 real screens. Fixed via localizedWeekDays()/Intl, never
// a second hardcoded weekday table.

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderCalendarPicker() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={{frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}}}>
        <AwaThemeProvider>
          <InlineCalendarPickerModal onClose={() => {}} onSelect={() => {}} value={new Date(2026, 0, 15)} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

async function renderBirthPicker() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={{frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}}}>
        <AwaThemeProvider>
          <BirthDatePickerModal maximumDate={new Date(2026, 9, 2)} onClose={() => {}} onSelect={() => {}} value={new Date(2000, 5, 15)} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const findByA11y = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];

beforeEach(async () => {
  await resetAppLanguageForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 3 — InlineCalendarPicker weekdays FR -> EN', () => {
  it('French shows Lun/Mar/.../Dim, English shows Mon/Tue/.../Sun', async () => {
    const frRenderer = await renderCalendarPicker();
    expect(textsOf(frRenderer)).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']));

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderCalendarPicker();
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toEqual(expect.arrayContaining(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']));
    expect(enTexts).not.toContain('Lun');
  });
});

describe('TEST 4 — InlineCalendarPicker month label FR -> EN', () => {
  it('January 2026 renders in French, then in English, for the same visible month', async () => {
    const frRenderer = await renderCalendarPicker();
    expect(textsOf(frRenderer).some(text => /janvier 2026/i.test(text))).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderCalendarPicker();
    const enTexts = textsOf(enRenderer);
    expect(enTexts.some(text => /January 2026/i.test(text))).toBe(true);
    expect(enTexts.some(text => /janvier/i.test(text))).toBe(false);
  });
});

describe('TEST 5 — InlineCalendarPicker accessibility FR -> EN', () => {
  it('month navigation accessibility labels translate', async () => {
    const frRenderer = await renderCalendarPicker();
    expect(findByA11y(frRenderer, 'Mois précédent')).toBeTruthy();
    expect(findByA11y(frRenderer, 'Mois suivant')).toBeTruthy();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderCalendarPicker();
    expect(findByA11y(enRenderer, 'Previous month')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Next month')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Mois précédent')).toBeUndefined();
  });
});

describe('TEST 6 — BirthDatePicker month label FR -> EN', () => {
  it('the breadcrumb/stage month name translates via Intl, not a second hardcoded table', async () => {
    const frRenderer = await renderBirthPicker();
    expect(textsOf(frRenderer)).toContain('Choisir l’année');

    // Advance to the month stage via the year list's selected row, then
    // assert the month grid renders in French.
    const yearRow2000 = frRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === '2000',
    )[0];
    await act(async () => {
      yearRow2000.props.onPress();
    });
    await settle();
    expect(textsOf(frRenderer)).toContain('Juin');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderBirthPicker();
    const enYearRow2000 = enRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === '2000',
    )[0];
    await act(async () => {
      enYearRow2000.props.onPress();
    });
    await settle();
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('June');
    expect(enTexts).not.toContain('Juin');
  });
});

describe('TEST 7 — BirthDatePicker accessibility FR -> EN', () => {
  it('the breadcrumb "back to month" accessibility label translates', async () => {
    const frRenderer = await renderBirthPicker();
    const yearRow = frRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === '2000',
    )[0];
    await act(async () => {
      yearRow.props.onPress();
    });
    await settle();
    const dayJune = frRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === 'Juin',
    )[0];
    await act(async () => {
      dayJune.props.onPress();
    });
    await settle();
    expect(findByA11y(frRenderer, 'Revenir au mois de Juin')).toBeTruthy();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderBirthPicker();
    const enYearRow = enRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === '2000',
    )[0];
    await act(async () => {
      enYearRow.props.onPress();
    });
    await settle();
    const enDayJune = enRenderer.root.findAll(
      node => node.type === Pressable && node.props.accessibilityLabel === 'June',
    )[0];
    await act(async () => {
      enDayJune.props.onPress();
    });
    await settle();
    expect(findByA11y(enRenderer, 'Back to June')).toBeTruthy();
    expect(findByA11y(enRenderer, 'Revenir au mois de Juin')).toBeUndefined();
  });
});
