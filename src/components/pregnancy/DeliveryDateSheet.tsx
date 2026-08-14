import React, {memo, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeRadii} from '../home/homeTheme';
import InlineCalendarPickerModal from '../onboarding/InlineCalendarPickerModal';
import {confirmDelivery} from '../../state/postpartumPreferences';
import {diffDays, startOfDay} from '../../utils/cycleMath';
import {getBottomPadding} from '../../theme/spacing';

// STEP 1 of the Pregnancy → Postpartum transition — opened from
// PregnancyDashboard's "J'ai accouché" CTA. This sheet is focused ONLY on
// capturing/persisting the real delivery date via
// postpartumPreferences.confirmDelivery(); it deliberately does NOT touch
// activeObjective — that only happens later, from the congratulations card
// (see PostpartumCongratsCard.tsx), once the user explicitly chooses to
// start postpartum tracking. Same self-contained Modal + Animated.spring
// slide-up pattern as Cycle's PeriodStartBottomSheet.

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called once the delivery date has been persisted (before the sheet's
   * own closing animation finishes) — the caller decides what happens next
   * (opening the congratulations card) once onClose fires. */
  onConfirmed: (deliveryDate: Date) => void;
};

function DeliveryDateSheet({visible, onClose, onConfirmed}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    setPickerOpen(false);
    setSaving(false);
    progress.setValue(0);
    Animated.spring(progress, {toValue: 1, damping: 22, stiffness: 170, mass: 0.8, useNativeDriver: true}).start();
  }, [visible, progress]);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  const commit = async (date: Date) => {
    if (saving) {return;}
    const value = startOfDay(date);
    if (diffDays(value, startOfDay(new Date())) > 0) {
      Alert.alert('Date invalide', 'La date d’accouchement ne peut pas être dans le futur.');
      return;
    }
    setSaving(true);
    await confirmDelivery(value);
    onConfirmed(value);
    close();
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

          <Text style={styles.title}>Ton bébé est arrivé 💜</Text>
          <Text style={styles.description}>Indique la date de ton accouchement pour démarrer ton suivi post-partum.</Text>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => commit(new Date())}
            style={({pressed}) => [styles.confirmButton, (pressed || saving) && styles.pressed]}>
            <MaterialDesignIcons color="#FFFFFF" name="heart-outline" size={17} />
            <Text style={styles.confirmText}>{saving ? 'Enregistrement…' : 'J’ai accouché aujourd’hui'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setPickerOpen(true)}
            style={({pressed}) => [styles.secondaryButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="calendar-month-outline" size={17} />
            <Text style={styles.secondaryText}>Choisir une autre date</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={close}
            style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Animated.View>

        <InlineCalendarPickerModal
          onClose={() => setPickerOpen(false)}
          onSelect={date => commit(date)}
          value={new Date()}
          visible={pickerOpen}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
  sheet: {
    borderTopLeftRadius: homeRadii.card,
    borderTopRightRadius: homeRadii.card,
    backgroundColor: '#FCFAFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  title: {marginTop: 14, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 19, fontWeight: '700', lineHeight: 25},
  description: {marginTop: 8, color: homeColors.textSecondary, fontSize: 13, lineHeight: 19},
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    minHeight: 52,
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  confirmText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  secondaryButton: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: homeColors.cardBorder,
    borderRadius: homeRadii.button,
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {color: homeColors.primary, fontSize: 14, fontWeight: '700'},
  cancelButton: {marginTop: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  cancelText: {color: homeColors.textSecondary, fontSize: 14, fontWeight: '600'},
  pressed: {opacity: 0.85},
});

export default memo(DeliveryDateSheet);
