import { useLocalSearchParams } from 'expo-router';
import { DistributedExpenseForm } from '@/components/DistributedExpenseForm';

export default function EditRecurringExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DistributedExpenseForm kind="recurring" mode="edit" expenseId={id} />;
}
