import React from 'react';
import type ReactTestRenderer from 'react-test-renderer';
import {ActivityIndicator, Pressable, Text} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaButton, type AwaButtonVariant} from '../AwaButton';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../../theme/componentDimensions';
import {contrastRatio, WCAG_AA_TEXT} from '../../../theme/contrast';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../../testUtils/renderWithAwaTheme';

afterEach(resetThemeStores);

const styleOf = (node: ReactTestRenderer.ReactTestInstance, pressed = false) =>
  flattenStyle((node.props.style as (state: {pressed: boolean}) => unknown)({pressed}));

describe('AwaButton', () => {
  it('is ONE native Pressable with role button; the label doubles as accessibilityLabel; onPress is not wrapped', async () => {
    const onPress = jest.fn();
    const {renderer} = await renderWithAwaTheme(<AwaButton label="Enregistrer" onPress={onPress} testID="save" />);
    const pressables = renderer.root.findAllByType(Pressable);
    expect(pressables).toHaveLength(1);
    expect(pressables[0].props).toMatchObject({accessibilityRole: 'button', accessibilityLabel: 'Enregistrer', testID: 'save'});
    expect(pressables[0].props.onPress).toBe(onPress);
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe('Enregistrer');
    pressables[0].props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sizes come from the (provisional) proposals; minHeight is a documented legacy override', async () => {
    const heights = AWA_COMPONENT_DIMENSION_PROPOSALS.button;
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaButton label="a" size="compact" />
        <AwaButton label="b" />
        <AwaButton label="c" size="large" />
        <AwaButton label="d" minHeight={54} />
      </>,
    );
    const nodes = renderer.root.findAllByType(Pressable);
    expect(nodes.map(node => styleOf(node).minHeight)).toEqual([heights.compact, heights.default, heights.large, 54]);
  });

  it('variants: filled / tonal / outlined / text / destructive use the expected roles', async () => {
    const variants: AwaButtonVariant[] = ['filled', 'tonal', 'outlined', 'text', 'destructive'];
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        {variants.map(variant => (
          <AwaButton key={variant} label={variant} testID={variant} variant={variant} />
        ))}
      </>,
    );
    const pressables = renderer.root.findAllByType(Pressable);
    const byVariant = Object.fromEntries(variants.map((variant, index) => [variant, styleOf(pressables[index])]));
    expect(byVariant.filled.backgroundColor).toBe(roles.primary);
    expect(byVariant.tonal.backgroundColor).toBe(roles.primaryContainer);
    expect(byVariant.outlined.backgroundColor).toBeUndefined();
    expect(byVariant.outlined.borderColor).toBe(roles.outline);
    expect(byVariant.text.backgroundColor).toBeUndefined();
    expect(byVariant.text.borderWidth).toBe(0);
    expect(byVariant.destructive.borderWidth).toBe(1);
    const labelColors = renderer.root.findAllByType(Text).map(node => flattenStyle(node.props.style).color);
    expect(labelColors[0]).toBe(roles.onPrimary);
    expect(labelColors[1]).toBe(roles.onPrimaryContainer);
    expect(labelColors[2]).toBe(roles.accessible.primaryAsText);
    expect(labelColors[4]).toBe(roles.accessible.dangerText);
  });

  it('disabled: inert, exposed in accessibilityState, dimmed content; pressed feedback is off', async () => {
    const onPress = jest.fn();
    const {renderer, roles} = await renderWithAwaTheme(<AwaButton disabled label="Valider" onPress={onPress} />);
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toMatchObject({disabled: true});
    expect(styleOf(pressable, true).backgroundColor).toBe(styleOf(pressable, false).backgroundColor);
    expect(flattenStyle(renderer.root.findByType(Text).props.style).color).not.toBe(roles.onPrimary);
  });

  it('loading: shows an ActivityIndicator, becomes inert and is announced as busy', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaButton icon="check" label="Envoi" loading />);
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toMatchObject({disabled: true, busy: true});
    expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(renderer.root.findAllByType(MaterialDesignIcons)).toHaveLength(0); // the spinner replaces the leading icon
  });

  it('icons are decorative and the label wraps (no numberOfLines, flexShrink)', async () => {
    const {renderer} = await renderWithAwaTheme(
      <AwaButton icon="plus" label="Ajouter une entrée au journal quotidien de la journée" trailingIcon="chevron-right" />,
    );
    const icons = renderer.root.findAllByType(MaterialDesignIcons);
    expect(icons).toHaveLength(2);
    icons.forEach(icon => expect(icon.props.accessibilityElementsHidden).toBe(true));
    const label = renderer.root.findAllByType(Text).find(node => typeof node.props.children === 'string' && node.props.children.startsWith('Ajouter'))!;
    expect(label.props.numberOfLines).toBeUndefined();
    expect(flattenStyle(label.props.style).flexShrink).toBe(1);
  });

  it('forwards native Pressable props; caller style (object or function) is applied last; fullWidth stretches', async () => {
    const onPressIn = jest.fn();
    const {renderer} = await renderWithAwaTheme(
      <AwaButton
        accessibilityHint="Ouvre le formulaire"
        fullWidth
        hitSlop={6}
        label="Go"
        onPressIn={onPressIn}
        shape={18}
        style={({pressed}) => ({marginTop: pressed ? 2 : 1})}
        weight="800"
      />,
    );
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props).toMatchObject({accessibilityHint: 'Ouvre le formulaire', hitSlop: 6});
    expect(pressable.props.onPressIn).toBe(onPressIn);
    expect(styleOf(pressable)).toMatchObject({alignSelf: 'stretch', borderRadius: 18, marginTop: 1});
    expect(styleOf(pressable, true).marginTop).toBe(2);
    expect(flattenStyle(renderer.root.findByType(Text).props.style).fontWeight).toBe('800');
  });

  it('wraps long Russian / German / Chinese labels without truncating them', async () => {
    const labels = ['Сохранить изменения и вернуться', 'Einstellungen speichern und fortfahren', '保存设置并返回主页'];
    const {renderer} = await renderWithAwaTheme(
      <>
        {labels.map(label => (
          <AwaButton key={label} label={label} />
        ))}
      </>,
    );
    const texts = renderer.root.findAllByType(Text);
    expect(texts.map(node => node.props.children)).toEqual(labels);
    texts.forEach(node => expect(node.props.numberOfLines).toBeUndefined());
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: filled and tonal labels are readable on their fill', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaButton label="f" variant="filled" />
        <AwaButton label="t" variant="tonal" />
        <AwaButton label="o" variant="outlined" />
      </>,
      variant,
    );
    const [filledNode, tonalNode] = renderer.root.findAllByType(Pressable);
    const [filledLabel, tonalLabel, outlinedLabel] = renderer.root.findAllByType(Text);
    expect(styleOf(filledNode).backgroundColor).toBe(roles.primary);
    expect(contrastRatio(flattenStyle(filledLabel.props.style).color as string, roles.primary)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(styleOf(tonalNode).backgroundColor).toBe(roles.primaryContainer);
    expect(contrastRatio(flattenStyle(tonalLabel.props.style).color as string, roles.primaryContainer)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(contrastRatio(flattenStyle(outlinedLabel.props.style).color as string, roles.background)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });
});
