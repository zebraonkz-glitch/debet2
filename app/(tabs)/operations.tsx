import { Alert } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Form';
import { FilterChip, FilterRow } from '@/components/FilterChip';
import { OptionPickerModal, type SelectOption } from '@/components/OptionPickerModal';
import { getAllProjects, getTransactionsEnriched } from '@/db';
import { useDb } from '@/hooks';
import type { Project, TransactionEnriched } from '@/types';
import { Colors } from '@/utils/colors';
import { formatDate, formatMoney, getCurrentMonthRange } from '@/utils/format';

type TypeFilter = 'all' | 'income' | 'expense';
type PeriodFilter = 'month' | 'all';

export default function OperationsScreen() {
  const db = useDb();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionEnriched[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);

  const load = useCallback(async () => {
    const allProjects = await getAllProjects(db);
    setProjects(allProjects);

    const filters: Parameters<typeof getTransactionsEnriched>[1] = {
      categoryTypes: ['income', 'expense_direct'],
    };

    if (projectFilter !== 'all') {
      filters.projectId = projectFilter;
    }
    if (periodFilter === 'month') {
      const range = getCurrentMonthRange();
      filters.dateFrom = range.dateFrom;
      filters.dateTo = range.dateTo;
    }
    if (typeFilter === 'income') {
      filters.categoryTypes = ['income'];
    } else if (typeFilter === 'expense') {
      filters.categoryTypes = ['expense_direct'];
    }

    const data = await getTransactionsEnriched(db, filters);
    setTransactions(data);
  }, [db, periodFilter, projectFilter, typeFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const projectOptions: SelectOption[] = useMemo(
    () => [
      { id: 'all', label: 'Все проекты' },
      ...projects.map((p) => ({ id: p.id, label: p.name })),
    ],
    [projects],
  );

  const selectedProjectLabel =
    projectOptions.find((p) => p.id === projectFilter)?.label ?? 'Все проекты';

  return (
    <View style={styles.container}>
      <FilterRow>
        <FilterChip
          label="Все"
          selected={typeFilter === 'all'}
          onPress={() => setTypeFilter('all')}
        />
        <FilterChip
          label="Доходы"
          selected={typeFilter === 'income'}
          onPress={() => setTypeFilter('income')}
        />
        <FilterChip
          label="Расходы"
          selected={typeFilter === 'expense'}
          onPress={() => setTypeFilter('expense')}
        />
      </FilterRow>

      <FilterRow>
        <FilterChip
          label="Текущий месяц"
          selected={periodFilter === 'month'}
          onPress={() => setPeriodFilter('month')}
        />
        <FilterChip
          label="Всё время"
          selected={periodFilter === 'all'}
          onPress={() => setPeriodFilter('all')}
        />
        <FilterChip
          label={selectedProjectLabel}
          selected={projectFilter !== 'all'}
          onPress={() => setProjectPickerVisible(true)}
        />
      </FilterRow>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            title="Нет операций"
            description="Добавьте доход или расход по проекту."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/transaction/[id]', params: { id: item.id } })
            }
          >
            <View style={styles.row}>
              <View style={styles.main}>
                <Text style={styles.category}>{item.categoryName}</Text>
                <Text style={styles.project}>{item.projectName}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
              </View>
              <Text
                style={[
                  styles.amount,
                  item.categoryType === 'income' ? styles.income : styles.expense,
                ]}
              >
                {item.categoryType === 'income' ? '+' : '−'}
                {formatMoney(item.amount)}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Fab
        onPress={() =>
          Alert.alert('Новая операция', undefined, [
            { text: 'Доход', onPress: () => router.push({ pathname: '/transaction/new', params: { type: 'income' } }) },
            { text: 'Расход', onPress: () => router.push({ pathname: '/transaction/new', params: { type: 'expense' } }) },
            { text: 'Отмена', style: 'cancel' },
          ])
        }
        label="+"
      />

      <OptionPickerModal
        visible={projectPickerVisible}
        title="Проект"
        options={projectOptions}
        selectedId={projectFilter}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={setProjectFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 88 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingBottom: 88 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  main: { flex: 1, marginRight: 12 },
  category: { fontSize: 16, fontWeight: '600', color: Colors.text },
  project: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  date: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  comment: { fontSize: 13, color: Colors.text, marginTop: 6 },
  amount: { fontSize: 16, fontWeight: '700' },
  income: { color: Colors.success },
  expense: { color: Colors.danger },
});
