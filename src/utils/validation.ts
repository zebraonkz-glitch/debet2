import type {
  AllocationMethod,
  AllocationShare,
  CategoryType,
  CreateAllocationRuleInput,
  CreateCategoryInput,
  CreateLongTermExpenseInput,
  CreateProjectInput,
  CreateRecurringExpenseInput,
  CreateTransactionInput,
  DistributionMethod,
  RecurringPeriod,
  UpdateAllocationRuleInput,
  UpdateCategoryInput,
  UpdateLongTermExpenseInput,
  UpdateProjectInput,
  UpdateRecurringExpenseInput,
  UpdateTransactionInput,
} from '@/types';

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

const CATEGORY_TYPES: CategoryType[] = [
  'income',
  'expense_direct',
  'expense_recurring',
  'expense_long_term',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requireNonEmpty(value: string | undefined, field: string, label: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ValidationError(field, `${label} обязателен`);
  }
  if (trimmed.length > 200) {
    throw new ValidationError(field, `${label} слишком длинный (макс. 200 символов)`);
  }
  return trimmed;
}

function requirePositiveAmount(amount: number, field = 'amount'): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError(field, 'Сумма должна быть больше нуля');
  }
  return Math.round(amount * 100) / 100;
}

function requireDate(value: string, field = 'date'): string {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) {
    throw new ValidationError(field, 'Дата должна быть в формате YYYY-MM-DD');
  }
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(field, 'Некорректная дата');
  }
  return trimmed;
}

function requireCategoryType(type: CategoryType, field = 'type'): CategoryType {
  if (!CATEGORY_TYPES.includes(type)) {
    throw new ValidationError(field, 'Некорректный тип категории');
  }
  return type;
}

export function validateCreateProject(input: CreateProjectInput): CreateProjectInput {
  return {
    name: requireNonEmpty(input.name, 'name', 'Название проекта'),
    description: input.description?.trim() || undefined,
    isActive: input.isActive ?? true,
  };
}

export function validateUpdateProject(input: UpdateProjectInput): UpdateProjectInput {
  const result: UpdateProjectInput = {};

  if (input.name !== undefined) {
    result.name = requireNonEmpty(input.name, 'name', 'Название проекта');
  }
  if (input.description !== undefined) {
    result.description = input.description?.trim() || null;
  }
  if (input.isActive !== undefined) {
    result.isActive = input.isActive;
  }

  return result;
}

export function validateCreateCategory(input: CreateCategoryInput): CreateCategoryInput {
  return {
    name: requireNonEmpty(input.name, 'name', 'Название категории'),
    type: requireCategoryType(input.type),
  };
}

export function validateUpdateCategory(input: UpdateCategoryInput): UpdateCategoryInput {
  const result: UpdateCategoryInput = {};

  if (input.name !== undefined) {
    result.name = requireNonEmpty(input.name, 'name', 'Название категории');
  }
  if (input.type !== undefined) {
    result.type = requireCategoryType(input.type);
  }

  return result;
}

export function validateCreateTransaction(input: CreateTransactionInput): CreateTransactionInput {
  return {
    projectId: requireNonEmpty(input.projectId, 'projectId', 'Проект'),
    categoryId: requireNonEmpty(input.categoryId, 'categoryId', 'Категория'),
    amount: requirePositiveAmount(input.amount),
    date: requireDate(input.date),
    comment: input.comment?.trim() || undefined,
  };
}

export function validateUpdateTransaction(input: UpdateTransactionInput): UpdateTransactionInput {
  const result: UpdateTransactionInput = {};

  if (input.projectId !== undefined) {
    result.projectId = requireNonEmpty(input.projectId, 'projectId', 'Проект');
  }
  if (input.categoryId !== undefined) {
    result.categoryId = requireNonEmpty(input.categoryId, 'categoryId', 'Категория');
  }
  if (input.amount !== undefined) {
    result.amount = requirePositiveAmount(input.amount);
  }
  if (input.date !== undefined) {
    result.date = requireDate(input.date);
  }
  if (input.comment !== undefined) {
    result.comment = input.comment?.trim() || null;
  }

  return result;
}

const ALLOCATION_METHODS: AllocationMethod[] = ['proportional', 'fixed_shares', 'equal'];
const RECURRING_PERIODS: RecurringPeriod[] = ['monthly', 'yearly'];
const DISTRIBUTION_METHODS: DistributionMethod[] = ['linear', 'manual'];

