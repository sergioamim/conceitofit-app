"use client";

import { useCallback, useEffect, useState } from "react";

const PREFERENCES_KEY = "academia-user-preferences";
const SYNC_EVENT = "academia-user-preferences-sync";
const MAX_RECENT_ITEMS = 5;

type UserPreferences = {
  favorites: string[];
  recent: string[];
};

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  recent: [],
};

// Singleton para o Client Side 
let globalPreferences: UserPreferences = { ...DEFAULT_PREFERENCES };
let globalHydrated = false;

function loadFromStorage() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (stored) {
    try {
      globalPreferences = JSON.parse(stored);
    } catch (e) {
      console.error("Erro ao carregar preferências:", e);
    }
  }
  globalHydrated = true;
}

function saveToStorageAndNotify(newPrefs: UserPreferences) {
  globalPreferences = newPrefs;
  if (typeof window !== "undefined") {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
    window.dispatchEvent(new Event(SYNC_EVENT));
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(globalPreferences);
  const [hydrated, setHydrated] = useState(globalHydrated);

  useEffect(() => {
    if (!globalHydrated) {
      loadFromStorage();
      setPreferences(globalPreferences);
      setHydrated(globalHydrated);
    }

    const handleSync = () => {
      setPreferences(globalPreferences);
      setHydrated(globalHydrated);
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    
    // Suporte para sync cross-tab 
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PREFERENCES_KEY) {
        loadFromStorage();
        setPreferences(globalPreferences);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    const isFavoriteObj = globalPreferences.favorites.includes(href);
    const newFavorites = isFavoriteObj
      ? globalPreferences.favorites.filter((f) => f !== href)
      : [...globalPreferences.favorites, href];
      
    saveToStorageAndNotify({
      ...globalPreferences,
      favorites: newFavorites,
    });
  }, []);

  const addRecent = useCallback((href: string) => {
    const filtered = globalPreferences.recent.filter((r) => r !== href);
    const nextRecent = [href, ...filtered].slice(0, MAX_RECENT_ITEMS);
    
    if (JSON.stringify(globalPreferences.recent) !== JSON.stringify(nextRecent)) {
      saveToStorageAndNotify({
        ...globalPreferences,
        recent: nextRecent,
      });
    }
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
