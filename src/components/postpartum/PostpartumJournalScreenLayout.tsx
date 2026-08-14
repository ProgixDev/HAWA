import React, {
  useEffect,
  useRef,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {homeColors} from '../home/homeTheme';
import {getTopPadding, spacing} from '../../theme/spacing';

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
        barStyle="dark-content"
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

          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={
              navigation.goBack
            }
            style={({
              pressed,
            }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={
                homeColors.primary
              }
              name="chevron-left"
              size={26}
            />
          </Pressable>

          {/* COMPACT HEADER */}

          {compact ? (
            <Animated.View
              style={[
                styles.compactHeaderCenter,
                entranceStyle,
              ]}>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={
                  styles.compactTitle
                }>
                {title}
              </Text>

              <Text
                numberOfLines={1}
                style={
                  styles.compactSubtitle
                }>
                {subtitle}
              </Text>
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
                    color={
                      homeColors.primary
                    }
                    name={icon}
                    size={26}
                  />
                </View>

                <Text
                  style={
                    styles.title
                  }>
                  {title}
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }>
                  {subtitle}
                </Text>
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
                  color="#A8505A"
                  name="alert-circle-outline"
                  size={17}
                />

                <Text
                  accessibilityRole="alert"
                  style={
                    styles.error
                  }>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* =================================================
                SAVE BUTTON
            ================================================= */}

            <Pressable
              accessibilityLabel="Enregistrer"
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  Boolean(saving),
              }}
              disabled={saving}
              onPress={onSave}
              style={({
                pressed,
              }) => [
                styles.saveButton,

                saving &&
                  styles.saveButtonSaving,

                (pressed ||
                  saving) &&
                  styles.pressed,
              ]}>
              <View
                style={
                  styles.saveButtonIcon
                }>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name={
                    saving
                      ? 'loading'
                      : 'check'
                  }
                  size={17}
                />
              </View>

              <Text
                style={
                  styles.saveText
                }>
                {saving
                  ? 'Enregistrement…'
                  : 'Enregistrer'}
              </Text>
            </Pressable>
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
  return (
    <View
      style={
        panelStyles.panel
      }>

      <View
        style={
          panelStyles.iconContainer
        }>
        <MaterialDesignIcons
          color={
            homeColors.primary
          }
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          panelStyles.flexCopy
        }>
        <Text
          style={
            panelStyles.title
          }>
          {title}
        </Text>

        <Text
          style={
            panelStyles.text
          }>
          {text}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    /* ========================================================
       ROOT
    ======================================================== */

    safe: {
      flex: 1,
      backgroundColor:
        '#F8F4FC',
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

    backButton: {
      zIndex: 5,

      width: 46,
      height: 46,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent: 'center',

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.08)',

      borderRadius: 23,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#51349A',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.08,

      shadowRadius: 9,

      elevation: 3,
    },

    normalHeaderSpacer: {
      flex: 1,
    },

    headerRightSpacer: {
      width: 46,
      height: 46,

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

    compactTitle: {
      maxWidth: '100%',

      color:
        homeColors.textPrimary,

      fontFamily: 'serif',

      fontSize: 21,

      lineHeight: 26,

      fontWeight: '800',

      textAlign: 'center',
    },

    compactSubtitle: {
      maxWidth: '100%',

      marginTop: 4,

      color:
        homeColors.textSecondary,

      fontSize: 11.5,

      lineHeight: 16,

      fontWeight: '500',

      textAlign: 'center',
    },

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

      borderRadius: 22,
    },

    title: {
      marginTop: 12,

      color:
        homeColors.textPrimary,

      fontFamily: 'serif',

      fontSize: 23,

      lineHeight: 29,

      fontWeight: '800',

      textAlign: 'center',
    },

    subtitle: {
      marginTop: 5,

      maxWidth: 300,

      color:
        homeColors.textSecondary,

      fontSize: 12.5,

      lineHeight: 18,

      textAlign: 'center',
    },

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

      borderRadius: 14,

      backgroundColor:
        '#FCEDEF',
    },

    error: {
      flexShrink: 1,

      color: '#A8505A',

      fontSize: 11.5,

      lineHeight: 16,

      textAlign: 'center',
    },

    /* ========================================================
       SAVE BUTTON
    ======================================================== */

    saveButton: {
      minHeight: 56,

      marginTop: 20,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 9,

      borderRadius: 19,

      backgroundColor:
        homeColors.primary,

      shadowColor:
        '#4E319A',

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.22,

      shadowRadius: 10,

      elevation: 5,
    },

    saveButtonSaving: {
      opacity: 0.76,
    },

    saveButtonIcon: {
      width: 27,
      height: 27,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        'rgba(255,255,255,0.16)',
    },

    saveText: {
      color: '#FFFFFF',

      fontSize: 16,

      fontWeight: '700',
    },

    pressed: {
      opacity: 0.82,
    },
  });

/* ============================================================
   INFO PANEL STYLES
============================================================ */

const panelStyles =
  StyleSheet.create({
    panel: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 10,

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.06)',

      borderRadius: 17,

      backgroundColor:
        homeColors.lightLavender,

      padding: 13,
    },

    iconContainer: {
      width: 34,
      height: 34,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        'rgba(255,255,255,0.72)',
    },

    flexCopy: {
      flex: 1,

      minWidth: 0,
    },

    title: {
      color:
        homeColors.textPrimary,

      fontSize: 12.5,

      fontWeight: '800',
    },

    text: {
      marginTop: 3,

      color:
        homeColors.textSecondary,

      fontSize: 11.5,

      lineHeight: 16,
    },
  });