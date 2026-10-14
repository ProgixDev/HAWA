import React from 'react';
import {Pressable} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaIcon} from '../AwaIcon';
import {AwaIconButton} from '../AwaIconButton';
import {awaIconSizes} from '../../../theme/iconSizes';
import {contrastRatio, WCAG_AA_UI} from '../../../theme/contrast';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../../testUtils/renderWithAwaTheme';

afterEach(resetThemeStores);

describe('AwaIcon', () => {
  it('renders the EXISTING icon library glyph with a token size, a role colour and decorative a11y by default', async () => {
    const {renderer, roles} = await renderWithAwaTheme(<AwaIcon name="chevron-right" testID="i" />);
    const icon = renderer.root.findByType(MaterialDesignIcons);
    expect(icon.props.name).toBe('chevron-right');
    expect(icon.props.size).toBe(awaIconSizes.md);
    expect(icon.props.color).toBe(roles.accessible.onSurfaceVariant);
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(icon.props.accessibilityLabel).toBeUndefined();
  });

  it('size tokens and legacy numbers; explicit colour wins; a label makes it an image for screen readers', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaIcon name="leaf" size="xs" />
        <AwaIcon name="leaf" size="lg" />
        <AwaIcon name="leaf" size={23} />
        <AwaIcon accessibilityLabel="Feuille" color="#FFD85F" name="crown" />
      </>,
    );
    const icons = renderer.root.findAllByType(MaterialDesignIcons);
    expect(icons.map(icon => icon.props.size)).toEqual([16, 32, 23, 24]);
    const labelled = icons[3];
    expect(labelled.props.color).toBe('#FFD85F');
    expect(labelled.props.accessibilityLabel).toBe('Feuille');
    expect(labelled.props.accessibilityRole).toBe('image');
    expect(labelled.props.accessibilityElementsHidden).toBe(false);
  });

  it('mirrorInRTL is accepted and inert', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaIcon mirrorInRTL name="arrow-left" />);
    expect(renderer.root.findByType(MaterialDesignIcons).props.mirrorInRTL).toBeUndefined();
  });
});

describe('AwaIconButton', () => {
  it('is ONE native Pressable (no nested Pressable) with role button, the required label and a 48 dp hit area', async () => {
    const onPress = jest.fn();
    const {renderer} = await renderWithAwaTheme(
      <AwaIconButton accessibilityLabel="Retour" icon="chevron-left" onPress={onPress} testID="b" />,
    );
    const pressables = renderer.root.findAllByType(Pressable);
    expect(pressables).toHaveLength(1);
    const pressable = pressables[0];
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Retour');
    expect(pressable.props.hitSlop).toEqual({top: 4, bottom: 4, left: 4, right: 4}); // 40 + 2 x 4 = 48
    expect(pressable.props.onPress).toBe(onPress); // not wrapped
    expect(renderer.root.findAllByType(MaterialDesignIcons)).toHaveLength(1);
  });

  it('small buttons get a larger hit slop; a caller hitSlop wins', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaIconButton accessibilityLabel="a" icon="close" size="small" testID="s" />
        <AwaIconButton accessibilityLabel="b" hitSlop={10} icon="close" testID="h" />
      </>,
    );
    const [small, custom] = renderer.root.findAllByType(Pressable);
    expect(small.props.hitSlop).toEqual({top: 8, bottom: 8, left: 8, right: 8}); // 32 + 2 x 8 = 48
    expect(custom.props.hitSlop).toBe(10);
  });

  it('disabled: forwarded to the native Pressable, exposed in accessibilityState and dimmed', async () => {
    const {renderer, roles} = await renderWithAwaTheme(
      <AwaIconButton accessibilityLabel="x" disabled icon="close" onPress={jest.fn()} variant="filled" />,
    );
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toMatchObject({disabled: true, selected: false});
    expect(renderer.root.findByType(MaterialDesignIcons).props.color).not.toBe(roles.onPrimary);
  });

  it('selected is exposed in accessibilityState and uses the container colours', async () => {
    const {renderer, roles} = await renderWithAwaTheme(<AwaIconButton accessibilityLabel="x" icon="heart" selected />);
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.accessibilityState.selected).toBe(true);
    const style = flattenStyle(pressable.props.style({pressed: false}));
    expect(style.backgroundColor).toBe(roles.primaryContainer);
  });

  it('pressed feedback changes the background without adding a node; caller style is applied last', async () => {
    const {renderer} = await renderWithAwaTheme(
      <AwaIconButton accessibilityLabel="x" icon="heart" style={{marginTop: 5}} variant="filled" />,
    );
    const pressable = renderer.root.findByType(Pressable);
    const resting = flattenStyle(pressable.props.style({pressed: false}));
    const pressed = flattenStyle(pressable.props.style({pressed: true}));
    expect(pressed.backgroundColor).not.toBe(resting.backgroundColor);
    expect(pressed.marginTop).toBe(5);
    expect(resting.width).toBe(40);
    expect(resting.height).toBe(40);
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: icon contrast on its own fill', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaIconButton accessibilityLabel="f" icon="heart" testID="f" variant="filled" />
        <AwaIconButton accessibilityLabel="t" icon="heart" testID="t" variant="tonal" />
        <AwaIconButton accessibilityLabel="o" icon="heart" testID="o" variant="outlined" />
      </>,
      variant,
    );
    const [filled, tonal, outlined] = renderer.root.findAllByType(Pressable);
    const icons = renderer.root.findAllByType(MaterialDesignIcons);
    expect(flattenStyle(filled.props.style({pressed: false})).backgroundColor).toBe(roles.primary);
    expect(contrastRatio(icons[0].props.color, roles.primary)).toBeGreaterThanOrEqual(WCAG_AA_UI);
    expect(flattenStyle(tonal.props.style({pressed: false})).backgroundColor).toBe(roles.primaryContainer);
    expect(contrastRatio(icons[1].props.color, roles.primaryContainer)).toBeGreaterThanOrEqual(WCAG_AA_UI);
    expect(flattenStyle(outlined.props.style({pressed: false})).borderColor).toBe(roles.outline);
    expect(contrastRatio(roles.outline, roles.surface)).toBeGreaterThanOrEqual(WCAG_AA_UI);
  });
});
