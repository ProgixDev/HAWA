import React, {memo, useContext, useMemo} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {NavigationContext, type NavigationProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {awaADeuxEntryRoute} from '../../screens/awaADeux/awaADeuxNavigation';
import {useProfileSwitch} from '../../hooks/useProfileSwitch';
import {getDemoPartnerState} from '../../state/awaADeuxDemoStore';
import {startManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AWA_DISPLAY_FONT} from '../../theme/awaTypography';
import {AwaText} from '../ui/AwaText';

const DAUGHTER_ILLUSTRATION = require('../../assets/images/fille.png');
const PARTNER_ILLUSTRATION = require('../../assets/images/partner.png');

type CardProps = {
  image: number;
  title: string;
  caption: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
};

function DiscoverCard({image, title, caption, onPress, styles}: CardProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.illustration}>
        <Image accessibilityIgnoresInvertColors resizeMode="contain" source={image} style={styles.illustrationImage} />
      </View>
      <AwaText emphasized numberOfLines={2} style={styles.cardTitle} variant="titleSmall">{title}</AwaText>
      <AwaText colorRole="onSurfaceVariant" numberOfLines={3} style={styles.cardCaption} variant="bodySmall">{caption}</AwaText>
    </Pressable>
  );
}

// "Découvrir", at the very bottom of every objective's Home: two illustrated buttons leading to the family features.
// Owner-only — a daughter's own space never offers them (AWA à deux belongs to the mother's account). The wording is passed with a
// French `defaultValue` (new copy, not yet in the translation files).
function DiscoverSection(): React.JSX.Element | null {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useContext(NavigationContext) as NavigationProp<RootStackParamList> | undefined;
  const {daughters, ownerActive} = useProfileSwitch();

  if (!ownerActive) {
    return null;
  }

  const openDaughter = () => {
    if (daughters.length > 0) {
      // her space already exists: "AWA pour ma fille" on the Profile lists the profiles and switches between them
      navigation?.navigate('Profile' as never);
      return;
    }
    startManagedProfileDraft();
    navigation?.navigate('ManagedProfileType');
  };
  const openPartner = () => {
    navigation?.navigate(awaADeuxEntryRoute(getDemoPartnerState().partnerConnected) as never);
  };

  return (
    <View style={styles.section}>
      {/* same font, size and weight as the "Derniers articles" / "Pour t'accompagner" section titles */}
      <Text accessibilityRole="header" style={styles.sectionTitle}>{t('discover.title', {defaultValue: 'Découvrir'})}</Text>
      <View style={styles.row}>
        <DiscoverCard
          caption={t('discover.daughterCaption', {defaultValue: 'Suis son cycle dans un espace à elle'})}
          image={DAUGHTER_ILLUSTRATION}
          onPress={openDaughter}
          styles={styles}
          title={t('discover.daughterTitle', {defaultValue: 'AWA pour ma fille'})}
        />
        <DiscoverCard
          caption={t('discover.partnerCaption', {defaultValue: 'Partage les repères que tu choisis'})}
          image={PARTNER_ILLUSTRATION}
          onPress={openPartner}
          styles={styles}
          title={t('discover.partnerTitle', {defaultValue: 'AWA pour mon mari'})}
        />
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    section: {marginTop: 20, gap: 12},
    sectionTitle: {color: theme.colors.text, fontFamily: AWA_DISPLAY_FONT, fontSize: 19, lineHeight: 26, fontWeight: '600'},
    row: {flexDirection: 'row', gap: 12},
    card: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      padding: 12,
    },
    illustration: {
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    illustrationImage: {width: '80%', height: '88%'},
    cardTitle: {marginTop: 10},
    cardCaption: {marginTop: 4},
    pressed: {opacity: 0.85, transform: [{scale: 0.985}]},
  });
}

export default memo(DiscoverSection);
