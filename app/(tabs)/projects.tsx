import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Form';
import { archiveProject, getAllProjects } from '@/db';
import { useDb } from '@/hooks';
import type { Project } from '@/types';
import { Colors } from '@/utils/colors';

export default function ProjectsScreen() {
  const db = useDb();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const loadProjects = useCallback(async () => {
    const data = await getAllProjects(db, { includeInactive: showArchived });
    setProjects(data);
  }, [db, showArchived]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const handleArchive = (project: Project) => {
    Alert.alert('Архивировать проект?', project.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Архивировать',
        style: 'destructive',
        onPress: async () => {
          await archiveProject(db, project.id);
          loadProjects();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>Показать архивные</Text>
        <Switch value={showArchived} onValueChange={setShowArchived} />
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={projects.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Нет проектов"
            description="Создайте первый проект, чтобы начать учёт."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isActive ? styles.cardArchived : null]}
            onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } })}
            onLongPress={() => item.isActive && handleArchive(item)}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.cardDescription}>{item.description}</Text>
            ) : null}
            {!item.isActive ? <Text style={styles.archivedBadge}>Архив</Text> : null}
          </Pressable>
        )}
      />

      <Fab onPress={() => router.push('/project/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolbarLabel: { fontSize: 14, color: Colors.text },
  list: { padding: 16, paddingBottom: 88 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingBottom: 88 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardArchived: { opacity: 0.75 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  cardDescription: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },
  archivedBadge: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
