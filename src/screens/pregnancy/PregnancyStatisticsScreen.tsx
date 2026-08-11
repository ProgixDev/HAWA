import React, {useCallback, useMemo, useState} from 'react';
import {ImageBackground, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors, homeShadow} from '../../components/home/homeTheme';
import {
  getPregnancyJournalState,
  type PregnancyJournalState,
  type PregnancyWeightEntry,
} from '../../state/pregnancyJournalStore';
import {TOP_SPACING_EXTRA} from '../../theme/spacing';

const BACKGROUND = require('../../assets/images/auth-mosque-background.png');
type Range = '7' | '30' | 'all';
const EMPTY: PregnancyJournalState = {symptoms: [], weights: []};

const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'}).format(new Date(`${date}T12:00:00`));
const withinRange = (date: string, range: Range) => {
  if (range === 'all') {return true;}
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - Number(range) + 1);
  return new Date(`${date}T12:00:00`) >= cutoff;
};

function EmptyState({text}: {text: string}): React.JSX.Element {
  return <View style={styles.empty}><MaterialDesignIcons color="#A996CF" name="chart-line-variant" size={26} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function PregnancyStatisticsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<PregnancyJournalState>(EMPTY);
  const [range, setRange] = useState<Range>('30');

  useFocusEffect(useCallback(() => {
    let mounted = true;
    getPregnancyJournalState().then(value => {if (mounted) {setState(value);}});
    return () => {mounted = false;};
  }, []));

  const weights = useMemo(() => state.weights.filter(item => withinRange(item.date, range)), [range, state.weights]);
  const symptoms = useMemo(() => state.symptoms.filter(item => withinRange(item.date, range)), [range, state.symptoms]);
  const trackedDays = useMemo(() => new Set([...weights.map(item => item.date), ...symptoms.map(item => item.date)]).size, [symptoms, weights]);
  const symptomCounts = useMemo(() => {
    const counts = new Map<string, number>();
    symptoms.forEach(entry => entry.symptoms.forEach(name => counts.set(name, (counts.get(name) ?? 0) + 1)));
    return [...counts.entries()].map(([name, count]) => ({name, count})).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [symptoms]);
  const latestWeight = weights[weights.length - 1];
  const previousWeight = weights[weights.length - 2];
  const weightDelta = latestWeight && previousWeight ? latestWeight.valueKg - previousWeight.valueKg : undefined;
  const maxWeight = Math.max(...weights.map(item => item.valueKg), 1);
  const mostFrequentSymptom = symptomCounts[0];

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 24}]} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}><Text style={styles.title}>Statistiques</Text><Text style={styles.subtitle}>Tes tendances enregistrées dans le Journal grossesse</Text></View>
            <View style={styles.headerIcon}><MaterialDesignIcons color={homeColors.primary} name="chart-box-outline" size={25} /></View>
          </View>

          <View style={styles.filters}>
            {([{key: '7', label: '7 jours'}, {key: '30', label: '30 jours'}, {key: 'all', label: 'Tout'}] as const).map(item => (
              <Pressable key={item.key} onPress={() => setRange(item.key)} style={[styles.filter, range === item.key && styles.filterActive]}>
                <Text style={[styles.filterText, range === item.key && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Vue d’ensemble</Text>
          <View style={styles.overviewGrid}>
            <OverviewCard icon="calendar-check-outline" label="Jours suivis" value={trackedDays > 0 ? String(trackedDays) : '—'} />
            <OverviewCard icon="scale-bathroom" label="Dernier poids" value={latestWeight ? `${latestWeight.valueKg.toLocaleString('fr-FR')} kg` : '—'} />
            <OverviewCard icon="heart-pulse" label="Symptôme fréquent" value={mostFrequentSymptom?.name ?? '—'} wide />
          </View>

          <View style={styles.card}>
            <SectionHeader icon="scale-bathroom" title="Évolution du poids" />
            {!latestWeight ? <EmptyState text="Pas encore de mesure enregistrée." /> : (
              <>
                <View style={styles.weightSummary}>
                  <View><Text style={styles.metricLabel}>Dernière mesure</Text><Text style={styles.metricValue}>{latestWeight.valueKg.toLocaleString('fr-FR')} kg</Text><Text style={styles.metricDate}>{dateLabel(latestWeight.date)}</Text></View>
                  <View style={styles.deltaBadge}><MaterialDesignIcons color={homeColors.primary} name={weightDelta === undefined ? 'minus' : weightDelta >= 0 ? 'arrow-up' : 'arrow-down'} size={16} /><Text style={styles.deltaText}>{weightDelta === undefined ? 'Une mesure' : `${Math.abs(weightDelta).toLocaleString('fr-FR')} kg`}</Text></View>
                </View>
                {weights.length < 2 ? <Text style={styles.hint}>Ajoute une autre mesure pour voir une évolution.</Text> : (
                  <View style={styles.weightChart}>{weights.slice(-8).map(item => <WeightBar key={item.date} entry={item} max={maxWeight} />)}</View>
                )}
              </>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader icon="heart-pulse" title="Symptômes les plus fréquents" />
            {symptomCounts.length === 0 ? <EmptyState text="Ajoute des symptômes dans ton Journal grossesse pour voir leur fréquence ici." /> : (
              <View style={styles.symptomList}>{symptomCounts.slice(0, 6).map((item, index) => (
                <View key={item.name} style={[styles.symptomRow, index === symptomCounts.slice(0, 6).length - 1 && styles.lastRow]}>
                  <View style={styles.rank}><Text style={styles.rankText}>{index + 1}</Text></View>
                  <Text style={styles.symptomName}>{item.name}</Text>
                  <Text style={styles.symptomCount}>{item.count} {item.count > 1 ? 'jours' : 'jour'}</Text>
                </View>
              ))}</View>
            )}
          </View>

          <View style={styles.sharedNotice}>
            <MaterialDesignIcons color={homeColors.primary} name="information-outline" size={21} />
            <Text style={styles.sharedNoticeText}>Les données partagées d’humeur, sommeil, hydratation et activité ne sont pas attribuées à une grossesse tant qu’elles ne disposent pas d’un contexte d’objectif fiable.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function OverviewCard({icon, label, value, wide}: {icon: string; label: string; value: string; wide?: boolean}): React.JSX.Element {
  return <View style={[styles.overviewCard, wide && styles.overviewCardWide]}><View style={styles.overviewIcon}><MaterialDesignIcons color={homeColors.primary} name={icon as never} size={20} /></View><View style={styles.overviewCopy}><Text style={styles.overviewValue} numberOfLines={2}>{value}</Text><Text style={styles.overviewLabel}>{label}</Text></View></View>;
}
function SectionHeader({icon, title}: {icon: string; title: string}): React.JSX.Element {
  return <View style={styles.sectionHeader}><View style={styles.sectionIcon}><MaterialDesignIcons color={homeColors.primary} name={icon as never} size={21} /></View><Text style={styles.cardTitle}>{title}</Text></View>;
}
function WeightBar({entry, max}: {entry: PregnancyWeightEntry; max: number}): React.JSX.Element {
  return <View style={styles.barColumn}><Text style={styles.barValue}>{entry.valueKg.toLocaleString('fr-FR')}</Text><View style={styles.barTrack}><View style={[styles.barFill, {height: `${Math.max(18, entry.valueKg / max * 100)}%`}]} /></View><Text style={styles.barDate}>{dateLabel(entry.date)}</Text></View>;
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8F3FC'}, safeArea: {flex: 1}, content: {paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},
  headerRow: {flexDirection: 'row', alignItems: 'center'}, headerCopy: {flex: 1, minWidth: 0}, title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 26, fontWeight: '800'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 12.5, lineHeight: 18}, headerIcon: {width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginLeft: 10, borderRadius: 16, backgroundColor: '#EEE7FA'},
  filters: {flexDirection: 'row', marginTop: 16, padding: 3, borderRadius: 14, backgroundColor: '#EEE8F5'}, filter: {flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11}, filterActive: {backgroundColor: homeColors.primary}, filterText: {color: homeColors.textSecondary, fontSize: 11.5, fontWeight: '700'}, filterTextActive: {color: '#FFFFFF'},
  sectionTitle: {marginTop: 20, marginBottom: 10, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '800'}, overviewGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 9},
  overviewCard: {...homeShadow, width: '48.5%', minWidth: 0, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: homeColors.cardBorder, borderRadius: 19, backgroundColor: '#FFFFFF'}, overviewCardWide: {width: '100%'},
  overviewIcon: {width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#F0EAFB'}, overviewCopy: {flex: 1, minWidth: 0, marginLeft: 9}, overviewValue: {color: homeColors.textPrimary, fontSize: 14, fontWeight: '800'}, overviewLabel: {marginTop: 2, color: homeColors.textSecondary, fontSize: 9.5},
  card: {...homeShadow, marginTop: 14, padding: 15, borderWidth: 1, borderColor: homeColors.cardBorder, borderRadius: 22, backgroundColor: '#FFFFFF'}, sectionHeader: {flexDirection: 'row', alignItems: 'center'}, sectionIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 13, backgroundColor: '#F0EAFB'}, cardTitle: {flex: 1, minWidth: 0, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '800'},
  empty: {alignItems: 'center', paddingVertical: 25, paddingHorizontal: 12}, emptyText: {marginTop: 8, maxWidth: 280, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 17, textAlign: 'center'},
  weightSummary: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, padding: 13, borderRadius: 17, backgroundColor: '#F8F4FC'}, metricLabel: {color: homeColors.textSecondary, fontSize: 10}, metricValue: {marginTop: 3, color: homeColors.textPrimary, fontSize: 20, fontWeight: '800'}, metricDate: {marginTop: 2, color: homeColors.textSecondary, fontSize: 9.5}, deltaBadge: {flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: '#EEE7FA'}, deltaText: {color: homeColors.primary, fontSize: 10.5, fontWeight: '800'}, hint: {marginTop: 12, color: homeColors.textSecondary, fontSize: 11, textAlign: 'center'},
  weightChart: {height: 145, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 16}, barColumn: {flex: 1, minWidth: 0, height: '100%', alignItems: 'center'}, barValue: {color: homeColors.textPrimary, fontSize: 8.5, fontWeight: '700'}, barTrack: {flex: 1, width: '62%', minWidth: 10, justifyContent: 'flex-end', overflow: 'hidden', marginVertical: 5, borderRadius: 7, backgroundColor: '#F0EAF7'}, barFill: {width: '100%', borderRadius: 7, backgroundColor: '#8B6BD8'}, barDate: {color: homeColors.textSecondary, fontSize: 7.5},
  symptomList: {marginTop: 10}, symptomRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECE6F1'}, lastRow: {borderBottomWidth: 0}, rank: {width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F0EAFB'}, rankText: {color: homeColors.primary, fontSize: 11, fontWeight: '800'}, symptomName: {flex: 1, minWidth: 0, marginHorizontal: 10, color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '700'}, symptomCount: {color: homeColors.textSecondary, fontSize: 10.5},
  sharedNotice: {flexDirection: 'row', alignItems: 'flex-start', marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: '#F0EAF8'}, sharedNoticeText: {flex: 1, minWidth: 0, marginLeft: 9, color: homeColors.textSecondary, fontSize: 10.5, lineHeight: 16},
});

export default PregnancyStatisticsScreen;
