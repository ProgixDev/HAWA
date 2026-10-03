import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Linking, Modal, Share, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Reanimated from 'react-native-reanimated';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme, withAlpha} from '../../../theme/awaThemeTokens';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import {DEMO_PAIRING_CODE} from '../awaADeuxDemo';
import {emailSubject, invitationMessage, buildMailtoUrl, buildShareTargetUrl} from '../awaADeuxInvitation';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// "Partager l'invitation": a themed bottom sheet with the invitation card, four app
// shortcuts, "Copier le texte" and "Plus d'options". Frontend only, demo code.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});
const reducedMotion = Reanimated.useReducedMotion as unknown as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const BOTTOM_INSET = 24;
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: BOTTOM_INSET}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderPairing() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxPairingScreen as never} name="AwaADeuxPairing" />
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

const press = async (root: ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance, label: string) => {
  const node = ('root' in root ? root.root : root).findAll(
    item => item.props.accessibilityLabel === label && item.props.accessibilityRole === 'button' && typeof item.props.onPress === 'function',
  ).pop();
  expect(node).toBeDefined();
  await act(async () => {
    await node!.props.onPress();
  });
  await settle();
};
const sheetModal = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Modal).find(modal => modal.props.visible === true);
const openSheet = async () => {
  const renderer = await renderPairing();
  await press(renderer, 'Partager');
  return {renderer, modal: sheetModal(renderer)!};
};
const findText = (root: ReactTestRenderer.ReactTestInstance, value: string) => root.findAllByType(Text).find(node => textOf(node) === value)!;
const sheetView = (modal: ReactTestRenderer.ReactTestInstance) =>
  modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderTopLeftRadius === 30)[0];

beforeEach(async () => {
  jest.restoreAllMocks();
  reducedMotion.mockReturnValue(true);
  (Linking.openURL as jest.Mock).mockClear?.();
  (Share.share as jest.Mock).mockClear?.();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Opening and content', () => {
  it('"Partager" opens the "Partager l’invitation" sheet with the exact invitation message', async () => {
    const {modal} = await openSheet();
    expect(findText(modal, 'Partager l’invitation')).toBeDefined();
    const texts = modal.findAllByType(Text).map(textOf);
    expect(texts).toContain('Rejoins-moi sur AWA à deux 💜');
    expect(texts).toContain('Télécharge l’application AWA !');
    // "Utilise ce code : " + the emphasized code + "\npour te connecter et m’accompagner."
    const line = modal.findAllByType(Text).find(node => textOf(node) === 'Utilise ce code : \npour te connecter et m’accompagner.')!;
    expect(line).toBeDefined();
    expect(invitationMessage()).toBe('Rejoins-moi sur AWA à deux 💜\n\nUtilise ce code : AWA-7K4P9\npour te connecter et m’accompagner.\n\nTélécharge l’application AWA !');
  });

  it('AWA-7K4P9 is visually emphasized: bold, in the theme accent color', async () => {
    const {modal} = await openSheet();
    const code = findText(modal, DEMO_PAIRING_CODE);
    const style = flat(code.props.style);
    expect(style.fontWeight).toBe('800');
    expect(style.color).toBe(resolveAwaTheme('awa-original', false, false).colors.accent);
  });

  it('the four shortcuts are in one row, in order, with equal cells and labels', async () => {
    const {modal} = await openSheet();
    const labels = ['WhatsApp', 'Messages', 'Instagram', 'Gmail'];
    const buttons = labels.map(label => modal.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0]);
    buttons.forEach(button => expect(button).toBeDefined());
    labels.forEach(label => expect(findText(modal, label)).toBeDefined());
    const row = modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).flexDirection === 'row' && flat(node.props?.style).justifyContent === 'space-between' && flat(node.props?.style).marginTop === 18)[0];
    expect(row).toBeDefined();
    const cells = row.children.filter(child => typeof child !== 'string') as ReactTestRenderer.ReactTestInstance[];
    expect(cells).toHaveLength(4);
    cells.forEach(cell => expect(flat(cell.props.style).flex).toBe(1)); // equal spacing
    modal.findAllByType(Text).filter(node => labels.includes(textOf(node))).forEach(node => expect(node.props.numberOfLines).toBe(1));
  });

  it('the second row has "Copier le texte" and "Plus d’options"', async () => {
    const {modal} = await openSheet();
    expect(findText(modal, 'Copier le texte')).toBeDefined();
    expect(findText(modal, 'Plus d’options')).toBeDefined();
    const icons = modal.findAll(node => typeof node.props.name === 'string').map(node => node.props.name);
    expect(icons).toEqual(expect.arrayContaining(['content-copy', 'dots-horizontal', 'whatsapp', 'message-text-outline', 'instagram', 'gmail', 'close']));
  });

  it('is a compact bottom sheet: anchored to the bottom, large rounded top corners, drag handle, bottom safe area', async () => {
    const {modal} = await openSheet();
    const root = modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).justifyContent === 'flex-end' && flat(node.props?.style).flex === 1)[0];
    expect(root).toBeDefined();
    const sheet = flat(sheetView(modal).props.style);
    expect(sheet.borderTopRightRadius).toBe(30);
    expect(sheet.maxHeight).toBe('92%'); // never full screen
    expect(sheet.paddingBottom).toBe(Math.max(BOTTOM_INSET, 16) + 12);
    const handle = modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).width === 42 && flat(node.props?.style).height === 5)[0];
    expect(handle).toBeDefined();
  });
});

