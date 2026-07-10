import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { DatabaseProvider } from '@/components/DatabaseProvider';
import { SettingsProvider } from '@/context/SettingsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SettingsProvider>
      <DatabaseProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="project/new" options={{ title: 'Новый проект', presentation: 'modal' }} />
          <Stack.Screen name="project/[id]" options={{ title: 'Проект' }} />
          <Stack.Screen name="project/[id]/edit" options={{ title: 'Редактирование', presentation: 'modal' }} />
          <Stack.Screen
            name="transaction/new"
            options={{ title: 'Новая операция', presentation: 'modal' }}
          />
          <Stack.Screen name="transaction/[id]" options={{ title: 'Операция' }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
          <Stack.Screen
            name="allocation-rule/new"
            options={{ title: 'Новое правило', presentation: 'modal' }}
          />
          <Stack.Screen name="allocation-rule/[id]" options={{ title: 'Правило' }} />
          <Stack.Screen
            name="recurring/new"
            options={{ title: 'Постоянный расход', presentation: 'modal' }}
          />
          <Stack.Screen name="recurring/[id]" options={{ title: 'Постоянный расход' }} />
          <Stack.Screen
            name="long-term/new"
            options={{ title: 'Долгоиграющий расход', presentation: 'modal' }}
          />
          <Stack.Screen name="long-term/[id]" options={{ title: 'Долгоиграющий расход' }} />
          <Stack.Screen name="report/[projectId]" options={{ title: 'Детализация' }} />
          </Stack>
        </ThemeProvider>
      </DatabaseProvider>
    </SettingsProvider>
  );
}
