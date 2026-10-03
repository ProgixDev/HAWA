import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

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

// Matches `styles.content`'s `paddingHorizontal` below.
const CONTENT_HORIZONTAL_PADDING = 20;
const TILE_GAP = 10;
// A FIXED, compact square size for both "Informations partagées" and "Prochains
// événements" tiles — deliberately NOT derived from the item count or the
// available row width. One card must look exactly the same, and stay exactly
// this small, whether it's alone or one of four; only the device's own width
// class (compact vs. regular, the same `compact` flag already used for the
// ring/greeting elsewhere on this screen) picks between the two sizes below.
// When the row's natural content width (count × (size + gap)) exceeds the
// screen, the row scrolls horizontally instead of shrinking or stretching any
// card — see styles.tileRow / styles.tileScroll.
export const TILE_SIZE_COMPACT = 108;
export const TILE_SIZE_REGULAR = 122;

// PartnerHome is read-only. Every health value comes from computePartnerCycleInfo() (the
// SAME cycleMath source of truth the owner's own Cycle dashboard uses) or, for mood/energy,
// from the owner's own real dailyJournalStore entry — never a fabricated example. Visibility
// remains controlled by computePartnerVisibility(): a field with its permission off never
// enters the tree, not even as a "not shared" placeholder.
//
// The animated ring is the OWNER's own ring component (CycleProgressRing, extracted from
// HeroCycleCard/"Suivi de cycle") — not a second implementation. Only the phase-specific
// color/label (getCyclePhaseIdentity) and the day/length numbers are supplied here.
const partnerPhaseMessagesOf = (t: (key: string) => string): Record<ComputedCyclePhase, string> => ({
  menstruation: t('awaADeux.partnerSide.home.phaseMessageMenstruation'),
  follicular: t('awaADeux.partnerSide.home.phaseMessageFollicular'),
  fertile: t('awaADeux.partnerSide.home.phaseMessageFertile'),
  ovulation: t('awaADeux.partnerSide.home.phaseMessageOvulation'),
  luteal: t('awaADeux.partnerSide.home.phaseMessageLuteal'),
});

