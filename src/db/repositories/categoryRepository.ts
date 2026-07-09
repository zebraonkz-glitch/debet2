import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, CategoryType } from '@/types';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { mapCategoryRow, type CategoryRow } from '../mappers';
import { generateId } from '@/utils/id';
import { validateCreateCategory, validateUpdateCategory } from '@/utils/validation';

export async function createCategory(
  db: SQLiteDatabase,
  input: CreateCategoryInput,
): Promise<Category> {
  const data = validateCreateCategory(input);
  const id = generateId();

  await db.runAsync('INSERT INTO categories (id, name, type) VALUES (?, ?, ?)', id, data.name, data.type);

  return { id, name: data.name, type: data.type };
}

export async function getCategoryById(
  db: SQLiteDatabase,
  id: string,
): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT id, name, type FROM categories WHERE id = ?',
    id,
  );
  return row ? mapCategoryRow(row) : null;
}

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>('SELECT id, name, type FROM categories ORDER BY name');
  return rows.map(mapCategoryRow);
}

export async function getCategoriesByType(
  db: SQLiteDatabase,
  type: CategoryType,
): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT id, name, type FROM categories WHERE type = ? ORDER BY name',
    type,
  );
  return rows.map(mapCategoryRow);
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const existing = await getCategoryById(db, id);
  if (!existing) {
    throw new Error(`Категория не найдена: ${id}`);
  }

  const data = validateUpdateCategory(input);
  const updated: Category = {
    ...existing,
    name: data.name ?? existing.name,
    type: data.type ?? existing.type,
  };

  await db.runAsync('UPDATE categories SET name = ?, type = ? WHERE id = ?', updated.name, updated.type, id);

  return updated;
}

export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Категория не найдена: ${id}`);
  }
}
