import React from 'react';
import {Pressable, Text, TextInput} from 'react-native';

import {AwaTextField} from '../AwaTextField';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../../testUtils/renderWithAwaTheme';
import type ReactTestRenderer from 'react-test-renderer';
import {act} from 'react-test-renderer';

afterEach(resetThemeStores);

const boxStyle = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  flattenStyle(renderer.root.findByType(TextInput).parent?.props.style);

describe('AwaTextField', () => {
  it('renders the label above ONE native TextInput; accessibilityLabel defaults to the label', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaTextField label="Prénom" placeholder="Ton prénom" />);
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(1);
    const input = renderer.root.findByType(TextInput);
    expect(input.props.accessibilityLabel).toBe('Prénom');
    expect(input.props.placeholder).toBe('Ton prénom');
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe('Prénom');
  });

  it('forwards every TextInput prop unchanged, including keyboard and security props', async () => {
    const onSubmitEditing = jest.fn();
    const props = {
      autoCapitalize: 'none' as const,
      autoComplete: 'password' as const,
      autoCorrect: false,
      importantForAutofill: 'no' as const,
      keyboardType: 'numeric' as const,
      maxLength: 6,
      onSubmitEditing,
      returnKeyType: 'done' as const,
      secureTextEntry: true,
      selectionColor: '#112233',
      textContentType: 'oneTimeCode' as const,
      testID: 'pin',
    };
    const {renderer} = await renderWithAwaTheme(<AwaTextField label="PIN" {...props} />);
    const input = renderer.root.findByType(TextInput);
    expect(input.props).toMatchObject(props);
    expect(input.props.onSubmitEditing).toBe(onSubmitEditing);
  });

  it('adds NO security default: secureTextEntry / autofill / keyboard props stay undefined when not given', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaTextField label="Nom" />);
    const input = renderer.root.findByType(TextInput);
    ['secureTextEntry', 'keyboardType', 'autoCapitalize', 'autoCorrect', 'autoComplete', 'textContentType', 'returnKeyType', 'importantForAutofill'].forEach(
      key => expect([key, input.props[key]]).toEqual([key, undefined]),
    );
  });

  it('composes focus / blur / change callbacks instead of replacing them, and tracks the focus ring', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    const {renderer, roles} = await renderWithAwaTheme(
      <AwaTextField label="Note" onBlur={onBlur} onChangeText={onChangeText} onFocus={onFocus} />,
    );
    const input = renderer.root.findByType(TextInput);
    expect(boxStyle(renderer).borderColor).toBe(roles.outline);
    act(() => input.props.onFocus({nativeEvent: {}}));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(boxStyle(renderer).borderColor).toBe(roles.primary);
    act(() => input.props.onChangeText('abc'));
    expect(onChangeText).toHaveBeenCalledWith('abc');
    act(() => input.props.onBlur({nativeEvent: {}}));
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(boxStyle(renderer).borderColor).toBe(roles.outline);
  });

  it('forwards the ref to the TextInput', async () => {
    const ref = React.createRef<TextInput>();
    await renderWithAwaTheme(<AwaTextField label="x" ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('error: shown with an icon (not colour alone), in a polite live region, error border; helper otherwise', async () => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaTextField errorText="Champ requis" helperText="Aide" label="a" testID="e" />
        <AwaTextField helperText="Aide seule" label="b" testID="h" />
      </>,
    );
    const texts = renderer.root.findAllByType(Text).map(node => node.props.children);
    expect(texts).toContain('Champ requis');
    expect(texts).not.toContain('Aide'); // the error replaces the helper
    expect(texts).toContain('Aide seule');
    const live = renderer.root.findAll(node => node.props.accessibilityLiveRegion === 'polite');
    expect(live.length).toBeGreaterThanOrEqual(2);
    const boxes = renderer.root.findAllByType(TextInput).map(input => flattenStyle(input.parent?.props.style));
    expect(boxes[0].borderColor).toBe(roles.error);
    expect(boxes[1].borderColor).toBe(roles.outline);
  });

  it('disabled (editable=false): exposed in accessibilityState and dimmed', async () => {
    const {renderer, roles} = await renderWithAwaTheme(<AwaTextField editable={false} label="Lecture" value="x" />);
    const input = renderer.root.findByType(TextInput);
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toMatchObject({disabled: true});
    expect(flattenStyle(input.props.style).color).not.toBe(roles.onSurface);
  });

  it('counter: length / maxLength, controlled and uncontrolled', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaTextField label="c" maxLength={10} showCounter value="abcd" />
        <AwaTextField label="u" maxLength={20} showCounter />
      </>,
    );
    const texts = () => renderer.root.findAllByType(Text).map(node => node.props.children);
    expect(texts()).toContain('4/10');
    expect(texts()).toContain('0/20');
    const [, uncontrolled] = renderer.root.findAllByType(TextInput);
    act(() => uncontrolled.props.onChangeText('hello'));
    expect(texts()).toContain('5/20');
  });

  it('multiline keeps top alignment and a larger minimum height; style still targets the TextInput', async () => {
    const {renderer} = await renderWithAwaTheme(<AwaTextField label="Note" multiline style={{fontSize: 18}} />);
    const input = renderer.root.findByType(TextInput);
    expect(flattenStyle(input.props.style)).toMatchObject({textAlignVertical: 'top', fontSize: 18});
    expect(boxStyle(renderer).minHeight).toBeGreaterThanOrEqual(96);
  });

  it('trailing icon: decorative by default, an icon-only button with its own label when pressable', async () => {
    const onTrailingIconPress = jest.fn();
    const {renderer} = await renderWithAwaTheme(
      <AwaTextField
        label="Mot de passe"
        onTrailingIconPress={onTrailingIconPress}
        trailingIcon="eye-outline"
        trailingIconAccessibilityLabel="Afficher le mot de passe"
      />,
    );
    const button = renderer.root.findByType(Pressable);
    expect(button.props.accessibilityLabel).toBe('Afficher le mot de passe');
    button.props.onPress();
    expect(onTrailingIconPress).toHaveBeenCalledTimes(1);
  });

  it('wraps long localized labels and helper text without truncating', async () => {
    const label = 'Контрольный вопрос для восстановления доступа к приложению';
    const helper = 'Verwende eine Antwort, die nur du kennst und dir leicht merken kannst.';
    const {renderer} = await renderWithAwaTheme(<AwaTextField helperText={helper} label={label} />);
    const texts = renderer.root.findAllByType(Text);
    expect(texts.map(node => node.props.children)).toEqual([label, helper]);
    texts.forEach(node => expect(node.props.numberOfLines).toBeUndefined());
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: border, text and placeholder come from the theme', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(<AwaTextField label="x" variant="filled" />, variant);
    const input = renderer.root.findByType(TextInput);
    expect(flattenStyle(input.props.style).color).toBe(roles.onSurface);
    expect(input.props.placeholderTextColor).toBe(roles.accessible.onSurfaceVariant);
    expect(boxStyle(renderer).backgroundColor).toBe(roles.surfaceContainerHigh);
  });
});
