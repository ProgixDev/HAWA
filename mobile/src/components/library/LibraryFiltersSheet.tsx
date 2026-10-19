import React, {memo, useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {OBJECTIVE_HEADLINES} from '../../data/libraryContent';
import type {ObjectiveId} from '../../state/onboardingPreferences';
import {
  LEVEL_OPTIONS,
  READING_TIME_OPTIONS,
  TYPE_OPTIONS,
  toggleInArray,
  type LibraryFilters,
} from '../../utils/libraryFilters';
import {displayUpperCase} from '../../utils/textCase';
import {AwaButton} from '../ui/AwaButton';
import {AwaSwitch} from '../ui/AwaSwitch';
import {AwaText} from '../ui/AwaText';

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

// The "Religieux" scope keeps its dedicated gold identity (religious content colour, not a Material role).
const RELIGIOUS_GOLD = '#B7791F';

// Material 3 filter chip: selected = primary container, others outlined with the `outline` role. The touch target is
// 48 dp (visual 40 dp + hitSlop).
function OptionChip({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  const {roles} = useAwaTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      hitSlop={4}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? {backgroundColor: roles.primaryContainer, borderColor: roles.primaryContainer}
          : {borderColor: roles.outline},
      ]}>
      <AwaText
        colorRole={active ? 'onPrimaryContainer' : 'onSurfaceVariant'}
        emphasized={active}
        variant="labelLarge">
        {label}
      </AwaText>
    </Pressable>
  );
}

function LibraryFiltersSheet({
  visible, filters, contentScope, objectiveOverride, resultCount,
  onChange, onChangeContentScope, onChangeObjectiveOverride, onReset, onClose,
}: Props): React.JSX.Element {
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

  const medicalActive = contentScope === 'medical';
  const religiousActive = contentScope === 'religious';

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {backgroundColor: roles.scrim, opacity: progress}]}>
          <Pressable accessibilityLabel="Fermer les filtres" onPress={close} style={StyleSheet.absoluteFill} />
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
          <View style={styles.titleRow}>
            <AwaText variant="titleLarge">Filtres avancés</AwaText>
            <AwaButton label="Réinitialiser" onPress={onReset} size="compact" variant="text" />
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <AwaText colorRole="onSurfaceVariant" style={styles.sectionLabel} variant="labelMedium">
              {displayUpperCase('Type de contenu')}
            </AwaText>
            <View style={styles.scopeRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: medicalActive}}
                onPress={() => onChangeContentScope('medical')}
                style={[
                  styles.scopeButton,
                  medicalActive
                    ? {backgroundColor: roles.primaryContainer, borderColor: roles.primaryContainer}
                    : {borderColor: roles.outline},
                ]}>
                <MaterialDesignIcons
                  color={medicalActive ? roles.onPrimaryContainer : roles.accessible.primaryAsText}
                  name="stethoscope"
                  size={18}
                />
                <AwaText
                  colorRole={medicalActive ? 'onPrimaryContainer' : 'onSurface'}
                  emphasized={medicalActive}
                  variant="labelLarge">
                  Médical
                </AwaText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: religiousActive}}
                onPress={() => onChangeContentScope('religious')}
                style={[
                  styles.scopeButton,
                  religiousActive
                    ? {backgroundColor: RELIGIOUS_GOLD, borderColor: RELIGIOUS_GOLD}
                    : {borderColor: roles.outline},
                ]}>
                <MaterialDesignIcons
                  color={religiousActive ? '#FFFFFF' : RELIGIOUS_GOLD}
                  name="mosque-outline"
                  size={18}
                />
                <AwaText
                  color={religiousActive ? '#FFFFFF' : undefined}
                  colorRole="onSurface"
                  emphasized={religiousActive}
                  variant="labelLarge">
                  Religieux
                </AwaText>
              </Pressable>
            </View>

            {contentScope === 'medical' && (
              <>
                <AwaText colorRole="onSurfaceVariant" style={styles.sectionLabel} variant="labelMedium">
                  {displayUpperCase('Objectif')}
                </AwaText>
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

            <AwaText colorRole="onSurfaceVariant" style={styles.sectionLabel} variant="labelMedium">
              {displayUpperCase('Temps de lecture')}
            </AwaText>
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

            <AwaText colorRole="onSurfaceVariant" style={styles.sectionLabel} variant="labelMedium">
              {displayUpperCase('Niveau')}
            </AwaText>
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

            <AwaText colorRole="onSurfaceVariant" style={styles.sectionLabel} variant="labelMedium">
              {displayUpperCase('Type de format')}
            </AwaText>
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
              <AwaText style={styles.switchLabel} variant="bodyLarge">Favoris uniquement</AwaText>
              <AwaSwitch
                accessibilityLabel="Favoris uniquement"
                onValueChange={value => onChange({...filters, favoritesOnly: value})}
                value={filters.favoritesOnly}
              />
            </View>

            <View style={styles.switchRow}>
              <AwaText style={styles.switchLabel} variant="bodyLarge">Récemment lus</AwaText>
              <AwaSwitch
                accessibilityLabel="Récemment lus"
                onValueChange={value => onChange({...filters, recentlyRead: value})}
                value={filters.recentlyRead}
              />
            </View>

            <View style={styles.switchRow}>
              <AwaText style={styles.switchLabel} variant="bodyLarge">Déjà lus</AwaText>
              <AwaSwitch
                accessibilityLabel="Déjà lus"
                onValueChange={value => onChange({...filters, alreadyRead: value})}
                value={filters.alreadyRead}
              />
            </View>
          </ScrollView>

          <AwaButton
            fullWidth
            label={`Voir les résultats (${resultCount})`}
            onPress={close}
            style={styles.doneButton}
            variant="filled"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  overlay: {...StyleSheet.absoluteFillObject},
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {width: 32, height: 4, alignSelf: 'center', borderRadius: 2},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12},
  body: {marginTop: 8, paddingBottom: 8},
  sectionLabel: {marginTop: 16},
  scopeRow: {flexDirection: 'row', gap: 12, marginTop: 8},
  scopeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  chip: {
    minHeight: 40,
    maxWidth: '100%',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 8},
  switchLabel: {flex: 1, marginRight: 12},
  doneButton: {marginTop: 12},
});

export default memo(LibraryFiltersSheet);
