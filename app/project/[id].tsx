import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/Form';
import { archiveProject, getAllProjects, getTransactionsEnriched } from '@/db';
import { useDb } from '@/hooks';
import type { Project, TransactionEnriched } from '@/types';
import { Colors } from '@/utils/colors';
import { formatDate, formatMoney } from '@/utils/format';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<TransactionEnriched[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const allProjects = await getAllProjects(db, { includeInactive: true });
    const found = allProjects.find((p) => p.id === id) ?? null;
    setProject(found);
    if (found) {
      const ops = await getTransactionsEnriched(db, { projectId: id });
      setTransactions(ops.slice(0, 5));
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Проект не найден</Text>
      </View>
    );
  }

  const handleArchive = () => {
    Alert.alert('Архивировать проект?', project.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Архивировать',
        style: 'destructive',
        onPress: async () => {
          await archiveProject(db, project.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{project.name}</Text>
      {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
      {!project.isActive ? <Text style={styles.archived}>Архивный проект</Text> : null}

      <View style={styles.actions}>
        <PrimaryButton
          title="Редактировать"
          onPress={() =>
            router.push({ pathname: '/project/[id]/edit', params: { id: project.id } })
          }
        />
        {project.isActive ? (
          <View style={styles.spacer}>
            <PrimaryButton title="Архивировать" variant="secondary" onPress={handleArchive} />
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Последние операции</Text>
      {transactions.length === 0 ? (
        <Text style={styles.muted}>Операций пока нет</Text>
      ) : (
        transactions.map((item) => (
          <Pressable
            key={item.id}
            style={styles.txCard}
            onPress={() =>
              router.push({ pathname: '/transaction/[id]', params: { id: item.id } })
            }
          >
            <View style={styles.txRow}>
              <Text style={styles.txCategory}>{item.categoryName}</Text>
              <Text
                style={[
                  styles.txAmount,
                  item.categoryType === 'income' ? styles.income : styles.expense,
                ]}
              >
                {item.categoryType === 'income' ? '+' : '−'}
                {formatMoney(item.amount)}
              </Text>
            </View>
            <Text style={styles.txMeta}>{formatDate(item.date)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  description: { fontSize: 15, color: Colors.textMuted, marginTop: 8, lineHeight: 22 },
  archived: { marginTop: 8, color: Colors.textMuted, fontWeight: '600' },
  actions: { marginTop: 20, marginBottom: 24 },
  spacer: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  muted: { color: Colors.textMuted, fontSize: 14 },
  txCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txCategory: { fontSize: 15, color: Colors.text, flex: 1, marginRight: 8 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  income: { color: Colors.success },
  expense: { color: Colors.danger },
  txMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
