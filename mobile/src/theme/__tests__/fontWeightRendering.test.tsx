import React from 'react';
import {Platform, Text} from 'react-native';

import {AwaText} from '../../components/ui/AwaText';
import {
  AWA_PRIMARY_ACTION_LABEL,
  AWA_TEXT_ROLES,
  AWA_TYPESCALE,
  awaTextStyle,
  renderableFontWeight,
} from '../typescale';
import {flattenStyle, hostByTestId, renderWithAwaTheme, resetThemeStores} from '../../testUtils/renderWithAwaTheme';

// Option A (approved): Android's Roboto has no 600 face, so a design weight of 600 is resolved to 700 there. The design
// scale (AWA_TYPESCALE) is unchanged; only the weight handed to React Native is.

const RENDERABLE_ON_ANDROID = ['400', '500', '700'];

describe('renderableFontWeight', () => {
  it('maps 600 to 700 on Android and leaves every other weight and platform untouched', () => {
    expect(renderableFontWeight('600', 'android')).toBe('700');
    expect(renderableFontWeight('500', 'android')).toBe('500');
    expect(renderableFontWeight('400', 'android')).toBe('400');
    expect(renderableFontWeight('600', 'ios')).toBe('600');
    expect(renderableFontWeight('600', 'web')).toBe('600');
  });

  it('defaults to the running platform (jest runs as ios, so the design weight is kept there)', () => {
    expect(Platform.OS).toBe('ios');
    expect(renderableFontWeight('600')).toBe('600');
    const replaced = jest.replaceProperty(Platform, 'OS', 'android');
    try {
      expect(renderableFontWeight('600')).toBe('700');
    } finally {
      replaced.restore();
    }
  });
});

describe('awaTextStyle on Android', () => {
  it('only ever emits a weight Android can draw (400 / 500 / 700), for every role, regular and emphasized', () => {
    AWA_TEXT_ROLES.forEach(role => {
      [false, true].forEach(emphasized => {
        const weight = awaTextStyle(role, {emphasized, platform: 'android'}).fontWeight as string;
        expect([role, emphasized, RENDERABLE_ON_ANDROID.includes(weight)]).toEqual([role, emphasized, true]);
      });
    });
  });

  it('keeps the hierarchy: emphasized is never lighter than regular, and the 600 roles become visibly heavier', () => {
    AWA_TEXT_ROLES.forEach(role => {
      const regular = Number(awaTextStyle(role, {platform: 'android'}).fontWeight);
      const emphasized = Number(awaTextStyle(role, {emphasized: true, platform: 'android'}).fontWeight);
      expect([role, emphasized >= regular]).toEqual([role, true]);
    });
    // titleMedium: regular 500 (Medium), emphasized 600 in the design scale -> 700 (Bold) on Android
    expect(awaTextStyle('titleMedium', {platform: 'android'}).fontWeight).toBe('500');
    expect(awaTextStyle('titleMedium', {emphasized: true, platform: 'android'}).fontWeight).toBe('700');
    // body roles were already renderable (400 / 500): unchanged
    expect(awaTextStyle('bodyLarge', {emphasized: true, platform: 'android'}).fontWeight).toBe('500');
  });

  it('does not change anything else: size, line height and tracking still come from the verified scale', () => {
    AWA_TEXT_ROLES.forEach(role => {
      const android = awaTextStyle(role, {emphasized: true, platform: 'android'});
      const spec = AWA_TYPESCALE[role];
      expect([role, android.fontSize, android.lineHeight, android.letterSpacing]).toEqual([
        role,
        spec.fontSize,
        spec.lineHeight,
        spec.letterSpacing,
      ]);
    });
  });

  it('keeps the design weights on other platforms (the token table itself is unchanged)', () => {
    expect(awaTextStyle('titleMedium', {emphasized: true, platform: 'ios'}).fontWeight).toBe('600');
    expect(AWA_TYPESCALE.titleMedium.fontWeightEmphasized).toBe('600');
    expect(AWA_TYPESCALE.labelLarge.fontWeightEmphasized).toBe('600');
  });
});

describe('AwaText on Android', () => {
  afterEach(resetThemeStores);

  it('emphasized text is 700, regular roles are untouched, and a legacy weight override is never remapped', async () => {
    const replaced = jest.replaceProperty(Platform, 'OS', 'android');
    try {
      const {renderer} = await renderWithAwaTheme(
        <>
          <AwaText testID="plain" variant="titleMedium">a</AwaText>
          <AwaText emphasized testID="emph" variant="titleMedium">a</AwaText>
          <AwaText emphasized testID="body" variant="bodyLarge">a</AwaText>
          <AwaText testID="legacy" variant="titleMedium" weight="600">a</AwaText>
        </>,
      );
      const weight = (id: string) => flattenStyle(hostByTestId(renderer, Text, id).props.style).fontWeight;
      expect(weight('plain')).toBe('500');
      expect(weight('emph')).toBe('700');
      expect(weight('body')).toBe('500');
      // A screen that keeps its legacy weight (decision D4) keeps exactly what it asked for.
      expect(weight('legacy')).toBe('600');
    } finally {
      replaced.restore();
    }
  });
});

describe('AWA_PRIMARY_ACTION_LABEL', () => {
  it('is 17 sp at weight 700, and 700 is a weight Android renders as is', () => {
    expect(AWA_PRIMARY_ACTION_LABEL).toEqual({fontSize: 17, fontWeight: '700'});
    expect(renderableFontWeight('600', 'android')).toBe(AWA_PRIMARY_ACTION_LABEL.fontWeight);
    expect(RENDERABLE_ON_ANDROID).toContain(AWA_PRIMARY_ACTION_LABEL.fontWeight);
  });
});
