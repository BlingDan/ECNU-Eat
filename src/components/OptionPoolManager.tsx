import { useState } from 'react';
import { OptionPool, Campus, MealType } from '@/types';
import { getRestaurantsByCampus, filterByMealType, getRarityConfig } from '@/data/restaurants';

interface OptionPoolManagerProps {
  pool: OptionPool;
  campus: Campus;
  mealType: MealType;
  onUpdatePool: (updates: Partial<OptionPool>) => void;
  onExclude: (id: string) => void;
  onInclude: (id: string) => void;
  onNext: () => void;
}

/**
 * 选项池管理组件
 */
export function OptionPoolManager({
  pool,
  campus,
  mealType,
  onUpdatePool,
  onExclude,
  onInclude,
  onNext,
}: OptionPoolManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // 获取所有可用餐厅
  const allRestaurants = filterByMealType(getRestaurantsByCampus(campus), mealType);
  const excludedRestaurants = allRestaurants.filter((r) => pool.excludedIds.includes(r.id));

  // 搜索过滤
  const searchedRestaurants = searchQuery
    ? allRestaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.cuisine.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // 设置权重
  const setWeight = (restaurantId: string, weight: number) => {
    const newWeights = { ...pool.weights };
    if (weight <= 1) {
      delete newWeights[restaurantId];
    } else {
      newWeights[restaurantId] = weight;
    }
    onUpdatePool({ weights: newWeights });
  };

  return (
    <div className="space-y-6">
      {/* 当前选项池 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ecnu-blue">当前选项池</h2>
          <span className="text-sm text-gray-500">{pool.restaurants.length} 个选项</span>
        </div>

        {pool.restaurants.length === 0 ? (
          <p className="text-gray-400 text-center py-8">选项池为空，请添加选项</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pool.restaurants.map((restaurant) => {
              const rarity = getRarityConfig(restaurant.rarity);
              const currentWeight = pool.weights[restaurant.id] || 1;

              return (
                <div
                  key={restaurant.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div className={`w-2 h-10 rounded-full bg-gradient-to-br ${rarity.bg}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {restaurant.location.name} · {restaurant.cuisine[0]}
                    </p>
                  </div>

                  {/* 权重控制 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">权重</span>
                    <button
                      onClick={() => setWeight(restaurant.id, Math.max(1, currentWeight - 1))}
                      className="w-7 h-7 rounded bg-white border hover:bg-gray-100 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{currentWeight}</span>
                    <button
                      onClick={() => setWeight(restaurant.id, currentWeight + 1)}
                      className="w-7 h-7 rounded bg-white border hover:bg-gray-100 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* 移除按钮 */}
                  <button
                    onClick={() => onExclude(restaurant.id)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 搜索和添加 */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-3">添加选项</h3>

        {/* 搜索框 */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="搜索餐厅名称或菜系..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* 搜索结果 */}
        {searchQuery && searchedRestaurants.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
            {searchedRestaurants.slice(0, 5).map((restaurant) => {
              const isInPool = pool.restaurants.some((r) => r.id === restaurant.id);
              return (
                <div
                  key={restaurant.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{restaurant.name}</p>
                    <p className="text-xs text-gray-500">{restaurant.location.name}</p>
                  </div>
                  {!isInPool && (
                    <button
                      onClick={() => onInclude(restaurant.id)}
                      className="px-3 py-1 text-sm bg-ecnu-blue text-white rounded hover:bg-ecnu-blue/80"
                    >
                      添加
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 已排除的选项 */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-ecnu-blue hover:underline"
        >
          {showAll ? '隐藏' : '显示'}已排除的选项 ({excludedRestaurants.length})
        </button>

        {showAll && excludedRestaurants.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto mt-3">
            {excludedRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-sm">{restaurant.name}</p>
                  <p className="text-xs text-gray-500">{restaurant.location.name}</p>
                </div>
                <button
                  onClick={() => onInclude(restaurant.id)}
                  className="px-3 py-1 text-sm bg-ecnu-blue text-white rounded hover:bg-ecnu-blue/80"
                >
                  恢复
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 继续 */}
      <button
        onClick={onNext}
        disabled={pool.restaurants.length === 0}
        className="btn-primary w-full text-lg"
      >
        开始决策
      </button>
    </div>
  );
}
