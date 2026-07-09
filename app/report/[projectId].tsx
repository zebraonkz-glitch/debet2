import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { buildProjectReportDetail } from '@/domain/reportService';
import { useDb } from '@/hooks';
import type { ProjectReportDetail } from '@/types';
import { Colors } from '@/utils/colors';
import { formatMoney, formatPeriodRange } from '@/utils/format';

export default function ProjectReportDetailScreen() {
  const { projectId, dateFrom, dateTo } = useLocalSearchParams<{
    projectId: string;
    dateFrom: string;
    dateTo: string;
  }>();
  const db = useDb();
  const [detail, setDetail] = useState<ProjectReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId || !dateFrom || !dateTo) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await buildProjectReportDetail(db, projectId, { dateFrom, dateTo });
      setDetail(data);
    } finally {
      setLoading(false);
    }
  }, [db, projectId, dateFrom, dateTo]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Данные не найдены</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{detail.projectName}</Text>
      <Text style={styles.subtitle}>{formatPeriodRange(detail.period)}</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="Доходы" value={detail.income} positive />
        <SummaryRow label="Прямые расходы" value={detail.directExpense} />
        <SummaryRow label="Постоянные (доля)" value={detail.recurringExpense} />
        <SummaryRow label="Долгоиграющие (доля)" value={detail.longTermExpense} />
        <View style={styles.divider} />
        <SummaryRow label="Всего расходов" value={detail.totalExpense} />
        <SummaryRow
          label="Результат"
          value={detail.result}
          positive={detail.result >= 0}
          highlight
        />
      </View>

      {detail.directByCategory.length > 0 ? (
        <Section title="Прямые расходы по категориям">
          {detail.directByCategory.map((line) => (
            <LineRow key={line.categoryName} title={line.categoryName} amount={line.amount} />
          ))}
        </Section>
      ) : null}

      {detail.recurringLines.length > 0 ? (
        <Section title="Доля постоянных расходов">
          {detail.recurringLines.map((line) => (
            <LineRow key={line.expenseId} title={line.title} amount={line.amount} />
          ))}
        </Section>
      ) : null}

      {detail.longTermLines.length > 0 ? (
        <Section title="Доля долгоиграющих расходов">
          {detail.longTermLines.map((line) => (
            <LineRow key={line.expenseId} title={line.title} amount={line.amount} />
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function LineRow({ title, amount }: { title: string; amount: number }) {
  return (
    <View style={styles.lineRow}>
      <Text style={styles.lineTitle}>{title}</Text>
      <Text style={styles.lineAmount}>{formatMoney(amount)}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  positive,
  highlight,
}: {
  label: string;
  value: number;
  positive?: boolean;
  highlight?: boolean;
}) {
  const valueStyle = positive === undefined ? styles.neutral : positive ? styles.income : styles.expense;
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, highlight ? styles.highlightLabel : null]}>{label}</Text>
      <Text style={[styles.summaryValue, valueStyle, highlight ? styles.highlightValue : null]}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  muted: { color: Colors.textMuted },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 15, color: Colors.text },
  summaryValue: { fontSize: 15, fontWeight: '600' },
  highlightLabel: { fontWeight: '700', fontSize: 16 },
  highlightValue: { fontSize: 17, fontWeight: '700' },
  income: { color: Colors.success },
  expense: { color: Colors.danger },
  neutral: { color: Colors.text },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lineTitle: { flex: 1, fontSize: 14, color: Colors.text, marginRight: 8 },
  lineAmount: { fontSize: 14, fontWeight: '600', color: Colors.danger },
});
