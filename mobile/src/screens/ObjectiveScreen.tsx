import React, {useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import '../i18n';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {setSelectedObjective, type ObjectiveId} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaText} from '../components/ui/AwaText';
import {ObjectiveIcon} from '../components/onboarding/ObjectiveIcon';

type Objective = {
  id: ObjectiveId;
  labelKey: string;
};

// The icon of each objective comes from the shared ObjectiveIcon (also used by the Profile's "Changer mon objectif" sheet).
const objectives: Objective[] = [
  {id: 'cycle', labelKey: 'objectives.cycle'},
  {id: 'conceive', labelKey: 'objectives.conceive'},
  {id: 'contraception', labelKey: 'objectives.contraception'},
  {id: 'irregular', labelKey: 'objectives.irregular'},
  {id: 'menopause', labelKey: 'objectiveScreen.menopauseLabel'},
  {id: 'pregnancy', labelKey: 'objectives.pregnancy'},
  {id: 'postpartum', labelKey: 'objectiveScreen.postpartumLabel'},
  {id: 'loss', labelKey: 'objectives.loss'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Objective'>;

function ObjectiveScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const [selectedId, setSelectedId] = useState('cycle');

  const handleNext = async () => {
    try {
      await setSelectedObjective(selectedId as ObjectiveId);
    } catch (saveError) {
      // Not persisted (services/saveFailure.ts): stay on this screen with the selection intact.
      presentSaveFailure(saveError);
      return;
    }
    navigation.navigate('CycleObjectiveConfirmation');
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <ScrollView contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
          <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">
            {t('objectiveScreen.title')}
          </AwaText>

          <View style={styles.list}>
            {objectives.map(objective => {
              const selected = objective.id === selectedId;

              return (
                <Pressable
                  key={objective.id}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => setSelectedId(objective.id)}
                  style={({pressed}) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <ObjectiveIcon objective={objective.id} selected={selected} style={styles.icon} />
                  <AwaText style={styles.optionLabel} variant="titleMedium">
                    {t(objective.labelKey)}
                  </AwaText>
                </Pressable>
              );
            })}
          </View>

          <AwaButton
            fullWidth
            label={t('objectiveScreen.next')}
            onPress={handleNext}
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
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: {
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    list: {gap: 7},
    option: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.surface, 0.88),
      paddingHorizontal: 16,
      // DESIGN.md: a long label (DE/TR/RU) that wraps to two lines must never touch the card edge.
      paddingVertical: 12,
    },
    optionSelected: {borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primarySoft, 0.96)},
    optionPressed: {opacity: 0.78},
    radio: {
      width: 20,
      height: 20,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 10,
    },
    radioSelected: {borderColor: theme.colors.primary},
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    icon: {marginHorizontal: 12},
    optionLabel: {flex: 1},
    nextButton: {marginTop: spacing.md},
  });
}

export default ObjectiveScreen;
