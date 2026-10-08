import React, {useEffect, useMemo, useState} from 'react';
import {
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
  useWindowDimensions,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useTranslation} from 'react-i18next';
import {getAppLanguage} from '../state/themePreferences';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getCachedPersonalInformation,
  loadPersonalInformation,
  updatePersonalInformation,
  type PersonalInformation,
} from '../state/personalInformationStore';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {interpolateHex, onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {formatFullDate} from '../utils/cycleMath';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInformation'>;
type FieldKey = keyof Pick<PersonalInformation, 'firstName' | 'lastName' | 'email' | 'phone' | 'preferredName'>;
type SheetType = FieldKey | 'country' | 'calendar' | 'timeFormat' | 'avatar' | null;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Country names are deliberately NOT translated — the stored `profile.country`
// value IS this display string itself (no separate technical id exists, the
// way themes separate `id` from `name`/`description`), so translating this
// list would silently break the picker's `selected={profile.country === item}`
// match for anyone who already picked a country, and would require migrating
// already-persisted selections — a data migration this phase explicitly
// excludes (see fr.ts's matching namespace comment).
const COUNTRIES = ['Algérie', 'Maroc', 'Tunisie', 'France', 'Belgique', 'Canada', 'Suisse', 'Sénégal', 'Côte d’Ivoire'];

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const calendarsOf = (t: TranslateFn) => [
  {value: 'gregorian', label: t('personalInformation.calendars.gregorianLabel'), detail: t('personalInformation.calendars.gregorianDetail')},
  {value: 'hijri', label: t('personalInformation.calendars.hijriLabel'), detail: t('personalInformation.calendars.hijriDetail')},
  {value: 'double', label: t('personalInformation.calendars.doubleLabel'), detail: t('personalInformation.calendars.doubleDetail')},
] as const;

const fieldMetaOf = (t: TranslateFn): Record<FieldKey, {title: string; label: string; keyboard?: 'default' | 'email-address' | 'phone-pad'}> => ({
  firstName: {title: t('personalInformation.editFirstNameTitle'), label: t('personalInformation.firstNameLabel')},
  lastName: {title: t('personalInformation.editLastNameTitle'), label: t('personalInformation.lastNameLabel')},
  email: {title: t('personalInformation.editEmailTitle'), label: t('personalInformation.emailLabel'), keyboard: 'email-address'},
  phone: {title: t('personalInformation.editPhoneTitle'), label: t('personalInformation.phoneLabel'), keyboard: 'phone-pad'},
  preferredName: {title: t('personalInformation.preferredNameSheetTitle'), label: t('personalInformation.preferredNameFieldLabel')},
});

function formatBirthDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : formatFullDate(date);
}

function InfoRow({icon, label, value, onPress, last, theme, styles}: {
  icon: IconName; label: string; value: string; onPress?: () => void; last?: boolean;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && onPress && styles.pressed]}>
      <View style={styles.rowIcon}><MaterialDesignIcons color={theme.colors.primary} name={icon} size={19} /></View>
      <View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text numberOfLines={2} style={styles.rowValue}>{value}</Text></View>
      {onPress ? <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={23} /> : null}
    </Pressable>
  );
}

