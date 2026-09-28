import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// Segmented step-progress indicator for the daughter-profile creation flow — no
// equivalent component existed anywhere in AWA (checked src/screens/awaADeux/,
// src/components/onboarding/, every other multi-step onboarding flow) before this.
// Reused across DaughterInfo/FirstPeriod/CycleSetup via AwaADeuxStepLayout's
// `headerAccessory` slot, so the progress itself lives in exactly one place
// rather than being duplicated per screen. The intro screen (ManagedProfileType,
// "Ajouter le profil de ma fille") does NOT render this — it is a pure intro,
// not a counted step.
//
// Always exactly 2 segments — the "information/first period" stages. CycleSetup
// (reached only after "Oui") is still part of finishing that same 2nd stage's
// information, so it also renders step 2 fully completed rather than introducing
// a 3rd segment. Purely derived from a `step` prop the CALLING screen hardcodes
// for itself — there is no separate progress counter to fall out of sync with
// Back navigation; going back just remounts the previous screen, which renders
// its own (lower) step immediately.

const TOTAL_STEPS = 2;

type Props = {
  /** Which step this screen represents (1-indexed) — segments up to and
   * including it render as completed/active; later ones stay inactive. */
  step: 1 | 2;
};

function ManagedProfileProgress({step}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      accessibilityLabel={`Étape ${step} sur ${TOTAL_STEPS}`}
      accessibilityRole="progressbar"
      accessibilityValue={{min: 1, max: TOTAL_STEPS, now: step}}
      style={styles.row}>
      {Array.from({length: TOTAL_STEPS}, (_, index) => (
        <View key={index} style={[styles.segment, index < step && styles.segmentActive]} />
      ))}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'center', gap: 6},
    // Equal-width pills, compact — never spans the screen width.
    segment: {
      width: 22,
      height: 5,
      borderRadius: 3,
      backgroundColor: withAlpha(theme.colors.primary, 0.16),
    },
    segmentActive: {backgroundColor: theme.colors.primary},
  });
}

export default ManagedProfileProgress;
