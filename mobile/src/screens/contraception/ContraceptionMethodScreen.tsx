import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type ContraceptionMethod,
} from '../../state/contraceptionPreferences';
import {CONTRACEPTION_METHOD_LABELS} from '../../config/contraceptionLabels';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionMethod'>;

type MethodOption = {
  id: ContraceptionMethod;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  description: string;
};

const OPTIONS: MethodOption[] = [
  {
    id: 'pill',
    icon: 'pill',
    label: CONTRACEPTION_METHOD_LABELS.pill,
    description: 'Suivi quotidien de la prise',
  },
  {
    id: 'ring',
    icon: 'circle-outline',
    label: CONTRACEPTION_METHOD_LABELS.ring,
    description: 'Rappel d’insertion et retrait',
  },
  {
    id: 'patch',
    icon: 'bandage',
    label: CONTRACEPTION_METHOD_LABELS.patch,
    description: 'Changement de patch',
  },
  {
    id: 'other',
    icon: 'needle',
    label: CONTRACEPTION_METHOD_LABELS.other,
    description: 'Autre méthode hormonale',
  },
];

function ContraceptionMethodScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  const [method, setMethod] = useState<ContraceptionMethod | null>(
    () => getContraceptionPreferences().method,
  );
  // The method as it was BEFORE this screen, so handleNext can tell
  // "genuinely switched methods" apart from "just re-confirmed the same
  // one." Corrected by the same hydration effect as `method` below (via the
  // same `current ?? value.method` guard, so a value already captured here
  // is never overwritten) — without that, a screen mounted before the
  // preferences store finishes its first AsyncStorage read would freeze
  // this at `null` forever, making a same-method re-confirmation look like
  // a switch and wrongly wipe methodStartDate/hasTreatmentBreak.
  const [initialMethod, setInitialMethod] = useState<ContraceptionMethod | null>(
    () => getContraceptionPreferences().method,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // hydrateContraceptionPreferences() is memoized app-wide (App.tsx already
    // calls it once at boot) — its resolved value is a frozen snapshot from
    // whenever that FIRST call settled, not a fresh read. Only use it to fill
    // in a value that's still unset; never let it overwrite a method she's
    // already picked on this very screen.
    hydrateContraceptionPreferences().then(value => {
      setMethod(current => current ?? value.method);
      setInitialMethod(current => current ?? value.method);
    });
  }, []);

  const handleNext = async () => {
    if (!method || saving) {return;}
    setSaving(true);
    try {
      if (isEdit && method !== initialMethod) {
        // A genuine method switch — the previous methodStartDate/
        // hasTreatmentBreak/pill-schedule belonged to the OLD method and
        // would silently misrepresent the new one if kept, so they're
        // cleared here and methodStartDate/hasTreatmentBreak re-collected on
        // ContraceptionInformationScreen (replacing this screen in the
        // stack, not pushing on top of it, so that screen's own
        // "Enregistrer" -> goBack() correctly returns to wherever this one
        // was opened from — that screen's own handleNext further routes a
        // pill user on to PillScheduleScreen). Historical intake/event
        // records for the old method are untouched — only these onboarding-
        // style answers are reset.
        await setContraceptionPreferences({
          method,
          methodStartDate: null,
          hasTreatmentBreak: null,
          pillScheduleType: null,
          activeDays: null,
          breakDays: null,
        });
        navigation.replace('ContraceptionInformation', {mode: 'edit'});
        return;
      }
      await setContraceptionPreferences({method});
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('ContraceptionInformation');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={PURPLE} name="arrow-left" size={24} />
            </Pressable>
          ) : null}

          <View style={styles.header}>
            <View style={styles.heroIcon}>
              <View pointerEvents="none" style={styles.heroGlowOuter} />
              <View pointerEvents="none" style={styles.heroGlowInner} />
              <LinearGradient
                colors={['#FFFFFF', '#F6F1FB']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.heroInner}>
                <MaterialDesignIcons color={PURPLE} name="pill" size={34} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Quelle contraception utilises-tu ?</Text>
            <Text style={styles.subtitle}>
              Choisis la méthode qui correspond le mieux à ton suivi actuel.
            </Text>
          </View>

          <View style={styles.list}>
            {OPTIONS.map(option => {
              const selected = option.id === method;
              return (
                <Pressable
                  key={option.id}
                  accessibilityLabel={`${option.label}, ${option.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => setMethod(option.id)}
                  style={({pressed}) => [
                    styles.card,
                    selected && styles.cardSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>

                  <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                    <MaterialDesignIcons
                      color={selected ? PURPLE : '#806AAE'}
                      name={option.icon}
                      size={20}
                    />
                  </View>

                  <View style={styles.cardCopy}>
                    <Text style={styles.cardLabel}>{option.label}</Text>
                    <Text style={styles.cardDescription}>{option.description}</Text>
                  </View>

                  {selected ? (
                    <View style={styles.selectedCheck}>
                      <MaterialDesignIcons color="#FFFFFF" name="check" size={14} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !method}}
            disabled={!method || saving}
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              (!method || saving) && styles.nextButtonDisabled,
              pressed && method && styles.pressed,
            ]}>
            <Text style={styles.nextText}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Continuer'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},

  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
  pressed: {opacity: 0.82},

  backButton: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    marginBottom: 5, borderWidth: 1, borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#493276', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  header: {alignItems: 'center', marginBottom: 18},
  heroIcon: {
    position: 'relative', width: 76, height: 76,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroGlowOuter: {position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(105,73,190,0.055)'},
  heroGlowInner: {position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(105,73,190,0.07)'},
  heroInner: {
    width: 58, height: 58, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(105,73,190,0.14)', borderRadius: 20,
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },

  title: {
    color: PURPLE_DARK, fontFamily: 'serif', fontSize: 25, lineHeight: 31,
    fontWeight: '800', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320, marginTop: 8, color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, textAlign: 'center',
  },

  list: {gap: 10},
  card: {
    padding: 13, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(111,83,190,0.12)', borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.045, shadowRadius: 10, elevation: 1,
  },
  cardSelected: {
    borderWidth: 1.5, borderColor: '#8D72C6', backgroundColor: 'rgba(248,245,253,0.98)',
    shadowColor: '#6949BE', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3,
  },
  radio: {
    width: 21, height: 21, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.8, borderColor: '#B7A8CC', borderRadius: 11, backgroundColor: '#FFFFFF',
  },
  radioSelected: {borderColor: PURPLE, backgroundColor: '#F5F0FD'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: PURPLE},
  iconBox: {
    width: 40, height: 40, marginHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(105,73,190,0.08)', borderRadius: 13, backgroundColor: '#F2ECFA',
  },
  iconBoxSelected: {borderColor: 'rgba(105,73,190,0.14)', backgroundColor: '#EDE4FC'},
  cardCopy: {flex: 1, minWidth: 0, paddingTop: 1},
  cardLabel: {color: '#291D4E', fontSize: 14, lineHeight: 19, fontWeight: '800'},
  cardDescription: {marginTop: 3, color: '#7A6F91', fontSize: 11, lineHeight: 15},
  selectedCheck: {
    width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    marginLeft: 7, borderRadius: 12, backgroundColor: PURPLE,
  },

  nextButton: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20, borderRadius: 20, backgroundColor: PURPLE,
    shadowColor: '#4E319A', shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  nextButtonDisabled: {backgroundColor: '#C5B9D8', elevation: 0, shadowOpacity: 0},
  nextText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2},
});

export default ContraceptionMethodScreen;
