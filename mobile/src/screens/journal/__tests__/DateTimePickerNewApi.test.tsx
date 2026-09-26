import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Platform, Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import JournalTemperatureScreen from '../JournalTemperatureScreen';
import JournalLHTestScreen from '../JournalLHTestScreen';

// DateTimePicker `onChange` is deprecated (9.x): the Temperature and Test LH
// screens (2 pickers each: the Android native clock and the iOS spinner) now use
// `onValueChange` (a value was picked) and `onDismiss` (closed without picking).
// The DateTimePicker is mocked globally (jest.setup.js) as a no-op component, so
// its props are exercised directly.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const SCREENS = [
  {name: 'Température basale', Screen: JournalTemperatureScreen, openLabel: 'Choisir l’heure de mesure'},
  {name: 'Test LH', Screen: JournalLHTestScreen, openLabel: 'Choisir l’heure du test'},
] as const;

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderScreen(Screen: React.ComponentType) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <Screen />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const pickers = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(DateTimePicker);

async function openPicker(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
  await flush();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe.each(SCREENS)('$name - Android native clock', ({Screen, openLabel}) => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('the picker receives onValueChange + onDismiss and NO deprecated onChange', async () => {
    const renderer = await renderScreen(Screen);
    await openPicker(renderer, openLabel);
    const [picker] = pickers(renderer);
    expect(picker).toBeDefined();
    expect(picker.props.display).toBe('clock');
    expect(typeof picker.props.onValueChange).toBe('function');
    expect(typeof picker.props.onDismiss).toBe('function');
    expect(picker.props.onChange).toBeUndefined();
  });

  it('value change: the picked time is applied and the picker closes', async () => {
    const renderer = await renderScreen(Screen);
    await openPicker(renderer, openLabel);
    expect(allTexts(renderer)).not.toContain('06:45');

    await act(async () => {
      pickers(renderer)[0].props.onValueChange({type: 'set', nativeEvent: {}}, new Date(2026, 8, 25, 6, 45));
    });
    await flush();

    expect(allTexts(renderer)).toContain('06:45');
    expect(pickers(renderer)).toHaveLength(0);
  });

  it('dismiss: the picker closes and NO value is applied', async () => {
    const renderer = await renderScreen(Screen);
    await openPicker(renderer, openLabel);
    const before = allTexts(renderer);

    await act(async () => {
      pickers(renderer)[0].props.onDismiss();
    });
    await flush();

    expect(pickers(renderer)).toHaveLength(0);
    // Nothing picked: no time appeared (the current time shown in the picker is not applied).
    const times = (texts: string[]) => texts.filter(text => /^\d{2}:\d{2}$/.test(text));
    times(allTexts(renderer)).forEach(time => expect(times(before)).toContain(time)); // nothing new appeared
  });

  it('a second pick after a dismissal still works (the picker can be reopened)', async () => {
    const renderer = await renderScreen(Screen);
    await openPicker(renderer, openLabel);
    await act(async () => {
      pickers(renderer)[0].props.onDismiss();
    });
    await openPicker(renderer, openLabel);
    await act(async () => {
      pickers(renderer)[0].props.onValueChange({type: 'set', nativeEvent: {}}, new Date(2026, 8, 25, 7, 5));
    });
    await flush();
    expect(allTexts(renderer)).toContain('07:05');
  });
});

describe.each(SCREENS)('$name - iOS spinner', ({Screen, openLabel}) => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('the spinner receives onValueChange and NO deprecated onChange; a spin updates the preview and Confirmer applies it', async () => {
    const renderer = await renderScreen(Screen);
    await openPicker(renderer, openLabel);
    const spinner = pickers(renderer).find(node => node.props.display === 'spinner');
    expect(spinner).toBeDefined();
    expect(typeof spinner!.props.onValueChange).toBe('function');
    expect(spinner!.props.onChange).toBeUndefined();

    await act(async () => {
      spinner!.props.onValueChange({type: 'set', nativeEvent: {}}, new Date(2026, 8, 25, 8, 20));
    });
    await flush();
    expect(allTexts(renderer)).toContain('08:20'); // live preview

    const confirm = renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Confirmer l’heure');
    await act(async () => {
      await confirm!.props.onPress();
    });
    await flush();
    expect(allTexts(renderer).filter(text => text === '08:20').length).toBeGreaterThan(0);
  });
});

describe('no DateTimePicker in the source still receives the deprecated `onChange`', () => {
  const srcRoot = path.resolve(__dirname, '..', '..', '..');
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {return entry.name === '__tests__' ? [] : walk(full);}
      return /\.tsx$/.test(entry.name) ? [full] : [];
    });

  it('every <DateTimePicker …/> element uses the current API', () => {
    const offenders: string[] = [];
    let total = 0;
    walk(srcRoot).forEach(file => {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<DateTimePicker\b/g)) {
        total += 1;
        const start = match.index as number;
        const block = source.slice(start, source.indexOf('/>', start));
        if (/\bonChange\s*=/.test(block)) {offenders.push(path.relative(srcRoot, file));}
      }
    });
    expect(total).toBeGreaterThanOrEqual(28);
    expect(offenders).toEqual([]);
  });
});
