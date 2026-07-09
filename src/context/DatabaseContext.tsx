import { createContext, useContext } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

type DatabaseContextValue = {
  db: SQLiteDatabase;
  isReady: true;
};

export const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabaseContext(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext должен использоваться внутри DatabaseProvider');
  }
  return context;
}

export function useDb(): SQLiteDatabase {
  return useDatabaseContext().db;
}
