import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
    const { user, profile, isLoading, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState({
        collectionsCount: 0,
        reviewsCount: 0,
        achievementsCount: 0,
    });

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;

        try {
            const [collections, reviews, achievements] = await Promise.all([
                supabase.from('collections').select('id', { count: 'exact' }).eq('user_id', user.id),
                supabase.from('reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
                supabase.from('achievements').select('id', { count: 'exact' }).eq('user_id', user.id),
            ]);

            setStats({
                collectionsCount: collections.count || 0,
                reviewsCount: reviews.count || 0,
                achievementsCount: achievements.count || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: username.trim() || null,
                    bio: bio.trim() || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('保存失败，请稍后重试');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">请先登录</h1>
                <p className="text-gray-500 mb-4">登录后即可查看个人中心</p>
                <a href="/login" className="btn-primary">
                    去登录
                </a>
            </div>
        );
    }

    const displayName = profile?.username || user.email?.split('@')[0] || '用户';

    return (
        <div className="space-y-6">
            {/* 个人信息卡片 */}
            <div className="card">
                <div className="flex items-start gap-4">
                    {/* 头像 */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ecnu-blue to-ecnu-red flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {displayName[0].toUpperCase()}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="昵称"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-ecnu-blue focus:outline-none"
                                />
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="个人简介..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-ecnu-blue focus:outline-none resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 rounded-lg bg-ecnu-blue text-white hover:bg-ecnu-blue/90 transition disabled:opacity-50"
                                    >
                                        {isSaving ? '保存中...' : '保存'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setUsername(profile?.username || '');
                                            setBio(profile?.bio || '');
                                        }}
                                        className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-800">{displayName}</h1>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-gray-400 hover:text-ecnu-blue transition"
                                    >
                                        ✏️
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                {profile?.bio && (
                                    <p className="mt-2 text-gray-600">{profile.bio}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4">
                <a href="/collection" className="card text-center hover:shadow-md transition">
                    <div className="text-3xl font-bold text-ecnu-blue">{stats.collectionsCount}</div>
                    <div className="text-sm text-gray-500">已解锁</div>
                </a>
                <a href="/reviews" className="card text-center hover:shadow-md transition">
                    <div className="text-3xl font-bold text-ecnu-gold">{stats.reviewsCount}</div>
                    <div className="text-sm text-gray-500">评价</div>
                </a>
                <div className="card text-center">
                    <div className="text-3xl font-bold text-ecnu-red">{stats.achievementsCount}</div>
                    <div className="text-sm text-gray-500">成就</div>
                </div>
            </div>

            {/* 快捷入口 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-4">快捷入口</h2>
                <div className="space-y-2">
                    <a
                        href="/collection"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        <span className="text-2xl">🎴</span>
                        <div className="flex-1">
                            <div className="font-medium">美食集邮册</div>
                            <div className="text-sm text-gray-500">查看你的美食收集进度</div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>
                    <a
                        href="/reviews"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        <span className="text-2xl">⭐</span>
                        <div className="flex-1">
                            <div className="font-medium">我的评价</div>
                            <div className="text-sm text-gray-500">查看和管理你的评价</div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>
                    <a
                        href="/room/create"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        <span className="text-2xl">👥</span>
                        <div className="flex-1">
                            <div className="font-medium">创建房间</div>
                            <div className="text-sm text-gray-500">邀请朋友一起决定吃什么</div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
