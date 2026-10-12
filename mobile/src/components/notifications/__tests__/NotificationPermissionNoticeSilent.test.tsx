import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import notifee from '@notifee/react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import NotificationPermissionNotice from '../NotificationPermissionNotice';

// 'channel-silent' is a gentle, non-blocking hint: no alert role, no "continue without" button, no recheck, and the
// only action opens the reminders channel's page in Android settings. It never touches the channel.
const mockedNotifee = notifee as unknown as {
  openNotificationSettings: jest.Mock;
  createChannel: jest.Mock;
  deleteChannel: jest.Mock;
};

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function render(props: React.ComponentProps<typeof NotificationPermissionNotice>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <NotificationPermissionNotice testID="notice" {...props} />
      </AwaThemeProvider>,
    );
  });
  return renderer;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

it('explains the Android steps in a calm card that is not an alert', async () => {
  const renderer = await render({state: 'channel-silent', onContinue: jest.fn(), onRecheck: jest.fn()});

  const card = renderer.root.findAll(node => typeof node.type === 'string' && node.props.testID === 'notice-silent');
  expect(card).toHaveLength(1);
  expect(renderer.root.findAll(node => node.props.accessibilityRole === 'alert')).toHaveLength(0);

  const texts = renderer.root.findAllByType(Text).map(textOf);
  expect(texts).toContain(i18n.t('notificationPermission.channelSilentTitle'));
  expect(texts).toContain(i18n.t('notificationPermission.channelSilentBody'));
  expect(texts.join(' ')).toContain('Settings > Notifications > AWA reminders > Sound');
  // a hint, not a block: no way-out button and no "I've turned them on" re-check
  expect(texts).not.toContain(i18n.t('notificationPermission.continueWithout'));
  expect(texts).not.toContain(i18n.t('notificationPermission.recheck'));
  renderer.unmount();
});

it('"Open notification settings" opens the channel page and never creates or deletes a channel', async () => {
  const renderer = await render({state: 'channel-silent'});
  const label = i18n.t('notificationPermission.openSettings');
  const button = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label,
  )[0];

  await act(async () => {
    await button.props.onPress();
  });

  expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledWith('pregnancy-reminders');
  expect(mockedNotifee.createChannel).not.toHaveBeenCalled();
  expect(mockedNotifee.deleteChannel).not.toHaveBeenCalled();
  renderer.unmount();
});

it('the silent hint disappears when the state becomes ready', async () => {
  const renderer = await render({state: 'channel-silent'});
  await act(async () => {
    renderer.update(
      <AwaThemeProvider>
        <NotificationPermissionNotice state="ready" testID="notice" />
      </AwaThemeProvider>,
    );
  });
  expect(renderer.root.findAllByType(Text)).toHaveLength(0);
  renderer.unmount();
});
