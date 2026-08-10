import React, {memo, useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii} from '../home/homeTheme';
import {LIBRARY_TINTS, type LibraryCategory} from '../../data/libraryContent';

type Props = {
  visible: boolean;
  categories: LibraryCategory[];
  articleCountByCategory: Record<string, number>;
  onSelect: (category: LibraryCategory) => void;
  onClose: () => void;
};

function CategoryListSheet({visible, categories, articleCountByCategory, onSelect, onClose}: Props): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    progress.setValue(0);
    Animated.spring(progress, {toValue: 1, damping: 22, stiffness: 170, mass: 0.8, useNativeDriver: true}).start();
  }, [progress, visible]);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
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
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [320, 0]})}],
            },
          ]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Toutes les catégories</Text>
          <Text style={styles.subtitle}>Adaptées à ton objectif actuel.</Text>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {categories.map(category => {
              const tint = LIBRARY_TINTS[category.tint];
              return (
                <Pressable
                  accessibilityRole="button"
                  key={category.id}
                  onPress={() => {
                    onSelect(category);
                    close();
                  }}
                  style={({pressed}) => [styles.row, pressed && styles.pressed]}>
                  <View style={[styles.rowIcon, {backgroundColor: tint.bg}]}>
                    <MaterialDesignIcons color={tint.fg} name={category.icon} size={19} />
                  </View>
                  <Text numberOfLines={1} style={styles.rowLabel}>{category.label}</Text>
                  <Text style={styles.rowCount}>{articleCountByCategory[category.id] ?? 0}</Text>
                  <MaterialDesignIcons color={homeColors.textSecondary} name="chevron-right" size={18} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: homeRadii.card,
    borderTopRightRadius: homeRadii.card,
    backgroundColor: '#FCFAFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  title: {marginTop: 14, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 19, fontWeight: '700'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 12.5},
  list: {marginTop: 12, paddingBottom: 4, gap: 6},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56},
  rowIcon: {width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  rowLabel: {flex: 1, minWidth: 0, color: homeColors.textPrimary, fontSize: 14, fontWeight: '600'},
  rowCount: {color: homeColors.textSecondary, fontSize: 12, fontWeight: '600'},
  pressed: {opacity: 0.75},
});

export default memo(CategoryListSheet);
