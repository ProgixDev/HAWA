import React, {memo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors} from '../home/homeTheme';

type Props = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onPressFilters: () => void;
  activeFilterCount: number;
  onBack: () => void;
};

function LibraryIllustration(): React.JSX.Element {
  return (
    <View pointerEvents="none" style={illustrationStyles.wrap}>
      <View style={illustrationStyles.glow} />
      <MaterialDesignIcons color="#B8A6E8" name="star-four-points-outline" size={13} style={illustrationStyles.sparkleTop} />
      <MaterialDesignIcons color="#D8C7F5" name="star-four-points-outline" size={9} style={illustrationStyles.sparkleBottom} />
      <MaterialDesignIcons color={homeColors.primary} name="book-open-page-variant" size={40} style={illustrationStyles.bookBack} />
      <MaterialDesignIcons color="#8F6FE0" name="book-open-page-variant-outline" size={34} style={illustrationStyles.bookFront} />
      <MaterialDesignIcons color="#3E8E56" name="leaf" size={16} style={illustrationStyles.leaf} />
    </View>
  );
}

function LibraryHeader({searchQuery, onChangeSearch, onPressFilters, activeFilterCount, onBack}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top + 6, 16);
  const [focused, setFocused] = useState(false);
  const focusProgress = useRef(new Animated.Value(0)).current;

  const animateFocus = (next: boolean) => {
    setFocused(next);
    Animated.timing(focusProgress, {
      toValue: next ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.header, {paddingTop: topSpacing}]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          onPress={onBack}
          style={({pressed}) => [styles.back, pressed && styles.pressedBack]}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={28} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={styles.title}>Bibliothèque</Text>
          <Text numberOfLines={2} style={styles.subtitle}>Apprends, comprends et prends soin de toi 💜</Text>
        </View>

        <LibraryIllustration />
      </View>

      <View style={styles.searchRow}>
        <Animated.View
          style={[
            styles.searchBar,
            {
              borderColor: focusProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [homeColors.cardBorder, homeColors.primary],
              }),
              shadowOpacity: focusProgress.interpolate({inputRange: [0, 1], outputRange: [0.06, 0.16]}),
            },
          ]}>
          <MaterialDesignIcons color={focused ? homeColors.primary : homeColors.textSecondary} name="magnify" size={19} />
          <TextInput
            accessibilityLabel="Rechercher un article ou un sujet"
            onBlur={() => animateFocus(false)}
            onChangeText={onChangeSearch}
            onFocus={() => animateFocus(true)}
            placeholder="Rechercher un article, un sujet…"
            placeholderTextColor={homeColors.textSecondary}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable accessibilityLabel="Effacer la recherche" hitSlop={8} onPress={() => onChangeSearch('')}>
              <MaterialDesignIcons color={homeColors.textSecondary} name="close-circle" size={17} />
            </Pressable>
          )}
        </Animated.View>

        <Pressable
          accessibilityLabel={`Filtres${activeFilterCount > 0 ? `, ${activeFilterCount} actifs` : ''}`}
          accessibilityRole="button"
          onPress={onPressFilters}
          style={({pressed}) => [styles.filterButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={homeColors.primary} name="tune-variant" size={17} />
          <Text style={styles.filterLabel}>Filtres</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text numberOfLines={1} style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  wrap: {width: 74, height: 66, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  glow: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F0EBFF',
  },
  bookBack: {position: 'absolute', top: 6, left: 20, transform: [{rotate: '-6deg'}]},
  bookFront: {position: 'absolute', bottom: 8, left: 8, transform: [{rotate: '8deg'}]},
  leaf: {position: 'absolute', top: 2, right: 4, transform: [{rotate: '22deg'}]},
  sparkleTop: {position: 'absolute', top: 0, left: 2},
  sparkleBottom: {position: 'absolute', bottom: 4, right: 0},
});

const styles = StyleSheet.create({
  header: {paddingHorizontal: 16, paddingBottom: 4},
  headerRow: {flexDirection: 'row', alignItems: 'center'},
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    padding: 9,
    elevation: 2,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    flexShrink: 0,
  },
  pressedBack: {opacity: 0.78, transform: [{scale: 0.985}]},
  headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 24, fontWeight: '700'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 13, lineHeight: 18},
  searchRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10},
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1.4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {flex: 1, minWidth: 0, color: homeColors.textPrimary, fontSize: 13.5, padding: 0},
  filterButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  filterLabel: {color: homeColors.primary, fontSize: 13, fontWeight: '700'},
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    backgroundColor: homeColors.primary,
  },
  filterBadgeText: {color: '#FFFFFF', fontSize: 10, fontWeight: '700'},
  pressed: {opacity: 0.85},
});

export default memo(LibraryHeader);
