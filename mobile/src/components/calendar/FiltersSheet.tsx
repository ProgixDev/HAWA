import React, {memo, useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import type {CalendarFilterKey, CalendarFilters} from '../../state/calendarFilters';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaSwitch} from '../ui/AwaSwitch';
import {AwaText} from '../ui/AwaText';
import '../../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type FilterOption = {key: CalendarFilterKey; icon: IconName; labelKey: string};

const OPTIONS: FilterOption[] = [
  {key: 'rules', icon: 'water', labelKey: 'calendar.legendPeriod'},
  {key: 'symptoms', icon: 'heart-outline', labelKey: 'dailyJournal.symptoms'},
  {key: 'mood', icon: 'emoticon-happy-outline', labelKey: 'dailyJournal.mood'},
  {key: 'notes', icon: 'notebook-edit-outline', labelKey: 'dailyJournal.notes'},
  {key: 'activity', icon: 'run', labelKey: 'dailyJournal.activity'},
  {key: 'sleep', icon: 'weather-night', labelKey: 'dailyJournal.sleep'},
  {key: 'hydration', icon: 'cup-water', labelKey: 'dailyJournal.hydration'},
  {key: 'intimacy', icon: 'shield-lock-outline', labelKey: 'dailyJournal.intimacy'},
];

type Props = {
  visible: boolean;
  filters: CalendarFilters;
  onToggle: (key: CalendarFilterKey) => void;
  onClose: () => void;
  /** True while a managed (daughter) profile is active — "Vie intime" is not
   * part of a managed profile's cycle-tracking experience (see CLAUDE.md §4
   * objective isolation): offering a toggle for a row that's already forced
   * hidden would be confusing. Defaults to false so every existing caller
   * (the mother's own Calendar) is unaffected. */
  hideIntimacy?: boolean;
};

function FiltersSheet({visible, filters, onToggle, onClose, hideIntimacy = false}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const options = hideIntimacy ? OPTIONS.filter(option => option.key !== 'intimacy') : OPTIONS;
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    progress.setValue(0);
    Animated.spring(progress, {toValue: 1, damping: 22, stiffness: 170, mass: 0.8, useNativeDriver: true}).start();
  }, [progress, visible]);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0, 0.35]})}]}>
          <Pressable accessibilityLabel={t('calendar.closeFilters')} onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [280, 0]})}],
            },
          ]}>
          <View style={styles.handle} />
          <AwaText style={styles.title} variant="titleLarge">{t('calendar.filtersTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('calendar.filtersSubtitle')}</AwaText>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {options.map(option => (
              <View key={option.key} style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={option.icon} size={19} />
                </View>
                <AwaText style={styles.rowLabel} variant="titleSmall">{t(option.labelKey)}</AwaText>
                <AwaSwitch
                  accessibilityLabel={t(option.labelKey)}
                  onValueChange={() => onToggle(option.key)}
                  value={filters[option.key]}
                />
              </View>
            ))}
          </ScrollView>

          <AwaButton
            fullWidth
            label={t('cycleHome.quickActions.done')}
            onPress={close}
            style={styles.doneButton}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
    sheet: {
      maxHeight: '80%',
      borderTopLeftRadius: homeRadii.card,
      borderTopRightRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
      elevation: 20,
    },
    handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    title: {marginTop: 14},
    subtitle: {marginTop: 4},
    list: {marginTop: 12, paddingBottom: 4},
    row: {flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12},
    rowIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.primarySoft},
    rowLabel: {flex: 1},
    doneButton: {marginTop: 8},
  });
}

export default memo(FiltersSheet);
