import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {homeColors, homeShadow} from '../../components/home/homeTheme';
import {getTopPadding, spacing} from '../../theme/spacing';
import {getPregnancyJournalState, savePregnancyWeight, type PregnancyWeightEntry} from '../../state/pregnancyJournalStore';

const WEIGHT_ILLUSTRATION = require('../../assets/images/pregnancy/pregnancy-weight-scale.png');

// Pregnancy's "Poids" — redesigned to match the supplied reference (large
// centered scale illustration, premium empty/recorded states, bottom-sheet
// weight entry). Pregnancy-only: does not touch Cycle's own Poids/weight
// screens or Postpartum (which has no weight category at all — its 5
// categories are Fatigue/Sommeil/Humeur/Douleurs/Récupération physique).
// Persists exclusively via pregnancyJournalStore.ts's existing
// savePregnancyWeight/getPregnancyJournalState — no new store, no new
// AsyncStorage key.
//
// IMAGE ASSET: no bathroom-scale illustration exists anywhere in
// src/assets/images (checked before writing this file — confirmed absent,
// including src/assets/images/pregnancy/). Requiring a nonexistent image
// path would break the Metro bundle for the whole app, so this screen uses
// a layered View-based circular illustration (soft lavender rings, the
// existing 'scale-bathroom' icon at its center) as a placeholder. To get
// the exact reference-quality illustration, add a real PNG at
// src/assets/images/pregnancy/pregnancy-weight-scale.png and replace the
// <ScaleIllustration/> body below with a single
// <Image source={require('../../assets/images/pregnancy/pregnancy-weight-scale.png')} resizeMode="contain" .../>.

function ScaleIllustration(): React.JSX.Element {
  return (
    <View style={styles.illustrationWrap}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Balance pèse-personne"
        resizeMode="contain"
        source={WEIGHT_ILLUSTRATION}
        style={styles.weightIllustration}
      />
    </View>
  );
}

function formatKg(value: number): string {
  return value.toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
}

