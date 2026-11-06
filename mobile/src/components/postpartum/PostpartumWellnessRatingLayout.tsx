import React, { useEffect, useMemo, useRef } from 'react';
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
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import { getTopPadding } from '../../theme/spacing';
import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type WellnessRatingOption = {
  label: string;
  /** PHASE 7H — optional DISPLAY-ONLY translation of `label` (which stays the
   * DATA-BEARING, persisted/compared/selected value — see each caller's own
   * comment). Falls back to `label` itself when omitted, so any other future
   * caller that doesn't set it keeps today's exact behavior. */
  displayLabel?: string;
  description: string;
  icon: IconName;
  tint: string;
};

type Props = {
  title: string;
  dateLabel: string;
  options: WellnessRatingOption[];
  selected?: string;
  onSelect: (value: string) => void;
  adviceTitle: string;
  adviceText: string;
  adviceIcon: IconName;
  error?: string;
  saving?: boolean;
  onSave: () => void;
  /** Optional: shown only when there is a saved answer to clear (M25). */
  onClear?: () => void;
};

export function PostpartumWellnessRatingLayout({
  title,
  dateLabel,
  options,
  selected,
  onSelect,
  adviceTitle,
  adviceText,
  adviceIcon,
  error,
  saving,
  onSave,
  onClear,
}: Props): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const rowAnimations = useMemo(
    () => options.map(() => new Animated.Value(0)),
    [options],
  );

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) {
        return;
      }

      const duration = reduceMotion ? 0 : 360;
      Animated.parallel([
        Animated.timing(entrance, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          reduceMotion ? 0 : 55,
          rowAnimations.map(animation =>
            Animated.timing(animation, {
              toValue: 1,
              duration: reduceMotion ? 0 : 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start();
    });

    return () => {
      active = false;
    };
  }, [entrance, rowAnimations]);

  return (
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View
          style={[
            styles.header,
            { paddingTop: getTopPadding(insets.top, true) },
          ]}
        >
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            icon="chevron-left"
            iconSize={28}
          />
          <View style={styles.headerCopy}>
            <AwaText adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} variant="titleLarge" style={styles.headerTitle}>
              {title}
            </AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" numberOfLines={1} style={styles.headerDate}>
              {dateLabel}
            </AwaText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 104 },
          ]}
          showsVerticalScrollIndicator={false}
        >

          <Animated.View style={{opacity: entrance, transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}]}}>
            <AwaText variant="headlineSmall" style={styles.sectionTitle}>
              {t('postpartumWellnessRatingLayout.sectionTitle')}
            </AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionText}>
              {t('postpartumWellnessRatingLayout.sectionText')}
            </AwaText>
          </Animated.View>

          <View style={styles.options}>
            {options.map((option, index) => {
              const active = selected === option.label;
              const animation = rowAnimations[index];
              return (
                <Animated.View
                  key={option.label}
                  style={{
                    opacity: animation,
                    transform: [
                      {
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    accessibilityLabel={option.displayLabel ?? option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => onSelect(option.label)}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: option.tint },
                      ]}
                    >
                      <MaterialDesignIcons
                        color={active ? theme.colors.primary : theme.colors.textMuted}
                        name={option.icon}
                        size={25}
                      />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text
                        style={[
                          styles.optionLabel,
                          active && styles.optionLabelActive,
                        ]}
                      >
                        {option.displayLabel ?? option.label}
                      </Text>
                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.optionDescription}>
                        {option.description}
                      </AwaText>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? (
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="check"
                          size={16}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.advice}>
            <View style={styles.adviceIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name={adviceIcon}
                size={24}
              />
            </View>
            <View style={styles.adviceCopy}>
              <AwaText variant="titleSmall" style={styles.adviceTitle}>{adviceTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.adviceText}>{adviceText}</AwaText>
            </View>
          </View>
          {error ? (
            <AwaText variant="labelMedium" colorRole="error" accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </AwaText>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.saveWrap,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <AwaButton
            accessibilityLabel={t('common.save')}
            accessibilityRole="button"
            disabled={saving}
            onPress={onSave}
            label={saving ? t('postpartumWellnessRatingLayout.saving') : t('postpartumWellnessRatingLayout.saveButtonLabel')}
            icon="content-save-outline"
            size="large"
          />

          {onClear ? (
            <AwaButton
              accessibilityLabel={t('postpartumWellnessRatingLayout.clearAnswer')}
              accessibilityRole="button"
              disabled={saving}
              onPress={onClear}
              label={t('postpartumWellnessRatingLayout.clearAnswer')}
              variant="text"
              style={styles.clearButton}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: {color: theme.colors.accent},
  headerDate: {marginTop: 2},
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: {marginTop: 27, color: theme.colors.accent},
  sectionText: {marginTop: 6},
  options: { marginTop: 16, gap: 10 },
  option: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  optionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    shadowOpacity: 0.11,
  },
  optionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  optionCopy: { flex: 1, marginLeft: 12, paddingRight: 8 },
  optionLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionLabelActive: { color: theme.colors.primary },
  optionDescription: {marginTop: 3},
  radio: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.2),
    borderRadius: 13,
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  advice: {
    marginTop: 22,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  adviceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },
  adviceCopy: { flex: 1, marginLeft: 12 },
  adviceTitle: {color: theme.colors.accent},
  adviceText: {marginTop: 4},
  error: {marginTop: 14, textAlign: 'center'},
  saveWrap: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.12),
    backgroundColor: withAlpha(theme.colors.background, 0.97),
  },
  clearButton: {alignSelf: 'center', marginTop: 4},
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  });
}
