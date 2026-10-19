import {useToday} from '../../hooks/useToday';
import {useDaughterJournal} from '../../hooks/useDaughterJournal';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {presentSaveFailure} from '../../services/saveFailure';
import {ClearEntryButton} from '../../components/journal/ClearEntryButton';
import {JOURNAL_HERO_INK} from '../../components/journal/journalHeroInk';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {useJournalCycleDay} from '../../hooks/useJournalCycleDay';
import {encryptNoteSection, resolveNoteSection} from '../../services/privateNotesEncryption';
import {resolvePrivatePhotos} from '../../types/journal';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import {isIntimacyUnlocked} from '../../state/privateSectionAuthStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {dateFormatLocale} from '../../utils/cycleMath';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import '../../i18n';

const MAX = 1000;

export default function JournalNoteScreen(): React.JSX.Element | null {
  const {t} = useTranslation();
  // Managed daughter profile only (null for the mother, whose screen renders exactly as before): no illustrated hero,
  // no leaf / folder decorations, an "observation" wording from a parent's point of view with her first name. The
  // private-section gate and what is stored are unchanged.
  const {daughter, tx} = useDaughterJournal();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // "Notes personnelles" reuses the app's single existing intimacy PIN/
  // biometric gate (same as Vie intime/Rapports/Photos privées) — never a
  // Cycle-specific PIN. Computed once on mount so a locked screen never
  // renders its TextInput before the redirect effect below fires.
  const [unlocked] = useState(() => isIntimacyUnlocked());

  useEffect(() => {
    if (!isIntimacyUnlocked()) {
      navigation.replace('PrivateIntimacyUnlock', {target: 'cycleNotes'});
    }
  }, [navigation]);

  const [text, setText] = useState('');
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  // M25: true while a saved note exists for today (shows "Effacer").
  const [hasSavedNote, setHasSavedNote] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {today, todayKey: storageDate} = useToday();
  const now = new Date();
  const dateLocale = dateFormatLocale();
  const longDate = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const shortDate = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(now);
  const time = new Intl.DateTimeFormat(dateLocale, {
    hour: '2-digit', minute: '2-digit',
  }).format(now);
  // Null (no "Jour N du cycle" shown) when this objective/state has no valid
  // menstrual cycle day - see journalCycleDayFor().
  const cycleDay = useJournalCycleDay(today);

  // Today's already-saved note, decrypted through the same resolver every
  // other reader uses (encrypted shape first, legacy plaintext fallback), so
  // reopening shows it instead of an empty box and Save can't silently
  // replace it with nothing. Only after the private-section gate is open —
  // a locked screen never decrypts anything. `savedNote` remembers the
  // loaded text/updatedAt so an unchanged Save keeps the original timestamp.
  const savedNote = useRef<{text: string; updatedAt: string} | null>(null);
  useEffect(() => {
    if (!unlocked) {
      return undefined;
    }
    let active = true;
    getJournalEntry(storageDate)
      .then(resolveNoteSection)
      .then(({data}) => {
        if (!active || !data) {
          return;
        }
        savedNote.current = {text: data.text, updatedAt: data.updatedAt};
        setHasSavedNote(true);
        setText(data.text);
      });
    return () => {
      active = false;
    };
  }, [storageDate, unlocked]);

  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  // Reflects how many private photos already exist for today (0-5) so this
  // card never shows a stale "Ajouter" prompt — kept in sync on focus since
  // photos are added/removed on a different screen (PrivatePhotoEntry) that
  // we navigate away to and back from. resolvePrivatePhotos() also covers a
  // legacy single-photo entry saved before multi-photo support existed.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getJournalEntry(storageDate).then(entry => {
        if (active) {setPhotoCount(resolvePrivatePhotos(entry).length);}
      });
      return () => {active = false;};
    }, [storageDate]),
  );

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
        t('journalNote.personalNoteTitle'),
        t('journalNote.writeAFewWords'),
      );
      return;
    }

    try {
      setSaving(true);

      // Saving an untouched note is idempotent: same text, same timestamp.
      const updatedAt = savedNote.current && savedNote.current.text.trim() === text.trim()
        ? savedNote.current.updatedAt
        : new Date().toISOString();
      const encrypted = await encryptNoteSection({text: text.trim(), updatedAt});
      await saveJournalSection(storageDate, 'encryptedNote', encrypted);
      savedNote.current = {text: text.trim(), updatedAt};
      // A fresh encrypted note supersedes any legacy plaintext note for the
      // same day — safe to drop now that the encrypted write above has
      // already succeeded (never the other way around).
      await deleteJournalSection(storageDate, 'note');
      setHasSavedNote(true);

      showSuccessToast();
    } catch (saveError) {
      presentSaveFailure(saveError, {title: t('journalNote.errorTitle'), message: tx('journalNote.errorMessage', 'note.errorMessage')});
    } finally {
      setSaving(false);
    }
  };

  // M25: an empty note is refused on Save, so a saved note could never be
  // removed. Deletes today's encrypted note (and any legacy plaintext copy):
  // section absent = the canonical empty state; reopening shows an empty box.
  const clearNote = async () => {
    try {
      await deleteJournalSection(storageDate, 'encryptedNote');
      await deleteJournalSection(storageDate, 'note');
    } catch (saveError) {
      presentSaveFailure(saveError);
      return;
    }
    savedNote.current = null;
    setHasSavedNote(false);
    setText('');
    navigation.goBack();
  };

  if (!unlocked) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.statusBarStyle} />
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
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            onPress={navigation.goBack}
          />

          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <AwaText numberOfLines={2} style={styles.title} variant="headlineSmall">
                {tx('journalNote.personalNotesTitle', 'titles.note')}
              </AwaText>

              <MaterialDesignIcons
                color={theme.colors.primary}
                name="shield-lock-outline"
                size={isSmallScreen ? 18 : 21}
              />
            </View>

            <AwaText colorRole="onSurfaceVariant" numberOfLines={2} style={styles.date} variant="bodySmall">
              {cycleDay !== null ? t('journalActivity.dateWithCycleDay', {date: shortDate, day: cycleDay}) : shortDate}
            </AwaText>
          </View>

          {width >= 400 ? (
            <AwaButton
              accessibilityLabel={hidden ? t('journalNote.showNote') : t('journalNote.hideNote')}
              icon={hidden ? 'eye-outline' : 'eye-off-outline'}
              label={hidden ? t('journalNote.show') : t('journalNote.hide')}
              onPress={() => setHidden(value => !value)}
              size="compact"
              variant="outlined"
            />
          ) : (
            <AwaIconButton
              accessibilityLabel={hidden ? t('journalNote.showNote') : t('journalNote.hideNote')}
              icon={hidden ? 'eye-outline' : 'eye-off-outline'}
              onPress={() => setHidden(value => !value)}
              variant="outlined"
            />
          )}
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
          {daughter ? null : (
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
              <Text style={styles.heroTitle}>{t('journalNote.heroTitle')}</Text>
              <Text style={styles.heroText}>{t('journalNote.heroText')}</Text>
              <View style={styles.privateBadge}>
                <MaterialDesignIcons color={JOURNAL_HERO_INK.accent} name="lock" size={15} />
                <Text style={styles.privateBadgeText}>{t('journalNote.privateBadge')}</Text>
              </View>
            </View>
          </ImageBackground>
          )}

          <AwaCard padding="default" variant="outlined" style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}><MaterialDesignIcons color={theme.colors.primary} name="pencil-outline" size={23} /></View>
              <Text style={styles.sectionTitle}>{tx('journalNote.todaysNoteTitle', 'note.observationTitle')}</Text>
            </View>
            <View style={styles.noteBox}>
              <TextInput
                editable={!hidden}
                maxLength={MAX}
                multiline
                onChangeText={setText}
                placeholder={t('journalSleep.notePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.noteInput, hidden && styles.hiddenInput]}
                textAlignVertical="top"
                value={text}
              />
              {hidden && <View pointerEvents="none" style={styles.hiddenOverlay}><MaterialDesignIcons color={theme.colors.textMuted} name="lock-outline" size={24} /><Text style={styles.hiddenText}>{t('journalNote.noteHidden')}</Text></View>}
              <Text style={styles.counter}>{text.length} / {MAX}</Text>
              {daughter ? null : <MaterialDesignIcons color={theme.colors.secondary} name="sprout" size={34} style={styles.noteLeaf} />}
            </View>
          </AwaCard>

          <AwaCard padding="default" variant="outlined" style={styles.card}>
            <View style={styles.photoHeader}>
              <View style={styles.sectionHeaderNoMargin}>
                <View style={styles.sectionIcon}><MaterialDesignIcons color={theme.colors.primary} name="camera-outline" size={23} /></View>
                <View style={styles.photoHeaderCopy}><Text style={styles.sectionTitle}>{t('journalNote.privatePhotosTitle')} <Text style={styles.optional}>{t('journalMood.optional')}</Text></Text><Text style={styles.photoHint}>{tx('journalNote.privatePhotosHint', 'note.photosHint')}</Text></View>
              </View>

            </View>
            {photoCount > 0 ? (
              <Pressable onPress={() => navigation.navigate('PrivatePhotoEntry')} style={[styles.photoEmpty, styles.photoAdded]}>
                <View style={[styles.photoPlus, styles.photoAddedIcon]}><MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="check" size={24} /></View>
                <Text style={styles.photoEmptyTitle}>{t('journalNote.photosAddedCount', {count: photoCount})}</Text>
                <Text style={styles.photoEmptyText}>{t('journalNote.tapToViewReplaceDelete')}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.navigate('PrivatePhotoEntry')} style={styles.photoEmpty}>
                <View style={styles.photoPlus}><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={29} /></View>
                <Text style={styles.photoEmptyTitle}>{t('journalNote.addPrivatePhotos')}</Text>
                <Text style={styles.photoEmptyText}>{tx('journalNote.photosStayOnDevice', 'note.photosOnDevice')}</Text>
              </Pressable>
            )}

            <View style={styles.protection}>
              <View style={styles.protectionIcon}><MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={27} /></View>
              <View style={styles.protectionCopy}><Text style={styles.protectionTitle}>{tx('journalNote.dataProtectedTitle', 'note.protectedTitle')}</Text><Text style={styles.protectionText}>{tx('journalNote.dataProtectedText', 'note.protectedText')}</Text></View>
              {daughter ? null : <MaterialDesignIcons color={theme.colors.secondary} name="folder-lock-outline" size={39} />}
            </View>
          </AwaCard>

          <View style={styles.infoCard}>
            <Info icon="calendar-month-outline" label={t('journalNote.dateLabel')} value={longDate} />
            <View style={styles.divider} />
            <Info icon="clock-outline" label={t('journalNote.timeLabel')} value={time} />
            {cycleDay !== null ? (
              <>
                <View style={styles.divider} />
                <Info icon="flower-outline" label={t('journalNote.cycleDayLabel')} value={t('journalNote.cycleDayValue', {day: cycleDay})} />
              </>
            ) : null}
          </View>

          <AwaButton
            accessibilityLabel={tx('journalNote.saveMyNote', 'note.saveLabel')}
            icon="content-save"
            label={saving ? t('periodStartSheet.saving') : tx('journalNote.saveMyNote', 'note.saveLabel')}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.saveButton}
          />

          {hasSavedNote ? <ClearEntryButton onConfirm={clearNote} subject={t('journalNote.clearSubject')} /> : null}
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
            {t('journalNote.savedToast')}
          </Text>

          <Pressable
            accessibilityLabel={t('common.close')}
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
    </SafeAreaView>
  );
}

