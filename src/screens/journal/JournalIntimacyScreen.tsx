import React, {useEffect, useMemo, useState} from 'react';
import {Alert, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import {isIntimacyUnlocked, lockIntimacy} from '../../state/privateSectionAuthStore';
import {TOP_SPACING_EXTRA} from '../../theme/spacing';

const PURPLE = '#7142BD';
const DARK = '#28145C';
const LIBIDOS = ['Très faible', 'Faible', 'Modérée', 'Élevée', 'Très élevée'];
const SYMPTOMS = ['Douleur pendant le rapport', 'Sécheresse vaginale', 'Saignement après rapport', 'Fatigue', 'Douleurs pelviennes', 'Irritation', 'Aucun', 'Autre'];


type PickerType = 'time';

const TIME_OPTIONS = Array.from({length: 96}, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});


export default function JournalIntimacyScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 380 || height < 720;
  const [hasReport, setHasReport] = useState(true);
  const [time, setTime] = useState('21:30');
  const [libido, setLibido] = useState('Très élevée');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const cycleDay = useMemo(() => {
    const start = getCyclePreferences().lastPeriodStart;
    return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  }, []);
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {weekday:'long', day:'numeric', month:'long'}).format(new Date());
  useEffect(() => {if (!isIntimacyUnlocked()) {navigation.navigate('PrivateIntimacyUnlock');}}, [navigation]);

  const openPicker = (picker: PickerType) => {
    if (!hasReport) {
      return;
    }

    setActivePicker(picker);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const selectPickerValue = (value: string) => {
    if (activePicker === 'time') {
      setTime(value);
    }

    closePicker();
  };

  const toggleSymptom = (item: string) => setSymptoms(current => {
    if (item === 'Aucun') {return current.includes(item) ? [] : ['Aucun'];}
    const withoutNone = current.filter(value => value !== 'Aucun');
    return withoutNone.includes(item) ? withoutNone.filter(value => value !== item) : [...withoutNone, item];
  });
  const save = async () => {
    await saveJournalSection(new Date().toLocaleDateString('en-CA'), 'intimacy', {
      answer: hasReport ? 'yes' : 'no', 
      libido:hasReport ? libido : undefined, discomfort:hasReport ? symptoms.join(', ') : undefined,
      note:note.trim(),
    });
    Alert.alert('Journal', 'Cette information a été enregistrée localement.');
    navigation.goBack();
  };

  return <SafeAreaView edges={['top','bottom']} style={styles.safe}>
    <StatusBar backgroundColor="#FCF9FD" barStyle="dark-content" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} style={styles.flex}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.headerButton}><MaterialDesignIcons color={DARK} name="chevron-left" size={27} /></Pressable>
        <View style={styles.headerCopy}><View style={styles.titleRow}><Text style={styles.title}>Vie intime</Text><MaterialDesignIcons color={PURPLE} name="lock-outline" size={21} /></View><Text style={styles.date}>{dateLabel} · Jour {cycleDay} du cycle</Text></View>
        <Pressable accessibilityLabel="Masquer et verrouiller les informations" accessibilityRole="button" onPress={() => {lockIntimacy(); navigation.reset({index:1,routes:[{name:'MainTabs',params:{screen:'CycleHome'}},{name:'PrivateIntimacyUnlock'}]});}} style={styles.hide}><MaterialDesignIcons color={PURPLE} name="eye-off-outline" size={18} /><Text style={styles.hideText}>Masquer</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom:Math.max(insets.bottom, 16) + 16}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ImageBackground imageStyle={styles.heroImage} source={require('../../assets/images/intimacy-header-woman.png')} style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>Ton intimité, ton espace ♡</Text><Text style={styles.heroText}>Note ce que tu ressens en toute confiance.{`\n`}Cette section est privée et protégée.</Text><View style={styles.learn}><Text style={styles.learnText}>En savoir plus</Text><MaterialDesignIcons color={PURPLE} name="information-outline" size={17} /></View></View>
        </ImageBackground>

        <View style={styles.privateArea}>
          <Card>
            <View style={styles.reportTitleRow}>
              <Heading
                icon="heart-outline"
                title="Rapport aujourd’hui"
                subtitle="As-tu eu un rapport aujourd’hui ?"
              />

              <View style={styles.reportPrivacyBadge}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="lock-outline"
                  size={14}
                />
                <Text style={styles.reportPrivacyText}>Privé</Text>
              </View>
            </View>

            <View style={styles.yesNo}>
              <Choice
                active={hasReport}
                icon="check-circle-outline"
                label="Oui"
                onPress={() => setHasReport(true)}
              />
              <Choice
                active={!hasReport}
                icon="close-circle-outline"
                label="Non"
                onPress={() => setHasReport(false)}
              />
            </View>

            {hasReport ? (
              <>
                <View style={styles.separator} />

                <View
                  style={[
                    styles.details,
                    isSmallScreen && styles.detailsSmall,
                  ]}>
                  <SelectField
                    icon="calendar-clock"
                    label="Heure"
                    onPress={() => openPicker('time')}
                    value={time}
                  />
</View>
              </>
            ) : (
              <View style={styles.noReportMessage}>
                <MaterialDesignIcons
                  color="#9C8CAF"
                  name="information-outline"
                  size={18}
                />
                <Text style={styles.noReportText}>
                  Les détails du rapport sont masqués.
                </Text>
              </View>
            )}
          </Card>

          <Card><Heading icon="fire" title="Libido" subtitle="Comment évalues-tu ton désir sexuel aujourd’hui ?" />
            <View style={styles.libidoRow}>{LIBIDOS.map((item,index) => {const active = libido === item; return <Pressable disabled={!hasReport} key={item} onPress={() => setLibido(item)} style={[styles.libido, active && styles.selected, !hasReport && styles.disabled]}><MaterialDesignIcons color={active ? PURPLE : `rgba(113,66,189,${0.22 + index * 0.16})`} name={index === 0 ? 'heart-outline' : 'heart'} size={27} /><Text style={styles.choiceLabel}>{item}</Text></Pressable>;})}</View>
          </Card>

          <Card>
            <Heading
              icon="flower-outline"
              title="Symptômes associés"
              subtitle="Plusieurs choix possibles."
              optional
            />

            <View style={styles.symptomGrid}>
              {SYMPTOMS.map(item => {
                const active = symptoms.includes(item);

                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{checked: active}}
                    disabled={!hasReport}
                    key={item}
                    onPress={() => toggleSymptom(item)}
                    style={({pressed}) => [
                      styles.symptom,
                      active && styles.symptomSelected,
                      !hasReport && styles.disabled,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.symptomText,
                        active && styles.symptomTextActive,
                      ]}>
                      {item}
                    </Text>

                    <View
                      style={[
                        styles.checkbox,
                        active && styles.checkboxActive,
                      ]}>
                      {active ? (
                        <MaterialDesignIcons
                          color="#FFFFFF"
                          name="check"
                          size={13}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card><Heading icon="pencil-outline" title="Commentaire" subtitle="Écris ici ce que tu souhaites noter." optional />
            <View style={styles.noteBox}><TextInput maxLength={300} multiline onChangeText={setNote} placeholder="Écris ton commentaire ici..." placeholderTextColor="#746B80" style={styles.note} textAlignVertical="top" value={note} /><Text style={styles.counter}>{note.length} / 300</Text><MaterialDesignIcons color="#B89BD2" name="sprout" size={36} style={styles.leaf} /></View>
          </Card>
        </View>

        <View style={styles.security}><MaterialDesignIcons color={PURPLE} name="lock-outline" size={22} /><Text style={styles.securityText}>Cette section est protégée par un code ou Face ID séparé.{`\n`}Personne d’autre n’y a accès.</Text><MaterialDesignIcons color="#C6ADDC" name="shield-lock-outline" size={26} /></View>
        <Pressable onPress={save} style={styles.save}><MaterialDesignIcons color="#FFFFFF" name="lock-outline" size={20} /><Text style={styles.saveText}>Enregistrer</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

    <Modal
      animationType="fade"
      onRequestClose={closePicker}
      transparent
      visible={activePicker !== null}>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="Fermer la liste"
          onPress={closePicker}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.pickerSheet,
            isSmallScreen && styles.pickerSheetSmall,
          ]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="clock-outline"
                size={22}
              />
            </View>

            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>
                Choisir une heure
              </Text>
              <Text style={styles.sheetSubtitle}>
                Sélectionne l’heure souhaitée
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Fermer"
              hitSlop={8}
              onPress={closePicker}
              style={styles.sheetClose}>
              <MaterialDesignIcons
                color={DARK}
                name="close"
                size={21}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.timeOptions,
              {paddingBottom: Math.max(insets.bottom, 16) + 20},
            ]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map(option => {
              const active = time === option;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{checked: active}}
                  key={option}
                  onPress={() => selectPickerValue(option)}
                  style={({pressed}) => [
                    styles.timeOption,
                    active && styles.pickerOptionActive,
                    pressed && styles.pickerOptionPressed,
                  ]}>

                  <Text
                    style={[
                      styles.pickerOptionText,
                      active && styles.pickerOptionTextActive,
                    ]}>
                    {option}
                  </Text>

                  {active ? (
                    <View style={styles.pickerCheck}>
                      <MaterialDesignIcons
                        color="#FFFFFF"
                        name="check"
                        size={14}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

function Card({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <View style={styles.card}>{children}</View>;
}

function Heading({
  icon,
  title,
  subtitle,
  optional,
}: {
  icon: string;
  title: string;
  subtitle: string;
  optional?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.heading}>
      <View style={styles.headingIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon as never}
          size={22}
        />
      </View>

      <View style={styles.headingCopy}>
        <Text style={styles.headingTitle}>
          {title}
          {optional ? (
            <Text style={styles.optional}> (optionnel)</Text>
          ) : null}
        </Text>

        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Choice({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{checked: active}}
      onPress={onPress}
      style={({pressed}) => [
        styles.answer,
        active && styles.answerActive,
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.answerIcon,
          active && styles.answerIconActive,
        ]}>
        <MaterialDesignIcons
          color={active ? '#FFFFFF' : '#6B6376'}
          name={icon as never}
          size={19}
        />
      </View>

      <Text
        style={[
          styles.answerText,
          active && styles.answerTextActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.selectField,
        pressed && styles.pressed,
      ]}>
      <View style={styles.fieldIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon as never}
          size={21}
        />
      </View>

      <View style={styles.selectFieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <Text
          numberOfLines={1}
          style={styles.selectFieldValue}>
          {value}
        </Text>
      </View>

      <View style={styles.selectChevron}>
        <MaterialDesignIcons
          color={PURPLE}
          name="chevron-down"
          size={20}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FCF9FD',
  },

  flex: {
    flex: 1,
  },

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingHorizontal: 14,
    gap: 9,
  },

  headerButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9E1EE',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },

  headerCopy: {
    flex: 1,
    alignItems: 'center',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  title: {
    color: DARK,
    fontSize: 24,
    fontWeight: '800',
  },

  date: {
    marginTop: 1,
    color: '#5B5072',
    fontSize: 10.5,
  },

  hide: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E7DEED',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  hideText: {
    color: PURPLE,
    fontSize: 9.5,
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 13,
    paddingTop: 6,
    gap: 8,
  },

  hero: {
    height: 151,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#EEDFF5',
  },

  heroImage: {
    borderRadius: 18,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '52%',
    paddingLeft: 16,
  },

  heroTitle: {
    color: DARK,
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: '800',
  },

  heroText: {
    marginTop: 9,
    color: '#3F315E',
    fontSize: 9.5,
    lineHeight: 14,
  },

  learn: {
    alignSelf: 'flex-start',
    height: 29,
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },

  learnText: {
    color: PURPLE,
    fontSize: 8.7,
    fontWeight: '700',
  },

  privateArea: {
    position: 'relative',
    gap: 8,
  },

  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE5F0',
    borderRadius: 20,
    backgroundColor: '#FFFDFF',
    elevation: 1,
  },

  heading: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headingIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F3EAF8',
  },

  headingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  headingTitle: {
    color: DARK,
    fontSize: 13.5,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 3,
    color: '#5E5470',
    fontSize: 8.8,
    lineHeight: 12,
  },

  optional: {
    fontSize: 8.5,
    fontWeight: '500',
  },

  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reportPrivacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: '#F3EAF8',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  reportPrivacyText: {
    color: PURPLE,
    fontSize: 8.5,
    fontWeight: '700',
  },

  yesNo: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },

  answer: {
    flex: 1,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5DDEB',
    borderRadius: 16,
    backgroundColor: '#FFFEFF',
  },

  answerActive: {
    borderColor: '#8952CD',
    backgroundColor: '#F8F2FC',
  },

  answerIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F4EFF7',
  },

  answerIconActive: {
    backgroundColor: PURPLE,
  },

  answerText: {
    color: '#362B4A',
    fontSize: 11,
    fontWeight: '700',
  },

  answerTextActive: {
    color: DARK,
  },

  separator: {
    height: 1,
    marginVertical: 12,
    backgroundColor: '#EEE7F1',
  },

  details: {
    flexDirection: 'row',
    gap: 10,
  },

  detailsSmall: {
    flexDirection: 'column',
  },

  selectField: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7DFEC',
    borderRadius: 15,
    backgroundColor: '#FCF9FD',
    paddingHorizontal: 10,
  },

  fieldIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F4EBF8',
  },

  selectFieldCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  fieldLabel: {
    color: '#71687C',
    fontSize: 8.7,
  },

  selectFieldValue: {
    marginTop: 3,
    color: '#302342',
    fontSize: 11.5,
    fontWeight: '700',
  },

  selectChevron: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F3EAF8',
  },

  noReportMessage: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: '#F7F3F9',
    paddingHorizontal: 11,
  },

  noReportText: {
    flex: 1,
    color: '#72697D',
    fontSize: 9.5,
  },

  libidoRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },

  libido: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E9E1ED',
    borderRadius: 12,
  },

  selected: {
    borderWidth: 1.5,
    borderColor: '#8952CD',
    backgroundColor: '#F8F2FC',
  },

  choiceLabel: {
    marginTop: 5,
    color: '#332841',
    fontSize: 7.2,
    fontWeight: '600',
    textAlign: 'center',
  },

  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginTop: 11,
  },

  symptom: {
    width: '48.7%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E1ED',
    borderRadius: 15,
    backgroundColor: '#FFFEFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  symptomSelected: {
    borderColor: '#8952CD',
    backgroundColor: '#F8F2FC',
  },

  symptomIconWrap: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F4EBF8',
  },

  symptomIconWrapActive: {
    backgroundColor: PURPLE,
  },

  symptomText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    color: '#3E3547',
    fontSize: 9.2,
    lineHeight: 12.5,
    fontWeight: '600',
  },

  symptomTextActive: {
    color: DARK,
    fontWeight: '700',
  },

  checkbox: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8CEDF',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },

  checkboxActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  disabled: {
    opacity: 0.42,
  },

  noteBox: {
    height: 76,
    marginTop: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5DAEA',
    borderRadius: 12,
    backgroundColor: '#FCF8FD',
  },

  note: {
    height: 58,
    paddingHorizontal: 10,
    paddingTop: 8,
    color: '#3E3547',
    fontSize: 9.5,
  },

  counter: {
    position: 'absolute',
    right: 10,
    bottom: 7,
    color: '#6E6478',
    fontSize: 7.5,
  },

  leaf: {
    position: 'absolute',
    right: -3,
    bottom: -4,
    opacity: 0.75,
  },

  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(250,245,252,0.97)',
  },

  hiddenTitle: {
    marginTop: 7,
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
  },

  hiddenText: {
    marginTop: 4,
    color: '#756781',
    fontSize: 9,
  },

  security: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: '#F0E1F8',
  },

  securityText: {
    flex: 1,
    color: '#4E3D6A',
    fontSize: 8.4,
    lineHeight: 12,
  },

  save: {
    width: '88%',
    maxWidth: 360,
    height: 47,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 17,
    backgroundColor: PURPLE,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.985}],
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31,18,61,0.42)',
  },

  pickerSheet: {
    height: '84%',
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFDFF',
    paddingTop: 9,
    paddingHorizontal: 14,
    paddingBottom: 18,
  },

  pickerSheetSmall: {
    height: '88%',
    paddingHorizontal: 10,
  },

  sheetHandle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#D8CBE3',
  },

  sheetHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE6F2',
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F2E8F8',
  },

  sheetHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  sheetTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
  },

  sheetSubtitle: {
    marginTop: 2,
    color: '#6C607A',
    fontSize: 10.5,
  },

  sheetClose: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DDED',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 12,
  },

  timeOption: {
    width: '23.5%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E7DDEB',
    borderRadius: 14,
    backgroundColor: '#FCF9FD',
  },

  pickerOptionActive: {
    borderColor: PURPLE,
    backgroundColor: '#F1E6F8',
  },

  pickerOptionPressed: {
    opacity: 0.72,
    transform: [{scale: 0.985}],
  },

  pickerOptionText: {
    flex: 1,
    color: '#3C3150',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  pickerOptionTextActive: {
    color: DARK,
    fontWeight: '800',
  },

  pickerCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: PURPLE,
  },
});
