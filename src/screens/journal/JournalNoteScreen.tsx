import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';

const PURPLE = '#7040B4';
const DARK_PURPLE = '#30205F';
const MAX = 1000;

export default function JournalNoteScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  const [text, setText] = useState('');
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = new Date();
  const storageDate = now.toLocaleDateString('en-CA');
  const longDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const shortDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(now);
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  }).format(now);
  const cycleDay = useMemo(() => {
    const start = getCyclePreferences().lastPeriodStart;
    return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  }, []);

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

          // JournalNoteScreen est ouvert depuis CycleHome.
          // goBack() retourne vers CycleHome sans conflit de typage.
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

    if (!text.trim()) {
      Alert.alert(
        'Note personnelle',
        'Écris quelques mots avant d’enregistrer.',
      );
      return;
    }

    try {
      setSaving(true);

      await saveJournalSection(storageDate, 'note', {
        text: text.trim(),
        private: true,
        updatedAt: new Date().toISOString(),
      });

      showSuccessToast();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ta note pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="#FCF9FD" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>
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
              size={isSmallScreen ? 24 : 28}
            />
          </Pressable>

          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall,
                ]}>
                Notes personnelles
              </Text>

              <MaterialDesignIcons
                color={PURPLE}
                name="shield-lock-outline"
                size={isSmallScreen ? 18 : 21}
              />
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.date,
                isSmallScreen && styles.dateSmall,
              ]}>
              {shortDate} · Jour {cycleDay} du cycle
            </Text>
          </View>

          <Pressable
            accessibilityLabel={hidden ? 'Afficher la note' : 'Masquer la note'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setHidden(value => !value)}
            style={({pressed}) => [
              styles.hideButton,
              isSmallScreen && styles.hideButtonSmall,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={PURPLE}
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={isSmallScreen ? 17 : 19}
            />

            {!isVerySmallScreen ? (
              <Text
                style={[
                  styles.hideText,
                  isSmallScreen && styles.hideTextSmall,
                ]}>
                {hidden ? 'Afficher' : 'Masquer'}
              </Text>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isSmallScreen && styles.contentSmall,
            isVerySmallScreen && styles.contentVerySmall,
            {paddingBottom: Math.max(insets.bottom, 14) + 18},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/notes-header-woman.png')}
            style={[
              styles.hero,
              isSmallScreen && styles.heroSmall,
              isVerySmallScreen && styles.heroVerySmall,
            ]}>
            <View
              style={[
                styles.heroCopy,
                isSmallScreen && styles.heroCopySmall,
              ]}>
              <Text style={styles.heroTitle}>Ton espace rien qu’à toi ♡</Text>
              <Text style={styles.heroText}>Écris ce que tu souhaites retenir aujourd’hui : tes ressentis, observations, évolution de ta peau, pilosité ou tout autre symptôme.</Text>
              <View style={styles.privateBadge}>
                <MaterialDesignIcons color={PURPLE} name="lock" size={15} />
                <Text style={styles.privateBadgeText}>100% privé et sécurisé</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}><MaterialDesignIcons color={PURPLE} name="pencil-outline" size={23} /></View>
              <Text style={styles.sectionTitle}>Ta note du jour</Text>
            </View>
            <View style={styles.noteBox}>
              <TextInput
                editable={!hidden}
                maxLength={MAX}
                multiline
                onChangeText={setText}
                placeholder="Écris ici ce que tu souhaites noter..."
                placeholderTextColor="#8F8797"
                style={[styles.noteInput, hidden && styles.hiddenInput]}
                textAlignVertical="top"
                value={text}
              />
              {hidden && <View pointerEvents="none" style={styles.hiddenOverlay}><MaterialDesignIcons color="#9A83BA" name="lock-outline" size={24} /><Text style={styles.hiddenText}>Note masquée</Text></View>}
              <Text style={styles.counter}>{text.length} / {MAX}</Text>
              <MaterialDesignIcons color="#C4A9DA" name="sprout" size={34} style={styles.noteLeaf} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.photoHeader}>
              <View style={styles.sectionHeaderNoMargin}>
                <View style={styles.sectionIcon}><MaterialDesignIcons color={PURPLE} name="camera-outline" size={23} /></View>
                <View><Text style={styles.sectionTitle}>Photos privées <Text style={styles.optional}>(optionnel)</Text></Text><Text style={styles.photoHint}>Suis l’évolution de ta peau, de ta pilosité ou d’un symptôme.</Text></View>
              </View>
              
            </View>
            <Pressable onPress={() => navigation.navigate('PrivatePhotoEntry')} style={styles.photoEmpty}>
              <View style={styles.photoPlus}><MaterialDesignIcons color="#FFFFFF" name="plus" size={29} /></View>
              <Text style={styles.photoEmptyTitle}>Ajouter une photo privée</Text>
              <Text style={styles.photoEmptyText}>Tes photos restent uniquement sur ton appareil.</Text>
            </Pressable>

            <View style={styles.protection}>
              <View style={styles.protectionIcon}><MaterialDesignIcons color={PURPLE} name="shield-lock-outline" size={27} /></View>
              <View style={styles.protectionCopy}><Text style={styles.protectionTitle}>Tes données sont protégées</Text><Text style={styles.protectionText}>Toutes tes notes et photos sont stockées uniquement sur ton appareil. Personne d’autre n’y a accès.</Text></View>
              <MaterialDesignIcons color="#C7A8DF" name="folder-lock-outline" size={39} />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Info icon="calendar-month-outline" label="Date" value={longDate} />
            <View style={styles.divider} />
            <Info icon="clock-outline" label="Heure" value={time} />
            <View style={styles.divider} />
            <Info icon="flower-outline" label="Jour du cycle" value={`Jour ${cycleDay}`} />
          </View>

          <Pressable
            accessibilityLabel="Enregistrer ma note"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={({pressed}) => [
              styles.saveButton,
              pressed && styles.pressed,
              saving && styles.saveButtonDisabled,
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name={saving ? 'loading' : 'content-save'}
              size={22}
            />
            <Text style={styles.saveText}>
              {saving ? 'Enregistrement…' : 'Enregistrer ma note'}
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
              color="#FFFFFF"
              name="check"
              size={14}
            />
          </View>

          <Text style={styles.toastText}>
            Note enregistrée avec succès ✨
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
              color="#8E83A4"
              name="close"
              size={17}
            />
          </Pressable>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

function Info({icon, label, value}: {icon: string; label: string; value: string}): React.JSX.Element {
  return <View style={styles.info}><View style={styles.infoLabel}><MaterialDesignIcons color={PURPLE} name={icon as never} size={19} /><Text style={styles.infoLabelText}>{label}</Text></View><Text numberOfLines={1} style={styles.infoValue}>{value}</Text></View>;
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
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 8,
    paddingHorizontal: 13,
    gap: 9,
  },

  headerSmall: {
    minHeight: 64,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 7,
    paddingHorizontal: 10,
    gap: 7,
  },

  headerVerySmall: {
    minHeight: 58,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 6,
    paddingHorizontal: 8,
    gap: 6,
  },

  headerButton: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE5F1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  headerButtonSmall: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  title: {
    flexShrink: 1,
    color: DARK_PURPLE,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  titleSmall: {
    fontSize: 16,
  },

  date: {
    maxWidth: '100%',
    marginTop: 3,
    color: '#777081',
    fontSize: 10.5,
    textAlign: 'center',
  },

  dateSmall: {
    fontSize: 8.8,
  },

  hideButton: {
    height: 39,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EAE2F0',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  hideButtonSmall: {
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  hideText: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: '700',
  },

  hideTextSmall: {
    fontSize: 9,
  },

  content: {
    paddingTop: 8,
    paddingHorizontal: 13,
    gap: 10,
  },

  contentSmall: {
    paddingTop: 6,
    paddingHorizontal: 10,
    gap: 8,
  },

  contentVerySmall: {
    paddingTop: 5,
    paddingHorizontal: 8,
    gap: 7,
  },

  hero: {
    height: 174,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#EFDFF6',
  },

  heroSmall: {
    height: 150,
    borderRadius: 16,
  },

  heroVerySmall: {
    height: 136,
  },

  heroImage: {
    borderRadius: 18,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '53%',
    paddingLeft: 17,
    paddingTop: 10,
  },

  heroCopySmall: {
    width: '56%',
    paddingLeft: 13,
    paddingTop: 7,
  },

  heroTitle: {
    color: DARK_PURPLE,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },

  heroText: {
    marginTop: 8,
    color: '#4F4364',
    fontSize: 10.5,
    lineHeight: 15,
  },

  privateBadge: {
    alignSelf: 'flex-start',
    height: 30,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  privateBadgeText: {
    color: PURPLE,
    fontSize: 9.5,
    fontWeight: '700',
  },

  card: {
    paddingHorizontal: 11,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 18,
    backgroundColor: '#FFFDFF',
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
    paddingTop: 5,
  },

  sectionHeaderNoMargin: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 5,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F5EDFA',
  },

  sectionTitle: {
    color: DARK_PURPLE,
    fontSize: 14,
    fontWeight: '800',
  },

  optional: {
    fontSize: 9,
    fontWeight: '500',
  },

  noteBox: {
    height: 128,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DFEC',
    borderRadius: 13,
    backgroundColor: '#FCF8FD',
  },

  noteInput: {
    height: 103,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingRight: 35,
    color: '#3E3548',
    fontSize: 11.5,
    lineHeight: 17,
  },

  hiddenInput: {
    color: 'transparent',
  },

  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FBF7FC',
  },

  hiddenText: {
    color: '#836B9F',
    fontSize: 11,
    fontWeight: '700',
  },

  counter: {
    position: 'absolute',
    right: 11,
    bottom: 8,
    color: '#7E7686',
    fontSize: 8.5,
  },

  noteLeaf: {
    position: 'absolute',
    right: -2,
    bottom: -5,
    opacity: 0.7,
  },

  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 2,
  },

  photoHint: {
    maxWidth: 210,
    marginTop: 2,
    color: '#746D7A',
    fontSize: 8.3,
  },

  addPhotoButton: {
    height: 34,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#9C76CA',
    borderRadius: 10,
  },

  addPhotoText: {
    color: PURPLE,
    fontSize: 8.8,
    fontWeight: '700',
  },

  photoEmpty: {
    minHeight: 92,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CDB8DE',
    borderRadius: 13,
    backgroundColor: '#F7F0FA',
  },

  photoPlus: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: PURPLE,
  },

  photoEmptyTitle: {
    marginTop: 6,
    color: PURPLE,
    fontSize: 10,
    fontWeight: '700',
  },

  photoEmptyText: {
    marginTop: 2,
    color: '#83788B',
    fontSize: 8.2,
  },

  protection: {
    minHeight: 67,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F4EAF9',
  },

  protectionIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5BDE6',
    borderRadius: 19,
    backgroundColor: '#FAF6FC',
  },

  protectionCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 9,
  },

  protectionTitle: {
    color: DARK_PURPLE,
    fontSize: 10.5,
    fontWeight: '800',
  },

  protectionText: {
    marginTop: 3,
    color: '#665776',
    fontSize: 8.3,
    lineHeight: 12,
  },

  infoCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  info: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  infoLabelText: {
    color: '#777080',
    fontSize: 9,
  },

  infoValue: {
    maxWidth: '100%',
    marginTop: 5,
    color: DARK_PURPLE,
    fontSize: 9.5,
    fontWeight: '800',
  },

  divider: {
    width: 1,
    height: 39,
    backgroundColor: '#ECE5F0',
  },

  saveButton: {
    width: '88%',
    maxWidth: 360,
    height: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: PURPLE,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  saveButtonDisabled: {
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
    backgroundColor: PURPLE,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: DARK_PURPLE,
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