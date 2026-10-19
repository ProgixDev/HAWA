import React, {memo, useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {LIBRARY_TINTS, type LibraryCategory} from '../../data/libraryContent';
import {AwaText} from '../ui/AwaText';

type Props = {
  visible: boolean;
  categories: LibraryCategory[];
  articleCountByCategory: Record<string, number>;
  onSelect: (category: LibraryCategory) => void;
  onClose: () => void;
};

function CategoryListSheet({visible, categories, articleCountByCategory, onSelect, onClose}: Props): React.JSX.Element {
  const {roles} = useAwaTokens();
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
        <Animated.View style={[styles.overlay, {backgroundColor: roles.scrim, opacity: progress}]}>
          <Pressable accessibilityLabel="Fermer" onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: roles.surface,
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [320, 0]})}],
            },
          ]}>
          <View style={[styles.handle, {backgroundColor: roles.outline}]} />
          <AwaText style={styles.title} variant="titleLarge">Toutes les catégories</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
            Adaptées à ton objectif actuel.
          </AwaText>

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
                  style={styles.row}>
                  <View style={[styles.rowIcon, {backgroundColor: tint.bg}]}>
                    <MaterialDesignIcons color={tint.fg} name={category.icon} size={20} />
                  </View>
                  <AwaText style={styles.rowLabel} variant="bodyLarge">{category.label}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="labelMedium">
                    {articleCountByCategory[category.id] ?? 0}
                  </AwaText>
                  <MaterialDesignIcons color={roles.accessible.onSurfaceVariant} name="chevron-right" size={20} />
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
  overlay: {...StyleSheet.absoluteFillObject},
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  handle: {width: 32, height: 4, alignSelf: 'center', borderRadius: 2},
  title: {marginTop: 16},
  subtitle: {marginTop: 4},
  list: {marginTop: 12, paddingBottom: 4, gap: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56},
  rowIcon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  rowLabel: {flex: 1, minWidth: 0},
});

export default memo(CategoryListSheet);
