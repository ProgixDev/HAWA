import React, {memo, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import {useTranslation} from 'react-i18next';

import {AwaIconButton} from '../ui/AwaIconButton';

type Props = {
  active: boolean;
  onPress: () => void;
  size?: 'small' | 'medium';
  /** `onDark` sits on a photo / hero background: the button is filled with the primary role so it stays legible. */
  tone?: 'light' | 'onDark';
};

// A Material 3 icon button (touch target 48 dp) with the existing bookmark spring: tonal when idle, the `selected`
// state (primary container) when the article is bookmarked.
function BookmarkButton({active, onPress, size = 'medium', tone = 'light'}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {toValue: 0.72, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, damping: 9, stiffness: 220, useNativeDriver: true}),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <AwaIconButton
        accessibilityLabel={active ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')}
        icon={active ? 'bookmark' : 'bookmark-outline'}
        iconSize={size === 'small' ? 16 : 18}
        onPress={handlePress}
        selected={active}
        size={size === 'small' ? 'small' : 'medium'}
        variant={tone === 'onDark' ? 'filled' : 'tonal'}
      />
    </Animated.View>
  );
}

export default memo(BookmarkButton);
