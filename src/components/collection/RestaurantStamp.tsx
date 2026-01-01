import type { Restaurant } from '@/types';

interface RestaurantStampProps {
    restaurant: Restaurant;
    isUnlocked: boolean;
    eatenCount?: number;
    lastEatenAt?: string;
}

export function RestaurantStamp({
    restaurant,
    isUnlocked,
    eatenCount,
    lastEatenAt
}: RestaurantStampProps) {
    const rarityColors = {
        ssr: 'from-yellow-400 to-amber-600',
        sr: 'from-purple-400 to-purple-600',
        r: 'from-blue-400 to-blue-600',
        n: 'from-gray-400 to-gray-600',
    };

    const rarityBg = rarityColors[restaurant.rarity] || rarityColors.n;

    if (!isUnlocked) {
        return (
            <div className="card bg-gray-100 border-2 border-dashed border-gray-300 opacity-60">
                <div className="text-center py-2">
                    <div className="text-3xl mb-1">❓</div>
                    <div className="text-sm text-gray-400 truncate px-2">未解锁</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`card bg-gradient-to-br ${rarityBg} text-white overflow-hidden relative`}>
            {/* 稀有度标签 */}
            <div className="absolute top-1 right-1 text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded">
                {restaurant.rarity.toUpperCase()}
            </div>

            <div className="text-center py-2">
                {/* 菜系 emoji */}
                <div className="text-3xl mb-1">
                    {restaurant.cuisine[0] === '面食' ? '🍜' :
                        restaurant.cuisine[0] === '米饭' ? '🍚' :
                            restaurant.cuisine[0] === '快餐' ? '🍔' :
                                restaurant.cuisine[0] === '粥' ? '🥣' :
                                    '🍽️'}
                </div>

                {/* 餐厅名称 */}
                <div className="text-sm font-bold truncate px-2">
                    {restaurant.name}
                </div>

                {/* 吃过次数 */}
                {eatenCount && eatenCount > 1 && (
                    <div className="text-xs opacity-80 mt-1">
                        ×{eatenCount}
                    </div>
                )}
            </div>

            {/* 解锁时间戳 */}
            {lastEatenAt && (
                <div className="absolute bottom-1 left-1 text-[10px] opacity-60">
                    {new Date(lastEatenAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
            )}
        </div>
    );
}
