import React, {useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { spacing, TOP_SPACING_EXTRA } from '../theme/spacing';
import {
  getHasConfirmedCycleData,
  getHasConfirmedSpiritualMarkersChoice,
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  setSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

const features = [
  { icon: '🗓️', label: 'Calendrier hijri' },
  { icon: '🤲', label: 'Prières & statut de pureté' },
  { icon: '🌙', label: 'Jeûne (Ramadan, rattrapages)' },
  { icon: '🔔', label: 'Rappels de la prière' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'SpiritualPreferences'>;

function SpiritualPreferencesScreen({ navigation, route }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // null = no explicit choice yet (brand-new users start here — never
  // silently treated as true or false). Pre-fills her real answer if she's
  // already confirmed one before (e.g. navigating back), instead of
  // resetting to unanswered every time.
  const [enabled, setEnabled] = useState<boolean | null>(() =>
    getHasConfirmedSpiritualMarkersChoice() ? getSpiritualMarkersEnabled() : null,
  );
  const isYes = enabled === true;
  const isNo = enabled === false;

  const handleNext = () => {
    if (enabled === null) {return;}
    setSpiritualMarkersEnabled(enabled);

    // Reached from Summary's "Modify" action: save the toggle and return
    // directly, without forcing LocationScreen even if just turned on — the
    // Location row (where shown) will read "Non renseignée" until edited
    // separately, exactly like every other missing field.
    if (route.params?.mode === 'edit') {
      navigation.goBack();
      return;
    }

    // "Après une fausse couche" is the only objective where disabling
    // spiritual landmarks skips LocationScreen entirely (see
    // MiscarriageDateScreen) — every other objective keeps the existing,
    // unconditional "always go through Location" behavior unchanged.
    const objective = getSelectedObjective();
    if (!enabled && objective === 'postpartum') {
      navigation.navigate('PostpartumDeliveryDate');
      return;
    }
    if (!enabled && objective === 'pregnancy') {
      navigation.navigate('PregnancyDatingSetup');
      return;
    }
    if (!enabled && objective === 'loss') {
      navigation.navigate('MiscarriageDate');
      return;
    }
    if (!enabled && objective === 'cycle') {
      navigation.navigate('CycleInformation');
      return;
    }
    if (!enabled && objective === 'conceive') {
      // Same "confirm cycle baseline first" rule as LocationScreen's
      // equivalent branch — this path only fires when the user disabled
      // spiritual markers, which also skips Location entirely.
      navigation.navigate(getHasConfirmedCycleData() ? 'ConceptionTryingDuration' : 'CycleInformation');
      return;
    }
    if (!enabled && objective === 'menopause') {
      // Same reasoning as the other objectives above: Location only exists
      // to support spiritual/prayer-time features, so disabling spiritual
      // markers skips it entirely and goes straight into Menopause's own
      // dedicated onboarding (see LocationScreen.tsx's own 'menopause'
      // branch for the enabled=true path, which continues to the same
      // MenopauseStage screen after Location).
      navigation.navigate('MenopauseStage');
      return;
    }
    if (!enabled && objective === 'contraception') {
      // Same reasoning as the other objectives above: Location only exists
      // to support spiritual/prayer-time features, so disabling spiritual
      // markers skips it entirely and goes straight into Contraception's own
      // dedicated onboarding (see LocationScreen.tsx's own 'contraception'
      // branch for the enabled=true path, which continues to this exact same
      // ContraceptionMethod screen after Location).
      navigation.navigate('ContraceptionMethod');
      return;
    }
    if (!enabled && objective === 'irregular') {
      // Same reasoning as the other objectives above: Location only exists
      // to support spiritual/prayer-time features, so disabling spiritual
      // markers skips it entirely and goes straight into SOPK's own
      // dedicated onboarding (see LocationScreen.tsx's own 'irregular'
      // branch for the enabled=true path, which continues to this exact same
      // IrregularCyclePattern screen after Location). Before this branch
      // existed, 'irregular' fell through to the unconditional
      // navigation.navigate('Location') below regardless of this toggle.
      navigation.navigate('IrregularCyclePattern');
      return;
    }

    navigation.navigate('Location');
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {'Souhaites-tu activer\nles repères spirituels ?'}
            </Text>
            <Text style={styles.subtitle}>
              {
                'Calendrier hijri, prières, jeûne, état de pureté…\nTu pourras modifier ce choix à tout moment.'
              }
            </Text>
          </View>

          <View style={styles.choices} accessibilityRole="radiogroup">
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isYes }}
              onPress={() => setEnabled(true)}
              style={({ pressed }) => [
                styles.choice,
                isYes && styles.choiceActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, isYes && styles.radioActive]}>
                {isYes && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[styles.choiceText, isYes && styles.choiceTextActive]}
              >
                Oui, activer
              </Text>
              {isYes && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isNo }}
              onPress={() => setEnabled(false)}
              style={({ pressed }) => [
                styles.choice,
                isNo && styles.choiceActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, isNo && styles.radioActive]}>
                {isNo && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[styles.choiceText, isNo && styles.choiceTextActive]}
              >
                Non, pas maintenant
              </Text>
              {isNo && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.features}>
            {features.map(feature => (
              <View
                key={feature.label}
                accessibilityState={{ disabled: isNo }}
                style={[
                  styles.featureCard,
                  isNo && styles.featureCardDisabled,
                ]}
              >
                <View
                  style={[styles.iconBox, isNo && styles.iconBoxDisabled]}
                >
                  <Text style={[styles.icon, isNo && styles.iconDisabled]}>
                    {feature.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.featureText,
                    isNo && styles.featureTextDisabled,
                  ]}
                >
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={enabled === null}
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              enabled === null && styles.disabled,
              pressed && enabled !== null && styles.pressed,
            ]}
          >
            <Text style={styles.nextText}>Suivant</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  const onPrimary = onPrimaryTextColor(theme);
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: theme.colors.background },

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

    safeArea: { flex: 1 },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: TOP_SPACING_EXTRA,
      paddingHorizontal: spacing.lg,
      paddingBottom: 10,
    },
    header: { alignItems: 'center', marginBottom: spacing.lg },
    title: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 12,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    choices: { gap: 8 },
    choice: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.16),
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, 0.86),
      paddingHorizontal: spacing.md,
    },
    choiceActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 7,
      elevation: 3,
    },
    radio: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 11,
    },
    radioActive: { borderColor: withAlpha(onPrimary, 0.55) },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: onPrimary,
    },
    choiceText: {
      flex: 1,
      marginLeft: spacing.md,
      color: theme.colors.text,
      fontSize: 17,
    },
    choiceTextActive: { color: onPrimary, fontWeight: '600' },
    checkCircle: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    check: { color: theme.colors.primary, fontSize: 18, fontWeight: '700' },
    pressed: { opacity: 0.82 },
    features: { gap: 7, marginTop: spacing.md },
    featureCard: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 17,
      backgroundColor: withAlpha(theme.colors.surface, 0.84),
      paddingHorizontal: 12,
    },
    featureCardDisabled: {
      borderColor: withAlpha(theme.colors.textMuted, 0.2),
      backgroundColor: withAlpha(theme.colors.surfaceSecondary, 0.8),
    },
    iconBox: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primarySoft, 0.82),
    },
    iconBoxDisabled: { backgroundColor: theme.colors.surfaceSecondary },
    icon: { fontSize: 21 },
    iconDisabled: { opacity: 0.32 },
    featureText: { flex: 1, color: theme.colors.text, fontSize: 15, lineHeight: 19 },
    featureTextDisabled: { color: theme.colors.textMuted },
    nextButton: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      borderRadius: 19,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 9,
      elevation: 5,
    },
    nextText: { color: onPrimary, fontSize: 18, fontWeight: '600' },
    disabled: { opacity: 0.55 },
  });
}

export default SpiritualPreferencesScreen;
