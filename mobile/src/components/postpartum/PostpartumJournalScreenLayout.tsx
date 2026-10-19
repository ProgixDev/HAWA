import React, {
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getTopPadding, spacing} from '../../theme/spacing';
import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';

type IconName =
  React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  tint: string;
  saving?: boolean;
  error?: string;
  onSave: () => void;
  children: React.ReactNode;
  compact?: boolean;
};

export function PostpartumJournalScreenLayout({
  title,
  subtitle,
  icon,
  tint,
  saving,
  error,
  onSave,
  children,
  compact = false,
}: Props): React.JSX.Element {
  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets =
    useSafeAreaInsets();

  const entrance =
    useRef(
      new Animated.Value(0),
    ).current;

  /* ============================================================
     ENTRANCE ANIMATION
  ============================================================ */

  useEffect(() => {
    let active = true;

    AccessibilityInfo
      .isReduceMotionEnabled()
      .then(reduce => {
        if (!active) {
          return;
        }

        Animated.timing(
          entrance,
          {
            toValue: 1,
            duration: reduce ? 0 : 420,
            easing: Easing.out(
              Easing.cubic,
            ),
            useNativeDriver: true,
          },
        ).start();
      });

    return () => {
      active = false;
    };
  }, [entrance]);

  const entranceStyle = {
    opacity: entrance,

    transform: [
      {
        translateY:
          entrance.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
      },
    ],
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={
          insets.top
        }
        style={styles.flex}>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <View
          style={[
            styles.header,
            {
              paddingTop:
                getTopPadding(
                  insets.top,
                  true,
                ),
            },
          ]}>

          {/* BACK BUTTON */}

          <AwaIconButton
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            icon="chevron-left"
            iconSize={26}
            onPress={navigation.goBack}
          />

          {/* COMPACT HEADER */}

          {compact ? (
            <Animated.View
              style={[
                styles.compactHeaderCenter,
                entranceStyle,
              ]}>
              <AwaText variant="headlineSmall"
                style={
                  styles.compactTitle
                }>
                {title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                numberOfLines={1}
                style={
                  styles.compactSubtitle
                }>
                {subtitle}
              </AwaText>
            </Animated.View>
          ) : (
            <View
              style={
                styles.normalHeaderSpacer
              }
            />
          )}

          {/* RIGHT SPACER
              Keeps compact title centered */}

          <View
            style={
              styles.headerRightSpacer
            }
          />
        </View>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <ScrollView
          contentContainerStyle={[
            styles.content,

            compact &&
              styles.contentCompact,

            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) +
                spacing.lg +
                12,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }>
          <Animated.View
            style={entranceStyle}>

            {/* =================================================
                NORMAL TITLE MODE
            ================================================= */}

            {!compact ? (
              <View
                style={
                  styles.titleBlock
                }>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        tint,
                    },
                  ]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name={icon}
                    size={26}
                  />
                </View>

                <AwaText variant="headlineSmall"
                  style={
                    styles.title
                  }>
                  {title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                  style={
                    styles.subtitle
                  }>
                  {subtitle}
                </AwaText>
              </View>
            ) : null}

            {/* =================================================
                BODY
            ================================================= */}

            <View
              style={[
                styles.body,
                compact &&
                  styles.bodyCompact,
              ]}>
              {children}
            </View>

            {/* =================================================
                ERROR
            ================================================= */}

            {error ? (
              <View
                style={
                  styles.errorCard
                }>
                <MaterialDesignIcons
                  color={theme.colors.danger}
                  name="alert-circle-outline"
                  size={17}
                />

                <AwaText variant="bodySmall" colorRole="error"
                  accessibilityRole="alert"
                  style={
                    styles.error
                  }>
                  {error}
                </AwaText>
              </View>
            ) : null}

            {/* =================================================
                SAVE BUTTON
            ================================================= */}

            <AwaButton
              accessibilityLabel={t('common.save')}
              icon={saving ? 'loading' : 'check'}
              loading={Boolean(saving)}
              onPress={onSave}
              label={saving
                ? t('postpartumJournalScreenLayout.saving')
                : t('common.save')}
              size="large"
              style={styles.saveButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ============================================================
   INFO PANEL
============================================================ */

export function PostpartumInfoPanel({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const panelStyles = useMemo(() => createPanelStyles(theme), [theme]);
  return (
    <AwaCard
      padding="none"
      variant="filled"
      style={panelStyles.panel}>

      <View
        style={
          panelStyles.iconContainer
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          panelStyles.flexCopy
        }>
        <AwaText variant="labelMedium"
          style={
            panelStyles.title
          }>
          {title}
        </AwaText>

        <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
          style={
            panelStyles.text
          }>
          {text}
        </AwaText>
      </View>
    </AwaCard>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ========================================================
       ROOT
    ======================================================== */

    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    flex: {
      flex: 1,
    },

    /* ========================================================
       HEADER
    ======================================================== */

    header: {
      position: 'relative',

      minHeight: 88,

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 16,

      paddingBottom: 10,
    },

    normalHeaderSpacer: {
      flex: 1,
    },

    headerRightSpacer: {
      width: 40,
      height: 40,

      flexShrink: 0,
    },

    /* ========================================================
       COMPACT HEADER
    ======================================================== */

    compactHeaderCenter: {
      flex: 1,

      minWidth: 0,

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal: 8,
    },

    compactTitle: {maxWidth: '100%', color: theme.colors.accent, textAlign: 'center'},

    compactSubtitle: {maxWidth: '100%', marginTop: 4, textAlign: 'center'},

    /* ========================================================
       CONTENT
    ======================================================== */

    content: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },

    contentCompact: {
      paddingTop: 6,
    },

    /* ========================================================
       NORMAL TITLE MODE
    ======================================================== */

    titleBlock: {
      alignItems: 'center',
      paddingHorizontal: 12,
    },

    iconCircle: {
      width: 60,
      height: 60,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 12,
    },

    title: {marginTop: 12, color: theme.colors.accent, textAlign: 'center'},

    subtitle: {marginTop: 5, maxWidth: 300, textAlign: 'center'},

    /* ========================================================
       BODY
    ======================================================== */

    body: {
      marginTop: 20,
      gap: 14,
    },

    bodyCompact: {
      marginTop: 8,
    },

    /* ========================================================
       ERROR
    ======================================================== */

    errorCard: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 7,

      marginTop: 12,

      paddingHorizontal: 12,

      paddingVertical: 10,

      borderRadius: 12,

      backgroundColor: withAlpha(theme.colors.danger, 0.08),
    },

    error: {flexShrink: 1, textAlign: 'center'},

    /* ========================================================
       SAVE BUTTON
    ======================================================== */

    saveButton: {marginTop: 20},
  });
}

/* ============================================================
   INFO PANEL STYLES
============================================================ */

function createPanelStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    panel: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13},

    iconContainer: {
      width: 34,
      height: 34,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor: withAlpha(theme.colors.surface, 0.72),
    },

    flexCopy: {
      flex: 1,

      minWidth: 0,
    },

    title: {color: theme.colors.accent},

    text: {marginTop: 3},
  });
}
