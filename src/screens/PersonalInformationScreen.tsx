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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getCachedPersonalInformation,
  loadPersonalInformation,
  updatePersonalInformation,
  type PersonalInformation,
} from '../state/personalInformationStore';

const PURPLE = '#6D4AE8';
const DARK = '#2F2258';
const MUTED = '#746D92';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInformation'>;
type FieldKey = keyof Pick<PersonalInformation, 'firstName' | 'lastName' | 'email' | 'phone' | 'preferredName'>;
type SheetType = FieldKey | 'country' | 'language' | 'calendar' | 'timeFormat' | 'avatar' | null;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const COUNTRIES = ['Algérie', 'Maroc', 'Tunisie', 'France', 'Belgique', 'Canada', 'Suisse', 'Sénégal', 'Côte d’Ivoire'];
const LANGUAGES = ['Français', 'العربية', 'English', 'Español'];
const CALENDARS = [
  {value: 'gregorian', label: 'Grégorien', detail: '14 mai 2026'},
  {value: 'hijri', label: 'Hijri', detail: '27 Dhul Qi’dah 1447'},
  {value: 'double', label: 'Double', detail: 'Grégorien + Hijri'},
] as const;

const FIELD_META: Record<FieldKey, {title: string; label: string; keyboard?: 'default' | 'email-address' | 'phone-pad'}> = {
  firstName: {title: 'Modifier le prénom', label: 'Prénom'},
  lastName: {title: 'Modifier le nom', label: 'Nom'},
  email: {title: 'Modifier l’adresse e-mail', label: 'Adresse e-mail', keyboard: 'email-address'},
  phone: {title: 'Modifier le numéro', label: 'Numéro international', keyboard: 'phone-pad'},
  preferredName: {title: 'Comment AWA doit-elle t’appeler ?', label: 'Prénom préféré'},
};

function formatBirthDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

function InfoRow({icon, label, value, onPress, last}: {icon: IconName; label: string; value: string; onPress: () => void; last?: boolean}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><MaterialDesignIcons color={PURPLE} name={icon} size={19} /></View>
      <View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text numberOfLines={2} style={styles.rowValue}>{value}</Text></View>
      <MaterialDesignIcons color="#B5ACC5" name="chevron-right" size={23} />
    </Pressable>
  );
}

