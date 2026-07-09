import type {
  AllocationMethod,
  AllocationShare,
  AllocationRule,
  Category,
  CategoryType,
  DistributionMethod,
  LongTermExpense,
  Project,
  RecurringExpense,
  RecurringPeriod,
  Transaction,
} from '@/types';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
};

type TransactionRow = {
  id: string;
  project_id: string;
  category_id: string;
  amount: number;
  date: string;
  comment: string | null;
  created_at: string;
};

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
  };
}

export function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    projectId: row.project_id,
    categoryId: row.category_id,
    amount: row.amount,
    date: row.date,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

export type { CategoryRow, ProjectRow, TransactionRow };

type AllocationRuleRow = {
  id: string;
  name: string;
  method: AllocationMethod;
  shares_json: string;
};

type RecurringExpenseRow = {
  id: string;
  category_id: string;
  amount: number;
  period: RecurringPeriod;
  start_date: string;
  end_date: string | null;
  allocation_rule_id: string;
  comment: string | null;
};

type LongTermExpenseRow = {
  id: string;
  category_id: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  distribution_method: DistributionMethod;
  allocation_rule_id: string;
  comment: string | null;
};

function parseShares(json: string): AllocationShare[] {
  try {
    const parsed = JSON.parse(json) as AllocationShare[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapAllocationRuleRow(row: AllocationRuleRow): AllocationRule {
  return {
    id: row.id,
    name: row.name,
    method: row.method,
    shares: parseShares(row.shares_json),
  };
}

export function serializeShares(shares: AllocationShare[]): string {
  return JSON.stringify(shares);
}

export function mapRecurringExpenseRow(row: RecurringExpenseRow): RecurringExpense {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    allocationRuleId: row.allocation_rule_id,
    comment: row.comment ?? undefined,
  };
}

export function mapLongTermExpenseRow(row: LongTermExpenseRow): LongTermExpense {
  return {
    id: row.id,
    categoryId: row.category_id,
    totalAmount: row.total_amount,
    startDate: row.start_date,
    endDate: row.end_date,
    distributionMethod: row.distribution_method,
    allocationRuleId: row.allocation_rule_id,
    comment: row.comment ?? undefined,
  };
}

export type { AllocationRuleRow, LongTermExpenseRow, RecurringExpenseRow };