// A short, generic partner-facing suggestion per phase — never a health value, just tone.
// Adapted from HeroCycleCard's own owner-facing `tip` wording (e.g. "Écoute-toi" → "Écoute-la").
const partnerTipsOf = (t: (key: string) => string): Record<ComputedCyclePhase, string> => ({
  menstruation: t('awaADeux.partnerSide.home.tipMenstruation'),
  follicular: t('awaADeux.partnerSide.home.tipFollicular'),
  fertile: t('awaADeux.partnerSide.home.tipFertile'),
  ovulation: t('awaADeux.partnerSide.home.tipOvulation'),
  luteal: t('awaADeux.partnerSide.home.tipLuteal'),
});

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
  const {t} = useTranslation();
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

  const partnerPhaseMessages = partnerPhaseMessagesOf(t);
  const partnerTips = partnerTipsOf(t);

  // getCyclePhaseIdentity()'s own `label` is a hardcoded-French legacy value
  // (PHASE_INSIGHTS in HeroCycleCard.tsx) — HeroCycleCard itself already
  // moved its own display label to the shared `cyclePhase.*` i18n keys and
  // only kept exporting the old label for other, not-yet-migrated callers.
  // PartnerHome must use the same translated keys for the ring label; only
  // `ringColor` still comes from getCyclePhaseIdentity().
  const phaseIdentity = info.phase ? getCyclePhaseIdentity(info.phase) : null;
  const phaseLabel = info.phase ? t(`cyclePhase.${info.phase}`) : null;
  const phaseMessage = info.phase
    ? partnerPhaseMessages[info.phase]
    : t('awaADeux.partnerSide.home.phaseMessageUnavailable');
  const tip = info.phase ? partnerTips[info.phase] : t('awaADeux.partnerSide.home.tipGeneral');

  const nextPeriodTiming = info.nextPeriodDate ? formatFutureTiming(info.nextPeriodDate, today, t) : undefined;
  const fertileWindowTiming = info.fertileWindowRange ? formatFertileTiming(info.fertileWindowRange, today, t) : undefined;
  const ovulationTiming = info.ovulationDate ? formatFutureTiming(info.ovulationDate, today, t) : undefined;

  const infoUnavailable = t('awaADeux.partnerSide.home.infoUnavailable');
  const periodStatusValue = info.phase
    ? (info.phase === 'menstruation' ? t('awaADeux.partnerSide.home.periodInProgress') : t('awaADeux.partnerSide.home.periodNotInProgress'))
    : infoUnavailable;
  // "En cours" (in progress) whenever today falls inside the fertile window itself — a date
  // comparison, never a match on the translated countdown text (which would break per-locale).
  const fertileInProgress = info.fertileWindowRange
    ? diffDays(startOfDay(info.fertileWindowRange.start), startOfDay(today)) <= 0 &&
      diffDays(startOfDay(info.fertileWindowRange.end), startOfDay(today)) >= 0
    : false;
  const fertileWindowStatusValue = fertileInProgress
    ? t('awaADeux.partnerSide.home.periodInProgress')
    : fertileWindowTiming ?? info.fertileWindow ?? infoUnavailable;

  const sharedTiles: Array<{key: SharingKey; icon: IconName; shortLabel: string; value: string}> = [
    showCycle ? {key: 'cycleDay', icon: 'calendar-month-outline', shortLabel: t('awaADeux.partnerSide.home.shortLabelCycle'), value: info.cycleDay !== null ? t('awaADeux.partnerSide.home.cycleDayValue', {day: info.cycleDay}) : infoUnavailable} : null,
    showPeriodStatus ? {key: 'periodStatus', icon: 'calendar-check-outline', shortLabel: t('awaADeux.partnerSide.home.shortLabelPeriods'), value: periodStatusValue} : null,
    showFertileWindow ? {key: 'fertileWindow', icon: 'flower-outline', shortLabel: t('awaADeux.demo.fertileWindowLabel'), value: fertileWindowStatusValue} : null,
    showOvulation ? {key: 'ovulation', icon: 'water-outline', shortLabel: t('awaADeux.partnerSide.home.shortLabelOvulation'), value: ovulationTiming ?? (info.ovulation ?? infoUnavailable)} : null,
  ].filter((tile): tile is {key: SharingKey; icon: IconName; shortLabel: string; value: string} => tile !== null);

  // A compact, fixed square (see TILE_SIZE_COMPACT/REGULAR above) — the exact same
  // size whether there's 1 card or 4, for both this grid and "Prochains événements"
  // below. The row never stretches to fill the screen (no flexGrow on the scroll
  // content), so a single card sits at the row's start with empty space after it,
  // and a row that doesn't fit scrolls horizontally instead of shrinking any card.
  const tileSize = compact ? TILE_SIZE_COMPACT : TILE_SIZE_REGULAR;

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
            <Text accessibilityRole="header" style={styles.greeting}>{t('awaADeux.partnerSide.home.greeting')}</Text>
            {hasPartnerFirstName ? <Text numberOfLines={1} style={styles.partnerFirstName}>{`${partnerFirstName}`}</Text> : null}
            <Text style={styles.subtitle}>{t('awaADeux.partnerSide.home.subtitle')}</Text>
          </View>

          {/* Same profile shortcut as the owner's own Cycle dashboard header
              (HomeHeader.tsx): identical icon, circular button, shadow and press
              feedback — only the destination differs (this tab navigator's own
              PartnerProfile tab, never the owner's ProfileScreen). */}
          <Pressable
            accessibilityLabel={t('awaADeux.partnerSide.home.openProfileAccessibility')}
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
            <Text style={styles.emptyText}>{t('awaADeux.partnerSide.home.emptyShared')}</Text>
          </View>
        ) : (
          <>
            {showCycle ? (
              <View accessibilityLabel={t('awaADeux.partnerSide.home.cycleInfoAccessibility')} style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <CycleProgressRing
                    accessibilityLabel={info.cycleDay === null ? t('awaADeux.partnerSide.home.cycleDayUnavailableAccessibility') : t('awaADeux.partnerSide.home.cycleDayAccessibility', {day: info.cycleDay})}
                    currentDay={info.cycleDay}
                    cycleLength={info.cycleLength ?? 1}
                    phaseLabel={phaseLabel}
                    ringColor={phaseIdentity?.ringColor ?? theme.colors.primary}
                    size={compact ? 100 : 116}
                  />

                  <View style={styles.heroCopy}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>{t('awaADeux.partnerSide.home.todayLabel')}</Text>
                      <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={16} />
                    </View>
                    <Text style={styles.heroMessage}>{phaseMessage}</Text>
                  </View>
                </View>

                {(showMood && moodEntry) || showAdvice ? (
                  <View style={styles.chipsRow}>
                    {showMood && moodEntry ? (
                      <>
                        <Chip icon="lightning-bolt-outline" label={t('awaADeux.partnerSide.home.energyLabel')} styles={styles} theme={theme} value={ENERGY_LABELS[Math.min(5, Math.max(1, Math.round(moodEntry.energy)))] ?? infoUnavailable} />
                        <View style={styles.chipDivider} />
                        <Chip icon="emoticon-outline" label={t('awaADeux.partnerSide.home.moodLabel')} styles={styles} theme={theme} value={MOOD_LABELS[moodEntry.level]} />
                      </>
                    ) : null}
                    {showAdvice ? (
                      <>
                        {showMood && moodEntry ? <View style={styles.chipDivider} /> : null}
                        <Chip icon="heart-outline" label={t('awaADeux.partnerSide.home.adviceLabel')} styles={styles} theme={theme} value={tip} />
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {sharedTiles.length > 0 ? (
              <>
                <SectionHeader styles={styles} subtitle={t('awaADeux.partnerSide.home.sharedInfoSubtitle')} theme={theme} title={t('awaADeux.partnerSide.home.sharedInfoTitle')} />
                <ScrollView
                  contentContainerStyle={styles.tileRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {sharedTiles.map(tile => (
                    <SharedInfoTile
                      key={tile.key}
                      accentColor={accentColorFor(tile.key, theme)}
                      compact={compact}
                      icon={tile.icon}
                      label={tile.shortLabel}
                      size={tileSize}
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
                <SectionHeader styles={styles} subtitle={t('awaADeux.partnerSide.home.upcomingSubtitle')} theme={theme} title={t('awaADeux.partnerSide.home.upcomingTitle')} />
                {/* Same square SharedInfoTile used by "Informations partagées" above —
                    not a second card implementation — so both sections share the exact
                    same compact proportions, spacing and accent-bar treatment. */}
                <ScrollView
                  contentContainerStyle={styles.tileRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {showNextPeriod ? (
                    <SharedInfoTile
                      accentColor={homeColors.pink}
                      compact={compact}
                      icon="calendar-clock-outline"
                      label={t('awaADeux.partnerSide.home.nextPeriodLabel')}
                      size={tileSize}
                      styles={styles}
                      subtitle={nextPeriodTiming}
                      testID="partner-upcoming-event-tile"
                      theme={theme}
                      value={info.nextPeriod ?? infoUnavailable}
                    />
                  ) : null}
                  {showOvulation ? (
                    <SharedInfoTile
                      accentColor={theme.colors.accent}
                      compact={compact}
                      icon="water-outline"
                      label={t('awaADeux.partnerSide.home.ovulationLabel')}
                      size={tileSize}
                      styles={styles}
                      subtitle={ovulationTiming}
                      testID="partner-upcoming-event-tile"
                      theme={theme}
                      value={info.ovulation ?? infoUnavailable}
                    />
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </PartnerScreenBackground>
  );
}

type T = (key: string, options?: Record<string, unknown>) => string;

function formatDayCount(t: T, prefix: 'in' | 'remaining', days: number): string {
  return t(prefix === 'in' ? 'awaADeux.partnerSide.home.inDays' : 'awaADeux.partnerSide.home.remainingDays', {count: days});
}

/** Same local-day arithmetic as the Cycle dashboard; no UTC conversion or duplicate prediction. */
function formatFutureTiming(target: Date, today: Date, t: T): string | undefined {
  const days = diffDays(startOfDay(target), startOfDay(today));
  if (days < 0) {return undefined;}
  if (days === 0) {return t('awaADeux.partnerSide.home.todayLabel');}
  return formatDayCount(t, 'in', days);
}

/** Relative wording derived only from the already-computed real fertile-window dates. */
function formatFertileTiming(range: {start: Date; end: Date}, today: Date, t: T): string | undefined {
  const day = startOfDay(today);
  const untilStart = diffDays(startOfDay(range.start), day);
  if (untilStart > 0) {return formatDayCount(t, 'in', untilStart);}

  const untilEnd = diffDays(startOfDay(range.end), day);
  if (untilEnd < 0) {return undefined;}
  return formatDayCount(t, 'remaining', untilEnd + 1);
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
  const {t} = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTopRow}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
        <View importantForAccessibility="no-hide-descendants" style={styles.sectionMoreRow}>
          <Text style={styles.sectionMoreText}>{t('common.seeAll')}</Text>
          <MaterialDesignIcons color={theme.colors.primary} name="arrow-right" size={13} />
        </View>
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

/** The one square card used for both "Informations partagées" and "Prochains
 * événements" — a single implementation so the two sections can never visually
 * drift apart. `subtitle` is optional (only the event tiles use it, for the
 * relative countdown under the date) so the plain 2-line shared-info tiles are
 * unaffected. */
function SharedInfoTile({
  icon,
  label,
  value,
  subtitle,
  accentColor,
  theme,
  styles,
  size,
  compact,
  testID = 'partner-shared-info-tile',
}: {
  icon: IconName;
  label: string;
  value: string;
  subtitle?: string;
  accentColor: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
  size: number;
  compact: boolean;
  testID?: string;
}): React.JSX.Element {
  return (
    <View style={[styles.tile, compact && styles.tileCompact, {width: size}]} testID={testID}>
      <View style={[styles.tileIcon, compact && styles.tileIconCompact, {backgroundColor: withAlpha(accentColor, theme.isDark ? 0.24 : 0.14)}]}>
        <MaterialDesignIcons color={accentColor} name={icon} size={compact ? 16 : 20} />
      </View>
      <View style={styles.tileTextGroup}>
        <Text numberOfLines={2} style={[styles.tileLabel, compact && styles.tileLabelCompact]}>{label}</Text>
        <Text numberOfLines={subtitle ? 1 : 2} style={[styles.tileValue, compact && styles.tileValueCompact]}>{value}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.tileSubtitle, compact && styles.tileSubtitleCompact]}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.tileAccent, {backgroundColor: accentColor}]} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, compact: boolean) {
  return StyleSheet.create({
    content: {paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: 20},
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
    // "Informations partagées" / "Prochains événements" — both render inside a
    // horizontal ScrollView whose contentContainerStyle is this row: it only ever
    // sizes itself to its children (no flexGrow/stretch), so a single card sits at
    // the start with empty space after it, never stretched to fill the screen. Once
    // enough fixed-size cards exist to exceed the available width, the row scrolls
    // instead of shrinking or wrapping any card — see TILE_SIZE_COMPACT/REGULAR
    // above for the one, device-width-class-based (not count-based) card size.
    tileRow: {flexDirection: 'row', gap: TILE_GAP, paddingRight: TILE_GAP},
    tile: {
      aspectRatio: 1,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, theme.isDark ? 0.28 : 0.16),
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.96),
      paddingHorizontal: 10,
      paddingVertical: 9,
      ...theme.shadow,
    },
    // The smaller (TILE_SIZE_COMPACT) card gets a tighter icon/type scale so the
    // same four pieces of content never feel cramped or clipped.
    tileCompact: {paddingHorizontal: 8, paddingVertical: 7},
    tileIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    tileIconCompact: {width: 26, height: 26, borderRadius: 10},
    tileTextGroup: {minHeight: 0},
    tileLabel: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600'},
    tileLabelCompact: {fontSize: 9.5},
    tileValue: {marginTop: 2, color: theme.colors.text, fontSize: 13, fontWeight: '800'},
    tileValueCompact: {fontSize: 11},
    // Only the "Prochains événements" tiles use this (the relative countdown under
    // the date, e.g. "Dans 5 jours") — shared-info tiles never pass a subtitle.
    tileSubtitle: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '600'},
    tileSubtitleCompact: {fontSize: 9},
    // A thicker, fully-rounded pill — matching AWA's refreshed compact-card design —
    // rather than a thin 3px line; still inset from the card's own edges by the
    // tile's horizontal padding, never touching the rounded corners.
    tileAccent: {height: 6, borderRadius: 3, alignSelf: 'stretch'},
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
