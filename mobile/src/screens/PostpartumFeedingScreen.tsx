import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  getPostpartumPreferences,
  setFeedingType,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumFeeding'>;

type FeedingOption = {
  id: PostpartumFeedingType;
  labelKey: string;
  image: number;
};

// setFeedingType() persists `option.id` (a stable PostpartumFeedingType
// enum value — see src/state/postpartumPreferences.ts), never the label
// text, so these labels are purely for display and safe to translate.
const OPTIONS: FeedingOption[] = [
  {
    id: 'exclusive_breastfeeding',
    labelKey: 'postpartumFeeding.options.exclusiveBreastfeeding',
    image: require('../assets/images/postpartum/feeding/feeding-breastfeeding.png'),
  },
  {
    id: 'mixed',
    labelKey: 'postpartumFeeding.options.mixed',
    image: require('../assets/images/postpartum/feeding/feeding-mixed.png'),
  },
  {
    id: 'exclusive_bottle',
    labelKey: 'postpartumFeeding.options.exclusiveBottle',
    image: require('../assets/images/postpartum/feeding/feeding-bottle.png'),
  },
  {
    id: 'unknown',
    labelKey: 'postpartumFeeding.options.unknown',
    image: require('../assets/images/postpartum/feeding/feeding-unknown.png'),
  },
];

type OptionCardProps = {
  option: FeedingOption;
  selected: boolean;
  onPress: () => void;
};

// Identical card behavior/animation to PostpartumDeliveryTypeScreen's
// OptionCard — same subtle scale pulse on selection.
function OptionCard({option, selected, onPress}: OptionCardProps): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useRef(new Animated.Value(1)).current;
  const label = t(option.labelKey);

  useEffect(() => {
    if (!selected) {return;}
    Animated.sequence([
      Animated.timing(scale, {toValue: 0.98, duration: 90, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, damping: 14, stiffness: 220, useNativeDriver: true}),
    ]).start();
  }, [selected, scale]);

  return (
    <Animated.View style={[styles.optionWrapper, {transform: [{scale}]}]}>
      <Pressable
        accessibilityLabel={label.replace('\n', ' ')}
        accessibilityRole="radio"
        accessibilityState={{checked: selected}}
        onPress={onPress}
        style={({pressed}) => [styles.optionCard, selected && styles.optionCardSelected, pressed && styles.pressed]}>
        <View style={styles.optionIcon}>
          <Image accessibilityIgnoresInvertColors resizeMode="contain" source={option.image} style={styles.optionImage} />
        </View>

        <Text style={styles.optionLabel}>{label}</Text>

        <View style={[styles.checkBadge, selected && styles.checkBadgeSelected]}>
          {selected ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PostpartumFeedingScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  // Onboarding (default, unchanged behavior) vs. edit — reached later from
  // PostpartumCycleReturnScreen.tsx's "Allaitement" row so she can update
  // her choice without re-entering onboarding. Same screen, same store,
  // same setFeedingType() — only the post-save destination differs.
  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  // Preselect a previously saved choice (canonical postpartumPreferences
  // store, reused as-is — no second store); otherwise nothing is
  // preselected, so the user makes an explicit choice.
  const [selected, setSelected] = useState<PostpartumFeedingType | null>(
    () => getPostpartumPreferences().feedingType,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const handleNext = async () => {
    if (saving) {return;}
    setSaving(true);
    try {
      // Optional field — proceeding without picking anything is allowed.
      // "Je ne sais pas encore" (feedingType === 'unknown') is a real,
      // explicit answer and is persisted as-is, never collapsed to null.
      if (selected) {
        await setFeedingType(selected);
      }
      // Edit mode returns to wherever she came from (PostpartumCycleReturnScreen)
      // — never forces her back into the onboarding funnel. Onboarding
      // continues to the optional "Suivi quotidien" reminder screen (last
      // onboarding step before SecuritySetup — see PostpartumRemindersScreen.tsx).
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('PostpartumReminders');
      }
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.header}>
              {isEdit ? (
                <Pressable
                  accessibilityLabel={t('common.back')}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={navigation.goBack}
                  style={({pressed}) => [styles.editBackButton, pressed && styles.pressed]}>
                  <MaterialDesignIcons color={theme.colors.text} name="arrow-left" size={22} />
                </Pressable>
              ) : null}
              <Text style={styles.title}>{t('postpartumFeeding.title')}</Text>
              <Text style={styles.subtitle}>{t('postpartumFeeding.subtitle')}</Text>
            </View>

            <View style={styles.optionsCenterContainer}>
              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <OptionCard
                    key={option.id}
                    onPress={() => setSelected(option.id)}
                    option={option}
                    selected={selected === option.id}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.nextText}>
              {saving ? t('postpartumFeeding.saving') : isEdit ? t('common.save') : t('postpartumFeeding.next')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},

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
      backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor: withAlpha(theme.colors.primary, 0.05),
    },

    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg},
    mainContent: {flex: 1},
    header: {alignItems: 'center', paddingTop: 24, marginBottom: spacing.md},
    editBackButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 15,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    title: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 32,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      maxWidth: 310,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },
    optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.md},
    optionsList: {gap: 12},
    optionWrapper: {width: '100%'},
    optionCard: {
      width: '100%',
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 7,
      elevation: 3,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    optionCardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    optionIcon: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      overflow: 'hidden',
    },
    optionImage: {width: 48, height: 48},
    optionLabel: {flex: 1, minWidth: 0, marginHorizontal: 13, color: theme.colors.text, fontSize: 14.5, fontWeight: '600', lineHeight: 19},
    checkBadge: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.4,
      borderColor: withAlpha(theme.colors.primary, 0.28),
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    checkBadgeSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    nextButton: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.25,
      shadowRadius: 9,
      elevation: 5,
    },
    nextText: {color: onPrimaryTextColor(theme), fontSize: 18, fontWeight: '600'},
    pressed: {opacity: 0.82},
  });
}

export default PostpartumFeedingScreen;
