import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FormField, PrimaryButton } from '@/components/Form';
import { ScreenLoading } from '@/components/ScreenLoading';
import {
  createAllocationRule,
  deleteAllocationRule,
  getAllocationRuleById,
  getAllProjects,
  updateAllocationRule,
} from '@/db';
import { useDb } from '@/hooks';
import type { AllocationMethod, AllocationShare, Project } from '@/types';
import { Colors } from '@/utils/colors';
import { confirmDestructive } from '@/utils/confirm';
import { ALLOCATION_METHOD_LABELS } from '@/utils/format';
import { ValidationError } from '@/utils/validation';

type AllocationRuleFormProps = {
  mode: 'create' | 'edit';
  ruleId?: string;
};

const METHODS: AllocationMethod[] = ['equal', 'proportional', 'fixed_shares'];

export function AllocationRuleForm({ mode, ruleId }: AllocationRuleFormProps) {
  const db = useDb();
  const router = useRouter();
  const [name, setName] = useState('');
  const [method, setMethod] = useState<AllocationMethod>('equal');
  const [projects, setProjects] = useState<Project[]>([]);
  const [shares, setShares] = useState<AllocationShare[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(mode === 'create');

  const load = useCallback(async () => {
    const activeProjects = await getAllProjects(db);
    setProjects(activeProjects);

    if (mode === 'edit' && ruleId) {
      const rule = await getAllocationRuleById(db, ruleId);
      if (rule) {
        setName(rule.name);
        setMethod(rule.method);
        setShares(rule.shares);
      }
    } else if (activeProjects.length > 0) {
      setShares(
        activeProjects.slice(0, 2).map((p, index) => ({
          projectId: p.id,
          share: index === 0 ? 70 : 30,
        })),
      );
    }
    setLoaded(true);
  }, [db, mode, ruleId]);

  useEffect(() => {
    load();
  }, [load]);

  const shareTotal = useMemo(
    () => shares.reduce((sum, item) => sum + (Number(item.share) || 0), 0),
    [shares],
  );

  const updateShare = (projectId: string, value: string) => {
    const share = Number(value.replace(',', '.')) || 0;
    setShares((prev) => {
      const existing = prev.find((item) => item.projectId === projectId);
      if (existing) {
        return prev.map((item) =>
          item.projectId === projectId ? { ...item, share } : item,
        );
      }
      return [...prev, { projectId, share }];
    });
  };

  const getShareValue = (projectId: string) => {
    const item = shares.find((s) => s.projectId === projectId);
    return item ? String(item.share) : '';
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const payload = {
        name,
        method,
        shares: method === 'fixed_shares' ? shares : [],
      };

      if (mode === 'create') {
        await createAllocationRule(db, payload);
      } else if (ruleId) {
        await updateAllocationRule(db, ruleId, payload);
      }
      router.back();
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить');
      }
    }
  };

  const handleDelete = () => {
    if (!ruleId) return;
    confirmDestructive(
      'Удалить правило?',
      'Правило нельзя удалить, если на него ссылаются расходы.',
      'Удалить',
      async () => {
        await deleteAllocationRule(db, ruleId);
        router.back();
      },
    );
  };

  if (!loaded) {
    return <ScreenLoading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <FormField label="Название" value={name} onChangeText={setName} />
        <Text style={styles.label}>Метод</Text>
        <View style={styles.methodRow}>
          {METHODS.map((item) => (
            <Pressable
              key={item}
              style={[styles.methodChip, method === item ? styles.methodChipActive : null]}
              onPress={() => setMethod(item)}
            >
              <Text
                style={[
                  styles.methodChipText,
                  method === item ? styles.methodChipTextActive : null,
                ]}
              >
                {ALLOCATION_METHOD_LABELS[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        {method === 'fixed_shares' ? (
          <View style={styles.sharesBlock}>
            <Text style={styles.label}>Доли проектов (%)</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.shareRow}>
                <Text style={styles.projectName}>{project.name}</Text>
                <FormField
                  label=""
                  value={getShareValue(project.id)}
                  onChangeText={(value) => updateShare(project.id, value)}
                  keyboardType="decimal-pad"
                  style={styles.shareInput}
                />
              </View>
            ))}
            <Text style={styles.shareTotal}>Итого: {shareTotal.toFixed(0)}%</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title={mode === 'create' ? 'Создать правило' : 'Сохранить'}
          onPress={handleSubmit}
        />
        {mode === 'edit' ? (
          <View style={styles.deleteWrap}>
            <PrimaryButton title="Удалить правило" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  methodRow: { gap: 8, marginBottom: 16 },
  methodChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  methodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodChipText: { color: Colors.text, fontSize: 14 },
  methodChipTextActive: { color: '#fff', fontWeight: '600' },
  sharesBlock: { marginBottom: 16 },
  shareRow: { marginBottom: 4 },
  projectName: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  shareInput: { marginBottom: 0 },
  shareTotal: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  error: { color: Colors.danger, marginBottom: 12 },
  deleteWrap: { marginTop: 12 },
});
