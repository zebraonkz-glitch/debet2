import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, EmptyState, ScreenLoading, SummaryRow } from '@/components';
import { buildActivityReport } from '@/domain/reportService';
import { isReportRowEmpty } from '@/utils/csvExport';
import { useAppSettings, useDb } from '@/hooks';
import type { ActivityReport } from '@/types';
import { Colors } from '@/utils/colors';
import {
  formatMoney,
  formatMonthYear,
  getCurrentMonthRange,
} from '@/utils/format';
import { Theme } from '@/utils/theme';

export default function HomeScreen() {
  const db = useDb();
  const router = useRouter();
  useAppSettings();
  const now = new Date();
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthLabel = useMemo(
    () => formatMonthYear(now.getFullYear(), now.getMonth() + 1),
    [now],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await buildActivityReport(db, getCurrentMonthRange());
      setReport(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить сводку';
      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const activeProjects = useMemo(
    () => report?.rows.filter((row) => !isReportRowEmpty(row)) ?? [],
    [report],
  );

  if (loading) {
    return <ScreenLoading message="Загрузка сводки…" />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <EmptyState title="Не удалось загрузить данные" description={error} />
        <Pressable style={styles.retryButton} onPress={() => void loadDashboard()}>
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const totals = report?.totals;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{monthLabel}</Text>

      <Card>
        <Text style={styles.cardTitle}>Итог месяца</Text>
        <SummaryRow label="Доходы" value={formatMoney(totals?.income ?? 0)} valueTone="income" />
        <SummaryRow
          label="Прямые расходы"
          value={formatMoney(totals?.directExpense ?? 0)}
          valueTone="expense"
        />
        <SummaryRow
          label="Постоянные"
          value={formatMoney(totals?.recurringExpense ?? 0)}
          valueTone="expense"
        />
        <SummaryRow
          label="Долгоиграющие"
          value={formatMoney(totals?.longTermExpense ?? 0)}
          valueTone="expense"
        />
        <SummaryRow
          label="Результат"
          value={formatMoney(totals?.result ?? 0)}
          valueTone={(totals?.result ?? 0) >= 0 ? 'income' : 'expense'}
          highlight
        />
      </Card>

      <Text style={styles.sectionTitle}>Проекты</Text>
      {activeProjects.length === 0 ? (
        <EmptyState
          title="Нет данных за месяц"
          description="Добавьте операции или настройте распределённые расходы."
          style={styles.emptyProjects}
        />
      ) : (
        activeProjects.map((row) => (
          <Card
            key={row.projectId}
            onPress={() =>
              router.push({
                pathname: '/report/[projectId]',
                params: {
                  projectId: row.projectId,
                  dateFrom: report!.period.dateFrom,
                  dateTo: report!.period.dateTo,
                },
              })
            }
          >
            <Text style={styles.projectName}>{row.projectName}</Text>
            <View style={styles.projectStats}>
              <Stat label="Доход" value={formatMoney(row.income)} tone="income" />
              <Stat label="Расход" value={formatMoney(row.totalExpense)} tone="expense" />
              <Stat
                label="Итог"
                value={formatMoney(row.result)}
                tone={row.result >= 0 ? 'income' : 'expense'}
              />
            </View>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Быстрый ввод</Text>
      <View style={styles.quickRow}>
        <Pressable
          style={[styles.quickButton, styles.quickIncome]}
          onPress={() =>
            router.push({ pathname: '/transaction/new', params: { type: 'income' } })
          }
        >
          <Text style={styles.quickButtonText}>+ Доход</Text>
        </Pressable>
        <Pressable
          style={[styles.quickButton, styles.quickExpense]}
          onPress={() =>
            router.push({ pathname: '/transaction/new', params: { type: 'expense' } })
          }
        >
          <Text style={styles.quickButtonText}>+ Расход</Text>
        </Pressable>
      </View>

      <Pressable style={styles.link} onPress={() => router.push('/categories')}>
        <Text style={styles.linkText}>Справочник категорий →</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.push('/(tabs)/report')}>
        <Text style={styles.linkText}>Полный отчёт →</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.push('/settings')}>
        <Text style={styles.linkText}>Настройки →</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense';
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'income' ? styles.income : styles.expense]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: Theme.screen,
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  centered: {
    ...Theme.screen,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  subtitle: {
    ...Theme.typography.caption,
    marginBottom: Theme.spacing.md,
    textTransform: 'capitalize',
  },
  cardTitle: {
    ...Theme.typography.section,
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.section,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  stat: { flex: 1 },
  statLabel: Theme.typography.caption,
  statValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  income: { color: Colors.success },
  expense: { color: Colors.danger },
  quickRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  quickIncome: { backgroundColor: Colors.success },
  quickExpense: { backgroundColor: Colors.danger },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: { paddingVertical: Theme.spacing.sm },
  linkText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  emptyProjects: { paddingVertical: Theme.spacing.md },
  retryButton: {
    marginTop: Theme.spacing.md,
    alignSelf: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    backgroundColor: Colors.primary,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
