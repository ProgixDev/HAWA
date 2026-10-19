import React from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';

type Props = {
  /** The locked feature's own name, e.g. "Statistiques avancées" — never a
   * sales slogan. */
  title: string;
  /** One short, sober sentence explaining what unlocking gives her — no
   * aggressive sales language (see CLAUDE.md §2 "premium means refinement,
   * not decoration"). */
  description: string;
  onUpgrade: () => void;
  /** Overrides the default, translated CTA label only when a screen
   * genuinely needs different wording — defaults to the app's existing
   * canonical phrase (ProfileScreen.tsx's own Premium card,
   * profile.premiumCard.discoverPremium) so every locked surface reads
   * consistently. */
  ctaLabel?: string;
};

/** THE single reusable "this is a Premium feature" presentation — reused by
 * every screen that gates a feature behind Premium (Export, Statistiques
 * avancées, …) instead of each screen hand-rolling its own locked-state UI.
 * Opens the existing Premium bottom sheet via `onUpgrade` — never a second,
 * competing Premium screen. */
export function PremiumLockedCard({title, description, onUpgrade, ctaLabel}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {roles} = useAwaTokens();
  // Defaults to the app's existing canonical phrase (ProfileScreen.tsx's own
  // Premium card, profile.premiumCard.discoverPremium) so every locked
  // surface reads consistently — reused, not duplicated, per that key's own
  // byte-identical French wording.
  const resolvedCtaLabel = ctaLabel ?? t('profile.premiumCard.discoverPremium');

  return (
    <AwaCard padding="default" style={styles.card} variant="filled">
      <View style={styles.badgeRow}>
        <MaterialDesignIcons color={roles.accessible.primaryAsText} name="lock-outline" size={18} />
        <AwaText colorRole="primary" emphasized variant="labelLarge">{t('premium.lockedCard.badge')}</AwaText>
      </View>

      <AwaText emphasized style={styles.title} variant="titleMedium">{title}</AwaText>
      <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodyMedium">{description}</AwaText>

      <AwaButton
        accessibilityHint={t('profile.premiumCard.accessibilityHint')}
        accessibilityLabel={resolvedCtaLabel}
        icon="crown"
        label={resolvedCtaLabel}
        onPress={onUpgrade}
        variant="filled"
      />
    </AwaCard>
  );
}

const styles = StyleSheet.create({
  card: {alignItems: 'center', padding: 20},
  badgeRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  title: {textAlign: 'center', marginBottom: 8},
  description: {textAlign: 'center', marginBottom: 16},
});
