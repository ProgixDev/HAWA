import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import HijriMonthGrid from '../../components/hijri/HijriMonthGrid';
import AwaADeuxPairingScreen from '../awaADeux/AwaADeuxPairingScreen';
import AwaADeuxPendingScreen from '../awaADeux/AwaADeuxPendingScreen';
import {DeleteTrackedDataScreen} from '../BackupUtilityScreens';
import {DeleteAccountScreen} from '../DataPrivacyScreens';
import {TermsOfUseScreen, PrivacyPolicyScreen, TERMS, PRIVACY} from '../LegalDocumentScreen';
import {clearAwaADeuxPartnerName, setAwaADeuxPartnerName} from '../../state/awaADeuxPartnerStore';
import {getDemoPartnerState, stopDemoSharing} from '../../state/awaADeuxDemoStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {hijriMonthStart} from '../../utils/hijriCalendar';
import i18n from '../../i18n';

// Italian integration — screen-level behavior on real mounted screens:
// calendar headers, the AWA Insieme email-only invitation flow, the typed
// destructive-confirmation word (never a hardcoded DELETE) and the legal
// documents (no Italian legal text yet: explicit English body). Italian Library
// articles and pregnancy-week content are covered in PhaseItalianEditorial.test.tsx.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const tr = (key: string, lng: AwaAppLanguage, options: Record<string, unknown> = {}) => i18n.t(key, {lng, ...options}) as string;

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function switchLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  await settle();
}

