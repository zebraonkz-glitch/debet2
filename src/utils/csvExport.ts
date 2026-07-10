import type { ActivityReport, ProjectReportLine } from '@/types';
import { todayIsoDate } from './format';

const UTF8_BOM = '\uFEFF';
const CSV_DELIMITER = ';';

export function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsvRow(fields: (string | number)[]): string {
  return fields.map(escapeCsvField).join(CSV_DELIMITER);
}

export function isReportRowEmpty(row: ProjectReportLine): boolean {
  return (
    row.income === 0 &&
    row.directExpense === 0 &&
    row.recurringExpense === 0 &&
    row.longTermExpense === 0
  );
}

export function buildReportFileName(period: { dateFrom: string }): string {
  const yearMonth = period.dateFrom.slice(0, 7);
  const today = todayIsoDate().replace(/-/g, '');
  return `rezultaty_${yearMonth}_${today}.csv`;
}

export function generateActivityReportCsv(
  report: ActivityReport,
  periodLabel: string,
): string {
  const lines: string[] = [
    'Результаты деятельности',
    formatCsvRow(['Период', periodLabel]),
    formatCsvRow(['С', report.period.dateFrom, 'По', report.period.dateTo]),
    '',
    formatCsvRow([
      'Проект',
      'Доходы',
      'Прямые расходы',
      'Постоянные',
      'Долгоиграющие',
      'Всего расходов',
      'Результат',
    ]),
  ];

  for (const row of report.rows) {
    if (isReportRowEmpty(row)) {
      continue;
    }
    lines.push(
      formatCsvRow([
        row.projectName,
        row.income,
        row.directExpense,
        row.recurringExpense,
        row.longTermExpense,
        row.totalExpense,
        row.result,
      ]),
    );
  }

  lines.push(
    formatCsvRow([
      'Итого',
      report.totals.income,
      report.totals.directExpense,
      report.totals.recurringExpense,
      report.totals.longTermExpense,
      report.totals.totalExpense,
      report.totals.result,
    ]),
  );

  return UTF8_BOM + lines.join('\r\n');
}
