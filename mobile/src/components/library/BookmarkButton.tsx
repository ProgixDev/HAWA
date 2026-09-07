import React, {memo, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';

type Props = {
  active: boolean;
  onPress: () => void;
  size?: 'small' | 'medium';
  tone?: 'light' | 'onDark';
};

function BookmarkButton({active, onPress, size = 'medium', tone = 'light'}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const dimension = size === 'small' ? 30 : 36;
  const iconSize = size === 'small' ? 15 : 17;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {toValue: 0.72, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, damping: 9, stiffness: 220, useNativeDriver: true}),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={[
        styles.button,
        {width: dimension, height: dimension, borderRadius: dimension / 2},
        // 'onDark' sits on an arbitrary tinted/hero background (not the app's
        // global theme surface), so its translucent-white treatment stays a
        // fixed literal — see the style below.
        tone === 'onDark' ? styles.onDark : {backgroundColor: theme.colors.primarySoft},
      ]}>
      <Animated.View style={{transform: [{scale}]}}>
        <MaterialDesignIcons
          color={active ? theme.colors.primary : (tone === 'onDark' ? '#FFFFFF' : theme.colors.textSecondary)}
          name={active ? 'bookmark' : 'bookmark-outline'}
          size={iconSize}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {alignItems: 'center', justifyContent: 'center'},
  onDark: {backgroundColor: 'rgba(255,255,255,0.24)'},
});

export default memo(BookmarkButton);
