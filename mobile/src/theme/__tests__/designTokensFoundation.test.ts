import fs from 'fs';
import path from 'path';

import {
  AWA_MIN_TEXT_SIZE,
  AWA_TEXT_ROLES,
  AWA_TYPESCALE,
  awaTextStyle,
  isBelowTextFloor,
  nearestTextRole,
  type AwaTextRole,
} from '../typescale';
import {AWA_FULL_RADIUS_THRESHOLD, AWA_SHAPE_TOKENS, awaShapes, nearestShape} from '../shapes';
import {
  AWA_MIN_TOUCH_TARGET,
  awaIconSizes,
  nearestIconSize,
  touchTargetHitSlop,
} from '../iconSizes';
import {AWA_SCREEN_MARGIN, awaSpace, nearestSpace} from '../spaceScale';
import {
  AWA_COMPONENT_DIMENSION_KEYS,
  AWA_COMPONENT_DIMENSION_PROPOSALS,
} from '../componentDimensions';
import {
  WCAG_AA_TEXT,
  compositeOver,
  contrastRatio,
  ensureContrast,
  meetsContrast,
  parseColor,
  toHex,
  wcagLuminance,
} from '../contrast';

// The design documents are the single source of truth for the verified Material 3 values: these tests read the export
// itself, so a token that drifts from it fails the build.
const TOKENS_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'design-system', 'material3-tokens-normalized.json');
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8')) as {
  typescale: {baseline: Record<string, number | string>};
  shape: {baseline: Record<string, number>};
  fontTheme: {baseline: Record<string, number | string>};
};

const capital = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

describe('typescale — verified against material3-tokens-normalized.json', () => {
  it('has exactly the 15 Material 3 roles', () => {
    expect(AWA_TEXT_ROLES).toHaveLength(15);
    expect([...AWA_TEXT_ROLES].sort()).toEqual(
      ['display', 'headline', 'title', 'body', 'label']
        .flatMap(group => ['Large', 'Medium', 'Small'].map(size => `${group}${size}`))
        .map(name => name.charAt(0).toLowerCase() + name.slice(1))
        .sort(),
    );
  });

  it.each(AWA_TEXT_ROLES)('%s: size, lineHeight and tracking equal the export', role => {
    const json = tokens.typescale.baseline;
    const spec = AWA_TYPESCALE[role as AwaTextRole];
    expect(spec.fontSize).toBe(json[`static${capital(role)}Size`]);
    expect(spec.lineHeight).toBe(json[`static${capital(role)}LineHeight`]);
    expect(Math.abs(spec.letterSpacing - Number(json[`static${capital(role)}Tracking`]))).toBeLessThan(1e-6);
  });

  it('weights stay PROVISIONAL: the export only has unresolved VariableID references for them', () => {
    const json = tokens.typescale.baseline;
    AWA_TEXT_ROLES.forEach(role => {
      expect(String(json[`static${capital(role)}Weight`])).toMatch(/^VariableID:/);
    });
    // the inferred ordering Regular < Medium < SemiBold (fontTheme names the third one "SemiBold")
    expect(tokens.fontTheme.baseline.staticWeightRegular).toBe('Regular');
    expect(tokens.fontTheme.baseline.staticWeightMedium).toBe('Medium');
    expect(tokens.fontTheme.baseline.staticWeightBold).toBe('SemiBold');
    AWA_TEXT_ROLES.forEach(role => {
      const spec = AWA_TYPESCALE[role];
      expect(Number(spec.fontWeightEmphasized)).toBeGreaterThan(Number(spec.fontWeight));
    });
  });

  it('awaTextStyle is pure, plain and applies the emphasized weight / color / family only when asked', () => {
    const base = awaTextStyle('bodyLarge');
    expect(base).toEqual({fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontWeight: '400'});
    expect(awaTextStyle('bodyLarge')).not.toBe(base);
    expect(awaTextStyle('titleMedium', {emphasized: true, color: '#123456', fontFamily: 'serif'})).toEqual({
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
      fontWeight: '600',
      color: '#123456',
      fontFamily: 'serif',
    });
  });

  it('nearestTextRole and the 11 sp floor', () => {
    expect(AWA_MIN_TEXT_SIZE).toBe(11);
    expect(isBelowTextFloor(10.5)).toBe(true);
    expect(isBelowTextFloor(11)).toBe(false);
    expect(nearestTextRole(14)).toBe('bodyMedium');
    expect(nearestTextRole(16)).toBe('bodyLarge');
    expect(nearestTextRole(57)).toBe('displayLarge');
    expect(nearestTextRole(8.5)).toBe('labelSmall');
    expect(nearestTextRole(13)).toBe('bodyMedium');
  });
});

describe('shapes — verified against material3-tokens-normalized.json', () => {
  it('has exactly the 10 exported corner tokens with the exported values', () => {
    const json = tokens.shape.baseline;
    expect(AWA_SHAPE_TOKENS).toHaveLength(10);
    expect(Object.keys(json)).toHaveLength(10);
    AWA_SHAPE_TOKENS.forEach(token => {
      expect(awaShapes[token]).toBe(json[`corner${capital(token)}`]);
    });
  });

  it('nearestShape: boundaries, ties toward the smaller token, and circles map to full', () => {
    expect(nearestShape(0)).toBe('none');
    expect(nearestShape(12)).toBe('medium');
    expect(nearestShape(13)).toBe('medium');
    expect(nearestShape(14)).toBe('medium'); // tie 12 / 16 -> smaller
    expect(nearestShape(26)).toBe('extraLarge');
    expect(nearestShape(AWA_FULL_RADIUS_THRESHOLD)).toBe('full');
    expect(nearestShape(155)).toBe('full');
  });
});

