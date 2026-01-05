/**
 * App Settings Hook
 * Manages app preferences like mascot, sound, visual settings
 */

import { useEffect, useState } from 'react';
import type { AppSettings, MoodType } from '@/lib/db/schema';

const APP_SETTINGS_KEY = 'fizzy-app-settings';

const DEFAULT_SETTINGS: AppSettings = {
  moodType: 'fire',
  showAnimal: true,
  showNumbers: true,
  soundEnabled: true,
  lastDuration: 25 * 60, // Default 25 minutes
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(APP_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('[useAppSettings] Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[useAppSettings] Failed to save settings:', e);
    }
  };

  const setMoodType = (mood: MoodType) => {
    updateSettings({ moodType: mood });
  };

  const setShowAnimal = (show: boolean) => {
    updateSettings({ showAnimal: show });
  };

  const setShowNumbers = (show: boolean) => {
    updateSettings({ showNumbers: show });
  };

  const setSoundEnabled = (enabled: boolean) => {
    updateSettings({ soundEnabled: enabled });
  };

  const setLastDuration = (duration: number | undefined) => {
    updateSettings({ lastDuration: duration });
  };

  return {
    settings,
    loading,
    setMoodType,
    setShowAnimal,
    setShowNumbers,
    setSoundEnabled,
    setLastDuration,
    updateSettings,
  };
}
