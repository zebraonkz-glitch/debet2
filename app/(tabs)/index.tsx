import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getAllCategories, getAllProjects, getAllTransactions } from '@/db';
import { useDb } from '@/hooks';
import { Colors } from '@/utils/colors';

export default function HomeScreen() {
  const db = useDb();
  const [stats, setStats] = useState({ projects: 0, categories: 0, transactions: 0 });

  const loadStats = useCallback(async () => {
    const [projects, categories, transactions] = await Promise.all([
      getAllProjects(db, { includeInactive: true }),
      getAllCategories(db),
      getAllTransactions(db),
    ]);

    setStats({
      projects: projects.length,
      categories: categories.length,
      transactions: transactions.length,
    });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Главная</Text>
      <Text style={styles.description}>
        Сводка за текущий месяц и быстрый ввод операций появятся на следующих этапах.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>База данных</Text>
        <Text style={styles.stat}>Проектов: {stats.projects}</Text>
        <Text style={styles.stat}>Категорий: {stats.categories}</Text>
        <Text style={styles.stat}>Операций: {stats.transactions}</Text>
      </View>

      <Pressable style={styles.button} onPress={loadStats}>
        <Text style={styles.buttonText}>Обновить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  stat: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
