import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FormField, PrimaryButton, SelectField } from '@/components/Form';
import { OptionPickerModal, type SelectOption } from '@/components/OptionPickerModal';
import {
  createTransaction,
  getAllCategories,
  getAllProjects,
  updateTransaction,
} from '@/db';
import { useDb, useDisplayFormat } from '@/hooks';
import type { Category, CategoryType, Project, Transaction } from '@/types';
import { Colors } from '@/utils/colors';
import { todayIsoDate } from '@/utils/format';
import { getLastOperationDefaults, saveLastOperationDefaults } from '@/utils/preferences';
import { ValidationError } from '@/utils/validation';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  operationType: 'income' | 'expense';
  transaction?: Transaction;
  onSaved: () => void;
};

export function TransactionForm({
  mode,
  operationType,
  transaction,
  onSaved,
}: TransactionFormProps) {
  const db = useDb();
  const router = useRouter();
  const { amountFieldLabel } = useDisplayFormat();
  const categoryType: CategoryType = operationType === 'income' ? 'income' : 'expense_direct';

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projectId, setProjectId] = useState(transaction?.projectId ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [date, setDate] = useState(transaction?.date ?? todayIsoDate());
  const [comment, setComment] = useState(transaction?.comment ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<'project' | 'category' | null>(null);
  const defaultsAppliedRef = useRef(false);

  const loadData = useCallback(async () => {
    const [allProjects, allCategories] = await Promise.all([
      getAllProjects(db),
      getAllCategories(db),
    ]);
    const filteredCategories = allCategories.filter((c) => c.type === categoryType);
    setProjects(allProjects);
    setCategories(filteredCategories);

    if (mode === 'create' && !transaction && !defaultsAppliedRef.current) {
      defaultsAppliedRef.current = true;
      const defaults = await getLastOperationDefaults(operationType);
      let nextProjectId = '';
      let nextCategoryId = '';

      if (defaults.projectId && allProjects.some((p) => p.id === defaults.projectId)) {
        nextProjectId = defaults.projectId;
      } else if (allProjects.length === 1) {
        nextProjectId = allProjects[0].id;
      }

      if (
        defaults.categoryId &&
        filteredCategories.some((c) => c.id === defaults.categoryId)
      ) {
        nextCategoryId = defaults.categoryId;
      } else if (filteredCategories.length > 0) {
        nextCategoryId = filteredCategories[0].id;
      }

      setProjectId(nextProjectId);
      setCategoryId(nextCategoryId);
    }
  }, [db, mode, operationType, categoryType, transaction]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const projectOptions: SelectOption[] = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name })),
    [projects],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  );

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async () => {
    setErrors({});
    setSaving(true);
    try {
      const parsedAmount = Number(amount.replace(',', '.'));

      if (mode === 'create') {
        await createTransaction(db, {
          projectId,
          categoryId,
          amount: parsedAmount,
          date,
          comment: comment.trim() || undefined,
        });
        await saveLastOperationDefaults(projectId, categoryType, categoryId);
      } else if (transaction) {
        await updateTransaction(db, transaction.id, {
          projectId,
          categoryId,
          amount: parsedAmount,
          date,
          comment: comment.trim() || null,
        });
        await saveLastOperationDefaults(projectId, categoryType, categoryId);
      }

      onSaved();
      router.back();
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ [error.field]: error.message });
      } else {
        Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось сохранить');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.hint}>
          {operationType === 'income' ? 'Доход' : 'Прямой расход'}
        </Text>

        <SelectField
          label="Проект"
          value={selectedProject?.name}
          placeholder="Выберите проект"
          error={errors.projectId}
          onPress={() => setPicker('project')}
        />

        <SelectField
          label="Категория"
          value={selectedCategory?.name}
          placeholder="Выберите категорию"
          error={errors.categoryId}
          onPress={() => setPicker('category')}
        />
        {operationType === 'expense' ? (
          <Text style={styles.fieldHint}>
            Показаны категории типа «Прямой расход». Для постоянных и долгоиграющих — вкладка «Расходы».
          </Text>
        ) : null}

        <FormField
          label={amountFieldLabel()}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        <FormField
          label="Дата (ГГГГ-ММ-ДД)"
          value={date}
          onChangeText={setDate}
          error={errors.date}
        />

        <FormField
          label="Комментарий"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <PrimaryButton
          title={mode === 'create' ? 'Сохранить' : 'Обновить'}
          onPress={handleSubmit}
          disabled={saving}
        />
      </ScrollView>

      <OptionPickerModal
        visible={picker === 'project'}
        title="Проект"
        options={projectOptions}
        selectedId={projectId}
        onClose={() => setPicker(null)}
        onSelect={setProjectId}
      />

      <OptionPickerModal
        visible={picker === 'category'}
        title="Категория"
        options={categoryOptions}
        selectedId={categoryId}
        onClose={() => setPicker(null)}
        onSelect={setCategoryId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  hint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  fieldHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: 16,
  },
});
