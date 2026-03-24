"use client";

import { useCallback, useEffect, useState } from "react";

const PREFERENCES_KEY = "academia-user-preferences";
const MAX_RECENT_ITEMS = 5;

type UserPreferences = {
  favorites: string[]; // hrefs
  recent: string[]; // hrefs
};

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  recent: [],
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar preferências:", e);
      }
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever preferences change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }
  }, [preferences, hydrated]);

  const toggleFavorite = useCallback((href: string) => {
    setPreferences((prev) => {
      const isFavorite = prev.favorites.includes(href);
      return {
        ...prev,
        favorites: isFavorite
          ? prev.favorites.filter((f) => f !== href)
          : [...prev.favorites, href],
      };
    });
  }, []);

  const addRecent = useCallback((href: string) => {
    setPreferences((prev) => {
      // Remove if already exists to move to top, and filter out home/login
      const filtered = prev.recent.filter((r) => r !== href);
      const nextRecent = [href, ...filtered].slice(0, MAX_RECENT_ITEMS);
      
      // Only update if changed
      if (JSON.stringify(prev.recent) === JSON.stringify(nextRecent)) {
        return prev;
      }
      
      return {
        ...prev,
        recent: nextRecent,
      };
    });
  }, []);

  const isFavorite = useCallback((href: string) => {
    return preferences.favorites.includes(href);
  }, [preferences.favorites]);

  return {
    favorites: preferences.favorites,
    recent: preferences.recent,
    toggleFavorite,
    addRecent,
    isFavorite,
    hydrated,
  };
}
