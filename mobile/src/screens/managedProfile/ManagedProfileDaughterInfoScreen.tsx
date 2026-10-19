import React, {useMemo, useState} from 'react';
import {Alert, Image, Modal, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import BirthDatePickerModal from '../../components/onboarding/BirthDatePickerModal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
import {AwaTextField} from '../../components/ui/AwaTextField';
import {calculateAgeInYears} from '../../utils/age';
import {getManagedProfileDraft, updateManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH} from '../../state/managedProfilesStore';
import {dateFormatLocale} from '../../utils/cycleMath';
import '../../i18n';

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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // Date FORMAT only (locale swap) — never the underlying calculation, per
  // CLAUDE.md's real-data-only rule and this task's own "locale formatting
  // only" scope.
  const dateLocale = dateFormatLocale();

  const draft = getManagedProfileDraft();
  const [firstName, setFirstName] = useState(draft.firstName);
  const [birthDate, setBirthDate] = useState<Date | null>(draft.birthDate);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(draft.profileImageUri);
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
        Alert.alert(t('managedProfile.daughterInfo.photoErrorTitle'), t('managedProfile.daughterInfo.photoErrorAccess'));
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) {setProfileImageUri(uri);}
    } catch {
      Alert.alert(t('managedProfile.daughterInfo.photoErrorTitle'), t('managedProfile.daughterInfo.photoErrorGeneric'));
    } finally {
      setPhotoSheetVisible(false);
    }
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      description={t('managedProfile.daughterInfo.description')}
  
      onBack={navigation.goBack}
      onContinue={canContinue ? onContinue : undefined}
      title={t('managedProfile.daughterInfo.title')}>
      <Reveal index={0}>
        <View style={styles.avatarZone}>
          <Pressable
            accessibilityLabel={t('managedProfile.daughterInfo.editPhoto')}
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
        <AwaTextField
          accessibilityLabel={t('managedProfile.daughterInfo.firstNameAccessibilityLabel')}
          autoCapitalize="words"
          autoComplete="off"
          autoCorrect={false}
          label={t('managedProfile.daughterInfo.firstNameLabel')}
          maxLength={MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH}
          onChangeText={setFirstName}
          placeholder={t('managedProfile.daughterInfo.firstNamePlaceholder')}
          returnKeyType="done"
          selectionColor={theme.colors.primary}
          textContentType="givenName"
          value={firstName}
        />
      </Reveal>

      <Reveal index={2}>
        <AwaCard
          accessibilityLabel={t('managedProfile.daughterInfo.birthDateLabel')}
          onPress={() => setDatePickerVisible(true)}
          variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelLarge" style={styles.label}>{t('managedProfile.daughterInfo.birthDateLabel')}</AwaText>
          <View style={styles.dateRow}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={18} />
            <AwaText colorRole={birthDate ? 'onSurface' : 'onSurfaceVariant'} variant="bodyLarge">
              {birthDate
                ? new Intl.DateTimeFormat(dateLocale, {day: '2-digit', month: 'long', year: 'numeric'}).format(birthDate)
                : t('managedProfile.daughterInfo.birthDatePlaceholder')}
            </AwaText>
          </View>
        </AwaCard>
      </Reveal>

      {birthDate ? (
        <Reveal index={3}>
          <AwaCard padding="compact" style={styles.ageCard} variant="filled">
            <MaterialDesignIcons color={theme.colors.primary} name="cake-variant-outline" size={18} />
            <AwaText colorRole="primary" emphasized variant="labelLarge">{t('managedProfile.daughterInfo.age', {count: calculateAgeInYears(birthDate)})}</AwaText>
          </AwaCard>
        </Reveal>
      ) : null}

      <BirthDatePickerModal
        maximumDate={new Date()}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setBirthDate}
        title={t('managedProfile.daughterInfo.birthDateLabel')}
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
            accessibilityLabel={t('common.close')}
            onPress={() => setPhotoSheetVisible(false)}
            style={styles.sheetBackdrop}
          />
          <View style={[styles.photoSheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.sheetHandle} />
            <AwaText variant="titleLarge" style={styles.sheetTitle}>{t('managedProfile.daughterInfo.photoSheetTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.sheetSubtitle}>{t('managedProfile.daughterInfo.photoSheetSubtitle')}</AwaText>

            <Pressable
              accessibilityLabel={t('managedProfile.daughterInfo.takePhoto')}
              accessibilityRole="button"
              onPress={() => choosePhoto('camera')}
              style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="camera-outline" size={22} />
              <AwaText variant="bodyLarge">{t('managedProfile.daughterInfo.takePhoto')}</AwaText>
            </Pressable>

            <Pressable
              accessibilityLabel={t('managedProfile.daughterInfo.chooseFromGallery')}
              accessibilityRole="button"
              onPress={() => choosePhoto('gallery')}
              style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="image-outline" size={22} />
              <AwaText variant="bodyLarge">{t('managedProfile.daughterInfo.chooseFromGallery')}</AwaText>
            </Pressable>

            <AwaButton
              accessibilityLabel={t('common.cancel')}
              fullWidth
              label={t('common.cancel')}
              onPress={() => setPhotoSheetVisible(false)}
              style={styles.sheetCancel}
              variant="text"
            />
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
    label: {marginBottom: 8},
    dateRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    ageCard: {flexDirection: 'row', alignItems: 'center', gap: 9},
    pressed: {opacity: 0.86},

    // Photo-source sheet — same measurements as PersonalInformationScreen.tsx's
    // own avatar sheet (modalRoot/backdrop/sheet/handle/sheetTitle/sheetAction/cancel).
    sheetRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    sheetBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    photoSheet: {
      maxHeight: '86%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    sheetHandle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, color: theme.colors.accent, textAlign: 'center'},
    sheetSubtitle: {marginTop: 6, marginBottom: 14, textAlign: 'center'},
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: withAlpha(theme.colors.primary, 0.08),
      paddingHorizontal: 10,
      paddingVertical: 15,
    },
    sheetCancel: {marginTop: 9},
  });
}
