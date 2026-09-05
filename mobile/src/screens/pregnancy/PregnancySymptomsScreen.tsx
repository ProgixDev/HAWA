import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getTopPadding, spacing} from '../../theme/spacing';
import {getPregnancyJournalState, savePregnancySymptoms} from '../../state/pregnancyJournalStore';
import {JournalSaveToast, useJournalSaveToast} from '../../components/journal/JournalSaveToast';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// Pregnancy's "Symptômes ressentis" — visually rebuilt to match Cycle's own
// JournalSymptomsScreen.tsx (src/screens/journal/JournalSymptomsScreen.tsx)
// AS CLOSELY AS POSSIBLE: same header shape (round back + centered serif
// title + round purple save button), hero banner, symptom row-list card
// (icon container + label/helper text + selection indicator), full-width
// purple save button. Cycle's own "Intensité"/"Localisation" sections are
// NOT reproduced here — Pregnancy's data model (PregnancySymptomEntry) has
// no severity/location fields, and this task must not add new tracking
// categories; only the note field Pregnancy already had is kept.
//
// SAME UI, DIFFERENT DATA: the symptom catalogue below is the project's
// existing Pregnancy-specific list (unchanged from before this redesign) —
// Cycle's own menstrual symptom catalogue is never referenced. Selections
// persist via savePregnancySymptoms/getPregnancyJournalState
// (pregnancyJournalStore.ts) only — never Cycle's dailyJournalStore or
// Postpartum's postpartumJournalStore.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const SYMPTOMS = ['Nausées', 'Fatigue', 'Sensibilité des seins', 'Ballonnements', 'Maux de tête', 'Reflux / brûlures d’estomac', 'Douleurs lombaires', 'Constipation', 'Crampes légères', 'Essoufflement', 'Gonflement', 'Vertiges', 'Troubles du sommeil'];

// Icons cross-checked against MaterialDesignIcons names already confirmed
// valid elsewhere in this exact codebase (several reused verbatim from
// Cycle's own JournalSymptomsScreen.tsx) to avoid an icon-name risk.
const SYMPTOM_ICONS: Record<string, IconName> = {
  'Nausées': 'emoticon-sick-outline',
  'Fatigue': 'sleep',
  'Sensibilité des seins': 'human-female',
  'Ballonnements': 'weather-windy',
  'Maux de tête': 'head-alert-outline',
  'Reflux / brûlures d’estomac': 'alert-circle-outline',
  'Douleurs lombaires': 'human-handsdown',
  'Constipation': 'stomach',
  'Crampes légères': 'lightning-bolt',
  'Essoufflement': 'walk',
  'Gonflement': 'water',
  'Vertiges': 'sync',
  'Troubles du sommeil': 'weather-night',
};

const HERO_IMAGE = require('../../assets/images/symptoms-header-woman.png');

