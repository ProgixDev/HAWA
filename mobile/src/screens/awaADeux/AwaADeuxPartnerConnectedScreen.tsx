import React, {useMemo, useState} from 'react';
import {Image, StyleSheet, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {stopDemoSharing} from '../../state/awaADeuxDemoStore';
import {partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {StopSharingModal} from './AwaADeuxDialogs';
import {sharingSections} from './awaADeuxDemo';
import {rebuildStackToAssociation} from './awaADeuxNavigation';
import {useEntrance} from './useEntrance';

// "AWA à deux" — the partner management screen shown once a partner is "connected".
//
// FRONTEND DEMO ONLY: the connection is the in-memory switch of awaADeuxDemoStore.ts
// (set by "Continuer" on the association screen — a demo progression, not a pairing);
// no partner, account or backend exists. The card lists the CURRENT sharing choices
// through computePartnerVisibility(): only what is switched on. Managing them happens on
// the permissions screen — there is exactly one action for that.
//
// Compact: sizes follow the window height so that, on a normal phone, the title, the
// illustration, the card and the three actions fit in one viewport; on a short phone the
// screen simply scrolls (nothing is squeezed). Colors: the resolved AWA theme only.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPartnerConnected'>;

const PARTNER_IMAGE = require('../../assets/images/partenaire.png');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function AwaADeuxPartnerConnectedScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {height} = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // Illustration: medium (about 17% of the window height), never tiny, never dominant.
  const heroHeight = Math.round(clamp(height * 0.17, 96, 150));
  const short = height < 700;
  const styles = useMemo(() => createStyles(theme, heroHeight, short), [theme, heroHeight, short]);

  const {partnerName} = useAwaADeuxPartnerName();
  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});

  const [stopOpen, setStopOpen] = useState(false);

  // Only what is ON, in the order of the sharing screen.
  const sharedItems = sharingSections().flatMap(section => section.items).filter(item => visibility.fields[item.key]);

  // Illustration: fade + slight scale (0.96 → 1); success check: a quick scale-in after it.
  const heroEntrance = useEntrance(120, 320, reduceMotion, 8, 0.96);
  const checkProgress = useSharedValue(reduceMotion ? 1 : 0);
  React.useEffect(() => {
    if (!reduceMotion) {
      checkProgress.value = withDelay(380, withTiming(1, {duration: 240, easing: Easing.out(Easing.cubic)}));
    }
  }, [reduceMotion, checkProgress]);
  const checkStyle = useAnimatedStyle(() => ({opacity: checkProgress.value, transform: [{scale: 0.6 + 0.4 * checkProgress.value}]}));

  const confirmStop = () => {
    stopDemoSharing();
    setStopOpen(false);
    rebuildStackToAssociation(navigation);
  };

  return (
    <AwaADeuxStepLayout
      compact={{titleFontSize: 24, titleLineHeight: 30, bodyMarginTop: short ? 8 : 12, bodyGap: short ? 8 : 10}}
      onBack={navigation.goBack}
      title={t('awaADeux.connected.title')}>
      <Animated.View style={[styles.hero, heroEntrance]}>
        {/* Decorative illustration (the title says it all): not announced */}
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          source={PARTNER_IMAGE}
          style={styles.heroImage}
        />
        <Animated.View accessibilityLabel={t('awaADeux.connected.accessibilityConnected')} accessibilityRole="image" style={[styles.check, checkStyle]}>
          <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="check" size={18} />
        </Animated.View>
      </Animated.View>

      <Reveal index={1}>
        <AwaText variant="titleLarge" style={styles.partnerName}>{partnerSubject(partnerName)}</AwaText>
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.since}>{t('awaADeux.connected.since')}</AwaText>
      </Reveal>

      <Reveal index={2}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <AwaText accessibilityRole="header" variant="titleSmall" style={styles.cardTitle}>{t('awaADeux.connected.sharedInfoTitle')}</AwaText>
          {sharedItems.length === 0 ? (
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.emptyText}>{t('awaADeux.connected.emptyShared')}</AwaText>
          ) : (
            sharedItems.map((item, index) => (
              <View key={item.key} style={[styles.sharedRow, index > 0 && styles.sharedRowDivider]}>
                <MaterialDesignIcons color={theme.colors.primary} name={item.icon as never} size={20} />
                <AwaText maxFontSizeMultiplier={1.2} variant="bodyMedium" style={styles.sharedLabel}>{item.label}</AwaText>
                <View importantForAccessibility="no-hide-descendants" style={styles.tick}>
                  <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="check" size={12} />
                </View>
              </View>
            ))
          )}
        </AwaCard>
      </Reveal>

      <Reveal index={3}>
        <AwaButton
          accessibilityLabel={t('awaADeux.connected.manageAction')}
          fullWidth
          icon="tune-variant"
          label={t('awaADeux.connected.manageAction')}
          minHeight={short ? 50 : 54}
          onPress={() => navigation.navigate('AwaADeuxSharing', {mode: 'manage'})}
          variant="outlined"
        />
      </Reveal>

      <Reveal index={4}>
        <AwaButton
          accessibilityLabel={t('awaADeux.connected.stopAction')}
          fullWidth
          icon="account-cancel-outline"
          label={t('awaADeux.connected.stopAction')}
          minHeight={short ? 50 : 54}
          onPress={() => setStopOpen(true)}
          variant="destructive"
        />

        <StopSharingModal
          onCancel={() => setStopOpen(false)}
          onConfirm={confirmStop}
          partnerName={partnerName}
          visible={stopOpen}
        />
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme, heroHeight: number, short: boolean) {
  return StyleSheet.create({
    hero: {alignSelf: 'center', width: Math.round(heroHeight * 1.3), height: heroHeight, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    check: {
      position: 'absolute',
      bottom: 2,
      right: 6,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 3,
      borderColor: theme.colors.background,
      backgroundColor: theme.colors.success,
    },
    partnerName: {color: theme.colors.accent, textAlign: 'center'},
    since: {marginTop: 2, textAlign: 'center'},
    card: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6},
    cardTitle: {marginBottom: 2},
    emptyText: {paddingVertical: 8},
    sharedRow: {minHeight: short ? 40 : 44, flexDirection: 'row', alignItems: 'center', gap: 12},
    sharedRowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    sharedLabel: {flex: 1, minWidth: 0},
    tick: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.success,
    },
  });
}
