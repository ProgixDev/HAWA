import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';

const PURPLE = '#5B3BA4';
const ACTIVITY_ICONS = require('../../assets/images/activity-icons-sprite.png');
const ACTIVITIES = [
  {label: 'Marche', column: 0, row: 0},
  {label: 'Course', column: 1, row: 0},
  {label: 'Yoga', column: 2, row: 0},
  {label: 'Musculation', column: 3, row: 0},
  {label: 'Natation', column: 4, row: 0},
  {label: 'Vélo', column: 0, row: 1},
  {label: 'Étirements', column: 1, row: 1},
  {label: 'Pilates', column: 2, row: 1},
  {label: 'Danse', column: 3, row: 1},
  {label: 'Autre', column: 4, row: 1},
];
const FEELINGS = [
  {label: 'Très fatiguée', emoji: '🥵'}, {label: 'Fatiguée', emoji: '😓'},
  {label: 'Neutre', emoji: '😐'}, {label: 'Bien', emoji: '🙂'},
  {label: 'Très bien', emoji: '🤩'},
];
const INTENSITIES = [
  {label: 'Légère', icon: 'heart-outline', color: '#E3AC42'},
  {label: 'Modérée', icon: 'heart', color: '#FF7043'},
  {label: 'Élevée', icon: 'heart', color: PURPLE},
];


type ActivitySpriteProps = {
  column: number;
  row: number;
};

function ActivitySprite({
  column,
  row,
}: ActivitySpriteProps): React.JSX.Element {
  return (
    <View pointerEvents="none" style={styles.activityImageViewport}>
      <Image
        resizeMode="stretch"
        source={ACTIVITY_ICONS}
        style={[
          styles.activitySprite,
          {
            left: `${-column * 100}%`,
            top: `${-row * 100}%`,
          },
        ]}
      />
    </View>
  );
}

