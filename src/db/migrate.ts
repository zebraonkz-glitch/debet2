import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './migrations';

async function getAppliedVersions(db: SQLiteDatabase): Promise<Set<number>> {
  try {
    const rows = await db.getAllAsync<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    return new Set(rows.map((row) => row.version));
  } catch {
    return new Set();
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const applied = await getAppliedVersions(db);
  const pending = migrations
    .filter((migration) => !applied.has(migration.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        migration.version,
        new Date().toISOString(),
      );
    });
  }
}
