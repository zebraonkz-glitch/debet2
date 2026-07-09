import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryType, Transaction } from '@/types';
import type { CreateTransactionInput, TransactionFilters, UpdateTransactionInput } from '@/types';
import { mapTransactionRow, type TransactionRow } from '../mappers';
import { generateId, nowIso } from '@/utils/id';
import {
  validateCreateTransaction,
  validateUpdateTransaction,
  ValidationError,
} from '@/utils/validation';
import { getCategoryById } from './categoryRepository';
import { getProjectById } from './projectRepository';

async function assertTransactionRelations(
  db: SQLiteDatabase,
  projectId: string,
  categoryId: string,
): Promise<CategoryType> {
  const project = await getProjectById(db, projectId);
  if (!project) {
    throw new Error(`Проект не найден: ${projectId}`);
  }
  if (!project.isActive) {
    throw new Error('Нельзя добавить операцию в архивный проект');
  }

  const category = await getCategoryById(db, categoryId);
  if (!category) {
    throw new Error(`Категория не найдена: ${categoryId}`);
  }

  if (category.type === 'expense_recurring' || category.type === 'expense_long_term') {
    throw new ValidationError(
      'categoryId',
      'Для операций используйте категории дохода или прямых расходов',
    );
  }

  return category.type;
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const data = validateCreateTransaction(input);
  await assertTransactionRelations(db, data.projectId, data.categoryId);

  const id = generateId();
  const createdAt = nowIso();

  await db.runAsync(
    `INSERT INTO transactions (id, project_id, category_id, amount, date, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.projectId,
    data.categoryId,
    data.amount,
    data.date,
    data.comment ?? null,
    createdAt,
  );

  return {
    id,
    projectId: data.projectId,
    categoryId: data.categoryId,
    amount: data.amount,
    date: data.date,
    comment: data.comment,
    createdAt,
  };
}

export async function getTransactionById(
  db: SQLiteDatabase,
  id: string,
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    `SELECT id, project_id, category_id, amount, date, comment, created_at
     FROM transactions WHERE id = ?`,
    id,
  );
  return row ? mapTransactionRow(row) : null;
}

export async function getAllTransactions(
  db: SQLiteDatabase,
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.projectId) {
    conditions.push('project_id = ?');
    params.push(filters.projectId);
  }
  if (filters?.categoryId) {
    conditions.push('category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters?.dateFrom) {
    conditions.push('date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push('date <= ?');
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT id, project_id, category_id, amount, date, comment, created_at
     FROM transactions
     ${whereClause}
     ORDER BY date DESC, created_at DESC`,
    ...params,
  );

  return rows.map(mapTransactionRow);
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const existing = await getTransactionById(db, id);
  if (!existing) {
    throw new Error(`Операция не найдена: ${id}`);
  }

  const data = validateUpdateTransaction(input);
  const updated: Transaction = {
    ...existing,
    projectId: data.projectId ?? existing.projectId,
    categoryId: data.categoryId ?? existing.categoryId,
    amount: data.amount ?? existing.amount,
    date: data.date ?? existing.date,
    comment:
      data.comment !== undefined ? data.comment ?? undefined : existing.comment,
  };

  await assertTransactionRelations(db, updated.projectId, updated.categoryId);

  await db.runAsync(
    `UPDATE transactions
     SET project_id = ?, category_id = ?, amount = ?, date = ?, comment = ?
     WHERE id = ?`,
    updated.projectId,
    updated.categoryId,
    updated.amount,
    updated.date,
    updated.comment ?? null,
    id,
  );

  return updated;
}

export async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Операция не найдена: ${id}`);
  }
}
