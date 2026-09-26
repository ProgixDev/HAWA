import React, {useMemo} from 'react';
import {StyleSheet, Text} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import PartnerPreviewCard from './PartnerPreviewCard';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerSubject, queBeforePartner} from '../../utils/awaADeuxPartnerWording';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import {DEFAULT_SHARING_TOGGLES} from './awaADeuxDemo';

// The step-1 preview always shows the DEFAULT choices (a demo of the idea), not her saved ones.
const DEFAULT_VISIBILITY = computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false});

// "AWA à deux" — step 1: what the partner sees. A UI preview with DEMO content only
// (see awaADeuxDemo.ts): not connected to any real data.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPartnerView'>;

export default function AwaADeuxPartnerViewScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {partnerName} = useAwaADeuxPartnerName();
  // "Ce qu’Amine voit" / (no name yet) "Ce que votre partenaire voit".
  const title = partnerName ? `Ce ${queBeforePartner(partnerName)}\nvoit` : 'Ce que votre\npartenaire voit';

  return (
    <AwaADeuxStepLayout
      ctaLabel="Continuer"
      description={`${partnerSubject(partnerName)} aura accès uniquement aux informations que vous choisissez de partager.`}
      onBack={navigation.goBack}
      onContinue={() => navigation.navigate('AwaADeuxBenefits')}
      title={title}>
      <Reveal index={0}>
        <PartnerPreviewCard visibility={DEFAULT_VISIBILITY} />
      </Reveal>

      <Reveal index={1}>
        <Text style={styles.caption}>Aperçu d’exemple</Text>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    caption: {color: theme.colors.textMuted, fontSize: 11.5, textAlign: 'center'},
  });
}
