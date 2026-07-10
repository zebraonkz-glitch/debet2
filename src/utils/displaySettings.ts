export type AppCurrency = 'RUB' | 'USD' | 'EUR' | 'KZT';
export type AppDateFormat = 'dd.mm.yyyy' | 'yyyy-mm-dd';

export type DisplaySettings = {
  currency: AppCurrency;
  dateFormat: AppDateFormat;
};

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  currency: 'RUB',
  dateFormat: 'dd.mm.yyyy',
};

export const CURRENCY_OPTIONS: { id: AppCurrency; label: string }[] = [
  { id: 'RUB', label: 'Российский рубль (₽)' },
  { id: 'KZT', label: 'Казахстанский тенге (₸)' },
  { id: 'USD', label: 'Доллар США ($)' },
  { id: 'EUR', label: 'Евро (€)' },
];

export const DATE_FORMAT_OPTIONS: { id: AppDateFormat; label: string }[] = [
  { id: 'dd.mm.yyyy', label: 'ДД.ММ.ГГГГ' },
  { id: 'yyyy-mm-dd', label: 'ГГГГ-ММ-ДД' },
];

export const CURRENCY_SYMBOLS: Record<AppCurrency, string> = {
  RUB: '₽',
  KZT: '₸',
  USD: '$',
  EUR: '€',
};

export function getAmountFieldLabel(
  settings: DisplaySettings,
  base = 'Сумма',
): string {
  return `${base}, ${CURRENCY_SYMBOLS[settings.currency]}`;
}

let currentSettings: DisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS };

export function getDisplaySettingsSnapshot(): DisplaySettings {
  return currentSettings;
}

export function applyDisplaySettings(settings: DisplaySettings): void {
  currentSettings = { ...settings };
}
