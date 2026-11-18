import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../../components/ui/AwaText';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import PartnerPreviewCard from './PartnerPreviewCard';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerLabel, partnerSubject, queBeforePartner} from '../../utils/awaADeuxPartnerWording';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import {DEFAULT_SHARING_TOGGLES} from './awaADeuxDemo';
import {sharingKeysForObjective} from '../../utils/awaADeuxObjective';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import type {SharingKey, SharingToggles} from '../../state/awaADeuxSharingStore';
import type {ObjectiveId} from '../../state/onboardingPreferences';

// The step-1 preview is a DEMO of the idea, not her saved choices: it shows the example of what a partner can see for HER objective — every choice that
// objective offers, switched on (utils/awaADeuxObjective.ts), and nothing from another objective. The "fertility status" choice has no screen of its own
// on the partner side, so it is left out of the example.
const demoVisibilityFor = (objective: ObjectiveId) => {
  const allowed = sharingKeysForObjective(objective);
  const toggles = Object.fromEntries(
    (Object.keys(DEFAULT_SHARING_TOGGLES) as SharingKey[]).map(key => [key, allowed.has(key) && key !== 'fertilityStatus']),
  ) as SharingToggles;
  return computePartnerVisibility(toggles, {isPregnant: objective === 'pregnancy', objective});
};

// "AWA à deux" — step 1: what the partner sees. A UI preview with DEMO content only
// (see awaADeuxDemo.ts): not connected to any real data.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPartnerView'>;

export default function AwaADeuxPartnerViewScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {partnerName} = useAwaADeuxPartnerName();
  const {objective} = useAwaADeuxSharing();
  const visibility = useMemo(() => demoVisibilityFor(objective), [objective]);
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
        <PartnerPreviewCard visibility={visibility} />
      </Reveal>

      <Reveal index={1}>
        <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.caption}>{t('awaADeux.partnerView.caption')}</AwaText>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    caption: {color: theme.colors.textMuted, textAlign: 'center'},
  });
}
