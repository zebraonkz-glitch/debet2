export type DatePeriod = {
  dateFrom: string;
  dateTo: string;
};

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function toYearMonth(date: string): string {
  return date.slice(0, 7);
}

export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function maxDate(a: string, b: string): string {
  return compareDates(a, b) >= 0 ? a : b;
}

export function minDate(a: string, b: string): string {
  return compareDates(a, b) <= 0 ? a : b;
}

export function overlapPeriod(
  rangeA: DatePeriod,
  rangeB: DatePeriod,
): DatePeriod | null {
  const dateFrom = maxDate(rangeA.dateFrom, rangeB.dateFrom);
  const dateTo = minDate(rangeA.dateTo, rangeB.dateTo);
  if (compareDates(dateFrom, dateTo) > 0) {
    return null;
  }
  return { dateFrom, dateTo };
}

export function listMonthsInPeriod(period: DatePeriod): string[] {
  const months: string[] = [];
  const start = parseDate(period.dateFrom);
  const end = parseDate(period.dateTo);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function countMonthsInclusive(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  );
}

export function countOverlappingMonths(
  expenseStart: string,
  expenseEnd: string,
  period: DatePeriod,
): number {
  const overlap = overlapPeriod(
    { dateFrom: expenseStart, dateTo: expenseEnd },
    period,
  );
  if (!overlap) {
    return 0;
  }
  return listMonthsInPeriod(overlap).length;
}

export function isMonthActive(
  yearMonth: string,
  startDate: string,
  endDate?: string | null,
): boolean {
  const monthStart = `${yearMonth}-01`;
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  const effectiveEnd = endDate ?? '9999-12-31';
  return compareDates(monthEnd, startDate) >= 0 && compareDates(monthStart, effectiveEnd) <= 0;
}

export function getMonthRange(year: number, month: number): DatePeriod {
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dateFrom: `${year}-${monthStr}-01`,
    dateTo: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getQuarterRange(year: number, quarter: 1 | 2 | 3 | 4): DatePeriod {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const startMonthStr = String(startMonth).padStart(2, '0');
  const endMonthStr = String(endMonth).padStart(2, '0');
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    dateFrom: `${year}-${startMonthStr}-01`,
    dateTo: `${year}-${endMonthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getCurrentQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth() + 1;
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4;
}
