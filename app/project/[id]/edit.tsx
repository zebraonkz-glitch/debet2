import { useLocalSearchParams } from 'expo-router';
import { ProjectForm } from '@/components/ProjectForm';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ProjectForm mode="edit" projectId={id} onSaved={() => {}} />;
}
