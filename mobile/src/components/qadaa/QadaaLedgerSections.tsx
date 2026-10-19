import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {FadeInUp} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import type {AwaIconName} from '../ui/AwaIcon';
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

type RowAction = {label: string; accessibilityLabel: string; icon: AwaIconName; destructive?: boolean; onPress: () => void};

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
            <AwaText variant="titleSmall">{title}</AwaText>
            <AwaText variant="bodySmall" style={styles.rowSubtitle}>{subtitle}</AwaText>
          </View>
          <View style={styles.badge}>
            <AwaText colorRole="onPrimaryContainer" emphasized variant="labelSmall">{badge}</AwaText>
          </View>
        </View>
        {lines?.map(line => (
          <AwaText colorRole="onSurfaceVariant" key={line} variant="bodySmall" style={styles.rowLine}>{line}</AwaText>
        ))}
        {actions?.length ? (
          <View style={styles.actions}>
            {actions.map(action => (
              <AwaButton
                key={action.label}
                accessibilityLabel={action.accessibilityLabel}
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                size="compact"
                variant={action.destructive ? 'destructive' : 'text'}
              />
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
      <AwaCard padding="none" style={styles.card} variant="outlined">
        <View style={styles.header}>
          <AwaText variant="titleMedium" style={styles.headerTitle}>{t('qadaa.ledger.balanceTitle')}</AwaText>
        </View>
        <View style={styles.divider} />
        <View style={styles.summary}>
          {summaryRows.map(row => (
            <View key={row.label} style={styles.summaryRow}>
              <AwaText colorRole={row.strong ? 'onSurface' : 'onSurfaceVariant'} emphasized={row.strong} variant="bodyMedium" style={styles.summaryLabel}>{row.label}</AwaText>
              <AwaText emphasized={row.strong} variant="titleSmall">{row.value}</AwaText>
            </View>
          ))}
          {balance.surplusCompletedDays > 0 ? (
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.note}>
              {t('qadaa.ledger.surplusNote', {count: balance.surplusCompletedDays})}
            </AwaText>
          ) : null}
          <AwaButton
            accessibilityLabel={t('qadaa.ledger.addDaysAccessibility')}
            fullWidth
            icon="plus-circle-outline"
            label={t('qadaa.ledger.addDays')}
            onPress={onAdd}
            style={styles.addButton}
            variant="outlined"
          />
        </View>
      </AwaCard>

      {hasHistory ? (
        <AwaCard padding="none" style={styles.card} variant="outlined">
          <View style={styles.header}>
            <AwaText variant="titleMedium" style={styles.headerTitle}>{t('qadaa.ledger.historyTitle')}</AwaText>
            <View style={styles.statusPill}>
              <AwaText colorRole="onPrimaryContainer" emphasized variant="labelSmall">{status.label}</AwaText>
            </View>
          </View>
          <View style={styles.divider} />

          {automaticEntries.length > 0 ? (
            <>
              <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.automaticDetected'))}</AwaText>
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
              <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.manuallyAdded'))}</AwaText>
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
              <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.groupTitle}>{displayUpperCase(t('qadaa.ledger.completedGroupTitle'))}</AwaText>
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
        </AwaCard>
      ) : null}
    </>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {marginTop: 12, overflow: 'hidden'},
    header: {minHeight: 57, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14},
    headerTitle: {flex: 1},
    divider: {height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    statusPill: {
      maxWidth: '48%',
      borderRadius: 8,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    summary: {paddingHorizontal: 14, paddingVertical: 12},
    summaryRow: {
      minHeight: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    summaryLabel: {flex: 1},
    note: {marginTop: 8},
    addButton: {marginTop: 12},
    groupTitle: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 2,
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
    rowSubtitle: {marginTop: 2},
    badge: {borderRadius: 8, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4},
    rowLine: {marginTop: 3},
    actions: {marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  });
}
