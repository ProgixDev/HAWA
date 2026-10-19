import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseStage,
  type MenopauseStage,
} from '../state/menopausePreferences';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaText} from '../components/ui/AwaText';
import {AwaButton} from '../components/ui/AwaButton';

type Props = NativeStackScreenProps<RootStackParamList, 'MenopauseStage'>;

// Display-only labels for the persisted MenopauseStage enum (the semantic
// value itself, never the label, is what's saved — see setMenopauseStage()).
function buildOptions(t: (key: string) => string): Array<{
  id: MenopauseStage;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  return [
    {
      id: 'perimenopause',
      title: t('menopauseStage.options.perimenopause.title'),
      subtitle: t('menopauseStage.options.perimenopause.subtitle'),
      icon: 'weather-sunset',
      tint: '#FCEADB',
    },
    {
      id: 'menopause',
      title: t('menopauseStage.options.menopause.title'),
      subtitle: t('menopauseStage.options.menopause.subtitle'),
      icon: 'flower-outline',
      tint: '#E7F2EA',
    },
    {
      id: 'unsure',
      title: t('menopauseStage.options.unsure.title'),
      subtitle: t('menopauseStage.options.unsure.subtitle'),
      icon: 'help-circle-outline',
      tint: '#EEE8F8',
    },
  ];
}

function MenopauseStageScreen({
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

  const [selected, setSelected] = useState<MenopauseStage | null>(
    () => getMenopausePreferences().stage,
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active) {
        setSelected(current => current ?? value.stage);
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


  const handleNext = async () => {
    if (saving || !selected) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseStage(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseSymptoms');
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
                {t('menopauseStage.eyebrow')}
              </AwaText>

              <AwaText variant="headlineMedium" style={styles.title}>
                {t('menopauseStage.title')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
                {t('menopauseStage.subtitle')}
              </AwaText>

            </View>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsIntroRow}>

                <AwaText variant="labelMedium">
                  {t('menopauseStage.optionsTitle')}
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

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.helperText}>
              {t('menopauseStage.helperText')}
            </AwaText>

            <AwaButton
              disabled={saving || !selected}
              label={saving
                    ? t('menopauseStage.saving')
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
      paddingTop: 8,
      paddingHorizontal: 6,
    },




    eyebrow: {marginBottom: 9},

    title: {textAlign: 'center'},

    subtitle: {marginTop: 12, maxWidth: 335, textAlign: 'center'},

    optionsWrapper: {
      marginTop: 31,
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
      marginTop: 28,
    },

    helperText: {marginBottom: 10, textAlign: 'center'},






  });
}

export default MenopauseStageScreen;
