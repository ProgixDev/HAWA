import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getManagedProfileDraft, updateManagedProfileDraft, clearManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {addManagedProfile} from '../../state/managedProfilesStore';

// Step 2/4 — "A-t-elle déjà eu ses premières règles ?". Branches the flow:
//   Oui → ManagedProfileCycleSetup (still to fill in the cycle fields)
//   Non → the profile is created RIGHT HERE (no lastPeriodDate/cycleLength/periodLength
//         is ever fabricated for it) and the flow jumps straight to Success.
//
// Illustration: the same fille.png used across the managed-profile flow (Type screen's
// "Ma fille" card, the Daughter Information default avatar) — this is a decorative
// onboarding illustration, unrelated to profileImageUri (the daughter's actual custom
// photo, chosen on the Information screen and unaffected by anything here).

const FIRST_PERIOD_ILLUSTRATION = require('../../assets/images/fille.png');

type Props = NativeStackScreenProps<RootStackParamList, 'ManagedProfileFirstPeriod'>;
type Answer = 'yes' | 'no';

export default function ManagedProfileFirstPeriodScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const draft = getManagedProfileDraft();
  const [answer, setAnswer] = useState<Answer | null>(
    draft.hasHadFirstPeriod === null ? null : draft.hasHadFirstPeriod ? 'yes' : 'no',
  );
  const [creating, setCreating] = useState(false);

  const onContinue = async () => {
    if (!answer || creating || !draft.firstName || !draft.birthDate) {return;}

    if (answer === 'yes') {
      updateManagedProfileDraft({hasHadFirstPeriod: true});
      navigation.navigate('ManagedProfileCycleSetup');
      return;
    }

    // "Non" — nothing more to ask; create the profile now, with no fabricated cycle data.
    setCreating(true);
    try {
      const profile = await addManagedProfile({
        type: 'daughter',
        firstName: draft.firstName,
        birthDate: draft.birthDate.toLocaleDateString('en-CA'),
        hasHadFirstPeriod: false,
        profileImageUri: draft.profileImageUri,
      });
      clearManagedProfileDraft();
      navigation.replace('ManagedProfileSuccess', {firstName: profile.firstName, profileId: profile.id});
    } finally {
      setCreating(false);
    }
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel={creating ? 'Création…' : 'Continuer'}
      description="Cela nous permet d'adapter son expérience."
      onBack={navigation.goBack}
      onContinue={answer && !creating ? onContinue : undefined}
      title="A-t-elle déjà eu ses premières règles ?">
      <Reveal index={0}>
        <View style={styles.illustrationZone}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={FIRST_PERIOD_ILLUSTRATION}
            style={styles.firstPeriodIllustration}
          />
        </View>
      </Reveal>

      <Reveal index={1}>
        <Pressable
          accessibilityLabel="Oui"
          accessibilityRole="radio"
          accessibilityState={{checked: answer === 'yes'}}
          onPress={() => setAnswer('yes')}
          style={({pressed}) => [styles.card, answer === 'yes' && styles.cardSelected, pressed && styles.pressed]}>
          <View style={styles.iconBox}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={22} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Oui</Text>
            <Text style={styles.subtitle}>Elle a déjà eu ses premières règles.</Text>
          </View>
          <View style={[styles.radio, answer === 'yes' && styles.radioSelected]}>
            {answer === 'yes' ? <View style={styles.radioDot} /> : null}
          </View>
        </Pressable>
      </Reveal>

      <Reveal index={2}>
        <Pressable
          accessibilityLabel="Non"
          accessibilityRole="radio"
          accessibilityState={{checked: answer === 'no'}}
          onPress={() => setAnswer('no')}
          style={({pressed}) => [styles.card, answer === 'no' && styles.cardSelected, pressed && styles.pressed]}>
          <View style={styles.iconBox}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-remove-outline" size={22} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Non</Text>
            <Text style={styles.subtitle}>Elle n'a pas encore eu ses premières règles.</Text>
          </View>
          <View style={[styles.radio, answer === 'no' && styles.radioSelected]}>
            {answer === 'no' ? <View style={styles.radioDot} /> : null}
          </View>
        </Pressable>
      </Reveal>

      {creating ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    illustrationZone: {alignItems: 'center', marginBottom: 6},
    // fille.png itself — no background/card behind it (its own transparency shows the
    // page background through), sized to read as a real illustration, not a tiny icon.
    firstPeriodIllustration: {width: 210, height: 210},
    card: {
      minHeight: 74,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 13,
      paddingVertical: 12,
      elevation: 3,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.07,
      shadowRadius: 9,
    },
    cardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    iconBox: {
      width: 46,
      height: 46,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },
    copy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    title: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
    subtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    radio: {
      width: 22,
      height: 22,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 11,
    },
    radioSelected: {borderColor: theme.colors.primary},
    radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary},
    pressed: {opacity: 0.86},
    loadingRow: {marginTop: 6, alignItems: 'center'},
  });
}
