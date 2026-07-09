import type {
  AllocationMethod,
  AllocationRule,
  AllocationShare,
  LongTermExpense,
  RecurringExpense,
} from '@/types';
import {
  countMonthsInclusive,
  countOverlappingMonths,
  isMonthActive,
  listMonthsInPeriod,
  type DatePeriod,
} from './periodUtils';

export type ProjectWeights = Record<string, number>;

export function computeProjectWeights(
  method: AllocationMethod,
  shares: AllocationShare[],
  activeProjectIds: string[],
  projectIncomes: Record<string, number>,
): ProjectWeights {
  const participants =
    method === 'proportional'
      ? activeProjectIds
      : shares.length > 0
        ? shares.map((s) => s.projectId).filter((id) => activeProjectIds.includes(id))
        : activeProjectIds;

  if (participants.length === 0) {
    return {};
  }

  if (method === 'equal') {
    const weight = 1 / participants.length;
    return Object.fromEntries(participants.map((id) => [id, weight]));
  }

  if (method === 'fixed_shares') {
    const weights: ProjectWeights = {};
    let totalShare = 0;
    for (const item of shares) {
      if (!participants.includes(item.projectId)) continue;
      weights[item.projectId] = item.share / 100;
      totalShare += item.share;
    }
    if (totalShare <= 0) {
      return computeProjectWeights('equal', [], activeProjectIds, projectIncomes);
    }
    for (const projectId of Object.keys(weights)) {
      weights[projectId] = weights[projectId] / (totalShare / 100);
    }
    return weights;
  }

  const incomes = participants.map((id) => projectIncomes[id] ?? 0);
  const totalIncome = incomes.reduce((sum, value) => sum + value, 0);
  if (totalIncome <= 0) {
    return computeProjectWeights('equal', [], participants, projectIncomes);
  }

  const weights: ProjectWeights = {};
  participants.forEach((projectId, index) => {
    weights[projectId] = incomes[index] / totalIncome;
  });
  return weights;
}

export function allocateByWeights(
  totalAmount: number,
  weights: ProjectWeights,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [projectId, weight] of Object.entries(weights)) {
    result[projectId] = Math.round(totalAmount * weight * 100) / 100;
  }
  return result;
}

export function projectShareAmount(
  totalAmount: number,
  projectId: string,
  rule: AllocationRule,
  activeProjectIds: string[],
  projectIncomes: Record<string, number>,
): number {
  const weights = computeProjectWeights(
    rule.method,
    rule.shares,
    activeProjectIds,
    projectIncomes,
  );
  const allocated = allocateByWeights(totalAmount, weights);
  return allocated[projectId] ?? 0;
}

export function recurringExpenseAmountInPeriod(
  expense: RecurringExpense,
  period: DatePeriod,
): number {
  const effectiveEnd = expense.endDate ?? '9999-12-31';
  let total = 0;

  for (const yearMonth of listMonthsInPeriod(period)) {
    if (!isMonthActive(yearMonth, expense.startDate, effectiveEnd)) {
      continue;
    }
    if (expense.period === 'monthly') {
      total += expense.amount;
    } else {
      total += expense.amount / 12;
    }
  }

  return Math.round(total * 100) / 100;
}

export function longTermExpenseAmountInPeriod(
  expense: LongTermExpense,
  period: DatePeriod,
): number {
  const monthsTotal = countMonthsInclusive(expense.startDate, expense.endDate);
  if (monthsTotal <= 0) {
    return 0;
  }

  const monthlyAmount = expense.totalAmount / monthsTotal;
  const overlappingMonths = countOverlappingMonths(
    expense.startDate,
    expense.endDate,
    period,
  );

  return Math.round(monthlyAmount * overlappingMonths * 100) / 100;
}

export function recurringProjectShareInPeriod(
  expense: RecurringExpense,
  projectId: string,
  period: DatePeriod,
  rule: AllocationRule,
  activeProjectIds: string[],
  projectIncomes: Record<string, number>,
): number {
  const total = recurringExpenseAmountInPeriod(expense, period);
  if (total <= 0) {
    return 0;
  }
  return projectShareAmount(total, projectId, rule, activeProjectIds, projectIncomes);
}

export function longTermProjectShareInPeriod(
  expense: LongTermExpense,
  projectId: string,
  period: DatePeriod,
  rule: AllocationRule,
  activeProjectIds: string[],
  projectIncomes: Record<string, number>,
): number {
  const total = longTermExpenseAmountInPeriod(expense, period);
  if (total <= 0) {
    return 0;
  }
  return projectShareAmount(total, projectId, rule, activeProjectIds, projectIncomes);
}