describe('Actions', () => {
  it('WhatsApp opens its own compose link with the invitation', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, 'WhatsApp');
    expect(open).toHaveBeenCalledWith(`whatsapp://send?text=${encodeURIComponent(invitationMessage())}`);
    expect(share).not.toHaveBeenCalled();
  });

  it('WhatsApp not installed → the system share sheet instead', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no app'));
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, 'WhatsApp');
    expect(share).toHaveBeenCalledWith({message: invitationMessage()});
  });

  it('Messages opens the SMS composer; Gmail opens the mail composer with subject and body', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const {modal} = await openSheet();
    await press(modal, 'Messages');
    expect((open.mock.calls[0][0] as string).startsWith('sms:')).toBe(true);
    expect(decodeURIComponent(open.mock.calls[0][0] as string)).toContain(DEMO_PAIRING_CODE);
    await press(modal, 'Gmail');
    expect(open.mock.calls[1][0]).toBe(buildMailtoUrl('', emailSubject(), invitationMessage()));
    expect(buildShareTargetUrl('sms', 'ios')).toContain('sms:&body=');
    expect(buildShareTargetUrl('sms', 'android')).toContain('sms:?body=');
  });

  it('Instagram cannot pre-fill a text: it opens the system share sheet directly', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, 'Instagram');
    expect(open).not.toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith({message: invitationMessage()});
    expect(buildShareTargetUrl('instagram')).toBeNull();
  });

  it('"Plus d’options" opens the native share sheet with the complete invitation', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, 'Plus d’options');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({message: invitationMessage()});
  });

  it('there is no clipboard package: "Copier le texte" opens the share sheet (which offers Copier) and never claims "Invitation copiée"', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {renderer, modal} = await openSheet();
    await press(modal, 'Copier le texte');
    expect(share).toHaveBeenCalledWith({message: invitationMessage()});
    expect(renderer.root.findAllByType(Text).map(textOf)).not.toContain('Invitation copiée');
    const pkg = fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf8');
    expect(pkg).not.toMatch(/clipboard/i);
  });

  it('a share sheet that cannot open shows a message instead of failing', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no share'));
    const {modal} = await openSheet();
    await press(modal, 'Plus d’options');
    expect(modal.findAllByType(Text).map(textOf)).toContain('Impossible d’ouvrir le partage pour le moment.');
  });
});

describe('Closing', () => {
  it('X closes the sheet (reduced motion: immediately)', async () => {
    const {renderer, modal} = await openSheet();
    await press(modal, 'Fermer');
    expect(sheetModal(renderer)).toBeUndefined();
  });

  it('Android Back and the backdrop close it too', async () => {
    const {renderer, modal} = await openSheet();
    await act(async () => {
      modal.props.onRequestClose();
    });
    expect(sheetModal(renderer)).toBeUndefined();
    await press(renderer, 'Partager');
    await press(sheetModal(renderer)!, 'Fermer');
    expect(sheetModal(renderer)).toBeUndefined();
  });

  it('reopening replays a fresh sheet', async () => {
    const {renderer, modal} = await openSheet();
    await press(modal, 'Fermer');
    await press(renderer, 'Partager');
    expect(sheetModal(renderer)).toBeDefined();
  });
});

