import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';

import {useTranslation} from 'react-i18next';

import type {
  RootStackParamList,
} from '../navigation/AppNavigator';

import {
  spacing,
  getTopPadding,
} from '../theme/spacing';

import {
  getCachedPersonalInformation,
  updatePersonalInformation,
} from '../state/personalInformationStore';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../theme/awaThemeTokens';
import type {AwaRoles} from '../theme/semanticRoles';
import {awaShapes} from '../theme/shapes';
import {awaSpace} from '../theme/spaceScale';
import {AWA_PRIMARY_ACTION_LABEL, AWA_TYPESCALE} from '../theme/typescale';
import {useAwaTokens} from '../theme/useAwaTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaIcon} from '../components/ui/AwaIcon';
import {AwaText} from '../components/ui/AwaText';

// Phase 3 pilot (Material 3 design system): typography roles, shared AwaText / AwaButton / AwaIcon, token shapes and
// semantic roles. Simplified form: one profile icon, eyebrow, heading, one short subtitle, a labelled outlined input
// with its counter, one primary button and one helper line. Unchanged on purpose: the name state, the save / navigate
// logic and its failure path, the native TextInput with its props (maxLength, autoCapitalize, returnKeyType,
// onSubmitEditing …), the animated focus ring, keyboard handling and the empty-name behaviour. The preview card, the
// information card, the shield / edit / valid icons and the arrow in the button are no longer shown (their keys stay).
// Copy: the field label reuses `cardTitle`; the subtitle, placeholder and helper line are the `form*` keys added for
// this form in all 8 locales.
// Layout: the block sits in the upper part of the screen (free space split 1 : 2 above / below), not dead centre. The
// primary button is the documented AwaButton (large, filled, pill) with the shared primary-action label; the screen adds
// only its top margin.

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_NAME_LENGTH = 40;

/**
 * Free vertical space is shared between a spacer above the form and one below it. 1 : 2 puts the whole block (icon,
 * label, heading and subtitle, then the form under them) in the upper part of the screen instead of dead centre, and the
 * spacing inside the block is untouched. With no free space (large font, long translation, keyboard open) both spacers
 * collapse to zero and the content simply starts at the top.
 */
const SPACE_ABOVE_WEIGHT = 1;
const SPACE_BELOW_WEIGHT = 2;

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'NameOnboarding'
  >;

/* ============================================================
   SCREEN
============================================================ */

function NameOnboardingScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(theme, roles), [theme, roles]);

  const [name, setName] = useState(
    () => getCachedPersonalInformation().preferredName,
  );

  const [saving, setSaving] = useState(false);

  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleNext = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await updatePersonalInformation({
        preferredName: name.trim(),
      });

      navigation.navigate('SpiritualPreferences');
    } catch (saveError) {
      // Not persisted: stay here with the typed name (see services/saveFailure.ts).
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  // The resting border is the `outline` role (>= 3:1 on the surface); focus moves it to the primary colour.
  const animatedBorder = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [roles.outline, roles.primary],
  });

  const animatedShadow = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: getTopPadding(insets.top),
                paddingBottom: Math.max(insets.bottom, 16) + spacing.sm,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.spaceAbove} />

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.profileIcon}>
                <AwaIcon colorRole="onPrimaryContainer" decorative name="account-outline" size="md" />
              </View>

              <AwaText
                colorRole="primary"
                emphasized
                style={styles.eyebrow}
                variant="labelSmall">
                {t('onboarding.name.eyebrow')}
              </AwaText>

              <AwaText style={styles.title} variant="headlineMedium" weight="700">
                {t('onboarding.name.title')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                {t('onboarding.name.formSubtitle')}
              </AwaText>
            </View>

            {/* NAME FIELD: no visible label above it (the title and subtitle already say what it is); the input keeps its
                accessible name (accessibilityLabel) for screen readers. */}
            <Animated.View
              style={[
                styles.inputBox,
                {
                  borderColor: animatedBorder,
                  shadowOpacity: animatedShadow,
                },
              ]}>
              <TextInput
                accessibilityLabel={t('onboarding.name.inputLabel')}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={MAX_NAME_LENGTH}
                onBlur={handleBlur}
                onChangeText={setName}
                onFocus={handleFocus}
                onSubmitEditing={handleNext}
                placeholder={t('onboarding.name.formPlaceholder')}
                placeholderTextColor={roles.accessible.onSurfaceVariant}
                returnKeyType="done"
                selectionColor={theme.colors.primary}
                style={styles.input}
                value={name}
              />
            </Animated.View>

            <AwaText colorRole="onSurfaceVariant" style={styles.counter} variant="bodySmall">
              {name.length}/{MAX_NAME_LENGTH}
            </AwaText>

            {/* NEXT */}
            <AwaButton
              disabled={saving}
              fullWidth
              label={saving ? t('onboarding.name.saving') : t('onboarding.name.next')}
              labelStyle={styles.ctaLabel}
              onPress={handleNext}
              size="large"
              style={styles.nextButton}
              variant="filled"
              weight={AWA_PRIMARY_ACTION_LABEL.fontWeight}
            />

            <AwaText
              colorRole="onSurfaceVariant"
              style={styles.footerText}
              variant="bodySmall">
              {t('onboarding.name.formFooter')}
            </AwaText>

            <View style={styles.spaceBelow} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme, roles: AwaRoles) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
    },

    // Not centred: the two spacers below share the free space (see SPACE_ABOVE_WEIGHT / SPACE_BELOW_WEIGHT).
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },

    spaceAbove: {
      flex: SPACE_ABOVE_WEIGHT,
    },

    spaceBelow: {
      flex: SPACE_BELOW_WEIGHT,
    },

    header: {
      alignItems: 'center',
      marginBottom: awaSpace.s32,
    },

    profileIcon: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: awaShapes.full,
      backgroundColor: roles.primaryContainer,
    },

    eyebrow: {
      marginTop: awaSpace.s16,
      letterSpacing: 1.25,
    },

    title: {
      marginTop: awaSpace.s8,
      textAlign: 'center',
    },

    subtitle: {
      maxWidth: 340,
      marginTop: awaSpace.s8,
      textAlign: 'center',
    },

    inputBox: {
      minHeight: 56,
      justifyContent: 'center',
      borderWidth: 1.3,
      borderRadius: awaShapes.large,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: awaSpace.s16,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowRadius: 9,
      elevation: 1,
    },

    input: {
      color: roles.onSurface,
      fontSize: AWA_TYPESCALE.bodyLarge.fontSize,
      // The emphasized body weight (Medium, a face Android really has) instead of a 600 literal that rendered as Medium.
      fontWeight: AWA_TYPESCALE.bodyLarge.fontWeightEmphasized,
      paddingVertical: 0,
    },

    counter: {
      alignSelf: 'flex-end',
      marginTop: awaSpace.s8,
    },

    nextButton: {
      marginTop: awaSpace.s24,
    },

    // Same primary-action label as the Welcome buttons: only size (and, on the button, weight) are overridden.
    ctaLabel: {
      fontSize: AWA_PRIMARY_ACTION_LABEL.fontSize,
    },

    footerText: {
      marginTop: awaSpace.s16,
      textAlign: 'center',
    },
  });
}

export default NameOnboardingScreen;
