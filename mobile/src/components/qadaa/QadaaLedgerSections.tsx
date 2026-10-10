import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {FadeInUp} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {QadaaCompletionEntry, QadaaManualEntry} from '../../state/qadaaLedgerStore';
import {describeQadaaBalanceStatus, type QadaaBalance} from '../../utils/qadaaBalance';
import {displayUpperCase} from '../../utils/textCase';
import {
  formatQadaaHistoryGregorianRange,
  formatQadaaHistoryHijriRange,
  type QadaaHistoryEntry,
} from '../../utils/qadaaHistoryPresentation';
import {
  formatQadaaCompletionSummary,
  formatQadaaCompletionTitle,
  formatQadaaDayCount,
  formatQadaaManualSummary,
  formatQadaaManualTitle,
} from '../../utils/qadaaManualEntryForm';

type Props = {
  balance: QadaaBalance;
  automaticEntries: readonly QadaaHistoryEntry[];
  manualEntries: readonly QadaaManualEntry[];
  completions: readonly QadaaCompletionEntry[];
  onAdd: () => void;
  onEditManual: (entry: QadaaManualEntry) => void;
  onDeleteManual: (entry: QadaaManualEntry) => void;
  onUndoCompletion: (entry: QadaaCompletionEntry) => void;
};

type RowAction = {label: string; accessibilityLabel: string; icon: string; destructive?: boolean; onPress: () => void};

