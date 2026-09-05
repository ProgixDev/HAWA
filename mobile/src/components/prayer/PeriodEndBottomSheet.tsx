import React, {memo, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeRadii} from '../home/homeTheme';
import {setPeriodEndDateTime} from '../../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {formatFullDate} from '../../utils/cycleMath';
import {getBottomPadding} from '../../theme/spacing';

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
  sameDay(date, new Date()) ? `Aujourd’hui, ${formatFullDate(date)}` : formatFullDate(date);

const formatTimeLabel = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0, 0.35]})}]}>
          <Pressable accessibilityLabel="Fermer" onPress={close} style={StyleSheet.absoluteFill} />
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
            <Text style={styles.title}>Quand tes règles se sont-elles terminées ?</Text>
            <Text style={styles.description}>
              Cette information permet d’actualiser ton cycle et tes repères de prière.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActivePicker(current => (current === 'date' ? null : 'date'))}
              style={({pressed}) => [styles.field, activePicker === 'date' && styles.fieldActive, pressed && styles.pressed]}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={homeColors.primary} name="calendar-outline" size={18} />
              </View>
              <View style={styles.fieldCopy}>
                <Text style={styles.fieldLabel}>Date de fin</Text>
                <Text style={styles.fieldValue}>{formatDateLabel(draft)}</Text>
              </View>
              <MaterialDesignIcons
                color={homeColors.textSecondary}
                name={activePicker === 'date' ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </Pressable>

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

            <Pressable
              accessibilityRole="button"
              onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
              style={({pressed}) => [styles.field, activePicker === 'time' && styles.fieldActive, pressed && styles.pressed]}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={homeColors.primary} name="clock-outline" size={18} />
              </View>
              <View style={styles.fieldCopy}>
                <Text style={styles.fieldLabel}>Heure de fin</Text>
                <Text style={styles.fieldValue}>{formatTimeLabel(draft)}</Text>
              </View>
              <MaterialDesignIcons
                color={homeColors.textSecondary}
                name={activePicker === 'time' ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </Pressable>

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

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={confirm}
            style={({pressed}) => [styles.confirmButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.confirmText}>{saving ? 'Enregistrement…' : 'Confirmer la fin des règles'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={close}
            style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: homeRadii.card,
    borderTopRightRadius: homeRadii.card,
    backgroundColor: '#FCFAFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  scroll: {flexGrow: 0, marginTop: 14},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 19, fontWeight: '700', lineHeight: 25},
  description: {marginTop: 8, color: homeColors.textSecondary, fontSize: 13, lineHeight: 19},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 62,
    marginTop: 14,
    borderWidth: 1.4,
    borderColor: homeColors.cardBorder,
    borderRadius: homeRadii.button,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
  },
  fieldActive: {borderColor: homeColors.primary},
  fieldIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.lightLavender,
  },
  fieldCopy: {flex: 1},
  fieldLabel: {color: homeColors.textSecondary, fontSize: 11.5},
  fieldValue: {marginTop: 2, color: homeColors.textPrimary, fontSize: 14.5, fontWeight: '700'},
  confirmButton: {
    marginTop: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  confirmText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  cancelButton: {marginTop: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  cancelText: {color: homeColors.textSecondary, fontSize: 14, fontWeight: '600'},
  pressed: {opacity: 0.85},
});

export default memo(PeriodEndBottomSheet);
