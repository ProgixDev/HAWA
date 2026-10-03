import React, {useMemo} from 'react';
import {StyleSheet, Text} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import PartnerPreviewCard from './PartnerPreviewCard';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerLabel, partnerSubject, queBeforePartner} from '../../utils/awaADeuxPartnerWording';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import {DEFAULT_SHARING_TOGGLES} from './awaADeuxDemo';

// The step-1 preview always shows the DEFAULT choices (a demo of the idea), not her saved ones.
const DEFAULT_VISIBILITY = computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false});

// "AWA à deux" — step 1: what the partner sees. A UI preview with DEMO content only
// (see awaADeuxDemo.ts): not connected to any real data.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPartnerView'>;

export default function AwaADeuxPartnerViewScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {partnerName} = useAwaADeuxPartnerName();
  // FR uses the elided "Ce qu'Amine voit" via queBeforePartner (French-only grammar);
  // EN builds "What Amine sees" from the plain name instead — see
  // awaADeuxPartnerWording.ts's header comment for why these aren't unified.
  const title = partnerName
    ? t('awaADeux.partnerView.titleWithName', {quePartner: queBeforePartner(partnerName), name: partnerLabel(partnerName)})
    : t('awaADeux.partnerView.titleNeutral');

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      description={t('awaADeux.partnerView.description', {partner: partnerSubject(partnerName)})}
      onBack={navigation.goBack}
      onContinue={() => navigation.navigate('AwaADeuxBenefits')}
      title={title}>
      <Reveal index={0}>
        <PartnerPreviewCard visibility={DEFAULT_VISIBILITY} />
      </Reveal>

      <Reveal index={1}>
        <Text style={styles.caption}>{t('awaADeux.partnerView.caption')}</Text>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    caption: {color: theme.colors.textMuted, fontSize: 11.5, textAlign: 'center'},
  });
}
