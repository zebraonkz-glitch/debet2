import { applyDisplaySettings, DEFAULT_DISPLAY_SETTINGS } from './displaySettings';
import { formatDate } from './format';

describe('formatDate with display settings', () => {
  afterEach(() => {
    applyDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
  });

  test('uses dd.mm.yyyy by default', () => {
    expect(formatDate('2026-07-10')).toBe('10.07.2026');
  });

  test('uses yyyy-mm-dd when configured', () => {
    applyDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS, dateFormat: 'yyyy-mm-dd' });
    expect(formatDate('2026-07-10')).toBe('2026-07-10');
  });
});
