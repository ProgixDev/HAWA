import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {readStoredString} from '../../../testUtils/structuredStorage';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ContraceptionJournalEntryScreen from '../ContraceptionJournalEntryScreen';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';
import {
  clearContraceptionJournalField,
  getContraceptionJournalEntry,
  hydrateContraceptionJournal,
  saveContraceptionJournalField,
} from '../../../state/contraceptionJournalStore';
import {lockIntimacy, unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';

const STORAGE_KEY = '@hawa/contraception-journal/v1';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 760},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

async function renderJournal(category: 'feelings' | 'notes' | 'intake') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category}} name="ContraceptionJournalEntry">
                {() => <ContraceptionJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('ContraceptionJournalEntry');
  });
  // let the screen's own hydration effect settle
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, value: string) =>
  texts(renderer).some(text => text.includes(value));

const chip = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'checkbox')[0];

const isChecked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  chip(renderer, label).props.accessibilityState.checked === true;

const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const button = renderer.root.find(
    node => node.props.accessibilityLabel === 'Enregistrer' && typeof node.props.onPress === 'function',
  );
  await act(async () => {
    await button.props.onPress();
  });
};

const persisted = async () => {
  const raw = await readStoredString(STORAGE_KEY);
  return raw ? JSON.parse(raw)[todayKey()] : undefined;
};

const GOOD = 'Nausées';
const OTHER = 'Fatigue';

beforeEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await setContraceptionPreferences({method: 'pill'});
  await hydrateContraceptionJournal();
  await clearContraceptionJournalField(todayKey(), 'feelings');
  await clearContraceptionJournalField(todayKey(), 'notes');
  unlockIntimacy();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  lockIntimacy();
});

describe('Contraception journal — Effets ressentis: add / edit / clear', () => {
  it('ADD: selecting feelings and saving persists them', async () => {
    const renderer = await renderJournal('feelings');
    await act(async () => {
      chip(renderer, GOOD).props.onPress();
    });
    await pressSave(renderer);
    expect(getContraceptionJournalEntry(todayKey())?.feelings).toEqual([GOOD]);
  });

  it('EDIT: saved feelings are pre-selected and can be changed', async () => {
    await saveContraceptionJournalField(todayKey(), 'feelings', [GOOD]);
    const renderer = await renderJournal('feelings');
    expect(isChecked(renderer, GOOD)).toBe(true);

    await act(async () => {
      chip(renderer, GOOD).props.onPress();
      chip(renderer, OTHER).props.onPress();
    });
    await pressSave(renderer);
    expect(getContraceptionJournalEntry(todayKey())?.feelings).toEqual([OTHER]);
  });

  it('CLEAR: deselecting everything and saving removes the saved feelings (no error)', async () => {
    await saveContraceptionJournalField(todayKey(), 'feelings', [GOOD]);
    const renderer = await renderJournal('feelings');
    expect(isChecked(renderer, GOOD)).toBe(true);

    await act(async () => {
      chip(renderer, GOOD).props.onPress();
    });
    await pressSave(renderer);

    expect(hasText(renderer, 'Choisis au moins un élément')).toBe(false);
    expect(getContraceptionJournalEntry(todayKey())?.feelings).toBeUndefined();
    expect(await persisted()).toBeUndefined();
  });

  it('nothing selected AND nothing saved: still asks to choose something (unchanged)', async () => {
    const renderer = await renderJournal('feelings');
    await pressSave(renderer);
    expect(hasText(renderer, 'Choisis au moins un élément avant d’enregistrer.')).toBe(true);
    expect(getContraceptionJournalEntry(todayKey())).toBeUndefined();
  });
});

describe('Contraception journal — Notes du jour (encrypted): add / edit / delete', () => {
  it('ADD: a new note is saved and encrypted at rest', async () => {
    const renderer = await renderJournal('notes');
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('SECRET_ADD_NOTE');
    });
    await pressSave(renderer);

    expect(getContraceptionJournalEntry(todayKey())?.notes).toBe('SECRET_ADD_NOTE');
    const stored = await persisted();
    expect(typeof stored.notes).toBe('object');
    expect(JSON.stringify(stored)).not.toContain('SECRET_ADD_NOTE');
  });

  it('EDIT: the saved note is loaded, can be changed, stays encrypted', async () => {
    await saveContraceptionJournalField(todayKey(), 'notes', 'SECRET_OLD_NOTE');
    const renderer = await renderJournal('notes');
    expect(renderer.root.findByType(TextInput).props.value).toBe('SECRET_OLD_NOTE');

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('SECRET_NEW_NOTE');
    });
    await pressSave(renderer);

    expect(getContraceptionJournalEntry(todayKey())?.notes).toBe('SECRET_NEW_NOTE');
    const raw = (await readStoredString(STORAGE_KEY)) as string;
    expect(raw).not.toContain('SECRET_NEW_NOTE');
    expect(raw).not.toContain('SECRET_OLD_NOTE');
    expect((await persisted()).notes.ciphertext).toBeDefined();
  });

  it('DELETE: emptying the field and saving removes the note and its ciphertext', async () => {
    await saveContraceptionJournalField(todayKey(), 'notes', 'SECRET_DELETE_NOTE');
    const renderer = await renderJournal('notes');

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('   ');
    });
    await pressSave(renderer);

    expect(hasText(renderer, 'Ajoute une note avant d’enregistrer.')).toBe(false);
    expect(getContraceptionJournalEntry(todayKey())?.notes).toBeUndefined();
    // No orphan encrypted data: the whole (now empty) entry is gone from storage.
    expect(await persisted()).toBeUndefined();
    expect((await readStoredString(STORAGE_KEY)) ?? '').not.toContain('ciphertext');
  });

  it('DELETE keeps the day\'s feelings intact', async () => {
    await saveContraceptionJournalField(todayKey(), 'feelings', [GOOD]);
    await saveContraceptionJournalField(todayKey(), 'notes', 'SECRET_KEEP_FEELINGS');
    const renderer = await renderJournal('notes');

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('');
    });
    await pressSave(renderer);

    expect(getContraceptionJournalEntry(todayKey())?.notes).toBeUndefined();
    expect(getContraceptionJournalEntry(todayKey())?.feelings).toEqual([GOOD]);
    expect((await persisted()).feelings).toEqual([GOOD]);
  });

  it('empty field AND no saved note: still asks to add a note (unchanged)', async () => {
    const renderer = await renderJournal('notes');
    await pressSave(renderer);
    expect(hasText(renderer, 'Ajoute une note avant d’enregistrer.')).toBe(true);
  });
});

