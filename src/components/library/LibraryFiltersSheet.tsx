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

import {homeColors, homeRadii} from '../home/homeTheme';
import {OBJECTIVE_HEADLINES} from '../../data/libraryContent';
import type {ObjectiveId} from '../../state/onboardingPreferences';
import {
  LEVEL_OPTIONS,
  READING_TIME_OPTIONS,
  TYPE_OPTIONS,
  toggleInArray,
  type LibraryFilters,
} from '../../utils/libraryFilters';

export type LibraryContentScope = 'medical' | 'religious';

type Props = {
  visible: boolean;
  filters: LibraryFilters;
  contentScope: LibraryContentScope;
  objectiveOverride: ObjectiveId | null;
  resultCount: number;
  onChange: (filters: LibraryFilters) => void;
  onChangeContentScope: (scope: LibraryContentScope) => void;
  onChangeObjectiveOverride: (objective: ObjectiveId | null) => void;
  onReset: () => void;
  onClose: () => void;
};

const OBJECTIVE_IDS = Object.keys(OBJECTIVE_HEADLINES) as ObjectiveId[];

function OptionChip({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Text numberOfLines={1} style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function LibraryFiltersSheet({
  visible, filters, contentScope, objectiveOverride, resultCount,
  onChange, onChangeContentScope, onChangeObjectiveOverride, onReset, onClose,
}: Props): React.JSX.Element {
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
          <Pressable accessibilityLabel="Fermer les filtres" onPress={close} style={StyleSheet.absoluteFill} />
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>Filtres avancés</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onReset}>
              <Text style={styles.reset}>Réinitialiser</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Type de contenu</Text>
            <View style={styles.scopeRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: contentScope === 'medical'}}
                onPress={() => onChangeContentScope('medical')}
                style={({pressed}) => [styles.scopeButton, contentScope === 'medical' && styles.scopeButtonActive, pressed && styles.pressed]}>
                <MaterialDesignIcons color={contentScope === 'medical' ? '#FFFFFF' : homeColors.primary} name="stethoscope" size={16} />
                <Text style={[styles.scopeLabel, contentScope === 'medical' && styles.scopeLabelActive]}>Médical</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: contentScope === 'religious'}}
                onPress={() => onChangeContentScope('religious')}
                style={({pressed}) => [styles.scopeButton, contentScope === 'religious' && styles.scopeButtonActiveGold, pressed && styles.pressed]}>
                <MaterialDesignIcons color={contentScope === 'religious' ? '#FFFFFF' : '#B7791F'} name="mosque-outline" size={16} />
                <Text style={[styles.scopeLabel, contentScope === 'religious' && styles.scopeLabelActive]}>Religieux</Text>
              </Pressable>
            </View>

            {contentScope === 'medical' && (
              <>
                <Text style={styles.sectionLabel}>Objectif</Text>
                <View style={styles.chipRow}>
                  <OptionChip
                    active={objectiveOverride === null}
                    label="Mon objectif actuel"
                    onPress={() => onChangeObjectiveOverride(null)}
                  />
                  {OBJECTIVE_IDS.map(id => (
                    <OptionChip
                      active={objectiveOverride === id}
                      key={id}
                      label={OBJECTIVE_HEADLINES[id]}
                      onPress={() => onChangeObjectiveOverride(id)}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>Temps de lecture</Text>
            <View style={styles.chipRow}>
              {READING_TIME_OPTIONS.map(option => (
                <OptionChip
                  active={filters.readingTime === option.key}
                  key={option.key}
                  label={option.label}
                  onPress={() => onChange({...filters, readingTime: option.key})}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Niveau</Text>
            <View style={styles.chipRow}>
              {LEVEL_OPTIONS.map(option => (
                <OptionChip
                  active={filters.levels.includes(option.key)}
                  key={option.key}
                  label={option.label}
                  onPress={() => onChange({...filters, levels: toggleInArray(filters.levels, option.key)})}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Type de format</Text>
            <View style={styles.chipRow}>
              {TYPE_OPTIONS.map(option => (
                <OptionChip
                  active={filters.types.includes(option.key)}
                  key={option.key}
                  label={option.label}
                  onPress={() => onChange({...filters, types: toggleInArray(filters.types, option.key)})}
                />
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Favoris uniquement</Text>
              <Switch
                ios_backgroundColor={homeColors.cardBorder}
                onValueChange={value => onChange({...filters, favoritesOnly: value})}
                thumbColor="#FFFFFF"
                trackColor={{false: homeColors.cardBorder, true: homeColors.primary}}
                value={filters.favoritesOnly}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Récemment lus</Text>
              <Switch
                ios_backgroundColor={homeColors.cardBorder}
                onValueChange={value => onChange({...filters, recentlyRead: value})}
                thumbColor="#FFFFFF"
                trackColor={{false: homeColors.cardBorder, true: homeColors.primary}}
                value={filters.recentlyRead}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Déjà lus</Text>
              <Switch
                ios_backgroundColor={homeColors.cardBorder}
                onValueChange={value => onChange({...filters, alreadyRead: value})}
                thumbColor="#FFFFFF"
                trackColor={{false: homeColors.cardBorder, true: homeColors.primary}}
                value={filters.alreadyRead}
              />
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={close} style={({pressed}) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneText}>Voir les résultats ({resultCount})</Text>
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
    maxHeight: '82%',
    borderTopLeftRadius: homeRadii.card,
    borderTopRightRadius: homeRadii.card,
    backgroundColor: '#FCFAFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    elevation: 20,
  },
  handle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: homeColors.cardBorder},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 19, fontWeight: '700'},
  reset: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  body: {marginTop: 8, paddingBottom: 8},
  sectionLabel: {marginTop: 16, color: homeColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4},
  scopeRow: {flexDirection: 'row', gap: 10, marginTop: 10},
  scopeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1.4,
    borderColor: homeColors.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  scopeButtonActive: {backgroundColor: homeColors.primary, borderColor: homeColors.primary},
  scopeButtonActiveGold: {backgroundColor: '#B7791F', borderColor: '#B7791F'},
  scopeLabel: {color: homeColors.textPrimary, fontSize: 13, fontWeight: '700'},
  scopeLabelActive: {color: '#FFFFFF'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
  chip: {minHeight: 38, borderRadius: 19, borderWidth: 1.4, borderColor: homeColors.cardBorder, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center'},
  chipActive: {backgroundColor: homeColors.primary, borderColor: homeColors.primary},
  chipLabel: {color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '600'},
  chipLabelActive: {color: '#FFFFFF'},
  switchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 8},
  switchLabel: {color: homeColors.textPrimary, fontSize: 14, fontWeight: '600'},
  doneButton: {
    marginTop: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.primary,
  },
  doneText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  pressed: {opacity: 0.85},
});

export default memo(LibraryFiltersSheet);
