import React, {memo, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeRadii} from '../home/homeTheme';
import InlineCalendarPickerModal from '../onboarding/InlineCalendarPickerModal';
import {confirmDelivery, getPostpartumPreferences} from '../../state/postpartumPreferences';
import {startOfDay} from '../../utils/cycleMath';
import {validateDeliveryDate} from '../../utils/postpartumLossDateValidation';
import {getBottomPadding} from '../../theme/spacing';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

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
  /** Start of the CURRENT pregnancy (its equivalent LMP) — the lower bound of
   * the delivery date. Optional: without it only "not in the future" applies. */
  pregnancyStart?: Date | null;
};

function DeliveryDateSheet({visible, onClose, onConfirmed, pregnancyStart}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
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
    // This sheet only opens while NO delivery is confirmed for the current
    // pregnancy, so any postpartum date still stored (and the first period /
    // lochia end recorded against it) belongs to an earlier journey: it is
    // neither a bound for this delivery nor kept as this one's answers.
    const validation = validateDeliveryDate({
      date: value,
      now: new Date(),
      firstPostpartumPeriodDate: null,
      lochiaEndedDate: null,
      pregnancyStartDate: pregnancyStart ?? null,
    });
    if (!validation.valid) {
      // validation.message is produced by postpartumLossDateValidation.ts
      // (out of this task's scope — see PHASE 3 task notes) and is not yet
      // localized; only the Alert title is translated here.
      Alert.alert(t('pregnancyDeliveryDateSheet.invalidDateTitle'), validation.message);
      return;
    }
    setSaving(true);
    try {
      await confirmDelivery(value, {startsNewJourney: Boolean(getPostpartumPreferences().deliveryDate)});
    } catch (error) {
      // Not persisted: nothing is confirmed, the sheet stays open and can be retried.
      setSaving(false);
      presentSaveFailure(error);
      return;
    }
    onConfirmed(value);
    close();
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
              backgroundColor: theme.colors.surface,
              paddingBottom: getBottomPadding(insets.bottom),
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [320, 0]})}],
            },
          ]}>
          <View style={styles.handle} />

          <AwaText style={styles.title} variant="titleLarge">{t('pregnancyDeliveryDateSheet.title')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodyMedium">{t('pregnancyDeliveryDateSheet.description')}</AwaText>

          <AwaButton
            fullWidth
            icon="heart-outline"
            label={saving ? t('periodStartSheet.saving') : t('pregnancyDeliveryDateSheet.confirmToday')}
            loading={saving}
            onPress={() => commit(new Date())}
            size="large"
            style={styles.confirmButton}
          />

          <AwaButton
            disabled={saving}
            fullWidth
            icon="calendar-month-outline"
            label={t('pregnancyDeliveryDateSheet.chooseAnotherDate')}
            onPress={() => setPickerOpen(true)}
            style={styles.secondaryButton}
            variant="outlined"
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

        <InlineCalendarPickerModal
          onClose={() => setPickerOpen(false)}
          maximumDate={startOfDay(new Date())}
          minimumDate={pregnancyStart ? startOfDay(pregnancyStart) : undefined}
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
    paddingHorizontal: 18,
    paddingTop: 10,
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  title: {marginTop: 14},
  description: {marginTop: 8},
  confirmButton: {marginTop: 18},
  secondaryButton: {marginTop: 10},
  cancelButton: {marginTop: 10},
});

export default memo(DeliveryDateSheet);
