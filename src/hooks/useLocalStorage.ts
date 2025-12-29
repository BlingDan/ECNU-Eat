import { useEffect, useState } from 'react';
import { UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/hooks/useDecisionEngine';

const STORAGE_KEY = 'ecnu-eat-settings';

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * 用户设置 Hook
 */
export function useUserSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);

  const addToHistory = (restaurantId: string) => {
    setSettings((prev) => ({
      ...prev,
      recentHistory: [restaurantId, ...prev.recentHistory.slice(0, 9)], // 保留最近10条
    }));
  };

  const toggleFavorite = (restaurantId: string) => {
    setSettings((prev) => ({
      ...prev,
      favoriteIds: prev.favoriteIds.includes(restaurantId)
        ? prev.favoriteIds.filter((id) => id !== restaurantId)
        : [...prev.favoriteIds, restaurantId],
    }));
  };

  const clearHistory = () => {
    setSettings((prev) => ({ ...prev, recentHistory: [] }));
  };

  return {
    settings,
    setSettings,
    addToHistory,
    toggleFavorite,
    clearHistory,
  };
}

/**
 * PWA 安装提示 Hook
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }

    return outcome === 'accepted';
  };

  return { isInstallable, promptInstall };
}
