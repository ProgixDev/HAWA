import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {PartnerMainTabParamList} from '../../../navigation/PartnerMainTabNavigator';

import CycleProgressRing from '../../../components/home/CycleProgressRing';
import {ENERGY_LABELS, MOOD_LABELS, getCyclePhaseIdentity} from '../../../components/home/HeroCycleCard';
import {homeColors} from '../../../components/home/homeTheme';
import {useAwaADeuxPartnerIdentity} from '../../../hooks/useAwaADeuxPartnerIdentity';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import {useToday} from '../../../hooks/useToday';
import {getJournalEntry} from '../../../state/dailyJournalStore';
import type {SharingKey} from '../../../state/awaADeuxSharingStore';
import type {DailyJournalEntry} from '../../../types/journal';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {computePartnerCycleInfo} from '../../../utils/awaADeuxPartnerCycleInfo';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {diffDays, startOfDay, type ComputedCyclePhase} from '../../../utils/cycleMath';
import PartnerScreenBackground from './PartnerScreenBackground';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// PartnerHome is read-only. Every health value comes from computePartnerCycleInfo() (the
// SAME cycleMath source of truth the owner's own Cycle dashboard uses) or, for mood/energy,
// from the owner's own real dailyJournalStore entry — never a fabricated example. Visibility
// remains controlled by computePartnerVisibility(): a field with its permission off never
// enters the tree, not even as a "not shared" placeholder.
//
// The animated ring is the OWNER's own ring component (CycleProgressRing, extracted from
// HeroCycleCard/"Suivi de cycle") — not a second implementation. Only the phase-specific
// color/label (getCyclePhaseIdentity) and the day/length numbers are supplied here.
const PARTNER_PHASE_MESSAGES: Record<ComputedCyclePhase, string> = {
  menstruation: 'Ses règles sont en cours. Un peu de soutien peut faire la différence.',
  follicular: 'Elle est actuellement dans sa phase folliculaire.',
  fertile: 'Sa fenêtre fertile a commencé, reste à l’écoute de ses besoins.',
  ovulation: 'Son ovulation est estimée aujourd’hui.',
  luteal: 'Elle est actuellement dans sa phase lutéale.',
};

// A short, generic partner-facing suggestion per phase — never a health value, just tone.
// Adapted from HeroCycleCard's own owner-facing `tip` wording (e.g. "Écoute-toi" → "Écoute-la").
const PARTNER_TIPS: Record<ComputedCyclePhase, string> = {
  menstruation: 'Douceur & repos',
  follicular: 'Encouragez-la',
  fertile: 'Écoute-la',
  ovulation: 'Un mot doux',
  luteal: 'Patience & calme',
};
const GENERAL_TIP = 'Restez à l’écoute';

// Same semantic accent colors already used for these exact categories elsewhere in AWA à
// deux (PartnerProfileScreen's "Informations auxquelles vous avez accès" access rows) —
// reused, not re-invented, so a category always looks the same everywhere it appears.
function accentColorFor(key: SharingKey, theme: ResolvedAwaTheme): string {
  if (key === 'periodStatus' || key === 'nextPeriod') {return homeColors.pink;}
  if (key === 'fertileWindow' || key === 'fertilityStatus') {return homeColors.green;}
  if (key === 'ovulation') {return theme.colors.accent;}
  return theme.colors.primary;
}