async function renderInStack(screens: Array<[string, React.ComponentType<never>]>, initial: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={initial} screenOptions={{headerShown: false}}>
              {screens.map(([name, component]) => (
                <Stack.Screen component={component as never} key={name} name={name} />
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

async function renderWithProps(Screen: React.ComponentType<never>, navigation: Record<string, unknown> = {}) {
  const Component = Screen as unknown as React.ComponentType<Record<string, unknown>>;
  const nav = {navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn(), ...navigation};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Component navigation={nav} route={{key: 'test', name: 'test'}} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer, nav};
}

beforeEach(async () => {
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
  stopDemoSharing();
  await clearAwaADeuxPartnerName();
  await switchLanguage('it');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('calendar headers (HijriMonthGrid) follow Italian and switch at runtime', () => {
  const today = new Date(2026, 8, 15);
  const grid = (
    <HijriMonthGrid direction={1} monthLabel="ottobre 2026" monthStart={hijriMonthStart(today)} onNext={jest.fn()} onPrevious={jest.fn()} onSelectDate={jest.fn()} onToday={jest.fn()} selectedDate={today} today={today} />
  );
  const mount = () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>{grid}</AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    return renderer;
  };

  it('Italian: Monday-first Lun…Dom, no French/English/Spanish abbreviations', () => {
    const texts = textsOf(mount());
    expect(texts).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']));
    expect(texts).not.toContain('Jeu'); // French
    expect(texts).not.toContain('Thu'); // English
    expect(texts).not.toContain('Jue'); // Spanish
  });

  it('IT -> FR -> ES -> IT on the same mounted grid', async () => {
    const renderer = mount();
    expect(textsOf(renderer)).toContain('Gio');
    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain('Jeu');
    await switchLanguage('es');
    expect(textsOf(renderer)).toContain('Jue');
    await switchLanguage('it');
    expect(textsOf(renderer)).toContain('Gio');
  });
});

describe('AWA Insieme — email-only invitation flow in Italian', () => {
  const screens: Array<[string, React.ComponentType<never>]> = [
    ['AwaADeuxPairing', AwaADeuxPairingScreen as never],
    ['AwaADeuxPending', AwaADeuxPendingScreen as never],
  ];

  it('Pairing screen shows Italian copy, no PIN/QR/manual code, and the CTA stays disabled until the e-mail is valid', async () => {
    setAwaADeuxPartnerName('Marco');
    const renderer = await renderInStack(screens, 'AwaADeuxPairing');
    const texts = textsOf(renderer);

    expect(texts).toContain(tr('awaADeux.pairing.title', 'it'));
    expect(texts).toContain(tr('awaADeux.pairing.emailLabel', 'it'));
    expect(texts).toContain(tr('awaADeux.pairing.description', 'it', {partner: 'Marco'}));
    expect(texts.join(' ')).not.toMatch(/\bPIN\b|\bQR\b|codice di (abbinamento|associazione)/i);
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(1); // the e-mail field is the only input

    const cta = renderer.root.findAll(node => node.props.accessibilityLabel === tr('awaADeux.pairing.sendCta', 'it') && node.props.accessibilityRole === 'button')[0];
    expect(cta.props.accessibilityState).toEqual({disabled: true});

    const input = renderer.root.findByType(TextInput);
    await act(async () => {
      input.props.onChangeText('marco@');
      input.props.onBlur();
    });
    expect(textsOf(renderer)).toContain(tr('awaADeux.pairing.invalidEmail', 'it'));
  });

  it('a valid e-mail enables "Invia invito" and moves to the Pending step (frontend demo only, no backend)', async () => {
    setAwaADeuxPartnerName('Marco');
    const renderer = await renderInStack(screens, 'AwaADeuxPairing');
    const input = renderer.root.findByType(TextInput);
    await act(async () => {
      input.props.onChangeText('marco@example.com');
    });
    const cta = renderer.root.findAll(node => node.props.accessibilityLabel === tr('awaADeux.pairing.sendCta', 'it') && node.props.accessibilityRole === 'button')[0];
    expect(cta.props.accessibilityState).toEqual({disabled: false});
    await act(async () => {
      cta.props.onPress();
    });
    await settle();
    expect((navRef.getCurrentRoute() as {name: string} | undefined)?.name).toBe('AwaADeuxPending');
    expect(getDemoPartnerState().partnerEmail).toBe('marco@example.com');
    expect(getDemoPartnerState().connectionStatus).toBe('pending');
  });
});

describe('typed destructive confirmation uses the localized word (ELIMINA), never a hardcoded DELETE', () => {
  const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText(value);
    });
  };

  it('DeleteTrackedDataScreen: placeholder is ELIMINA; only ELIMINA validates', async () => {
    const {renderer} = await renderWithProps(DeleteTrackedDataScreen as never);
    expect(renderer.root.findByType(TextInput).props.placeholder).toBe('ELIMINA');
    const valid = tr('backupUtility.delete.validConfirmation', 'it');

    for (const wrong of ['DELETE', 'SUPPRIMER', 'ELIMINAR']) {
      await typeInto(renderer, wrong);
      expect(textsOf(renderer)).not.toContain(valid);
    }
    await typeInto(renderer, 'ELIMINA');
    expect(textsOf(renderer)).toContain(valid);
    expect(textsOf(renderer)).toContain(tr('backupUtility.delete.irreversibleTitle', 'it'));
  });

  it('DeleteAccountScreen: wrong words are rejected with the Italian error; ELIMINA proceeds', async () => {
    const {renderer, nav} = await renderWithProps(DeleteAccountScreen as never);
    const deleteButton = () =>
      renderer.root.findAll(node => node.props.accessibilityLabel === tr('dataPrivacy.deleteAccount.deleteButtonAccessibility', 'it'))[0];

    for (const wrong of ['DELETE', 'SUPPRIMER', 'ELIMINAR']) {
      await typeInto(renderer, wrong);
      await act(async () => {
        await deleteButton().props.onPress();
      });
      expect(nav.reset).not.toHaveBeenCalled();
      expect(textsOf(renderer)).toContain(tr('dataPrivacy.deleteAccount.confirmError', 'it'));
    }

    await typeInto(renderer, 'ELIMINA');
    await act(async () => {
      await deleteButton().props.onPress();
    });
    expect(nav.reset).toHaveBeenCalledTimes(1);
  });
});

describe('legal documents: Italian chrome, explicit English body (no Italian legal text yet), never French or Spanish', () => {
  it.each([
    ['Terms of Use', TermsOfUseScreen, TERMS, 'about.termsOfUse'],
    ['Privacy Policy', PrivacyPolicyScreen, PRIVACY, 'about.privacyPolicy'],
  ] as const)('%s', async (_name, Screen, content, titleKey) => {
    const {renderer} = await renderWithProps(Screen as never);
    const texts = textsOf(renderer);
    expect(texts).toContain(tr(titleKey, 'it')); // Italian screen title
    expect(texts).toContain(tr('legalDocument.provisionalNotice', 'it')); // Italian notice
    expect(texts).toContain(content.en[0].title); // English body
    expect(texts).toContain(content.en[0].body);
    expect(texts).not.toContain(content.fr[0].title);
    expect(texts).not.toContain(content.es[0].title);
  });
});
