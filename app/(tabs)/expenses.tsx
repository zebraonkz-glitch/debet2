import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Form';
import {
  getAllAllocationRules,
  getAllCategories,
  getAllLongTermExpenses,
  getAllProjects,
  getAllRecurringExpenses,
} from '@/db';
import { calculateDistributedExpenseShare } from '@/domain/allocationQueries';
import {
  longTermExpenseAmountInPeriod,
  recurringExpenseAmountInPeriod,
} from '@/domain/allocationService';
import { useDb } from '@/hooks';
import type { AllocationRule, Category, LongTermExpense, RecurringExpense } from '@/types';
import { Colors } from '@/utils/colors';
import {
  ALLOCATION_METHOD_LABELS,
  formatMoney,
  getCurrentMonthRange,
  RECURRING_PERIOD_LABELS,
} from '@/utils/format';

type ExpenseListItem = {
  id: string;
  kind: 'recurring' | 'long-term';
  title: string;
  subtitle: string;
  monthAmount: number;
};

export default function ExpensesScreen() {
  const db = useDb();
  const router = useRouter();
  const [items, setItems] = useState<ExpenseListItem[]>([]);
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [preview, setPreview] = useState<{ projectName: string; amount: number }[]>([]);

  const load = useCallback(async () => {
    const period = getCurrentMonthRange();
    const [recurring, longTerm, categories, allRules, projects] = await Promise.all([
      getAllRecurringExpenses(db),
      getAllLongTermExpenses(db),
      getAllCategories(db),
      getAllAllocationRules(db),
      getAllProjects(db),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const ruleMap = new Map(allRules.map((r) => [r.id, r]));

    setItems([
      ...recurring.map((expense) => toRecurringItem(expense, categoryMap, ruleMap, period)),
      ...longTerm.map((expense) => toLongTermItem(expense, categoryMap, ruleMap, period)),
    ]);
    setRules(allRules);

    const shares: { projectName: string; amount: number }[] = [];
    for (const project of projects.filter((p) => p.isActive)) {
      const result = await calculateDistributedExpenseShare(db, project.id, period);
      if (result.total > 0) {
        shares.push({ projectName: project.name, amount: result.total });
      }
    }
    setPreview(shares);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openAddMenu = () => {
    Alert.alert('Добавить', undefined, [
      { text: 'Постоянный расход', onPress: () => router.push('/recurring/new') },
      { text: 'Долгоиграющий расход', onPress: () => router.push('/long-term/new') },
      { text: 'Правило распределения', onPress: () => router.push('/allocation-rule/new') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Доли за текущий месяц</Text>
            {preview.length === 0 ? (
              <Text style={styles.muted}>Нет распределённых расходов в этом месяце</Text>
            ) : (
              preview.map((item) => (
                <View key={item.projectName} style={styles.previewRow}>
                  <Text style={styles.previewName}>{item.projectName}</Text>
                  <Text style={styles.previewAmount}>{formatMoney(item.amount)}</Text>
                </View>
              ))
            )}

            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Правила распределения</Text>
              <Pressable onPress={() => router.push('/allocation-rule/new')}>
                <Text style={styles.link}>+ Новое</Text>
              </Pressable>
            </View>
            {rules.map((rule) => (
              <Pressable
                key={rule.id}
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: '/allocation-rule/[id]', params: { id: rule.id } })
                }
              >
                <Text style={styles.cardTitle}>{rule.name}</Text>
                <Text style={styles.cardMeta}>{ALLOCATION_METHOD_LABELS[rule.method]}</Text>
              </Pressable>
            ))}

            <Text style={[styles.sectionTitle, styles.expensesTitle]}>Расходы</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Нет постоянных расходов"
            description="Добавьте постоянный или долгоиграющий расход."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: item.kind === 'recurring' ? '/recurring/[id]' : '/long-term/[id]',
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.subtitle}</Text>
            <Text style={styles.cardAmount}>За месяц: {formatMoney(item.monthAmount)}</Text>
          </Pressable>
        )}
      />
      <Fab onPress={openAddMenu} />
    </View>
  );
}

function toRecurringItem(
  expense: RecurringExpense,
  categoryMap: Map<string, Category>,
  ruleMap: Map<string, AllocationRule>,
  period: { dateFrom: string; dateTo: string },
): ExpenseListItem {
  const category = categoryMap.get(expense.categoryId);
  const rule = ruleMap.get(expense.allocationRuleId);
  return {
    id: expense.id,
    kind: 'recurring',
    title: category?.name ?? 'Постоянный расход',
    subtitle: `${RECURRING_PERIOD_LABELS[expense.period]} · ${rule?.name ?? 'Правило'}`,
    monthAmount: recurringExpenseAmountInPeriod(expense, period),
  };
}

function toLongTermItem(
  expense: LongTermExpense,
  categoryMap: Map<string, Category>,
  ruleMap: Map<string, AllocationRule>,
  period: { dateFrom: string; dateTo: string },
): ExpenseListItem {
  const category = categoryMap.get(expense.categoryId);
  const rule = ruleMap.get(expense.allocationRuleId);
  return {
    id: expense.id,
    kind: 'long-term',
    title: category?.name ?? 'Долгоиграющий расход',
    subtitle: `${formatMoney(expense.totalAmount)} · ${rule?.name ?? 'Правило'}`,
    monthAmount: longTermExpenseAmountInPeriod(expense, period),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: 16, paddingBottom: 88 },
  emptyList: { flexGrow: 1, padding: 16, paddingBottom: 88 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  expensesTitle: { marginTop: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  link: { color: Colors.primary, fontWeight: '600' },
  muted: { color: Colors.textMuted, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  previewName: { fontSize: 14, color: Colors.text },
  previewAmount: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cardMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  cardAmount: { fontSize: 14, color: Colors.danger, marginTop: 8, fontWeight: '600' },
});
