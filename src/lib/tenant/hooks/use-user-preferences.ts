"use client";

import { useCallback, useSyncExternalStore } from "react";
import { logger } from "@/lib/shared/logger";

const PREFERENCES_KEY = "academia-user-preferences";
const SYNC_EVENT = "academia-user-preferences-sync";
const MAX_RECENT_ITEMS = 5;

type UserPreferences = {
  favorites: string[];
  recent: string[];
  views: Record<string, string>;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  recent: [],
  views: {},
};

// Singleton para o Client Side 
let globalPreferences: UserPreferences = { ...DEFAULT_PREFERENCES };
let globalHydrated = false;
let currentSnapshot: UserPreferencesSnapshot = {
  preferences: globalPreferences,
  hydrated: globalHydrated,
};

type UserPreferencesSnapshot = {
  preferences: UserPreferences;
  hydrated: boolean;
};

const serverSnapshot: UserPreferencesSnapshot = {
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
};

function loadFromStorage() {
  if (typeof window === "undefined") return;
  globalPreferences = { ...DEFAULT_PREFERENCES };
  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<UserPreferences>;
      globalPreferences = {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((value): value is string => typeof value === "string") : [],
        recent: Array.isArray(parsed.recent) ? parsed.recent.filter((value): value is string => typeof value === "string") : [],
        views: parsed.views && typeof parsed.views === "object"
          ? Object.fromEntries(
            Object.entries(parsed.views).filter(
              (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string",
            ),
          )
          : {},
      };
    } catch (e) {
      logger.error("Erro ao carregar preferências", { module: "user-preferences", error: e });
      globalPreferences = { ...DEFAULT_PREFERENCES };
    }
  }
  globalHydrated = true;
  updateSnapshot();
}

function saveToStorageAndNotify(newPrefs: UserPreferences) {
  globalPreferences = newPrefs;
  updateSnapshot();
  if (typeof window !== "undefined") {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
    window.dispatchEvent(new Event(SYNC_EVENT));
  }
}

function getPreferencesSnapshot(): UserPreferencesSnapshot {
  if (typeof window !== "undefined" && !globalHydrated) {
    loadFromStorage();
  }

  return currentSnapshot;
}

function getServerPreferencesSnapshot(): UserPreferencesSnapshot {
  return serverSnapshot;
}

function subscribeToPreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleSync = () => {
    onStoreChange();
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === PREFERENCES_KEY) {
      loadFromStorage();
      onStoreChange();
    }
  };

  window.addEventListener(SYNC_EVENT, handleSync);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(SYNC_EVENT, handleSync);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateSnapshot() {
  currentSnapshot = {
    preferences: globalPreferences,
    hydrated: globalHydrated,
  };
}

export function useUserPreferences() {
  const { preferences, hydrated } = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerPreferencesSnapshot
  );

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

  const getViewPreference = useCallback((key: string) => {
    return preferences.views[key];
  }, [preferences.views]);

  const setViewPreference = useCallback((key: string, value: string) => {
    if (!key.trim() || !value.trim()) {
      return;
    }

    saveToStorageAndNotify({
      ...globalPreferences,
      views: {
        ...globalPreferences.views,
        [key]: value,
      },
    });
  }, []);

  return {
    favorites: preferences.favorites,
    recent: preferences.recent,
    views: preferences.views,
    toggleFavorite,
    addRecent,
    isFavorite,
    getViewPreference,
    setViewPreference,
    hydrated,
  };
}