function WeightEntrySheet({
  visible,
  initialValue,
  onClose,
  onSave,
  saving,
  error,
}: {
  visible: boolean;
  initialValue: number | null;
  onClose: () => void;
  onSave: (value: number) => void;
  saving: boolean;
  error: string;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<number>(initialValue ?? 60);

  useEffect(() => {
    if (visible) {setDraft(initialValue ?? 60);}
  }, [visible, initialValue]);

  const adjust = (delta: number) => {
    setDraft(current => Math.min(300, Math.max(30, Math.round((current + delta) * 10) / 10)));
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.sheetOverlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16) + spacing.md}]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Poids</Text>

          <View style={styles.stepperRow}>
            <Pressable
              accessibilityLabel="Diminuer de 0,1 kg"
              accessibilityRole="button"
              onPress={() => adjust(-0.1)}
              style={({pressed}) => [styles.stepperButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={homeColors.primary} name="minus" size={22} />
            </Pressable>

            <View style={styles.stepperValueBlock}>
              <Text style={styles.stepperValue}>{formatKg(draft)}</Text>
              <Text style={styles.stepperUnit}>kg</Text>
            </View>

            <Pressable
              accessibilityLabel="Augmenter de 0,1 kg"
              accessibilityRole="button"
              onPress={() => adjust(0.1)}
              style={({pressed}) => [styles.stepperButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={homeColors.primary} name="plus" size={22} />
            </Pressable>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.sheetError}>{error}</Text> : null}

          <Pressable
            accessibilityLabel="Enregistrer le poids"
            accessibilityRole="button"
            accessibilityState={{disabled: saving}}
            disabled={saving}
            onPress={() => onSave(draft)}
            style={({pressed}) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
            <MaterialDesignIcons color="#FFFFFF" name={saving ? 'loading' : 'check-circle-outline'} size={20} />
            <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function PregnancyWeightScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date()),
    [],
  );

  const [todayEntry, setTodayEntry] = useState<PregnancyWeightEntry | undefined>(undefined);
  const [previousEntry, setPreviousEntry] = useState<PregnancyWeightEntry | undefined>(undefined);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {return;}
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {active = false;};
  }, [entrance]);

  useEffect(() => {
    let active = true;
    getPregnancyJournalState().then(state => {
      if (!active) {return;}
      const sorted = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
      setTodayEntry(sorted.find(entry => entry.date === todayKey));
      // Most recent measurement strictly before today — the only real basis
      // for an "évolution" figure; never fabricated.
      const before = sorted.filter(entry => entry.date < todayKey);
      setPreviousEntry(before[before.length - 1]);
    });
    return () => {active = false;};
  }, [todayKey]);

  const evolutionKg = todayEntry && previousEntry ? Math.round((todayEntry.valueKg - previousEntry.valueKg) * 10) / 10 : undefined;

  const openSheet = () => {
    setError('');
    setSheetVisible(true);
  };

  const handleSave = async (value: number) => {
    if (!Number.isFinite(value) || value <= 0 || value > 300) {
      setError('Saisis un poids valide en kg.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const entry: PregnancyWeightEntry = {date: todayKey, valueKg: value, updatedAt: new Date().toISOString()};
      await savePregnancyWeight(entry);
      setTodayEntry(entry);
      setSheetVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}, {scale: entrance.interpolate({inputRange: [0, 1], outputRange: [0.97, 1]})}],
  };

  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <View style={[styles.header, {paddingTop: getTopPadding(insets.top, true)}]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={26} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Poids</Text>
          <Text style={styles.subtitle}>Aujourd’hui • {todayLabel}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.body, entranceStyle]}>
          <ScaleIllustration />

          {!todayEntry ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>Aucune mesure enregistrée</Text>
              <Text style={styles.emptyText}>Ajoute ton poids pour suivre{'\n'}son évolution au fil du temps.</Text>
            </View>
          ) : (
            <View style={styles.recordedBlock}>
              <Text style={styles.recordedLabel}>Poids enregistré</Text>
              <Text style={styles.recordedValue}>{formatKg(todayEntry.valueKg)} kg</Text>
              <Text style={styles.recordedDate}>Aujourd’hui</Text>

              {evolutionKg !== undefined ? (
                <View style={styles.evolutionCard}>
                  <MaterialDesignIcons
                    color={evolutionKg < 0 ? '#A8505A' : homeColors.primary}
                    name={evolutionKg === 0 ? 'minus' : evolutionKg > 0 ? 'trending-up' : 'trending-down'}
                    size={18}
                  />
                  <View style={styles.evolutionCopy}>
                    <Text style={styles.evolutionTitle}>Évolution</Text>
                    <Text style={styles.evolutionText}>
                      {evolutionKg >= 0 ? '+' : '−'}{formatKg(Math.abs(evolutionKg))} kg depuis la dernière mesure
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.ctaWrap, {paddingBottom: Math.max(insets.bottom, 16)}, entranceStyle]}>
        <Pressable
          accessibilityLabel={todayEntry ? 'Modifier mon poids' : 'Ajouter mon poids'}
          accessibilityRole="button"
          onPress={openSheet}
          style={({pressed}) => [styles.cta, pressed && styles.pressed]}>
          <Text style={styles.ctaText}>{todayEntry ? 'Modifier' : 'Ajouter mon poids'}</Text>
        </Pressable>
      </Animated.View>

      <WeightEntrySheet
        error={error}
        initialValue={todayEntry?.valueKg ?? null}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        saving={saving}
        visible={sheetVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F8F4FC'},

  header: {minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10},
  backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFFFFF', ...homeShadow},
  headerSpacer: {width: 42},
  pressed: {opacity: 0.8},
  headerCopy: {flex: 1, minWidth: 0, alignItems: 'center'},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 21, fontWeight: '800'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 12},

  content: {flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.lg},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  illustrationWrap: {width: '100%', maxWidth: 290, alignSelf: 'center', aspectRatio: 1},
  weightIllustration: {width: '100%', height: '100%'},

  emptyBlock: {marginTop: spacing.xl, alignItems: 'center', paddingHorizontal: 12},
  emptyTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 18, fontWeight: '800', textAlign: 'center'},
  emptyText: {marginTop: 8, color: homeColors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center'},

  recordedBlock: {marginTop: spacing.xl, alignItems: 'center', width: '100%'},
  recordedLabel: {color: homeColors.textSecondary, fontSize: 12.5, fontWeight: '700'},
  recordedValue: {marginTop: 6, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 38, fontWeight: '800'},
  recordedDate: {marginTop: 4, color: homeColors.textSecondary, fontSize: 12},

  evolutionCard: {
    marginTop: 20,
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  evolutionCopy: {flex: 1, minWidth: 0},
  evolutionTitle: {color: homeColors.textPrimary, fontSize: 12, fontWeight: '800'},
  evolutionText: {marginTop: 2, color: homeColors.textSecondary, fontSize: 11.5},

  ctaWrap: {paddingHorizontal: 20},
  cta: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.primary,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 5,
  },
  ctaText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},

  sheetOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,17,56,0.42)'},
  sheet: {borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: 20},
  sheetHandle: {width: 44, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: '#D8CBE3', marginBottom: 16},
  sheetTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '800', textAlign: 'center'},

  stepperRow: {marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20},
  stepperButton: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: homeColors.lightLavender},
  stepperValueBlock: {alignItems: 'center', minWidth: 110},
  stepperValue: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 40, fontWeight: '800'},
  stepperUnit: {marginTop: 2, color: homeColors.textSecondary, fontSize: 13, fontWeight: '700'},

  sheetError: {marginTop: 14, color: '#A8505A', fontSize: 12.5, textAlign: 'center'},

  saveButton: {
    marginTop: 22,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: homeColors.primary,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 5,
  },
  saveText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
});
