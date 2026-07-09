import { useLocalSearchParams } from 'expo-router';
import { TransactionForm } from '@/components/TransactionForm';

export default function NewTransactionScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const operationType = type === 'expense' ? 'expense' : 'income';

  return <TransactionForm mode="create" operationType={operationType} onSaved={() => {}} />;
}
