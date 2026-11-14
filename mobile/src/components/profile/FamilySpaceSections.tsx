import React, {useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';

const DAUGHTER_ILLUSTRATION = require('../../assets/images/fille.png');
const PARTNER_ILLUSTRATION = require('../../assets/images/partner.png');

// The two family features of the Profile, each in its own illustrated section near the bottom of the page:
//  - "AWA pour ma fille": her own profile, separate from the mother's (managed profiles — opens "Gérer les profils");
//  - "AWA pour mon mari": sharing chosen markers with the husband (AWA à deux — opens its introduction).
// The wording is passed with a French `defaultValue` (new copy, not yet in the translation files); the call-to-action labels and the
// partner benefits reuse existing, already translated keys.

function Illustration({image, styles}: {image: number; styles: ReturnType<typeof createStyles>}) {
  return (
    <View style={styles.illustration}>
      <Image accessibilityIgnoresInvertColors resizeMode="contain" source={image} style={styles.illustrationImage} />
    </View>
  );
}

export function DaughterSpaceSection({names, onPress}: {names: string[]; onPress: () => void}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const ctaLabel = names.length > 0 ? t('profile.managedProfiles.sheetTitle') : t('profile.managedProfiles.addDaughterProfile');

  return (
    <View style={styles.section}>
      <AwaText accessibilityRole="header" variant="titleMedium">{t('profile.familySpace.daughterTitle', {defaultValue: 'AWA pour ma fille'})}</AwaText>
      <View style={styles.card}>
        <View style={styles.top}>
          <Illustration image={DAUGHTER_ILLUSTRATION} styles={styles} />
          <View style={styles.copy}>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">
              {t('profile.familySpace.daughterText', {defaultValue: 'Suis le cycle de ta fille dans un profil à elle : ses données restent séparées des tiennes. Tu passes d’un profil à l’autre en un geste.'})}
            </AwaText>
            {names.length > 0 ? (
              <AwaText colorRole="primary" emphasized numberOfLines={2} style={styles.names} variant="labelLarge">{names.join(', ')}</AwaText>
            ) : null}
          </View>
        </View>
        <AwaButton fullWidth icon={names.length > 0 ? 'account-switch-outline' : 'plus'} label={ctaLabel} onPress={onPress} style={styles.cta} variant="tonal" />
      </View>
    </View>
  );
}

export function PartnerSpaceSection({onPress}: {onPress: () => void}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const points = [t('awaADeux.intro.benefit2'), t('awaADeux.intro.benefit3'), t('awaADeux.intro.benefit4')];

  return (
    <View style={styles.section}>
      <AwaText accessibilityRole="header" variant="titleMedium">{t('profile.familySpace.partnerTitle', {defaultValue: 'AWA pour mon mari'})}</AwaText>
      <View style={styles.card}>
        <View style={styles.top}>
          <Illustration image={PARTNER_ILLUSTRATION} styles={styles} />
          <View style={styles.copy}>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">
              {t('profile.familySpace.partnerText', {defaultValue: 'Partage avec ton mari uniquement les repères que tu choisis. Rien n’est partagé sans que tu l’actives.'})}
            </AwaText>
          </View>
        </View>
        <View style={styles.points}>
          {points.map(point => (
            <View key={point} style={styles.point}>
              <MaterialDesignIcons color={theme.colors.primary} name="check-circle-outline" size={18} />
              <AwaText colorRole="onSurfaceVariant" style={styles.pointText} variant="bodySmall">{point}</AwaText>
            </View>
          ))}
        </View>
        <AwaButton
          accessibilityLabel={t('profile.familySpace.partnerTitle', {defaultValue: 'AWA pour mon mari'})}
          fullWidth
          icon="heart-multiple-outline"
          label={t('awaADeux.intro.discoverCta')}
          onPress={onPress}
          style={styles.cta}
          variant="tonal"
        />
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    section: {marginTop: 22, gap: 12},
    card: {
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      padding: 14,
    },
    top: {flexDirection: 'row', alignItems: 'center', gap: 14},
    illustration: {
      width: 92,
      height: 92,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    illustrationImage: {width: '88%', height: '88%'},
    copy: {flex: 1, minWidth: 0},
    names: {marginTop: 8},
    points: {marginTop: 12, gap: 8},
    point: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
    pointText: {flex: 1, minWidth: 0},
    cta: {marginTop: 14},
  });
}
