import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { ActivityReport } from '@/types';
import { buildReportFileName, generateActivityReportCsv } from './csvExport';

export async function shareActivityReportCsv(
  report: ActivityReport,
  periodLabel: string,
): Promise<void> {
  const content = generateActivityReportCsv(report, periodLabel);
  const fileName = buildReportFileName(report.period);

  if (!FileSystem.cacheDirectory) {
    throw new Error('Каталог кэша недоступен на этом устройстве');
  }

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Шаринг недоступен на этом устройстве');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Экспорт отчёта',
    UTI: 'public.comma-separated-values-text',
  });
}
