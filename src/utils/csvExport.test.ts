import {
  buildReportFileName,
  escapeCsvField,
  formatCsvRow,
  generateActivityReportCsv,
  isReportRowEmpty,
} from './csvExport';
import { buildActivityReportTotals, buildProjectReportLine } from '@/domain/reportCalculations';
import type { ActivityReport } from '@/types';

describe('escapeCsvField', () => {
  test('quotes fields with semicolon', () => {
    expect(escapeCsvField('Проект; А')).toBe('"Проект; А"');
  });

  test('escapes double quotes', () => {
    expect(escapeCsvField('ООО "Ромашка"')).toBe('"ООО ""Ромашка"""');
  });
});

describe('buildReportFileName', () => {
  test('uses period month and today date', () => {
    const name = buildReportFileName({ dateFrom: '2026-07-01' });
    const today = new Date();
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('');
    expect(name).toBe(`rezultaty_2026-07_${todayStr}.csv`);
  });
});

describe('generateActivityReportCsv', () => {
  const report: ActivityReport = {
    period: { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
    rows: [
      buildProjectReportLine('p1', 'Проект А', 100_000, 10_000, 21_000, 9_000),
      buildProjectReportLine('p2', 'Проект Б', 0, 0, 0, 0),
      buildProjectReportLine('p2', 'Проект В', 200_000, 5_000, 9_000, 21_000),
    ],
    totals: buildActivityReportTotals([
      buildProjectReportLine('p1', 'Проект А', 100_000, 10_000, 21_000, 9_000),
      buildProjectReportLine('p2', 'Проект Б', 0, 0, 0, 0),
      buildProjectReportLine('p2', 'Проект В', 200_000, 5_000, 9_000, 21_000),
    ]),
  };

  test('starts with UTF-8 BOM', () => {
    const csv = generateActivityReportCsv(report, 'июль 2026');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  test('includes header and totals', () => {
    const csv = generateActivityReportCsv(report, 'июль 2026');
    expect(csv).toContain('Результаты деятельности');
    expect(csv).toContain(formatCsvRow(['Период', 'июль 2026']));
    expect(csv).toContain(
      formatCsvRow([
        'Проект',
        'Доходы',
        'Прямые расходы',
        'Постоянные',
        'Долгоиграющие',
        'Всего расходов',
        'Результат',
      ]),
    );
    expect(csv).toContain(formatCsvRow(['Проект А', 100_000, 10_000, 21_000, 9_000, 40_000, 60_000]));
    expect(csv).toContain(formatCsvRow(['Итого', report.totals.income, report.totals.directExpense, report.totals.recurringExpense, report.totals.longTermExpense, report.totals.totalExpense, report.totals.result]));
  });

  test('skips empty project rows', () => {
    const csv = generateActivityReportCsv(report, 'июль 2026');
    expect(csv).not.toContain('Проект Б');
    expect(isReportRowEmpty(report.rows[1])).toBe(true);
  });
});
