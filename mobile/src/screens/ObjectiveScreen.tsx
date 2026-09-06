import React, {useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {setSelectedObjective, type ObjectiveId} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Objective = {
  id: ObjectiveId;
  icon: string;
  label: string;
  tint: string;
};

// Per-option decorative icon-tint palette — each objective keeps its own
// fixed pastel identity color (category accents, not a theme-structural
// color) and is deliberately left untouched by the theme migration.
const objectives: Objective[] = [
  {id: 'cycle', icon: '🗓️', label: 'Suivre mon cycle', tint: '#E7F0E8'},
  {id: 'conceive', icon: '💗', label: 'Essayer de concevoir', tint: '#FBE8E8'},
  {id: 'contraception', icon: '💊', label: 'Contraception', tint: '#F1E8F5'},
  {id: 'irregular', icon: '🪷', label: 'Cycles irréguliers (SOPK)', tint: '#FBE9E7'},
  {id: 'menopause', icon: '👤', label: 'périménopause / Ménopause', tint: '#EFE7F4'},
  {id: 'pregnancy', icon: '🤰', label: 'Suivi de grossesse', tint: '#FBE9EB'},
  {id: 'postpartum', icon: '🍼', label: 'Post-partum', tint: '#E8F1E9'},
  {id: 'loss', icon: '☁️', label: 'Après une fausse couche', tint: '#EDF2E9'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Objective'>;

function ObjectiveScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedId, setSelectedId] = useState('cycle');

  const handleNext = async () => {
    await setSelectedObjective(selectedId as ObjectiveId);
    navigation.navigate('CycleObjectiveConfirmation');
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
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <ScrollView contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{'Quel est ton\nobjectif principal ?'}</Text>

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
                  <View style={[styles.iconBox, {backgroundColor: objective.tint}]}>
                    <Text style={styles.icon}>{objective.icon}</Text>
                  </View>
                  <Text style={styles.optionLabel}>{objective.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}>
            <Text style={styles.nextButtonText}>Suivant</Text>
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
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: {
      marginBottom: spacing.lg,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 29,
      fontWeight: '700',
      lineHeight: 36,
      textAlign: 'center',
    },
    list: {gap: 7},
    option: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, 0.88),
      paddingHorizontal: 12,
    },
    optionSelected: {borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primarySoft, 0.96)},
    optionPressed: {opacity: 0.78},
    radio: {
      width: 20,
      height: 20,
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
    iconBox: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 12,
      borderRadius: 12,
    },
    icon: {fontSize: 21},
    optionLabel: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 19,
    },
    nextButton: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      borderRadius: 19,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.25,
      shadowRadius: 9,
      elevation: 5,
    },
    nextButtonPressed: {opacity: 0.86, transform: [{scale: 0.99}]},
    nextButtonText: {
      color: onPrimaryTextColor(theme),
      fontSize: 18,
      fontWeight: '600',
    },
  });
}

export default ObjectiveScreen;
