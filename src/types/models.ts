export type CategoryType =
  | 'income'
  | 'expense_direct'
  | 'expense_recurring'
  | 'expense_long_term';

export type AllocationMethod = 'proportional' | 'fixed_shares' | 'equal';

export type RecurringPeriod = 'monthly' | 'yearly';

export type DistributionMethod = 'linear' | 'manual';

export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export interface Transaction {
  id: string;
  projectId: string;
  categoryId: string;
  amount: number;
  date: string;
  comment?: string;
  createdAt: string;
}

export interface AllocationShare {
  projectId: string;
  share: number;
}

export interface AllocationRule {
  id: string;
  name: string;
  method: AllocationMethod;
  shares: AllocationShare[];
}

export interface RecurringExpense {
  id: string;
  categoryId: string;
  amount: number;
  period: RecurringPeriod;
  startDate: string;
  endDate?: string;
  allocationRuleId: string;
  comment?: string;
}

export interface LongTermExpense {
  id: string;
  categoryId: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  distributionMethod: DistributionMethod;
  allocationRuleId: string;
  comment?: string;
}
