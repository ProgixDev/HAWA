import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
import '../i18n';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageTryingAgainStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {presentSaveFailure} from '../services/saveFailure';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageTryingAgain'>;

// `id` is the persisted enum (MiscarriageTryingAgainStatus) — title/subtitle
// reuse the exact same `miscarriageTryingAgain.options.*` keys as
// miscarriageJournalConfig.ts's own MISCARRIAGE_TRYING_AGAIN_OPTIONS
// (identical French wording there), rather than duplicating the copy.
function optionsFor(t: TFunction): Array<{
  id: MiscarriageTryingAgainStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  return [
    {id: 'not_now', title: t('miscarriageTryingAgain.options.not_now.label'), subtitle: t('miscarriageTryingAgain.options.not_now.subtitle'), icon: 'clock-outline', tint: '#EFE7F4'},
    {id: 'soon', title: t('miscarriageTryingAgain.options.soon.label'), subtitle: t('miscarriageTryingAgain.options.soon.subtitle'), icon: 'sprout-outline', tint: '#E7F0E8'},
    {id: 'ready', title: t('miscarriageTryingAgain.options.ready.label'), subtitle: t('miscarriageTryingAgain.options.ready.subtitle'), icon: 'heart-outline', tint: '#FBE8E8'},
  ];
}

function MiscarriageTryingAgainScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const OPTIONS = useMemo(() => optionsFor(t), [t]);
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] = useState<MiscarriageTryingAgainStatus | null>(
    () => getMiscarriagePreferences().tryingAgainStatus,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (active) {setSelected(current => current ?? value.tryingAgainStatus);}
    });
    return () => {active = false;};
  }, []);

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

  const handleFinish = async () => {
    if (saving || !selected) {return;}
    setSaving(true);
    try {
      // Personalizes the miscarriage support experience only — activeObjective
      // stays 'loss' (never auto-switched to 'conceive'), per spec section 19.
      await setMiscarriageTryingAgainStatus(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MiscarriageReminders');
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
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.illustration}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={t('miscarriageTryingAgain.illustrationAccessibility')}
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-trying-again-woman.png')}
                style={styles.illustrationImage}
              />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{t('miscarriageTryingAgain.title')}</Text>
              <Text style={styles.subtitle}>
                {t('miscarriageTryingAgain.subtitle')}
              </Text>
            </View>

            <View style={styles.optionsCenterContainer}>
              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <PremiumChoiceCard
                    icon={option.icon}
                    iconTint={option.tint}
                    key={option.id}
                    onPress={() => setSelected(option.id)}
                    selected={selected === option.id}
                    subtitle={option.subtitle}
                    title={option.title}
                  />
                ))}
              </View>

              <View style={styles.reassuranceCard}>
                <MaterialDesignIcons color={theme.colors.primary} name="flower-outline" size={17} />
                <Text style={styles.reassuranceText}>
                  {t('miscarriageTryingAgain.reassurance')}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !selected}
            onPress={handleFinish}
            style={({pressed}) => [
              styles.nextButton,
              !selected && styles.nextButtonDisabled,
              (pressed || saving) && selected && styles.pressed,
            ]}>
            <Text style={styles.nextText}>
              {saving ? t('miscarriageTryingAgain.saving') : route.params?.mode === 'edit' ? t('common.save') : t('miscarriageTryingAgain.finish')}
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
  illustration: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  illustrationImage: {width: 190, height: 150},
  illustrationGlow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  illustrationCircle: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md},
  title: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 320,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.sm},
  optionsList: {gap: 11},
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  reassuranceText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
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
  nextButtonDisabled: {backgroundColor: withAlpha(theme.colors.primary, 0.45), shadowOpacity: 0, elevation: 0},
  nextText: {color: onPrimaryTextColor(theme), fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
  });
}

export default MiscarriageTryingAgainScreen;
