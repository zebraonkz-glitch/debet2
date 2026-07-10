import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DisplaySettings } from '@/utils/displaySettings';
import { applyDisplaySettings, DEFAULT_DISPLAY_SETTINGS } from '@/utils/displaySettings';
import { loadDisplaySettings, saveDisplaySettings } from '@/utils/preferences';

type SettingsContextValue = {
  settings: DisplaySettings;
  ready: boolean;
  updateSettings: (partial: Partial<DisplaySettings>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadDisplaySettings()
      .then((loaded) => {
        if (cancelled) return;
        applyDisplaySettings(loaded);
        setSettings(loaded);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          applyDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(async (partial: Partial<DisplaySettings>) => {
    let nextSettings = DEFAULT_DISPLAY_SETTINGS;
    setSettings((prev) => {
      nextSettings = { ...prev, ...partial };
      applyDisplaySettings(nextSettings);
      return nextSettings;
    });
    await saveDisplaySettings(nextSettings);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, updateSettings }),
    [settings, ready, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within SettingsProvider');
  }
  return context;
}
