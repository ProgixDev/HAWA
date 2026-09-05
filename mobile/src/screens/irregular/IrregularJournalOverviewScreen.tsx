import React, {useCallback, useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {TOP_SPACING_EXTRA} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {capitalize} from '../../utils/cycleMath';
import type {FlowIntensity} from '../../types/journal';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {
  getIrregularJournalEntry,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
  type IrregularJournalEntry,
} from '../../state/irregularJournalStore';
import {IRREGULAR_JOURNAL_ITEMS} from '../../config/irregularJournalConfig';
import {computeIrregularDailyProgress} from '../../utils/irregularDailyTrackingMath';

// The SOPK Daily Journal's full-screen overview — reached from
// IrregularDashboard.tsx's "Suivi du jour" card (tapping the card header or
// "Compléter mon journal"). This is a NEW presentational screen (no other
// AWA objective has one yet — they only have the shared DailyJournalSheet
// bottom sheet, still used here too via "Journal quotidien"), but every piece
// of DATA and every navigation target it uses is the exact same
// canonical source IrregularDashboard.tsx already reads/writes — see
// computeIrregularDailyProgress (irregularDailyTrackingMath.ts),
// getIrregularJournalEntry (irregularJournalStore.ts) and getJournalEntry's
// `flow` field (dailyJournalStore.ts, shared with every other objective for
// "Règles"). No second source of truth is introduced.

const FLOW_LABELS: Record<FlowIntensity, string> = {
  light: 'Léger',
  moderate: 'Modéré',
  heavy: 'Abondant',
  veryHeavy: 'Très abondant',
  none: 'Pas de règles',
};

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');

function IrregularJournalOverviewScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today), [today]);

  const [todayEntry, setTodayEntry] = useState<IrregularJournalEntry | undefined>(() =>
    getIrregularJournalEntry(todayKey),
  );
  const [periodIntensity, setPeriodIntensity] = useState<FlowIntensity | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateIrregularJournal().then(() => {
        if (active) {setTodayEntry(getIrregularJournalEntry(todayKey));}
      });
      const unsubscribe = subscribeIrregularJournal(() => {
        if (active) {setTodayEntry(getIrregularJournalEntry(todayKey));}
      });

      getJournalEntry(todayKey).then(entry => {
        if (active) {setPeriodIntensity(entry?.flow?.intensity);}
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, [todayKey]),
  );

  const periodDoneToday = periodIntensity !== undefined;

  const progress = useMemo(
    () => computeIrregularDailyProgress(periodDoneToday, todayEntry, IRREGULAR_JOURNAL_ITEMS.map(item => item.key)),
    [periodDoneToday, todayEntry],
  );
  const progressRatio = progress.total > 0 ? progress.completed / progress.total : 0;

  const dateLabel = useMemo(
    () => capitalize(new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(today)),
    [today],
  );

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 24}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={24} />
            </Pressable>

            <View style={styles.headerCopy}>
              <Text style={styles.title}>Journal du jour</Text>
              <Text style={styles.subtitle}>{dateLabel}</Text>
            </View>

            <Pressable
              accessibilityLabel="Voir le calendrier"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => navigation.navigate('MainTabs', {screen: 'Calendar'})}
              style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={21} />
            </Pressable>
          </View>

          {/* PROGRESS CARD */}
          <View style={styles.progressCard}>
            <View style={styles.progressTopRow}>
              <View style={styles.progressCopy}>
                <Text style={styles.progressTitle}>Ton suivi du jour</Text>
                <Text style={styles.progressDescription}>
                  Chaque petite donnée compte. Prends quelques instants pour ton suivi.
                </Text>
              </View>

              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeValue}>
                  {progress.completed} / {progress.total}
                </Text>
                <Text style={styles.progressBadgeLabel}>complété</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${Math.round(progressRatio * 100)}%`}]} />
            </View>
          </View>

          {/* CATEGORY LIST */}
          <View style={styles.card}>
            <JournalRow
              done={periodDoneToday}
              icon="water-outline"
              isFirst
              label="Règles"
              onPress={() => navigation.navigate('IrregularJournalEntry', {category: 'period'})}
              value={periodIntensity ? FLOW_LABELS[periodIntensity] : 'Renseigne le début de tes règles'}
            />

            {IRREGULAR_JOURNAL_ITEMS.map(item => {
              const recorded = todayEntry?.[item.key];
              const done = Boolean(recorded);
              return (
                <JournalRow
                  done={done}
                  icon={item.icon}
                  key={item.key}
                  label={item.label}
                  onPress={() => navigation.navigate('IrregularJournalEntry', {category: item.key})}
                  value={done ? (recorded as string) : item.dashboardSubtitle}
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function JournalRow({
  icon,
  label,
  value,
  done,
  onPress,
  isFirst = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  done: boolean;
  onPress: () => void;
  isFirst?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={`${label}${done ? ', enregistré' : ''}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.row, !isFirst && styles.rowBorder, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, done && styles.rowIconDone]}>
        <MaterialDesignIcons color={done ? onPrimaryTextColor(theme) : theme.colors.primary} name={icon} size={19} />
      </View>

      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.rowValue}>{value}</Text>
      </View>

      <View style={[styles.rowState, done && styles.rowStateDone]}>
        {done ? (
          <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="check" size={13} />
        ) : (
          <MaterialDesignIcons color={theme.colors.primary} name="plus" size={15} />
        )}
      </View>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05),
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},

  header: {flexDirection: 'row', alignItems: 'center'},
  headerButton: {
    ...theme.shadow,
    width: 46, height: 46, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 17, backgroundColor: theme.colors.surface,
  },
  headerCopy: {flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 8},
  title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 19, fontWeight: '800', textAlign: 'center'},
  subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, textAlign: 'center'},

  progressCard: {
    ...theme.shadow,
    marginTop: 18, padding: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.97),
  },
  progressTopRow: {flexDirection: 'row', alignItems: 'flex-start'},
  progressCopy: {flex: 1, minWidth: 0, paddingRight: 10},
  progressTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16.5, fontWeight: '800'},
  progressDescription: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
  progressBadge: {
    minWidth: 62, flexShrink: 0, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 16, backgroundColor: theme.colors.primarySoft,
  },
  progressBadgeValue: {color: theme.colors.primary, fontSize: 15, fontWeight: '800'},
  progressBadgeLabel: {marginTop: 1, color: theme.colors.primary, fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase'},
  progressTrack: {
    height: 7, marginTop: 14, overflow: 'hidden', borderRadius: 4, backgroundColor: theme.colors.primarySoft,
  },
  progressFill: {height: '100%', borderRadius: 4, backgroundColor: theme.colors.primary},

  card: {
    ...theme.shadow,
    marginTop: 16, paddingHorizontal: 6, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.97),
  },

  row: {flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: 10, gap: 12},
  rowBorder: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.14)},
  rowIcon: {
    width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, backgroundColor: theme.colors.primarySoft,
  },
  rowIconDone: {backgroundColor: theme.colors.primary},
  rowCopy: {flex: 1, minWidth: 0},
  rowLabel: {color: theme.colors.text, fontSize: 13.5, fontWeight: '800'},
  rowValue: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},
  rowState: {
    width: 26, height: 26, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: theme.colors.primarySoft,
  },
  // Generic "logged today" completion badge — a success token, not a
  // symptom/severity claim, same convention as IrregularDashboard.tsx's
  // dailyItemDone.
  rowStateDone: {backgroundColor: theme.colors.success},

  pressed: {opacity: 0.82},
  });
}

export default IrregularJournalOverviewScreen;
