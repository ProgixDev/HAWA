import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import '../../i18n';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
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
  const {t} = useTranslation();
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
      ctaLabel={creating ? t('managedProfile.firstPeriod.creating') : t('common.continue')}
      description={t('managedProfile.firstPeriod.description')}
      onBack={navigation.goBack}
      onContinue={answer && !creating ? onContinue : undefined}
      title={t('managedProfile.firstPeriod.title')}>
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
        <AwaCard
          accessibilityLabel={t('managedProfile.firstPeriod.yes')}
          accessibilityRole="radio"
          accessibilityState={{checked: answer === 'yes'}}
          onPress={() => setAnswer('yes')}
          padding="none"
          style={[styles.card, answer === 'yes' && styles.cardSelected]}
          variant="outlined">
          <View style={styles.iconBox}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={22} />
          </View>
          <View style={styles.copy}>
            <AwaText variant="titleSmall">{t('managedProfile.firstPeriod.yes')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.subtitle}>{t('managedProfile.firstPeriod.yesSubtitle')}</AwaText>
          </View>
          <View style={[styles.radio, answer === 'yes' && styles.radioSelected]}>
            {answer === 'yes' ? <View style={styles.radioDot} /> : null}
          </View>
        </AwaCard>
      </Reveal>

      <Reveal index={2}>
        <AwaCard
          accessibilityLabel={t('managedProfile.firstPeriod.no')}
          accessibilityRole="radio"
          accessibilityState={{checked: answer === 'no'}}
          onPress={() => setAnswer('no')}
          padding="none"
          style={[styles.card, answer === 'no' && styles.cardSelected]}
          variant="outlined">
          <View style={styles.iconBox}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-remove-outline" size={22} />
          </View>
          <View style={styles.copy}>
            <AwaText variant="titleSmall">{t('managedProfile.firstPeriod.no')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.subtitle}>{t('managedProfile.firstPeriod.noSubtitle')}</AwaText>
          </View>
          <View style={[styles.radio, answer === 'no' && styles.radioSelected]}>
            {answer === 'no' ? <View style={styles.radioDot} /> : null}
          </View>
        </AwaCard>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    cardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    iconBox: {
      width: 46,
      height: 46,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },
    copy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    subtitle: {marginTop: 2},
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
    loadingRow: {marginTop: 6, alignItems: 'center'},
  });
}
