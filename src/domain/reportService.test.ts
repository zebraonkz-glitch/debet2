import {
  buildActivityReportTotals,
  buildProjectReportLine,
  groupDirectExpensesByCategory,
  sumTransactionsByProject,
} from './reportCalculations';
import type { TransactionEnriched } from '@/types';

function tx(
  partial: Pick<TransactionEnriched, 'projectId' | 'categoryName' | 'categoryType' | 'amount'>,
): TransactionEnriched {
  return {
    id: 't1',
    projectId: partial.projectId,
    categoryId: 'c1',
    amount: partial.amount,
    date: '2026-07-01',
    createdAt: '2026-07-01T00:00:00.000Z',
    projectName: 'Проект',
    categoryName: partial.categoryName,
    categoryType: partial.categoryType,
  };
}

describe('buildProjectReportLine', () => {
  test('calculates totals and result', () => {
    const row = buildProjectReportLine('p1', 'Проект А', 100_000, 20_000, 21_000, 9_000);
    expect(row.totalExpense).toBe(50_000);
    expect(row.result).toBe(50_000);
  });
});

describe('buildActivityReportTotals', () => {
  test('sums rows', () => {
    const totals = buildActivityReportTotals([
      buildProjectReportLine('p1', 'A', 100_000, 10_000, 21_000, 9_000),
      buildProjectReportLine('p2', 'B', 200_000, 5_000, 9_000, 21_000),
    ]);
    expect(totals.income).toBe(300_000);
    expect(totals.directExpense).toBe(15_000);
    expect(totals.recurringExpense).toBe(30_000);
    expect(totals.longTermExpense).toBe(30_000);
    expect(totals.totalExpense).toBe(75_000);
    expect(totals.result).toBe(225_000);
  });
});

describe('sumTransactionsByProject', () => {
  test('groups income by project', () => {
    const result = sumTransactionsByProject(
      [
        tx({ projectId: 'p1', categoryName: 'Доход', categoryType: 'income', amount: 1000 }),
        tx({ projectId: 'p2', categoryName: 'Доход', categoryType: 'income', amount: 2000 }),
        tx({ projectId: 'p1', categoryName: 'Доход', categoryType: 'income', amount: 500 }),
      ],
      'income',
    );
    expect(result.p1).toBe(1500);
    expect(result.p2).toBe(2000);
  });
});

describe('groupDirectExpensesByCategory', () => {
  test('groups direct expenses', () => {
    const lines = groupDirectExpensesByCategory([
      tx({ projectId: 'p1', categoryName: 'Материалы', categoryType: 'expense_direct', amount: 1000 }),
      tx({ projectId: 'p1', categoryName: 'Материалы', categoryType: 'expense_direct', amount: 500 }),
      tx({ projectId: 'p1', categoryName: 'Транспорт', categoryType: 'expense_direct', amount: 300 }),
    ]);
    expect(lines).toEqual([
      { categoryName: 'Материалы', amount: 1500 },
      { categoryName: 'Транспорт', amount: 300 },
    ]);
  });
});