export default function PersonalInformationScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const CALENDARS = useMemo(() => calendarsOf(t), [t]);
  const FIELD_META = useMemo(() => fieldMetaOf(t), [t]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [profile, setProfile] = useState(getCachedPersonalInformation());
  const [sheet, setSheet] = useState<SheetType>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {loadPersonalInformation().then(setProfile);}, []);

  const openField = (key: SheetType) => {
    setError(''); setQuery(''); setSheet(key);
    if (key && key in profile) {setDraft(String(profile[key as keyof PersonalInformation] ?? ''));}
  };

  const persist = async (patch: Partial<PersonalInformation>) => {
    setProfile(await updatePersonalInformation(patch));
    setSheet(null); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const saveTextField = () => {
    if (!sheet || !['firstName', 'lastName', 'email', 'phone', 'preferredName'].includes(sheet)) {return;}
    const key = sheet as FieldKey;
    const value = draft.trim();
    if (!value) {setError(t('personalInformation.requiredField')); return;}
    if (key === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {setError(t('personalInformation.invalidEmail')); return;}
    if (key === 'phone' && value.replace(/\D/g, '').length < 8) {setError(t('personalInformation.invalidPhone')); return;}
    persist({[key]: value});
  };

  const choosePhoto = async (camera: boolean) => {
    const result = camera
      ? await launchCamera({mediaType: 'photo', quality: 0.8})
      : await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
    const uri = result.assets?.[0]?.uri;
    if (uri) {persist({avatarUri: uri});}
  };

  const onDateValueChange = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (Platform.OS === 'android') {setDatePickerVisible(false);}
    const birthDate = date.toLocaleDateString('en-CA');
    persist({birthDate});
  };

  const onDatePickerDismiss = () => {
    if (Platform.OS === 'android') {setDatePickerVisible(false);}
  };

  const filteredCountries = useMemo(
    () => COUNTRIES.filter(country => country.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [query],
  );

  const calendarLabel = CALENDARS.find(item => item.value === profile.calendar)?.label ?? t('personalInformation.calendars.doubleLabel');

  // The "Langue" row must reflect the CURRENT app language (Appearance's own
  // language switcher), never the stored `profile.language` field — that
  // field is forced to a single fixed value by personalInformationStore.ts
  // (a stale assumption from before English support existed) and would
  // otherwise always show "Français" even after switching the app to
  // English. This reads the live language fresh, fixing a real display bug,
  // without touching the store's own field/migration logic at all.
  const languageDisplayValue =
    getAppLanguage() === 'en'
      ? t('appearance.language.englishName')
      : getAppLanguage() === 'es'
        ? t('appearance.language.spanishName')
        : getAppLanguage() === 'it'
          ? t('appearance.language.italianName')
          : t('appearance.language.frenchName');

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 24}]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable accessibilityLabel={t('common.back')} onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}><MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} /></Pressable>
          <View style={styles.headerCopy}><Text adjustsFontSizeToFit minimumFontScale={0.8} style={styles.title}>{t('personalInformation.title')}</Text><Text style={styles.subtitle}>{t('personalInformation.subtitle')}</Text></View>
          <View style={styles.decor}><MaterialDesignIcons color={theme.colors.secondary} name="leaf" size={42} /><MaterialDesignIcons color={theme.colors.primary} name="star-four-points" size={12} /></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.profileCard}>
          <View pointerEvents="none" style={styles.profileGlow} />
          <View pointerEvents="none" style={styles.profileDecorTopRight} />

          <View style={styles.profileTopRow}>
            <View style={styles.avatarOuterRing}>
              <Pressable
                accessibilityLabel={profile.avatarUri ? t('personalInformation.editPhoto') : t('personalInformation.addPhoto')}
                onPress={() => openField('avatar')}
                style={({pressed}) => [
                  styles.avatarWrap,
                  pressed && styles.pressed,
                ]}>
                {profile.avatarUri ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={{uri: profile.avatarUri}}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="account-outline"
                      size={28}
                    />
                  </View>
                )}

                <View style={styles.camera}>
                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name={profile.avatarUri ? 'camera-outline' : 'camera-plus-outline'}
                    size={12}
                  />
                </View>
              </Pressable>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.greeting}>{t('personalInformation.greeting')}</Text>
              <Text style={styles.profileText}>
                {t('personalInformation.intro')}
              </Text>

              <Pressable
                accessibilityLabel={profile.avatarUri ? t('personalInformation.changeMyPhoto') : t('personalInformation.addPhoto')}
                onPress={() => openField('avatar')}
                style={({pressed}) => [
                  styles.photoAction,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name={profile.avatarUri ? 'image-edit-outline' : 'image-plus-outline'}
                  size={14}
                />
                <Text style={styles.photoActionText}>
                  {profile.avatarUri ? t('personalInformation.changePhoto') : t('personalInformation.addPhoto')}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>{t('personalInformation.basicInfoSection')}</Text>
        <Animated.View entering={FadeInUp.delay(150).duration(420)} style={styles.card}>
          <InfoRow icon="account-outline" label={t('personalInformation.firstNameLabel')} value={profile.firstName || t('profile.notProvided')} onPress={() => openField('firstName')} styles={styles} theme={theme} />
          <InfoRow icon="account-outline" label={t('personalInformation.lastNameLabel')} value={profile.lastName} onPress={() => openField('lastName')} styles={styles} theme={theme} />
          <InfoRow icon="calendar-month-outline" label={t('personalInformation.birthDateLabel')} value={formatBirthDate(profile.birthDate)} onPress={() => setDatePickerVisible(true)} styles={styles} theme={theme} />
          <InfoRow icon="email-outline" label={t('personalInformation.emailLabel')} value={profile.email} onPress={() => openField('email')} styles={styles} theme={theme} />
          <InfoRow icon="phone-outline" label={t('personalInformation.phoneLabel')} value={profile.phone} onPress={() => openField('phone')} styles={styles} theme={theme} />
          <InfoRow icon="map-marker-outline" label={t('personalInformation.countryLabel')} value={profile.country} onPress={() => openField('country')} styles={styles} theme={theme} />
          <InfoRow icon="web" label={t('personalInformation.languageLabel')} value={languageDisplayValue} last styles={styles} theme={theme} />
        </Animated.View>

        <Text style={styles.sectionTitle}>{t('personalInformation.preferencesSection')}</Text>
        <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
          <InfoRow icon="gender-female" label={t('personalInformation.preferredNameQuestion')} value={profile.preferredName || t('profile.notProvided')} onPress={() => openField('preferredName')} styles={styles} theme={theme} />
          <InfoRow icon="weather-night" label={t('personalInformation.mainCalendarLabel')} value={calendarLabel} onPress={() => openField('calendar')} styles={styles} theme={theme} />
          <InfoRow icon="clock-outline" label={t('personalInformation.timeFormatLabel')} value={profile.timeFormat === '24h' ? t('personalInformation.time24h') : t('personalInformation.time12h')} last onPress={() => openField('timeFormat')} styles={styles} theme={theme} />
        </Animated.View>

        <View style={styles.infoCard}><MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21} /><Text style={styles.infoText}>{t('personalInformation.infoCardText')}</Text></View>
      </ScrollView>

      {datePickerVisible ? <DateTimePicker maximumDate={new Date()} mode="date" onDismiss={onDatePickerDismiss} onValueChange={onDateValueChange} value={new Date(`${profile.birthDate}T12:00:00`)} /> : null}

      <Modal animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent transparent visible={sheet !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSheet(null)} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            {sheet === 'avatar' ? <>
              <Text style={styles.sheetTitle}>{t('personalInformation.photoSheetTitle')}</Text>
              <SheetAction icon="camera-outline" label={t('personalInformation.takePhoto')} onPress={() => choosePhoto(true)} styles={styles} theme={theme} />
              <SheetAction icon="image-outline" label={t('personalInformation.chooseFromGallery')} onPress={() => choosePhoto(false)} styles={styles} theme={theme} />
              {profile.avatarUri ? <SheetAction danger icon="delete-outline" label={t('personalInformation.deletePhoto')} onPress={() => persist({avatarUri: undefined})} styles={styles} theme={theme} /> : null}
            </> : sheet && ['firstName', 'lastName', 'email', 'phone', 'preferredName'].includes(sheet) ? <>
              <Text style={styles.sheetTitle}>{FIELD_META[sheet as FieldKey].title}</Text>
              <Text style={styles.inputLabel}>{FIELD_META[sheet as FieldKey].label}</Text>
              <TextInput autoFocus keyboardType={FIELD_META[sheet as FieldKey].keyboard} onChangeText={value => {setDraft(value); setError('');}} placeholderTextColor={theme.colors.textMuted} style={[styles.input, error ? styles.inputError : null]} value={draft} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <SaveButton onPress={saveTextField} styles={styles} />
            </> : sheet === 'country' ? <>
              <Text style={styles.sheetTitle}>{t('personalInformation.chooseCountryTitle')}</Text><TextInput autoFocus onChangeText={setQuery} placeholder={t('personalInformation.searchCountryPlaceholder')} placeholderTextColor={theme.colors.textMuted} style={styles.input} value={query} />
              <ScrollView style={styles.optionsScroll}>{filteredCountries.map(item => <Option key={item} label={item} selected={profile.country === item} onPress={() => persist({country: item})} styles={styles} theme={theme} />)}</ScrollView>
            </> : sheet === 'calendar' ? <><Text style={styles.sheetTitle}>{t('personalInformation.calendarSheetTitle')}</Text>{CALENDARS.map(item => <Option detail={item.detail} key={item.value} label={item.label} selected={profile.calendar === item.value} onPress={() => persist({calendar: item.value})} styles={styles} theme={theme} />)}</> : sheet === 'timeFormat' ? <><Text style={styles.sheetTitle}>{t('personalInformation.timeFormatSheetTitle')}</Text><Option detail={t('personalInformation.time24hExample')} label={t('personalInformation.time24h')} selected={profile.timeFormat === '24h'} onPress={() => persist({timeFormat: '24h'})} styles={styles} theme={theme} /><Option detail={t('personalInformation.time12hExample')} label={t('personalInformation.time12h')} selected={profile.timeFormat === '12h'} onPress={() => persist({timeFormat: '12h'})} styles={styles} theme={theme} /></> : null}
            <Pressable onPress={() => setSheet(null)} style={styles.cancel}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toastVisible ? <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={15} /><Text style={styles.toastText}>{t('personalInformation.toastUpdated')}</Text></Animated.View> : null}
    </SafeAreaView>
  );
}

