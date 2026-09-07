import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import AnonymousAvatar, {
  ANONYMOUS_AVATAR_COLORS,
  ANONYMOUS_AVATAR_STYLES,
} from '../components/profile/AnonymousAvatar';

import {
  getProfileAvatarPreferences,
  hydrateProfileAvatarPreferences,
  setAnonymousAvatarPreferences,
  type AnonymousAvatarStyleId,
} from '../state/profileAvatarPreferences';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AnonymousAvatarCustomizer'
>;

/* -------------------------------------------------------------------------- */
/*                                ANIMATIONS                                  */
/* -------------------------------------------------------------------------- */

function FadeInUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               COLOR SWATCH                                 */
/* -------------------------------------------------------------------------- */

function ColorSwatch({
  color,
  selected,
  onPress,
  styles,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const scale = useRef(new Animated.Value(selected ? 1.07 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.07 : 1,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <Pressable
      accessibilityLabel={`Couleur ${color}`}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      hitSlop={4}
      onPress={onPress}
      style={({pressed}) => [
        styles.colorSlot,
        pressed && styles.pressOpacity,
      ]}>
      <Animated.View
        style={[
          styles.colorOuter,
          selected && styles.colorOuterSelected,
          {
            transform: [{scale}],
          },
        ]}>
        <View
          style={[
            styles.colorSwatch,
            {
              backgroundColor: color,
            },
          ]}>
          {selected ? (
            <MaterialDesignIcons
              color="#FFFFFF"
              name="check-bold"
              size={15}
            />
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                               STYLE OPTION                                 */
/* -------------------------------------------------------------------------- */

function StyleOption({
  color,
  label,
  selected,
  styleId,
  onPress,
  compact,
  theme,
  styles,
}: {
  color: string;
  label: string;
  selected: boolean;
  styleId: AnonymousAvatarStyleId;
  onPress: () => void;
  compact: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const scale = useRef(new Animated.Value(selected ? 1.03 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.03 : 1,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  const avatarSize = compact ? 50 : 56;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.styleOption,
        compact && styles.styleOptionCompact,
        selected && styles.styleOptionSelected,
        pressed && styles.pressOpacity,
      ]}>
      <Animated.View
        style={[
          styles.styleAvatarArea,
          {
            transform: [{scale}],
          },
        ]}>
        <View
          style={[
            styles.styleAvatarHalo,
            selected && styles.styleAvatarHaloSelected,
          ]}>
          <AnonymousAvatar
            color={color}
            size={avatarSize}
            style={styleId}
          />
        </View>

        {selected ? (
          <View style={styles.checkBadge}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check-bold"
              size={10}
            />
          </View>
        ) : null}
      </Animated.View>

      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[
          styles.styleLabel,
          selected && styles.styleLabelSelected,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 SCREEN                                     */
/* -------------------------------------------------------------------------- */

export default function AnonymousAvatarCustomizerScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const fromAuth = route.params?.source === 'auth';

  const isSmallScreen = width < 360;
  const isShortScreen = height < 700;

  const horizontalPadding = isSmallScreen ? 14 : 18;
  const previewAvatarSize = isSmallScreen || isShortScreen ? 92 : 104;
  const previewContainerSize = previewAvatarSize + 34;

  const [draftStyle, setDraftStyle] =
    useState<AnonymousAvatarStyleId>(
      () => getProfileAvatarPreferences().anonymousAvatarStyle,
    );

  const [draftColor, setDraftColor] = useState<string>(
    () => getProfileAvatarPreferences().anonymousAvatarColor,
  );

  useEffect(() => {
    let active = true;

    hydrateProfileAvatarPreferences().then(value => {
      if (!active) {
        return;
      }

      setDraftStyle(value.anonymousAvatarStyle);
      setDraftColor(value.anonymousAvatarColor);
    });

    return () => {
      active = false;
    };
  }, []);

  const enterApp = () => {
    navigation.replace('MainTabs', {
      screen: 'CycleHome',
    });
  };

  const save = () => {
    setAnonymousAvatarPreferences(draftStyle, draftColor);

    if (fromAuth) {
      enterApp();
      return;
    }

    navigation.goBack();
  };

  const skip = () => {
    enterApp();
  };

  return (
    <View style={styles.page}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      {/* -------------------------------------------------------------- */}
      {/*                    BACKGROUND DECORATION                        */}
      {/* -------------------------------------------------------------- */}

      <View
        pointerEvents="none"
        style={styles.backgroundDecoration}>
        <View style={styles.glowTop} />
        <View style={styles.glowLeft} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.safe}>
        {/* ------------------------------------------------------------ */}
        {/*                              HEADER                          */}
        {/* ------------------------------------------------------------ */}

        <View
          style={[
            styles.header,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.headerIconButton,
              pressed && styles.pressOpacity,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.accent}
              name="arrow-left"
              size={21}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={styles.headerTitle}>
              Personnaliser mon avatar
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Enregistrer"
            accessibilityRole="button"
            hitSlop={8}
            onPress={save}
            style={({pressed}) => [
              styles.saveButton,
              pressed && styles.pressOpacity,
            ]}>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={styles.saveText}>
              Enregistrer
            </Text>
          </Pressable>
        </View>

        {/* ------------------------------------------------------------ */}
        {/*                          SCROLL CONTENT                       */}
        {/* ------------------------------------------------------------ */}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(insets.bottom, 18) + 28,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* ---------------------------------------------------------- */}
          {/*                            INTRO                           */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>
                TON PROFIL ANONYME
              </Text>

              <Text style={styles.title}>
                Crée un avatar qui te ressemble
              </Text>

              <Text style={styles.subtitle}>
                Choisis simplement un style et une couleur. Aucune photo
                personnelle n’est nécessaire.
              </Text>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                         AVATAR PREVIEW                      */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={60}>
            <View style={styles.previewSection}>
              <View
                style={[
                  styles.previewOuterRing,
                  {
                    width: previewContainerSize + 18,
                    height: previewContainerSize + 18,
                    borderRadius: (previewContainerSize + 18) / 2,
                  },
                ]}>
                <View
                  style={[
                    styles.previewHalo,
                    {
                      width: previewContainerSize,
                      height: previewContainerSize,
                      borderRadius: previewContainerSize / 2,
                    },
                  ]}>
                  <AnonymousAvatar
                    color={draftColor}
                    size={previewAvatarSize}
                    style={draftStyle}
                  />

                  <View style={styles.previewSecurityBadge}>
                    <MaterialDesignIcons
                      color={onPrimaryTextColor(theme)}
                      name="shield-check"
                      size={15}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.privateBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="lock-outline"
                  size={14}
                />

                <Text style={styles.privateBadgeText}>
                  Profil privé
                </Text>
              </View>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                             COLOR                          */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={110}>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Choisis une couleur
                  </Text>

                  <Text style={styles.sectionDescription}>
                    Sélectionne la teinte de ton avatar.
                  </Text>
                </View>
              </View>

              <View style={styles.colorCard}>
                <ScrollView
                  contentContainerStyle={styles.colorRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {ANONYMOUS_AVATAR_COLORS.map(color => (
                    <ColorSwatch
                      color={color}
                      key={color}
                      onPress={() => setDraftColor(color)}
                      selected={draftColor === color}
                      styles={styles}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                              STYLE                         */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={160}>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionTextContainer}>
                  <Text style={styles.sectionTitle}>
                    Choisis ton style
                  </Text>

                  <Text style={styles.sectionDescription}>
                    Tu pourras le modifier plus tard depuis ton profil.
                  </Text>
                </View>
              </View>

              <View style={styles.styleGrid}>
                {ANONYMOUS_AVATAR_STYLES.map(item => (
                  <StyleOption
                    color={draftColor}
                    compact={isSmallScreen}
                    key={item.id}
                    label={item.label}
                    onPress={() => setDraftStyle(item.id)}
                    selected={draftStyle === item.id}
                    styleId={item.id}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                           PRIVACY CARD                      */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={210}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-lock-outline"
                  size={21}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  Ta confidentialité avant tout
                </Text>

                <Text style={styles.infoText}>
                  Cet avatar remplace ta photo tant que le mode anonyme
                  est actif. Aucune photo réelle n’est utilisée pour ton
                  profil.
                </Text>
              </View>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                       AUTH CONTINUE BUTTON                  */}
          {/* ---------------------------------------------------------- */}

          {fromAuth ? (
            <FadeInUp delay={250}>
              <View style={styles.authActions}>
                <Pressable
                  accessibilityLabel="Enregistrer et continuer"
                  accessibilityRole="button"
                  onPress={save}
                  style={({pressed}) => [
                    styles.continueButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.continueButtonText}>
                    Enregistrer et continuer
                  </Text>

                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name="arrow-right"
                    size={20}
                  />
                </Pressable>

                <Pressable
                  accessibilityLabel="Plus tard"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={skip}
                  style={({pressed}) => [
                    styles.skipButton,
                    pressed && styles.pressOpacity,
                  ]}>
                  <Text style={styles.skipText}>
                    Plus tard
                  </Text>
                </Pressable>
              </View>
            </FadeInUp>
          ) : (
            <FadeInUp delay={250}>
              <Pressable
                accessibilityLabel="Enregistrer les modifications"
                accessibilityRole="button"
                onPress={save}
                style={({pressed}) => [
                  styles.continueButton,
                  styles.bottomSaveButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.continueButtonText}>
                  Enregistrer les modifications
                </Text>

                <MaterialDesignIcons
                  color={onPrimaryTextColor(theme)}
                  name="check"
                  size={20}
                />
              </Pressable>
            </FadeInUp>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  safe: {
    flex: 1,
  },

  /* ---------------------------------------------------------------------- */
  /*                              BACKGROUND                                */
  /* ---------------------------------------------------------------------- */

  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: withAlpha(theme.colors.primary, 0.09),
  },

  glowLeft: {
    position: 'absolute',
    top: 280,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.primary, 0.055),
  },

  /* ---------------------------------------------------------------------- */
  /*                                HEADER                                  */
  /* ---------------------------------------------------------------------- */

  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },

  headerIconButton: {
    width: 42,
    height: 42,
    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor: withAlpha(theme.colors.surface, 0.92),

    borderWidth: 1,
    borderColor: theme.colors.border,

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,

    elevation: 2,
  },

  headerCenter: {
    flex: 1,
    minWidth: 0,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 6,
  },

  headerTitle: {
    width: '100%',

    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',

    textAlign: 'center',
  },

  saveButton: {
    minWidth: 72,
    maxWidth: 90,
    minHeight: 42,

    flexShrink: 1,

    alignItems: 'flex-end',
    justifyContent: 'center',

    paddingLeft: 5,
  },

  saveText: {
    color: theme.colors.primary,
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* ---------------------------------------------------------------------- */
  /*                                CONTENT                                 */
  /* ---------------------------------------------------------------------- */

  content: {
    flexGrow: 1,
    paddingTop: 10,
  },

  /* ---------------------------------------------------------------------- */
  /*                                 INTRO                                  */
  /* ---------------------------------------------------------------------- */

  intro: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },

  eyebrow: {
    marginBottom: 8,

    color: theme.colors.primary,

    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,

    textAlign: 'center',
  },

  title: {
    maxWidth: 330,

    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',

    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 330,

    marginTop: 9,

    color: theme.colors.textSecondary,

    fontSize: 13,
    lineHeight: 19,

    textAlign: 'center',
  },

  /* ---------------------------------------------------------------------- */
  /*                               PREVIEW                                  */
  /* ---------------------------------------------------------------------- */

  previewSection: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 8,
  },

  previewOuterRing: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: withAlpha(theme.colors.surface, 0.55),

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.13),
  },

  previewHalo: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.surface, 0.9),

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.11,
    shadowRadius: 16,

    elevation: 4,
  },

  previewSecurityBadge: {
    position: 'absolute',
    right: 3,
    bottom: 8,

    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor: theme.colors.primary,

    borderWidth: 3,
    borderColor: theme.colors.background,
  },

  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    marginTop: 12,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: theme.colors.primarySoft,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  privateBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  /* ---------------------------------------------------------------------- */
  /*                               SECTIONS                                 */
  /* ---------------------------------------------------------------------- */

  section: {
    marginTop: 19,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 11,
  },

  sectionTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  sectionDescription: {
    marginTop: 3,

    color: theme.colors.textMuted,

    fontSize: 11.5,
    lineHeight: 16,
  },

  /* ---------------------------------------------------------------------- */
  /*                              COLOR CARD                                */
  /* ---------------------------------------------------------------------- */

  colorCard: {
    paddingVertical: 12,
    paddingHorizontal: 10,

    borderRadius: 20,

    backgroundColor: withAlpha(theme.colors.surface, 0.88),

    borderWidth: 1,
    borderColor: theme.colors.border,

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,

    elevation: 1,
  },

  colorRow: {
    alignItems: 'center',
    gap: 10,

    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  colorSlot: {
    width: 48,
    height: 48,

    alignItems: 'center',
    justifyContent: 'center',
  },

  colorOuter: {
    width: 46,
    height: 46,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 23,

    borderWidth: 2,
    borderColor: 'transparent',
  },

  colorOuterSelected: {
    borderColor: theme.colors.primary,
  },

  colorSwatch: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 19,

    borderWidth: 2,
    borderColor: theme.colors.surface,

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,

    elevation: 2,
  },

  /* ---------------------------------------------------------------------- */
  /*                               STYLE GRID                               */
  /* ---------------------------------------------------------------------- */

  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',

    rowGap: 12,
  },

  styleOption: {
    width: '31.5%',
    minHeight: 112,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 5,
    paddingVertical: 11,

    borderRadius: 20,

    backgroundColor: withAlpha(theme.colors.surface, 0.88),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  styleOptionCompact: {
    minHeight: 104,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },

  styleOptionSelected: {
    borderColor: theme.colors.primary,

    backgroundColor: theme.colors.primarySoft,

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.09,
    shadowRadius: 10,

    elevation: 2,
  },

  styleAvatarArea: {
    position: 'relative',

    alignItems: 'center',
    justifyContent: 'center',
  },

  styleAvatarHalo: {
    width: 64,
    height: 64,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 32,

    backgroundColor: theme.colors.primarySoft,
  },

  styleAvatarHaloSelected: {
    backgroundColor: theme.colors.primarySoft,
  },

  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,

    width: 20,
    height: 20,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: theme.colors.primary,

    borderWidth: 2,
    borderColor: theme.colors.surface,
  },

  styleLabel: {
    width: '100%',

    marginTop: 7,

    color: theme.colors.textSecondary,

    fontSize: 11,
    lineHeight: 15,

    textAlign: 'center',
  },

  styleLabelSelected: {
    color: theme.colors.accent,
    fontWeight: '700',
  },

  /* ---------------------------------------------------------------------- */
  /*                             PRIVACY CARD                               */
  /* ---------------------------------------------------------------------- */

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 12,

    marginTop: 24,

    paddingHorizontal: 14,
    paddingVertical: 15,

    borderRadius: 20,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIconContainer: {
    width: 40,
    height: 40,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: theme.colors.surface,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoTitle: {
    color: theme.colors.text,

    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,
  },

  /* ---------------------------------------------------------------------- */
  /*                               ACTIONS                                  */
  /* ---------------------------------------------------------------------- */

  authActions: {
    marginTop: 22,
  },

  continueButton: {
    width: '100%',
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    paddingHorizontal: 18,
    paddingVertical: 14,

    borderRadius: 18,

    backgroundColor: theme.colors.primary,

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,

    elevation: 4,
  },

  continueButtonText: {
    flexShrink: 1,

    color: onPrimaryTextColor(theme),

    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',

    textAlign: 'center',
  },

  bottomSaveButton: {
    marginTop: 22,
  },

  skipButton: {
    minHeight: 48,

    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 7,
    paddingHorizontal: 18,
  },

  skipText: {
    color: theme.colors.primary,

    fontSize: 13.5,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [{scale: 0.985}],
  },

  pressOpacity: {
    opacity: 0.72,
  },
  });
}