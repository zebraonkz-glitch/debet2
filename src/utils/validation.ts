import type {
  CategoryType,
  CreateCategoryInput,
  CreateProjectInput,
  CreateTransactionInput,
  UpdateCategoryInput,
  UpdateProjectInput,
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
