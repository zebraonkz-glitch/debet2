import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { FilterChip, FilterRow } from '@/components/FilterChip';
import { buildActivityReport } from '@/domain/reportService';
import { getCurrentQuarter, getMonthRange, getQuarterRange } from '@/domain/periodUtils';
import { useDb } from '@/hooks';
import type { ActivityReport } from '@/types';
import { Colors } from '@/utils/colors';
import {
  formatMonthYear,
  formatMoney,
  formatPeriodRange,
  formatQuarterLabel,
  getCurrentMonthRange,
} from '@/utils/format';

type PeriodMode = 'month' | 'quarter' | 'custom';

export default function ReportScreen() {
  const db = useDb();
  const router = useRouter();
  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(getCurrentQuarter());
  const [customFrom, setCustomFrom] = useState(getCurrentMonthRange().dateFrom);
  const [customTo, setCustomTo] = useState(getCurrentMonthRange().dateTo);
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [loading, setLoading] = useState(true);

  const period = useMemo(() => {
    if (periodMode === 'month') {
      return getMonthRange(year, month);
    }
    if (periodMode === 'quarter') {
      return getQuarterRange(year, quarter);
    }
    return { dateFrom: customFrom, dateTo: customTo };
  }, [periodMode, year, month, quarter, customFrom, customTo]);

  const periodLabel = useMemo(() => {
    if (periodMode === 'month') {
      return formatMonthYear(year, month);
    }
    if (periodMode === 'quarter') {
      return formatQuarterLabel(year, quarter);
    }
    return formatPeriodRange(period);
  }, [periodMode, year, month, quarter, period]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buildActivityReport(db, period);
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [db, period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shiftMonth = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };

  const shiftYear = (delta: number) => {
    setYear((value) => value + delta);
  };

  const hasRows = (report?.rows.length ?? 0) > 0;
  const hasActivity =
    report?.rows.some(
      (row) =>
        row.income !== 0 ||
        row.directExpense !== 0 ||
        row.recurringExpense !== 0 ||
        row.longTermExpense !== 0,
    ) ?? false;

  return (
    <View style={styles.container}>
      <FilterRow>
        <FilterChip
          label="Месяц"
          selected={periodMode === 'month'}
          onPress={() => setPeriodMode('month')}
        />
        <FilterChip
          label="Квартал"
          selected={periodMode === 'quarter'}
          onPress={() => setPeriodMode('quarter')}
        />
        <FilterChip
          label="Период"
          selected={periodMode === 'custom'}
          onPress={() => setPeriodMode('custom')}
        />
      </FilterRow>

      {periodMode === 'month' ? (
        <View style={styles.navigator}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.periodTitle}>{periodLabel}</Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
        </View>
      ) : null}

      {periodMode === 'quarter' ? (
        <View style={styles.quarterBlock}>
          <View style={styles.navigator}>
            <Pressable onPress={() => shiftYear(-1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </Pressable>
            <Text style={styles.periodTitle}>{year}</Text>
            <Pressable onPress={() => shiftYear(1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.quarterRow}>
            {([1, 2, 3, 4] as const).map((value) => (
              <FilterChip
                key={value}
                label={`Q${value}`}
                selected={quarter === value}
                onPress={() => setQuarter(value)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {periodMode === 'custom' ? (
        <View style={styles.customRow}>
          <View style={styles.customField}>
            <Text style={styles.customLabel}>С</Text>
            <TextInput
              style={styles.customInput}
              value={customFrom}
              onChangeText={setCustomFrom}
              placeholder="ГГГГ-ММ-ДД"
              placeholderTextColor={Colors.textMuted}
              onBlur={load}
            />
          </View>
          <View style={styles.customField}>
            <Text style={styles.customLabel}>По</Text>
            <TextInput
              style={styles.customInput}
              value={customTo}
              onChangeText={setCustomTo}
              placeholder="ГГГГ-ММ-ДД"
              placeholderTextColor={Colors.textMuted}
              onBlur={load}
            />
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : !hasRows ? (
        <EmptyState
          title="Нет проектов"
          description="Создайте проект, чтобы увидеть отчёт."
        />
      ) : !hasActivity ? (
        <EmptyState
          title="Нет данных за период"
          description={`За ${periodLabel} операций и распределённых расходов нет.`}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.tableTitle}>Результаты деятельности</Text>
          <Text style={styles.periodSubtitle}>{periodLabel}</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.cellProject, styles.headerText]}>Проект</Text>
              <Text style={[styles.cell, styles.headerText]}>Доход</Text>
              <Text style={[styles.cell, styles.headerText]}>Расход</Text>
              <Text style={[styles.cell, styles.headerText]}>Итог</Text>
            </View>

            {report?.rows.map((row) => {
              const isEmpty =
                row.income === 0 &&
                row.directExpense === 0 &&
                row.recurringExpense === 0 &&
                row.longTermExpense === 0;
              if (isEmpty) {
                return null;
              }

              return (
                <Pressable
                  key={row.projectId}
                  style={styles.tableRow}
                  onPress={() =>
                    router.push({
                      pathname: '/report/[projectId]',
                      params: {
                        projectId: row.projectId,
                        dateFrom: period.dateFrom,
                        dateTo: period.dateTo,
                      },
                    })
                  }
                >
                  <Text style={[styles.cell, styles.cellProject, styles.projectName]} numberOfLines={2}>
                    {row.projectName}
                  </Text>
                  <Text style={[styles.cell, styles.income]}>{formatMoney(row.income)}</Text>
                  <Text style={[styles.cell, styles.expense]}>{formatMoney(row.totalExpense)}</Text>
                  <Text
                    style={[
                      styles.cell,
                      row.result >= 0 ? styles.income : styles.expense,
                      styles.resultCell,
                    ]}
                  >
                    {formatMoney(row.result)}
                  </Text>
                </Pressable>
              );
            })}

            {report ? (
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.cell, styles.cellProject, styles.totalLabel]}>Итого</Text>
                <Text style={[styles.cell, styles.income, styles.totalValue]}>
                  {formatMoney(report.totals.income)}
                </Text>
                <Text style={[styles.cell, styles.expense, styles.totalValue]}>
                  {formatMoney(report.totals.totalExpense)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    report.totals.result >= 0 ? styles.income : styles.expense,
                    styles.totalValue,
                  ]}
                >
                  {formatMoney(report.totals.result)}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.hint}>Нажмите на строку проекта для детализации расходов.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: { fontSize: 24, color: Colors.primary, lineHeight: 28 },
  periodTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  quarterBlock: { marginBottom: 4 },
  quarterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  customField: { flex: 1 },
  customLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  customInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  scrollContent: { padding: 16, paddingBottom: 32 },
  tableTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  periodSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeader: { backgroundColor: '#f8f9fb' },
  headerText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  cell: { flex: 1, fontSize: 13, color: Colors.text, textAlign: 'right' },
  cellProject: { flex: 1.4, textAlign: 'left' },
  projectName: { fontWeight: '600', color: Colors.text },
  income: { color: Colors.success, fontWeight: '600' },
  expense: { color: Colors.danger, fontWeight: '600' },
  resultCell: { fontWeight: '700' },
  totalRow: { backgroundColor: '#f0f4ff', borderBottomWidth: 0 },
  totalLabel: { fontWeight: '700', color: Colors.text },
  totalValue: { fontWeight: '700' },
  hint: { fontSize: 13, color: Colors.textMuted, marginTop: 14, lineHeight: 20 },
});
