import { useDatabaseContext } from '@/context/DatabaseContext';

export function useDatabase() {
  return useDatabaseContext();
}

export { useDb } from '@/context/DatabaseContext';
