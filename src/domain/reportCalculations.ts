import type {
  ActivityReportTotals,
  CategoryAmountLine,
  ProjectReportLine,
  TransactionEnriched,
} from '@/types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumTransactionsByProject(
  transactions: TransactionEnriched[],
  categoryType: 'income' | 'expense_direct',
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.categoryType !== categoryType) continue;
    result[tx.projectId] = (result[tx.projectId] ?? 0) + tx.amount;
  }
  return result;
}

export function groupDirectExpensesByCategory(
  transactions: TransactionEnriched[],
): CategoryAmountLine[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.categoryType !== 'expense_direct') continue;
    map.set(tx.categoryName, (map.get(tx.categoryName) ?? 0) + tx.amount);
  }
  return [...map.entries()]
    .map(([categoryName, amount]) => ({
      categoryName,
      amount: round2(amount),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

export function buildProjectReportLine(
  projectId: string,
  projectName: string,
  income: number,
  directExpense: number,
  recurringExpense: number,
  longTermExpense: number,
): ProjectReportLine {
  const totalExpense = round2(directExpense + recurringExpense + longTermExpense);
  return {
    projectId,
    projectName,
    income: round2(income),
    directExpense: round2(directExpense),
    recurringExpense: round2(recurringExpense),
    longTermExpense: round2(longTermExpense),
    totalExpense,
    result: round2(income - totalExpense),
  };
}

export function buildActivityReportTotals(rows: ProjectReportLine[]): ActivityReportTotals {
  return rows.reduce<ActivityReportTotals>(
    (acc, row) => ({
      income: round2(acc.income + row.income),
      directExpense: round2(acc.directExpense + row.directExpense),
      recurringExpense: round2(acc.recurringExpense + row.recurringExpense),
      longTermExpense: round2(acc.longTermExpense + row.longTermExpense),
      totalExpense: round2(acc.totalExpense + row.totalExpense),
      result: round2(acc.result + row.result),
    }),
    {
      income: 0,
      directExpense: 0,
      recurringExpense: 0,
      longTermExpense: 0,
      totalExpense: 0,
      result: 0,
    },
  );
}