describe('Contraception journal — "Prise du jour" status options', () => {
  const STATUSES = [
    {status: 'taken', label: 'Effectuée', color: '#42A66A', icon: 'check-bold'},
    {status: 'late', label: 'En retard', color: '#C77B2E', icon: 'clock-alert-outline'},
    {status: 'missed', label: 'Oubliée', color: '#D96176', icon: 'alert-outline'},
  ] as const;

  const radio = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
    renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label)[0];

  it.each(STATUSES)('$status: the icon holder is a round 40 dp circle and, selected, a soft tint with a coloured glyph (not a solid fill with a white glyph)', async ({label, color, icon}) => {
    const renderer = await renderJournal('intake');
    const option = radio(renderer, label);
    expect(option).toBeDefined();
    await act(async () => {
      option.props.onPress();
    });
    const selected = radio(renderer, label);
    expect(selected.props.accessibilityState.checked).toBe(true);

    const glyph = selected.findAll(node => node.props.name === icon)[0];
    expect(glyph.props.size).toBe(18);
    expect(glyph.props.color).toBe(color); // never the white glyph of the old solid fill
    const holder = glyph.parent!;
    const style = StyleSheet.flatten(holder.props.style) as {width: number; height: number; borderRadius: number; backgroundColor: string};
    expect([style.width, style.height, style.borderRadius]).toEqual([40, 40, 20]);
    expect(style.backgroundColor).toMatch(/^rgba\(/); // translucent tint of the status colour, not the solid colour
    expect(style.backgroundColor).not.toBe(color);
  });

  it('selection stays exclusive and unchanged: one option checked at a time', async () => {
    const renderer = await renderJournal('intake');
    for (const {label} of STATUSES) {
      await act(async () => {
        radio(renderer, label).props.onPress();
      });
      const checked = STATUSES.filter(({label: other}) => radio(renderer, other).props.accessibilityState.checked === true);
      expect(checked.map(item => item.label)).toEqual([label]);
    }
  });
});

describe('Contraception journal — "Prise du jour": the selected card is one flat, opaque surface', () => {
  const OPTIONS = ['Effectuée', 'En retard', 'Oubliée'];
  const PALETTES = ['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const;
  const MODES = [
    {name: 'light', mode: 'light' as const, trueBlack: false},
    {name: 'dark', mode: 'dark' as const, trueBlack: false},
    {name: 'true black', mode: 'dark' as const, trueBlack: true},
  ];

  afterEach(async () => {
    await setSelectedThemeId('awa-original');
    await setAppearanceMode('light');
    await setTrueBlackEnabled(false);
  });

  // A translucent fill carrying an elevation / shadow shows the shadow through it on Android (a dark rectangle behind the
  // text); the selected card therefore has an opaque fill and no shadow.
  it.each(MODES.flatMap(mode => PALETTES.map(palette => ({...mode, palette}))))(
    '$name / $palette: Effectuée, En retard and Oubliée selected have an opaque background and no shadow or elevation',
    async ({mode, trueBlack, palette}) => {
      await setSelectedThemeId(palette);
      await setAppearanceMode(mode);
      await setTrueBlackEnabled(trueBlack);
      const renderer = await renderJournal('intake');
      for (const label of OPTIONS) {
        await act(async () => {
          renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label)[0].props.onPress();
        });
        const option = renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label && typeof node.type === 'string')[0];
        expect(option.props.accessibilityState.checked).toBe(true);
        const style = StyleSheet.flatten(option.props.style) as {backgroundColor: string; elevation?: number; shadowOpacity?: number};
        expect(style.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/); // opaque (not rgba), whatever the mode
        expect(style.elevation ?? 0).toBe(0);
        expect(style.shadowOpacity ?? 0).toBe(0);
      }
    },
  );
});

