import type { SQLiteDatabase } from 'expo-sqlite';
import { createCategory } from './repositories/categoryRepository';
import { createProject } from './repositories/projectRepository';
import { createTransaction } from './repositories/transactionRepository';

const DEFAULT_CATEGORIES = [
  { name: 'Доход от клиента', type: 'income' as const },
  { name: 'Материалы', type: 'expense_direct' as const },
  { name: 'Подряд', type: 'expense_direct' as const },
  { name: 'Аренда офиса', type: 'expense_recurring' as const },
  { name: 'Оборудование', type: 'expense_long_term' as const },
];

const DEFAULT_PROJECTS = [
  { name: 'Сайт для клиента А', description: 'Корпоративный сайт' },
  { name: 'Мобильное приложение Б', description: 'MVP для стартапа' },
  { name: 'Внутренние расходы', description: 'Административные затраты' },
];

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM projects');
  if ((row?.count ?? 0) > 0) {
    return;
  }

  const categories = [];
  for (const item of DEFAULT_CATEGORIES) {
    categories.push(await createCategory(db, item));
  }

  const projects = [];
  for (const item of DEFAULT_PROJECTS) {
    projects.push(await createProject(db, item));
  }

  const incomeCategory = categories.find((c) => c.type === 'income');
  const expenseCategory = categories.find((c) => c.type === 'expense_direct');

  if (incomeCategory && expenseCategory && projects[0]) {
    await createTransaction(db, {
      projectId: projects[0].id,
      categoryId: incomeCategory.id,
      amount: 150_000,
      date: '2026-07-01',
      comment: 'Аванс по договору',
    });

    await createTransaction(db, {
      projectId: projects[0].id,
      categoryId: expenseCategory.id,
      amount: 25_000,
      date: '2026-07-05',
      comment: 'Закупка материалов',
    });
  }
}
