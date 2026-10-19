import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {confirmPeriodStart} from '../../state/onboardingPreferences';
import {formatFullDate, formatShortDate, startOfDay} from '../../utils/cycleMath';
import {getBottomPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

// The ONE confirmation sheet for "my period really started on this date" —
// opened from both CycleHomeScreen and CalendarScreen's selected-day card.
// Both entry points share this exact component and delegate to the same
// confirmPeriodStart() store function; neither screen saves independently.

type Props = {
  visible: boolean;
  /** The date that will be recorded — today when opened from the Dashboard,
   * or the selected calendar day when opened from the Calendar's day detail.
   * The primary button confirms exactly THIS date (worded "aujourd'hui" only
   * when it really is today); it is never silently replaced by today. */
  initialDate: Date;
  onClose: () => void;
  /** Called after the value has been persisted via confirmPeriodStart() (or
   * `onConfirm` below, when provided). */
  onConfirmed: (date: Date) => void;
  /** Optional override of the save action — called INSTEAD of the default
   * confirmPeriodStart(value) when provided. Additive/opt-in: every existing
   * caller (CycleHomeScreen's/CalendarScreen's own "Mes règles ont commencé",
   * Conceive's period recording) omits this and keeps its exact current
   * behavior unchanged. Used by the managed-daughter "first period" action,
   * whose save logic differs (see managedProfileCycleSeed.ts's
   * recordManagedProfileFirstPeriod) — same sheet, same date picker, same
   * future-date rejection, different persistence. */
  onConfirm?: (date: Date) => void | Promise<void>;
  /** Optional title/description override — same additive/opt-in rule as
   * `onConfirm` above; every existing caller keeps the current isToday-aware
   * copy. */
  title?: string;
  description?: string;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function PeriodStartBottomSheet({visible, initialDate, onClose, onConfirmed, onConfirm, title, description}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  const [draft, setDraft] = useState(initialDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    setDraft(initialDate);
    setPickerOpen(false);
    setSaving(false);
    progress.setValue(0);
    Animated.spring(progress, {toValue: 1, damping: 22, stiffness: 170, mass: 0.8, useNativeDriver: true}).start();
  }, [visible, initialDate, progress]);

  const isToday = sameDay(draft, new Date());
  // A period start is a real event: it can never be recorded in the future.
  const isFuture = startOfDay(draft).getTime() > startOfDay(new Date()).getTime();
  const formatDateLabel = (date: Date): string =>
    sameDay(date, new Date()) ? t('periodStartSheet.todayLabel', {date: formatFullDate(date)}) : formatFullDate(date);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  const commit = async (date: Date) => {
    if (saving || startOfDay(date).getTime() > startOfDay(new Date()).getTime()) {return;}
    setSaving(true);
    const value = startOfDay(date);
    try {
      if (onConfirm) {
        await onConfirm(value);
      } else {
        await confirmPeriodStart(value);
      }
    } catch (error) {
      // Not persisted (services/saveFailure.ts): the period start is NOT announced as recorded, the sheet stays
      // open so the same date can simply be confirmed again, and the cycle state was rolled back by the store.
      setSaving(false);
      presentSaveFailure(error);
      return;
    }
    onConfirmed(value);
    close();
  };

  const handleDateChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setPickerOpen(false);}
    setDraft(selected);
    commit(selected);
  };

  const handlePickerDismiss = () => {
    if (Platform.OS === 'android') {setPickerOpen(false);}
  };

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0, 0.35]})}]}>
          <Pressable accessibilityLabel={t('common.close')} onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: getBottomPadding(insets.bottom),
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [320, 0]})}],
            },
          ]}>
          <View style={styles.handle} />

          <AwaText style={styles.title} variant="titleLarge">
            {title ?? (isToday ? t('periodStartSheet.titleToday') : t('periodStartSheet.titleOther', {date: formatShortDate(draft)}))}
          </AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodyMedium">
            {description ??
              (isToday ? t('periodStartSheet.descriptionToday') : t('periodStartSheet.descriptionOther'))}
          </AwaText>

          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="water" size={18} />
            </View>
            <View style={styles.fieldCopy}>
              <AwaText colorRole="onSurfaceVariant" variant="labelMedium">{t('periodStartSheet.fieldLabel')}</AwaText>
              <AwaText style={styles.fieldValue} variant="titleSmall">{formatDateLabel(draft)}</AwaText>
            </View>
          </View>

          <AwaButton
            disabled={saving || isFuture}
            fullWidth
            label={
              saving
                ? t('periodStartSheet.saving')
                : isToday
                  ? t('periodStartSheet.confirmToday')
                  : t('periodStartSheet.confirmOther', {date: formatShortDate(draft)})
            }
            onPress={() => commit(isToday ? new Date() : draft)}
            size="large"
            style={styles.confirmButton}
          />

          <AwaButton
            disabled={saving}
            fullWidth
            icon="calendar-month-outline"
            label={t('periodStartSheet.chooseAnotherDate')}
            onPress={() => setPickerOpen(current => !current)}
            style={styles.secondaryButton}
            variant="outlined"
          />

          {pickerOpen ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              mode="date"
              onDismiss={handlePickerDismiss}
              onValueChange={handleDateChange}
              value={draft}
            />
          ) : null}

          <AwaButton
            disabled={saving}
            fullWidth
            label={t('periodStartSheet.cancel')}
            onPress={close}
            style={styles.cancelButton}
            variant="text"
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
      borderTopLeftRadius: homeRadii.card,
      borderTopRightRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
      elevation: 20,
    },
    handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    title: {marginTop: 14},
    description: {marginTop: 8},
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      minHeight: 62,
      marginTop: 16,
      borderWidth: 1.4,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 13,
    },
    fieldIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    fieldCopy: {flex: 1, minWidth: 0},
    fieldValue: {marginTop: 2},
    confirmButton: {marginTop: 16},
    secondaryButton: {marginTop: 8},
    cancelButton: {marginTop: 8},
  });
}

export default memo(PeriodStartBottomSheet);
