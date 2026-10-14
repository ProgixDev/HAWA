import React from 'react';
import {Text} from 'react-native';

import {AwaText} from '../AwaText';
import {AWA_TEXT_ROLES, AWA_TYPESCALE} from '../../../theme/typescale';
import {THEME_VARIANTS, flattenStyle, hostByTestId, renderWithAwaTheme, resetThemeStores} from '../../../testUtils/renderWithAwaTheme';

const textHost = (renderer: Parameters<typeof hostByTestId>[0], id: string) => hostByTestId(renderer, Text, id);

afterEach(resetThemeStores);

describe('AwaText', () => {
  it('renders ONE native Text with the children untouched and the default role (bodyMedium, onSurface)', async () => {
    const {renderer, roles} = await renderWithAwaTheme(<AwaText>Bonjour</AwaText>);
    const texts = renderer.root.findAllByType(Text);
    expect(texts).toHaveLength(1);
    expect(texts[0].props.children).toBe('Bonjour');
    const style = flattenStyle(texts[0].props.style);
    expect(style).toMatchObject({fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontWeight: '400', color: roles.onSurface});
    // no extra host nodes: the rendered tree is a single Text
    const json = renderer.toJSON() as {type: string; children: string[]};
    expect(json.type).toBe('Text');
    expect(json.children).toEqual(['Bonjour']);
  });

  it('applies every one of the 15 roles with the verified size / lineHeight / tracking', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        {AWA_TEXT_ROLES.map(role => (
          <AwaText key={role} testID={role} variant={role}>
            x
          </AwaText>
        ))}
      </>,
    );
    AWA_TEXT_ROLES.forEach(role => {
      const style = flattenStyle(textHost(renderer, role).props.style);
      expect(style).toMatchObject({
        fontSize: AWA_TYPESCALE[role].fontSize,
        lineHeight: AWA_TYPESCALE[role].lineHeight,
        letterSpacing: AWA_TYPESCALE[role].letterSpacing,
      });
    });
  });

  it('emphasized uses the emphasized (provisional) weight, and a legacy weight override wins', async () => {
    const {renderer} = await renderWithAwaTheme(
      <>
        <AwaText testID="plain" variant="titleMedium">a</AwaText>
        <AwaText emphasized testID="emph" variant="titleMedium">a</AwaText>
        <AwaText emphasized testID="legacy" variant="titleMedium" weight="800">a</AwaText>
      </>,
    );
    expect(flattenStyle(textHost(renderer, 'plain').props.style).fontWeight).toBe('500');
    expect(flattenStyle(textHost(renderer, 'emph').props.style).fontWeight).toBe('600');
    expect(flattenStyle(textHost(renderer, 'legacy').props.style).fontWeight).toBe('800');
  });

  it('colour: accessible companion by default, raw token on request, explicit colour wins, caller style last', async () => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaText colorRole="onSurfaceVariant" testID="a11y">a</AwaText>
        <AwaText accessible={false} colorRole="onSurfaceVariant" testID="raw">a</AwaText>
        <AwaText color="#123456" colorRole="primary" testID="explicit">a</AwaText>
        <AwaText style={{color: '#abcdef', marginTop: 3}} testID="override">a</AwaText>
      </>,
    );
    const color = (id: string) => flattenStyle(textHost(renderer, id).props.style).color;
    expect(color('a11y')).toBe(roles.accessible.onSurfaceVariant);
    expect(color('raw')).toBe(roles.onSurfaceVariant);
    expect(color('explicit')).toBe('#123456');
    expect(color('override')).toBe('#abcdef');
    expect(flattenStyle(textHost(renderer, 'override').props.style).marginTop).toBe(3);
  });

  it('forwards native Text props, handlers, accessibility props and the ref', async () => {
    const onPress = jest.fn();
    const ref = React.createRef<Text>();
    const {renderer} = await renderWithAwaTheme(
      <AwaText
        accessibilityLabel="titre"
        accessibilityRole="header"
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.2}
        minimumFontScale={0.8}
        numberOfLines={2}
        onPress={onPress}
        ref={ref}
        selectable
        testID="t">
        Titre
      </AwaText>,
    );
    const text = renderer.root.findByType(Text);
    expect(text.props).toMatchObject({
      accessibilityLabel: 'titre',
      accessibilityRole: 'header',
      adjustsFontSizeToFit: true,
      maxFontSizeMultiplier: 1.2,
      minimumFontScale: 0.8,
      numberOfLines: 2,
      selectable: true,
      testID: 't',
    });
    text.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(ref.current).toBeTruthy(); // the ref reaches the native Text instance
  });

  it('is localization-safe: long Russian / German / Chinese strings are passed through and never truncated by default', async () => {
    const samples = ['Фолликулярная фаза и овуляция', 'Menstruationszyklusregelmäßigkeit', '请在每天同一时间记录你的体温和症状变化'];
    const {renderer} = await renderWithAwaTheme(
      <>
        {samples.map((sample, index) => (
          <AwaText key={sample} testID={`s${index}`}>
            {sample}
          </AwaText>
        ))}
      </>,
    );
    samples.forEach((sample, index) => {
      const node = renderer.root.findByProps({testID: `s${index}`});
      expect(node.props.children).toBe(sample);
      expect(node.props.numberOfLines).toBeUndefined();
      expect(node.props.adjustsFontSizeToFit).toBeUndefined();
      expect(node.props.allowFontScaling).toBeUndefined(); // OS font scaling stays on
    });
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: colours come from the resolved theme', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(
      <>
        <AwaText colorRole="onSurface" testID="a">a</AwaText>
        <AwaText colorRole="primary" testID="b">b</AwaText>
        <AwaText colorRole="error" testID="c">c</AwaText>
      </>,
      variant,
    );
    const color = (id: string) => flattenStyle(textHost(renderer, id).props.style).color;
    expect(color('a')).toBe(roles.onSurface);
    expect(color('b')).toBe(roles.accessible.primaryAsText);
    expect(color('c')).toBe(roles.accessible.dangerText);
  });
});
