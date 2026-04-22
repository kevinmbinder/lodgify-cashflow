"use client";
import { useState, useEffect } from "react";
import { DEFAULT_SETTINGS } from "../lib/platformRules";

const STORAGE_KEY = "lodgify_cashflow_settings";

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const save = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  };

  const reset = () => save(DEFAULT_SETTINGS);

  return { settings, save, reset, loaded };
}
