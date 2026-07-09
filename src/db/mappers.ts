import type { Category, CategoryType, Project, Transaction } from '@/types';

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
