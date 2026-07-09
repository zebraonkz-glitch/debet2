import type { SQLiteDatabase } from 'expo-sqlite';
import type { LongTermExpense } from '@/types';
import type { CreateLongTermExpenseInput, UpdateLongTermExpenseInput } from '@/types';
import { mapLongTermExpenseRow, type LongTermExpenseRow } from '../mappers';
import { generateId } from '@/utils/id';
import { validateCreateLongTermExpense, validateUpdateLongTermExpense } from '@/utils/validation';
import { getCategoryById } from './categoryRepository';

export async function createLongTermExpense(
  db: SQLiteDatabase,
  input: CreateLongTermExpenseInput,
): Promise<LongTermExpense> {
  const data = validateCreateLongTermExpense(input);
  const category = await getCategoryById(db, data.categoryId);
  if (!category || category.type !== 'expense_long_term') {
    throw new Error('Категория должна иметь тип «долгоиграющий расход»');
  }

  const id = generateId();
  await db.runAsync(
    `INSERT INTO long_term_expenses
      (id, category_id, total_amount, start_date, end_date, distribution_method, allocation_rule_id, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.categoryId,
    data.totalAmount,
    data.startDate,
    data.endDate,
    data.distributionMethod,
    data.allocationRuleId,
    data.comment ?? null,
  );

  return {
    id,
    categoryId: data.categoryId,
    totalAmount: data.totalAmount,
    startDate: data.startDate,
    endDate: data.endDate,
    distributionMethod: data.distributionMethod,
    allocationRuleId: data.allocationRuleId,
    comment: data.comment,
  };
}

export async function getLongTermExpenseById(
  db: SQLiteDatabase,
  id: string,
): Promise<LongTermExpense | null> {
  const row = await db.getFirstAsync<LongTermExpenseRow>(
    `SELECT id, category_id, total_amount, start_date, end_date, distribution_method, allocation_rule_id, comment
     FROM long_term_expenses WHERE id = ?`,
    id,
  );
  return row ? mapLongTermExpenseRow(row) : null;
}

export async function getAllLongTermExpenses(db: SQLiteDatabase): Promise<LongTermExpense[]> {
  const rows = await db.getAllAsync<LongTermExpenseRow>(
    `SELECT id, category_id, total_amount, start_date, end_date, distribution_method, allocation_rule_id, comment
     FROM long_term_expenses ORDER BY start_date DESC`,
  );
  return rows.map(mapLongTermExpenseRow);
}

export async function updateLongTermExpense(
  db: SQLiteDatabase,
  id: string,
  input: UpdateLongTermExpenseInput,
): Promise<LongTermExpense> {
  const existing = await getLongTermExpenseById(db, id);
  if (!existing) {
    throw new Error(`Долгоиграющий расход не найден: ${id}`);
  }

  const data = validateUpdateLongTermExpense(input);
  const updated: LongTermExpense = {
    ...existing,
    categoryId: data.categoryId ?? existing.categoryId,
    totalAmount: data.totalAmount ?? existing.totalAmount,
    startDate: data.startDate ?? existing.startDate,
    endDate: data.endDate ?? existing.endDate,
    distributionMethod: data.distributionMethod ?? existing.distributionMethod,
    allocationRuleId: data.allocationRuleId ?? existing.allocationRuleId,
    comment: data.comment !== undefined ? data.comment ?? undefined : existing.comment,
  };

  if (data.categoryId) {
    const category = await getCategoryById(db, data.categoryId);
    if (!category || category.type !== 'expense_long_term') {
      throw new Error('Категория должна иметь тип «долгоиграющий расход»');
    }
  }

  await db.runAsync(
    `UPDATE long_term_expenses
     SET category_id = ?, total_amount = ?, start_date = ?, end_date = ?,
         distribution_method = ?, allocation_rule_id = ?, comment = ?
     WHERE id = ?`,
    updated.categoryId,
    updated.totalAmount,
    updated.startDate,
    updated.endDate,
    updated.distributionMethod,
    updated.allocationRuleId,
    updated.comment ?? null,
    id,
  );

  return updated;
}

export async function deleteLongTermExpense(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM long_term_expenses WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Долгоиграющий расход не найден: ${id}`);
  }
}
