import React, {memo, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeRadii} from '../home/homeTheme';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {dateFormatLocale} from '../../utils/cycleMath';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

// STEP 2 of the Pregnancy → Postpartum transition — the emotional moment,
// shown only after DeliveryDateSheet has already persisted a real delivery
// date (see postpartumPreferences.confirmDelivery()). This is the ONE place
// activeObjective actually switches to 'postpartum' — everything before
// this card only records the date, never the objective.

type Props = {
  visible: boolean;
  /** The just-confirmed (or previously confirmed) delivery date — shown
   * discretely, never hardcoded. */
  deliveryDate: Date | null;
  /** Called once activeObjective has switched to 'postpartum' and the exit
   * animation has finished — the caller just needs to hide this card. */
  onStarted: () => void;
  /** Called when the user picks "Plus tard" — activeObjective is left
   * untouched; the delivery date stays persisted. */
  onLater: () => void;
};

function PostpartumCongratsCard({visible, deliveryDate, onStarted, onLater}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const reduceMotion = useRef(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    setStarting(false);
    opacity.setValue(0);
    scale.setValue(0.94);
    translateY.setValue(20);
    const duration = reduceMotion.current ? 0 : 420;
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      Animated.timing(scale, {toValue: 1, duration, easing: Easing.out(Easing.back(1.15)), useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
    ]).start();
  }, [visible, opacity, scale, translateY]);

  const dismiss = (after: () => void) => {
    const duration = reduceMotion.current ? 0 : 260;
    Animated.parallel([
      Animated.timing(opacity, {toValue: 0, duration, easing: Easing.in(Easing.quad), useNativeDriver: true}),
      Animated.timing(scale, {toValue: 0.96, duration, easing: Easing.in(Easing.quad), useNativeDriver: true}),
    ]).start(({finished}) => finished && after());
  };

  // The one moment activeObjective actually changes — fired right as the
  // card starts fading, so the objective-aware Home has already swapped to
  // PostpartumDashboard underneath by the time the card finishes dismissing
  // (setActiveObjective's listeners fire synchronously), giving a smooth
  // reveal instead of a blank flash. Total press-to-Home time stays within
  // the ~400–700ms target since the fade/scale-out runs 260ms.
  const handleStart = () => {
    if (starting) {return;}
    setStarting(true);
    // The objective swaps synchronously (listeners fire at the call); the card is only dismissed — and the journey only
    // announced as started — once the switch has been persisted. A refused/failed write rolls the objective back.
    setActiveObjective('postpartum').then(
      () => dismiss(onStarted),
      error => {
        setStarting(false);
        presentSaveFailure(error);
      },
    );
  };

  const handleLater = () => {
    if (starting) {return;}
    dismiss(onLater);
  };

  return (
    <Modal animationType="none" onRequestClose={handleLater} statusBarTranslucent transparent visible={visible}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20)},
        ]}>
        <Pressable accessibilityLabel={t('common.close')} onPress={handleLater} style={styles.backdrop} />

        <Animated.View style={[styles.card, theme.shadow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity, transform: [{scale}, {translateY}]}]}>
          <View style={[styles.iconCircle, {backgroundColor: theme.colors.primarySoft}]}>
            <MaterialDesignIcons color={theme.colors.primary}name="heart-outline" size={26} />
          </View>

          <AwaText variant="headlineSmall" style={styles.title}>{t('pregnancyPostpartumCongrats.title')}</AwaText>
          <AwaText colorRole="primary" variant="titleSmall" style={styles.subtitle}>{t('pregnancyPostpartumCongrats.subtitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.message}>{t('pregnancyPostpartumCongrats.message')}</AwaText>

          {deliveryDate ? (
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.deliveryLine}>
              {t('pregnancyPostpartumCongrats.deliveryRecordedOn')}{' '}
              {new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(deliveryDate)}
            </AwaText>
          ) : null}

          <AwaButton
            fullWidth
            label={starting ? t('pregnancyPostpartumCongrats.preparing') : t('pregnancyPostpartumCongrats.startPostpartumTracking')}
            loading={starting}
            onPress={handleStart}
            size="large"
            style={styles.primaryButton}
          />

          <AwaButton
            disabled={starting}
            fullWidth
            label={t('pregnancyPostpartumCongrats.later')}
            onPress={handleLater}
            style={styles.laterButton}
            variant="text"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#17102F',
    opacity: 0.45,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    // Surface, border and shadow come from the theme at render time (DESIGN.md).
  },
  iconCircle: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  title: {marginTop: 16, textAlign: 'center'},
  subtitle: {marginTop: 6, textAlign: 'center'},
  message: {marginTop: 12, textAlign: 'center'},
  deliveryLine: {marginTop: 12, textAlign: 'center'},
  primaryButton: {marginTop: 22},
  laterButton: {marginTop: 10},
});

export default memo(PostpartumCongratsCard);
