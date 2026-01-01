import { useState, useCallback, useEffect } from 'react';
import { restaurants } from '@/data/restaurants';
import type { RoomOption } from '@/types/database';

interface RoomOptionPoolProps {
    options: RoomOption[];
    onAddOption: (restaurantId: string) => Promise<void>;
    onRemoveOption: (optionId: string) => Promise<void>;
    currentUserId: string | undefined;
}

export function RoomOptionPool({
    options,
    onAddOption,
    onRemoveOption,
    currentUserId
}: RoomOptionPoolProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [search, setSearch] = useState('');
    // 跟踪正在添加的餐厅 ID
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    // 跟踪正在删除的选项 ID
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    // 获取餐厅信息
    const getRestaurantById = (id: string) =>
        restaurants.find((r) => r.id === id);

    // 已添加的餐厅 ID Set（包括正在添加中的）
    const addedIds = new Set([
        ...options.map((o) => o.restaurant_id),
        ...addingIds
    ]);

    // 可添加的餐厅（排除已添加的和正在添加的）
    const availableRestaurants = restaurants.filter(
        (r) => !addedIds.has(r.id) &&
            (r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.location.name.toLowerCase().includes(search.toLowerCase()))
    );

    // 带防抖和加载状态的添加函数
    const handleAdd = useCallback(async (restaurantId: string) => {
        // 如果已经在添加中或已存在，忽略
        if (addingIds.has(restaurantId)) return;
        if (options.some(o => o.restaurant_id === restaurantId)) return;

        // 立即更新 UI（乐观更新）
        setAddingIds(prev => new Set([...prev, restaurantId]));
        setSearch('');

        try {
            await onAddOption(restaurantId);
            // 注意：这里不再移除 addingIds，由 useEffect 监听 options 变化后移除
        } catch (error) {
            console.error('添加选项失败:', error);
            // 失败时移除加载状态
            setAddingIds(prev => {
                const next = new Set(prev);
                next.delete(restaurantId);
                return next;
            });
        }
    }, [addingIds, options, onAddOption]);

    // 监听 options 变化，当选项成功添加后移除 addingIds 中对应项
    useEffect(() => {
        if (addingIds.size === 0) return;

        const optionRestaurantIds = new Set(options.map(o => o.restaurant_id));
        const toRemove: string[] = [];

        addingIds.forEach(id => {
            if (optionRestaurantIds.has(id)) {
                toRemove.push(id);
            }
        });

        if (toRemove.length > 0) {
            setAddingIds(prev => {
                const next = new Set(prev);
                toRemove.forEach(id => next.delete(id));
                return next;
            });
        }
    }, [options, addingIds]);

    // 带防抖和加载状态的删除函数
    const handleRemove = useCallback(async (optionId: string) => {
        // 如果已经在删除中，忽略
        if (removingIds.has(optionId)) return;

        // 立即更新 UI（乐观更新）
        setRemovingIds(prev => new Set([...prev, optionId]));

        try {
            await onRemoveOption(optionId);
        } catch (error) {
            console.error('删除选项失败:', error);
            // 失败时恢复 UI
            setRemovingIds(prev => {
                const next = new Set(prev);
                next.delete(optionId);
                return next;
            });
        }
    }, [removingIds, onRemoveOption]);

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">🍽️ 选项池 ({options.length})</h2>
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="px-3 py-1.5 rounded-lg bg-ecnu-blue text-white text-sm hover:bg-ecnu-blue/90 transition"
                >
                    + 添加选项
                </button>
            </div>

            {/* 选项列表 */}
            {options.length === 0 && addingIds.size === 0 ? (
                <div className="text-center py-6 text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p>还没有选项，点击上方添加</p>
                </div>
            ) : (
                <div className="space-y-2 mb-4">
                    {/* 显示正在添加的选项（乐观更新） */}
                    {[...addingIds].map((restaurantId) => {
                        const restaurant = getRestaurantById(restaurantId);
                        return (
                            <div
                                key={`adding-${restaurantId}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-ecnu-blue/10 to-ecnu-gold/10 border border-ecnu-blue/20"
                            >
                                {/* 旋转加载图标 */}
                                <div className="w-8 h-8 rounded-full bg-ecnu-blue/20 flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-ecnu-blue animate-spin"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                        {restaurant?.name || restaurantId}
                                    </div>
                                    {restaurant && (
                                        <div className="text-sm text-gray-500">
                                            {restaurant.location.name}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-ecnu-blue font-medium animate-pulse">
                                    正在添加...
                                </span>
                            </div>
                        );
                    })}

                    {/* 显示已有选项 */}
                    {options.map((option) => {
                        const restaurant = getRestaurantById(option.restaurant_id);
                        const canRemove = option.added_by === currentUserId;
                        const isRemoving = removingIds.has(option.id);

                        // 如果正在删除，显示半透明状态
                        if (isRemoving) {
                            return (
                                <div
                                    key={option.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 opacity-40"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800 line-through">
                                            {restaurant?.name || option.restaurant_id}
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-400 animate-pulse">删除中...</span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={option.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                        {restaurant?.name || option.restaurant_id}
                                    </div>
                                    {restaurant && (
                                        <div className="text-sm text-gray-500">
                                            {restaurant.location.name}
                                        </div>
                                    )}
                                </div>
                                {canRemove && (
                                    <button
                                        onClick={() => handleRemove(option.id)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                        title="删除选项"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 餐厅选择器 */}
            {showPicker && (
                <div className="border-t pt-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索餐厅..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-ecnu-blue focus:outline-none mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {availableRestaurants.slice(0, 20).map((restaurant) => {
                            const isAdding = addingIds.has(restaurant.id);
                            return (
                                <button
                                    key={restaurant.id}
                                    onClick={() => handleAdd(restaurant.id)}
                                    disabled={isAdding}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition text-left ${isAdding
                                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">{restaurant.name}</div>
                                        <div className="text-sm text-gray-500">{restaurant.location.name}</div>
                                    </div>
                                    {isAdding ? (
                                        <span className="text-gray-400 animate-pulse">⏳</span>
                                    ) : (
                                        <span className="text-ecnu-blue">+</span>
                                    )}
                                </button>
                            );
                        })}
                        {availableRestaurants.length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                                没有找到餐厅
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
