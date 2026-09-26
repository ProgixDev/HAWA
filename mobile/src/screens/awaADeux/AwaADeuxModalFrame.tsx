import React, {useMemo} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {useEntrance} from './useEntrance';

// Shared frame of the "AWA à deux" dialogs (QR code, share the invitation, e-mail
// invitation, partner preview): a themed card with a title, a close [X], scrollable
// content and an optional primary button. Colors come from the resolved AWA theme only.
// The card enters with a quick fade + slight scale (Reanimated, opacity / transform;
// skipped with reduced motion). Android Back and the backdrop close it.

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  /** Keep the content above the keyboard (e-mail form). */
  avoidKeyboard?: boolean;
};

function ModalCard({title, onClose, children, ctaLabel, onCta, ctaDisabled}: Omit<Props, 'visible' | 'avoidKeyboard'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  // Mounted only while the dialog is open, so the entrance replays on every opening.
  const entrance = useEntrance(0, 260, reduceMotion, 10, 0.97);

  const pressScale = useSharedValue(1);
  const ctaPress = useAnimatedStyle(() => ({transform: [{scale: pressScale.value}]}));

  return (
    <Animated.View accessibilityViewIsModal style={[styles.card, entrance]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} numberOfLines={2} style={styles.title}>{title}</Text>
        <Pressable
          accessibilityLabel="Fermer"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({pressed}) => [styles.close, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.textSecondary} name="close" size={22} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        {children}
      </ScrollView>

      {ctaLabel ? (
        <View style={styles.footer}>
          <Animated.View style={ctaPress}>
            <Pressable
              accessibilityLabel={ctaLabel}
              accessibilityRole="button"
              accessibilityState={{disabled: Boolean(ctaDisabled)}}
              disabled={ctaDisabled}
              onPress={onCta}
              onPressIn={() => {
                pressScale.value = withTiming(0.97, {duration: 90});
              }}
              onPressOut={() => {
                pressScale.value = withTiming(1, {duration: 140});
              }}
              style={({pressed}) => [styles.cta, ctaDisabled && styles.ctaDisabled, pressed && styles.pressed]}>
              <Text maxFontSizeMultiplier={1.2} style={styles.ctaText}>{ctaLabel}</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function AwaADeuxModalFrame({visible, onClose, avoidKeyboard, ...card}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={avoidKeyboard ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        style={[styles.root, {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)}]}>
        <Pressable
          accessibilityLabel="Fermer"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <ModalCard onClose={onClose} {...card} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.55)},
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '100%',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      elevation: 12,
    },
    header: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 10, paddingTop: 14},
    title: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 19, lineHeight: 25, fontWeight: '700'},
    close: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
    scroll: {flexGrow: 0, flexShrink: 1},
    scrollContent: {paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16},
    footer: {paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20},
    cta: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
    },
    ctaDisabled: {opacity: 0.45},
    ctaText: {color: onPrimaryTextColor(theme), fontSize: 15.5, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
