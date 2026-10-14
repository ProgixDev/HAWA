import React from 'react';
import {Pressable, Switch, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaCard} from '../AwaCard';
import {AwaSwitch} from '../AwaSwitch';
import {AwaInfoRow} from '../AwaInfoRow';
import {contrastRatio, WCAG_AA_UI} from '../../../theme/contrast';
import {awaShapes} from '../../../theme/shapes';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../../testUtils/renderWithAwaTheme';

afterEach(resetThemeStores);

describe('AwaCard', () => {
  it('without onPress it is a plain native View: no Pressable, no role', async () => {
    const {renderer} = await renderWithAwaTheme(
      <AwaCard testID="c">
        <Text>contenu</Text>
      </AwaCard>,
    );
    expect(renderer.root.findAllByType(Pressable)).toHaveLength(0);
    const json = renderer.toJSON() as {type: string; props: Record<string, unknown>};
    expect(json.type).toBe('View');
    expect(json.props.accessibilityRole).toBeUndefined();
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe('contenu');
  });

  it('with onPress it is ONE native Pressable (role button, callback not wrapped, disabled forwarded)', async () => {
    const onPress = jest.fn();
    const {renderer} = await renderWithAwaTheme(
      <AwaCard accessibilityLabel="Ouvrir" onPress={onPress}>
        <Text>x</Text>
      </AwaCard>,
    );
    const pressables = renderer.root.findAllByType(Pressable);
    expect(pressables).toHaveLength(1);
    expect(pressables[0].props).toMatchObject({accessibilityRole: 'button', accessibilityLabel: 'Ouvrir'});
    expect(pressables[0].props.onPress).toBe(onPress);

    const disabled = await renderWithAwaTheme(
      <AwaCard disabled onPress={onPress}>
        <Text>x</Text>
      </AwaCard>,
    );
    expect(disabled.renderer.root.findByType(Pressable).props.disabled).toBe(true);
    expect(disabled.renderer.root.findByType(Pressable).props.accessibilityState).toMatchObject({disabled: true});
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: variants use theme surfaces; elevated uses the theme shadow', async (_label, variant) => {
    const {renderer, roles, theme} = await renderWithAwaTheme(
      <>
        <AwaCard testID="e" />
        <AwaCard testID="f" variant="filled" />
        <AwaCard testID="o" variant="outlined" />
      </>,
      variant,
    );
    const [elevated, filled, outlined] = renderer.root.findAllByType(View).filter(node => ['e', 'f', 'o'].includes(node.props.testID));
    const e = flattenStyle(elevated.props.style);
    expect(e).toMatchObject({backgroundColor: roles.surface, borderRadius: awaShapes.medium, padding: 16, ...theme.shadow});
    expect(flattenStyle(filled.props.style).backgroundColor).toBe(roles.surfaceContainer);
    expect(flattenStyle(filled.props.style).shadowOpacity).toBeUndefined();
    expect(flattenStyle(outlined.props.style)).toMatchObject({borderWidth: 1, borderColor: roles.outlineVariant});
  });

  it('padding and shape overrides (a legacy radius is accepted)', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaCard padding="none" shape={26} testID="a" />
        <AwaCard padding="compact" shape="large" testID="b" />
      </>,
    );
    const [a, b] = renderer.root.findAllByType(View).filter(node => ['a', 'b'].includes(node.props.testID));
    expect(flattenStyle(a.props.style)).toMatchObject({padding: 0, borderRadius: 26});
    expect(flattenStyle(b.props.style)).toMatchObject({padding: 12, borderRadius: awaShapes.large});
  });
});

describe('AwaSwitch', () => {
  it('wraps the NATIVE Switch: value, callback, disabled, testID and ref are forwarded; role + checked state exposed', async () => {
    const onValueChange = jest.fn();
    const ref = React.createRef<Switch>();
    const {renderer} = await renderWithAwaTheme(
      <AwaSwitch accessibilityLabel="Rappels" onValueChange={onValueChange} ref={ref} testID="sw" value />,
    );
    const nodes = renderer.root.findAllByType(Switch);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].props).toMatchObject({accessibilityLabel: 'Rappels', accessibilityRole: 'switch', value: true, testID: 'sw'});
    expect(nodes[0].props.accessibilityState).toMatchObject({checked: true, disabled: false});
    expect(nodes[0].props.onValueChange).toBe(onValueChange);
    nodes[0].props.onValueChange(false);
    expect(onValueChange).toHaveBeenCalledWith(false);
    expect(ref.current).toBeTruthy();
  });

  it('disabled is forwarded and exposed', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaSwitch accessibilityLabel="x" disabled value={false} />);
    const node = renderer.root.findByType(Switch);
    expect(node.props.disabled).toBe(true);
    expect(node.props.accessibilityState).toMatchObject({checked: false, disabled: true});
  });

  it('caller colours always win; the legacy appearance reproduces the pairing screens use today', async () => {
    const {renderer, roles, theme} = await renderWithAwaTheme(
      <>
        <AwaSwitch accessibilityLabel="a" appearance="legacy" testID="legacy" value />
        <AwaSwitch accessibilityLabel="b" testID="own" thumbColor="#111111" trackColor={{false: '#222222', true: '#333333'}} value />
      </>,
    );
    const [legacy, own] = renderer.root.findAllByType(Switch);
    expect(legacy.props.trackColor).toEqual({false: roles.primaryContainer, true: roles.primary});
    expect(legacy.props.thumbColor).toBe(theme.colors.surface);
    expect(own.props.thumbColor).toBe('#111111');
    expect(own.props.trackColor).toEqual({false: '#222222', true: '#333333'});
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: the accessible appearance keeps both states visible', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaSwitch accessibilityLabel="off" value={false} />
        <AwaSwitch accessibilityLabel="on" value />
      </>,
      variant,
    );
    const [off, on] = renderer.root.findAllByType(Switch);
    expect(off.props.trackColor.false).toBe(roles.outline);
    expect(contrastRatio(off.props.trackColor.false, roles.surface)).toBeGreaterThanOrEqual(WCAG_AA_UI); // track vs surface
    expect(contrastRatio(off.props.thumbColor, off.props.trackColor.false)).toBeGreaterThanOrEqual(WCAG_AA_UI); // thumb vs track
    expect(on.props.trackColor.true).toBe(roles.primary);
    expect(contrastRatio(on.props.thumbColor, roles.primary)).toBeGreaterThanOrEqual(WCAG_AA_UI);
  });
});

