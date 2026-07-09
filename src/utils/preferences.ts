import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CategoryType } from '@/types';

const KEYS = {
  lastProjectId: 'prefs.lastProjectId',
  lastIncomeCategoryId: 'prefs.lastIncomeCategoryId',
  lastExpenseCategoryId: 'prefs.lastExpenseCategoryId',
} as const;

export async function getLastProjectId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastProjectId);
}

export async function setLastProjectId(projectId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastProjectId, projectId);
}

export async function getLastCategoryId(type: CategoryType): Promise<string | null> {
  const key =
    type === 'income' ? KEYS.lastIncomeCategoryId : KEYS.lastExpenseCategoryId;
  return AsyncStorage.getItem(key);
}

export async function setLastCategoryId(
  type: CategoryType,
  categoryId: string,
): Promise<void> {
  const key =
    type === 'income' ? KEYS.lastIncomeCategoryId : KEYS.lastExpenseCategoryId;
  await AsyncStorage.setItem(key, categoryId);
}

export async function getLastOperationDefaults(
  operationType: 'income' | 'expense',
): Promise<{ projectId: string | null; categoryId: string | null }> {
  const categoryType = operationType === 'income' ? 'income' : 'expense_direct';
  const [projectId, categoryId] = await Promise.all([
    getLastProjectId(),
    getLastCategoryId(categoryType),
  ]);
  return { projectId, categoryId };
}

export async function saveLastOperationDefaults(
  projectId: string,
  categoryType: CategoryType,
  categoryId: string,
): Promise<void> {
  await Promise.all([setLastProjectId(projectId), setLastCategoryId(categoryType, categoryId)]);
}
