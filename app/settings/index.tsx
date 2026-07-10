import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { OptionPickerModal } from '@/components/OptionPickerModal';
import { useAppSettings } from '@/hooks';
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  type AppCurrency,
  type AppDateFormat,
} from '@/utils/displaySettings';
import { Colors } from '@/utils/colors';
import { Theme } from '@/utils/theme';
import { useState } from 'react';

type PickerKind = 'currency' | 'dateFormat' | null;

export default function SettingsScreen() {
  const { settings, updateSettings } = useAppSettings();
  const [picker, setPicker] = useState<PickerKind>(null);

  const currencyLabel =
    CURRENCY_OPTIONS.find((item) => item.id === settings.currency)?.label ?? settings.currency;
  const dateFormatLabel =
    DATE_FORMAT_OPTIONS.find((item) => item.id === settings.dateFormat)?.label ??
    settings.dateFormat;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Отображение</Text>
      <View style={styles.card}>
        <SettingRow label="Валюта" value={currencyLabel} onPress={() => setPicker('currency')} />
        <SettingRow
          label="Формат даты"
          value={dateFormatLabel}
          onPress={() => setPicker('dateFormat')}
        />
      </View>

      <Text style={styles.note}>
        Настройки применяются ко всем суммам и датам в приложении.
      </Text>

      <Text style={[styles.sectionTitle, styles.aboutTitle]}>О приложении</Text>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutName}>Результаты деятельности</Text>
        <Text style={styles.aboutVersion}>Версия 1.0.0</Text>
        <Text style={styles.aboutText}>
          Данные хранятся локально на устройстве в SQLite. При удалении приложения
          учётные записи будут потеряны — экспортируйте отчёт в CSV для сохранения
          сводки.
        </Text>
      </View>

      <OptionPickerModal
        visible={picker === 'currency'}
        title="Валюта"
        options={CURRENCY_OPTIONS}
        selectedId={settings.currency}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          void updateSettings({ currency: id as AppCurrency });
          setPicker(null);
        }}
      />
      <OptionPickerModal
        visible={picker === 'dateFormat'}
        title="Формат даты"
        options={DATE_FORMAT_OPTIONS}
        selectedId={settings.dateFormat}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          void updateSettings({ dateFormat: id as AppDateFormat });
          setPicker(null);
        }}
      />
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: Theme.screen,
  content: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    ...Theme.typography.section,
    marginBottom: Theme.spacing.sm,
  },
  card: {
    ...Theme.card,
    paddingVertical: Theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: Theme.typography.body,
  rowValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Theme.spacing.md,
  },
  note: {
    ...Theme.typography.caption,
    marginTop: Theme.spacing.md,
    lineHeight: 20,
  },
  aboutTitle: { marginTop: Theme.spacing.lg },
  aboutCard: {
    ...Theme.card,
    paddingVertical: Theme.spacing.md,
  },
  aboutName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Theme.spacing.sm,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
