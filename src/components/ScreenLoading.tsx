import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/utils/colors';
import { Theme } from '@/utils/theme';

type ScreenLoadingProps = {
  message?: string;
};

export function ScreenLoading({ message = 'Загрузка…' }: ScreenLoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Theme.screen,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  message: {
    marginTop: Theme.spacing.sm,
    fontSize: 15,
    color: Colors.textMuted,
  },
});
