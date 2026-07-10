import { useCallback } from 'react';
import { useAppSettings } from '@/context/SettingsContext';
import { getAmountFieldLabel } from '@/utils/displaySettings';
import {
  formatDateWithSettings,
  formatMoneyWithSettings,
  formatPeriodRange,
} from '@/utils/format';

export function useDisplayFormat() {
  const { settings } = useAppSettings();

  const formatMoney = useCallback(
    (amount: number) => formatMoneyWithSettings(amount, settings),
    [settings],
  );

  const formatDate = useCallback(
    (date: string) => formatDateWithSettings(date, settings),
    [settings],
  );

  const formatPeriod = useCallback(
    (period: { dateFrom: string; dateTo: string }) => formatPeriodRange(period, settings),
    [settings],
  );

  const amountFieldLabel = useCallback(
    (base = 'Сумма') => getAmountFieldLabel(settings, base),
    [settings],
  );

  return {
    settings,
    formatMoney,
    formatDate,
    formatPeriod,
    amountFieldLabel,
  };
}
