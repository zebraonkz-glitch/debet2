import type { CategoryType } from './models';

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
