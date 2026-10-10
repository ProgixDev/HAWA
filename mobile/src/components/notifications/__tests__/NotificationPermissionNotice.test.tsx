import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, Text} from 'react-native';
import notifee, {AuthorizationStatus} from '@notifee/react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import type {ReminderDeliveryState} from '../../../services/pregnancyNotifications';
import {useReminderDeliveryState} from '../../../hooks/useReminderDeliveryState';
import {useReminderPermissionGuard} from '../../../hooks/useReminderPermissionGuard';
import NotificationPermissionNotice from '../NotificationPermissionNotice';

// The one shared "your reminders cannot reach you" notice and the two hooks behind it:
//   useReminderDeliveryState    — non-prompting, live view of whether a reminder could be shown (Android
//                                 notifications on? reminders channel blocked?), re-read on returning to the app;
//   useReminderPermissionGuard  — the save-button half: ask Android only when a reminder is being enabled, and when
//                                 it is refused keep the notice (and its "Continue without notifications") visible.
// Only @notifee/react-native is simulated; the service that reads/asks Android is the real one.

type Android = 'allowed' | 'refused' | 'not-asked' | 'channel-blocked';

const mockedNotifee = notifee as unknown as {
  requestPermission: jest.Mock;
  getNotificationSettings: jest.Mock;
  openNotificationSettings: jest.Mock;
  isChannelBlocked: jest.Mock;
};

function setAndroid(state: Android) {
  const authorizationStatus =
    state === 'refused'
      ? AuthorizationStatus.DENIED
      : state === 'not-asked'
        ? AuthorizationStatus.NOT_DETERMINED
        : AuthorizationStatus.AUTHORIZED;
  mockedNotifee.requestPermission.mockResolvedValue({authorizationStatus});
  mockedNotifee.getNotificationSettings.mockResolvedValue({authorizationStatus});
  mockedNotifee.isChannelBlocked.mockResolvedValue(state === 'channel-blocked');
}

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);
const hostsWithTestID = (renderer: ReactTestRenderer.ReactTestRenderer, testID: string) =>
  renderer.root.findAll(node => typeof node.type === 'string' && node.props.testID === testID);
