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
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

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

        <AwaText variant="titleSmall" style={styles.optionLabel}>{label}</AwaText>

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
    } catch (saveError) {
      presentSaveFailure(saveError);
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
                <AwaIconButton
                  accessibilityLabel={t('common.back')}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={navigation.goBack}
                  icon="arrow-left"
                  iconSize={22}
                  style={styles.editBackButton}
                />
              ) : null}
              <AwaText variant="headlineMedium" style={styles.title}>{t('postpartumFeeding.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>{t('postpartumFeeding.subtitle')}</AwaText>
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

          <AwaButton
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            label={saving ? t('postpartumFeeding.saving') : isEdit ? t('common.save') : t('postpartumFeeding.next')}
            size="large"
            style={styles.nextButton}
          />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},





    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg},
    mainContent: {flex: 1},
    header: {alignItems: 'center', paddingTop: 24, marginBottom: spacing.md},
    editBackButton: {position: 'absolute', top: 0, left: 0},
    title: {textAlign: 'center'},
    subtitle: {marginTop: 10, maxWidth: 310, textAlign: 'center'},
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
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
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
    optionLabel: {flex: 1, minWidth: 0, marginHorizontal: 13},
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
    nextButton: {marginTop: spacing.sm},
    pressed: {opacity: 0.82},
  });
}

export default PostpartumFeedingScreen;
