import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FormField, PrimaryButton, SelectField } from '@/components/Form';
import { OptionPickerModal, type SelectOption } from '@/components/OptionPickerModal';
import {
  createLongTermExpense,
  createRecurringExpense,
  deleteLongTermExpense,
  deleteRecurringExpense,
  getAllAllocationRules,
  getAllCategories,
  getLongTermExpenseById,
  getRecurringExpenseById,
  updateLongTermExpense,
  updateRecurringExpense,
} from '@/db';
import { useDb } from '@/hooks';
import type {
  AllocationRule,
  Category,
  DistributionMethod,
  LongTermExpense,
  RecurringExpense,
  RecurringPeriod,
} from '@/types';
import { Colors } from '@/utils/colors';
import { confirmDestructive } from '@/utils/confirm';
import {
  DISTRIBUTION_METHOD_LABELS,
  RECURRING_PERIOD_LABELS,
  todayIsoDate,
} from '@/utils/format';
import { ValidationError } from '@/utils/validation';
import { ScreenLoading } from '@/components/ScreenLoading';

type ExpenseFormProps = {
  kind: 'recurring' | 'long-term';
  mode: 'create' | 'edit';
  expenseId?: string;
};

export function DistributedExpenseForm({ kind, mode, expenseId }: ExpenseFormProps) {
  const db = useDb();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [allocationRuleId, setAllocationRuleId] = useState('');
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [period, setPeriod] = useState<RecurringPeriod>('monthly');
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('linear');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [picker, setPicker] = useState<'category' | 'rule' | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(mode === 'create');

  const categoryType = kind === 'recurring' ? 'expense_recurring' : 'expense_long_term';

  const load = useCallback(async () => {
    const [allCategories, allRules] = await Promise.all([
      getAllCategories(db),
      getAllAllocationRules(db),
    ]);
    const filtered = allCategories.filter((c) => c.type === categoryType);
    setCategories(filtered);
    setRules(allRules);

    if (mode === 'edit' && expenseId) {
      if (kind === 'recurring') {
        const expense = await getRecurringExpenseById(db, expenseId);
        if (expense) fillRecurring(expense);
      } else {
        const expense = await getLongTermExpenseById(db, expenseId);
        if (expense) fillLongTerm(expense);
      }
    } else {
      if (filtered[0]) setCategoryId(filtered[0].id);
      if (allRules[0]) setAllocationRuleId(allRules[0].id);
      if (kind === 'long-term') {
        setEndDate(`${new Date().getFullYear()}-12-31`);
      }
    }
    setLoaded(true);
  }, [db, mode, expenseId, kind, categoryType]);

  const fillRecurring = (expense: RecurringExpense) => {
    setCategoryId(expense.categoryId);
    setAmount(String(expense.amount));
    setPeriod(expense.period);
    setStartDate(expense.startDate);
    setEndDate(expense.endDate ?? '');
    setAllocationRuleId(expense.allocationRuleId);
    setComment(expense.comment ?? '');
  };

  const fillLongTerm = (expense: LongTermExpense) => {
    setCategoryId(expense.categoryId);
    setTotalAmount(String(expense.totalAmount));
    setStartDate(expense.startDate);
    setEndDate(expense.endDate);
    setDistributionMethod(expense.distributionMethod);
    setAllocationRuleId(expense.allocationRuleId);
    setComment(expense.comment ?? '');
  };

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  );
  const ruleOptions: SelectOption[] = useMemo(
    () => rules.map((r) => ({ id: r.id, label: r.name })),
    [rules],
  );

  const handleSubmit = async () => {
    setError('');
    try {
      if (kind === 'recurring') {
        const payload = {
          categoryId,
          amount: Number(amount.replace(',', '.')),
          period,
          startDate,
          endDate: endDate.trim() || undefined,
          allocationRuleId,
          comment: comment.trim() || undefined,
        };
        if (mode === 'create') {
          await createRecurringExpense(db, payload);
        } else if (expenseId) {
          await updateRecurringExpense(db, expenseId, payload);
        }
      } else {
        const payload = {
          categoryId,
          totalAmount: Number(totalAmount.replace(',', '.')),
          startDate,
          endDate: endDate.trim() || todayIsoDate(),
          distributionMethod,
          allocationRuleId,
          comment: comment.trim() || undefined,
        };
        if (mode === 'create') {
          await createLongTermExpense(db, payload);
        } else if (expenseId) {
          await updateLongTermExpense(db, expenseId, payload);
        }
      }
      router.back();
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить');
      }
    }
  };

  const handleDelete = () => {
    if (!expenseId) return;
    const title = kind === 'recurring' ? 'Удалить постоянный расход?' : 'Удалить долгоиграющий расход?';
    confirmDestructive(title, 'Действие нельзя отменить', 'Удалить', async () => {
      if (kind === 'recurring') {
        await deleteRecurringExpense(db, expenseId);
      } else {
        await deleteLongTermExpense(db, expenseId);
      }
      router.back();
    });
  };

  if (!loaded) {
    return <ScreenLoading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <SelectField
          label="Категория"
          value={categories.find((c) => c.id === categoryId)?.name}
          onPress={() => setPicker('category')}
        />
        <SelectField
          label="Правило распределения"
          value={rules.find((r) => r.id === allocationRuleId)?.name}
          onPress={() => setPicker('rule')}
        />

        {kind === 'recurring' ? (
          <>
            <FormField label="Сумма, ₽" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={styles.label}>Период</Text>
            {(['monthly', 'yearly'] as RecurringPeriod[]).map((item) => (
              <Pressable key={item} onPress={() => setPeriod(item)}>
                <Text style={[styles.option, period === item ? styles.optionActive : null]}>
                  {RECURRING_PERIOD_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <FormField
              label="Общая сумма, ₽"
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Распределение по времени</Text>
            {(['linear', 'manual'] as DistributionMethod[]).map((item) => (
              <Pressable key={item} onPress={() => setDistributionMethod(item)}>
                <Text
                  style={[
                    styles.option,
                    distributionMethod === item ? styles.optionActive : null,
                  ]}
                >
                  {DISTRIBUTION_METHOD_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        <FormField label="Дата начала" value={startDate} onChangeText={setStartDate} />
        <FormField
          label={kind === 'recurring' ? 'Дата окончания (необязательно)' : 'Дата окончания'}
          value={endDate}
          onChangeText={setEndDate}
        />
        <FormField label="Комментарий" value={comment} onChangeText={setComment} multiline />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="Сохранить" onPress={handleSubmit} />
        {mode === 'edit' ? (
          <View style={styles.deleteWrap}>
            <PrimaryButton title="Удалить" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
      </ScrollView>

      <OptionPickerModal
        visible={picker === 'category'}
        title="Категория"
        options={categoryOptions}
        selectedId={categoryId}
        onClose={() => setPicker(null)}
        onSelect={setCategoryId}
      />
      <OptionPickerModal
        visible={picker === 'rule'}
        title="Правило"
        options={ruleOptions}
        selectedId={allocationRuleId}
        onClose={() => setPicker(null)}
        onSelect={setAllocationRuleId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  option: {
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: Colors.text,
  },
  optionActive: { backgroundColor: '#e8effd', borderColor: Colors.primary },
  error: { color: Colors.danger, marginBottom: 12 },
  deleteWrap: { marginTop: 12 },
});
