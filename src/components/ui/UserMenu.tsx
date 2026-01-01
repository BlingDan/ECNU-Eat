import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function UserMenu() {
    const { user, profile, isLoading, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭菜单
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        );
    }

    if (!user) {
        return (
            <a
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ecnu-blue text-white hover:bg-ecnu-blue/90 transition"
            >
                <span>👤</span>
                <span>登录</span>
            </a>
        );
    }

    const displayName = profile?.username || user.email?.split('@')[0] || '用户';
    const avatarUrl = profile?.avatar_url;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ecnu-blue to-ecnu-red flex items-center justify-center text-white font-bold shadow">
                        {displayName[0].toUpperCase()}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
                    {/* 用户信息 */}
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="font-bold text-gray-800 truncate">{displayName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>

                    {/* 菜单项 */}
                    <div className="py-1">
                        <a
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <span>👤</span>
                            <span>个人中心</span>
                        </a>
                        <a
                            href="/collection"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <span>🎴</span>
                            <span>美食集邮册</span>
                        </a>
                        <a
                            href="/reviews"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <span>⭐</span>
                            <span>我的评价</span>
                        </a>
                    </div>

                    {/* 登出 */}
                    <div className="border-t py-1">
                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                        >
                            <span>🚪</span>
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
