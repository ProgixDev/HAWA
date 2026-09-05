import React, {memo, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeRadii} from '../home/homeTheme';
import {setActiveObjective} from '../../state/onboardingPreferences';

// Reusing the existing flower illustration (already used by HeroCycleCard)
// instead of adding a new asset, per the "reuse existing assets" guidance.
const FLOWER = require('../../assets/images/flower.png');

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
  const insets = useSafeAreaInsets();
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
    setActiveObjective('postpartum').catch(() => {});
    dismiss(onStarted);
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
        <Pressable accessibilityLabel="Fermer" onPress={handleLater} style={styles.backdrop} />

        <Animated.View style={[styles.card, {opacity, transform: [{scale}, {translateY}]}]}>
          <Image accessibilityIgnoresInvertColors resizeMode="contain" source={FLOWER} style={styles.flower} />

          <View style={styles.iconCircle}>
            <MaterialDesignIcons color={homeColors.primary} name="heart-outline" size={26} />
          </View>

          <Text style={styles.title}>Félicitations 💜</Text>
          <Text style={styles.subtitle}>Une nouvelle étape commence.</Text>
          <Text style={styles.message}>Souhaites-tu démarrer ton suivi post-partum ?</Text>

          {deliveryDate ? (
            <Text style={styles.deliveryLine}>
              Accouchement enregistré le{' '}
              {new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(deliveryDate)}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={starting}
            onPress={handleStart}
            style={({pressed}) => [styles.primaryButton, (pressed || starting) && styles.pressed]}>
            <Text style={styles.primaryText}>{starting ? 'Préparation…' : 'Démarrer mon suivi post-partum'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={starting}
            onPress={handleLater}
            style={({pressed}) => [styles.laterButton, pressed && styles.pressed]}>
            <Text style={styles.laterText}>Plus tard</Text>
          </Pressable>
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
    borderColor: 'rgba(111,78,190,0.14)',
    backgroundColor: '#FEFCFF',
    shadowColor: '#7A56D6',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 16,
  },
  flower: {
    position: 'absolute',
    top: -10,
    right: -14,
    width: 74,
    height: 70,
    opacity: 0.5,
    transform: [{rotate: '10deg'}],
  },
  iconCircle: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#F1EAFB',
  },
  title: {
    marginTop: 16,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: homeColors.primary,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    color: homeColors.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  deliveryLine: {
    marginTop: 12,
    color: homeColors.textSecondary,
    fontSize: 11.5,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    marginTop: 22,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  primaryText: {color: '#FFFFFF', fontSize: 14.5, fontWeight: '700'},
  laterButton: {
    marginTop: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {color: homeColors.textSecondary, fontSize: 13.5, fontWeight: '600'},
  pressed: {opacity: 0.85},
});

export default memo(PostpartumCongratsCard);
