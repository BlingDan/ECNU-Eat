import { useState, useCallback } from 'react';
import { Restaurant, DecisionSession, DecisionMode, UserSettings, OptionPool } from '@/types';
import { getDefaultPool } from '@/data/restaurants';

export const DEFAULT_SETTINGS: UserSettings = {
  campus: 'minhang' as any,
  defaultMealType: 'lunch' as any,
  favoriteIds: [],
  recentHistory: [],
  preferences: {},
};

/**
 * 决策引擎 Hook
 */
export function useDecisionEngine() {
  const [session, setSession] = useState<DecisionSession>({
    phase: 'setup',
    mode: DecisionMode.WHEEL,
    pool: {
      id: 'default',
      name: '默认池',
      restaurants: [],
      excludedIds: [],
      weights: {},
    },
    vetoUsed: false,
    retryCount: 0,
    maxRetries: 3,
  });

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // 开始新的决策会话
  const startSession = useCallback((mode: DecisionMode, userSettings: UserSettings) => {
    const defaultPool = getDefaultPool(userSettings.campus, userSettings.defaultMealType);
    const filteredPool = defaultPool.filter(r => !userSettings.recentHistory.includes(r.id));

    setSession({
      phase: 'pool',
      mode,
      pool: {
        id: 'current',
        name: '当前选项池',
        restaurants: filteredPool,
        excludedIds: userSettings.recentHistory,
        weights: {},
      },
      vetoUsed: false,
      retryCount: 0,
      maxRetries: 3,
    });
  }, []);

  // 更新选项池
  const updatePool = useCallback((updates: Partial<OptionPool>) => {
    setSession(prev => ({
      ...prev,
      pool: { ...prev.pool, ...updates },
    }));
  }, []);

  // 排除餐厅
  const excludeRestaurant = useCallback((restaurantId: string) => {
    setSession(prev => ({
      ...prev,
      pool: {
        ...prev.pool,
        restaurants: prev.pool.restaurants.filter(r => r.id !== restaurantId),
        excludedIds: [...prev.pool.excludedIds, restaurantId],
      },
    }));
  }, []);

  // 恢复餐厅
  const includeRestaurant = useCallback((restaurantId: string, allRestaurants: Restaurant[]) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      setSession(prev => ({
        ...prev,
        pool: {
          ...prev.pool,
          restaurants: [...prev.pool.restaurants, restaurant],
          excludedIds: prev.pool.excludedIds.filter(id => id !== restaurantId),
        },
      }));
    }
  }, []);

  // 设置权重
  const setWeight = useCallback((restaurantId: string, weight: number) => {
    setSession(prev => ({
      ...prev,
      pool: {
        ...prev.pool,
        weights: { ...prev.pool.weights, [restaurantId]: weight },
      },
    }));
  }, []);

  // 进入决策阶段
  const startDeciding = useCallback(() => {
    setSession(prev => ({ ...prev, phase: 'deciding' }));
  }, []);

  // 根据权重随机选择
  const weightedRandom = useCallback((restaurants: Restaurant[], weights: Record<string, number>): Restaurant => {
    if (Object.keys(weights).length === 0) {
      return restaurants[Math.floor(Math.random() * restaurants.length)];
    }

    const totalWeight = restaurants.reduce((sum, r) => sum + (weights[r.id] || 1), 0);
    let random = Math.random() * totalWeight;

    for (const restaurant of restaurants) {
      random -= weights[restaurant.id] || 1;
      if (random <= 0) {
        return restaurant;
      }
    }

    return restaurants[restaurants.length - 1];
  }, []);

  // 执行决策
  const decide = useCallback((): Restaurant => {
    const { pool, retryCount, maxRetries } = session;

    if (pool.restaurants.length === 0) {
      throw new Error('选项池为空');
    }

    if (retryCount >= maxRetries) {
      throw new Error('已达到最大重试次数');
    }

    const result = weightedRandom(pool.restaurants, pool.weights);

    setSession(prev => ({
      ...prev,
      phase: 'result',
      result,
      retryCount: prev.retryCount + 1,
    }));

    return result;
  }, [session, weightedRandom]);

  // 设置决策结果（由组件调用）
  const setResult = useCallback((restaurant: Restaurant) => {
    setSession(prev => ({
      ...prev,
      phase: 'result',
      result: restaurant,
      retryCount: prev.retryCount + 1,
    }));
  }, []);

  // 使用否决权
  const useVeto = useCallback(() => {
    setSession(prev => {
      if (prev.vetoUsed || prev.retryCount >= prev.maxRetries) {
        return prev;
      }

      return {
        ...prev,
        phase: 'deciding',
        result: undefined,
        vetoUsed: true,
      };
    });
  }, []);

  // 重置会话
  const resetSession = useCallback(() => {
    setSession({
      phase: 'setup',
      mode: DecisionMode.WHEEL,
      pool: {
        id: 'default',
        name: '默认池',
        restaurants: [],
        excludedIds: [],
        weights: {},
      },
      vetoUsed: false,
      retryCount: 0,
      maxRetries: 3,
    });
  }, []);

  return {
    session,
    settings,
    startSession,
    updatePool,
    excludeRestaurant,
    includeRestaurant,
    setWeight,
    startDeciding,
    decide,
    setResult,
    useVeto,
    resetSession,
    setSettings,
  };
}