export default function PartnerHomeScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  // Typed against the PARTNER tab navigator itself (not the root stack): this is a same-
  // navigator tab switch, not a new screen — same pattern as the owner's own HomeHeader
  // (CycleHomeScreen.tsx: `navigation.navigate('Profile')`), just for PartnerMainTabs.
  const navigation = useNavigation<BottomTabNavigationProp<PartnerMainTabParamList>>();
  // THE single resolved partner identity — same hook/rule PartnerProfileScreen's own
  // "Prénom" row uses, so the two screens can never show a different name (see the
  // hook's header comment). Never a hardcoded fallback: hasName gates the whole line.
  const {name: partnerFirstName, hasName: hasPartnerFirstName} = useAwaADeuxPartnerIdentity();
  const {width} = useWindowDimensions();
  const compact = width < 360;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);

  const {toggles, isPregnant} = useAwaADeuxSharing();
  const {today} = useToday();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const info = useMemo(() => computePartnerCycleInfo(today), [today]);

  const showCycle = visibility.fields.cycleDay;
  const showNextPeriod = visibility.fields.nextPeriod;
  const showPeriodStatus = visibility.fields.periodStatus;
  const showFertileWindow = visibility.fields.fertileWindow;
  const showOvulation = visibility.fields.ovulation;
  const showMood = visibility.fields.mood;
  const showAdvice = visibility.fields.dailyAdvice;
  const hasSharedCycleInformation = showCycle || showNextPeriod || showPeriodStatus || showFertileWindow || showOvulation;

  // Real, today-only mood entry — only ever read when it is actually shared; never
  // fabricated when absent (the energy/mood chips simply don't render, see below).
  const [moodEntry, setMoodEntry] = useState<DailyJournalEntry['mood'] | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      if (!showMood) {
        setMoodEntry(undefined);
        return undefined;
      }
      let mounted = true;
      getJournalEntry(today.toLocaleDateString('en-CA')).then(entry => {
        if (mounted) {setMoodEntry(entry?.mood);}
      });
      return () => {mounted = false;};
    }, [showMood, today]),
  );

  const phaseIdentity = info.phase ? getCyclePhaseIdentity(info.phase) : null;
  const phaseMessage = info.phase
    ? PARTNER_PHASE_MESSAGES[info.phase]
    : 'Les informations de son cycle ne sont pas disponibles pour le moment.';
  const tip = info.phase ? PARTNER_TIPS[info.phase] : GENERAL_TIP;

  const nextPeriodTiming = info.nextPeriodDate ? formatFutureTiming(info.nextPeriodDate, today) : undefined;
  const fertileWindowTiming = info.fertileWindowRange ? formatFertileTiming(info.fertileWindowRange, today) : undefined;
  const ovulationTiming = info.ovulationDate ? formatFutureTiming(info.ovulationDate, today) : undefined;

  const periodStatusValue = info.phase ? (info.phase === 'menstruation' ? 'En cours' : 'Non en cours') : 'Information non disponible';
  const fertileWindowStatusValue = fertileWindowTiming
    ? fertileWindowTiming === 'Aujourd’hui' || fertileWindowTiming.startsWith('Encore')
      ? 'En cours'
      : fertileWindowTiming
    : info.fertileWindow ?? 'Information non disponible';

  const sharedTiles: Array<{key: SharingKey; icon: IconName; shortLabel: string; value: string}> = [
    showCycle ? {key: 'cycleDay', icon: 'calendar-month-outline', shortLabel: 'Cycle', value: info.cycleDay !== null ? `Jour ${info.cycleDay}` : 'Information non disponible'} : null,
    showPeriodStatus ? {key: 'periodStatus', icon: 'calendar-check-outline', shortLabel: 'Règles', value: periodStatusValue} : null,
    showFertileWindow ? {key: 'fertileWindow', icon: 'flower-outline', shortLabel: 'Fenêtre fertile', value: fertileWindowStatusValue} : null,
    showOvulation ? {key: 'ovulation', icon: 'water-outline', shortLabel: 'Ovulation', value: ovulationTiming ?? (info.ovulation ?? 'Information non disponible')} : null,
  ].filter((tile): tile is {key: SharingKey; icon: IconName; shortLabel: string; value: string} => tile !== null);

  const hasUpcomingEvents = showNextPeriod || showOvulation;

  return (
    <PartnerScreenBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top),
            paddingBottom: getFloatingTabBarClearance(insets.bottom, 16),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.greeting}>As-salamu ‘alaykum,</Text>
            {hasPartnerFirstName ? <Text numberOfLines={1} style={styles.partnerFirstName}>{`${partnerFirstName}`}</Text> : null}
            <Text style={styles.subtitle}>Tu es là pour elle 💜</Text>
          </View>

          {/* Same profile shortcut as the owner's own Cycle dashboard header
              (HomeHeader.tsx): identical icon, circular button, shadow and press
              feedback — only the destination differs (this tab navigator's own
              PartnerProfile tab, never the owner's ProfileScreen). */}
          <Pressable
            accessibilityLabel="Ouvrir mon profil"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate('PartnerProfile')}
            style={({pressed}) => [styles.profileButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="account-outline" size={22} />
          </Pressable>
        </View>

        {!hasSharedCycleInformation ? (
          <View style={styles.emptyCard}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="shield-lock-outline" size={22} />
            <Text style={styles.emptyText}>Aucune information n’est partagée avec vous pour le moment.</Text>
          </View>
        ) : (
          <>
            {showCycle ? (
              <View accessibilityLabel="Informations du cycle aujourd’hui" style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <CycleProgressRing
                    accessibilityLabel={info.cycleDay === null ? 'Jour du cycle indisponible' : `Jour ${info.cycleDay} du cycle`}
                    currentDay={info.cycleDay}
                    cycleLength={info.cycleLength ?? 1}
                    phaseLabel={phaseIdentity?.label ?? null}
                    ringColor={phaseIdentity?.ringColor ?? theme.colors.primary}
                    size={compact ? 100 : 116}
                  />

                  <View style={styles.heroCopy}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>Aujourd’hui</Text>
                      <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={16} />
                    </View>
                    <Text style={styles.heroMessage}>{phaseMessage}</Text>
                  </View>
                </View>

                {(showMood && moodEntry) || showAdvice ? (
                  <View style={styles.chipsRow}>
                    {showMood && moodEntry ? (
                      <>
                        <Chip icon="lightning-bolt-outline" label="Son énergie" styles={styles} theme={theme} value={ENERGY_LABELS[Math.min(5, Math.max(1, Math.round(moodEntry.energy)))] ?? 'Information non disponible'} />
                        <View style={styles.chipDivider} />
                        <Chip icon="emoticon-outline" label="Son humeur" styles={styles} theme={theme} value={MOOD_LABELS[moodEntry.level]} />
                      </>
                    ) : null}
                    {showAdvice ? (
                      <>
                        {showMood && moodEntry ? <View style={styles.chipDivider} /> : null}
                        <Chip icon="heart-outline" label="Mon conseil" styles={styles} theme={theme} value={tip} />
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {sharedTiles.length > 0 ? (
              <>
                <SectionHeader styles={styles} subtitle="Voici les informations qu’elle a choisi de partager." theme={theme} title="Informations partagées" />
                <ScrollView contentContainerStyle={styles.tileRow} horizontal showsHorizontalScrollIndicator={false}>
                  {sharedTiles.map(tile => (
                    <SharedInfoTile
                      key={tile.key}
                      accentColor={accentColorFor(tile.key, theme)}
                      icon={tile.icon}
                      label={tile.shortLabel}
                      styles={styles}
                      theme={theme}
                      value={tile.value}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}

            {hasUpcomingEvents ? (
              <>
                <SectionHeader styles={styles} subtitle="Les dates estimées selon les informations partagées." theme={theme} title="Prochains événements" />
                <View style={styles.eventsRow}>
                  {showNextPeriod ? (
                    <EventCard
                      icon="calendar-clock-outline"
                      iconColor={homeColors.pink}
                      label="Prochaines règles estimées"
                      styles={styles}
                      subtitle={nextPeriodTiming}
                      theme={theme}
                      value={info.nextPeriod ?? 'Information non disponible'}
                    />
                  ) : null}
                  {showOvulation ? (
                    <EventCard
                      icon="water-outline"
                      iconColor={theme.colors.accent}
                      label="Ovulation estimée"
                      styles={styles}
                      subtitle={ovulationTiming}
                      theme={theme}
                      value={info.ovulation ?? 'Information non disponible'}
                    />
                  ) : null}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </PartnerScreenBackground>
  );
}

function formatDayCount(prefix: 'Dans' | 'Encore', days: number): string {
  return `${prefix} ${days} jour${days > 1 ? 's' : ''}`;
}

/** Same local-day arithmetic as the Cycle dashboard; no UTC conversion or duplicate prediction. */
function formatFutureTiming(target: Date, today: Date): string | undefined {
  const days = diffDays(startOfDay(target), startOfDay(today));
  if (days < 0) {return undefined;}
  if (days === 0) {return 'Aujourd’hui';}
  return formatDayCount('Dans', days);
}

/** Relative wording derived only from the already-computed real fertile-window dates. */
function formatFertileTiming(range: {start: Date; end: Date}, today: Date): string | undefined {
  const day = startOfDay(today);
  const untilStart = diffDays(startOfDay(range.start), day);
  if (untilStart > 0) {return formatDayCount('Dans', untilStart);}

  const untilEnd = diffDays(startOfDay(range.end), day);
  if (untilEnd < 0) {return undefined;}
  return formatDayCount('Encore', untilEnd + 1);
}

function Chip({
  icon,
  label,
  value,
  theme,
  styles,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.chip}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={16} />
      <Text numberOfLines={2} style={styles.chipLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.chipValue}>{value}</Text>
    </View>
  );
}

/** Icon-circle + serif title + secondary subtitle, matching the SectionHeader convention
 * already established in PartnerProfileScreen.tsx (Informations personnelles / AWA à
 * deux). "Voir tout →" is decorative only — there is no dedicated destination screen for
 * this task, so it never triggers navigation (same convention used throughout AWA à deux
 * for non-functional affordances). */
function SectionHeader({
  title,
  subtitle,
  theme,
  styles,
}: {
  title: string;
  subtitle: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTopRow}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
        <View importantForAccessibility="no-hide-descendants" style={styles.sectionMoreRow}>
          <Text style={styles.sectionMoreText}>Voir tout</Text>
          <MaterialDesignIcons color={theme.colors.primary} name="arrow-right" size={13} />
        </View>
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SharedInfoTile({
  icon,
  label,
  value,
  accentColor,
  theme,
  styles,
}: {
  icon: IconName;
  label: string;
  value: string;
  accentColor: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, {backgroundColor: withAlpha(accentColor, theme.isDark ? 0.24 : 0.14)}]}>
        <MaterialDesignIcons color={accentColor} name={icon} size={20} />
      </View>
      <Text numberOfLines={2} style={styles.tileLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.tileValue}>{value}</Text>
      <View style={[styles.tileAccent, {backgroundColor: accentColor}]} />
    </View>
  );
}

function EventCard({
  icon,
  iconColor,
  label,
  subtitle,
  theme,
  value,
  styles,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  subtitle?: string;
  theme: ResolvedAwaTheme;
  value: string;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.eventCard}>
      <View style={[styles.eventIcon, {backgroundColor: withAlpha(iconColor, theme.isDark ? 0.22 : 0.14)}]}>
        <MaterialDesignIcons color={iconColor} name={icon} size={22} />
      </View>
      {/* Icon on its own row, label/value/timing below at the card's FULL width (not
          squeezed beside the icon) — the structural fix for "13 octo…"/"29 sept…"
          truncation: a real date always has the whole card width to wrap into. */}
      <Text style={styles.eventLabel}>{label}</Text>
      <Text style={styles.eventValue}>{value}</Text>
      {subtitle ? <Text style={styles.eventSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, compact: boolean) {
  return StyleSheet.create({
    content: {paddingHorizontal: 20, paddingBottom: 20},
    headerRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
    headerCopy: {flex: 1, minWidth: 0, marginRight: 12},
    greeting: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: compact ? 23 : 25,
      lineHeight: compact ? 29 : 31,
      fontWeight: '700',
    },
    // Strong/bold serif, visually prominent — the partner's own name, directly under the
    // greeting. Never a hardcoded color: same theme family as `greeting` above it.
    partnerFirstName: {
      marginTop: 2,
      color: theme.colors.primary,
      fontFamily: 'serif',
      fontSize: compact ? 22 : 24,
      lineHeight: compact ? 27 : 29,
      fontWeight: '800',
    },
    subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 14.5, lineHeight: 20},
    // Same circular profile-button chrome as the owner's own HomeHeader.tsx (Cycle
    // dashboard header): 44px, withAlpha(surface, 0.85), soft shadow, same pressed feedback.
    profileButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.surface, 0.85),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    pressed: {opacity: 0.8, transform: [{scale: 0.97}]},
    // Main "Aujourd'hui" card — same card chrome tokens used everywhere else in this
    // screen family (border/radius/surface/shadow), sized to comfortably hold the ring +
    // message on top and the energy/mood/conseil strip below.
    heroCard: {
      marginTop: 20,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, theme.isDark ? 0.3 : 0.18),
      borderRadius: 28,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.92 : 0.96),
      paddingHorizontal: compact ? 14 : 16,
      paddingTop: 16,
      paddingBottom: 14,
      ...theme.shadow,
    },
    heroTopRow: {flexDirection: 'row', alignItems: 'center', gap: compact ? 12 : 16},
    heroCopy: {flex: 1, minWidth: 0},
    heroTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
    heroTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: compact ? 17 : 19, lineHeight: compact ? 22 : 24, fontWeight: '800'},
    heroMessage: {marginTop: 6, color: theme.colors.textSecondary, fontSize: compact ? 12.5 : 13.5, lineHeight: compact ? 18 : 19},
    chipsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: 16,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    chip: {flex: 1, alignItems: 'center', paddingHorizontal: 2, minWidth: 0},
    chipDivider: {width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    chipLabel: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 9.5, textAlign: 'center'},
    chipValue: {marginTop: 2, color: theme.colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center'},
    // Section header — icon-less variant of PartnerProfileScreen's own SectionHeader
    // (title + subtitle), with a decorative "Voir tout →" trailing the title.
    sectionHeader: {marginTop: 24, marginBottom: 10},
    sectionHeaderTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    sectionTitle: {flex: 1, minWidth: 0, color: theme.colors.accent, fontFamily: 'serif', fontSize: 17, lineHeight: 22, fontWeight: '700'},
    sectionMoreRow: {flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8},
    sectionMoreText: {color: theme.colors.primary, fontSize: 12.5, fontWeight: '700'},
    sectionSubtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    // "Informations partagées" — a horizontally-scrolling strip of compact tiles so any
    // number of shared categories (1 to 4) stays comfortable on a narrow phone. Wide
    // enough for a full 2-line label/value (e.g. "Fenêtre fertile" / "Non en cours")
    // without truncating — the row scrolls rather than shrinking text to fit.
    tileRow: {gap: 10, paddingRight: 4},
    tile: {
      width: compact ? 108 : 122,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, theme.isDark ? 0.28 : 0.16),
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.96),
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 8,
      ...theme.shadow,
    },
    tileIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    tileLabel: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600'},
    tileValue: {marginTop: 2, color: theme.colors.text, fontSize: 13, fontWeight: '800'},
    tileAccent: {marginTop: 7, height: 3, borderRadius: 2, alignSelf: 'stretch'},
    // "Prochains événements" — up to two cards, icon on its own row so the label/value/
    // timing below always have the card's FULL width to wrap into (never squeezed next
    // to the icon) — this is what actually fixes the "13 octo…" truncation, not a font
    // shrink. `flex: 1` + `minWidth: 0` keep both cards responsive at any screen width;
    // a long value simply wraps onto a second line instead of being cut.
    eventsRow: {flexDirection: 'row', alignItems: 'stretch', gap: 12},
    eventCard: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, theme.isDark ? 0.3 : 0.2),
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.95),
      paddingHorizontal: 14,
      paddingVertical: 14,
      ...theme.shadow,
    },
    eventIcon: {
      width: compact ? 40 : 44,
      height: compact ? 40 : 44,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      marginBottom: 10,
    },
    eventLabel: {color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: '600'},
    eventValue: {marginTop: 4, color: theme.colors.text, fontSize: compact ? 14 : 15, lineHeight: compact ? 19 : 20, fontWeight: '800'},
    eventSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    emptyCard: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.95),
      padding: 16,
    },
    emptyText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20},
  });
}