export default function PregnancySymptomsScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
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
        duration: reduce ? 0 : 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {active = false;};
  }, [entrance]);

  // Restores today's already-saved Pregnancy symptoms/note, if any — the
  // screen previously never did this and always opened empty.
  useEffect(() => {
    let active = true;
    getPregnancyJournalState().then(state => {
      if (!active) {return;}
      const entry = state.symptoms.find(item => item.date === todayKey);
      if (entry) {
        setSelected(entry.symptoms);
        setNote(entry.note ?? '');
      }
    });
    return () => {active = false;};
  }, [todayKey]);

  const toggle = (value: string) => {
    setSelected(current => (current.includes(value) ? current.filter(item => item !== value) : [...current, value]));
  };

  const save = async () => {
    setError('');
    if (selected.length === 0) {setError('Sélectionne au moins un symptôme.'); return;}
    setSaving(true);
    try {
      await savePregnancySymptoms({
        date: todayKey,
        symptoms: selected,
        note: note.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      saveToast.show('Symptômes enregistrés', 'Ton suivi de grossesse a bien été mis à jour.', navigation.goBack);
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={[styles.topBar, {paddingTop: getTopPadding(insets.top, true)}]}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.roundButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
          </Pressable>

          <Text style={styles.pageTitle}>Symptômes ressentis</Text>

          <Pressable
            accessibilityLabel="Enregistrer les symptômes"
            accessibilityRole="button"
            accessibilityState={{disabled: saving}}
            disabled={saving}
            hitSlop={10}
            onPress={save}
            style={({pressed}) => [styles.roundButton, styles.checkButton, (pressed || saving) && styles.pressed]}>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'check'} size={22} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={entranceStyle}>
            <ImageBackground imageStyle={styles.heroImage} resizeMode="cover" source={HERO_IMAGE} style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Écoute ton corps</Text>
                <Text style={styles.heroSubtitle}>Note tes ressentis physiques{'\n'}aujourd’hui.</Text>
              </View>
            </ImageBackground>

            <View style={styles.card}>
              <View style={styles.symptomsHeader}>
                <View style={styles.headingIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clipboard-pulse-outline" size={18} />
                </View>
                <View style={styles.headingCopy}>
                  <Text style={styles.sectionTitle}>Symptômes ressentis</Text>
                  <Text style={styles.sectionSubtitle}>Sélectionne tous les symptômes que tu ressens aujourd’hui.</Text>
                </View>
                <View style={styles.countBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="check-circle-outline" size={14} />
                  <Text style={styles.countBadgeText}>{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.symptomsList}>
                {SYMPTOMS.map(item => {
                  const active = selected.includes(item);
                  return (
                    <Pressable
                      accessibilityLabel={item}
                      accessibilityRole="checkbox"
                      accessibilityState={{checked: active}}
                      key={item}
                      onPress={() => toggle(item)}
                      style={({pressed}) => [styles.symptomRow, active && styles.symptomRowActive, pressed && styles.pressedRow]}>
                      <View style={[styles.symptomIconContainer, active && styles.symptomIconContainerActive]}>
                        <MaterialDesignIcons color={active ? onPrimaryTextColor(theme) : theme.colors.primary} name={SYMPTOM_ICONS[item]} size={20} />
                      </View>
                      <View style={styles.symptomCopy}>
                        <Text style={[styles.symptomText, active && styles.symptomTextActive]}>{item}</Text>
                        <Text style={[styles.symptomHelperText, active && styles.symptomHelperTextActive]}>
                          {active ? 'Ajouté à ton journal' : 'Appuie pour sélectionner'}
                        </Text>
                      </View>
                      <View style={[styles.selectionIndicator, active && styles.selectionIndicatorActive]}>
                        <MaterialDesignIcons color={active ? onPrimaryTextColor(theme) : theme.colors.textMuted} name={active ? 'check' : 'plus'} size={14} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitleStandalone}>
                Notes supplémentaires <Text style={styles.optional}>(optionnel)</Text>
              </Text>
              <Text style={styles.sectionSubtitle}>Ajoute une observation si tu le souhaites.</Text>
              <View style={styles.noteBox}>
                <TextInput
                  accessibilityLabel="Notes supplémentaires"
                  maxLength={300}
                  multiline
                  onChangeText={setNote}
                  placeholder="Écris ici..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.noteInput}
                  textAlignVertical="top"
                  value={note}
                />
                <Text style={styles.counter}>{note.length} / 300</Text>
              </View>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityLabel="Enregistrer mes symptômes"
              accessibilityRole="button"
              accessibilityState={{disabled: saving}}
              disabled={saving}
              onPress={save}
              style={({pressed}) => [styles.saveButton, (pressed || saving) && styles.pressedRow]}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'content-save-outline'} size={20} />
              <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    flex: {flex: 1},

    topBar: {minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8},
    roundButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 18, backgroundColor: theme.colors.surface},
    checkButton: {borderWidth: 0, backgroundColor: theme.colors.primary, elevation: 2},
    pressed: {opacity: 0.75, transform: [{scale: 0.95}]},
    pageTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '700'},

    content: {paddingHorizontal: 11, paddingBottom: 34, gap: 8},

    hero: {height: 115, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 20, backgroundColor: theme.colors.surface},
    heroImage: {borderRadius: 20},
    heroCopy: {width: '58%', paddingLeft: 28},
    heroTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
    heroSubtitle: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    card: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      padding: 12,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04,
      shadowRadius: 7,
      elevation: 1,
    },

    symptomsHeader: {marginBottom: 12},
    headingIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
    headingCopy: {marginTop: 9},
    sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 15.5, fontWeight: '700'},
    sectionTitleStandalone: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 14, fontWeight: '700'},
    sectionSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 14},
    optional: {fontFamily: undefined, fontSize: 9.5, fontWeight: '400'},

    countBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    countBadgeText: {color: theme.colors.accent, fontSize: 10.5, fontWeight: '700'},

    symptomsList: {gap: 8},
    symptomRow: {
      width: '100%',
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 11,
      paddingVertical: 10,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.035,
      shadowRadius: 5,
      elevation: 1,
    },
    symptomRowActive: {borderColor: withAlpha(theme.colors.primary, 0.35), backgroundColor: theme.colors.primarySoft, shadowColor: theme.shadow.shadowColor, shadowOpacity: 0.1, shadowRadius: 7, elevation: 2},
    pressedRow: {opacity: 0.82, transform: [{scale: 0.992}]},
    symptomIconContainer: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
    symptomIconContainerActive: {backgroundColor: theme.colors.primary},
    symptomCopy: {flex: 1, minWidth: 0, marginHorizontal: 11},
    symptomText: {color: theme.colors.text, fontSize: 12.5, lineHeight: 17, fontWeight: '700', flexShrink: 1},
    symptomTextActive: {color: theme.colors.accent, fontWeight: '800'},
    symptomHelperText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 13},
    symptomHelperTextActive: {color: theme.colors.primary, fontWeight: '600'},
    selectionIndicator: {width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 14, backgroundColor: theme.colors.surface},
    selectionIndicatorActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},

    noteBox: {minHeight: 120, marginTop: 8, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 13, backgroundColor: theme.colors.surface},
    noteInput: {flex: 1, padding: 10, paddingBottom: 20, color: theme.colors.text, fontSize: 10.5},
    counter: {position: 'absolute', right: 8, bottom: 6, color: theme.colors.textMuted, fontSize: 8.5},

    error: {marginTop: 10, color: theme.colors.danger, fontSize: 12.5, textAlign: 'center'},

    saveButton: {
      width: '88%',
      maxWidth: 360,
      minHeight: 54,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.22,
      shadowRadius: 9,
      elevation: 5,
    },
    saveText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
  });
}
