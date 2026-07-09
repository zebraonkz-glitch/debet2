import {
  allocateByWeights,
  computeProjectWeights,
  longTermExpenseAmountInPeriod,
  longTermProjectShareInPeriod,
  projectShareAmount,
  recurringExpenseAmountInPeriod,
  recurringProjectShareInPeriod,
} from './allocationService';
import type { AllocationRule, LongTermExpense, RecurringExpense } from '@/types';

describe('computeProjectWeights', () => {
  const projects = ['p1', 'p2', 'p3'];

  test('equal splits between active projects', () => {
    const weights = computeProjectWeights('equal', [], projects, {});
    expect(weights.p1).toBeCloseTo(1 / 3);
    expect(weights.p2).toBeCloseTo(1 / 3);
    expect(weights.p3).toBeCloseTo(1 / 3);
  });

  test('fixed_shares uses configured percentages', () => {
    const weights = computeProjectWeights(
      'fixed_shares',
      [
        { projectId: 'p1', share: 70 },
        { projectId: 'p2', share: 30 },
      ],
      projects,
      {},
    );
    expect(weights.p1).toBeCloseTo(0.7);
    expect(weights.p2).toBeCloseTo(0.3);
    expect(weights.p3).toBeUndefined();
  });

  test('proportional uses incomes', () => {
    const weights = computeProjectWeights('proportional', [], projects, {
      p1: 1000,
      p2: 2000,
      p3: 0,
    });
    expect(weights.p1).toBeCloseTo(1 / 3);
    expect(weights.p2).toBeCloseTo(2 / 3);
    expect(weights.p3).toBeCloseTo(0);
  });

  test('proportional without income falls back to equal', () => {
    const weights = computeProjectWeights('proportional', [], projects, {});
    expect(weights.p1).toBeCloseTo(1 / 3);
    expect(weights.p2).toBeCloseTo(1 / 3);
    expect(weights.p3).toBeCloseTo(1 / 3);
  });
});

describe('allocateByWeights', () => {
  test('allocates total by weights', () => {
    const result = allocateByWeights(1000, { p1: 0.7, p2: 0.3 });
    expect(result.p1).toBe(700);
    expect(result.p2).toBe(300);
  });
});

describe('recurringExpenseAmountInPeriod', () => {
  const expense: RecurringExpense = {
    id: 'r1',
    categoryId: 'c1',
    amount: 30_000,
    period: 'monthly',
    startDate: '2026-01-01',
    allocationRuleId: 'rule',
  };

  test('counts active months in period', () => {
    const amount = recurringExpenseAmountInPeriod(expense, {
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(amount).toBe(30_000);
  });

  test('yearly expense is divided by 12 per month', () => {
    const yearly: RecurringExpense = { ...expense, period: 'yearly', amount: 120_000 };
    const amount = recurringExpenseAmountInPeriod(yearly, {
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(amount).toBe(10_000);
  });
});

describe('longTermExpenseAmountInPeriod', () => {
  const expense: LongTermExpense = {
    id: 'l1',
    categoryId: 'c1',
    totalAmount: 120_000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    distributionMethod: 'linear',
    allocationRuleId: 'rule',
  };

  test('allocates one month from annual total', () => {
    const amount = longTermExpenseAmountInPeriod(expense, {
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(amount).toBe(10_000);
  });
});

describe('project share integration', () => {
  const rule: AllocationRule = {
    id: 'rule',
    name: '70/30',
    method: 'fixed_shares',
    shares: [
      { projectId: 'p1', share: 70 },
      { projectId: 'p2', share: 30 },
    ],
  };

  test('recurring project share for month', () => {
    const expense: RecurringExpense = {
      id: 'r1',
      categoryId: 'c1',
      amount: 30_000,
      period: 'monthly',
      startDate: '2026-01-01',
      allocationRuleId: 'rule',
    };

    const p1 = recurringProjectShareInPeriod(
      expense,
      'p1',
      { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
      rule,
      ['p1', 'p2'],
      {},
    );
    const p2 = recurringProjectShareInPeriod(
      expense,
      'p2',
      { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
      rule,
      ['p1', 'p2'],
      {},
    );

    expect(p1).toBe(21_000);
    expect(p2).toBe(9_000);
  });

  test('projectShareAmount with proportional incomes', () => {
    const proportional: AllocationRule = {
      id: 'rule2',
      name: 'prop',
      method: 'proportional',
      shares: [],
    };

    const p1 = projectShareAmount(90_000, 'p1', proportional, ['p1', 'p2'], {
      p1: 100_000,
      p2: 200_000,
    });
    expect(p1).toBe(30_000);
  });
});
