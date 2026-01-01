import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DecisionMode } from '@/types';

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const [mode, setMode] = useState<DecisionMode>(DecisionMode.WHEEL);
    const [allowVeto, setAllowVeto] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!user) return;

        setIsCreating(true);
        try {
            const code = generateRoomCode();

            const { data, error } = await supabase
                .from('rooms')
                .insert({
                    code,
                    host_id: user.id,
                    status: 'waiting',
                    settings: {
                        allowVeto,
                        mode,
                    },
                })
                .select()
                .single();

            if (error) throw error;

            // 房主加入房间
            await supabase.from('room_participants').insert({
                room_id: data.id,
                user_id: user.id,
                nickname: user.email?.split('@')[0] || '房主',
                is_ready: true,
            });

            navigate(`/room/${code}`);
        } catch (error) {
            console.error('Error creating room:', error);
            alert('创建房间失败，请稍后重试');
        } finally {
            setIsCreating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🚪</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">请先登录</h1>
                <p className="text-gray-500 mb-4">登录后即可创建房间</p>
                <a href="/login" className="btn-primary">
                    去登录
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">👥 创建房间</h1>
                <p className="text-gray-500 mt-2">邀请朋友一起决定吃什么</p>
            </div>

            {/* 决策方式 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-3">决策方式</h2>
                <div className="space-y-2">
                    {[
                        { value: DecisionMode.WHEEL, label: '幸运大转盘', emoji: '🎡' },
                        { value: DecisionMode.GACHA, label: '美食抽卡', emoji: '🎴' },
                        { value: DecisionMode.SLOT, label: '老虎机', emoji: '🎰' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setMode(item.value)}
                            className={`w-full p-3 rounded-xl border-2 transition text-left ${mode === item.value
                                    ? 'border-ecnu-blue bg-ecnu-blue/10'
                                    : 'border-gray-200 hover:border-ecnu-blue/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.emoji}</span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 房间设置 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-3">房间设置</h2>
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                        <div className="font-medium">允许否决</div>
                        <div className="text-sm text-gray-500">参与者可以否决结果重新抽取</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={allowVeto}
                        onChange={(e) => setAllowVeto(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-ecnu-blue focus:ring-ecnu-blue"
                    />
                </label>
            </div>

            {/* 创建按钮 */}
            <button
                onClick={handleCreate}
                disabled={isCreating}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                {isCreating ? (
                    <>
                        <span className="animate-spin">⏳</span>
                        创建中...
                    </>
                ) : (
                    <>
                        <span>🚀</span>
                        创建房间
                    </>
                )}
            </button>

            <a href="/" className="block text-center text-gray-500 hover:text-ecnu-blue">
                ← 返回首页
            </a>
        </div>
    );
}
