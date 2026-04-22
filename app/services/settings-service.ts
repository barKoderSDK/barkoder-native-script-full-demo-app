import { ApplicationSettings } from '@nativescript/core';
import { SavedSettings } from '../types';

const SETTINGS_KEY = 'scanner_settings';

export const SettingsService = {
  getSettings(mode: string): SavedSettings | null {
    const raw = ApplicationSettings.getString(SETTINGS_KEY, '');
    if (!raw) {
      return null;
    }

    try {
      const allSettings = JSON.parse(raw);
      return allSettings[mode] ?? null;
    } catch (error) {
      console.error('Error reading settings:', error);
      return null;
    }
  },

  saveSettings(mode: string, settings: SavedSettings) {
    const raw = ApplicationSettings.getString(SETTINGS_KEY, '');
    let allSettings: Record<string, SavedSettings> = {};

    if (raw) {
      try {
        allSettings = JSON.parse(raw);
      } catch (error) {
        console.error('Error parsing stored settings, resetting:', error);
      }
    }

    allSettings[mode] = settings;
    ApplicationSettings.setString(SETTINGS_KEY, JSON.stringify(allSettings));
  },
};
