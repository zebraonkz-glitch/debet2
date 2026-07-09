import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAllProjects, getTransactionsEnriched } from '@/db';
import { useDb } from '@/hooks';
import { Colors } from '@/utils/colors';
import { formatMoney, getCurrentMonthRange } from '@/utils/format';

export default function HomeScreen() {
  const db = useDb();
  const router = useRouter();
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  const loadSummary = useCallback(async () => {
    const range = getCurrentMonthRange();
    const [projects, transactions] = await Promise.all([
      getAllProjects(db),
      getTransactionsEnriched(db, {
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        categoryTypes: ['income', 'expense_direct'],
      }),
    ]);

    setProjectCount(projects.length);
    setIncome(
      transactions
        .filter((t) => t.categoryType === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    );
    setExpense(
      transactions
        .filter((t) => t.categoryType === 'expense_direct')
        .reduce((sum, t) => sum + t.amount, 0),
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  const result = useMemo(() => income - expense, [income, expense]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Главная</Text>
      <Text style={styles.subtitle}>Текущий месяц</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Доходы</Text>
          <Text style={[styles.value, styles.income]}>{formatMoney(income)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Расходы</Text>
          <Text style={[styles.value, styles.expense]}>{formatMoney(expense)}</Text>
        </View>
        <View style={[styles.row, styles.resultRow]}>
          <Text style={styles.resultLabel}>Результат</Text>
          <Text style={[styles.value, result >= 0 ? styles.income : styles.expense]}>
            {formatMoney(result)}
          </Text>
        </View>
        <Text style={styles.meta}>Активных проектов: {projectCount}</Text>
      </View>

      <Text style={styles.section}>Быстрый ввод</Text>
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

      <Pressable style={styles.link} onPress={() => router.push('/categories/index')}>
        <Text style={styles.linkText}>Справочник категорий →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  label: { fontSize: 15, color: Colors.text },
  resultLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  value: { fontSize: 16, fontWeight: '700' },
  income: { color: Colors.success },
  expense: { color: Colors.danger },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  section: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickIncome: { backgroundColor: Colors.success },
  quickExpense: { backgroundColor: Colors.danger },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: { paddingVertical: 8 },
  linkText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
});
