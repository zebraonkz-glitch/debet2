import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/Form';
import { TransactionForm } from '@/components/TransactionForm';
import { deleteTransaction, getCategoryById, getTransactionById } from '@/db';
import { useDb } from '@/hooks';
import type { Transaction } from '@/types';
import { Colors } from '@/utils/colors';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [operationType, setOperationType] = useState<'income' | 'expense'>('income');

  const load = useCallback(async () => {
    if (!id) return;
    const tx = await getTransactionById(db, id);
    setTransaction(tx);
    if (tx) {
      const category = await getCategoryById(db, tx.categoryId);
      setOperationType(category?.type === 'income' ? 'income' : 'expense');
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Удалить операцию?', 'Действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, id);
          router.back();
        },
      },
    ]);
  };

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