export default function PersonalInformationScreen({navigation}: Props): React.JSX.Element {
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
    if (!value) {setError('Ce champ est obligatoire.'); return;}
    if (key === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {setError('Saisis une adresse e-mail valide.'); return;}
    if (key === 'phone' && value.replace(/\D/g, '').length < 8) {setError('Saisis un numéro international valide.'); return;}
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

  const calendarLabel = CALENDARS.find(item => item.value === profile.calendar)?.label ?? 'Double';

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 24}]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}><MaterialDesignIcons color={PURPLE} name="chevron-left" size={28} /></Pressable>
          <View style={styles.headerCopy}><Text adjustsFontSizeToFit minimumFontScale={0.8} style={styles.title}>Informations personnelles</Text><Text style={styles.subtitle}>Gère tes informations de base 🌸</Text></View>
          <View style={styles.decor}><MaterialDesignIcons color="#B998F0" name="leaf" size={42} /><MaterialDesignIcons color="#9D76E8" name="star-four-points" size={12} /></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(420)} style={styles.profileCard}>
          <View pointerEvents="none" style={styles.profileGlow} />
          <View pointerEvents="none" style={styles.profileDecorTopRight} />

          <View style={styles.profileTopRow}>
            <View style={styles.avatarOuterRing}>
              <Pressable
                accessibilityLabel={profile.avatarUri ? 'Modifier la photo' : 'Ajouter une photo'}
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
                      color="#7B62B3"
                      name="account-outline"
                      size={28}
                    />
                  </View>
                )}

                <View style={styles.camera}>
                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name={profile.avatarUri ? 'camera-outline' : 'camera-plus-outline'}
                    size={12}
                  />
                </View>
              </Pressable>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.greeting}>Salam ! 💜</Text>
              <Text style={styles.profileText}>
                Ces informations sont utilisées pour personnaliser ton expérience dans AWA.
              </Text>

              <Pressable
                accessibilityLabel={profile.avatarUri ? 'Changer ma photo' : 'Ajouter une photo'}
                onPress={() => openField('avatar')}
                style={({pressed}) => [
                  styles.photoAction,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color="#6949BE"
                  name={profile.avatarUri ? 'image-edit-outline' : 'image-plus-outline'}
                  size={14}
                />
                <Text style={styles.photoActionText}>
                  {profile.avatarUri ? 'Changer la photo' : 'Ajouter une photo'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Informations de base</Text>
        <Animated.View entering={FadeInUp.delay(150).duration(420)} style={styles.card}>
          <InfoRow icon="account-outline" label="Prénom" value={profile.firstName} onPress={() => openField('firstName')} />
          <InfoRow icon="account-outline" label="Nom" value={profile.lastName} onPress={() => openField('lastName')} />
          <InfoRow icon="calendar-month-outline" label="Date de naissance" value={formatBirthDate(profile.birthDate)} onPress={() => setDatePickerVisible(true)} />
          <InfoRow icon="email-outline" label="Adresse e-mail" value={profile.email} onPress={() => openField('email')} />
          <InfoRow icon="phone-outline" label="Numéro de téléphone" value={profile.phone} onPress={() => openField('phone')} />
          <InfoRow icon="map-marker-outline" label="Pays" value={profile.country} onPress={() => openField('country')} />
          <InfoRow icon="web" label="Langue" value={profile.language} last onPress={() => openField('language')} />
        </Animated.View>

        <Text style={styles.sectionTitle}>Préférences personnelles</Text>
        <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
          <InfoRow icon="gender-female" label="Comment souhaites-tu que AWA t’appelle ?" value={profile.preferredName} onPress={() => openField('preferredName')} />
          <InfoRow icon="weather-night" label="Calendrier principal" value={calendarLabel} onPress={() => openField('calendar')} />
          <InfoRow icon="clock-outline" label="Format de l’heure" value={profile.timeFormat === '24h' ? '24 heures' : '12 heures'} last onPress={() => openField('timeFormat')} />
        </Animated.View>

        <View style={styles.infoCard}><MaterialDesignIcons color={PURPLE} name="information-outline" size={21} /><Text style={styles.infoText}>Tu peux modifier ces informations à tout moment.{`\n`}Certaines modifications peuvent affecter tes prédictions.</Text></View>
      </ScrollView>

      {datePickerVisible ? <DateTimePicker maximumDate={new Date()} mode="date" onDismiss={onDatePickerDismiss} onValueChange={onDateValueChange} value={new Date(`${profile.birthDate}T12:00:00`)} /> : null}

      <Modal animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent transparent visible={sheet !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSheet(null)} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            {sheet === 'avatar' ? <>
              <Text style={styles.sheetTitle}>Photo de profil</Text>
              <SheetAction icon="camera-outline" label="Prendre une photo" onPress={() => choosePhoto(true)} />
              <SheetAction icon="image-outline" label="Choisir depuis la galerie" onPress={() => choosePhoto(false)} />
              {profile.avatarUri ? <SheetAction danger icon="delete-outline" label="Supprimer la photo" onPress={() => persist({avatarUri: undefined})} /> : null}
            </> : sheet && ['firstName', 'lastName', 'email', 'phone', 'preferredName'].includes(sheet) ? <>
              <Text style={styles.sheetTitle}>{FIELD_META[sheet as FieldKey].title}</Text>
              <Text style={styles.inputLabel}>{FIELD_META[sheet as FieldKey].label}</Text>
              <TextInput autoFocus keyboardType={FIELD_META[sheet as FieldKey].keyboard} onChangeText={value => {setDraft(value); setError('');}} placeholderTextColor="#A39AB5" style={[styles.input, error ? styles.inputError : null]} value={draft} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <SaveButton onPress={saveTextField} />
            </> : sheet === 'country' ? <>
              <Text style={styles.sheetTitle}>Choisir le pays</Text><TextInput autoFocus onChangeText={setQuery} placeholder="Rechercher un pays" placeholderTextColor="#A39AB5" style={styles.input} value={query} />
              <ScrollView style={styles.optionsScroll}>{filteredCountries.map(item => <Option key={item} label={item} selected={profile.country === item} onPress={() => persist({country: item})} />)}</ScrollView>
            </> : sheet === 'language' ? <><Text style={styles.sheetTitle}>Choisir la langue</Text>{LANGUAGES.map(item => <Option key={item} label={item} selected={profile.language === item} onPress={() => persist({language: item})} />)}</> : sheet === 'calendar' ? <><Text style={styles.sheetTitle}>Calendrier principal</Text>{CALENDARS.map(item => <Option detail={item.detail} key={item.value} label={item.label} selected={profile.calendar === item.value} onPress={() => persist({calendar: item.value})} />)}</> : sheet === 'timeFormat' ? <><Text style={styles.sheetTitle}>Format de l’heure</Text><Option detail="Exemple : 08:30 et 20:30" label="24 heures" selected={profile.timeFormat === '24h'} onPress={() => persist({timeFormat: '24h'})} /><Option detail="Exemple : 8:30 AM et 8:30 PM" label="12 heures" selected={profile.timeFormat === '12h'} onPress={() => persist({timeFormat: '12h'})} /></> : null}
            <Pressable onPress={() => setSheet(null)} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toastVisible ? <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}><MaterialDesignIcons color="#FFFFFF" name="check" size={15} /><Text style={styles.toastText}>Informations mises à jour ✓</Text></Animated.View> : null}
    </SafeAreaView>
  );
}

