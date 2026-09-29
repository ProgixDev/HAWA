import React, {memo, useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import type {CalendarFilterKey, CalendarFilters} from '../../state/calendarFilters';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
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
          <Text style={styles.title}>{t('calendar.filtersTitle')}</Text>
          <Text style={styles.subtitle}>{t('calendar.filtersSubtitle')}</Text>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {options.map(option => (
              <View key={option.key} style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={option.icon} size={19} />
                </View>
                <Text numberOfLines={1} style={styles.rowLabel}>{t(option.labelKey)}</Text>
                <Switch
                  ios_backgroundColor={withAlpha(theme.colors.primary, 0.14)}
                  onValueChange={() => onToggle(option.key)}
                  thumbColor="#FFFFFF"
                  trackColor={{false: withAlpha(theme.colors.primary, 0.14), true: theme.colors.primary}}
                  value={filters[option.key]}
                />
              </View>
            ))}
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={close} style={({pressed}) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneText}>{t('cycleHome.quickActions.done')}</Text>
          </Pressable>
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
    title: {marginTop: 14, color: theme.colors.text, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
    subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12.5},
    list: {marginTop: 12, paddingBottom: 4},
    row: {flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12},
    rowIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.primarySoft},
    rowLabel: {flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    doneButton: {
      marginTop: 8,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primary,
    },
    doneText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}

export default memo(FiltersSheet);
