import { useLocalSearchParams } from 'expo-router';
import { DistributedExpenseForm } from '@/components/DistributedExpenseForm';

export default function EditLongTermExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DistributedExpenseForm kind="long-term" mode="edit" expenseId={id} />;
}
