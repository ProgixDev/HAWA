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
import {useTranslation} from 'react-i18next';

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
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {setHasCompletedOnboarding} from '../state/onboardingPreferences';

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
  t,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, options?: Record<string, unknown>) => string;
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
      accessibilityLabel={t('anonymous.avatar.colorSwatchA11y', {color})}
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
  const {t} = useTranslation();
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
    // THE single real "onboarding completed" boundary — see the section
    // comment on setHasCompletedOnboarding() in onboardingPreferences.ts.
    // Fire-and-forget: never blocks entering the app, and a failed write
    // just means SplashScreen shows Welcome again next cold launch, which is
    // safe (never loses data, never blocks the app) rather than silently
    // wrong in the other direction.
    setHasCompletedOnboarding(true).catch(() => {});
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
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            icon="arrow-left"
            onPress={navigation.goBack}
          />

          <View style={styles.headerCenter}>
            <AwaText
              accessibilityRole="header"
              style={styles.headerTitle}
              variant="titleMedium">
              {t('anonymous.avatar.headerTitle')}
            </AwaText>
          </View>

          <AwaButton
            accessibilityLabel={t('common.save')}
            hitSlop={8}
            label={t('common.save')}
            onPress={save}
            size="compact"
            style={styles.saveButton}
            variant="text"
          />
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
              <AwaText colorRole="primary" variant="labelMedium">
                {t('anonymous.avatar.eyebrow')}
              </AwaText>

              <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">
                {t('anonymous.avatar.title')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                {t('anonymous.avatar.subtitle')}
              </AwaText>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                         AVATAR PREVIEW                      */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={60}>
            <View style={styles.previewSection}>
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
              </View>

              <View style={styles.privateBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="lock-outline"
                  size={14}
                />

                <AwaText style={styles.privateBadgeText} variant="labelMedium">
                  {t('anonymous.avatar.privateProfile')}
                </AwaText>
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
                  <AwaText variant="titleMedium">
                    {t('anonymous.avatar.colorSectionTitle')}
                  </AwaText>

                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                    {t('anonymous.avatar.colorSectionDescription')}
                  </AwaText>
                </View>
              </View>

              <AwaCard padding="compact" style={styles.colorCard} variant="filled">
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
                      t={t}
                    />
                  ))}
                </ScrollView>
              </AwaCard>
            </View>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                              STYLE                         */}
          {/* ---------------------------------------------------------- */}

          <FadeInUp delay={160}>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionTextContainer}>
                  <AwaText variant="titleMedium">
                    {t('anonymous.avatar.styleSectionTitle')}
                  </AwaText>

                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                    {t('anonymous.avatar.styleSectionDescription')}
                  </AwaText>
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
            <AwaCard padding="compact" style={styles.infoCard} variant="filled">
              <View style={styles.infoIconContainer}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-lock-outline"
                  size={21}
                />
              </View>

              <View style={styles.infoContent}>
                <AwaText variant="titleSmall">
                  {t('anonymous.avatar.infoTitle')}
                </AwaText>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('anonymous.avatar.infoText')}
                </AwaText>
              </View>
            </AwaCard>
          </FadeInUp>

          {/* ---------------------------------------------------------- */}
          {/*                       AUTH CONTINUE BUTTON                  */}
          {/* ---------------------------------------------------------- */}

          {fromAuth ? (
            <FadeInUp delay={250}>
              <View style={styles.authActions}>
                <AwaButton
                  accessibilityLabel={t('anonymous.avatar.saveAndContinue')}
                  fullWidth
                  label={t('anonymous.avatar.saveAndContinue')}
                  onPress={save}
                  size="large"
                />
                <AwaButton
                  accessibilityLabel={t('anonymous.avatar.later')}
                  fullWidth
                  hitSlop={8}
                  label={t('anonymous.avatar.later')}
                  onPress={skip}
                  style={styles.skipButton}
                  variant="text"
                />
              </View>
            </FadeInUp>
          ) : (
            <FadeInUp delay={250}>
              <AwaButton
                accessibilityLabel={t('anonymous.avatar.saveChanges')}
                fullWidth
                icon="check"
                label={t('anonymous.avatar.saveChanges')}
                onPress={save}
                size="large"
                style={styles.bottomSaveButton}
              />
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
  /*                                HEADER                                  */
  /* ---------------------------------------------------------------------- */

  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },


  headerCenter: {
    flex: 1,
    minWidth: 0,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 6,
  },

  headerTitle: {width: '100%', textAlign: 'center'},

  pressOpacity: {
    opacity: 0.72,
  },
  saveButton: {minWidth: 72, maxWidth: 110, flexShrink: 1},


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


  title: {maxWidth: 330, textAlign: 'center'},

  subtitle: {maxWidth: 330, marginTop: 8, textAlign: 'center'},

  /* ---------------------------------------------------------------------- */
  /*                               PREVIEW                                  */
  /* ---------------------------------------------------------------------- */

  previewSection: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 8,
  },


  previewHalo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
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



  /* ---------------------------------------------------------------------- */
  /*                              COLOR CARD                                */
  /* ---------------------------------------------------------------------- */

  colorCard: {},

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
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  styleOptionCompact: {
    minHeight: 104,
    paddingHorizontal: 12,
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

  infoCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 24},

  infoIconContainer: {width: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center'},

  infoContent: {
    flex: 1,
    minWidth: 0,
  },



  /* ---------------------------------------------------------------------- */
  /*                               ACTIONS                                  */
  /* ---------------------------------------------------------------------- */

  authActions: {
    marginTop: 22,
  },



  bottomSaveButton: {
    marginTop: 22,
  },

  skipButton: {marginTop: 8},



  });
}