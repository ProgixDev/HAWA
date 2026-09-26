import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = '@hawa/contraception-journal/v1';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 760},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

async function renderJournal(category: 'feelings' | 'notes') {
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
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw)[todayKey()] : undefined;
};

const GOOD = 'Nausées';
const OTHER = 'Fatigue';

beforeEach(async () => {
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
    const raw = (await AsyncStorage.getItem(STORAGE_KEY)) as string;
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
    expect((await AsyncStorage.getItem(STORAGE_KEY)) ?? '').not.toContain('ciphertext');
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
