import { useLocalSearchParams } from 'expo-router';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title={`Проект #${id}`}
      description="Карточка проекта и мини-отчёт появятся на следующих этапах."
    />
  );
}
