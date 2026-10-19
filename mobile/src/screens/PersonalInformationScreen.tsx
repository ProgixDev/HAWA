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
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {formatFullDate} from '../utils/cycleMath';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {AwaTextField} from '../components/ui/AwaTextField';

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

function formatBirthDate(value: string, notProvided: string): string {
  if (!value) {return notProvided;}
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : formatFullDate(date);
}

function InfoRow({icon, label, value, onPress, last, theme, styles}: {
  icon: IconName; label: string; value: string; onPress?: () => void; last?: boolean;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && onPress && styles.pressed]}>
      <View style={styles.rowIcon}><MaterialDesignIcons color={theme.colors.primary} name={icon} size={20} /></View>
      <View style={styles.rowCopy}><AwaText colorRole="onSurfaceVariant" variant="labelMedium">{label}</AwaText><AwaText emphasized style={styles.rowValue} variant="bodyMedium">{value}</AwaText></View>
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
    let updated: PersonalInformation;
    try {
      updated = await updatePersonalInformation(patch);
    } catch (saveError) {
      // Not persisted: the sheet stays open with the draft, no success toast (see services/saveFailure.ts).
      presentSaveFailure(saveError);
      return;
    }
    setProfile(updated);
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

  // The picker needs a starting point; with no birth date saved it opens on
  // today, which is only ever persisted if the user confirms a date.
  const parsedBirthDate = profile.birthDate ? new Date(`${profile.birthDate}T12:00:00`) : null;
  const birthDatePickerValue = parsedBirthDate && !Number.isNaN(parsedBirthDate.getTime()) ? parsedBirthDate : new Date();

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
          : getAppLanguage() === 'tr'
            ? t('appearance.language.turkishName')
            : getAppLanguage() === 'ru'
              ? t('appearance.language.russianName')
              : getAppLanguage() === 'de'
                ? t('appearance.language.germanName')
                : getAppLanguage() === 'zh'
                  ? t('appearance.language.chineseName')
                  : getAppLanguage() === 'id'
                    ? t('appearance.language.indonesianName')
                    : t('appearance.language.frenchName');

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 24}]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
          <View style={styles.headerCopy}><AwaText accessibilityRole="header" variant="headlineSmall">{t('personalInformation.title')}</AwaText><AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('personalInformation.subtitle')}</AwaText></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(420)}>
          <AwaCard style={styles.profileCard} variant="elevated">
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
              <AwaText style={styles.greeting} variant="titleLarge">{t('personalInformation.greeting')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.profileText} variant="bodySmall">
                {t('personalInformation.intro')}
              </AwaText>

              <AwaButton
                accessibilityLabel={profile.avatarUri ? t('personalInformation.changeMyPhoto') : t('personalInformation.addPhoto')}
                icon={profile.avatarUri ? 'image-edit-outline' : 'image-plus-outline'}
                label={profile.avatarUri ? t('personalInformation.changePhoto') : t('personalInformation.addPhoto')}
                onPress={() => openField('avatar')}
                size="compact"
                style={styles.photoAction}
                variant="tonal"
              />
            </View>
          </View>
          </AwaCard>
        </Animated.View>

        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">{t('personalInformation.basicInfoSection')}</AwaText>
        <Animated.View entering={FadeInUp.delay(150).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <InfoRow icon="account-outline" label={t('personalInformation.firstNameLabel')} value={profile.firstName || t('profile.notProvided')} onPress={() => openField('firstName')} styles={styles} theme={theme} />
          <InfoRow icon="account-outline" label={t('personalInformation.lastNameLabel')} value={profile.lastName || t('profile.notProvided')} onPress={() => openField('lastName')} styles={styles} theme={theme} />
          <InfoRow icon="calendar-month-outline" label={t('personalInformation.birthDateLabel')} value={formatBirthDate(profile.birthDate, t('profile.notProvided'))} onPress={() => setDatePickerVisible(true)} styles={styles} theme={theme} />
          <InfoRow icon="email-outline" label={t('personalInformation.emailLabel')} value={profile.email || t('profile.notProvided')} onPress={() => openField('email')} styles={styles} theme={theme} />
          <InfoRow icon="phone-outline" label={t('personalInformation.phoneLabel')} value={profile.phone || t('profile.notProvided')} onPress={() => openField('phone')} styles={styles} theme={theme} />
          <InfoRow icon="map-marker-outline" label={t('personalInformation.countryLabel')} value={profile.country || t('profile.notProvided')} onPress={() => openField('country')} styles={styles} theme={theme} />
          <InfoRow icon="web" label={t('personalInformation.languageLabel')} value={languageDisplayValue} last styles={styles} theme={theme} />
        </AwaCard>
        </Animated.View>

        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">{t('personalInformation.preferencesSection')}</AwaText>
        <Animated.View entering={FadeInUp.delay(220).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <InfoRow icon="gender-female" label={t('personalInformation.preferredNameQuestion')} value={profile.preferredName || t('profile.notProvided')} onPress={() => openField('preferredName')} styles={styles} theme={theme} />
          <InfoRow icon="weather-night" label={t('personalInformation.mainCalendarLabel')} value={calendarLabel} onPress={() => openField('calendar')} styles={styles} theme={theme} />
          <InfoRow icon="clock-outline" label={t('personalInformation.timeFormatLabel')} value={profile.timeFormat === '24h' ? t('personalInformation.time24h') : t('personalInformation.time12h')} last onPress={() => openField('timeFormat')} styles={styles} theme={theme} />
        </AwaCard>
        </Animated.View>

        <AwaCard padding="compact" style={styles.infoCard} variant="filled"><MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21} /><AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('personalInformation.infoCardText')}</AwaText></AwaCard>
      </ScrollView>

      {datePickerVisible ? <DateTimePicker maximumDate={new Date()} mode="date" onDismiss={onDatePickerDismiss} onValueChange={onDateValueChange} value={birthDatePickerValue} /> : null}

      <Modal animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent transparent visible={sheet !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSheet(null)} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            {sheet === 'avatar' ? <>
              <AwaText style={styles.sheetTitle} variant="titleLarge">{t('personalInformation.photoSheetTitle')}</AwaText>
              <SheetAction icon="camera-outline" label={t('personalInformation.takePhoto')} onPress={() => choosePhoto(true)} styles={styles} theme={theme} />
              <SheetAction icon="image-outline" label={t('personalInformation.chooseFromGallery')} onPress={() => choosePhoto(false)} styles={styles} theme={theme} />
              {profile.avatarUri ? <SheetAction danger icon="delete-outline" label={t('personalInformation.deletePhoto')} onPress={() => persist({avatarUri: undefined})} styles={styles} theme={theme} /> : null}
            </> : sheet && ['firstName', 'lastName', 'email', 'phone', 'preferredName'].includes(sheet) ? <>
              <AwaText style={styles.sheetTitle} variant="titleLarge">{FIELD_META[sheet as FieldKey].title}</AwaText>
              <AwaTextField autoFocus errorText={error || undefined} keyboardType={FIELD_META[sheet as FieldKey].keyboard} label={FIELD_META[sheet as FieldKey].label} onChangeText={value => {setDraft(value); setError('');}} placeholder={t('profile.notProvided')} placeholderTextColor={theme.colors.textMuted} value={draft} />
              <SaveButton onPress={saveTextField} styles={styles} />
            </> : sheet === 'country' ? <>
              <AwaText style={styles.sheetTitle} variant="titleLarge">{t('personalInformation.chooseCountryTitle')}</AwaText><TextInput autoFocus onChangeText={setQuery} placeholder={t('personalInformation.searchCountryPlaceholder')} placeholderTextColor={theme.colors.textMuted} style={styles.input} value={query} />
              <ScrollView style={styles.optionsScroll}>{filteredCountries.map(item => <Option key={item} label={item} selected={profile.country === item} onPress={() => persist({country: item})} styles={styles} theme={theme} />)}</ScrollView>
            </> : sheet === 'calendar' ? <><AwaText style={styles.sheetTitle} variant="titleLarge">{t('personalInformation.calendarSheetTitle')}</AwaText>{CALENDARS.map(item => <Option detail={item.detail} key={item.value} label={item.label} selected={profile.calendar === item.value} onPress={() => persist({calendar: item.value})} styles={styles} theme={theme} />)}</> : sheet === 'timeFormat' ? <><AwaText style={styles.sheetTitle} variant="titleLarge">{t('personalInformation.timeFormatSheetTitle')}</AwaText><Option detail={t('personalInformation.time24hExample')} label={t('personalInformation.time24h')} selected={profile.timeFormat === '24h'} onPress={() => persist({timeFormat: '24h'})} styles={styles} theme={theme} /><Option detail={t('personalInformation.time12hExample')} label={t('personalInformation.time12h')} selected={profile.timeFormat === '12h'} onPress={() => persist({timeFormat: '12h'})} styles={styles} theme={theme} /></> : null}
            <AwaButton fullWidth label={t('common.cancel')} onPress={() => setSheet(null)} style={styles.cancel} variant="text" />
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
  return <AwaButton fullWidth label={t('common.save')} onPress={onPress} size="large" style={styles.save} />;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 12, paddingHorizontal: 16},
    contentCompact: {paddingHorizontal: 11},
    header: {flexDirection: 'row', alignItems: 'center'},
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    subtitle: {marginTop: 3},
    profileCard: {overflow: 'hidden'},
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
    greeting: {},
    profileText: {marginTop: 4},
    photoAction: {alignSelf: 'flex-start', marginTop: 8},
    sectionTitle: {marginTop: 4},
    card: {overflow: 'hidden', paddingHorizontal: 12},
    row: {minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {alignItems: 'center', justifyContent: 'center', padding: 9},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 11},
    rowValue: {marginTop: 2},
    infoCard: {flexDirection: 'row', alignItems: 'center', gap: 10},
    infoText: {flex: 1},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10},
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, marginBottom: 14, textAlign: 'center'},
    input: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), borderRadius: 12, backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.text, fontSize: 14},
    save: {marginTop: 15},
    cancel: {marginTop: 9},
    sheetAction: {flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08), paddingHorizontal: 10, paddingVertical: 15},
    sheetActionText: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    danger: {color: theme.colors.danger},
    optionsScroll: {maxHeight: '55%'},
    option: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.13), borderRadius: 12, backgroundColor: theme.colors.surface, padding: 16, marginBottom: 8},
    optionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    optionCopy: {flex: 1},
    optionLabel: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    optionLabelSelected: {color: theme.colors.text, fontWeight: '700'},
    optionDetail: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11},
    radio: {width: 21, height: 21, borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.35), borderRadius: 999},
    toast: {
      position: 'absolute', left: '12%', right: '12%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, backgroundColor: theme.colors.primary, padding: 16, elevation: 6,
    },
    toastText: {color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '700'},
  });
}
