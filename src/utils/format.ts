import type {
  AllocationMethod,
  CategoryType,
  DistributionMethod,
  RecurringPeriod,
} from '@/types';

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Доход',
  expense_direct: 'Прямой расход',
  expense_recurring: 'Постоянный расход',
  expense_long_term: 'Долгоиграющий расход',
};

export const OPERATION_CATEGORY_TYPES: CategoryType[] = ['income', 'expense_direct'];

export const ALLOCATION_METHOD_LABELS: Record<AllocationMethod, string> = {
  proportional: 'Пропорционально доходам',
  fixed_shares: 'Фиксированные доли',
  equal: 'Поровну',
};

export const RECURRING_PERIOD_LABELS: Record<RecurringPeriod, string> = {
  monthly: 'Ежемесячно',
  yearly: 'Ежегодно',
};

export const DISTRIBUTION_METHOD_LABELS: Record<DistributionMethod, string> = {
  linear: 'Линейно по месяцам',
  manual: 'По правилу распределения',
};

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dateFrom: `${year}-${monthStr}-01`,
    dateTo: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}
