import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getTopPadding,
  spacing,
} from '../theme/spacing';
import {
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  updatePrivacySecuritySettings,
} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'SecuritySetup'
  >;

type IconName =
  React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];

type OptionProps = {
  compact: boolean;
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (
    value: boolean,
  ) => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<
    typeof createStyles
  >;
};

function SecurityOption({
  compact,
  icon,
  title,
  description,
  value,
  onValueChange,
  theme,
  styles,
}: OptionProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.option,
        compact &&
          styles.optionCompact,
      ]}>
      <View
        style={[
          styles.iconBox,
          value &&
            styles.iconBoxActive,
          compact &&
            styles.iconBoxCompact,
        ]}>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={compact ? 23 : 26}
        />
      </View>

      <View
        style={
          styles.optionCopy
        }>
        <View
          style={
            styles.optionTitleRow
          }>
          <Text
            style={[
              styles.optionTitle,
              compact &&
                styles.optionTitleCompact,
            ]}>
            {title}
          </Text>

          {value ? (
            <View
              style={
                styles.activeBadge
              }>
              <MaterialDesignIcons
                color={theme.colors.success}
                name="check"
                size={12}
              />

              <Text
                style={
                  styles.activeBadgeText
                }>
                Activé
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.optionDescription,
            compact &&
              styles.optionDescriptionCompact,
          ]}>
          {description}
        </Text>
      </View>

      <Switch
        ios_backgroundColor={theme.colors.primarySoft}
        onValueChange={
          onValueChange
        }
        thumbColor={theme.colors.surface}
        trackColor={{
          false: theme.colors.primarySoft,
          true: theme.colors.primary,
        }}
        value={value}
      />
    </View>
  );
}

function SecuritySetupScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const insets =
    useSafeAreaInsets();

  const {
    height,
    width,
  } =
    useWindowDimensions();

  const compact =
    height < 740 ||
    width < 370;

  const [
    pin,
    setPin,
  ] =
    useState(
      isPinEnabled(),
    );

  const [
    biometric,
    setBiometric,
  ] =
    useState(
      isBiometricEnabled(),
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState(
      getPrivacySecuritySettings()
        .discreetNotifications,
    );

  const refresh =
    useCallback(() => {
      setPin(
        isPinEnabled(),
      );

      setBiometric(
        isBiometricEnabled(),
      );

      setNotifications(
        getPrivacySecuritySettings()
          .discreetNotifications,
      );
    }, []);

  useEffect(() => {
    loadSecurityPreferences().then(
      refresh,
    );
  }, [refresh]);

  useFocusEffect(refresh);

  const enabledCount = [
    pin,
    biometric,
    notifications,
  ].filter(Boolean).length;

  return (
    <LinearGradient
      colors={[
        ...theme.gradients.pageBackground,
      ]}
      locations={[
        0,
        0.32,
        0.7,
        1,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={
        styles.page
      }>
      {/* SAME EXISTING BACKGROUND */}

      <View
        pointerEvents="none"
        style={
          styles.pageBackgroundDecor
        }>
        <View
          style={
            styles.pageGlowTop
          }
        />

        <View
          style={
            styles.pageGlowMiddle
          }
        />

        <View
          style={
            styles.pageGlowBottom
          }
        />
      </View>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      {/* BACK BUTTON */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              getTopPadding(
                insets.top,
              ),
          },
        ]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={12}
          onPress={
            navigation.goBack
          }
          style={({
            pressed,
          }) => [
            styles.back,
            compact &&
              styles.backCompact,
            pressed &&
              styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="arrow-left"
            size={
              compact
                ? 23
                : 26
            }
          />
        </Pressable>
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          compact &&
            styles.contentCompact,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                14,
              ) + 18,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }>
        {/* ==========================================
            PREMIUM HERO
        ========================================== */}

        <View
          style={[
            styles.hero,
            compact &&
              styles.heroCompact,
          ]}>
          <View
            style={[
              styles.heroOuter,
              compact &&
                styles.heroOuterCompact,
            ]}>
            <View
              style={[
                styles.heroMiddle,
                compact &&
                  styles.heroMiddleCompact,
              ]}>
              <View
                style={[
                  styles.heroInner,
                  compact &&
                    styles.heroInnerCompact,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-lock-outline"
                  size={
                    compact
                      ? 31
                      : 37
                  }
                />
              </View>
            </View>

            <View
              style={
                styles.heroBadge
              }>
              <MaterialDesignIcons
                color={onPrimaryTextColor(theme)}
                name="lock"
                size={13}
              />
            </View>
          </View>

          <View
            style={
              styles.awaBadge
            }>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="star-four-points"
              size={9}
            />

            <Text
              style={
                styles.awaText
              }>
              AWA
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              compact &&
                styles.titleCompact,
            ]}>
            Protège ton espace
          </Text>

          <Text
            style={[
              styles.subtitle,
              compact &&
                styles.subtitleCompact,
            ]}>
            Choisis les protections que tu souhaites activer. Tu pourras modifier ces réglages à tout moment.
          </Text>
        </View>

        {/* ==========================================
            SECURITY STATUS
        ========================================== */}

        <View
          style={[
            styles.statusCard,
            compact &&
              styles.statusCardCompact,
          ]}>
          <View
            style={
              styles.statusIcon
            }>
            <MaterialDesignIcons
              color={theme.colors.success}
              name="shield-check-outline"
              size={21}
            />
          </View>

          <View
            style={
              styles.statusCopy
            }>
            <Text
              style={
                styles.statusTitle
              }>
              Protection de ton espace
            </Text>

            <Text
              style={
                styles.statusText
              }>
              {enabledCount === 0
                ? 'Aucune protection optionnelle activée'
                : `${enabledCount} protection${
                    enabledCount >
                    1
                      ? 's'
                      : ''
                  } activée${
                    enabledCount >
                    1
                      ? 's'
                      : ''
                  }`}
            </Text>
          </View>

          <View
            style={
              styles.statusCounter
            }>
            <Text
              style={
                styles.statusCounterText
              }>
              {enabledCount}/3
            </Text>
          </View>
        </View>

        {/* ==========================================
            OPTIONS
        ========================================== */}

        <View
          style={
            styles.sectionHeading
          }>
          <View>
            <Text
              style={
                styles.sectionTitle
              }>
              Tes protections
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }>
              Active seulement ce qui te convient
            </Text>
          </View>

          <View
            style={
              styles.sectionIcon
            }>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="lock-check-outline"
              size={19}
            />
          </View>
        </View>

        <View
          style={[
            styles.options,
            compact &&
              styles.optionsCompact,
          ]}>
          <SecurityOption
            compact={compact}
            description="Verrouille AWA à l’ouverture avec un code personnel."
            icon="dialpad"
            onValueChange={value =>
              navigation.navigate(
                'PinSetup',
                {
                  mode: value
                    ? 'create'
                    : 'disable',

                  returnTo:
                    'onboarding',
                },
              )
            }
            styles={styles}
            theme={theme}
            title="Code PIN"
            value={pin}
          />

          <SecurityOption
            compact={compact}
            description="Utilise l’empreinte digitale ou la reconnaissance faciale de ton appareil."
            icon="fingerprint"
            onValueChange={value =>
              navigation.navigate(
                'FaceIdSetup',
                {
                  action: value
                    ? 'enable'
                    : 'manage',
                },
              )
            }
            styles={styles}
            theme={theme}
            title="Biométrie"
            value={biometric}
          />

          <SecurityOption
            compact={compact}
            description="Masque les informations sensibles dans l’aperçu de tes notifications."
            icon="eye-off-outline"
            onValueChange={value => {
              setNotifications(
                value,
              );

              updatePrivacySecuritySettings(
                {
                  discreetNotifications:
                    value,

                  hideNotificationPreview:
                    value,
                },
              );
            }}
            styles={styles}
            theme={theme}
            title="Notifications discrètes"
            value={notifications}
          />
        </View>

        {/* ==========================================
            PRIVATE INFO
        ========================================== */}

        <View
          style={[
            styles.info,
            compact &&
              styles.infoCompact,
          ]}>
          <View
            style={[
              styles.infoIconBox,
              compact &&
                styles.infoIconBoxCompact,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="shield-check-outline"
              size={
                compact
                  ? 21
                  : 24
              }
            />
          </View>

          <View
            style={
              styles.infoCopy
            }>
            <Text
              style={[
                styles.infoTitle,
                compact &&
                  styles.infoTitleCompact,
              ]}>
              Tes choix restent privés
            </Text>

            <Text
              style={[
                styles.infoText,
                compact &&
                  styles.infoTextCompact,
              ]}>
              Ces réglages sont enregistrés pour protéger ton utilisation d’AWA et peuvent être modifiés plus tard.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.buttonGap
          }
        />

        {/* ==========================================
            CTA
        ========================================== */}

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            route.params?.mode === 'edit'
              ? navigation.goBack()
              : navigation.navigate(
                  'Privacy',
                )
          }
          style={({
            pressed,
          }) => [
            styles.continueButton,
            compact &&
              styles.continueButtonCompact,
            pressed &&
              styles.pressed,
          ]}>
          <View
            pointerEvents="none"
            style={
              styles.buttonGlowLeft
            }
          />

          <View
            pointerEvents="none"
            style={
              styles.buttonGlowRight
            }
          />

          <Text
            style={[
              styles.continueText,
              compact &&
                styles.continueTextCompact,
            ]}>
            Continuer
          </Text>

          <View
            style={[
              styles.continueIcon,
              compact &&
                styles.continueIconCompact,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="arrow-right"
              size={
                compact
                  ? 17
                  : 19
              }
            />
          </View>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ==============================================
       SAME BACKGROUND
    ============================================== */

    page: {
      flex: 1,
      backgroundColor:
        theme.colors.background,
    },

    pageBackgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    pageGlowTop: {
      position: 'absolute',
      top: -150,
      right: -110,
      width: 330,
      height: 330,
      borderRadius: 165,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.045),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.05),
    },

    /* ==============================================
       HEADER
    ============================================== */

    header: {
      paddingHorizontal: 18,
      paddingBottom: 2,
    },

    back: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        withAlpha(theme.colors.primary, 0.08),
      borderRadius: 22,
      backgroundColor:
        withAlpha(theme.colors.surface, 0.93),
      shadowColor:
        theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 7,
      elevation: 2,
    },

    backCompact: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },

    /* ==============================================
       CONTENT
    ============================================== */

    content: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.md,
    },

    contentCompact: {
      paddingHorizontal: 14,
    },

    /* ==============================================
       HERO
    ============================================== */

    hero: {
      alignItems: 'center',
      paddingTop: 2,
      paddingBottom: 20,
    },

    heroCompact: {
      paddingBottom: 14,
    },

    heroOuter: {
      position: 'relative',
      width: 108,
      height: 108,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 54,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.07),
    },

    heroOuterCompact: {
      width: 90,
      height: 90,
      borderRadius: 45,
    },

    heroMiddle: {
      width: 86,
      height: 86,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 43,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    heroMiddleCompact: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },

    heroInner: {
      width: 67,
      height: 67,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        withAlpha(theme.colors.primary, 0.13),
      borderRadius: 34,
      backgroundColor:
        theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.11,
      shadowRadius: 11,
      elevation: 4,
    },

    heroInnerCompact: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },

    heroBadge: {
      position: 'absolute',
      right: 5,
      bottom: 6,
      width: 29,
      height: 29,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor:
        theme.colors.background,
      borderRadius: 15,
      backgroundColor:
        theme.colors.primary,
    },

    awaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
      paddingHorizontal: 11,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        withAlpha(theme.colors.surface, 0.62),
    },

    awaText: {
      color: theme.colors.primary,
      fontFamily: 'serif',
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 1.7,
    },

    title: {
      marginTop: 12,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
      textAlign: 'center',
    },

    titleCompact: {
      fontSize: 25,
      lineHeight: 30,
    },

    subtitle: {
      maxWidth: 340,
      marginTop: 8,
      color:
        theme.colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
      textAlign: 'center',
    },

    subtitleCompact: {
      maxWidth: 300,
      marginTop: 5,
      fontSize: 10.8,
      lineHeight: 15,
    },

    /* ==============================================
       STATUS
    ============================================== */

    statusCard: {
      minHeight: 67,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor:
        withAlpha(theme.colors.success, 0.12),
      borderRadius: 20,
      backgroundColor:
        withAlpha(theme.colors.success, 0.06),
    },

    statusCardCompact: {
      minHeight: 59,
      marginBottom: 13,
      paddingVertical: 9,
    },

    statusIcon: {
      width: 39,
      height: 39,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 13,
      backgroundColor:
        withAlpha(theme.colors.success, 0.14),
    },

    statusCopy: {
      flex: 1,
      minWidth: 0,
    },

    statusTitle: {
      color: theme.colors.text,
      fontSize: 11.5,
      fontWeight: '800',
    },

    statusText: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      lineHeight: 13,
    },

    statusCounter: {
      minWidth: 39,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: 11,
      backgroundColor:
        theme.colors.primarySoft,
    },

    statusCounterText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '900',
    },

    /* ==============================================
       SECTION
    ============================================== */

    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 10,
      paddingHorizontal: 2,
    },

    sectionTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
    },

    sectionIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor:
        theme.colors.primarySoft,
    },

    /* ==============================================
       OPTIONS
    ============================================== */

    options: {
      gap: 11,
    },

    optionsCompact: {
      gap: 8,
    },

    option: {
      minHeight: 91,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.surface, 0.94),
      shadowColor:
        theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },

    optionCompact: {
      minHeight: 79,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 18,
    },

    iconBox: {
      width: 55,
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 17,
      backgroundColor:
        theme.colors.primarySoft,
    },

    iconBoxActive: {
      borderWidth: 1,
      borderColor:
        withAlpha(theme.colors.primary, 0.12),
      backgroundColor:
        withAlpha(theme.colors.primary, 0.16),
    },

    iconBoxCompact: {
      width: 48,
      height: 48,
      borderRadius: 15,
    },

    optionCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 11,
    },

    optionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },

    optionTitle: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '700',
    },

    optionTitleCompact: {
      fontSize: 15,
      lineHeight: 19,
    },

    optionDescription: {
      marginTop: 4,
      color:
        theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },

    optionDescriptionCompact: {
      marginTop: 2,
      fontSize: 9.8,
      lineHeight: 14,
    },

    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor:
        withAlpha(theme.colors.success, 0.14),
    },

    activeBadgeText: {
      color: theme.colors.success,
      fontSize: 8.5,
      fontWeight: '800',
    },

    /* ==============================================
       INFO
    ============================================== */

    info: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor:
        withAlpha(theme.colors.surface, 0.80),
    },

    infoCompact: {
      minHeight: 66,
      marginTop: 10,
      paddingVertical: 9,
      borderRadius: 17,
    },

    infoIconBox: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 14,
      backgroundColor:
        theme.colors.primarySoft,
    },

    infoIconBoxCompact: {
      width: 40,
      height: 40,
      borderRadius: 12,
    },

    infoCopy: {
      flex: 1,
      minWidth: 0,
    },

    infoTitle: {
      color: theme.colors.accent,
      fontSize: 12.5,
      fontWeight: '800',
    },

    infoTitleCompact: {
      fontSize: 11,
    },

    infoText: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    infoTextCompact: {
      marginTop: 2,
      fontSize: 9.3,
      lineHeight: 13,
    },

    /* ==============================================
       BUTTON
    ============================================== */

    buttonGap: {
      flex: 1,
      minHeight: 20,
    },

    continueButton: {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      borderRadius: 20,
      backgroundColor:
        theme.colors.primary,
      shadowColor:
        theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.25,
      shadowRadius: 11,
      elevation: 5,
    },

    continueButtonCompact: {
      minHeight: 51,
      marginTop: 15,
      borderRadius: 18,
    },

    buttonGlowLeft: {
      position: 'absolute',
      top: -48,
      left: -35,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.42),
    },

    buttonGlowRight: {
      position: 'absolute',
      top: -55,
      right: -35,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor:
        withAlpha(theme.colors.secondary, 0.20),
    },

    continueText: {
      color: onPrimaryTextColor(theme),
      fontSize: 16.5,
      fontWeight: '800',
      textAlign: 'center',
    },

    continueTextCompact: {
      fontSize: 15,
    },

    continueIcon: {
      position: 'absolute',
      right: 11,
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor:
        theme.colors.surface,
    },

    continueIconCompact: {
      width: 30,
      height: 30,
      borderRadius: 10,
    },

    pressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },
  });
}

export default SecuritySetupScreen;