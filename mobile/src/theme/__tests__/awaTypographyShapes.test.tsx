import React from 'react';
import {Platform, StyleSheet} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {awaShapeRadius, awaShapeSheet, awaShapeStyle} from '../awaShapeLayer';
import {
  AWA_FONT_FAMILIES,
  awaFontCut,
  installAwaTypography,
  patchAwaRender,
  resolveAwaFont,
} from '../awaTypography';

describe('typography layer (DESIGN.md: Fraunces / Inter / IBM Plex Mono)', () => {
  it('maps every weight to the 400 / 500 / 600 cuts', () => {
    expect(['100', '300', 'normal', '400', undefined].map(w => awaFontCut(w as never))).toEqual(['400', '400', '400', '400', '400']);
    expect(['500'].map(w => awaFontCut(w as never))).toEqual(['500']);
    expect(['600', '700', '800', '900', 'bold'].map(w => awaFontCut(w as never))).toEqual(['600', '600', '600', '600', '600']);
  });

  it('gives unstyled and generic sans text Inter, serif text Fraunces and monospace text IBM Plex Mono', () => {
    expect(resolveAwaFont(undefined)).toEqual({fontFamily: 'Inter-Regular', fontWeight: 'normal'});
    expect(resolveAwaFont({fontWeight: '700'})).toEqual({fontFamily: 'Inter-SemiBold', fontWeight: 'normal'});
    expect(resolveAwaFont({fontFamily: 'serif', fontWeight: '800'})).toEqual({fontFamily: 'Fraunces-SemiBold', fontWeight: 'normal'});
    expect(resolveAwaFont({fontFamily: 'serif'})).toEqual({fontFamily: AWA_FONT_FAMILIES.display['400'], fontWeight: 'normal'});
    expect(resolveAwaFont({fontFamily: 'monospace', fontWeight: '500'})).toEqual({fontFamily: 'IBMPlexMono-Medium', fontWeight: 'normal'});
    expect(resolveAwaFont({fontFamily: 'sans-serif-medium'})).toEqual({fontFamily: 'Inter-Medium', fontWeight: 'normal'});
  });

  it('leaves its own families and unknown custom families alone', () => {
    expect(resolveAwaFont({fontFamily: 'Inter-Medium'})).toBeNull();
    expect(resolveAwaFont({fontFamily: 'Cairo-Bold'})).toBeNull();
  });

  it('keeps a nested Text inheriting its parent face unless it states a family or a weight', () => {
    expect(resolveAwaFont({color: 'red'}, true)).toBeNull();
    expect(resolveAwaFont({fontWeight: '700'}, true)).toEqual({fontFamily: 'Inter-SemiBold', fontWeight: 'normal'});
  });

  it('wraps a component render once, appends the face last and restores it', () => {
    const render = jest.fn((props: Record<string, unknown>) => props);
    const component = {render};
    const undo = patchAwaRender(component as never, false);
    expect(patchAwaRender(component as never, false)).toEqual(expect.any(Function)); // second install is a no-op
    const out = (component.render as unknown as (p: Record<string, unknown>, r: unknown) => {style: unknown[]})(
      {style: {fontFamily: 'serif', fontWeight: '700', fontSize: 20}},
      null,
    );
    expect(out.style).toEqual([{fontFamily: 'serif', fontWeight: '700', fontSize: 20}, {fontFamily: 'Fraunces-SemiBold', fontWeight: 'normal'}]);
    undo();
    expect(component.render).toBe(render);
  });

  it('detects a nested Text with its own public context (no React Native internal import)', () => {
    const host = {render: (props: {style?: unknown; children?: React.ReactNode}) => React.createElement('span' as never, {style: props.style}, props.children)};
    patchAwaRender(host as never, true);
    const Fake = (props: {style?: unknown; children?: React.ReactNode}) =>
      (host.render as unknown as (p: unknown, r: unknown) => React.ReactElement)(props, null);
    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(
        <>
          <Fake style={{fontFamily: 'serif', fontSize: 20}}>
            <Fake style={{color: 'red'}}>nested</Fake>
          </Fake>
          <Fake style={{color: 'red'}}>top</Fake>
        </>,
      );
    });
    const spans = tree!.root.findAll(node => (node.type as unknown) === 'span');
    const flat = spans.map(node => StyleSheet.flatten(node.props.style as never) as {fontFamily?: string});
    expect(flat[0].fontFamily).toBe('Fraunces-Regular'); // outer title
    expect(flat[1].fontFamily).toBeUndefined(); // nested: keeps inheriting its parent
    expect(flat[2].fontFamily).toBe('Inter-Regular'); // separate top-level Text
  });

  it('installs only on Android', () => {
    expect(Platform.OS).not.toBe('android');
    expect(installAwaTypography()()).toBeUndefined();
  });
});

describe('shape layer (DESIGN.md: 12 default, 16 large, full pill, 28 sheets)', () => {
  it('maps card, button and field radii onto the scale', () => {
    expect(awaShapeRadius(13)).toBe(12);
    expect(awaShapeRadius(16)).toBe(16);
    expect(awaShapeRadius(15)).toBe(16);
    expect(awaShapeRadius(20)).toBe(12);
    expect(awaShapeRadius(26)).toBe(12);
  });

  it('keeps small radii, full radii, circles and pills', () => {
    expect(awaShapeRadius(6)).toBe(6);
    expect(awaShapeRadius(999)).toBe(999);
    expect(awaShapeRadius(22, {height: 44})).toBe(22);
    expect(awaShapeRadius(20, {width: 40, height: 40})).toBe(20);
    expect(awaShapeRadius(22, {minHeight: 44})).toBe(22);
  });

  it('maps top sheet corners to 28 and never mutates its input', () => {
    const source = {borderTopLeftRadius: 30, borderTopRightRadius: 26, backgroundColor: '#fff'};
    const out = awaShapeStyle(source);
    expect(out).toEqual({borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#fff'});
    expect(source.borderTopLeftRadius).toBe(30);
    expect(awaShapeStyle({a: 1})).toEqual({a: 1});
  });

  it('raises text below the 11 sp floor and its too small line height', () => {
    expect(awaShapeStyle({fontSize: 9, lineHeight: 11.5})).toEqual({fontSize: 11, lineHeight: 16});
    expect(awaShapeStyle({fontSize: 8})).toEqual({fontSize: 11});
    expect(awaShapeStyle({fontSize: 12, lineHeight: 14})).toEqual({fontSize: 12, lineHeight: 14});
  });

  it('maps whole sheets and passes non-style entries through', () => {
    const sheet = awaShapeSheet({card: {borderRadius: 24, padding: 8}, nested: [1, 2] as unknown as object});
    expect(sheet.card).toEqual({borderRadius: 12, padding: 8});
    expect(sheet.nested).toEqual([1, 2]);
  });
});
