import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Easing,
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
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseLabTracking,
  type MenopauseLabTracking,
} from '../state/menopausePreferences';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaText} from '../components/ui/AwaText';
import {AwaButton} from '../components/ui/AwaButton';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MenopauseLabTracking'
>;

// Titles/subtitles are pure display copy translated via the
// menopauseLabTracking.options.* namespace below — `id` stays the stable
// MenopauseLabTracking enum value persisted by setMenopauseLabTracking(),
// never the translated label (CLAUDE.md §5/§6 real, non-fabricated data).
function useOptions(): Array<{
  id: MenopauseLabTracking;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  const {t} = useTranslation();
  return [
    {
      id: 'fsh',
      title: t('menopauseLabTracking.options.fsh.title'),
      subtitle: t('menopauseLabTracking.options.fsh.subtitle'),
      icon: 'flask-outline',
      tint: '#E7F0F5',
    },
    {
      id: 'estradiol',
      title: t('menopauseLabTracking.options.estradiol.title'),
      subtitle: t('menopauseLabTracking.options.estradiol.subtitle'),
      icon: 'test-tube',
      tint: '#F3E9F7',
    },
    {
      id: 'both',
      title: t('menopauseLabTracking.options.both.title'),
      subtitle: t('menopauseLabTracking.options.both.subtitle'),
      icon: 'clipboard-check-outline',
      tint: '#E7F0E8',
    },
    {
      id: 'none',
      title: t('menopauseLabTracking.options.none.title'),
      subtitle: t('menopauseLabTracking.options.none.subtitle'),
      icon: 'clock-outline',
      tint: '#EFE7F4',
    },
  ];
}

function MenopauseLabTrackingScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const OPTIONS = useOptions();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] =
    useState<MenopauseLabTracking | null>(
      () => getMenopausePreferences().labTracking,
    );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active) {
        setSelected(current => current ?? value.labTracking);
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
      duration: reduceMotion.current ? 0 : 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);


  const handleFinish = async () => {
    if (saving || !selected) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseLabTracking(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseReminders');
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
          outputRange: [18, 0],
        }),
      },
    ],
  };


  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.35, 0.7, 1]}
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
                Math.max(insets.bottom, 16) + spacing.md,
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
                {t('menopauseLabTracking.eyebrow')}
              </AwaText>

              <AwaText variant="headlineMedium" style={styles.title}>
                {t('menopauseLabTracking.title')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
                {t('menopauseLabTracking.subtitle')}
              </AwaText>

            </View>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsIntroRow}>
                <AwaText variant="labelMedium">
                  {t('menopauseLabTracking.optionsTitle')}
                </AwaText>

                <View style={styles.optionsLine} />
              </View>

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

            </View>

          </Animated.View>

          <View style={styles.bottomSection}>

            <View style={styles.finalInfoRow}>
              <View style={styles.finalInfoIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-check-outline"
                  size={16}
                />
              </View>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.helperText}>
                {t('menopauseLabTracking.helperText')}
              </AwaText>
            </View>

            <AwaButton
              disabled={saving || !selected}
              label={saving
                    ? t('periodStartSheet.saving')
                    : route.params?.mode === 'edit'
                      ? t('common.save')
                      : t('menopauseLabTracking.startButton')}
              onPress={handleFinish}
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
      paddingTop: 8,
      paddingHorizontal: 6,
    },




    eyebrow: {marginBottom: 9},

    title: {textAlign: 'center'},

    subtitle: {marginTop: 12, maxWidth: 340, textAlign: 'center'},

    optionsWrapper: {
      flexGrow: 1,
      justifyContent: 'center',
      marginTop: 28,
      paddingVertical: spacing.sm,
    },

    optionsIntroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingHorizontal: 2,
    },


    optionsLine: {
      flex: 1,
      height: 1,
      marginLeft: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },

    optionsList: {
      gap: 12,
    },

    bottomSection: {
      marginTop: 26,
    },

    finalInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 11,
      paddingHorizontal: 10,
    },

    finalInfoIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    helperText: {flexShrink: 1},






  });
}

export default MenopauseLabTrackingScreen;
