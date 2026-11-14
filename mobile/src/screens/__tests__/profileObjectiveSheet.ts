import {act, type ReactTestRenderer} from 'react-test-renderer';

// The Profile's objective settings (cycle length, period length, pregnancy dating, reminders…) live in the sheet opened by the
// "Mon objectif" card under the identity card. Tests that look for one of those rows open the sheet first with this helper.
export async function openProfileObjectiveSheet(renderer: ReactTestRenderer): Promise<void> {
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          typeof node.props.accessibilityLabel === 'string' &&
          /^(Mon objectif|My objective)/.test(node.props.accessibilityLabel) &&
          node.props.accessibilityRole === 'button' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
}
