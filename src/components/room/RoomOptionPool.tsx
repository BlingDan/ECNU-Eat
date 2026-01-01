import { useState } from 'react';
import { restaurants } from '@/data/restaurants';
import type { RoomOption } from '@/types/database';

interface RoomOptionPoolProps {
    options: RoomOption[];
    onAddOption: (restaurantId: string) => void;
    onRemoveOption: (optionId: string) => void;
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

    // 获取餐厅信息
    const getRestaurantById = (id: string) =>
        restaurants.find((r) => r.id === id);

    // 已添加的餐厅 ID Set
    const addedIds = new Set(options.map((o) => o.restaurant_id));

    // 可添加的餐厅（排除已添加的）
    const availableRestaurants = restaurants.filter(
        (r) => !addedIds.has(r.id) &&
            (r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.location.name.toLowerCase().includes(search.toLowerCase()))
    );

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
            {options.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p>还没有选项，点击上方添加</p>
                </div>
            ) : (
                <div className="space-y-2 mb-4">
                    {options.map((option) => {
                        const restaurant = getRestaurantById(option.restaurant_id);
                        const canRemove = option.added_by === currentUserId;

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
                                        onClick={() => onRemoveOption(option.id)}
                                        className="text-gray-400 hover:text-red-500 transition"
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
                        {availableRestaurants.slice(0, 20).map((restaurant) => (
                            <button
                                key={restaurant.id}
                                onClick={() => {
                                    onAddOption(restaurant.id);
                                    setSearch('');
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition text-left"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">{restaurant.name}</div>
                                    <div className="text-sm text-gray-500">{restaurant.location.name}</div>
                                </div>
                                <span className="text-ecnu-blue">+</span>
                            </button>
                        ))}
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
