import type { SQLiteDatabase } from 'expo-sqlite';
import type { ActivityReport, ProjectReportDetail } from '@/types';
import { getAllProjects, getProjectById, getTransactionsEnriched } from '@/db';
import {
  calculateDistributedExpenseShare,
  getDistributedExpenseBreakdown,
} from './allocationQueries';
import type { DatePeriod } from './periodUtils';
import {
  buildActivityReportTotals,
  buildProjectReportLine,
  groupDirectExpensesByCategory,
  sumTransactionsByProject,
} from './reportCalculations';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export {
  buildActivityReportTotals,
  buildProjectReportLine,
  groupDirectExpensesByCategory,
  sumTransactionsByProject,
} from './reportCalculations';

export async function buildActivityReport(
  db: SQLiteDatabase,
  period: DatePeriod,
  options?: { includeInactive?: boolean },
): Promise<ActivityReport> {
  const projects = await getAllProjects(db, {
    includeInactive: options?.includeInactive ?? false,
  });

  const [incomeTransactions, directTransactions] = await Promise.all([
    getTransactionsEnriched(db, {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      categoryTypes: ['income'],
    }),
    getTransactionsEnriched(db, {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      categoryTypes: ['expense_direct'],
    }),
  ]);

  const incomes = sumTransactionsByProject(incomeTransactions, 'income');
  const directExpenses = sumTransactionsByProject(directTransactions, 'expense_direct');

  const rows = [];
  for (const project of projects) {
    const distributed = await calculateDistributedExpenseShare(db, project.id, period);
    rows.push(
      buildProjectReportLine(
        project.id,
        project.name,
        incomes[project.id] ?? 0,
        directExpenses[project.id] ?? 0,
        distributed.recurring,
        distributed.longTerm,
      ),
    );
  }

  rows.sort((a, b) => a.projectName.localeCompare(b.projectName, 'ru'));

  return {
    period,
    rows,
    totals: buildActivityReportTotals(rows),
  };
}

export async function buildProjectReportDetail(
  db: SQLiteDatabase,
  projectId: string,
  period: DatePeriod,
): Promise<ProjectReportDetail | null> {
  const project = await getProjectById(db, projectId);
  if (!project) {
    return null;
  }

  const [incomeTransactions, directTransactions, distributed, breakdown] = await Promise.all([
    getTransactionsEnriched(db, {
      projectId,
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      categoryTypes: ['income'],
    }),
    getTransactionsEnriched(db, {
      projectId,
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      categoryTypes: ['expense_direct'],
    }),
    calculateDistributedExpenseShare(db, projectId, period),
    getDistributedExpenseBreakdown(db, projectId, period),
  ]);

  const income = round2(incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0));
  const directExpense = round2(directTransactions.reduce((sum, tx) => sum + tx.amount, 0));
  const totalExpense = round2(
    directExpense + distributed.recurring + distributed.longTerm,
  );

  return {
    projectId: project.id,
    projectName: project.name,
    period,
    income,
    directExpense,
    directByCategory: groupDirectExpensesByCategory(directTransactions),
    recurringLines: breakdown.recurring,
    longTermLines: breakdown.longTerm,
    recurringExpense: distributed.recurring,
    longTermExpense: distributed.longTerm,
    totalExpense,
    result: round2(income - totalExpense),
  };
}
