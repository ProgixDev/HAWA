import React, {memo, useMemo} from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {AwaText} from '../ui/AwaText';
import {CalendarHeaderAction} from './CalendarHeaderAction';
import '../../i18n';

type Props = {
  onPressFilters: () => void;
  onPressLegend: () => void;
};

function CalendarHeader({
  onPressFilters,
  onPressLegend,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(), []);
  const insets = useSafeAreaInsets();

  const topSpacing = Math.max(insets.top + 6, 16);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topSpacing,
        },
      ]}>
      <View style={styles.titleBlock}>
        <AwaText variant="headlineSmall">
          {t('calendar.title')}
        </AwaText>

        <AwaText
          colorRole="onSurfaceVariant"
          numberOfLines={3}
          style={styles.subtitle}
          variant="bodySmall">
          {t('calendar.subtitle')}
        </AwaText>
      </View>

      <View style={styles.actions}>
        <CalendarHeaderAction icon="tune-variant" label={t('calendar.filters')} onPress={onPressFilters} />
        <CalendarHeaderAction icon="format-list-bulleted" label={t('calendar.legend')} onPress={onPressLegend} />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    titleBlock: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
      paddingTop: 2,
    },

    subtitle: {
      marginTop: 2,
    },

    actions: {
      flexDirection: 'row',
      flexShrink: 0,
    },
  });
}

export default memo(CalendarHeader);
