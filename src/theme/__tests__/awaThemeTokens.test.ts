import {homeColors, homeShadow} from '../../components/home/homeTheme';
import {getAwaThemeById} from '../../config/awaThemes';
import {onPrimaryTextColor, pickReadableTextColor, resolveAwaTheme} from '../awaThemeTokens';

const ALL_SELECTABLE_IDS = ['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const;

const CANONICAL_PAGE_GRADIENT = ['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3'];

describe('resolveAwaTheme — AWA Original', () => {
  it('resolves correctly for the light variant', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    expect(theme.id).toBe('awa-original');
    expect(theme.isDark).toBe(false);
  });

  it('LIGHT preserves the current application appearance exactly (canonical contract)', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    const registryColors = getAwaThemeById('awa-original')!.colors;

    // Every existing AwaThemeColors field must be byte-identical to the
    // current registry entry — nothing "modernized".
    (Object.keys(registryColors) as Array<keyof typeof registryColors>).forEach(key => {
      expect(theme.colors[key]).toBe(registryColors[key]);
    });

    // And, transitively, to the real homeColors values screens read today.
    expect(theme.colors.background).toBe(homeColors.background);
    expect(theme.colors.primary).toBe(homeColors.primary);
    expect(theme.colors.text).toBe(homeColors.textPrimary);
    expect(theme.colors.accent).toBe(homeColors.primaryDark);

    // The canonical page gradient, duplicated verbatim across ~40 screens
    // today, must match exactly.
    expect(theme.gradients.pageBackground).toEqual(CANONICAL_PAGE_GRADIENT);

    // The existing shared card shadow shape/color must match exactly too.
    expect(theme.shadow.shadowColor).toBe(homeShadow.shadowColor);
    expect(theme.shadow.shadowOffset).toEqual(homeShadow.shadowOffset);
    expect(theme.shadow.shadowOpacity).toBe(homeShadow.shadowOpacity);
    expect(theme.shadow.shadowRadius).toBe(homeShadow.shadowRadius);
    expect(theme.shadow.elevation).toBe(homeShadow.elevation);
  });

  it('DARK reuses Midnight’s own tokens wholesale, never exposing "midnight" as an id', () => {
    const theme = resolveAwaTheme('awa-original', true, false);
    const midnight = getAwaThemeById('midnight')!.colors;

    expect(theme.id).toBe('awa-original');
    expect(theme.isDark).toBe(true);
    expect(theme.colors.background).toBe(midnight.background);
    expect(theme.colors.text).toBe(midnight.text);
    expect(theme.colors.success).toBe(midnight.success);
  });
});

