import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeRadii} from '../home/homeTheme';
import {confirmPeriodStart} from '../../state/onboardingPreferences';
import {formatFullDate, startOfDay} from '../../utils/cycleMath';
import {getBottomPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// The ONE confirmation sheet for "my period really started on this date" —
// opened from both CycleHomeScreen and CalendarScreen's selected-day card.
// Both entry points share this exact component and delegate to the same
// confirmPeriodStart() store function; neither screen saves independently.

type Props = {
  visible: boolean;
  /** Pre-fills the date field — today when opened from the Dashboard, or the
   * selected calendar day when opened from the Calendar's day detail. */
  initialDate: Date;
  onClose: () => void;
  /** Called after the value has been persisted via confirmPeriodStart(). */
  onConfirmed: (date: Date) => void;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDateLabel = (date: Date): string =>
  sameDay(date, new Date()) ? `Aujourd’hui, ${formatFullDate(date)}` : formatFullDate(date);

function PeriodStartBottomSheet({visible, initialDate, onClose, onConfirmed}: Props): React.JSX.Element {
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

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  const commit = (date: Date) => {
    if (saving) {return;}
    setSaving(true);
    const value = startOfDay(date);
    confirmPeriodStart(value);
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

          <Text style={styles.title}>Tes règles ont commencé ?</Text>
          <Text style={styles.description}>Confirme la date de début de tes nouvelles règles.</Text>

          <View style={styles.field}>
            <View style={styles.fieldIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="water" size={18} />
            </View>
            <View style={styles.fieldCopy}>
              <Text style={styles.fieldLabel}>Date de début</Text>
              <Text style={styles.fieldValue}>{formatDateLabel(draft)}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => commit(new Date())}
            style={({pressed}) => [styles.confirmButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.confirmText}>{saving ? 'Enregistrement…' : 'Oui, aujourd’hui'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setPickerOpen(current => !current)}
            style={({pressed}) => [styles.secondaryButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={17} />
            <Text style={styles.secondaryText}>Choisir une autre date</Text>
          </Pressable>

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
    title: {marginTop: 14, color: theme.colors.text, fontFamily: 'serif', fontSize: 19, fontWeight: '700', lineHeight: 25},
    description: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
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
    fieldLabel: {color: theme.colors.textSecondary, fontSize: 11.5},
    fieldValue: {marginTop: 2, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    confirmButton: {
      marginTop: 18,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primary,
    },
    confirmText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
    secondaryButton: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.4,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.surface,
    },
    secondaryText: {color: theme.colors.primary, fontSize: 14, fontWeight: '700'},
    cancelButton: {marginTop: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
    cancelText: {color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600'},
    pressed: {opacity: 0.85},
  });
}

export default memo(PeriodStartBottomSheet);
