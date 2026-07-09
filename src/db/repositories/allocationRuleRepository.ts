import type { SQLiteDatabase } from 'expo-sqlite';
import type { AllocationRule } from '@/types';
import type { CreateAllocationRuleInput, UpdateAllocationRuleInput } from '@/types';
import { mapAllocationRuleRow, serializeShares, type AllocationRuleRow } from '../mappers';
import { generateId } from '@/utils/id';
import { validateCreateAllocationRule, validateUpdateAllocationRule } from '@/utils/validation';

export async function createAllocationRule(
  db: SQLiteDatabase,
  input: CreateAllocationRuleInput,
): Promise<AllocationRule> {
  const data = validateCreateAllocationRule(input);
  const id = generateId();

  await db.runAsync(
    `INSERT INTO allocation_rules (id, name, method, shares_json)
     VALUES (?, ?, ?, ?)`,
    id,
    data.name,
    data.method,
    serializeShares(data.shares ?? []),
  );

  return { id, name: data.name, method: data.method, shares: data.shares ?? [] };
}

export async function getAllocationRuleById(
  db: SQLiteDatabase,
  id: string,
): Promise<AllocationRule | null> {
  const row = await db.getFirstAsync<AllocationRuleRow>(
    'SELECT id, name, method, shares_json FROM allocation_rules WHERE id = ?',
    id,
  );
  return row ? mapAllocationRuleRow(row) : null;
}

export async function getAllAllocationRules(db: SQLiteDatabase): Promise<AllocationRule[]> {
  const rows = await db.getAllAsync<AllocationRuleRow>(
    'SELECT id, name, method, shares_json FROM allocation_rules ORDER BY name',
  );
  return rows.map(mapAllocationRuleRow);
}

export async function updateAllocationRule(
  db: SQLiteDatabase,
  id: string,
  input: UpdateAllocationRuleInput,
): Promise<AllocationRule> {
  const existing = await getAllocationRuleById(db, id);
  if (!existing) {
    throw new Error(`Правило не найдено: ${id}`);
  }

  const data = validateUpdateAllocationRule(input);
  const updated: AllocationRule = {
    ...existing,
    name: data.name ?? existing.name,
    method: data.method ?? existing.method,
    shares: data.shares ?? existing.shares,
  };

  await db.runAsync(
    'UPDATE allocation_rules SET name = ?, method = ?, shares_json = ? WHERE id = ?',
    updated.name,
    updated.method,
    serializeShares(updated.shares),
    id,
  );

  return updated;
}

export async function deleteAllocationRule(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM allocation_rules WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Правило не найдено: ${id}`);
  }
}
