import type { SQLiteDatabase } from 'expo-sqlite';
import type { RecurringExpense } from '@/types';
import type { CreateRecurringExpenseInput, UpdateRecurringExpenseInput } from '@/types';
import { mapRecurringExpenseRow, type RecurringExpenseRow } from '../mappers';
import { generateId } from '@/utils/id';
import { validateCreateRecurringExpense, validateUpdateRecurringExpense } from '@/utils/validation';
import { getCategoryById } from './categoryRepository';

export async function createRecurringExpense(
  db: SQLiteDatabase,
  input: CreateRecurringExpenseInput,
): Promise<RecurringExpense> {
  const data = validateCreateRecurringExpense(input);
  const category = await getCategoryById(db, data.categoryId);
  if (!category || category.type !== 'expense_recurring') {
    throw new Error('Категория должна иметь тип «постоянный расход»');
  }

  const id = generateId();
  await db.runAsync(
    `INSERT INTO recurring_expenses
      (id, category_id, amount, period, start_date, end_date, allocation_rule_id, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.categoryId,
    data.amount,
    data.period,
    data.startDate,
    data.endDate ?? null,
    data.allocationRuleId,
    data.comment ?? null,
  );

  return {
    id,
    categoryId: data.categoryId,
    amount: data.amount,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate,
    allocationRuleId: data.allocationRuleId,
    comment: data.comment,
  };
}

export async function getRecurringExpenseById(
  db: SQLiteDatabase,
  id: string,
): Promise<RecurringExpense | null> {
  const row = await db.getFirstAsync<RecurringExpenseRow>(
    `SELECT id, category_id, amount, period, start_date, end_date, allocation_rule_id, comment
     FROM recurring_expenses WHERE id = ?`,
    id,
  );
  return row ? mapRecurringExpenseRow(row) : null;
}

export async function getAllRecurringExpenses(
  db: SQLiteDatabase,
): Promise<RecurringExpense[]> {
  const rows = await db.getAllAsync<RecurringExpenseRow>(
    `SELECT id, category_id, amount, period, start_date, end_date, allocation_rule_id, comment
     FROM recurring_expenses ORDER BY start_date DESC`,
  );
  return rows.map(mapRecurringExpenseRow);
}

export async function updateRecurringExpense(
  db: SQLiteDatabase,
  id: string,
  input: UpdateRecurringExpenseInput,
): Promise<RecurringExpense> {
  const existing = await getRecurringExpenseById(db, id);
  if (!existing) {
    throw new Error(`Постоянный расход не найден: ${id}`);
  }

  const data = validateUpdateRecurringExpense(input);
  const updated: RecurringExpense = {
    ...existing,
    categoryId: data.categoryId ?? existing.categoryId,
    amount: data.amount ?? existing.amount,
    period: data.period ?? existing.period,
    startDate: data.startDate ?? existing.startDate,
    endDate: data.endDate !== undefined ? data.endDate ?? undefined : existing.endDate,
    allocationRuleId: data.allocationRuleId ?? existing.allocationRuleId,
    comment: data.comment !== undefined ? data.comment ?? undefined : existing.comment,
  };

  if (data.categoryId) {
    const category = await getCategoryById(db, data.categoryId);
    if (!category || category.type !== 'expense_recurring') {
      throw new Error('Категория должна иметь тип «постоянный расход»');
    }
  }

  await db.runAsync(
    `UPDATE recurring_expenses
     SET category_id = ?, amount = ?, period = ?, start_date = ?, end_date = ?,
         allocation_rule_id = ?, comment = ?
     WHERE id = ?`,
    updated.categoryId,
    updated.amount,
    updated.period,
    updated.startDate,
    updated.endDate ?? null,
    updated.allocationRuleId,
    updated.comment ?? null,
    id,
  );

  return updated;
}

export async function deleteRecurringExpense(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM recurring_expenses WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Постоянный расход не найден: ${id}`);
  }
}
