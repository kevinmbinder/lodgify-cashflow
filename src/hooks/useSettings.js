"use client";
import { useState, useEffect } from "react";
import { DEFAULT_SETTINGS } from "../lib/platformRules";

const STORAGE_KEY = "lodgify_cashflow_settings";

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage immediately for fast render
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}

    // Then fetch from DB to sync across devices
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ settings: remote }) => {
        if (remote) {
          setSettings(remote);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = (newSettings) => {
    setSettings(newSettings);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)); } catch {}
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    }).catch(() => {});
  };

  const reset = () => save(DEFAULT_SETTINGS);

  return { settings, save, reset, loaded };
}
