import type { SQLiteDatabase } from 'expo-sqlite';
import type { DatePeriod } from './periodUtils';
import {
  longTermProjectShareInPeriod,
  recurringProjectShareInPeriod,
} from './allocationService';
import { getAllProjects, getTransactionsEnriched } from '@/db';
import { getAllocationRuleById } from '@/db/repositories/allocationRuleRepository';
import { getAllLongTermExpenses } from '@/db/repositories/longTermExpenseRepository';
import { getAllRecurringExpenses } from '@/db/repositories/recurringExpenseRepository';

export async function getProjectIncomesForPeriod(
  db: SQLiteDatabase,
  period: DatePeriod,
): Promise<Record<string, number>> {
  const transactions = await getTransactionsEnriched(db, {
    dateFrom: period.dateFrom,
    dateTo: period.dateTo,
    categoryTypes: ['income'],
  });

  const incomes: Record<string, number> = {};
  for (const tx of transactions) {
    incomes[tx.projectId] = (incomes[tx.projectId] ?? 0) + tx.amount;
  }
  return incomes;
}

export async function calculateDistributedExpenseShare(
  db: SQLiteDatabase,
  projectId: string,
  period: DatePeriod,
): Promise<{ recurring: number; longTerm: number; total: number }> {
  const [projects, recurringExpenses, longTermExpenses, incomes] = await Promise.all([
    getAllProjects(db),
    getAllRecurringExpenses(db),
    getAllLongTermExpenses(db),
    getProjectIncomesForPeriod(db, period),
  ]);

  const activeProjectIds = projects.filter((p) => p.isActive).map((p) => p.id);
  let recurring = 0;
  let longTerm = 0;

  for (const expense of recurringExpenses) {
    const rule = await getAllocationRuleById(db, expense.allocationRuleId);
    if (!rule) continue;
    recurring += recurringProjectShareInPeriod(
      expense,
      projectId,
      period,
      rule,
      activeProjectIds,
      incomes,
    );
  }

  for (const expense of longTermExpenses) {
    const rule = await getAllocationRuleById(db, expense.allocationRuleId);
    if (!rule) continue;
    longTerm += longTermProjectShareInPeriod(
      expense,
      projectId,
      period,
      rule,
      activeProjectIds,
      incomes,
    );
  }

  return {
    recurring: Math.round(recurring * 100) / 100,
    longTerm: Math.round(longTerm * 100) / 100,
    total: Math.round((recurring + longTerm) * 100) / 100,
  };
}
