import type { SQLiteDatabase } from 'expo-sqlite';
import { createAllocationRule } from './repositories/allocationRuleRepository';
import { createCategory } from './repositories/categoryRepository';
import { createLongTermExpense } from './repositories/longTermExpenseRepository';
import { createProject } from './repositories/projectRepository';
import { createRecurringExpense } from './repositories/recurringExpenseRepository';
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

export async function seedAllocationDataIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM allocation_rules',
  );
  if ((row?.count ?? 0) > 0) {
    return;
  }

  const projects = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM projects WHERE is_active = 1',
  );
  if (projects.length < 2) {
    return;
  }

  const categories = await db.getAllAsync<{ id: string; type: string }>(
    'SELECT id, type FROM categories',
  );
  const recurringCategory = categories.find((c) => c.type === 'expense_recurring');
  const longTermCategory = categories.find((c) => c.type === 'expense_long_term');
  if (!recurringCategory || !longTermCategory) {
    return;
  }

  const equalRule = await createAllocationRule(db, {
    name: 'Поровну между проектами',
    method: 'equal',
  });

  const proportionalRule = await createAllocationRule(db, {
    name: 'По доходам',
    method: 'proportional',
  });

  await createAllocationRule(db, {
    name: '70/30',
    method: 'fixed_shares',
    shares: [
      { projectId: projects[0].id, share: 70 },
      { projectId: projects[1].id, share: 30 },
    ],
  });

  await createRecurringExpense(db, {
    categoryId: recurringCategory.id,
    amount: 30_000,
    period: 'monthly',
    startDate: '2026-01-01',
    allocationRuleId: equalRule.id,
    comment: 'Аренда офиса',
  });

  await createLongTermExpense(db, {
    categoryId: longTermCategory.id,
    totalAmount: 120_000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    distributionMethod: 'linear',
    allocationRuleId: proportionalRule.id,
    comment: 'Оборудование на год',
  });
}