function HistoryRow({
  index,
  icon,
  title,
  subtitle,
  badge,
  lines,
  actions,
  theme,
  styles,
}: {
  index: number;
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  lines?: readonly string[];
  actions?: readonly RowAction[];
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInUp.delay(40 * Math.min(index, 8)).duration(260)} style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon as never} size={18} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <View style={styles.rowTitleBlock}>
            <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
        {lines?.map(line => (
          <Text key={line} style={styles.rowLine}>{line}</Text>
        ))}
        {actions?.length ? (
          <View style={styles.actions}>
            {actions.map(action => (
              <Pressable
                key={action.label}
                accessibilityLabel={action.accessibilityLabel}
                accessibilityRole="button"
                hitSlop={6}
                onPress={action.onPress}
                style={({pressed}) => [styles.action, pressed && styles.pressed]}>
                <MaterialDesignIcons
                  color={action.destructive ? theme.colors.danger : theme.colors.primary}
                  name={action.icon as never}
                  size={15}
                />
                <Text style={[styles.actionText, action.destructive && styles.actionTextDestructive]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/**
 * The Qadaa balance breakdown (where the total comes from) plus the "Historique":
 * automatic entries (read-only here — their source of truth is the menstrual
 * history), manual entries (editable / removable) and completions (undoable).
 * Presentation only: every number comes from utils/qadaaBalance.ts.
 */
export default function QadaaLedgerSections({
  balance,
  automaticEntries,
  manualEntries,
  completions,
  onAdd,
  onEditManual,
  onDeleteManual,
  onUndoCompletion,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sortedManual = useMemo(
    () => [...manualEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [manualEntries],
  );
  const sortedCompletions = useMemo(
    () => [...completions].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [completions],
  );
  const status = describeQadaaBalanceStatus(balance);
  const hasHistory = automaticEntries.length + manualEntries.length + completions.length > 0;

  const summaryRows: {label: string; value: number; strong?: boolean}[] = [
    {label: t('qadaa.ledger.automaticDetected'), value: balance.automaticDays},
    {label: t('qadaa.ledger.manuallyAdded'), value: balance.manualDays},
    {label: t('qadaa.ledger.caughtUp'), value: balance.completedDays},
    {label: t('qadaa.ledger.remaining'), value: balance.remainingDays, strong: true},
  ];

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="scale-balance" size={16} />
          </View>
          <Text style={styles.headerTitle}>{t('qadaa.ledger.balanceTitle')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summary}>
          {summaryRows.map(row => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, row.strong && styles.summaryStrong]}>{row.label}</Text>
              <Text style={[styles.summaryValue, row.strong && styles.summaryStrong]}>{row.value}</Text>
            </View>
          ))}
          {balance.surplusCompletedDays > 0 ? (
            <Text style={styles.note}>
              {t('qadaa.ledger.surplusNote', {count: balance.surplusCompletedDays})}
            </Text>
          ) : null}
          <Pressable
            accessibilityLabel={t('qadaa.ledger.addDaysAccessibility')}
            accessibilityRole="button"
            onPress={onAdd}
            style={({pressed}) => [styles.addButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="plus-circle-outline" size={18} />
            <Text style={styles.addButtonText}>{t('qadaa.ledger.addDays')}</Text>
          </Pressable>
        </View>
      </View>

      {hasHistory ? (
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-star" size={16} />
            </View>
            <Text style={styles.headerTitle}>{t('qadaa.ledger.historyTitle')}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {automaticEntries.length > 0 ? (
            <>
              <Text style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.automaticDetected'))}</Text>
              {automaticEntries.map((entry, index) => (
                <HistoryRow
                  key={entry.id}
                  actions={undefined}
                  badge={t('qadaa.ledger.automaticBadge')}
                  icon="calendar-check"
                  index={index}
                  lines={[
                    t('qadaa.ledger.automaticHint'),
                    `${formatQadaaHistoryHijriRange(entry)} (${formatQadaaHistoryGregorianRange(entry)})`,
                  ]}
                  styles={styles}
                  subtitle={formatQadaaDayCount(entry.ramadanDays)}
                  theme={theme}
                  title={t('qadaa.ramadanYearHijri', {year: entry.hijriYear})}
                />
              ))}
            </>
          ) : null}

          {sortedManual.length > 0 ? (
            <>
              <Text style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.manuallyAdded'))}</Text>
              {sortedManual.map((entry, index) => (
                <HistoryRow
                  key={entry.id}
                  actions={[
                    {
                      label: t('qadaa.ledger.editAction'),
                      accessibilityLabel: t('qadaa.ledger.editAccessibility', {title: formatQadaaManualTitle(entry)}),
                      icon: 'pencil-outline',
                      onPress: () => onEditManual(entry),
                    },
                    {
                      label: t('qadaa.ledger.deleteAction'),
                      accessibilityLabel: t('qadaa.ledger.deleteAccessibility', {title: formatQadaaManualTitle(entry)}),
                      icon: 'trash-can-outline',
                      destructive: true,
                      onPress: () => onDeleteManual(entry),
                    },
                  ]}
                  badge={t('qadaa.ledger.manualBadge')}
                  icon="pencil-plus-outline"
                  index={index}
                  lines={entry.note ? [entry.note] : undefined}
                  styles={styles}
                  subtitle={formatQadaaManualSummary(entry)}
                  theme={theme}
                  title={formatQadaaManualTitle(entry)}
                />
              ))}
            </>
          ) : null}

          {sortedCompletions.length > 0 ? (
            <>
              <Text style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.completedGroupTitle'))}</Text>
              {sortedCompletions.map((entry, index) => (
                <HistoryRow
                  key={entry.id}
                  actions={[
                    {
                      label: t('qadaa.ledger.undoAction'),
                      accessibilityLabel: t('qadaa.ledger.undoAccessibility', {title: formatQadaaCompletionTitle(entry)}),
                      icon: 'undo-variant',
                      destructive: true,
                      onPress: () => onUndoCompletion(entry),
                    },
                  ]}
                  badge={t('qadaa.ledger.caughtUpBadge')}
                  icon="check-circle-outline"
                  index={index}
                  styles={styles}
                  subtitle={formatQadaaCompletionSummary(entry)}
                  theme={theme}
                  title={formatQadaaCompletionTitle(entry)}
                />
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      overflow: 'hidden',
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      ...theme.shadow,
    },
    header: {minHeight: 57, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14},
    headerIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 9,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 17,
      fontWeight: '700',
    },
    divider: {height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    statusPill: {
      maxWidth: '48%',
      borderRadius: 8,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    statusPillText: {color: theme.colors.primary, fontSize: 11, fontWeight: '800'},
    summary: {paddingHorizontal: 14, paddingVertical: 12},
    summaryRow: {
      minHeight: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    summaryLabel: {flex: 1, color: theme.colors.textSecondary, fontSize: 13},
    summaryValue: {color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    summaryStrong: {color: theme.colors.text, fontWeight: '800'},
    note: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},
    addButton: {
      minHeight: 46,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    addButtonText: {color: theme.colors.primary, fontSize: 13, fontWeight: '800'},
    groupTitle: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 2,
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    row: {flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 11},
    rowIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.1),
    },
    rowContent: {flex: 1, minWidth: 0, marginLeft: 11},
    rowTop: {flexDirection: 'row', alignItems: 'center', gap: 6},
    rowTitleBlock: {flex: 1, minWidth: 0},
    rowTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
    rowSubtitle: {marginTop: 2, color: theme.colors.text, fontSize: 12, fontWeight: '600'},
    badge: {borderRadius: 8, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4},
    badgeText: {color: theme.colors.primary, fontSize: 10, fontWeight: '800'},
    rowLine: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16},
    actions: {marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 16},
    action: {minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 5},
    actionText: {color: theme.colors.primary, fontSize: 12.5, fontWeight: '700'},
    actionTextDestructive: {color: theme.colors.danger},
    pressed: {opacity: 0.72},
  });
}
