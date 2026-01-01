import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { restaurants } from '@/data/restaurants';
import { Campus } from '@/types';
import type { Collection, Achievement } from '@/types/database';
import { RestaurantStamp } from '@/components/collection/RestaurantStamp';
import { AchievementBadge } from '@/components/collection/AchievementBadge';

type FilterCampus = 'all' | Campus;

export default function CollectionPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterCampus>('all');

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        try {
            const [collectionsRes, achievementsRes] = await Promise.all([
                supabase.from('collections').select('*').eq('user_id', user.id),
                supabase.from('achievements').select('*').eq('user_id', user.id),
            ]);

            setCollections(collectionsRes.data || []);
            setAchievements(achievementsRes.data || []);
        } catch (error) {
            console.error('Error fetching collection data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🎴</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">请先登录</h1>
                <p className="text-gray-500 mb-4">登录后即可查看你的美食集邮册</p>
                <a href="/login" className="btn-primary">
                    去登录
                </a>
            </div>
        );
    }

    // 按校区筛选餐厅
    const filteredRestaurants = restaurants.filter((r) =>
        filter === 'all' || r.location.campus === filter
    );

    // 已解锁的餐厅 ID Set
    const unlockedIds = new Set(collections.map((c) => c.restaurant_id));

    // 计算进度
    const totalCount = filteredRestaurants.length;
    const unlockedCount = filteredRestaurants.filter((r) => unlockedIds.has(r.id)).length;
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* 标题和进度 */}
            <div className="card bg-gradient-to-r from-ecnu-blue to-ecnu-red text-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">🏆 美食护照</h1>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{unlockedCount}/{totalCount}</div>
                        <div className="text-sm opacity-80">{progress.toFixed(1)}%</div>
                    </div>
                </div>

                {/* 进度条 */}
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* 成就展示 */}
            {achievements.length > 0 && (
                <div className="card">
                    <h2 className="font-bold text-gray-800 mb-3">🏅 已获得成就</h2>
                    <div className="flex flex-wrap gap-2">
                        {achievements.map((achievement) => (
                            <AchievementBadge
                                key={achievement.id}
                                type={achievement.achievement_type}
                                unlockedAt={achievement.unlocked_at}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 筛选器 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: 'all' as FilterCampus, label: '全部' },
                    { value: Campus.MINHANG as FilterCampus, label: '闵行' },
                    { value: Campus.PUTUO as FilterCampus, label: '普陀' },
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setFilter(item.value)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition ${filter === item.value
                                ? 'bg-ecnu-blue text-white'
                                : 'bg-white border border-gray-200 hover:border-ecnu-blue'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 集邮网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredRestaurants.map((restaurant) => {
                    const collection = collections.find((c) => c.restaurant_id === restaurant.id);
                    return (
                        <RestaurantStamp
                            key={restaurant.id}
                            restaurant={restaurant}
                            isUnlocked={!!collection}
                            eatenCount={collection?.eaten_count}
                            lastEatenAt={collection?.last_eaten_at}
                        />
                    );
                })}
            </div>

            {filteredRestaurants.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    暂无餐厅数据
                </div>
            )}
        </div>
    );
}
