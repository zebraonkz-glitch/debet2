import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/Form';
import { ScreenLoading } from '@/components/ScreenLoading';
import { TransactionForm } from '@/components/TransactionForm';
import { deleteTransaction, getCategoryById, getTransactionById } from '@/db';
import { useDb } from '@/hooks';
import type { Transaction } from '@/types';
import { Colors } from '@/utils/colors';
import { confirmDestructive } from '@/utils/confirm';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [operationType, setOperationType] = useState<'income' | 'expense'>('income');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tx = await getTransactionById(db, id);
      setTransaction(tx);
      if (tx) {
        const category = await getCategoryById(db, tx.categoryId);
        setOperationType(category?.type === 'income' ? 'income' : 'expense');
      }
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = () => {
    if (!id) return;
    confirmDestructive('Удалить операцию?', 'Действие нельзя отменить', 'Удалить', async () => {
      await deleteTransaction(db, id);
      router.back();
    });
  };

  if (loading) {
    return <ScreenLoading />;
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Операция не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.flexGrow}>
      <TransactionForm
        mode="edit"
        operationType={operationType}
        transaction={transaction}
        onSaved={() => {}}
      />
      <View style={styles.deleteWrap}>
        <PrimaryButton title="Удалить операцию" variant="danger" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  flexGrow: { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.textMuted },
  deleteWrap: { padding: 16, paddingTop: 0, paddingBottom: 32 },
});
