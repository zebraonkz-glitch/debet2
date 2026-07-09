import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrate';
import { seedAllocationDataIfEmpty, seedDatabaseIfEmpty } from './seed';

const DATABASE_NAME = 'debet2.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(db);
  await seedDatabaseIfEmpty(db);
  await seedAllocationDataIfEmpty(db);
  return db;
}

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }
  return databasePromise;
}

export async function resetDatabaseForDev(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM projects;
    DELETE FROM schema_migrations;
  `);
  databasePromise = null;
  await getDatabase();
}

export { DATABASE_NAME };
