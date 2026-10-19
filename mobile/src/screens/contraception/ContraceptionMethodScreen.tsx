import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type ContraceptionMethod,
} from '../../state/contraceptionPreferences';
import {contraceptionMethodLabels} from '../../config/contraceptionLabels';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionMethod'>;

type MethodOption = {
  id: ContraceptionMethod;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  description: string;
};

function ContraceptionMethodScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const methodLabels = contraceptionMethodLabels(t);
  const options: MethodOption[] = [
    {
      id: 'pill',
      icon: 'pill',
      label: methodLabels.pill,
      description: t('contraceptionMethod.options.pillDescription'),
    },
    {
      id: 'ring',
      icon: 'circle-outline',
      label: methodLabels.ring,
      description: t('contraceptionMethod.options.ringDescription'),
    },
    {
      id: 'patch',
      icon: 'bandage',
      label: methodLabels.patch,
      description: t('contraceptionMethod.options.patchDescription'),
    },
    {
      id: 'other',
      icon: 'needle',
      label: methodLabels.other,
      description: t('contraceptionMethod.options.otherDescription'),
    },
  ];

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
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              icon="arrow-left"
              style={styles.backButton}
            />
          ) : null}

          <View style={styles.header}>
            <AwaText variant="headlineSmall" style={styles.title}>{t('contraceptionMethod.title')}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
              {t('contraceptionMethod.subtitle')}
            </AwaText>
          </View>

          <View style={styles.list}>
            {options.map(option => {
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
                      color={selected ? theme.colors.primary : theme.colors.textMuted}
                      name={option.icon}
                      size={20}
                    />
                  </View>

                  <View style={styles.cardCopy}>
                    <AwaText variant="titleSmall">{option.label}</AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardDescription}>{option.description}</AwaText>
                  </View>

                  {selected ? (
                    <View style={styles.selectedCheck}>
                      <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <AwaButton
            accessibilityRole="button"
            accessibilityState={{disabled: !method}}
            disabled={!method || saving}
            onPress={handleNext}
            label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('common.continue')}
            size="large"
            style={styles.nextButton}
          />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    backButton: {marginBottom: 5},

    header: {alignItems: 'center', marginBottom: 18},

    title: {textAlign: 'center'},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    list: {gap: 10},
    card: {
      padding: 16, flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.12), borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.surface, 0.88),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.045, shadowRadius: 10, elevation: 1,
    },
    cardSelected: {
      borderWidth: 1.5, borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primarySoft, 0.98),
      shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3,
    },
    radio: {
      width: 21, height: 21, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.8, borderColor: withAlpha(theme.colors.primary, 0.35), borderRadius: 11, backgroundColor: theme.colors.surface,
    },
    radioSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary},
    iconBox: {
      width: 40, height: 40, flexShrink: 0, marginHorizontal: 10, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    iconBoxSelected: {borderColor: theme.colors.border, backgroundColor: theme.colors.primarySoft},
    cardCopy: {flex: 1, minWidth: 0, paddingTop: 1},
    cardDescription: {marginTop: 3},
    selectedCheck: {
      width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      marginLeft: 7, borderRadius: 12, backgroundColor: theme.colors.primary,
    },

    nextButton: {marginTop: 20},
  });
}

export default ContraceptionMethodScreen;
