import type { CategoryType, Transaction } from './models';

export interface TransactionEnriched extends Transaction {
  projectName: string;
  categoryName: string;
  categoryType: CategoryType;
}
