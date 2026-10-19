import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {awaShapes} from '../../theme/shapes';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {setPeriodEndDateTime} from '../../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {formatFullDate} from '../../utils/cycleMath';
import {formatTimeOfDay} from '../../utils/timeOfDay';
import {getBottomPadding} from '../../theme/spacing';
import i18n from '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

type Props = {
  visible: boolean;
  /** Current confirmed value, or a sensible default (e.g. now) if none yet. */
  initialDateTime: Date;
  /** The period's start — the end datetime can never be earlier than this. */
  minDateTime: Date;
  onClose: () => void;
  /** Called after the value has been persisted to the shared cycle store. */
  onConfirmed: (value: Date) => void;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDateLabel = (date: Date): string =>
  sameDay(date, new Date()) ? i18n.t('periodStartSheet.todayLabel', {date: formatFullDate(date)}) : formatFullDate(date);

// 24-hour 'HH:mm', locale-independent: Intl with hour12:false writes 00:30 as "24:30" under en-US.
const formatTimeLabel = (date: Date): string => formatTimeOfDay(date);

const clampDateTime = (value: Date, minDateTime: Date): Date => {
  const now = new Date();
  if (value.getTime() > now.getTime()) {return now;}
  if (value.getTime() < minDateTime.getTime()) {return new Date(minDateTime);}
  return value;
};

function PeriodEndBottomSheet({
  visible,
  initialDateTime,
  minDateTime,
  onClose,
  onConfirmed,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  const [draft, setDraft] = useState(initialDateTime);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    setDraft(initialDateTime);
    setActivePicker(null);
    progress.setValue(0);
    Animated.spring(progress, {toValue: 1, damping: 22, stiffness: 170, mass: 0.8, useNativeDriver: true}).start();
  }, [visible, initialDateTime, progress]);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  const handleDateValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setActivePicker(null);}
    setDraft(current => {
      const next = new Date(current);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    });
  };

  const handleDatePickerDismiss = () => {
    if (Platform.OS === 'android') {setActivePicker(null);}
  };

  const handleTimeValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setActivePicker(null);}
    setDraft(current => {
      const next = new Date(current);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return next;
    });
  };

  const handleTimePickerDismiss = () => {
    if (Platform.OS === 'android') {setActivePicker(null);}
  };

  const confirm = async () => {
    if (saving) {return;}
    setSaving(true);
    try {
      const value = clampDateTime(draft, minDateTime);
      await setPeriodEndDateTime(value);
      // Records this actual start/end pair as its own confirmed historical
      // occurrence (dedup'd by period-start day) — the source of truth for
      // qadaa, kept independent of predictive cyclePreferences. Re-opening
      // this same sheet via PurityStatusCard's "Modifier" updates the same
      // occurrence rather than creating a duplicate.
      await recordConfirmedPeriodEnd(minDateTime, value);
      onConfirmed(value);
      close();
    } catch (saveError) {
      // Not persisted: the end is not announced as confirmed and the sheet stays open to retry.
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
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

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <AwaText variant="titleLarge">{t('periodEndBottomSheet.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.description}>
              {t('periodEndBottomSheet.description')}
            </AwaText>

            <AwaCard
              accessibilityLabel={`${t('periodEndBottomSheet.endDateLabel')}, ${formatDateLabel(draft)}`}
              onPress={() => setActivePicker(current => (current === 'date' ? null : 'date'))}
              padding="none"
              style={[styles.field, activePicker === 'date' && styles.fieldActive]}
              variant="outlined">
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-outline" size={20} />
              <View style={styles.fieldCopy}>
                <AwaText colorRole="onSurfaceVariant" variant="labelMedium">{t('periodEndBottomSheet.endDateLabel')}</AwaText>
                <AwaText variant="titleSmall" style={styles.fieldValue}>{formatDateLabel(draft)}</AwaText>
              </View>
              <MaterialDesignIcons
                color={theme.colors.textSecondary}
                name={activePicker === 'date' ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </AwaCard>

            {activePicker === 'date' ? (
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                minimumDate={minDateTime}
                mode="date"
                onDismiss={handleDatePickerDismiss}
                onValueChange={handleDateValueChange}
                value={draft}
              />
            ) : null}

            <AwaCard
              accessibilityLabel={`${t('periodEndBottomSheet.endTimeLabel')}, ${formatTimeLabel(draft)}`}
              onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
              padding="none"
              style={[styles.field, activePicker === 'time' && styles.fieldActive]}
              variant="outlined">
              <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={20} />
              <View style={styles.fieldCopy}>
                <AwaText colorRole="onSurfaceVariant" variant="labelMedium">{t('periodEndBottomSheet.endTimeLabel')}</AwaText>
                <AwaText variant="titleSmall" style={styles.fieldValue}>{formatTimeLabel(draft)}</AwaText>
              </View>
              <MaterialDesignIcons
                color={theme.colors.textSecondary}
                name={activePicker === 'time' ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </AwaCard>

            {activePicker === 'time' ? (
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                mode="time"
                onDismiss={handleTimePickerDismiss}
                onValueChange={handleTimeValueChange}
                value={draft}
              />
            ) : null}
          </ScrollView>

          <AwaButton
            disabled={saving}
            fullWidth
            label={saving ? t('periodStartSheet.saving') : t('periodEndBottomSheet.confirmEnd')}
            onPress={confirm}
            style={styles.confirmButton}
          />

          <AwaButton
            disabled={saving}
            fullWidth
            label={t('common.cancel')}
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
    // Solid base color; the Animated.View above already interpolates its own
    // `opacity` (0 -> 0.35) as the sheet slides in, so no alpha is baked into
    // this color itself (that would double-apply transparency).
    overlay: {...StyleSheet.absoluteFillObject, backgroundColor: theme.shadow.shadowColor},
    sheet: {
      maxHeight: '88%',
      borderTopLeftRadius: awaShapes.extraLarge,
      borderTopRightRadius: awaShapes.extraLarge,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
      elevation: 20,
    },
    handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: theme.colors.border},
    scroll: {flexGrow: 0, marginTop: 14},
    description: {marginTop: 8},
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 62,
      marginTop: 14,
      paddingHorizontal: 14,
    },
    fieldActive: {borderColor: theme.colors.primary},
    fieldCopy: {flex: 1},
    fieldValue: {marginTop: 2},
    confirmButton: {marginTop: 18},
    cancelButton: {marginTop: 8},
  });
}

export default memo(PeriodEndBottomSheet);