describe('AwaInfoRow', () => {
  it('without onPress it is a View (no role); with onPress ONE Pressable; the title is the default label', async () => {
    const plain = await renderWithAwaTheme(<AwaInfoRow subtitle="Sous-titre" title="Langue" />);
    expect(plain.renderer.root.findAllByType(Pressable)).toHaveLength(0);
    expect((plain.renderer.toJSON() as {type: string}).type).toBe('View');
    expect(plain.renderer.root.findAllByType(Text).map(node => node.props.children)).toEqual(['Langue', 'Sous-titre']);

    const onPress = jest.fn();
    const pressed = await renderWithAwaTheme(<AwaInfoRow onPress={onPress} title="Langue" />);
    const pressables = pressed.renderer.root.findAllByType(Pressable);
    expect(pressables).toHaveLength(1);
    expect(pressables[0].props).toMatchObject({accessibilityRole: 'button', accessibilityLabel: 'Langue'});
    pressables[0].props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a decorative chevron for pressable rows, a custom trailing node, or nothing', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaInfoRow onPress={jest.fn()} title="a" />
        <AwaInfoRow title="b" trailing={<Text>FR</Text>} />
        <AwaInfoRow onPress={jest.fn()} title="c" trailing="none" />
      </>,
    );
    const icons = renderer.root.findAllByType(MaterialDesignIcons);
    expect(icons).toHaveLength(1);
    expect(icons[0].props).toMatchObject({name: 'chevron-right', accessibilityElementsHidden: true});
    expect(renderer.root.findAllByType(Text).map(node => node.props.children)).toContain('FR');
  });

  it('icon tile tones, status, accent bar, last divider and disabled', async () => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaInfoRow accentColor="#C9A9DB" icon="bell" iconTone="primary" status="Activé" testID="r1" title="Rappels" />
        <AwaInfoRow disabled last onPress={jest.fn()} testID="r2" title="Verrouillé" />
      </>,
    );
    const texts = renderer.root.findAllByType(Text).map(node => node.props.children);
    expect(texts).toContain('Activé');
    const icon = renderer.root.findAllByType(MaterialDesignIcons)[0];
    expect(icon.props.color).toBe(roles.onPrimaryContainer);
    let tile = icon.parent!;
    while (tile.parent && flattenStyle(tile.props.style).backgroundColor === undefined) {
      tile = tile.parent;
    }
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(roles.primaryContainer);
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toMatchObject({disabled: true});
    const restingStyle = flattenStyle(pressable.props.style({pressed: false}));
    expect(restingStyle.borderBottomWidth).toBe(0); // last
    const firstRow = renderer.root.findAllByType(View).find(node => node.props.testID === 'r1')!;
    expect(flattenStyle(firstRow.props.style).borderBottomWidth).toBeGreaterThan(0);
  });

  it('keeps a Switch placed in the trailing slot independent (no nested Pressable from the row itself)', async () => {
    const onValueChange = jest.fn();
    const {renderer} = await renderWithAwaTheme(
      <AwaInfoRow title="Mode sombre" trailing={<AwaSwitch accessibilityLabel="Mode sombre" onValueChange={onValueChange} value />} />,
    );
    expect(renderer.root.findAllByType(Pressable)).toHaveLength(0);
    expect(renderer.root.findAllByType(Switch)).toHaveLength(1);
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: icon foreground is readable on its tile', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaInfoRow icon="bell" iconTone="default" title="a" />
        <AwaInfoRow icon="bell" iconTone="success" title="b" />
        <AwaInfoRow icon="bell" iconTone="warning" title="c" />
        <AwaInfoRow icon="bell" iconTone="danger" title="d" />
      </>,
      variant,
    );
    const icons = renderer.root.findAllByType(MaterialDesignIcons);
    const backgrounds = [roles.surfaceContainerHigh, roles.successContainer, roles.warningContainer, roles.errorContainer];
    icons.forEach((icon, index) => {
      expect(contrastRatio(icon.props.color, backgrounds[index])).toBeGreaterThanOrEqual(WCAG_AA_UI);
    });
  });
});
