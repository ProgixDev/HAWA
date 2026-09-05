import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
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
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import { getTopPadding } from '../../theme/spacing';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type WellnessRatingOption = {
  label: string;
  description: string;
  icon: IconName;
  tint: string;
};

type Props = {
  title: string;
  dateLabel: string;
  heroTitle: string;
  heroText: string;
  heroImage: ImageSourcePropType;
  options: WellnessRatingOption[];
  selected?: string;
  onSelect: (value: string) => void;
  adviceTitle: string;
  adviceText: string;
  adviceIcon: IconName;
  error?: string;
  saving?: boolean;
  onSave: () => void;
};

export function PostpartumWellnessRatingLayout({
  title,
  dateLabel,
  heroTitle,
  heroText,
  heroImage,
  options,
  selected,
  onSelect,
  adviceTitle,
  adviceText,
  adviceIcon,
  error,
  saving,
  onSave,
}: Props): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="chevron-left"
              size={28}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.headerDate}>
              {dateLabel}
            </Text>
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
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: entrance,
                transform: [
                  {
                    translateY: entrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.heroCopy}>
              <View style={styles.heroKicker}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="heart-pulse"
                  size={15}
                />
                <Text style={styles.heroKickerText}>SUIVI POST-PARTUM</Text>
              </View>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroText}>{heroText}</Text>
            </View>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={heroImage}
              style={styles.heroImage}
            />
          </Animated.View>

          <Text style={styles.sectionTitle}>
            Choisis ce qui te ressemble le plus
          </Text>
          <Text style={styles.sectionText}>
            Il n’y a pas de bonne ou de mauvaise réponse : observe-toi avec
            douceur.
          </Text>

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
                    accessibilityLabel={option.label}
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
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
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
              <Text style={styles.adviceTitle}>{adviceTitle}</Text>
              <Text style={styles.adviceText}>{adviceText}</Text>
            </View>
          </View>
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.saveWrap,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <Pressable
            accessibilityLabel="Enregistrer"
            accessibilityRole="button"
            disabled={saving}
            onPress={onSave}
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || saving) && styles.saveButtonPressed,
            ]}
          >
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="content-save-outline"
              size={21}
            />
            <Text style={styles.saveText}>
              {saving ? 'Enregistrement…' : 'Enregistrer mon suivi'}
            </Text>
          </Pressable>
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  headerCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
  },
  headerDate: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 11 },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  hero: {
    minHeight: 176,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 28,
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroCopy: { zIndex: 1, flex: 1, padding: 20, paddingRight: 0 },
  heroKicker: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.7),
  },
  heroKickerText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 14,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
  },
  heroText: {
    marginTop: 7,
    maxWidth: 190,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroImage: {
    position: 'absolute',
    right: -31,
    bottom: -14,
    width: 172,
    height: 190,
  },
  sectionTitle: {
    marginTop: 27,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
  },
  sectionText: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
  options: { marginTop: 16, gap: 10 },
  option: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 20,
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
  optionDescription: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
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
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
  },
  adviceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },
  adviceCopy: { flex: 1, marginLeft: 12 },
  adviceTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  adviceText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  error: {
    marginTop: 14,
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveWrap: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.12),
    backgroundColor: withAlpha(theme.colors.background, 0.97),
  },
  saveButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.27,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  saveButtonPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  saveText: { color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  });
}