function Info({icon, label, value}: {icon: string; label: string; value: string}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.info}><View style={styles.infoLabel}><MaterialDesignIcons color={theme.colors.primary} name={icon as never} size={19} /><Text style={styles.infoLabelText}>{label}</Text></View><Text numberOfLines={2} style={styles.infoValue}>{value}</Text></View>;
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

    title: {flexShrink: 1, textAlign: 'center'},

    photoHeaderCopy: {flex: 1, minWidth: 0},

    date: {maxWidth: '100%', textAlign: 'center'},

    hideButton: {
      height: 39,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },

    hideButtonSmall: {
      height: 36,
      paddingHorizontal: 8,
      borderRadius: 12,
    },

    hideText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    hideTextSmall: {
      fontSize: 11,
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
      minHeight: 174,
      justifyContent: 'center',
      paddingVertical: 12,
      overflow: 'hidden',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },

    heroSmall: {
      minHeight: 150,
      borderRadius: 16,
    },

    heroVerySmall: {
      minHeight: 136,
    },

    heroImage: {
      borderRadius: 12,
      resizeMode: 'cover',
    },

    heroCopy: {
      width: '48%',
      paddingLeft: 17,
      paddingTop: 10,
    },

    heroCopySmall: {
      width: '52%',
      paddingLeft: 13,
      paddingTop: 7,
    },

    heroTitle: {
      color: JOURNAL_HERO_INK.title,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
    },

    heroText: {
      marginTop: 8,
      color: JOURNAL_HERO_INK.body,
      fontSize: 11,
      lineHeight: 16,
    },

    // Sits on top of the fixed illustration photo (FIXED VISUAL ISLAND) — a
    // translucent white scrim is kept regardless of theme so the badge text
    // stays legible against that same unthemed image.
    privateBadge: {
      alignSelf: 'flex-start',
      minHeight: 30,
      marginTop: 12,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.86)',
    },

    privateBadgeText: {
      color: JOURNAL_HERO_INK.accent,
      fontSize: 11,
      fontWeight: '700',
    },

    card: {paddingHorizontal: 11, paddingTop: 14, paddingBottom: 12},

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
      backgroundColor: theme.colors.primarySoft,
    },

    sectionTitle: {
      color: theme.colors.accent,
      fontSize: 14,
      fontWeight: '800',
    },

    optional: {
      fontSize: 11,
      fontWeight: '500',
    },

    noteBox: {
      height: 128,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    noteInput: {
      height: 103,
      paddingHorizontal: 12,
      paddingTop: 11,
      paddingRight: 35,
      color: theme.colors.text,
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
      backgroundColor: theme.colors.surfaceSecondary,
    },

    hiddenText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },

    counter: {
      position: 'absolute',
      right: 11,
      bottom: 8,
      color: theme.colors.textMuted,
      fontSize: 11,
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
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },

    addPhotoButton: {
      height: 34,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.4),
      borderRadius: 12,
    },

    addPhotoText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    photoEmpty: {
      minHeight: 92,
      marginTop: 10,
      paddingVertical: 10, paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },

    photoAdded: {
      borderStyle: 'solid',
      borderColor: withAlpha(theme.colors.primary, 0.45),
      backgroundColor: theme.colors.primarySoft,
    },

    photoPlus: {
      width: 39,
      height: 39,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
    },

    photoAddedIcon: {
      backgroundColor: theme.colors.success,
    },

    photoEmptyTitle: {
      marginTop: 6,
      paddingHorizontal: 12,
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },

    photoEmptyText: {
      marginTop: 2,
      paddingHorizontal: 12,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      textAlign: 'center',
    },

    protection: {
      minHeight: 67,
      marginTop: 10,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },

    protectionIcon: {
      width: 38,
      height: 38,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 19,
      backgroundColor: theme.colors.surface,
    },

    protectionCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 9,
    },

    protectionTitle: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },

    protectionText: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },

    infoCard: {
      minHeight: 72,
      paddingVertical: 10, paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },

    info: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      paddingHorizontal: 5,
    },

    infoLabel: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    infoLabelText: {
      flexShrink: 1,
      color: theme.colors.textSecondary,
      fontSize: 11,
    },

    infoValue: {
      maxWidth: '100%',
      marginTop: 5,
      color: theme.colors.accent,
      fontSize: 11,
      textAlign: 'center',
      fontWeight: '800',
    },

    divider: {
      width: 1,
      height: 39,
      backgroundColor: withAlpha(theme.colors.primary, 0.12),
    },

    saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center', marginTop: 4, marginBottom: 8},

    toast: {
      position: 'absolute',
      left: '7%',
      right: '7%',
      zIndex: 100,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.16),
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 6,
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

    pressed: {
      opacity: 0.8,
      transform: [{scale: 0.98}],
    },
  });
}