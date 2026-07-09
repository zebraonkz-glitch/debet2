import type {
  AllocationMethod,
  AllocationShare,
  CategoryType,
  DistributionMethod,
  RecurringPeriod,
} from './models';

export interface CreateProjectInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
}

export interface CreateTransactionInput {
  projectId: string;
  categoryId: string;
  amount: number;
  date: string;
  comment?: string;
}

export interface UpdateTransactionInput {
  projectId?: string;
  categoryId?: string;
  amount?: number;
  date?: string;
  comment?: string | null;
}

export interface TransactionFilters {
  projectId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryTypes?: CategoryType[];
}

export interface CreateAllocationRuleInput {
  name: string;
  method: AllocationMethod;
  shares?: AllocationShare[];
}

export interface UpdateAllocationRuleInput {
  name?: string;
  method?: AllocationMethod;
  shares?: AllocationShare[];
}

export interface CreateRecurringExpenseInput {
  categoryId: string;
  amount: number;
  period: RecurringPeriod;
  startDate: string;
  endDate?: string;
  allocationRuleId: string;
  comment?: string;
}

export interface UpdateRecurringExpenseInput {
  categoryId?: string;
  amount?: number;
  period?: RecurringPeriod;
  startDate?: string;
  endDate?: string | null;
  allocationRuleId?: string;
  comment?: string | null;
}

export interface CreateLongTermExpenseInput {
  categoryId: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  distributionMethod: DistributionMethod;
  allocationRuleId: string;
  comment?: string;
}

export interface UpdateLongTermExpenseInput {
  categoryId?: string;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  distributionMethod?: DistributionMethod;
  allocationRuleId?: string;
  comment?: string | null;
}
