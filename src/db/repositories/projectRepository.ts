import type { SQLiteDatabase } from 'expo-sqlite';
import type { Project } from '@/types';
import type { CreateProjectInput, UpdateProjectInput } from '@/types';
import { mapProjectRow, type ProjectRow } from '../mappers';
import { generateId, nowIso } from '@/utils/id';
import { validateCreateProject, validateUpdateProject } from '@/utils/validation';

export async function createProject(
  db: SQLiteDatabase,
  input: CreateProjectInput,
): Promise<Project> {
  const data = validateCreateProject(input);
  const id = generateId();
  const createdAt = nowIso();

  await db.runAsync(
    `INSERT INTO projects (id, name, description, is_active, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.description ?? null,
    data.isActive ? 1 : 0,
    createdAt,
  );

  return {
    id,
    name: data.name,
    description: data.description,
    isActive: data.isActive ?? true,
    createdAt,
  };
}

export async function getProjectById(
  db: SQLiteDatabase,
  id: string,
): Promise<Project | null> {
  const row = await db.getFirstAsync<ProjectRow>(
    'SELECT id, name, description, is_active, created_at FROM projects WHERE id = ?',
    id,
  );
  return row ? mapProjectRow(row) : null;
}

export async function getAllProjects(
  db: SQLiteDatabase,
  options?: { includeInactive?: boolean },
): Promise<Project[]> {
  const includeInactive = options?.includeInactive ?? false;
  const query = includeInactive
    ? 'SELECT id, name, description, is_active, created_at FROM projects ORDER BY created_at DESC'
    : 'SELECT id, name, description, is_active, created_at FROM projects WHERE is_active = 1 ORDER BY created_at DESC';

  const rows = await db.getAllAsync<ProjectRow>(query);
  return rows.map(mapProjectRow);
}

export async function updateProject(
  db: SQLiteDatabase,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const existing = await getProjectById(db, id);
  if (!existing) {
    throw new Error(`Проект не найден: ${id}`);
  }

  const data = validateUpdateProject(input);
  const updated: Project = {
    ...existing,
    name: data.name ?? existing.name,
    description:
      data.description !== undefined
        ? data.description ?? undefined
        : existing.description,
    isActive: data.isActive ?? existing.isActive,
  };

  await db.runAsync(
    `UPDATE projects
     SET name = ?, description = ?, is_active = ?
     WHERE id = ?`,
    updated.name,
    updated.description ?? null,
    updated.isActive ? 1 : 0,
    id,
  );

  return updated;
}

export async function archiveProject(db: SQLiteDatabase, id: string): Promise<Project> {
  return updateProject(db, id, { isActive: false });
}

export async function restoreProject(db: SQLiteDatabase, id: string): Promise<Project> {
  return updateProject(db, id, { isActive: true });
}

export async function deleteProject(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM projects WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error(`Проект не найден: ${id}`);
  }
}