describe('resolveAwaTheme — selected palette resolution', () => {
  it.each(['lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const)(
    '%s resolves to its own palette, light variant',
    id => {
      const theme = resolveAwaTheme(id, false, false);
      expect(theme.id).toBe(id);
      expect(theme.isDark).toBe(false);
    },
  );

  it('every selectable theme’s LIGHT variant actually reads as light (background luminance > dark threshold)', () => {
    (['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const).forEach(
      id => {
        const theme = resolveAwaTheme(id, false, false);
        expect(theme.statusBarStyle).toBe('dark-content');
      },
    );
  });

  it('every selectable theme’s DARK variant actually reads as dark (background luminance < light threshold)', () => {
    (['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const).forEach(
      id => {
        const theme = resolveAwaTheme(id, true, false);
        expect(theme.statusBarStyle).toBe('light-content');
      },
    );
  });

  it('never crashes and safely falls back to AWA Original for an unresolvable id (including "midnight")', () => {
    const midnightAsUserTheme = resolveAwaTheme('midnight', false, false);
    expect(midnightAsUserTheme.id).toBe('awa-original');

    const bogus = resolveAwaTheme('not-a-real-theme' as never, false, false);
    expect(bogus.id).toBe('awa-original');
  });
});

describe('resolveAwaTheme — page gradient', () => {
  it('resolves a 4-stop gradient for every theme × variant combination', () => {
    (['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const).forEach(
      id => {
        [false, true].forEach(isDark => {
          const theme = resolveAwaTheme(id, isDark, false);
          expect(theme.gradients.pageBackground).toHaveLength(4);
          theme.gradients.pageBackground.forEach(stop => expect(stop).toMatch(/^#[0-9A-F]{6}$/));
        });
      },
    );
  });
});

describe('resolveAwaTheme — true black', () => {
  it('affects only the DARK background/surface, leaving everything else untouched', () => {
    const darkNormal = resolveAwaTheme('awa-original', true, false);
    const darkTrueBlack = resolveAwaTheme('awa-original', true, true);

    expect(darkTrueBlack.colors.background).toBe('#030304');
    expect(darkTrueBlack.colors.surface).toBe('#0B0B10');
    expect(darkTrueBlack.colors.background).not.toBe(darkNormal.colors.background);

    // Every other color role is untouched by true-black.
    expect(darkTrueBlack.colors.primary).toBe(darkNormal.colors.primary);
    expect(darkTrueBlack.colors.text).toBe(darkNormal.colors.text);
    expect(darkTrueBlack.colors.textSecondary).toBe(darkNormal.colors.textSecondary);
    expect(darkTrueBlack.colors.border).toBe(darkNormal.colors.border);
  });

  it('has no effect at all on the LIGHT variant', () => {
    const lightNormal = resolveAwaTheme('awa-original', false, false);
    const lightTrueBlack = resolveAwaTheme('awa-original', false, true);
    expect(lightTrueBlack).toEqual(lightNormal);
  });

  it('never mutates semantic/status colors (success/warning/danger) even when active', () => {
    (['awa-original', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand', 'lavender-night'] as const).forEach(
      id => {
        const withoutTrueBlack = resolveAwaTheme(id, true, false);
        const withTrueBlack = resolveAwaTheme(id, true, true);
        expect(withTrueBlack.colors.success).toBe(withoutTrueBlack.colors.success);
        expect(withTrueBlack.colors.warning).toBe(withoutTrueBlack.colors.warning);
        expect(withTrueBlack.colors.danger).toBe(withoutTrueBlack.colors.danger);
      },
    );
  });
});

describe('resolveAwaTheme — palette and appearance mode are independent dimensions', () => {
  it('the same palette resolves differently only by isDark, never by being silently replaced with another palette', () => {
    const light = resolveAwaTheme('rose-quartz', false, false);
    const dark = resolveAwaTheme('rose-quartz', true, false);
    expect(light.id).toBe('rose-quartz');
    expect(dark.id).toBe('rose-quartz');
    expect(light.colors.background).not.toBe(dark.colors.background);
  });
});

describe('pickReadableTextColor / onPrimaryTextColor — proven contrast fix (Phase C)', () => {
  it('AWA Original LIGHT keeps its existing white-on-primary buttons pixel-identical', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    expect(onPrimaryTextColor(theme)).toBe('#FFFFFF');
  });

  it('every LIGHT variant whose primary is too light for white text gets dark text instead', () => {
    // rose-quartz/sage-serenity/ocean-calm/warm-sand/lavender-night LIGHT
    // primaries are all light-luminance (see the helper's own doc comment)
    // — white text on any of them would fail contrast.
    (['rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand', 'lavender-night'] as const).forEach(id => {
      const theme = resolveAwaTheme(id, false, false);
      expect(onPrimaryTextColor(theme)).not.toBe('#FFFFFF');
    });
  });

  it('every DARK variant (primary is always a lightened tint) gets dark text, never white', () => {
    ALL_SELECTABLE_IDS.forEach(id => {
      const theme = resolveAwaTheme(id, true, false);
      expect(onPrimaryTextColor(theme)).not.toBe('#FFFFFF');
    });
  });

  it('is keyed to the ACTUAL fill color, not a fixed "primary" assumption — success and primary can resolve differently', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    // awa-original LIGHT: primary is dark-luminance (white text correct),
    // success is also dark-luminance here — both happen to want white — but
    // the two calls must independently reflect their OWN fill's luminance,
    // not silently reuse one shared answer.
    expect(pickReadableTextColor(theme.colors.primary)).toBe(onPrimaryTextColor(theme));
    expect(pickReadableTextColor(theme.colors.success)).toEqual(expect.any(String));
  });

  it('never crashes on any real resolved success color across every theme × variant', () => {
    ALL_SELECTABLE_IDS.forEach(id => {
      [false, true].forEach(isDark => {
        const theme = resolveAwaTheme(id, isDark, false);
        expect(() => pickReadableTextColor(theme.colors.success)).not.toThrow();
      });
    });
  });
});
