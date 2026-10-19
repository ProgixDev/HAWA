import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseTrackedSymptoms,
  type MenopauseSymptom,
} from '../state/menopausePreferences';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';
import {AwaButton} from '../components/ui/AwaButton';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MenopauseSymptoms'
>;

// Display-only labels for the persisted MenopauseSymptom enum (the semantic
// value itself, never the label, is what's saved — see
// setMenopauseTrackedSymptoms()). Wording mirrors
// menopauseJournalConfig.ts's MENOPAUSE_SYMPTOM_OPTIONS labels so the setup
// screen and the journal/dashboard never drift apart.
function buildOptions(t: (key: string) => string): Array<{
  id: MenopauseSymptom;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  return [
    {
      id: 'hot_flashes',
      title: t('menopauseSymptoms.options.hot_flashes.title'),
      subtitle: t('menopauseSymptoms.options.hot_flashes.subtitle'),
      icon: 'fire',
      tint: '#FBE9E7',
    },
    {
      id: 'night_sweats',
      title: t('menopauseSymptoms.options.night_sweats.title'),
      subtitle: t('menopauseSymptoms.options.night_sweats.subtitle'),
      icon: 'water-outline',
      tint: '#E8F1F6',
    },
    {
      id: 'sleep_disturbances',
      title: t('menopauseSymptoms.options.sleep_disturbances.title'),
      subtitle: t('menopauseSymptoms.options.sleep_disturbances.subtitle'),
      icon: 'weather-night',
      tint: '#EEE8F6',
    },
    {
      id: 'fatigue',
      title: t('menopauseSymptoms.options.fatigue.title'),
      subtitle: t('menopauseSymptoms.options.fatigue.subtitle'),
      icon: 'sleep',
      tint: '#F4EEE3',
    },
    {
      id: 'mood_changes',
      title: t('menopauseSymptoms.options.mood_changes.title'),
      subtitle: t('menopauseSymptoms.options.mood_changes.subtitle'),
      icon: 'heart-outline',
      tint: '#F4EAF7',
    },
    {
      id: 'brain_fog',
      title: t('menopauseSymptoms.options.brain_fog.title'),
      subtitle: t('menopauseSymptoms.options.brain_fog.subtitle'),
      icon: 'weather-fog',
      tint: '#E9EEF5',
    },
  ];
}

function MenopauseSymptomsScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const OPTIONS = useMemo(() => buildOptions(t), [t]);

  const entrance = useRef(new Animated.Value(0)).current;

  const reduceMotion = useRef(false);
  const hasHydratedRef = useRef(false);

  const [selected, setSelected] = useState<MenopauseSymptom[]>(
    () => getMenopausePreferences().trackedSymptoms,
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active && !hasHydratedRef.current) {
        hasHydratedRef.current = true;

        setSelected(current =>
          current.length > 0
            ? current
            : value.trackedSymptoms,
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);


  const toggle = (id: MenopauseSymptom) => {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  };

  const handleNext = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseTrackedSymptoms(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseHormonalTreatment');
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };


  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.34, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>


      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top),
              paddingBottom:
                Math.max(insets.bottom, 16) + spacing.sm,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Animated.View
            style={[
              styles.mainContent,
              entranceStyle,
            ]}>

            <View style={styles.heroSection}>
              <AwaText variant="labelSmall" colorRole="primary" style={styles.eyebrow}>
                {t('menopauseSymptoms.eyebrow')}
              </AwaText>

              <AwaText variant="titleLarge" style={styles.title}>
                {t('menopauseSymptoms.title')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
                {t('menopauseSymptoms.subtitle')}
              </AwaText>
            </View>

            <AwaCard padding="none" variant="filled" style={styles.summaryCard}>
              <View style={styles.summaryLeft}>

                <View style={styles.summaryIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="check-circle-outline"
                    size={14}
                  />
                </View>

                <View style={styles.summaryTextWrapper}>
                  <AwaText variant="labelSmall">
                    {t('menopauseSymptoms.summary.title')}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summarySubtitle}>
                    {selected.length === 0
                      ? t('menopauseSymptoms.summary.none')
                      : t('menopauseSymptoms.summary.selectedCount', {
                          count: selected.length,
                        })}
                  </AwaText>
                </View>

              </View>

              <View
                style={[
                  styles.counterBadge,
                  selected.length === 0 &&
                    styles.counterBadgeEmpty,
                ]}>

                <Text
                  style={[
                    styles.counterText,
                    selected.length === 0 &&
                      styles.counterTextEmpty,
                  ]}>
                  {selected.length}
                </Text>

              </View>
            </AwaCard>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsHeader}>
                <AwaText variant="labelSmall" style={styles.optionsTitle}>
                  {t('menopauseSymptoms.options.title')}
                </AwaText>

                {selected.length > 0 && (
                  <AwaButton
                    label={t('menopauseSymptoms.options.clear')}
                    onPress={() => setSelected([])}
                    size="compact"
                    style={styles.clearButton}
                    variant="text"
                  />
                )}
              </View>

              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <PremiumChoiceCard
                    icon={option.icon}
                    iconTint={option.tint}
                    key={option.id}
                    onPress={() => toggle(option.id)}
                    selected={selected.includes(option.id)}
                    selectionStyle="checkbox"
                    subtitle={option.subtitle}
                    title={option.title}
                  />
                ))}
              </View>

            </View>

          </Animated.View>

          <View style={styles.bottomSection}>

            <View style={styles.helperBox}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="information-outline"
                size={14}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.helperText}>
                {t('menopauseSymptoms.helper')}
              </AwaText>
            </View>

            <AwaButton
              disabled={saving}
              label={saving
                    ? t('menopauseSymptoms.saving')
                    : route.params?.mode === 'edit'
                      ? t('common.save')
                      : t('common.continue')}
              onPress={handleNext}
              size="large"
            />

          </View>

        </ScrollView>

      </View>

    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safeArea: {
      flex: 1,
    },





    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },

    mainContent: {
      flexGrow: 1,
    },

    heroSection: {
      alignItems: 'center',
      paddingTop: 2,
      paddingHorizontal: 8,
    },



    eyebrow: {marginBottom: 5},

    title: {maxWidth: 310, textAlign: 'center'},

    subtitle: {maxWidth: 300, marginTop: 7, textAlign: 'center'},

    summaryCard: {minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 12, paddingVertical: 12},

    summaryLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },

    summaryIcon: {
      width: 30,
      height: 30,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },

    summaryTextWrapper: {
      flex: 1,
      minWidth: 0,
    },


    summarySubtitle: {marginTop: 2},

    counterBadge: {
      minWidth: 25,
      minHeight: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 7,
      paddingHorizontal: 6,
      borderRadius: 13,
      backgroundColor: theme.colors.primary,
    },

    counterBadgeEmpty: {
      backgroundColor: theme.colors.surfaceSecondary,
    },

    counterText: {
      color: onPrimaryTextColor(theme),
      fontSize: 11,
      fontWeight: '800',
    },

    counterTextEmpty: {
      color: theme.colors.textMuted,
    },

    optionsWrapper: {
      marginTop: 16,
    },

    optionsHeader: {
      minHeight: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 2,
    },

    optionsTitle: {flex: 1, minWidth: 0},

    clearButton: {
      marginLeft: 8,
    },


    optionsList: {
      gap: 8,
      paddingBottom: spacing.xs,
    },

    bottomSection: {
      marginTop: 16,
    },

    helperBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    helperText: {flex: 1, minWidth: 0, marginLeft: 5},





  });
}

export default MenopauseSymptomsScreen;