describe('Motion', () => {
  it('with motion the sheet starts off screen and translated down; with reduced motion it is in place at once', async () => {
    reducedMotion.mockReturnValue(false);
    const animated = await renderPairing();
    await press(animated, 'Partager');
    const sheetAnimated = (Reanimated as unknown as {getAnimatedStyle: (node: unknown) => unknown}).getAnimatedStyle;
    const start = flat(sheetAnimated(sheetView(sheetModal(animated)!)));
    expect(start.transform?.[0]?.translateY).toBeGreaterThan(0);
    act(() => animated.unmount());
    activeRenderers.length = 0;

    reducedMotion.mockReturnValue(true);
    const still = await renderPairing();
    await press(still, 'Partager');
    const end = flat(sheetAnimated(sheetView(sheetModal(still)!)));
    expect(end.transform?.[0]?.translateY).toBe(0);
  });

  it('uses Reanimated only (opacity / transform), no other animation library, no timers', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../InvitationShareSheet.tsx'), 'utf8');
    expect(source).toContain("from 'react-native-reanimated'");
    expect(source).not.toMatch(/setTimeout|setInterval|requestAnimationFrame|lottie/i);
  });
});

describe('Theme', () => {
  it('no color literal in the sheet: no dedicated palette', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../InvitationShareSheet.tsx'), 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).toContain('useAwaTheme');
  });

  const expectThemed = (modal: ReactTestRenderer.ReactTestInstance, theme: ReturnType<typeof resolveAwaTheme>) => {
    const sheet = flat(sheetView(modal).props.style);
    expect(sheet.backgroundColor).toBe(theme.colors.surface);
    expect(sheet.borderColor).toBe(theme.colors.border);
    const card = flat(modal.findAll(node => node.props.accessibilityLabel === 'Aperçu de l’invitation')[0].props.style);
    expect(card.backgroundColor).toBe(theme.colors.primarySoft);
    expect(card.borderColor).toBe(withAlpha(theme.colors.primary, 0.2));
    expect(flat(findText(modal, 'Rejoins-moi sur AWA à deux 💜').props.style).color).toBe(theme.colors.text);
    expect(flat(findText(modal, DEMO_PAIRING_CODE).props.style).color).toBe(theme.colors.accent);
    expect(flat(findText(modal, 'Partager l’invitation').props.style).color).toBe(theme.colors.text);
    const iconBox = modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).width === 58)[0];
    expect(flat(iconBox.props.style).backgroundColor).toBe(theme.colors.background);
    expect(flat(iconBox.props.style).borderColor).toBe(theme.colors.border);
  };

  it('Light and Dark resolve the current AWA theme', async () => {
    const {modal} = await openSheet();
    expectThemed(modal, resolveAwaTheme('awa-original', false, false));
    act(() => activeRenderers.splice(0).forEach(renderer => renderer.unmount()));
    await setAppearanceMode('dark');
    const dark = await openSheet();
    expectThemed(dark.modal, resolveAwaTheme('awa-original', true, false));
  });

  it('switching the theme while the sheet is open updates it live (Light → Dark → another palette)', async () => {
    const {renderer} = await openSheet();
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expectThemed(sheetModal(renderer)!, resolveAwaTheme('awa-original', true, false));
    await act(async () => {
      await setAppearanceMode('light');
      await setSelectedThemeId('ocean-calm');
    });
    expectThemed(sheetModal(renderer)!, resolveAwaTheme('ocean-calm', false, false));
  });
});

describe('Frontend only', () => {
  it('the sheet imports no backend, storage or health-data module', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../InvitationShareSheet.tsx'), 'utf8');
    const imports = source.split('\n').filter(line => /^import |^} from /.test(line)).join('\n');
    expect(imports).not.toMatch(/async-storage|supabase|\/state\/|\/services\//i);
    expect(source).not.toMatch(/fetch\(|AsyncStorage\./);
  });
});

