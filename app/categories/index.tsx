import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { FormField, PrimaryButton } from '@/components/Form';
import { createCategory, deleteCategory, getAllCategories } from '@/db';
import { useDb } from '@/hooks';
import type { Category, CategoryType } from '@/types';
import { Colors } from '@/utils/colors';
import { CATEGORY_TYPE_LABELS } from '@/utils/format';
import { confirmDestructive, showErrorAlert } from '@/utils/confirm';
import { ValidationError } from '@/utils/validation';

const GROUP_ORDER: CategoryType[] = [
  'income',
  'expense_direct',
  'expense_recurring',
  'expense_long_term',
];

export default function CategoriesScreen() {
  const db = useDb();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense_direct');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setCategories(await getAllCategories(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const grouped = GROUP_ORDER.map((groupType) => ({
    type: groupType,
    label: CATEGORY_TYPE_LABELS[groupType],
    items: categories.filter((c) => c.type === groupType),
  }));

  const handleCreate = async () => {
    setError('');
    try {
      await createCategory(db, { name, type });
      setName('');
      load();
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось создать');
      }
    }
  };

  const handleDelete = (category: Category) => {
    confirmDestructive('Удалить категорию?', category.name, 'Удалить', async () => {
      try {
        await deleteCategory(db, category.id);
        await load();
      } catch (err) {
        showErrorAlert(
          err instanceof Error ? err.message : 'Категория используется в операциях',
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.type}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.formTitle}>Новая категория</Text>
            <FormField label="Название" value={name} onChangeText={setName} error={error} />
            <Text style={styles.label}>Тип</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.types}>
              {GROUP_ORDER.map((itemType) => (
                <Pressable
                  key={itemType}
                  style={[styles.typeChip, type === itemType ? styles.typeChipActive : null]}
                  onPress={() => setType(itemType)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      type === itemType ? styles.typeChipTextActive : null,
                    ]}
                  >
                    {CATEGORY_TYPE_LABELS[itemType]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <PrimaryButton title="Добавить категорию" onPress={handleCreate} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{item.label}</Text>
            {item.items.length === 0 ? (
              <Text style={styles.emptyGroup}>Нет категорий</Text>
            ) : (
              item.items.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.card}
                  onLongPress={() => handleDelete(category)}
                >
                  <Text style={styles.cardTitle}>{category.name}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Справочник пуст" />}
      />

      <Pressable style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backText}>← Назад</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 40 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  types: { marginBottom: 16 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, color: Colors.text },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyGroup: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15, color: Colors.text },
  backLink: { padding: 16 },
  backText: { color: Colors.primary, fontSize: 16 },
});