function SheetAction({icon, label, onPress, danger}: {icon: IconName; label: string; onPress: () => void; danger?: boolean}) {return <Pressable onPress={onPress} style={({pressed}) => [styles.sheetAction, pressed && styles.pressed]}><MaterialDesignIcons color={danger ? '#B64C5A' : PURPLE} name={icon} size={22} /><Text style={[styles.sheetActionText, danger && styles.danger]}>{label}</Text></Pressable>;}
function Option({label, detail, selected, onPress}: {label: string; detail?: string; selected: boolean; onPress: () => void}) {return <Pressable onPress={onPress} style={({pressed}) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><View style={styles.optionCopy}><Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>{detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}</View>{selected ? <MaterialDesignIcons color={PURPLE} name="check-circle" size={22} /> : <View style={styles.radio} />}</Pressable>;}
function SaveButton({onPress}: {onPress: () => void}) {return <Pressable onPress={onPress} style={({pressed}) => [styles.save, pressed && styles.pressed]}><Text style={styles.saveText}>Enregistrer</Text></Pressable>;}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FCFAFF'},content:{flexGrow:1,gap:12,paddingHorizontal:16},contentCompact:{paddingHorizontal:11},header:{flexDirection:'row',alignItems:'center'},back:{alignItems:'center',justifyContent:'center',borderRadius:999,backgroundColor:'#FFFFFF',padding:9,elevation:2},headerCopy:{flex:1,minWidth:0,paddingHorizontal:10},title:{color:DARK,fontFamily:'serif',fontSize:22,fontWeight:'700'},subtitle:{marginTop:3,color:MUTED,fontSize:11.5},decor:{alignItems:'center',justifyContent:'center',flexDirection:'row'},profileCard:{position:'relative',overflow:'hidden',borderWidth:1,borderColor:'rgba(104,70,199,0.11)',borderRadius:24,backgroundColor:'#FBF9FE',paddingHorizontal:16,paddingVertical:15,elevation:3,shadowColor:'#34245F',shadowOpacity:.07,shadowRadius:14,shadowOffset:{width:0,height:5}},profileGlow:{position:'absolute',top:-48,right:-38,width:140,height:140,borderRadius:70,backgroundColor:'rgba(104,70,199,0.055)'},profileDecorTopRight:{position:'absolute',top:17,right:18,width:7,height:7,borderRadius:4,backgroundColor:'rgba(133,101,196,0.22)'},profileTopRow:{flexDirection:'row',alignItems:'center'},avatarOuterRing:{width:74,height:74,alignItems:'center',justifyContent:'center',flexShrink:0,borderWidth:1,borderColor:'rgba(105,73,190,0.15)',borderRadius:37,backgroundColor:'rgba(255,255,255,0.72)'},avatarWrap:{width:64,height:64,borderRadius:32},avatar:{width:64,height:64,borderRadius:32,backgroundColor:'#EFE5FF',borderWidth:2,borderColor:'#FFFFFF'},avatarPlaceholder:{width:64,height:64,alignItems:'center',justifyContent:'center',borderRadius:32,borderWidth:2,borderColor:'#FFFFFF',backgroundColor:'#EEE8F8'},camera:{position:'absolute',right:-1,bottom:-1,width:23,height:23,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#FFFFFF',borderRadius:12,backgroundColor:'#6846C7',elevation:2,shadowColor:'#34245F',shadowOpacity:.15,shadowRadius:3,shadowOffset:{width:0,height:2}},profileCopy:{flex:1,minWidth:0,marginLeft:14},greeting:{color:'#241B45',fontFamily:'serif',fontSize:18,fontWeight:'700',lineHeight:22},profileText:{marginTop:5,color:'#777184',fontSize:11.5,lineHeight:16},photoAction:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,marginTop:9,borderWidth:1,borderColor:'rgba(105,73,190,0.14)',borderRadius:999,backgroundColor:'#F2ECF9',paddingHorizontal:9,paddingVertical:6},photoActionText:{color:'#6949BE',fontSize:10.5,fontWeight:'700'},sectionTitle:{marginTop:2,color:DARK,fontFamily:'serif',fontSize:16,fontWeight:'700'},card:{overflow:'hidden',borderWidth:1,borderColor:'#EEE8F5',borderRadius:24,backgroundColor:'#FFF',paddingHorizontal:12},row:{minHeight:62,flexDirection:'row',alignItems:'center',paddingVertical:8},rowBorder:{borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#EEE8F3'},rowIcon:{alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:'#F2EBFF',padding:9},rowCopy:{flex:1,minWidth:0,marginHorizontal:11},rowLabel:{color:MUTED,fontSize:10.5},rowValue:{marginTop:2,color:DARK,fontSize:12.5,fontWeight:'700'},infoCard:{flexDirection:'row',alignItems:'center',gap:10,borderRadius:18,backgroundColor:'#F1E8FF',padding:14},infoText:{flex:1,color:MUTED,fontSize:10.5,lineHeight:16},pressed:{opacity:.78,transform:[{scale:.985}]},modalRoot:{flex:1,justifyContent:'flex-end'},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(35,21,72,.38)'},sheet:{maxHeight:'86%',borderTopLeftRadius:30,borderTopRightRadius:30,backgroundColor:'#FFF',paddingHorizontal:18,paddingTop:10},handle:{alignSelf:'center',width:'14%',aspectRatio:8,borderRadius:999,backgroundColor:'#DDD3EA'},sheetTitle:{marginTop:16,marginBottom:14,color:DARK,fontFamily:'serif',fontSize:21,fontWeight:'700',textAlign:'center'},inputLabel:{marginBottom:7,color:DARK,fontSize:12,fontWeight:'700'},input:{borderWidth:1,borderColor:'#DDD2ED',borderRadius:18,backgroundColor:'#FCFAFF',paddingHorizontal:14,paddingVertical:13,color:DARK,fontSize:14},inputError:{borderColor:'#C95565'},error:{marginTop:6,color:'#B4485A',fontSize:11},save:{alignItems:'center',marginTop:15,borderRadius:18,backgroundColor:PURPLE,padding:15},saveText:{color:'#FFF',fontSize:15,fontWeight:'700'},cancel:{alignItems:'center',marginTop:9,paddingVertical:12},cancelText:{color:MUTED,fontSize:13,fontWeight:'600'},sheetAction:{flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#EEE7F5',paddingHorizontal:10,paddingVertical:15},sheetActionText:{color:DARK,fontSize:14,fontWeight:'600'},danger:{color:'#B64C5A'},optionsScroll:{maxHeight:'55%'},option:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#E8DFF3',borderRadius:18,backgroundColor:'#FFF',padding:13,marginBottom:8},optionSelected:{borderColor:PURPLE,backgroundColor:'#F4EEFF'},optionCopy:{flex:1},optionLabel:{color:DARK,fontSize:14,fontWeight:'600'},optionLabelSelected:{color:PURPLE,fontWeight:'700'},optionDetail:{marginTop:3,color:MUTED,fontSize:10.5},radio:{width:21,height:21,borderWidth:1.5,borderColor:'#C6B8D9',borderRadius:999},toast:{position:'absolute',left:'12%',right:'12%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:18,backgroundColor:PURPLE,padding:13,elevation:8},toastText:{color:'#FFF',fontSize:12.5,fontWeight:'700'},
});