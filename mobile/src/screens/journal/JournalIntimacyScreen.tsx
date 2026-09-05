import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import {isIntimacyUnlocked, lockIntimacy} from '../../state/privateSectionAuthStore';
import {encryptIntimacySection, resolveIntimacySection} from '../../services/privateJournalEncryption';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 380 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  const [hasReport, setHasReport] = useState(true);
  const [time, setTime] = useState('21:30');
  const [libido, setLibido] = useState('Très élevée');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  // Whether today's entry still has the old plaintext `intimacy` field (and
  // no `encryptedIntimacy` yet) — this screen doesn't prefill its form from
  // existing data (a pre-existing, unrelated behavior), but Save still needs
  // to know this to safely migrate: the legacy field is only ever deleted
  // AFTER the new encrypted write succeeds, never before.
  const [hadLegacyPlaintextIntimacy, setHadLegacyPlaintextIntimacy] = useState(false);
  // Set when an encrypted payload exists for today but can't be decrypted
  // (corrupted/tampered) — an honest failure state, matching the same
  // "Impossible de lire ces données privées." message already shown by the
  // sibling JournalConceptionReportsScreen.tsx. Never auto-cleared except by
  // an explicit new Save, which overwrites it.
  const [corrupted, setCorrupted] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleDay = useMemo(() => {
    const start = getCyclePreferences().lastPeriodStart;
    return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  }, []);
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {weekday:'long', day:'numeric', month:'long'}).format(new Date());
  useEffect(() => {
    if (!isIntimacyUnlocked()) {navigation.navigate('PrivateIntimacyUnlock'); return;}
    getJournalEntry(new Date().toLocaleDateString('en-CA')).then(async entry => {
      setHadLegacyPlaintextIntimacy(Boolean(entry?.intimacy) && !entry?.encryptedIntimacy);
      const {corrupted: isCorrupted} = await resolveIntimacySection(entry);
      setCorrupted(isCorrupted);
    });
  }, [navigation]);

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
  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  const showSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
    }

    setSuccessVisible(true);
    successToastAnimation.stopAnimation();
    successToastAnimation.setValue(0);

    Animated.spring(successToastAnimation, {
      toValue: 1,
      damping: 17,
      stiffness: 180,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    successToastTimeout.current = setTimeout(() => {
      Animated.timing(successToastAnimation, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setSuccessVisible(false);

          // Retourne à l'écran précédent (CycleHome lorsque Vie intime
          // a été ouverte depuis le journal quotidien de CycleHome).
          navigation.goBack();
        }
      });
    }, 2500);
  };

  const hideSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
      successToastTimeout.current = null;
    }

    Animated.timing(successToastAnimation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setSuccessVisible(false);
      }
    });
  };

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      if (__DEV__) {console.log('[INTIMACY_SAVE][CYCLE] start');}

      const date = new Date().toLocaleDateString('en-CA');
      const encrypted = await encryptIntimacySection({
        answer: hasReport ? 'yes' : 'no',
        libido: hasReport ? libido : undefined,
        discomfort: hasReport ? symptoms.join(', ') : undefined,
        note: note.trim(),
      });
      if (__DEV__) {console.log('[INTIMACY_SAVE][CYCLE] encryption ok');}
      await saveJournalSection(date, 'encryptedIntimacy', encrypted);
      if (__DEV__) {console.log('[INTIMACY_SAVE][CYCLE] AsyncStorage write ok');}

      // Only delete the old plaintext field once the new encrypted write
      // has actually succeeded above — never before, and never if this day
      // had no legacy field to begin with.
      if (hadLegacyPlaintextIntimacy) {
        await deleteJournalSection(date, 'intimacy');
        setHadLegacyPlaintextIntimacy(false);
        if (__DEV__) {console.log('[INTIMACY_SAVE][CYCLE] legacy plaintext cleanup ok');}
      }
      setCorrupted(false);

      showSuccessToast();
    } catch (error) {
      if (__DEV__) {
        const safe = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        console.log('[INTIMACY_SAVE][CYCLE] FAILED:', safe);
      }
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ces informations pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <StatusBar backgroundColor={theme.colors.background} barStyle={theme.statusBarStyle} />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} style={styles.flex}>
      <View
        style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isVerySmallScreen && styles.headerVerySmall,
        ]}>
        <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.headerButton}><MaterialDesignIcons color={theme.colors.accent} name="chevron-left" size={27} /></Pressable>
        <View style={styles.headerCopy}><View style={styles.titleRow}><Text style={styles.title}>Vie intime</Text><MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={21} /></View><Text style={styles.date}>{dateLabel} · Jour {cycleDay} du cycle</Text></View>
        <Pressable accessibilityLabel="Masquer et verrouiller les informations" accessibilityRole="button" onPress={() => {lockIntimacy(); navigation.reset({index:1,routes:[{name:'MainTabs',params:{screen:'CycleHome'}},{name:'PrivateIntimacyUnlock'}]});}} style={styles.hide}><MaterialDesignIcons color={theme.colors.primary} name="eye-off-outline" size={18} /><Text style={styles.hideText}>Masquer</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom:Math.max(insets.bottom, 16) + 16}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ImageBackground imageStyle={styles.heroImage} source={require('../../assets/images/intimacy-header-woman.png')} style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>Ton intimité, ton espace ♡</Text><Text style={styles.heroText}>Note ce que tu ressens en toute confiance.{`\n`}Cette section est privée et protégée.</Text><View style={styles.learn}><Text style={styles.learnText}>En savoir plus</Text><MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={17} /></View></View>
        </ImageBackground>

        <View style={styles.privateArea}>
          {corrupted ? (
            <View style={styles.noReportMessage}>
              <MaterialDesignIcons color={theme.colors.textMuted} name="alert-circle-outline" size={18} />
              <Text style={styles.noReportText}>Impossible de lire ces données privées.</Text>
            </View>
          ) : null}

          <Card>
            <View style={styles.reportTitleRow}>
              <Heading
                icon="heart-outline"
                title="Rapport aujourd’hui"
                subtitle="As-tu eu un rapport aujourd’hui ?"
              />

              <View style={styles.reportPrivacyBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
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
                  color={theme.colors.textMuted}
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
            <View style={styles.libidoRow}>{LIBIDOS.map((item,index) => {const active = libido === item; return <Pressable disabled={!hasReport} key={item} onPress={() => setLibido(item)} style={[styles.libido, active && styles.selected, !hasReport && styles.disabled]}><MaterialDesignIcons color={active ? theme.colors.primary : withAlpha(theme.colors.primary, 0.22 + index * 0.16)} name={index === 0 ? 'heart-outline' : 'heart'} size={27} /><Text style={styles.choiceLabel}>{item}</Text></Pressable>;})}</View>
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
                          color={onPrimaryTextColor(theme)}
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
            <View style={styles.noteBox}><TextInput maxLength={300} multiline onChangeText={setNote} placeholder="Écris ton commentaire ici..." placeholderTextColor={theme.colors.textSecondary} style={styles.note} textAlignVertical="top" value={note} /><Text style={styles.counter}>{note.length} / 300</Text><MaterialDesignIcons color={theme.colors.primary} name="sprout" size={36} style={styles.leaf} /></View>
          </Card>
        </View>

        <View style={styles.security}><MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={22} /><Text style={styles.securityText}>Cette section est protégée par un code ou Face ID séparé.{`\n`}Personne d’autre n’y a accès.</Text><MaterialDesignIcons color={withAlpha(theme.colors.primary, 0.5)} name="shield-lock-outline" size={26} /></View>
        <Pressable
          accessibilityLabel="Enregistrer les informations de vie intime"
          accessibilityRole="button"
          disabled={saving}
          onPress={save}
          style={({pressed}) => [
            styles.save,
            pressed && styles.pressed,
            saving && styles.saveDisabled,
          ]}>
          <MaterialDesignIcons
            color={onPrimaryTextColor(theme)}
            name={saving ? 'loading' : 'lock-outline'}
            size={20}
          />
          <Text style={styles.saveText}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

    {successVisible ? (
      <Animated.View
        style={[
          styles.toast,
          {
            bottom: Math.max(insets.bottom, 18) + 12,
            opacity: successToastAnimation,
            transform: [
              {
                translateY: successToastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: successToastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.toastIcon}>
          <MaterialDesignIcons
            color={onPrimaryTextColor(theme)}
            name="check"
            size={14}
          />
        </View>

        <Text style={styles.toastText}>
          Vie intime enregistrée avec succès ✨
        </Text>

        <Pressable
          accessibilityLabel="Fermer"
          accessibilityRole="button"
          hitSlop={10}
          onPress={hideSuccessToast}
          style={({pressed}) => [
            styles.toastCloseButton,
            pressed && styles.toastCloseButtonPressed,
          ]}>
          <MaterialDesignIcons
            color={theme.colors.textSecondary}
            name="close"
            size={17}
          />
        </Pressable>
      </Animated.View>
    ) : null}

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
                color={theme.colors.primary}
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
                color={theme.colors.accent}
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
                        color={onPrimaryTextColor(theme)}
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.heading}>
      <View style={styles.headingIcon}>
        <MaterialDesignIcons
          color={theme.colors.primary}
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          color={active ? onPrimaryTextColor(theme) : theme.colors.textSecondary}
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          color={theme.colors.primary}
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
          color={theme.colors.primary}
          name="chevron-down"
          size={20}
        />
      </View>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 8,
    paddingHorizontal: 14,
    gap: 9,
  },

  headerSmall: {
    minHeight: 62,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 7,
    paddingHorizontal: 10,
  },

  headerVerySmall: {
    minHeight: 58,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },

  headerButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.accent,
    fontSize: 24,
    fontWeight: '800',
  },

  date: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
  },

  hide: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },

  hideText: {
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.primarySoft,
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
    color: theme.colors.accent,
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: '800',
  },

  heroText: {
    marginTop: 9,
    color: theme.colors.textSecondary,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
  },

  learnText: {
    color: theme.colors.primary,
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
    borderColor: theme.colors.border,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.primarySoft,
  },

  headingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  headingTitle: {
    color: theme.colors.accent,
    fontSize: 13.5,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  reportPrivacyText: {
    color: theme.colors.primary,
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
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },

  answerActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  answerIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  answerIconActive: {
    backgroundColor: theme.colors.primary,
  },

  answerText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  answerTextActive: {
    color: theme.colors.accent,
  },

  separator: {
    height: 1,
    marginVertical: 12,
    backgroundColor: theme.colors.border,
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
    borderColor: theme.colors.border,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
  },

  fieldIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },

  selectFieldCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8.7,
  },

  selectFieldValue: {
    marginTop: 3,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.primarySoft,
  },

  noReportMessage: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 11,
  },

  noReportText: {
    flex: 1,
    color: theme.colors.textSecondary,
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
    borderColor: theme.colors.border,
    borderRadius: 12,
  },

  selected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  choiceLabel: {
    marginTop: 5,
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  symptomSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomIconWrap: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomIconWrapActive: {
    backgroundColor: theme.colors.primary,
  },

  symptomText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    color: theme.colors.text,
    fontSize: 9.2,
    lineHeight: 12.5,
    fontWeight: '600',
  },

  symptomTextActive: {
    color: theme.colors.accent,
    fontWeight: '700',
  },

  checkbox: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },

  checkboxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  disabled: {
    opacity: 0.42,
  },

  noteBox: {
    height: 76,
    marginTop: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },

  note: {
    height: 58,
    paddingHorizontal: 10,
    paddingTop: 8,
    color: theme.colors.text,
    fontSize: 9.5,
  },

  counter: {
    position: 'absolute',
    right: 10,
    bottom: 7,
    color: theme.colors.textSecondary,
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
    backgroundColor: withAlpha(theme.colors.background, 0.97),
  },

  hiddenTitle: {
    marginTop: 7,
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },

  hiddenText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 9,
  },

  security: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },

  securityText: {
    flex: 1,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primary,
  },

  saveText: {
    color: onPrimaryTextColor(theme),
    fontSize: 14,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.985}],
  },

  saveDisabled: {
    opacity: 0.55,
  },

  toast: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.17,
    shadowRadius: 13,
    elevation: 7,
  },

  toastIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.accent,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
  },

  toastCloseButton: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  toastCloseButtonPressed: {
    backgroundColor: theme.colors.primarySoft,
    opacity: 0.8,
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
    backgroundColor: theme.colors.surface,
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
    backgroundColor: withAlpha(theme.colors.primary, 0.35),
  },

  sheetHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },

  sheetHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  sheetTitle: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },

  sheetSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
  },

  sheetClose: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
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
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
  },

  pickerOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  pickerOptionPressed: {
    opacity: 0.72,
    transform: [{scale: 0.985}],
  },

  pickerOptionText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  pickerOptionTextActive: {
    color: theme.colors.accent,
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
    backgroundColor: theme.colors.primary,
  },
});
}
