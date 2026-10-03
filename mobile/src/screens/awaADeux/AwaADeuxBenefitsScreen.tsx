import React, {useMemo} from 'react';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {getBenefitsLayout, type BenefitsLayout} from './awaADeuxBenefitsLayout';

// "AWA à deux" — step 2: the benefits for both partners. Static content.
//
// One viewport, no scrolling: the title, the five cards and the CTA share the window
// height, and every size comes from getBenefitsLayout(windowHeight, insets) — see
// awaADeuxBenefitsLayout.ts. Colors: the resolved AWA theme only.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxBenefits'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const benefitsOf = (t: (key: string) => string): Array<{icon: IconName; text: string}> => [
  {icon: 'account-heart-outline', text: t('awaADeux.benefits.item1')},
  {icon: 'lightbulb-on-outline', text: t('awaADeux.benefits.item2')},
  {icon: 'chat-outline', text: t('awaADeux.benefits.item3')},
  {icon: 'hand-heart-outline', text: t('awaADeux.benefits.item4')},
  {icon: 'heart-outline', text: t('awaADeux.benefits.item5')},
];

export default function AwaADeuxBenefitsScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();

  const layout = useMemo(() => getBenefitsLayout(height, insets.top, insets.bottom), [height, insets.top, insets.bottom]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const BENEFITS = useMemo(() => benefitsOf(t), [t]);

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      fit={{
        titleFontSize: layout.titleFontSize,
        titleLineHeight: layout.titleLineHeight,
        bodyMarginTop: layout.bodyMarginTop,
        bodyGap: layout.cardGap,
        ctaHeight: layout.ctaHeight,
      }}
      onBack={navigation.goBack}
      onContinue={() => navigation.navigate('AwaADeuxSharing')}
      title={t('awaADeux.benefits.title')}>
      {BENEFITS.map((benefit, index) => (
        <Reveal key={benefit.text} index={index}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <MaterialDesignIcons color={theme.colors.primary} name={benefit.icon} size={layout.iconSize} />
            </View>
            <Text maxFontSizeMultiplier={1.15} style={styles.text}>{benefit.text}</Text>
          </View>
        </Reveal>
      ))}
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme, layout: BenefitsLayout) {
  return StyleSheet.create({
    card: {
      minHeight: layout.cardMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: layout.cardPaddingHorizontal,
      paddingVertical: layout.cardPaddingVertical,
      ...theme.shadow,
    },
    iconBox: {
      width: layout.iconBox,
      height: layout.iconBox,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.iconBox / 2,
      backgroundColor: theme.colors.primarySoft,
    },
    text: {
      flex: 1,
      minWidth: 0,
      color: theme.colors.text,
      fontSize: layout.textFontSize,
      lineHeight: layout.textLineHeight,
      fontWeight: '600',
    },
  });
}
