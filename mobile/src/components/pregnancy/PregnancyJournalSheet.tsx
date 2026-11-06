import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import type {PregnancyJournalItem} from '../../config/pregnancyJournalItems';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AWA_DISPLAY_FONT} from '../../theme/awaTypography';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';
import {PregnancyBottomSheet, PregnancySheetCard, PregnancySheetRow} from './PregnancyBottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** The categories offered now (the ones she tracks); every row opens its existing screen. */
  items: readonly PregnancyJournalItem[];
  onOpenItem: (item: PregnancyJournalItem) => void;
  /** Shown instead of the rows when she tracks none of the five categories. */
  onChooseTracking: () => void;
};

// "Journal du jour": one card, one row per category (icons and screens from the shared PREGNANCY_JOURNAL_ITEMS table).
export default function PregnancyJournalSheet({visible, onClose, items, onOpenItem, onChooseTracking}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme.colors.text), [theme.colors.text]);

  const titles: Record<PregnancyJournalItem['preferenceKey'], string> = {
    symptoms: t('pregnancyDashboard.dailyItems.symptoms'),
    weight: t('pregnancyDashboard.dailyItems.weight'),
    mood: t('pregnancyDashboard.dailyItems.mood'),
    sleep: t('pregnancyDashboard.dailyItems.sleep'),
    medicalInfo: t('pregnancyDashboard.dailyItems.medicalInfo'),
  };
  const subtitles: Record<PregnancyJournalItem['preferenceKey'], string> = {
    symptoms: t('dailyJournalSheet.pregnancyItems.symptoms.subtitle'),
    weight: t('dailyJournalSheet.pregnancyItems.weight.subtitle'),
    mood: t('dailyJournalSheet.pregnancyItems.mood.subtitle'),
    sleep: t('dailyJournalSheet.pregnancyItems.sleep.subtitle'),
    medicalInfo: t('dailyJournalSheet.pregnancyItems.medicalInfo.subtitle'),
  };

  return (
    <PregnancyBottomSheet accessibilityLabel={t('common.close')} onClose={onClose} visible={visible}>
      <View style={styles.header}>
        <AwaText accessibilityRole="header" style={styles.title}>{t('pregnancyJournalSheet.title', {defaultValue: 'Journal du jour'})}</AwaText>
        <AwaIconButton accessibilityLabel={t('common.close')} icon="close" onPress={onClose} size="small" />
      </View>

      <PregnancySheetCard>
        {items.length > 0 ? (
          items.map((item, index) => (
            <PregnancySheetRow
              icon={item.icon}
              key={item.preferenceKey}
              last={index === items.length - 1}
              onPress={() => onOpenItem(item)}
              subtitle={subtitles[item.preferenceKey]}
              title={titles[item.preferenceKey]}
            />
          ))
        ) : (
          <PregnancySheetRow
            icon="tune-variant"
            last
            onPress={onChooseTracking}
            subtitle={t('dailyJournalSheet.chooseTrackingSubtitle')}
            title={t('dailyJournalSheet.chooseTrackingTitle')}
          />
        )}
      </PregnancySheetCard>
    </PregnancyBottomSheet>
  );
}

function createStyles(textColor: string) {
  return StyleSheet.create({
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
    title: {flex: 1, color: textColor, fontFamily: AWA_DISPLAY_FONT, fontSize: 22, lineHeight: 28, fontWeight: '600'},
  });
}
