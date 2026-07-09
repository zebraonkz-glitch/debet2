import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FormField, PrimaryButton } from '@/components/Form';
import { createProject, getProjectById, updateProject } from '@/db';
import { useDb } from '@/hooks';
import { Colors } from '@/utils/colors';
import { ValidationError } from '@/utils/validation';

type ProjectFormProps = {
  mode: 'create' | 'edit';
  projectId?: string;
  onSaved: () => void;
};

export function ProjectForm({ mode, projectId, onSaved }: ProjectFormProps) {
  const db = useDb();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(mode === 'create');

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    const project = await getProjectById(db, projectId);
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
    }
    setLoaded(true);
  }, [db, projectId]);

  useEffect(() => {
    if (mode === 'edit') {
      loadProject();
    }
  }, [mode, loadProject]);

  const handleSubmit = async () => {
    setErrors({});
    setSaving(true);
    try {
      if (mode === 'create') {
        await createProject(db, {
          name,
          description: description.trim() || undefined,
        });
      } else if (projectId) {
        await updateProject(db, projectId, {
          name,
          description: description.trim() || null,
        });
      }
      onSaved();
      router.back();
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ [error.field]: error.message });
      } else {
        Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось сохранить');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Загрузка…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <FormField label="Название" value={name} onChangeText={setName} error={errors.name} />
        <FormField
          label="Описание"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <PrimaryButton
          title={mode === 'create' ? 'Создать проект' : 'Сохранить'}
          onPress={handleSubmit}
          disabled={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: { color: Colors.textMuted },
});
