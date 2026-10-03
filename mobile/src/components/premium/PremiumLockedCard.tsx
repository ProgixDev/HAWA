import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';

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
  // Defaults to the app's existing canonical phrase (ProfileScreen.tsx's own
  // Premium card, profile.premiumCard.discoverPremium) so every locked
  // surface reads consistently — reused, not duplicated, per that key's own
  // byte-identical French wording.
  const resolvedCtaLabel = ctaLabel ?? t('profile.premiumCard.discoverPremium');

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.lockIconCircle}>
          <MaterialDesignIcons color={homeColors.primary} name="lock-outline" size={18} />
        </View>
        <Text style={styles.badgeText}>{t('premium.lockedCard.badge')}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <Pressable
        accessibilityHint={t('profile.premiumCard.accessibilityHint')}
        accessibilityLabel={resolvedCtaLabel}
        accessibilityRole="button"
        onPress={onUpgrade}
        style={({pressed}) => [styles.cta, pressed && styles.pressed]}>
        <MaterialDesignIcons color="#FFFFFF" name="crown" size={16} />
        <Text style={styles.ctaText}>{resolvedCtaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    ...homeShadow,
  },
  badgeRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  lockIconCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: homeColors.lightLavender,
  },
  badgeText: {color: homeColors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 0.3},
  title: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    color: homeColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  ctaText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  pressed: {opacity: 0.85},
});