const buttonsWithLabel = (renderer: ReactTestRenderer.ReactTestRenderer, buttonLabel: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === buttonLabel);
const label = (key: string) => i18n.t(key);
// (Pressable is memo(forwardRef(...)): one button can match twice, so count presence, never instances.)
const hasButton = (renderer: ReactTestRenderer.ReactTestRenderer, buttonLabel: string) =>
  buttonsWithLabel(renderer, buttonLabel).length > 0;

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, buttonLabel: string) => {
  const matches = buttonsWithLabel(renderer, buttonLabel);
  if (matches.length === 0) {throw new Error(`No button "${buttonLabel}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
};

beforeEach(async () => {
  jest.clearAllMocks();
  setAndroid('allowed');
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

/* ============================================================
   THE NOTICE
============================================================ */

type NoticeProps = React.ComponentProps<typeof NotificationPermissionNotice>;

const noticeElement = (props: NoticeProps) => (
  <AwaThemeProvider>
    <NotificationPermissionNotice testID="notice" {...props} />
  </AwaThemeProvider>
);

async function renderNotice(props: NoticeProps) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(noticeElement(props));
  });
  activeRenderers.push(renderer);
  return renderer;
}

const updateNotice = (renderer: ReactTestRenderer.ReactTestRenderer, props: NoticeProps) =>
  act(async () => {
    renderer.update(noticeElement(props));
  });

describe('NotificationPermissionNotice', () => {
  it.each<ReminderDeliveryState>(['ready', 'unknown'])('draws nothing when the state is %s', async state => {
    const renderer = await renderNotice({state, onRecheck: jest.fn(), onContinue: jest.fn()});

    expect(hostsWithTestID(renderer, 'notice')).toHaveLength(0);
    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(0);
    expect(renderer.root.findAllByType(Text)).toHaveLength(0);
  });

  it('notifications off: names it, says what that means, and "Open notification settings" opens Android\'s settings', async () => {
    const renderer = await renderNotice({state: 'notifications-off'});

    const notice = hostsWithTestID(renderer, 'notice');
    expect(notice).toHaveLength(1);
    expect(notice[0].props.accessibilityRole).toBe('alert');
    expect(textsOf(renderer)).toEqual(
      expect.arrayContaining([label('notificationPermission.blockedTitle'), label('notificationPermission.blockedBody')]),
    );
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.channelBlockedTitle'));

    await press(renderer, label('notificationPermission.openSettings'));
    expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('reminders channel blocked: its own wording, same way to fix it', async () => {
    const renderer = await renderNotice({state: 'channel-blocked'});

    expect(textsOf(renderer)).toEqual(
      expect.arrayContaining([
        label('notificationPermission.channelBlockedTitle'),
        label('notificationPermission.channelBlockedBody'),
      ]),
    );
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.blockedTitle'));

    await press(renderer, label('notificationPermission.openSettings'));
    expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('opening Android\'s settings never throws into the screen when it fails', async () => {
    mockedNotifee.openNotificationSettings.mockRejectedValueOnce(new Error('no settings activity'));
    const renderer = await renderNotice({state: 'notifications-off'});

    await expect(press(renderer, label('notificationPermission.openSettings'))).resolves.toBeUndefined();
  });

  it('only offers the re-check and "continue without" buttons when the screen provides them', async () => {
    const bare = await renderNotice({state: 'notifications-off'});
    expect(hasButton(bare, label('notificationPermission.openSettings'))).toBe(true);
    expect(hasButton(bare, label('notificationPermission.recheck'))).toBe(false);
    expect(hasButton(bare, label('notificationPermission.continueWithout'))).toBe(false);

    const full = await renderNotice({state: 'notifications-off', onRecheck: jest.fn(), onContinue: jest.fn()});
    expect(hasButton(full, label('notificationPermission.openSettings'))).toBe(true);
    expect(hasButton(full, label('notificationPermission.recheck'))).toBe(true);
    expect(hasButton(full, label('notificationPermission.continueWithout'))).toBe(true);
  });

  it('"Continue without notifications" hands control back to the screen', async () => {
    const onContinue = jest.fn();
    const renderer = await renderNotice({state: 'notifications-off', onContinue});

    await press(renderer, label('notificationPermission.continueWithout'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('re-check that still says off reports it; once Android says ready the report goes away', async () => {
    const onRecheck = jest.fn<Promise<ReminderDeliveryState>, []>().mockResolvedValue('notifications-off');
    const renderer = await renderNotice({state: 'notifications-off', onRecheck});
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.stillOff'));

    await press(renderer, label('notificationPermission.recheck'));
    expect(onRecheck).toHaveBeenCalledTimes(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.stillOff'));

    onRecheck.mockResolvedValue('ready');
    await press(renderer, label('notificationPermission.recheck'));
    expect(onRecheck).toHaveBeenCalledTimes(2);
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.stillOff'));
  });

  it('a re-check that comes back "unknown" is not mistaken for fixed', async () => {
    const onRecheck = jest.fn<Promise<ReminderDeliveryState>, []>().mockResolvedValue('unknown');
    const renderer = await renderNotice({state: 'notifications-off', onRecheck});

    await press(renderer, label('notificationPermission.recheck'));

    // Not ready is not "fixed": the notice keeps saying so.
    expect(textsOf(renderer)).toContain(label('notificationPermission.stillOff'));
  });

  it('confirms "notifications are on" when the state flips from blocked to ready, and not before', async () => {
    const renderer = await renderNotice({state: 'notifications-off', onRecheck: jest.fn()});
    expect(hostsWithTestID(renderer, 'notice')).toHaveLength(1);
    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(0);

    await updateNotice(renderer, {state: 'ready', onRecheck: jest.fn()});

    expect(hostsWithTestID(renderer, 'notice')).toHaveLength(0);
    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.nowOn'));
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.blockedTitle'));
  });

  it('never congratulates someone whose notifications were never off (unknown -> ready stays silent)', async () => {
    const renderer = await renderNotice({state: 'unknown'});

    await updateNotice(renderer, {state: 'ready'});

    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(0);
    expect(renderer.root.findAllByType(Text)).toHaveLength(0);
  });

  it('turned off again after the confirmation: the warning comes back and the confirmation goes', async () => {
    const renderer = await renderNotice({state: 'channel-blocked'});
    await updateNotice(renderer, {state: 'ready'});
    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(1);

    await updateNotice(renderer, {state: 'notifications-off'});

    expect(hostsWithTestID(renderer, 'notice-enabled')).toHaveLength(0);
    expect(hostsWithTestID(renderer, 'notice')).toHaveLength(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
  });
});

/* ============================================================
   useReminderDeliveryState
============================================================ */

type Delivery = ReturnType<typeof useReminderDeliveryState>;

function DeliveryProbe({active, latest}: {active: boolean; latest: {current: Delivery | null}}) {
  latest.current = useReminderDeliveryState(active);
  return null;
}

async function renderDelivery(active: boolean) {
  const latest: {current: Delivery | null} = {current: null};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<DeliveryProbe active={active} latest={latest} />);
  });
  activeRenderers.push(renderer);
  return {renderer, latest, current: () => latest.current as Delivery};
}

const changeListeners = () =>
  (AppState.addEventListener as jest.Mock).mock.calls
    .filter(call => call[0] === 'change')
    .map(call => call[1] as (state: string) => void);

describe('useReminderDeliveryState', () => {
  it('is inactive until a reminder matters: nothing is read and no listener is registered', async () => {
    const {current} = await renderDelivery(false);

    expect(current().state).toBe('unknown');
    expect(current().blocked).toBe(false);
    expect(mockedNotifee.getNotificationSettings).not.toHaveBeenCalled();
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });

  it.each<[Android, ReminderDeliveryState, boolean]>([
    ['allowed', 'ready', false],
    ['refused', 'notifications-off', true],
    ['channel-blocked', 'channel-blocked', true],
    ['not-asked', 'unknown', false],
  ])('Android %s -> %s (blocked: %s), read without ever prompting', async (android, expected, blocked) => {
    setAndroid(android);

    const {current} = await renderDelivery(true);

    expect(current().state).toBe(expected);
    expect(current().blocked).toBe(blocked);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });

  it('re-reads when the app comes back to the foreground (returning from Android\'s settings)', async () => {
    setAndroid('refused');
    const {current} = await renderDelivery(true);
    expect(current().state).toBe('notifications-off');

    setAndroid('allowed');
    await act(async () => {
      changeListeners().forEach(listener => listener('active'));
    });

    expect(current().state).toBe('ready');
    expect(current().blocked).toBe(false);
  });

  it('does not re-read for background / inactive changes', async () => {
    setAndroid('refused');
    await renderDelivery(true);
    const reads = mockedNotifee.getNotificationSettings.mock.calls.length;

    await act(async () => {
      changeListeners().forEach(listener => listener('background'));
      changeListeners().forEach(listener => listener('inactive'));
    });

    expect(mockedNotifee.getNotificationSettings.mock.calls.length).toBe(reads);
  });

  it('refresh() re-reads on demand and returns the fresh answer', async () => {
    setAndroid('refused');
    const {current} = await renderDelivery(true);

    setAndroid('allowed');
    let answer: ReminderDeliveryState | undefined;
    await act(async () => {
      answer = await current().refresh();
    });

    expect(answer).toBe('ready');
    expect(current().state).toBe('ready');
  });

  it('reads as soon as it becomes active, and stops listening when it unmounts', async () => {
    setAndroid('refused');
    const latest: {current: Delivery | null} = {current: null};
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<DeliveryProbe active={false} latest={latest} />);
    });
    expect(mockedNotifee.getNotificationSettings).not.toHaveBeenCalled();

    await act(async () => {
      renderer.update(<DeliveryProbe active latest={latest} />);
    });
    expect(latest.current?.state).toBe('notifications-off');

    const subscription = (AppState.addEventListener as jest.Mock).mock.results[0].value as {remove: jest.Mock};
    act(() => renderer.unmount());
    expect(subscription.remove).toHaveBeenCalledTimes(1);
  });
});

/* ============================================================
   useReminderPermissionGuard
============================================================ */

type Guard = ReturnType<typeof useReminderPermissionGuard>;

function GuardProbe({reminderOn, latest}: {reminderOn: boolean; latest: {current: Guard | null}}) {
  latest.current = useReminderPermissionGuard(reminderOn);
  return null;
}

async function renderGuard(reminderOn: boolean) {
  const latest: {current: Guard | null} = {current: null};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<GuardProbe latest={latest} reminderOn={reminderOn} />);
  });
  activeRenderers.push(renderer);
  const guard = () => latest.current as Guard;
  const allowSave = async (reminderEnabled: boolean) => {
    let result: boolean | undefined;
    await act(async () => {
      result = await guard().allowSave(reminderEnabled);
    });
    return result as boolean;
  };
  return {guard, allowSave};
}

describe('useReminderPermissionGuard', () => {
  it('no reminder enabled: allows the save without asking or reading Android', async () => {
    setAndroid('refused');
    const {guard, allowSave} = await renderGuard(false);

    expect(await allowSave(false)).toBe(true);

    expect(guard().saveBlocked).toBe(false);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(mockedNotifee.getNotificationSettings).not.toHaveBeenCalled();
  });

  it('reminder enabled and notifications allowed: asks once, allows, nothing blocked', async () => {
    setAndroid('allowed');
    const {guard, allowSave} = await renderGuard(true);

    expect(await allowSave(true)).toBe(true);

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(guard().saveBlocked).toBe(false);
    expect(guard().state).toBe('ready');
  });

  it('reminder enabled and refused: blocks, remembers the block, and the state names the problem', async () => {
    setAndroid('refused');
    const {guard, allowSave} = await renderGuard(true);

    expect(await allowSave(true)).toBe(false);

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(guard().saveBlocked).toBe(true);
    expect(guard().state).toBe('notifications-off');
  });

  it('a block whose reason Android cannot read back still shows as "notifications off" (never as nothing)', async () => {
    setAndroid('not-asked');
    const {guard, allowSave} = await renderGuard(true);
    expect(guard().state).toBe('unknown');

    expect(await allowSave(true)).toBe(false);

    expect(guard().saveBlocked).toBe(true);
    expect(guard().state).toBe('notifications-off');
  });

  it('turning every reminder off after a block lets the next save through and clears the block', async () => {
    setAndroid('refused');
    const {guard, allowSave} = await renderGuard(true);
    expect(await allowSave(true)).toBe(false);
    expect(guard().saveBlocked).toBe(true);
    mockedNotifee.requestPermission.mockClear();

    expect(await allowSave(false)).toBe(true);

    expect(guard().saveBlocked).toBe(false);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });

  it('after she allows notifications in Android settings the next save goes through and clears the block', async () => {
    setAndroid('refused');
    const {guard, allowSave} = await renderGuard(true);
    expect(await allowSave(true)).toBe(false);

    setAndroid('allowed');
    expect(await allowSave(true)).toBe(true);

    expect(guard().saveBlocked).toBe(false);
    expect(guard().state).toBe('ready');
  });
});