export default function JournalActivityScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  const [activity, setActivity] = useState('Marche');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('Élevée');
  const [feeling, setFeeling] = useState('Très bien');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleDay = useMemo(() => {
    const start = getCyclePreferences().lastPeriodStart;
    return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  }, []);
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'short'}).format(new Date());
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

          // Retour vers l'écran précédent (CycleHome)
          // après l'affichage du toast de succès.
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

      await saveJournalSection(
        new Date().toLocaleDateString('en-CA'),
        'activity',
        {
          none: false,
          type: activity,
          durationMinutes: duration,
          intensity,
          feeling,
          note: note.trim(),
        },
      );

      showSuccessToast();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ton activité pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };
  const changeDuration = (step: number) => setDuration(value => Math.min(120, Math.max(10, value + step)));

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <StatusBar backgroundColor="#FBF8FD" barStyle="dark-content" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.flex}>
      <View
        style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isVerySmallScreen && styles.headerVerySmall,
        ]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({pressed}) => [
            styles.headerButton,
            isSmallScreen && styles.headerButtonSmall,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={PURPLE}
            name="chevron-left"
            size={isSmallScreen ? 22 : 25}
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              isSmallScreen && styles.titleSmall,
            ]}>
            Activité physique
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.date,
              isSmallScreen && styles.dateSmall,
            ]}>
            {dateLabel} · Jour {cycleDay} du cycle
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Enregistrer"
          accessibilityRole="button"
          disabled={saving}
          hitSlop={10}
          onPress={save}
          style={({pressed}) => [
            styles.headerButton,
            styles.headerSave,
            isSmallScreen && styles.headerButtonSmall,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color="#FFFFFF"
            name="check"
            size={isSmallScreen ? 18 : 20}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isSmallScreen && styles.contentSmall,
          isVerySmallScreen && styles.contentVerySmall,
          {paddingBottom: Math.max(insets.bottom, 16) + 20},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ImageBackground imageStyle={styles.heroImage} source={require('../../assets/images/activity-header-woman.png')} style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>Bouge pour ton bien-être ✦</Text><Text style={styles.heroText}>L’activité physique aide à réduire le stress,améliorer l’humeur et soulager{`\n`} les symptômes.</Text></View>
        </ImageBackground>

        <View style={styles.card}>
          <View style={styles.sectionHeader}><MaterialDesignIcons color={PURPLE} name="walk" size={18} /><View><Text style={styles.sectionTitle}>Type d’activité</Text><Text style={styles.hint}>Sélectionne l’activité que tu as pratiquée</Text></View></View>
          <View style={styles.activityGrid}>
            {ACTIVITIES.map(item => {
              const active = activity === item.label;

              return (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}
                  key={item.label}
                  onPress={() => setActivity(item.label)}
                  style={({pressed}) => [
                    styles.activity,
                    active && styles.activitySelected,
                    pressed && styles.activityPressed,
                  ]}>
                  <ActivitySprite
                    column={item.column}
                    row={item.row}
                  />

                  <View
                    pointerEvents="none"
                    style={[
                      styles.activityLabelContainer,
                      active && styles.activityLabelContainerSelected,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.activityLabel,
                        active && styles.selectedText,
                      ]}>
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.row,
            isSmallScreen && styles.rowSmall,
          ]}>
          <View style={[styles.card, styles.half]}>
            <View style={styles.sectionHeader}><MaterialDesignIcons color={PURPLE} name="clock-outline" size={18} /><View><Text style={styles.sectionTitle}>Durée</Text><Text style={styles.hint}>Combien de temps ?</Text></View></View>
            <View style={styles.durationRow}><Pressable onPress={() => changeDuration(-10)} style={styles.circleButton}><Text style={styles.control}>−</Text></Pressable><Text style={styles.duration}>{duration}</Text><Text style={styles.minutes}>min</Text><Pressable onPress={() => changeDuration(10)} style={styles.circleButton}><Text style={styles.control}>+</Text></Pressable></View>
            <View style={styles.durationTrack}><View style={[styles.durationFill, {width: `${(duration / 120) * 100}%`}]} /><View style={[styles.durationThumb, {left: `${(duration / 120) * 100}%`}]} /></View>
            <View style={styles.scaleLabels}>{[10, 30, 60, 90, 120].map(value => <Pressable key={value} onPress={() => setDuration(value)}><Text style={styles.scaleText}>{value}</Text></Pressable>)}</View>
          </View>
          <View style={[styles.card, styles.half]}>
            <View style={styles.sectionHeader}><MaterialDesignIcons color={PURPLE} name="pulse" size={18} /><View><Text style={styles.sectionTitle}>Intensité</Text><Text style={styles.hint}>Niveau de ton activité</Text></View></View>
            <View style={styles.intensityRow}>{INTENSITIES.map(item => {const active = intensity === item.label; return <Pressable key={item.label} onPress={() => setIntensity(item.label)} style={[styles.intensity, active && styles.selected]}><MaterialDesignIcons color={item.color} name={item.icon as never} size={22} /><Text style={styles.intensityText}>{item.label}</Text></Pressable>;})}</View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}><MaterialDesignIcons color={PURPLE} name="emoticon-happy-outline" size={18} /><Text style={styles.sectionTitle}>Comment te sens-tu après ton activité ?</Text></View>
          <View style={styles.feelings}>{FEELINGS.map(item => {const active = feeling === item.label; return <Pressable key={item.label} onPress={() => setFeeling(item.label)} style={[styles.feeling, active && styles.selected]}><Text style={styles.emoji}>{item.emoji}</Text><Text style={styles.feelingText}>{item.label}</Text></Pressable>;})}</View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}><MaterialDesignIcons color={PURPLE} name="pencil-outline" size={18} /><View><Text style={styles.sectionTitle}>Commentaire <Text style={styles.optional}>(optionnel)</Text></Text><Text style={styles.hint}>Ajoute un commentaire si tu le souhaites.</Text></View></View>
          <View style={styles.noteBox}><TextInput maxLength={200} multiline onChangeText={setNote} placeholder="Écris ici..." placeholderTextColor="#9A96A2" style={styles.note} textAlignVertical="top" value={note} /><View style={styles.noteFooter}><Text style={styles.counter}>{note.length} / 200</Text><MaterialDesignIcons color={PURPLE} name="paperclip" size={18} /><MaterialDesignIcons color={PURPLE} name="camera-outline" size={19} /></View></View>
        </View>
        <View style={styles.kindness}><MaterialDesignIcons color={PURPLE} name="heart-outline" size={17} /><Text style={styles.kindnessText}>Chaque pas compte. Félicite-toi pour avoir pris soin de toi aujourd’hui ! 💜</Text></View>
        <Pressable
          accessibilityLabel="Enregistrer l'activité"
          accessibilityRole="button"
          disabled={saving}
          onPress={save}
          style={({pressed}) => [
            styles.save,
            pressed && styles.pressed,
            saving && styles.saveDisabled,
          ]}>
          <MaterialDesignIcons
            color="#FFFFFF"
            name={saving ? 'loading' : 'content-save'}
            size={18}
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
          <MaterialDesignIcons color="#FFFFFF" name="check" size={14} />
        </View>

        <Text style={styles.toastText}>
          Activité enregistrée avec succès ✨
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
          <MaterialDesignIcons color="#8E83A4" name="close" size={17} />
        </Pressable>
      </Animated.View>
    ) : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8FD',
  },

  flex: {
    flex: 1,
  },

  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 8,
    paddingHorizontal: 14,
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
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F3',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },

  headerButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 13,
  },

  headerSave: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  title: {
    color: '#30205E',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  titleSmall: {
    fontSize: 19,
  },

  date: {
    maxWidth: '100%',
    marginTop: 2,
    color: '#77727D',
    fontSize: 11,
    textAlign: 'center',
  },

  dateSmall: {
    fontSize: 9.5,
  },

  content: {
    paddingTop: 8,
    paddingHorizontal: 13,
    gap: 8,
  },

  contentSmall: {
    paddingTop: 6,
    paddingHorizontal: 10,
    gap: 7,
  },

  contentVerySmall: {
    paddingTop: 5,
    paddingHorizontal: 8,
    gap: 6,
  },

  hero: {
    height: 112,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F3EAF9',
  },

  heroImage: {
    borderRadius: 18,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '58%',
    paddingLeft: 15,
    paddingTop: 6,
  },

  heroTitle: {
    color: '#32205F',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },

  heroText: {
    marginTop: 6,
    color: '#4E4860',
    fontSize: 10,
    lineHeight: 15,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ECE7EE',
    borderRadius: 18,
    backgroundColor: '#FFFDFF',
    padding: 10,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
    paddingTop: 3,
  },

  sectionTitle: {
    color: '#33245C',
    fontSize: 14,
    fontWeight: '700',
  },

  hint: {
    marginTop: 2,
    color: '#87818C',
    fontSize: 9.5,
  },

  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 7,
  },

  activity: {
    position: 'relative',
    width: '18.5%',
    height: 78,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE9EF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingTop: 6,
    paddingHorizontal: 3,
    paddingBottom: 3,
  },

  activitySelected: {
    borderWidth: 1.7,
    borderColor: '#7957C1',
    backgroundColor: '#F7F2FD',
  },

  activityPressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },

  activityImageViewport: {
    width: '100%',
    height: 49,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#FBF9FC',
  },

  activitySprite: {
    position: 'absolute',
    width: '500%',
    height: '200%',
  },

  activityLabelContainer: {
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
  },

  activityLabelContainerSelected: {
    backgroundColor: '#F7F2FD',
  },

  activityLabel: {
    maxWidth: '100%',
    color: '#38323F',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  selected: {
    borderColor: '#7957C1',
    backgroundColor: '#F5F0FC',
  },

  selectedText: {
    color: PURPLE,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    gap: 7,
  },

  rowSmall: {
    flexDirection: 'column',
  },

  half: {
    flex: 1,
    minWidth: 0,
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleButton: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 13,
  },

  control: {
    color: '#574F63',
    fontSize: 17,
  },

  duration: {
    marginLeft: 12,
    color: '#302750',
    fontSize: 24,
    fontWeight: '700',
  },

  minutes: {
    marginHorizontal: 9,
    color: '#56505E',
    fontSize: 11,
  },

  durationTrack: {
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: '#E6E0EB',
  },

  durationFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PURPLE,
  },

  durationThumb: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },

  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  scaleText: {
    color: '#817B86',
    fontSize: 9,
  },

  intensityRow: {
    flexDirection: 'row',
    gap: 5,
  },

  intensity: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 10,
  },

  intensityText: {
    marginTop: 4,
    color: '#494250',
    fontSize: 9,
    fontWeight: '600',
  },

  feelings: {
    flexDirection: 'row',
    gap: 7,
  },

  feeling: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 10,
  },

  emoji: {
    fontSize: 20,
  },

  feelingText: {
    marginTop: 3,
    color: '#4A4450',
    fontSize: 9,
    textAlign: 'center',
  },

  optional: {
    fontSize: 10,
    fontWeight: '400',
  },

  noteBox: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#E9E3EC',
    borderRadius: 11,
    backgroundColor: '#FCFAFD',
  },

  note: {
    minHeight: 43,
    paddingHorizontal: 10,
    paddingTop: 8,
    color: '#3F3847',
    fontSize: 11.5,
  },

  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },

  counter: {
    marginRight: 'auto',
    color: '#8E8991',
    fontSize: 9,
  },

  kindness: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F4F0F9',
    paddingHorizontal: 10,
  },

  kindnessText: {
    flex: 1,
    marginLeft: 7,
    color: '#635777',
    fontSize: 10,
  },

  save: {
    width: '88%',
    maxWidth: 360,
    height: 45,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: PURPLE,
  },

  saveText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    borderColor: '#E3D8F2',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#4F2A9C',
    shadowOffset: {width: 0, height: 5},
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
    backgroundColor: PURPLE,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: '#2F2258',
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
    backgroundColor: '#F3EEF8',
    opacity: 0.8,
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});
