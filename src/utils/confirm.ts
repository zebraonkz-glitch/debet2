import { Alert } from 'react-native';

export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>,
): void {
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void Promise.resolve(onConfirm()).catch((error: unknown) => {
          const text =
            error instanceof Error ? error.message : 'Не удалось выполнить действие';
          Alert.alert('Ошибка', text);
        });
      },
    },
  ]);
}

export function showErrorAlert(message: string, title = 'Ошибка'): void {
  Alert.alert(title, message);
}