function SheetAction({icon, label, onPress, danger, theme, styles}: {
  icon: IconName; label: string; onPress: () => void; danger?: boolean;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return <Pressable onPress={onPress} style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}><MaterialDesignIcons color={danger ? theme.colors.danger : theme.colors.primary} name={icon} size={22} /><Text style={[styles.sheetActionText, danger && styles.danger]}>{label}</Text></Pressable>;
}
function Option({label, detail, selected, onPress, theme, styles}: {
  label: string; detail?: string; selected: boolean; onPress: () => void;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return <Pressable onPress={onPress} style={({pressed}) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><View style={styles.optionCopy}><Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>{detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}</View>{selected ? <MaterialDesignIcons color={theme.colors.primary} name="check-circle" size={22} /> : <View style={styles.radio} />}</Pressable>;
}
function SaveButton({onPress, styles}: {onPress: () => void; styles: ReturnType<typeof createStyles>}) {
  const {t} = useTranslation();
  return <Pressable onPress={onPress} style={({pressed}) => [styles.save, pressed && styles.pressed]}><Text style={styles.saveText}>{t('common.save')}</Text></Pressable>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 12, paddingHorizontal: 16},
    contentCompact: {paddingHorizontal: 11},
    header: {flexDirection: 'row', alignItems: 'center'},
    back: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.surface, padding: 9, elevation: 2},
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '700'},
    subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5},
    decor: {alignItems: 'center', justifyContent: 'center', flexDirection: 'row'},
    profileCard: {
      position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.11),
      borderRadius: 24, backgroundColor: interpolateHex(theme.colors.surface, theme.colors.primarySoft, 0.3),
      paddingHorizontal: 16, paddingVertical: 15, elevation: 3, shadowColor: theme.shadow.shadowColor, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: {width: 0, height: 5},
    },
    profileGlow: {position: 'absolute', top: -48, right: -38, width: 140, height: 140, borderRadius: 70, backgroundColor: withAlpha(theme.colors.primary, 0.055)},
    profileDecorTopRight: {position: 'absolute', top: 17, right: 18, width: 7, height: 7, borderRadius: 4, backgroundColor: withAlpha(theme.colors.primary, 0.22)},
    profileTopRow: {flexDirection: 'row', alignItems: 'center'},
    avatarOuterRing: {width: 74, height: 74, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.15), borderRadius: 37, backgroundColor: withAlpha(theme.colors.surface, 0.72)},
    avatarWrap: {width: 64, height: 64, borderRadius: 32},
    avatar: {width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primarySoft, borderWidth: 2, borderColor: theme.colors.surface},
    avatarPlaceholder: {width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, borderWidth: 2, borderColor: theme.colors.surface, backgroundColor: theme.colors.primarySoft},
    camera: {
      position: 'absolute', right: -1, bottom: -1, width: 23, height: 23, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: theme.colors.surface, borderRadius: 12, backgroundColor: theme.colors.primary,
      elevation: 2, shadowColor: theme.shadow.shadowColor, shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: {width: 0, height: 2},
    },
    profileCopy: {flex: 1, minWidth: 0, marginLeft: 14},
    greeting: {color: theme.colors.text, fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 22},
    profileText: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    photoAction: {
      alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 999, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 9, paddingVertical: 6,
    },
    photoActionText: {color: theme.colors.primary, fontSize: 10.5, fontWeight: '700'},
    sectionTitle: {marginTop: 2, color: theme.colors.accent, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    card: {overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 24, backgroundColor: theme.colors.surface, paddingHorizontal: 12},
    row: {minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft, padding: 9},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 11},
    rowLabel: {color: theme.colors.textSecondary, fontSize: 10.5},
    rowValue: {marginTop: 2, color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
    infoCard: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: theme.colors.primarySoft, padding: 14},
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 16},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {maxHeight: '86%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10},
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, marginBottom: 14, color: theme.colors.accent, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    inputLabel: {marginBottom: 7, color: theme.colors.text, fontSize: 12, fontWeight: '700'},
    input: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), borderRadius: 18, backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.text, fontSize: 14},
    inputError: {borderColor: theme.colors.danger},
    error: {marginTop: 6, color: theme.colors.danger, fontSize: 11},
    save: {alignItems: 'center', marginTop: 15, borderRadius: 18, backgroundColor: theme.colors.primary, padding: 15},
    saveText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
    cancel: {alignItems: 'center', marginTop: 9, paddingVertical: 12},
    cancelText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'},
    sheetAction: {flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08), paddingHorizontal: 10, paddingVertical: 15},
    sheetActionText: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    danger: {color: theme.colors.danger},
    optionsScroll: {maxHeight: '55%'},
    option: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.13), borderRadius: 18, backgroundColor: theme.colors.surface, padding: 13, marginBottom: 8},
    optionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    optionCopy: {flex: 1},
    optionLabel: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    optionLabelSelected: {color: theme.colors.primary, fontWeight: '700'},
    optionDetail: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 10.5},
    radio: {width: 21, height: 21, borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.35), borderRadius: 999},
    toast: {
      position: 'absolute', left: '12%', right: '12%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 18, backgroundColor: theme.colors.primary, padding: 13, elevation: 8,
    },
    toastText: {color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '700'},
  });
}
