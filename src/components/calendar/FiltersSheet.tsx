import React, {memo, useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeRadii} from '../home/homeTheme';
import type {CalendarFilterKey, CalendarFilters} from '../../state/calendarFilters';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type FilterOption = {key: CalendarFilterKey; icon: IconName; label: string};

const OPTIONS: FilterOption[] = [
  {key: 'rules', icon: 'water', label: 'Règles'},
  {key: 'symptoms', icon: 'heart-outline', label: 'Symptômes'},
  {key: 'mood', icon: 'emoticon-happy-outline', label: 'Humeur'},
  {key: 'notes', icon: 'notebook-edit-outline', label: 'Notes'},
  {key: 'activity', icon: 'run', label: 'Activité'},
  {key: 'sleep', icon: 'weather-night', label: 'Sommeil'},
  {key: 'hydration', icon: 'cup-water', label: 'Hydratation'},
  {key: 'intimacy', icon: 'shield-lock-outline', label: 'Vie intime'},
];

type Props = {
  visible: boolean;
  filters: CalendarFilters;
  onToggle: (key: CalendarFilterKey) => void;
  onClose: () => void;
};

function FiltersSheet({visible, filters, onToggle, onClose}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
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
          <Pressable accessibilityLabel="Fermer les filtres" onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              opacity: progress,
              transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [280, 0]})}],
            },
          ]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filtres du calendrier</Text>
          <Text style={styles.subtitle}>Choisis les informations affichées sur le calendrier.</Text>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {OPTIONS.map(option => (
              <View key={option.key} style={styles.row}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={homeColors.primary} name={option.icon} size={19} />
                </View>
                <Text numberOfLines={1} style={styles.rowLabel}>{option.label}</Text>
                <Switch
                  ios_backgroundColor={homeColors.cardBorder}
                  onValueChange={() => onToggle(option.key)}
                  thumbColor="#FFFFFF"
                  trackColor={{false: homeColors.cardBorder, true: homeColors.primary}}
                  value={filters[option.key]}
                />
              </View>
            ))}
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={close} style={({pressed}) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneText}>Terminé</Text>
          </Pressable>
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
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  title: {marginTop: 14, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
  subtitle: {marginTop: 4, color: homeColors.textSecondary, fontSize: 12.5},
  list: {marginTop: 12, paddingBottom: 4},
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12},
  rowIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: homeColors.lightLavender},
  rowLabel: {flex: 1, color: homeColors.textPrimary, fontSize: 14, fontWeight: '600'},
  doneButton: {
    marginTop: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  doneText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  pressed: {opacity: 0.85},
});

export default memo(FiltersSheet);
