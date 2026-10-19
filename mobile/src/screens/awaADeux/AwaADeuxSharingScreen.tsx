import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaSwitch} from '../../components/ui/AwaSwitch';
import {AwaText} from '../../components/ui/AwaText';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {sharingSections, supportContent} from './awaADeuxDemo';

// "AWA à deux" — step 3: what she chooses to share, in four categories.
//
// The choices are SAVED on the device (src/state/awaADeuxSharingStore.ts) and come
// back when the app is reopened. Nothing is sent anywhere yet — there is no backend
// or partner account — but what the partner may see is decided by ONE rule,
// computePartnerVisibility() (src/utils/awaADeuxSharing.ts), which the preview below
// already uses and the future partner side must use too.
//
// The Pregnancy category only exists while pregnancy mode is on (the active objective
// is pregnancy). Only the listed choices are offered: notes, intimacy, detailed
// symptoms, medical data, medication, contraception, loss bleeding, lochia, Nifas and
// all religious / spiritual information are deliberately not part of this sharing.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxSharing'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export default function AwaADeuxSharingScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {toggles, isPregnant, setToggle} = useAwaADeuxSharing();
  const {partnerName} = useAwaADeuxPartnerName();
  // Two contexts, ONE screen (one route parameter, no duplicated screen):
  //  - "onboarding" (default): step 3 of the flow → the button continues to the association screen;
  //  - "manage": opened from "Partenaire associé" → the choices are saved as they change, so
  //    the button simply goes back there.
  const managing = route.params?.mode === 'manage';

  const sections = sharingSections().filter(section => !section.pregnancyOnly || isPregnant);

  return (
    <AwaADeuxStepLayout
      ctaLabel={managing ? t('awaADeux.sharing.ctaDone') : t('common.continue')}
      description={t('awaADeux.sharing.description', {partner: partnerSubject(partnerName)})}
      onBack={navigation.goBack}
      onContinue={() => (managing ? navigation.goBack() : navigation.navigate('AwaADeuxPairing'))}
      title={t('awaADeux.sharing.title')}>
      {sections.map((section, sectionIndex) => (
        <Reveal key={section.id} index={sectionIndex}>
          <AwaText accessibilityRole="header" variant="titleMedium" style={styles.sectionTitle}>{section.title}</AwaText>
          <AwaCard padding="none" style={styles.card} variant="filled">
            {section.items.map((item, itemIndex) => (
              <View key={item.key} style={[styles.row, itemIndex > 0 && styles.rowDivider]}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={item.icon as IconName} size={19} />
                </View>
                <AwaText maxFontSizeMultiplier={1.2} variant="bodyMedium" style={styles.rowLabel}>{item.label}</AwaText>
                <AwaSwitch
                  accessibilityLabel={item.label}
                  onValueChange={value => setToggle(item.key, value)}
                  value={toggles[item.key]}
                />
              </View>
            ))}

            {section.id === 'wellbeing'
              ? supportContent().map(item => (
                  <View key={item.id} style={[styles.row, styles.rowDivider]}>
                    <View style={styles.rowIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name={item.icon as IconName} size={19} />
                    </View>
                    <View style={styles.rowCopy}>
                      <AwaText maxFontSizeMultiplier={1.2} variant="bodyMedium" style={styles.rowLabel}>{item.label}</AwaText>
                      <AwaText colorRole="onSurfaceVariant" maxFontSizeMultiplier={1.2} variant="bodySmall" style={styles.rowNote}>{item.note}</AwaText>
                    </View>
                  </View>
                ))
              : null}
          </AwaCard>
        </Reveal>
      ))}
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    sectionTitle: {
      marginBottom: 8,
      marginLeft: 4,
      color: theme.colors.accent,
    },
    card: {paddingHorizontal: 14},
    row: {minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
    rowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    rowIcon: {
      width: 36,
      height: 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    rowCopy: {flex: 1, minWidth: 0},
    rowLabel: {flex: 1, minWidth: 0},
    rowNote: {marginTop: 2},
  });
}
