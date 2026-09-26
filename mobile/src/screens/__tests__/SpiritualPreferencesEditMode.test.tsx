import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import SpiritualPreferencesScreen from '../SpiritualPreferencesScreen';
import {
  getSpiritualMarkersEnabled,
  setActiveObjective,
  setSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';

// H1 - every post-onboarding entry point (Prayer times x2, Hijri calendar,
// Summary) opens the spiritual-markers screen in EDIT mode: prefilled, saves
// only the toggle, goes back - it never replays Location / objective onboarding.
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

function renderScreen(params: {mode?: 'onboarding' | 'edit'} | undefined) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), push: jest.fn(), replace: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <SpiritualPreferencesScreen
            navigation={navigation as never}
            route={{key: 'sp', name: 'SpiritualPreferences', params} as never}
          />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, navigation};
}

const pressByText = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const node = renderer.root.find(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(text => textOf(text) === label),
  );
  act(() => {
    node.props.onPress();
  });
};
const checked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find(
    n => n.props.accessibilityRole === 'radio' && n.findAllByType(Text).some(text => textOf(text) === label),
  ).props.accessibilityState.checked;

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('SpiritualPreferences - edit mode', () => {
  it('prefills the saved answer, is labelled "Enregistrer", saves ONLY the toggle and goes back', async () => {
    await setActiveObjective('cycle');
    setSpiritualMarkersEnabled(true);
    const {renderer, navigation} = renderScreen({mode: 'edit'});

    expect(checked(renderer, 'Oui, activer')).toBe(true);
    expect(checked(renderer, 'Non, pas maintenant')).toBe(false);
    const texts = renderer.root.findAllByType(Text).map(textOf);
    expect(texts).toContain('Enregistrer');
    expect(texts).not.toContain('Suivant');

    pressByText(renderer, 'Non, pas maintenant');
    pressByText(renderer, 'Enregistrer');

    expect(getSpiritualMarkersEnabled()).toBe(false);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it.each(['cycle', 'conceive', 'pregnancy', 'postpartum', 'loss', 'contraception', 'irregular', 'menopause'] as const)(
    'never continues into onboarding for the %s objective (Location / objective setup / Security / Summary / Auth)',
    async objective => {
      await setActiveObjective(objective);
      setSpiritualMarkersEnabled(false);
      const {renderer, navigation} = renderScreen({mode: 'edit'});
      pressByText(renderer, 'Oui, activer');
      pressByText(renderer, 'Enregistrer');

      expect(getSpiritualMarkersEnabled()).toBe(true);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(navigation.navigate).not.toHaveBeenCalled();
    },
  );
});

describe('SpiritualPreferences - onboarding mode is unchanged', () => {
  it('is labelled "Suivant" and continues to Location', async () => {
    await setActiveObjective('cycle');
    setSpiritualMarkersEnabled(true);
    const {renderer, navigation} = renderScreen(undefined);
    expect(renderer.root.findAllByType(Text).map(textOf)).toContain('Suivant');
    pressByText(renderer, 'Oui, activer');
    pressByText(renderer, 'Suivant');
    expect(navigation.navigate).toHaveBeenCalledWith('Location');
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});

describe('SpiritualPreferences - every caller is classified', () => {
  const srcRoot = path.resolve(__dirname, '..', '..');
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return entry.name === '__tests__' ? [] : walk(full);
      }
      return /\.tsx?$/.test(entry.name) ? [full] : [];
    });

  it('only the onboarding chain (NameOnboardingScreen) navigates without mode: "edit"', () => {
    const offenders: string[] = [];
    const callers: string[] = [];
    walk(srcRoot).forEach(file => {
      const source = fs.readFileSync(file, 'utf8');
      const pattern = /(?:navigate|push)\(\s*'SpiritualPreferences'([^)]*)\)/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source))) {
        const name = path.basename(file);
        callers.push(name);
        const isEdit = /mode:\s*'edit'/.test(match[1]);
        if (!isEdit && name !== 'NameOnboardingScreen.tsx') {
          offenders.push(name);
        }
      }
    });
    expect(offenders).toEqual([]);
    // The post-onboarding entry points are really covered by this guard.
    expect(callers).toEqual(expect.arrayContaining(['PrayerTimesScreen.tsx', 'HijriCalendarScreen.tsx', 'SummaryScreen.tsx', 'NameOnboardingScreen.tsx']));
  });
});
