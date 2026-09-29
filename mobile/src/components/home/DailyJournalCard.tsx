import React, {memo, useEffect, useMemo, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {homeRadii} from './homeTheme';
import '../../i18n';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {JournalRoute} from '../journal/DailyJournalSheet';
import type {DailyJournalEntry, JournalSection} from '../../types/journal';

// PHASE C — no symptom/mood VALUE is color-coded here (that lives in each
// objective's own journal config, untouched) — the little checkmark badge is
// a generic "logged today" completion indicator, mapped to the theme's own
// success token; everything else is decorative chrome.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type Shortcut = {
  section: JournalSection;
  route: JournalRoute;
  icon: IconName;
  label: string;
  subtitle?: string;
};

type Props = {
  entry?: DailyJournalEntry;
  onNavigate: (route: JournalRoute) => void;
  /** Defaults to the original generic 8-item list so every existing caller
   * (CycleHomeScreen) is unaffected — lets an objective with different
   * priority daily items (e.g. Trying to Conceive) reuse this exact same
   * card design instead of a duplicated one. */
  shortcuts?: Shortcut[];
  /** Defaults to the original hardcoded title, same reasoning as above. */
  title?: string;
  /** True while a managed (daughter) profile is active — "Vie intime" is not
   * part of a managed profile's cycle-tracking experience (it stays a normal
   * part of the mother's own "Suivre mon cycle"/"Essayer de concevoir"
   * journal; the feature itself is never removed, only hidden from this
   * card's shortcut row for the affected profile). Defaults to false so
   * every existing caller is unaffected. */
  hideIntimacy?: boolean;
};

function DailyJournalCard({entry, onNavigate, shortcuts, title, hideIntimacy = false}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = useRef(new Animated.Value(0)).current;
  // Defaults computed here (not a module-level constant) so the original
  // generic 8-item list/title stay localized — every existing caller that
  // omits these props (CycleHomeScreen) is otherwise unaffected; a caller
  // passing its OWN shortcuts/title (e.g. an objective with different daily
  // items) keeps full control of that copy, untouched.
  const defaultShortcuts: Shortcut[] = useMemo(
    () => [
      {section: 'symptoms', route: 'SymptomEntry', icon: 'heart-outline', label: t('dailyJournal.symptoms')},
      {section: 'mood', route: 'MoodEntry', icon: 'emoticon-happy-outline', label: t('dailyJournal.mood')},
      {section: 'activity', route: 'ActivityEntry', icon: 'run', label: t('dailyJournal.activity')},
      {section: 'sleep', route: 'SleepEntry', icon: 'weather-night', label: t('dailyJournal.sleep')},
      {section: 'hydration', route: 'HydrationScreen', icon: 'cup-water', label: t('dailyJournal.hydration')},
      {section: 'flow', route: 'MenstrualFlowScreen', icon: 'water', label: t('dailyJournal.menstrualFlow')},
      {
        section: 'intimacy',
        route: 'PrivateIntimacyUnlock',
        icon: 'shield-lock-outline',
        label: t('dailyJournal.intimacy'),
        subtitle: t('dailyJournal.intimacySubtitle'),
      },
      {section: 'note', route: 'NoteEntry', icon: 'notebook-edit-outline', label: t('dailyJournal.notes')},
    ],
    [t],
  );
  const resolvedShortcuts = shortcuts ?? defaultShortcuts;
  const resolvedTitle = title ?? t('dailyJournal.title');
  const visibleShortcuts = hideIntimacy ? resolvedShortcuts.filter(shortcut => shortcut.section !== 'intimacy') : resolvedShortcuts;
  const completed = visibleShortcuts.filter(shortcut => Boolean(entry?.[shortcut.section])).length;
  const ratio = completed / visibleShortcuts.length;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      Animated.timing(progress, {
        toValue: ratio,
        duration: reduceMotion ? 0 : 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [progress, ratio]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{resolvedTitle}</Text>
        <Text style={styles.progressLabel}>{t('dailyJournal.completedOf', {completed, total: visibleShortcuts.length})}</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {width: progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']})},
          ]}
        />
      </View>

      <View style={styles.row}>
        {visibleShortcuts.map(shortcut => {
          const done = Boolean(entry?.[shortcut.section]);
          return (
            <Pressable
              accessibilityHint={shortcut.subtitle}
              accessibilityLabel={`${shortcut.label}${done ? t('dailyJournal.completedSuffix') : ''}`}
              accessibilityRole="button"
              key={shortcut.section}
              onPress={() => onNavigate(shortcut.route)}
              style={({pressed}) => [styles.item, pressed && styles.pressed]}>
              <View style={styles.iconWrap}>
                <View style={[styles.iconCircle, done && styles.iconCircleDone]}>
                  <MaterialDesignIcons color={done ? onPrimaryTextColor(theme) : theme.colors.primary} name={shortcut.icon} size={16} />
                </View>
                {done && (
                  <View style={styles.check}>
                    <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="check" size={9} />
                  </View>
                )}
              </View>
              <Text numberOfLines={2} style={styles.label}>{shortcut.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    progressLabel: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '600'},
    track: {marginTop: 10, height: 6, borderRadius: 3, backgroundColor: theme.colors.primarySoft, overflow: 'hidden'},
    fill: {height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary},
    row: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 12},
    item: {flexBasis: '25%', flexGrow: 0, alignItems: 'center', paddingHorizontal: 1, minWidth: 0},
    iconWrap: {width: 36, height: 36},
    iconCircle: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    iconCircleDone: {backgroundColor: theme.colors.primary},
    // Generic "logged today" completion badge — success token, not a
    // symptom/mood VALUE color.
    check: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.success,
    },
    label: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 9, lineHeight: 11.5, textAlign: 'center'},
    pressed: {opacity: 0.75},
  });
}

export default memo(DailyJournalCard);
