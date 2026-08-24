import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  type MenopauseJournalEntry,
} from '../../state/menopauseJournalStore';
import {
  MENOPAUSE_ENERGY_ICONS,
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_LAB_TYPE_ICONS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_COLORS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SYMPTOM_OPTIONS,
} from '../../config/menopauseJournalConfig';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import {getTopPadding, spacing} from '../../theme/spacing';
import type {MoodLevel} from '../../types/journal';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const MUTED = '#776C92';

type PeriodOption = {key: '1m' | '3m' | '6m'; label: string; months: number};
const PERIODS: PeriodOption[] = [
  {key: '1m', label: '1 mois', months: 1},
  {key: '3m', label: '3 mois', months: 3},
  {key: '6m', label: '6 mois', months: 6},
];

function formatResultDate(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {return dateKey;}
  return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'}).format(parsed);
}

function ProgressBar({ratio, color}: {ratio: number; color: string}): React.JSX.Element {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, {backgroundColor: color, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`}]} />
    </View>
  );
}

function OverviewTile({icon, label, value}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.overviewTile}>
      <View style={styles.overviewIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={17} />
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function EmptyCardState({title, text}: {title: string; text: string}): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function MenopauseStatisticsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<PeriodOption>(PERIODS[1]);
  const preferences = useMemo(() => getMenopausePreferences(), []);

  const entriesInPeriod = useMemo(() => {
    const allEntries = Object.values(getAllMenopauseJournalEntries());
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - period.months);
    return allEntries.filter((entry: MenopauseJournalEntry) => new Date(`${entry.date}T12:00:00`) >= cutoff);
  }, [period]);

  const daysTracked = entriesInPeriod.length;

  const symptomCounts = useMemo(() => {
    const withCounts = MENOPAUSE_SYMPTOM_OPTIONS.map(option => ({
      ...option,
      count: entriesInPeriod.filter(entry => entry.symptoms?.includes(option.id)).length,
    })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(1, ...withCounts.map(item => item.count));
    return {items: withCounts, maxCount};
  }, [entriesInPeriod]);

  const totalSymptomEntries = entriesInPeriod.filter(entry => entry.symptoms?.length).length;

  const sleepEntries = entriesInPeriod.filter(entry => entry.sleepDurationHours !== undefined);
  const averageSleep = sleepEntries.length > 0
    ? sleepEntries.reduce((sum, entry) => sum + (entry.sleepDurationHours ?? 0), 0) / sleepEntries.length
    : null;

  const energyEntries = entriesInPeriod.filter(entry => entry.energyLevel);
  const energyCounts = {
    low: energyEntries.filter(entry => entry.energyLevel === 'low').length,
    medium: energyEntries.filter(entry => entry.energyLevel === 'medium').length,
    high: energyEntries.filter(entry => entry.energyLevel === 'high').length,
  };
  const maxEnergyCount = Math.max(1, energyCounts.low, energyCounts.medium, energyCounts.high);

  const moodEntries = entriesInPeriod.filter(entry => entry.mood);
  const moodCounts = useMemo(() => {
    const counts = new Map<MoodLevel, number>();
    moodEntries.forEach(entry => {
      if (entry.mood) {counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);}
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [moodEntries]);
  const maxMoodCount = Math.max(1, ...moodCounts.map(([, count]) => count));

  const treatmentEntries = entriesInPeriod.filter(entry => entry.treatmentStatus);
  const treatmentTaken = treatmentEntries.filter(entry => entry.treatmentStatus === 'taken').length;
  const treatmentNotTaken = treatmentEntries.filter(entry => entry.treatmentStatus === 'not_taken').length;

  const fshResults = getMenopauseLabResults('fsh');
  const estradiolResults = getMenopauseLabResults('estradiol');

  const showTreatment = preferences.hormonalTreatmentStatus === 'track';
  const showLab = preferences.labTracking !== null && preferences.labTracking !== 'none';
  const hasAnyData = daysTracked > 0;

  return (
    <View style={styles.background}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Statistiques</Text>
        <Text style={styles.pageSubtitle}>Ton suivi périménopause / ménopause, en un coup d’œil.</Text>

        <View style={styles.periodRow}>
          {PERIODS.map(option => {
            const active = option.key === period.key;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                key={option.key}
                onPress={() => setPeriod(option)}
                style={({pressed}) => [styles.periodButton, active && styles.periodButtonActive, pressed && styles.pressed]}>
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!hasAnyData ? (
          <View style={styles.card}>
            <EmptyCardState text="Ajoute quelques suivis pour voir apparaître tes tendances." title="Pas encore assez de données" />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aperçu</Text>
              <View style={styles.overviewGrid}>
                <OverviewTile icon="calendar-check-outline" label="Jours suivis" value={String(daysTracked)} />
                <OverviewTile icon="clipboard-pulse-outline" label="Jours avec symptômes" value={String(totalSymptomEntries)} />
                <OverviewTile icon="weather-night" label="Sommeil moyen" value={averageSleep !== null ? `${averageSleep.toFixed(1)} h` : '—'} />
                {showTreatment ? <OverviewTile icon="pill" label="Suivis traitement" value={String(treatmentEntries.length)} /> : null}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Symptômes les plus fréquents</Text>
              {symptomCounts.items.every(item => item.count === 0) ? (
                <EmptyCardState text="Aucun symptôme enregistré sur cette période." title="Rien à afficher" />
              ) : (
                symptomCounts.items.map(item => (
                  <View key={item.id} style={styles.statRow}>
                    <View style={[styles.statIcon, {backgroundColor: item.tint}]}>
                      <MaterialDesignIcons color={item.iconColor} name={item.icon} size={15} />
                    </View>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text numberOfLines={1} style={styles.statLabel}>{item.label}</Text>
                        <Text style={styles.statValue}>{item.count} jour{item.count > 1 ? 's' : ''}</Text>
                      </View>
                      <ProgressBar color={item.iconColor} ratio={item.count / symptomCounts.maxCount} />
                    </View>
                  </View>
                ))
              )}
              <Text style={styles.progressHint}>Fréquence relative sur la période sélectionnée — un simple suivi, jamais une indication médicale.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Humeur</Text>
              {moodCounts.length === 0 ? (
                <EmptyCardState text="Pas encore assez de données pour cette période." title="Rien à afficher" />
              ) : (
                moodCounts.map(([level, count]) => (
                  <View key={level} style={styles.statRow}>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text numberOfLines={1} style={styles.statLabel}>{MENOPAUSE_MOOD_LABELS[level]}</Text>
                        <Text style={styles.statValue}>{count} jour{count > 1 ? 's' : ''}</Text>
                      </View>
                      <ProgressBar color={MENOPAUSE_MOOD_COLORS[level]} ratio={count / maxMoodCount} />
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sommeil</Text>
              <View style={styles.statRowPlain}>
                <Text style={styles.statLabel}>Durée moyenne enregistrée</Text>
                <Text style={styles.statValue}>{averageSleep !== null ? `${averageSleep.toFixed(1)} h` : 'Non renseigné'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Énergie</Text>
              {energyEntries.length === 0 ? (
                <EmptyCardState text="Pas encore assez de données pour cette période." title="Rien à afficher" />
              ) : (
                (Object.keys(MENOPAUSE_ENERGY_LABELS) as Array<keyof typeof MENOPAUSE_ENERGY_LABELS>).map(level => (
                  <View key={level} style={styles.statRow}>
                    <View style={styles.statIcon}>
                      <MaterialDesignIcons color="#B9823D" name={MENOPAUSE_ENERGY_ICONS[level]} size={15} />
                    </View>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text style={styles.statLabel}>{MENOPAUSE_ENERGY_LABELS[level]}</Text>
                        <Text style={styles.statValue}>{energyCounts[level]} jour{energyCounts[level] > 1 ? 's' : ''}</Text>
                      </View>
                      <ProgressBar color="#B9823D" ratio={energyCounts[level] / maxEnergyCount} />
                    </View>
                  </View>
                ))
              )}
            </View>

            {showTreatment ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Traitement hormonal</Text>
                {treatmentEntries.length === 0 ? (
                  <EmptyCardState text="Aucun suivi de traitement enregistré sur cette période." title="Rien à afficher" />
                ) : (
                  <>
                    <View style={styles.statRowPlain}><Text style={styles.statLabel}>Jours avec traitement pris</Text><Text style={styles.statValue}>{treatmentTaken}</Text></View>
                    <View style={styles.statRowPlain}><Text style={styles.statLabel}>Jours sans traitement pris</Text><Text style={styles.statValue}>{treatmentNotTaken}</Text></View>
                  </>
                )}
              </View>
            ) : null}

            {showLab ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Historique des analyses</Text>
                {(preferences.labTracking === 'fsh' || preferences.labTracking === 'both') ? (
                  <View style={styles.labBlock}>
                    <View style={styles.labBlockHeader}>
                      <MaterialDesignIcons color="#4D8791" name={MENOPAUSE_LAB_TYPE_ICONS.fsh} size={15} />
                      <Text style={styles.statLabel}>{MENOPAUSE_LAB_TYPE_LABELS.fsh} — {fshResults.length} résultat{fshResults.length > 1 ? 's' : ''}</Text>
                    </View>
                    {fshResults.slice(0, 6).map(result => (
                      <Text key={result.id} style={styles.labResultLine}>{formatResultDate(result.date)} · {result.value}{result.unit ? ` ${result.unit}` : ''}</Text>
                    ))}
                  </View>
                ) : null}
                {(preferences.labTracking === 'estradiol' || preferences.labTracking === 'both') ? (
                  <View style={styles.labBlock}>
                    <View style={styles.labBlockHeader}>
                      <MaterialDesignIcons color="#4D8791" name={MENOPAUSE_LAB_TYPE_ICONS.estradiol} size={15} />
                      <Text style={styles.statLabel}>{MENOPAUSE_LAB_TYPE_LABELS.estradiol} — {estradiolResults.length} résultat{estradiolResults.length > 1 ? 's' : ''}</Text>
                    </View>
                    {estradiolResults.slice(0, 6).map(result => (
                      <Text key={result.id} style={styles.labResultLine}>{formatResultDate(result.date)} · {result.value}{result.unit ? ` ${result.unit}` : ''}</Text>
                    ))}
                  </View>
                ) : null}
                {fshResults.length === 0 && estradiolResults.length === 0 ? (
                  <EmptyCardState text="Ajoute un résultat depuis le Journal quotidien." title="Aucun résultat enregistré" />
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F4EFFA'},
  scrollContent: {paddingHorizontal: 16},

  pageTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  pageSubtitle: {marginTop: 4, color: MUTED, fontSize: 12.5},

  periodRow: {flexDirection: 'row', marginTop: 16, gap: 8, backgroundColor: '#EFE7F4', borderRadius: 16, padding: 4},
  periodButton: {flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 13},
  periodButtonActive: {backgroundColor: PURPLE},
  periodText: {color: MUTED, fontSize: 12.5, fontWeight: '700'},
  periodTextActive: {color: '#FFFFFF'},

  card: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700', marginBottom: 12},

  overviewGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  overviewTile: {flexGrow: 1, minWidth: '44%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(105,73,190,0.1)', backgroundColor: '#FAF8FD', padding: 12},
  overviewIcon: {width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#EEE5FB', marginBottom: 8},
  overviewValue: {color: PURPLE_DARK, fontSize: 18, fontWeight: '800'},
  overviewLabel: {marginTop: 2, color: MUTED, fontSize: 10.5},

  statRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(105,73,190,0.1)'},
  statRowPlain: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(105,73,190,0.1)'},
  statIcon: {width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#EEE5FB', marginRight: 10},
  statBody: {flex: 1, minWidth: 0},
  statHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  statLabel: {flex: 1, color: PURPLE_DARK, fontSize: 13, fontWeight: '600'},
  statValue: {marginLeft: 8, color: MUTED, fontSize: 12, fontWeight: '600'},

  progressTrack: {marginTop: 6, height: 6, borderRadius: 3, backgroundColor: '#EFE9F7', overflow: 'hidden'},
  progressFill: {height: 6, borderRadius: 3},
  progressHint: {marginTop: 10, color: MUTED, fontSize: 10, lineHeight: 14},

  labBlock: {marginTop: 6},
  labBlockHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  labResultLine: {marginTop: 4, marginLeft: 23, color: MUTED, fontSize: 12},

  emptyState: {alignItems: 'center', paddingVertical: 10},
  emptyTitle: {color: PURPLE_DARK, fontSize: 13, fontWeight: '700', textAlign: 'center'},
  emptyText: {marginTop: 4, color: MUTED, fontSize: 11.5, textAlign: 'center'},

  pressed: {opacity: 0.82},
});

export default MenopauseStatisticsScreen;
