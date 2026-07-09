import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY NOT NULL,
          applied_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (
            type IN ('income', 'expense_direct', 'expense_recurring', 'expense_long_term')
          )
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          amount REAL NOT NULL CHECK (amount > 0),
          date TEXT NOT NULL,
          comment TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
        CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      `);
    },
  },
  {
    version: 2,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS allocation_rules (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          method TEXT NOT NULL CHECK (
            method IN ('proportional', 'fixed_shares', 'equal')
          ),
          shares_json TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS recurring_expenses (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT NOT NULL,
          amount REAL NOT NULL CHECK (amount > 0),
          period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
          start_date TEXT NOT NULL,
          end_date TEXT,
          allocation_rule_id TEXT NOT NULL,
          comment TEXT,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
          FOREIGN KEY (allocation_rule_id) REFERENCES allocation_rules(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS long_term_expenses (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT NOT NULL,
          total_amount REAL NOT NULL CHECK (total_amount > 0),
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          distribution_method TEXT NOT NULL CHECK (
            distribution_method IN ('linear', 'manual')
          ),
          allocation_rule_id TEXT NOT NULL,
          comment TEXT,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
          FOREIGN KEY (allocation_rule_id) REFERENCES allocation_rules(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_recurring_expenses_rule ON recurring_expenses(allocation_rule_id);
        CREATE INDEX IF NOT EXISTS idx_long_term_expenses_rule ON long_term_expenses(allocation_rule_id);
      `);
    },
  },
];
