import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';
import {getSelectedObjective} from '../state/onboardingPreferences';
import {OBJECTIVE_CONFIRMATION_CONTENT} from '../data/objectiveConfirmationContent';

const CONFIRMATION_BACKGROUND = require('../assets/images/cycle-objective-confirmation-background.png');
const PURPLE = '#6949BE';

type Props = NativeStackScreenProps<RootStackParamList, 'CycleObjectiveConfirmation'>;

function CycleObjectiveConfirmationScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // Read once on mount: ObjectiveScreen already awaits setSelectedObjective()
  // before navigating here, so the canonical value is current the moment
  // this screen appears — no hydration, no stale previous-objective text.
  const [objective] = useState(getSelectedObjective);
  const content = OBJECTIVE_CONFIRMATION_CONTENT[objective];
  // The "after a loss" objective keeps the same HAWA look but an
  // emotionally neutral, more subtle motion — no celebratory feel.
  const gentle = objective === 'loss';

  const illustrationAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (cancelled) {return;}

      if (reduceMotion) {
        // No translate/scale movement — a single short, subtle fade.
        Animated.timing(titleAnim, {toValue: 1, duration: 160, useNativeDriver: true}).start();
        illustrationAnim.setValue(1);
        descriptionAnim.setValue(1);
        detailAnim.setValue(1);
        buttonAnim.setValue(1);
        return;
      }

      const easing = Easing.out(Easing.cubic);
      Animated.parallel([
        Animated.timing(illustrationAnim, {toValue: 1, duration: 500, easing, useNativeDriver: true}),
        Animated.timing(titleAnim, {toValue: 1, duration: 460, delay: 120, easing, useNativeDriver: true}),
        Animated.timing(descriptionAnim, {toValue: 1, duration: 460, delay: 220, easing, useNativeDriver: true}),
        Animated.timing(detailAnim, {toValue: 1, duration: 440, delay: 300, easing, useNativeDriver: true}),
        Animated.timing(buttonAnim, {toValue: 1, duration: 400, delay: 380, easing, useNativeDriver: true}),
      ]).start();
    });

    return () => {cancelled = true;};
  }, [illustrationAnim, titleAnim, descriptionAnim, detailAnim, buttonAnim]);

  const titleOffset = gentle ? 6 : 12;
  const descriptionOffset = gentle ? 5 : 10;
  const detailOffset = gentle ? 5 : 10;
  const buttonOffset = gentle ? 8 : 14;

  const illustrationStyle = {
    opacity: illustrationAnim,
    transform: [
      {translateY: illustrationAnim.interpolate({inputRange: [0, 1], outputRange: [18, 0]})},
      {scale: gentle ? 1 : illustrationAnim.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]})},
    ],
  };
  const titleStyle = {
    opacity: titleAnim,
    transform: [{translateY: titleAnim.interpolate({inputRange: [0, 1], outputRange: [titleOffset, 0]})}],
  };
  const descriptionStyle = {
    opacity: descriptionAnim,
    transform: [{translateY: descriptionAnim.interpolate({inputRange: [0, 1], outputRange: [descriptionOffset, 0]})}],
  };
  const detailStyle = {
    opacity: detailAnim,
    transform: [{translateY: detailAnim.interpolate({inputRange: [0, 1], outputRange: [detailOffset, 0]})}],
  };
  const buttonStyle = {
    opacity: buttonAnim,
    transform: [{translateY: buttonAnim.interpolate({inputRange: [0, 1], outputRange: [buttonOffset, 0]})}],
  };

  return (
    <ImageBackground source={CONFIRMATION_BACKGROUND} resizeMode="cover" style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.page, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
        <View style={styles.content}>
          {content.illustration ? (
            <Animated.Image resizeMode="contain" source={content.illustration} style={[styles.illustration, illustrationStyle]} />
          ) : null}

          <View style={styles.copy}>
            <Animated.Text style={[styles.title, titleStyle]}>{content.title}</Animated.Text>
            <Animated.Text style={[styles.lead, descriptionStyle]}>{content.description}</Animated.Text>
            <Animated.Text style={[styles.description, detailStyle]}>{content.nextStep}</Animated.Text>
          </View>
        </View>

        <Animated.View style={buttonStyle}>
          <Pressable
            accessibilityLabel={content.buttonLabel}
            accessibilityRole="button"
            onPress={() => navigation.navigate('SpiritualPreferences')}
            style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>{content.buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F0E3F9'},
  page: {flex: 1, justifyContent: 'space-between', paddingHorizontal: 18},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  illustration: {width: '78%', maxWidth: 260, aspectRatio: 1},
  copy: {alignItems: 'center', marginTop: 90},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 29, fontWeight: '700', lineHeight: 38, textAlign: 'center'},
  lead: {marginTop: 14, color: '#433467', fontSize: 16, lineHeight: 23, textAlign: 'center'},
  description: {marginTop: 27, color: '#655A8D', fontSize: 15, lineHeight: 22, textAlign: 'center'},
  button: {height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: PURPLE, elevation: 5, shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9},
  buttonPressed: {opacity: 0.88, transform: [{scale: 0.99}]},
  buttonText: {color: '#FFFFFF', fontSize: 17, fontWeight: '600'},
});

export default CycleObjectiveConfirmationScreen;
