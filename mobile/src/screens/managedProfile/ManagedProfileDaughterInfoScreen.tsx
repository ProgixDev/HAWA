import React, {useMemo, useState} from 'react';
import {Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import BirthDatePickerModal from '../../components/onboarding/BirthDatePickerModal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {formatAgeInYears} from '../../utils/age';
import {getManagedProfileDraft, updateManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH} from '../../state/managedProfilesStore';

// Step 1/4 — "Informations sur votre fille" (reached right after the intro screen,
// ManagedProfileType). Reads/writes the same in-memory draft
// as every other step in the flow, so going back to this screen from a later one
// shows exactly what was already typed.
//
// Photo: same choosePhoto()/action-sheet pattern as the mother's own avatar picker
// (ProfileScreen.tsx / PersonalInformationScreen.tsx) — reuses the already-installed
// `react-native-image-picker` (no new dependency). The photo is entirely optional and
// stays local to the device (see managedProfilesStore.ts's privacy note): before a
// custom photo is chosen, `fille.png` is shown as the default daughter illustration.

const DAUGHTER_ILLUSTRATION = require('../../assets/images/fille.png');

type Props = NativeStackScreenProps<RootStackParamList, 'ManagedProfileDaughterInfo'>;
type PhotoSource = 'camera' | 'gallery';

const DEFAULT_BIRTH_DATE = (() => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  return tenYearsAgo;
})();

export default function ManagedProfileDaughterInfoScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const draft = getManagedProfileDraft();
  const [firstName, setFirstName] = useState(draft.firstName);
  const [birthDate, setBirthDate] = useState<Date | null>(draft.birthDate);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(draft.profileImageUri);
  const [focused, setFocused] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  const trimmedFirstName = firstName.trim();
  // A photo is optional — only the real required fields gate "Continuer".
  const canContinue = trimmedFirstName.length > 0 && birthDate !== null;

  const onContinue = () => {
    if (!canContinue || birthDate === null) {return;}
    updateManagedProfileDraft({firstName: trimmedFirstName, birthDate, profileImageUri});
    navigation.navigate('ManagedProfileFirstPeriod');
  };

  // Mirrors ProfileScreen.tsx's own choosePhoto(): same permission handling (the
  // library requests it), same didCancel/errorCode/exception handling, so a denied
  // permission, a cancelled picker or a camera error can never crash this screen.
  const choosePhoto = async (source: PhotoSource) => {
    try {
      const result =
        source === 'camera'
          ? await launchCamera({mediaType: 'photo', quality: 0.8})
          : await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
      if (result.didCancel) {return;}
      if (result.errorCode) {
        Alert.alert('Photo de profil', 'Impossible d’accéder à la caméra ou à la galerie pour le moment.');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) {setProfileImageUri(uri);}
    } catch {
      Alert.alert('Photo de profil', 'Une erreur est survenue. Réessaie.');
    } finally {
      setPhotoSheetVisible(false);
    }
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel="Continuer"
      description="Ces informations nous aident à personnaliser son espace."
      onBack={navigation.goBack}
      onContinue={canContinue ? onContinue : undefined}
      title="Informations sur votre fille">
      <Reveal index={0}>
        <View style={styles.avatarZone}>
          <Pressable
            accessibilityLabel="Modifier la photo du profil"
            accessibilityRole="button"
            onPress={() => setPhotoSheetVisible(true)}
            style={({pressed}) => [styles.avatarWrap, pressed && styles.pressed]}>
            {profileImageUri ? (
              // A real chosen photo — cropped to fill the circle, like any profile photo.
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{uri: profileImageUri}}
                style={styles.daughterAvatarImage}
              />
            ) : (
              // Default illustration — never cropped/stretched, transparency preserved.
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={DAUGHTER_ILLUSTRATION}
                style={styles.daughterAvatarImage}
              />
            )}

            <View style={styles.cameraBadge}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="camera-outline" size={14} />
            </View>
          </Pressable>
        </View>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.fieldCard}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            accessibilityLabel="Prénom de votre fille"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            maxLength={MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH}
            onBlur={() => setFocused(false)}
            onChangeText={setFirstName}
            onFocus={() => setFocused(true)}
            placeholder="Ex : Lina"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="done"
            selectionColor={theme.colors.primary}
            style={[styles.input, focused && styles.inputFocused]}
            textContentType="givenName"
            value={firstName}
          />
        </View>
      </Reveal>

      <Reveal index={2}>
        <Pressable
          accessibilityLabel="Date de naissance"
          accessibilityRole="button"
          onPress={() => setDatePickerVisible(true)}
          style={({pressed}) => [styles.fieldCard, pressed && styles.pressed]}>
          <Text style={styles.label}>Date de naissance</Text>
          <View style={styles.dateRow}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={18} />
            <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
              {birthDate
                ? new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'}).format(birthDate)
                : 'Sélectionner une date'}
            </Text>
          </View>
        </Pressable>
      </Reveal>

      {birthDate ? (
        <Reveal index={3}>
          <View style={styles.ageCard}>
            <MaterialDesignIcons color={theme.colors.primary} name="cake-variant-outline" size={18} />
            <Text style={styles.ageText}>Âge : {formatAgeInYears(birthDate)}</Text>
          </View>
        </Reveal>
      ) : null}

      <BirthDatePickerModal
        maximumDate={new Date()}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setBirthDate}
        title="Date de naissance"
        value={birthDate ?? DEFAULT_BIRTH_DATE}
        visible={datePickerVisible}
      />

      {/* Photo-source sheet — same shell/actions/"Annuler" convention as
          PersonalInformationScreen.tsx's own "Photo de profil" sheet. */}
      <Modal
        animationType="slide"
        onRequestClose={() => setPhotoSheetVisible(false)}
        statusBarTranslucent
        transparent
        visible={photoSheetVisible}>
        <View style={styles.sheetRoot}>
          <Pressable
            accessibilityLabel="Fermer"
            onPress={() => setPhotoSheetVisible(false)}
            style={styles.sheetBackdrop}
          />
          <View style={[styles.photoSheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Photo de profil</Text>
            <Text style={styles.sheetSubtitle}>Choisissez une photo pour son profil.</Text>

            <Pressable
              accessibilityLabel="Prendre une photo"
              accessibilityRole="button"
              onPress={() => choosePhoto('camera')}
              style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="camera-outline" size={22} />
              <Text style={styles.sheetActionText}>Prendre une photo</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Choisir dans la galerie"
              accessibilityRole="button"
              onPress={() => choosePhoto('gallery')}
              style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="image-outline" size={22} />
              <Text style={styles.sheetActionText}>Choisir dans la galerie</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              onPress={() => setPhotoSheetVisible(false)}
              style={({pressed}) => [styles.sheetCancel, pressed && styles.pressed]}>
              <Text style={styles.sheetCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    avatarZone: {alignItems: 'center', marginBottom: 4},
    // Circular avatar — the Image itself carries the radius (rather than
    // overflow:'hidden' on the wrapper), so the camera badge below, an absolutely
    // positioned SIBLING, never gets clipped by that same radius.
    avatarWrap: {width: 96, height: 96},
    daughterAvatarImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.18),
    },
    cameraBadge: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.background,
      borderRadius: 15,
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: theme.shadow.shadowColor,
      shadowOpacity: 0.15,
      shadowRadius: 3,
      shadowOffset: {width: 0, height: 2},
    },
    fieldCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 16,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    label: {marginBottom: 8, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    input: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
      color: theme.colors.text,
      fontSize: 15,
    },
    inputFocused: {borderColor: theme.colors.primary},
    dateRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    dateText: {color: theme.colors.text, fontSize: 15, fontWeight: '600'},
    datePlaceholder: {color: theme.colors.textMuted, fontWeight: '400'},
    ageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    ageText: {color: theme.colors.primary, fontSize: 13.5, fontWeight: '700'},
    pressed: {opacity: 0.86},

    // Photo-source sheet — same measurements as PersonalInformationScreen.tsx's
    // own avatar sheet (modalRoot/backdrop/sheet/handle/sheetTitle/sheetAction/cancel).
    sheetRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    sheetBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    photoSheet: {
      maxHeight: '86%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    sheetHandle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, color: theme.colors.accent, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    sheetSubtitle: {marginTop: 6, marginBottom: 14, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: withAlpha(theme.colors.primary, 0.08),
      paddingHorizontal: 10,
      paddingVertical: 15,
    },
    sheetActionText: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    sheetCancel: {alignItems: 'center', marginTop: 9, paddingVertical: 12},
    sheetCancelText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'},
  });
}