describe('External apps: missing app / failures never crash and never pair', () => {
  // (the host and composite Text both carry the role: count each message once)
  const notices = (modal: ReactTestRenderer.ReactTestInstance) => [...new Set(modal.findAll(node => node.props.accessibilityRole === 'alert').map(textOf))].filter(Boolean);

  it.each([
    ['WhatsApp', 'WhatsApp n’est pas disponible sur cet appareil'],
    ['Messages', 'Messages n’est pas disponible sur cet appareil'],
    ['Gmail', 'Aucune application e-mail n’est disponible sur cet appareil'],
  ])('%s cannot be opened → a plain message and the system share sheet instead (no crash, no technical error)', async (label, message) => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('ActivityNotFoundException: Could not open URL'));
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, label);
    expect(share).toHaveBeenCalledWith({message: invitationMessage()});
    expect(notices(modal)).toEqual([message]);
    expect(modal.findAllByType(Text).map(textOf).join(' ')).not.toMatch(/Exception|Could not open|Error/);
  });

  it('when the fallback share sheet also fails, only a plain message is shown', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no app'));
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no share'));
    const {modal} = await openSheet();
    await press(modal, 'WhatsApp');
    expect(notices(modal)).toEqual(['Impossible d’ouvrir le partage pour le moment.']);
  });

  it('a successful open clears an earlier message; a dismissed share sheet is not an error', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no app')).mockResolvedValue(undefined as never);
    jest.spyOn(Share, 'share').mockResolvedValue({action: 'dismissedAction'} as never);
    const {modal} = await openSheet();
    await press(modal, 'WhatsApp');
    expect(notices(modal)).toHaveLength(1);
    await press(modal, 'Messages');
    expect(notices(modal)).toEqual([]);
    await press(modal, 'Plus d’options');
    expect(notices(modal)).toEqual([]);
  });

  it('every app opens the compose screen with the prefilled invitation and never sends it (the user chooses the recipient)', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const {modal} = await openSheet();
    await press(modal, 'WhatsApp');
    await press(modal, 'Messages');
    await press(modal, 'Gmail');
    const urls = open.mock.calls.map(call => String(call[0]));
    expect(urls[0].startsWith('whatsapp://send?text=')).toBe(true); // no phone number: the user picks the contact
    expect(urls[1]).toMatch(/^sms:[?&]body=/); // no recipient in the link
    expect(urls[2].startsWith('mailto:?subject=')).toBe(true); // empty recipient
    urls.forEach(url => expect(decodeURIComponent(url)).toContain(DEMO_PAIRING_CODE));
  });

  it('sharing never marks the partner as associated (sharing is not pairing)', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const {getDemoPartnerState} = require('../../../state/awaADeuxDemoStore');
    const {modal} = await openSheet();
    for (const label of ['WhatsApp', 'Messages', 'Instagram', 'Gmail', 'Copier le texte', 'Plus d’options']) {
      await press(modal, label);
    }
    expect(getDemoPartnerState().partnerConnected).toBe(false);
    const source = fs.readFileSync(path.resolve(__dirname, '../InvitationShareSheet.tsx'), 'utf8');
    expect(source).not.toMatch(/awaADeuxDemoStore|simulatePartnerConnected/);
  });
});

// Last on purpose: it switches to fake timers.
describe('Closing with motion', () => {
  it('with motion the sheet first slides down, then closes (once, even if closed twice)', async () => {
    reducedMotion.mockReturnValue(false);
    jest.useFakeTimers();
    try {
      const renderer = await renderPairing();
      await press(renderer, 'Partager');
      const modal = sheetModal(renderer)!;
      const close = modal.findAll(node => node.props.accessibilityLabel === 'Fermer' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function').pop()!;
      await act(async () => {
        close.props.onPress();
        close.props.onPress();
      });
      expect(sheetModal(renderer)).toBeDefined(); // still visible while it slides down
      await act(async () => {
        jest.advanceTimersByTime(1200);
      });
      await settle();
      expect(sheetModal(renderer)).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});
