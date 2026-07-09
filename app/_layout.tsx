import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { DatabaseProvider } from '@/components/DatabaseProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <DatabaseProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="project/new" options={{ title: 'Новый проект', presentation: 'modal' }} />
          <Stack.Screen name="project/[id]" options={{ title: 'Проект' }} />
          <Stack.Screen name="project/[id]/edit" options={{ title: 'Редактирование', presentation: 'modal' }} />
          <Stack.Screen
            name="transaction/new"
            options={{ title: 'Новая операция', presentation: 'modal' }}
          />
          <Stack.Screen name="transaction/[id]" options={{ title: 'Операция' }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </DatabaseProvider>
  );
}
