import type { CategoryType, Transaction } from './models';

export interface TransactionEnriched extends Transaction {
  projectName: string;
  categoryName: string;
  categoryType: CategoryType;
}

export interface ProjectReportLine {
  projectId: string;
  projectName: string;
  income: number;
  directExpense: number;
  recurringExpense: number;
  longTermExpense: number;
  totalExpense: number;
  result: number;
}

export interface ActivityReportTotals {
  income: number;
  directExpense: number;
  recurringExpense: number;
  longTermExpense: number;
  totalExpense: number;
  result: number;
}

export interface ActivityReport {
  period: { dateFrom: string; dateTo: string };
  rows: ProjectReportLine[];
  totals: ActivityReportTotals;
}

export interface DistributedExpenseLine {
  expenseId: string;
  kind: 'recurring' | 'long-term';
  title: string;
  amount: number;
}

export interface CategoryAmountLine {
  categoryName: string;
  amount: number;
}

export interface ProjectReportDetail {
  projectId: string;
  projectName: string;
  period: { dateFrom: string; dateTo: string };
  income: number;
  directExpense: number;
  directByCategory: CategoryAmountLine[];
  recurringLines: DistributedExpenseLine[];
  longTermLines: DistributedExpenseLine[];
  recurringExpense: number;
  longTermExpense: number;
  totalExpense: number;
  result: number;
}
