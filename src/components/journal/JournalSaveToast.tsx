import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

// The one shared "premium save toast" for journal entry screens. This exact
// spring-in / timed fade-out card (icon circle + text + close button) was
// first built by hand in JournalMoodScreen.tsx and then hand-copied again
// into PregnancyMedicalInformationScreen.tsx and
// JournalConceptionReportsScreen.tsx (each with a comment pointing back to
// the original) — extracted here so new screens reuse the same
// implementation instead of another hand-copy. Animation timings/colors are
// unchanged from that original: spring in (damping 17/stiffness 180/mass
// 0.85), 2500ms visible, fade out (220ms, Easing.in(quad)).
const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';

export function useJournalSaveToast() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState({title: '', message: ''});
  const animation = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  const show = (title: string, message: string, onDone?: () => void) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    setContent({title, message});
    setVisible(true);
    animation.stopAnimation();
    animation.setValue(0);

    Animated.spring(animation, {
      toValue: 1,
      damping: 17,
      stiffness: 180,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    timeout.current = setTimeout(() => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setVisible(false);
          onDone?.();
        }
      });
    }, 2500);
  };

  const hide = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setVisible(false);
      }
    });
  };

  return {visible, title: content.title, message: content.message, animation, show, hide};
}

type Props = {
  visible: boolean;
  title: string;
  message: string;
  animation: Animated.Value;
  onDismiss: () => void;
  bottom: number;
};

export function JournalSaveToast({visible, title, message, animation, onDismiss, bottom}: Props): React.JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          bottom,
          opacity: animation,
          transform: [
            {translateY: animation.interpolate({inputRange: [0, 1], outputRange: [18, 0]})},
            {scale: animation.interpolate({inputRange: [0, 1], outputRange: [0.97, 1]})},
          ],
        },
      ]}>
      <View style={styles.toastIcon}>
        <MaterialDesignIcons color="#FFFFFF" name="check" size={14} />
      </View>

      <View style={styles.toastCopy}>
        <Text style={styles.toastTitle}>{title}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </View>

      <Pressable
        accessibilityLabel="Fermer"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDismiss}
        style={({pressed}) => [styles.toastCloseButton, pressed && styles.toastCloseButtonPressed]}>
        <MaterialDesignIcons color="#8E83A4" name="close" size={17} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#E3D8F2',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#4F2A9C',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.17,
    shadowRadius: 13,
    elevation: 7,
  },
  toastIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: PURPLE,
  },
  toastCopy: {flex: 1, minWidth: 0},
  toastTitle: {color: PURPLE_DARK, fontSize: 12.5, lineHeight: 16, fontWeight: '800'},
  toastMessage: {marginTop: 1, color: '#6B6281', fontSize: 11, lineHeight: 15, fontWeight: '600'},
  toastCloseButton: {width: 32, height: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16},
  toastCloseButtonPressed: {backgroundColor: '#F3EEF8', opacity: 0.8},
});