function validateShares(method: AllocationMethod, shares: AllocationShare[] | undefined): AllocationShare[] {
  const items = shares ?? [];

  if (method === 'proportional') {
    return [];
  }

  if (method === 'equal') {
    return items;
  }

  if (items.length === 0) {
    throw new ValidationError('shares', 'Укажите доли проектов');
  }

  const total = items.reduce((sum, item) => sum + item.share, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new ValidationError('shares', 'Сумма долей должна быть 100%');
  }

  for (const item of items) {
    if (!item.projectId?.trim()) {
      throw new ValidationError('shares', 'У каждой доли должен быть проект');
    }
    if (item.share <= 0) {
      throw new ValidationError('shares', 'Доля должна быть больше нуля');
    }
  }

  return items;
}

export function validateCreateAllocationRule(
  input: CreateAllocationRuleInput,
): CreateAllocationRuleInput {
  if (!ALLOCATION_METHODS.includes(input.method)) {
    throw new ValidationError('method', 'Некорректный метод распределения');
  }

  return {
    name: requireNonEmpty(input.name, 'name', 'Название правила'),
    method: input.method,
    shares: validateShares(input.method, input.shares),
  };
}

export function validateUpdateAllocationRule(
  input: UpdateAllocationRuleInput,
): UpdateAllocationRuleInput {
  const result: UpdateAllocationRuleInput = {};

  if (input.name !== undefined) {
    result.name = requireNonEmpty(input.name, 'name', 'Название правила');
  }
  if (input.method !== undefined) {
    if (!ALLOCATION_METHODS.includes(input.method)) {
      throw new ValidationError('method', 'Некорректный метод распределения');
    }
    result.method = input.method;
  }
  if (input.shares !== undefined) {
    result.shares = input.shares;
  }

  return result;
}

export function validateCreateRecurringExpense(
  input: CreateRecurringExpenseInput,
): CreateRecurringExpenseInput {
  if (!RECURRING_PERIODS.includes(input.period)) {
    throw new ValidationError('period', 'Некорректный период');
  }

  const startDate = requireDate(input.startDate, 'startDate');
  const endDate = input.endDate ? requireDate(input.endDate, 'endDate') : undefined;
  if (endDate && endDate < startDate) {
    throw new ValidationError('endDate', 'Дата окончания не может быть раньше начала');
  }

  return {
    categoryId: requireNonEmpty(input.categoryId, 'categoryId', 'Категория'),
    amount: requirePositiveAmount(input.amount),
    period: input.period,
    startDate,
    endDate,
    allocationRuleId: requireNonEmpty(input.allocationRuleId, 'allocationRuleId', 'Правило'),
    comment: input.comment?.trim() || undefined,
  };
}

export function validateUpdateRecurringExpense(
  input: UpdateRecurringExpenseInput,
): UpdateRecurringExpenseInput {
  const result: UpdateRecurringExpenseInput = { ...input };

  if (input.amount !== undefined) {
    result.amount = requirePositiveAmount(input.amount);
  }
  if (input.startDate !== undefined) {
    result.startDate = requireDate(input.startDate, 'startDate');
  }
  if (input.endDate) {
    result.endDate = requireDate(input.endDate, 'endDate');
  }
  if (input.comment !== undefined) {
    result.comment = input.comment?.trim() || null;
  }

  return result;
}

export function validateCreateLongTermExpense(
  input: CreateLongTermExpenseInput,
): CreateLongTermExpenseInput {
  if (!DISTRIBUTION_METHODS.includes(input.distributionMethod)) {
    throw new ValidationError('distributionMethod', 'Некорректный метод распределения');
  }

  const startDate = requireDate(input.startDate, 'startDate');
  const endDate = requireDate(input.endDate, 'endDate');
  if (endDate < startDate) {
    throw new ValidationError('endDate', 'Дата окончания не может быть раньше начала');
  }

  return {
    categoryId: requireNonEmpty(input.categoryId, 'categoryId', 'Категория'),
    totalAmount: requirePositiveAmount(input.totalAmount, 'totalAmount'),
    startDate,
    endDate,
    distributionMethod: input.distributionMethod,
    allocationRuleId: requireNonEmpty(input.allocationRuleId, 'allocationRuleId', 'Правило'),
    comment: input.comment?.trim() || undefined,
  };
}

export function validateUpdateLongTermExpense(
  input: UpdateLongTermExpenseInput,
): UpdateLongTermExpenseInput {
  const result: UpdateLongTermExpenseInput = { ...input };

  if (input.totalAmount !== undefined) {
    result.totalAmount = requirePositiveAmount(input.totalAmount, 'totalAmount');
  }
  if (input.startDate !== undefined) {
    result.startDate = requireDate(input.startDate, 'startDate');
  }
  if (input.endDate !== undefined) {
    result.endDate = requireDate(input.endDate, 'endDate');
  }
  if (input.comment !== undefined) {
    result.comment = input.comment?.trim() || null;
  }

  return result;
}
