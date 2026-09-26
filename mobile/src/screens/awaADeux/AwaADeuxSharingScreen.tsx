import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {PartnerPreviewModal} from './AwaADeuxDialogs';
import {SHARING_SECTIONS, SUPPORT_CONTENT} from './awaADeuxDemo';

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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {toggles, isPregnant, setToggle} = useAwaADeuxSharing();
  const {partnerName} = useAwaADeuxPartnerName();
  // Two contexts, ONE screen (one route parameter, no duplicated screen):
  //  - "onboarding" (default): step 3 of the flow → the button continues to the association screen;
  //  - "manage": opened from "Partenaire associé" → the choices are saved as they change, so
  //    the button simply goes back there.
  const managing = route.params?.mode === 'manage';
  const [previewOpen, setPreviewOpen] = useState(false);

  const sections = SHARING_SECTIONS.filter(section => !section.pregnancyOnly || isPregnant);

  return (
    <AwaADeuxStepLayout
      ctaLabel={managing ? 'Terminé' : 'Continuer'}
      description={`${partnerSubject(partnerName)} verra uniquement les informations que vous activez.`}
      onBack={navigation.goBack}
      onContinue={() => (managing ? navigation.goBack() : navigation.navigate('AwaADeuxPairing'))}
      title={'Choisissez ce que\nvous souhaitez partager'}>
      {sections.map((section, sectionIndex) => (
        <Reveal key={section.id} index={sectionIndex}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <View key={item.key} style={[styles.row, itemIndex > 0 && styles.rowDivider]}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={item.icon as IconName} size={19} />
                </View>
                <Text maxFontSizeMultiplier={1.2} style={styles.rowLabel}>{item.label}</Text>
                <Switch
                  accessibilityLabel={item.label}
                  accessibilityRole="switch"
                  accessibilityState={{checked: toggles[item.key]}}
                  ios_backgroundColor={withAlpha(theme.colors.primary, 0.14)}
                  onValueChange={value => setToggle(item.key, value)}
                  thumbColor={theme.colors.surface}
                  trackColor={{false: withAlpha(theme.colors.primary, 0.18), true: theme.colors.primary}}
                  value={toggles[item.key]}
                />
              </View>
            ))}

            {section.id === 'wellbeing'
              ? SUPPORT_CONTENT.map(item => (
                  <View key={item.id} style={[styles.row, styles.rowDivider]}>
                    <View style={styles.rowIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name={item.icon as IconName} size={19} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text maxFontSizeMultiplier={1.2} style={styles.rowLabel}>{item.label}</Text>
                      <Text maxFontSizeMultiplier={1.2} style={styles.rowNote}>{item.note}</Text>
                    </View>
                  </View>
                ))
              : null}
          </View>
        </Reveal>
      ))}

      <Reveal index={sections.length}>
        <Pressable
          accessibilityLabel="Voir un aperçu du côté partenaire"
          accessibilityRole="button"
          onPress={() => setPreviewOpen(true)}
          style={({pressed}) => [styles.previewButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="eye-outline" size={20} />
          <Text maxFontSizeMultiplier={1.2} style={styles.previewText}>Voir un aperçu du côté partenaire</Text>
        </Pressable>
      </Reveal>

      {/* The same preview as the partner screen (one implementation), built from the CURRENT choices. */}
      <PartnerPreviewModal onClose={() => setPreviewOpen(false)} visible={previewOpen} />
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    sectionTitle: {
      marginBottom: 8,
      marginLeft: 4,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 16.5,
      fontWeight: '700',
    },
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      ...theme.shadow,
    },
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
    rowLabel: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14.5, lineHeight: 20, fontWeight: '600'},
    rowNote: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    previewButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderWidth: 1.2,
      borderColor: withAlpha(theme.colors.primary, 0.4),
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 16,
    },
    previewText: {color: theme.colors.primary, fontSize: 14.5, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
