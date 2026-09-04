import {homeColors} from '../components/home/homeTheme';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Tous les identifiants de thèmes disponibles dans AWA.
 *
 * Midnight reste dans le registre pour pouvoir utiliser
 * ses couleurs comme base technique du mode sombre,
 * mais il n'est plus affiché comme palette sélectionnable.
 */
export type AwaThemeId =
  | 'awa-original'
  | 'lavender-night'
  | 'rose-quartz'
  | 'sage-serenity'
  | 'ocean-calm'
  | 'warm-sand'
  | 'midnight';

export type AwaThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  navigation: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
};

export type AwaTheme = {
  id: AwaThemeId;
  name: string;
  description: string;
  isPremium: boolean;
  enabled: boolean;
  displayOrder: number;
  colors: AwaThemeColors;
};

/* -------------------------------------------------------------------------- */
/*                              DEFAULT THEME                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_AWA_THEME_ID: AwaThemeId =
  'awa-original';

/* -------------------------------------------------------------------------- */
/*                               THEME REGISTRY                               */
/* -------------------------------------------------------------------------- */

export const AWA_THEMES: readonly AwaTheme[] = [
  /* ---------------------------------------------------------------------- */
  /* AWA ORIGINAL                                                           */
  /* ---------------------------------------------------------------------- */

  {
    id: 'awa-original',

    name: 'AWA Original',

    description: 'Doux et harmonieux',

    isPremium: false,

    enabled: true,

    displayOrder: 0,

    colors: {
      background: homeColors.background,

      surface: '#FFFFFF',

      surfaceSecondary:
        homeColors.lightLavender,

      primary:
        homeColors.primary,

      primarySoft:
        homeColors.lightLavender,

      secondary:
        homeColors.pink,

      text:
        homeColors.textPrimary,

      textSecondary:
        homeColors.textSecondary,

      border:
        homeColors.cardBorder,

      navigation:
        '#FFFFFF',

      accent:
        homeColors.primaryDark,

      success:
        homeColors.green,

      warning:
        '#D89A3E',

      danger:
        '#D9534F',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* LAVENDER NIGHT                                                         */
  /* ---------------------------------------------------------------------- */

  {
    id: 'lavender-night',

    name: 'Lavender Night',

    description: 'Élégant et apaisant',

    isPremium: true,

    enabled: true,

    displayOrder: 1,

    colors: {
      background:
        '#1C1730',

      surface:
        '#2A2145',

      surfaceSecondary:
        '#342A56',

      primary:
        '#B79CF2',

      primarySoft:
        '#3A2F5C',

      secondary:
        '#8C74D6',

      text:
        '#F5F1FF',

      textSecondary:
        '#C6BBE0',

      border:
        'rgba(183,156,242,0.22)',

      navigation:
        '#241C3D',

      accent:
        '#D6C6FF',

      success:
        '#7FCB9C',

      warning:
        '#E0B15C',

      danger:
        '#E0798A',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* ROSE QUARTZ                                                            */
  /* ---------------------------------------------------------------------- */

  {
    id: 'rose-quartz',

    name: 'Rose Quartz',

    description: 'Doux et féminin',

    isPremium: true,

    enabled: true,

    displayOrder: 2,

    colors: {
      background:
        '#FBF3F1',

      surface:
        '#FFFFFF',

      surfaceSecondary:
        '#F3DEDD',

      primary:
        '#C08B93',

      primarySoft:
        '#F3DEDD',

      secondary:
        '#D9AFAE',

      text:
        '#4A2E37',

      textSecondary:
        '#8C6E75',

      border:
        'rgba(192,139,147,0.20)',

      navigation:
        '#FFFFFF',

      accent:
        '#7A4A57',

      success:
        '#7CA687',

      warning:
        '#D2A15A',

      danger:
        '#C15C60',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* SAGE SERENITY                                                          */
  /* ---------------------------------------------------------------------- */

  {
    id: 'sage-serenity',

    name: 'Sage Serenity',

    description: 'Naturel et équilibré',

    isPremium: true,

    enabled: true,

    displayOrder: 3,

    colors: {
      background:
        '#F6F5EE',

      surface:
        '#FFFFFF',

      surfaceSecondary:
        '#E7EDDF',

      primary:
        '#7C9473',

      primarySoft:
        '#E7EDDF',

      secondary:
        '#A9B98F',

      text:
        '#3B3A2E',

      textSecondary:
        '#75816B',

      border:
        'rgba(124,148,115,0.18)',

      navigation:
        '#FFFFFF',

      accent:
        '#5C7355',

      success:
        '#6E9C6A',

      warning:
        '#C9974C',

      danger:
        '#C1594F',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* OCEAN CALM                                                             */
  /* ---------------------------------------------------------------------- */

  {
    id: 'ocean-calm',

    name: 'Ocean Calm',

    description: 'Calme et rafraîchissant',

    isPremium: true,

    enabled: true,

    displayOrder: 4,

    colors: {
      background:
        '#F2F7F9',

      surface:
        '#FFFFFF',

      surfaceSecondary:
        '#DDEAF0',

      primary:
        '#5C8CA6',

      primarySoft:
        '#DDEAF0',

      secondary:
        '#8FB4C4',

      text:
        '#233238',

      textSecondary:
        '#5F7680',

      border:
        'rgba(92,140,166,0.18)',

      navigation:
        '#FFFFFF',

      accent:
        '#3E6B80',

      success:
        '#5FA089',

      warning:
        '#CC9C52',

      danger:
        '#C15E5E',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* WARM SAND                                                              */
  /* ---------------------------------------------------------------------- */

  {
    id: 'warm-sand',

    name: 'Warm Sand',

    description: 'Chaleureux et naturel',

    isPremium: true,

    enabled: true,

    displayOrder: 5,

    colors: {
      background:
        '#FAF5EC',

      surface:
        '#FFFFFF',

      surfaceSecondary:
        '#EFE1CC',

      primary:
        '#B08A5C',

      primarySoft:
        '#EFE1CC',

      secondary:
        '#CBA97C',

      text:
        '#4A3A28',

      textSecondary:
        '#8A755E',

      border:
        'rgba(176,138,92,0.20)',

      navigation:
        '#FFFFFF',

      accent:
        '#7E5E3A',

      success:
        '#7A9C63',

      warning:
        '#C68A3E',

      danger:
        '#C16250',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* MIDNIGHT — INTERNAL DARK TOKENS ONLY                                   */
  /* ---------------------------------------------------------------------- */

  {
    id: 'midnight',

    name: 'Midnight',

    description: 'Profond et sophistiqué',

    isPremium: true,

    /*
     * IMPORTANT :
     * false = ne sera plus affiché dans getEnabledAwaThemes().
     *
     * On garde néanmoins le thème ici pour que :
     *
     * getAwaThemeById('midnight')
     *
     * continue de fonctionner pour AppearanceScreen.
     */
    enabled: false,

    displayOrder: 6,

    colors: {
      background:
        '#12111C',

      surface:
        '#1C1A2B',

      surfaceSecondary:
        '#242238',

      primary:
        '#9C8CE0',

      primarySoft:
        '#282544',

      secondary:
        '#6E64A8',

      text:
        '#F1EFFA',

      textSecondary:
        '#B3AECB',

      border:
        'rgba(156,140,224,0.18)',

      navigation:
        '#17152400',

      accent:
        '#C9BEFA',

      success:
        '#6FB58C',

      warning:
        '#D0A25C',

      danger:
        '#D97C88',
    },
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                              GET ENABLED THEMES                            */
/* -------------------------------------------------------------------------- */

/**
 * Retourne uniquement les thèmes qui doivent
 * apparaître dans le sélecteur d'apparence.
 *
 * Midnight étant enabled:false, il n'apparaîtra plus ici.
 */
export function getEnabledAwaThemes(): AwaTheme[] {
  return [...AWA_THEMES]
    .filter(theme => theme.enabled)
    .sort(
      (a, b) =>
        a.displayOrder -
        b.displayOrder,
    );
}

/* -------------------------------------------------------------------------- */
/*                               GET BY ID                                    */
/* -------------------------------------------------------------------------- */

/**
 * Retourne un thème, même s'il est disabled.
 *
 * C'est important car AppearanceScreen utilise encore
 * Midnight comme base technique de son mode sombre.
 */
export function getAwaThemeById(
  id: AwaThemeId,
): AwaTheme | undefined {
  return AWA_THEMES.find(
    theme =>
      theme.id === id,
  );
}

/* -------------------------------------------------------------------------- */
/*                              VALIDATE THEME                                */
/* -------------------------------------------------------------------------- */

export function isValidAwaThemeId(
  value: unknown,
): value is AwaThemeId {
  return (
    typeof value === 'string' &&
    AWA_THEMES.some(
      theme =>
        theme.id === value,
    )
  );
}

/* -------------------------------------------------------------------------- */
/*                              THEME TAP RESULT                              */
/* -------------------------------------------------------------------------- */

export type AwaThemeTapOutcome =
  | {
      action: 'select';
    }
  | {
      action: 'requiresPremium';
    };

/**
 * AWA Original est gratuit.
 *
 * Tous les autres thèmes visibles nécessitent Premium.
 */
export function resolveAwaThemeTap(
  theme: Pick<
    AwaTheme,
    'isPremium'
  >,
  isPremium: boolean,
): AwaThemeTapOutcome {
  if (
    !theme.isPremium ||
    isPremium
  ) {
    return {
      action: 'select',
    };
  }

  return {
    action:
      'requiresPremium',
  };
}

/* -------------------------------------------------------------------------- */
/*                           EFFECTIVE THEME                                  */
/* -------------------------------------------------------------------------- */

/**
 * Si l'utilisateur avait sélectionné un thème Premium,
 * mais n'a plus Premium, on revient automatiquement
 * vers AWA Original.
 */
export function resolveEffectiveThemeId(
  savedThemeId: AwaThemeId,
  isPremium: boolean,
): AwaThemeId {
  const theme =
    getAwaThemeById(
      savedThemeId,
    );

  if (
    !theme ||
    (
      theme.isPremium &&
      !isPremium
    )
  ) {
    return DEFAULT_AWA_THEME_ID;
  }

  return savedThemeId;
}