describe('icon sizes and touch target (AWA decisions, provisional)', () => {
  it('values and nearest mapping', () => {
    expect(awaIconSizes).toEqual({xs: 16, sm: 20, md: 24, lg: 32});
    expect(AWA_MIN_TOUCH_TARGET).toBe(48);
    expect(nearestIconSize(18)).toBe('sm');
    expect(nearestIconSize(22)).toBe('md'); // tie 20 / 24 -> larger (never a smaller glyph)
    expect(nearestIconSize(23)).toBe('md');
    expect(nearestIconSize(24)).toBe('md');
    expect(nearestIconSize(14)).toBe('xs');
    expect(nearestIconSize(40)).toBe('lg');
  });

  it('touchTargetHitSlop extends a small control to 48 and leaves a large one alone', () => {
    expect(touchTargetHitSlop(40)).toEqual({top: 4, bottom: 4, left: 4, right: 4});
    expect(touchTargetHitSlop(44, 40)).toEqual({top: 4, bottom: 4, left: 2, right: 2});
    expect(touchTargetHitSlop(56)).toEqual({top: 0, bottom: 0, left: 0, right: 0});
  });
});

describe('additive spacing scale', () => {
  it('is a 4-dp grid next to (not instead of) the existing spacing module', () => {
    Object.values(awaSpace).forEach(value => expect(value % 4).toBe(0));
    expect(AWA_SCREEN_MARGIN).toBe(16);
    expect(nearestSpace(14)).toBe('s12'); // tie 12 / 16 -> smaller
    expect(nearestSpace(15)).toBe('s16');
    expect(nearestSpace(13)).toBe('s12');
    expect(nearestSpace(0)).toBe('s0');
    // keys are the numeric value, so they can never be confused with spacing.xs / sm / md / lg / xl / xxl
    Object.entries(awaSpace).forEach(([key, value]) => expect(key).toBe(`s${value}`));
  });
});

describe('component dimension proposals are isolated and never presented as verified', () => {
  it('every entry carries a provenance and verified:false', () => {
    expect(AWA_COMPONENT_DIMENSION_KEYS.length).toBeGreaterThan(10);
    AWA_COMPONENT_DIMENSION_KEYS.forEach(key => {
      const entry = AWA_COMPONENT_DIMENSION_PROPOSALS[key];
      expect(entry.verified).toBe(false);
      expect(entry.provenance).toMatch(/^(proposal-m3-docs-unverified|proposal-awa-decision|observed-in-awa)$/);
      expect(entry.note.length).toBeGreaterThan(5);
    });
  });

  it('the floating tab bar pill matches the value spacing.ts already uses (58) and shapes come from the verified set', () => {
    // M2: 48 / 56 are AWA proposals, not Google specifications
    expect(AWA_COMPONENT_DIMENSION_PROPOSALS.button.provenance).toBe('proposal-awa-decision');
    expect(AWA_COMPONENT_DIMENSION_PROPOSALS.button.compact).toBe(40);
    expect(AWA_COMPONENT_DIMENSION_PROPOSALS.floatingTabBarPill.value).toBe(58);
    expect(AWA_COMPONENT_DIMENSION_PROPOSALS.buttonShape.radius).toBe(awaShapes.full);
    expect(AWA_COMPONENT_DIMENSION_PROPOSALS.sheetShape.radius).toBe(awaShapes.extraLarge);
  });
});

describe('contrast utilities', () => {
  it('parses hex and rgba forms and rejects unknown input', () => {
    expect(parseColor('#fff')).toEqual({r: 255, g: 255, b: 255, a: 1});
    expect(parseColor('#6D4AE8')).toEqual({r: 109, g: 74, b: 232, a: 1});
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({r: 10, g: 20, b: 30, a: 0.5});
    expect(parseColor('#00000080').a).toBeCloseTo(0.5, 2);
    expect(() => parseColor('tomato')).toThrow();
    expect(() => parseColor('#12345')).toThrow();
    expect(toHex({r: 109, g: 74, b: 232})).toBe('#6D4AE8');
  });

  it('matches the WCAG reference values', () => {
    expect(wcagLuminance('#000000')).toBeCloseTo(0, 5);
    expect(wcagLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 1);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('composites a translucent foreground over the background before measuring', () => {
    expect(compositeOver('rgba(0, 0, 0, 0.5)', '#FFFFFF')).toEqual({r: 127.5, g: 127.5, b: 127.5});
    expect(contrastRatio('rgba(0, 0, 0, 0.5)', '#FFFFFF')).toBeCloseTo(contrastRatio('#808080', '#FFFFFF'), 1);
    expect(meetsContrast('rgba(0, 0, 0, 0.04)', '#FFFFFF')).toBe(false);
  });

  it('ensureContrast keeps a passing colour, otherwise returns the minimal shift toward the target', () => {
    expect(ensureContrast('#2F2258', '#FCFAFF', WCAG_AA_TEXT, '#000000')).toBe('#2F2258');
    const fixed = ensureContrast('#A08FC7', ['#FCFAFF', '#FFFFFF'], WCAG_AA_TEXT, '#2F2258');
    expect(fixed).not.toBe('#A08FC7');
    expect(contrastRatio(fixed, '#FCFAFF')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(contrastRatio(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    // minimal: a slightly lighter step would fail
    expect(ensureContrast('#A08FC7', ['#FCFAFF', '#FFFFFF'], WCAG_AA_TEXT, '#2F2258')).toBe(fixed);
    // best effort when even the target is not enough
    expect(ensureContrast('#FFFFFF', '#FFFFFF', 4.5, '#FEFEFE')).toBe('#FEFEFE');
  });
});
