import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {homeColors} from '../../components/home/homeTheme';
import {getTopPadding, spacing} from '../../theme/spacing';
import {getPregnancyJournalState, savePregnancyWeight, type PregnancyWeightEntry} from '../../state/pregnancyJournalStore';
import {JournalSaveToast, useJournalSaveToast} from '../../components/journal/JournalSaveToast';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialValue ? formatKg(initialValue) : '');

  useEffect(() => {
    if (visible) {
      setDraft(initialValue ? formatKg(initialValue) : '');
    }
  }, [visible, initialValue]);

  const normalizedDraft = draft.replace(',', '.').trim();
  const numericValue = Number(normalizedDraft);
  const isValid =
    normalizedDraft.length > 0 &&
    Number.isFinite(numericValue) &&
    numericValue >= 30 &&
    numericValue <= 300;

  const handleChange = (value: string) => {
    const sanitized = value
      .replace(/[^\d.,]/g, '')
      .replace(/([.,].*)[.,]/g, '$1');

    const parts = sanitized.split(/[.,]/);

    if (parts.length > 1) {
      const decimalSeparator = sanitized.includes(',') ? ',' : '.';
      setDraft(`${parts[0].slice(0, 3)}${decimalSeparator}${parts[1].slice(0, 1)}`);
      return;
    }

    setDraft(sanitized.slice(0, 3));
  };

  const handleSubmit = () => {
    if (!isValid || saving) {
      return;
    }

    onSave(Math.round(numericValue * 10) / 10);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetOverlay}>
        <Pressable
          accessibilityLabel="Fermer"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.sheet,
            {paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="scale-bathroom"
                size={21}
              />
            </View>

            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>
                {initialValue ? 'Modifier ton poids' : 'Ajouter ton poids'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                Saisis directement la mesure du jour
              </Text>
            </View>
          </View>

          <View style={styles.weightInputCard}>
            <Text style={styles.weightInputLabel}>Poids actuel</Text>

            <View
              style={[
                styles.weightInputRow,
                draft.length > 0 && styles.weightInputRowActive,
              ]}>
              <TextInput
                accessibilityLabel="Poids en kilogrammes"
                autoFocus
                keyboardType="decimal-pad"
                maxLength={5}
                onChangeText={handleChange}
                onSubmitEditing={handleSubmit}
                placeholder="Ex. 64,5"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="done"
                selectTextOnFocus
                style={styles.weightInput}
                value={draft}
              />

              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>kg</Text>
              </View>
            </View>

            <View style={styles.inputSupportRow}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="information-outline"
                size={14}
              />
              <Text style={styles.inputSupportText}>
                Entre une valeur entre 30 et 300 kg.
              </Text>
            </View>
          </View>

          {initialValue ? (
            <View style={styles.previousValueCard}>
              <View style={styles.previousValueIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="history"
                  size={17}
                />
              </View>
              <View style={styles.previousValueCopy}>
                <Text style={styles.previousValueLabel}>
                  Valeur enregistrée aujourd’hui
                </Text>
                <Text style={styles.previousValueText}>
                  {formatKg(initialValue)} kg
                </Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons
                color={theme.colors.danger}
                name="alert-circle-outline"
                size={16}
              />
              <Text style={styles.sheetError}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel="Enregistrer le poids"
            accessibilityRole="button"
            accessibilityState={{disabled: saving || !isValid}}
            disabled={saving || !isValid}
            onPress={handleSubmit}
            style={({pressed}) => [
              styles.saveButton,
              (!isValid || saving) && styles.saveButtonDisabled,
              pressed && isValid && !saving && styles.saveButtonPressed,
            ]}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name={saving ? 'loading' : 'check-circle-outline'}
              size={19}
            />
            <Text style={styles.saveText}>
              {saving ? 'Enregistrement…' : 'Enregistrer ce poids'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PregnancyWeightScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 370 || height < 720;
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

  const saveToast = useJournalSaveToast();

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
      saveToast.show('Poids enregistré', 'Ton suivi de poids a bien été mis à jour.');
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
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <View style={[styles.header, {paddingTop: getTopPadding(insets.top, true)}]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={26} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Poids</Text>
          <Text style={styles.subtitle}>Aujourd’hui • {todayLabel}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg},
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.body, entranceStyle]}>
          <ScaleIllustration />

          <View style={styles.sectionBadge}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="calendar-today-outline"
              size={13}
            />
            <Text style={styles.sectionBadgeText}>MESURE DU JOUR</Text>
          </View>

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
                  {/* Weight-trend indicator: colors this icon by the sign of
                      the day-over-day change (loss vs. gain/steady). Frozen
                      as a fixed, non-theme-reactive medical-semantic color
                      per the theme-migration classification rules — never
                      substitute theme tokens here. */}
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

      <JournalSaveToast
        animation={saveToast.animation}
        bottom={Math.max(insets.bottom, 18) + 12}
        message={saveToast.message}
        onDismiss={saveToast.hide}
        title={saveToast.title}
        visible={saveToast.visible}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},

    header: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.08),
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.06,
      shadowRadius: 7,
      elevation: 2,
    },
    headerSpacer: {width: 40},
    pressed: {opacity: 0.78},
    headerCopy: {flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 6},
    title: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 14,
      textAlign: 'center',
    },

    content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 10},
    contentCompact: {paddingHorizontal: 14, paddingTop: 6},
    body: {flex: 1, alignItems: 'center', justifyContent: 'center'},

    illustrationWrap: {
      width: '100%',
      maxWidth: 250,
      alignSelf: 'center',
      aspectRatio: 1,
    },
    weightIllustration: {width: '100%', height: '100%'},

    sectionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    sectionBadgeText: {
      color: theme.colors.primary,
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    emptyBlock: {
      width: '100%',
      maxWidth: 330,
      alignItems: 'center',
      marginTop: 15,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.08),
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.84),
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    emptyTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },

    recordedBlock: {
      width: '100%',
      maxWidth: 330,
      alignItems: 'center',
      marginTop: 14,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.surface, 0.90),
      paddingHorizontal: 16,
      paddingVertical: 15,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 1,
    },
    recordedLabel: {
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 13,
      fontWeight: '700',
    },
    recordedValue: {
      marginTop: 4,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 34,
      lineHeight: 39,
      fontWeight: '800',
    },
    recordedDate: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 10},

    evolutionCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 14,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.07),
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    evolutionCopy: {flex: 1, minWidth: 0},
    evolutionTitle: {color: theme.colors.accent, fontSize: 10.5, fontWeight: '800'},
    evolutionText: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      lineHeight: 13,
      flexShrink: 1,
    },

    ctaWrap: {paddingHorizontal: 18},
    cta: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.20,
      shadowRadius: 9,
      elevation: 5,
    },
    ctaText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},

    // Modal scrim — a fixed dim backdrop, not a themeable surface (see
    // classification rule E: backdrops/scrims stay fixed).
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(28,17,56,0.40)',
    },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: theme.colors.surface,
      paddingTop: 10,
      paddingHorizontal: 18,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: -5},
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 10,
    },
    sheetHandle: {
      width: 42,
      height: 4,
      alignSelf: 'center',
      marginBottom: 14,
      borderRadius: 2,
      backgroundColor: withAlpha(theme.colors.primary, 0.25),
    },
    sheetHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 15},
    sheetIcon: {
      width: 42,
      height: 42,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    sheetHeaderCopy: {flex: 1, minWidth: 0},
    sheetTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '800',
    },
    sheetSubtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 10,
      lineHeight: 14,
    },

    weightInputCard: {
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceSecondary,
      padding: 13,
    },
    weightInputLabel: {
      color: theme.colors.accent,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: '800',
    },
    weightInputRow: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      borderWidth: 1.2,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 17,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
    },
    weightInputRowActive: {
      borderColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 1,
    },
    weightInput: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 0,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
      textAlign: 'left',
    },
    unitBadge: {
      minWidth: 44,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    unitBadgeText: {color: theme.colors.primary, fontSize: 12, fontWeight: '800'},
    inputSupportRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8},
    inputSupportText: {
      flex: 1,
      minWidth: 0,
      color: theme.colors.textSecondary,
      fontSize: 9,
      lineHeight: 12.5,
    },

    previousValueCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    previousValueIcon: {
      width: 30,
      height: 30,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },
    previousValueCopy: {flex: 1, minWidth: 0},
    previousValueLabel: {color: theme.colors.textSecondary, fontSize: 8.8, lineHeight: 12},
    previousValueText: {
      marginTop: 1,
      color: theme.colors.accent,
      fontSize: 11.5,
      fontWeight: '800',
    },

    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    sheetError: {
      flex: 1,
      minWidth: 0,
      color: theme.colors.danger,
      fontSize: 10.5,
      lineHeight: 14,
    },

    saveButton: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 14,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.20,
      shadowRadius: 9,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: withAlpha(theme.colors.primary, 0.45),
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonPressed: {opacity: 0.88, transform: [{scale: 0.99}]},
    saveText: {color: onPrimaryTextColor(theme), fontSize: 14.5, fontWeight: '700'},
  });
}