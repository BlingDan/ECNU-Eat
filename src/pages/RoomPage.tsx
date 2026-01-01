import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { restaurants } from '@/data/restaurants';
import { Restaurant } from '@/types';
import type { Room, RoomParticipant, RoomOption, RoomEvent, RoomSettings } from '@/types/database';
import { ParticipantList } from '@/components/room/ParticipantList';
import { RoomOptionPool } from '@/components/room/RoomOptionPool';
import { Wheel } from '@/components/decision/Wheel';
import { Gacha } from '@/components/decision/Gacha';
import { Slot } from '@/components/decision/Slot';

// 房间阶段
type RoomPhase = 'waiting' | 'spinning' | 'result';

export default function RoomPage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [options, setOptions] = useState<RoomOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 决策相关状态
    const [phase, setPhase] = useState<RoomPhase>('waiting');
    const [result, setResult] = useState<string | null>(null);
    const [spinSeed, setSpinSeed] = useState<number | null>(null);
    const [vetoCount, setVetoCount] = useState(0);

    // 获取房间数据
    useEffect(() => {
        if (code && user) {
            fetchRoom();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [code, user, authLoading]);

    // 单独处理 Realtime 订阅，依赖 room.id
    useEffect(() => {
        if (!room?.id) return;

        const roomId = room.id;
        console.log('🔌 订阅房间变化:', roomId);

        // 订阅参与者变化
        const participantsChannel = supabase
            .channel(`room_participants_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_participants',
                    filter: `room_id=eq.${roomId}`,
                },
                () => fetchRoom()
            )
            .subscribe();

        // 订阅选项变化
        const optionsChannel = supabase
            .channel(`room_options_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_options',
                    filter: `room_id=eq.${roomId}`,
                },
                () => fetchRoom()
            )
            .subscribe();

        // 订阅事件 - 关键：同步抽奖结果
        const eventsChannel = supabase
            .channel(`room_events_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_events',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const event = payload.new as RoomEvent;
                    console.log('📨 收到房间事件:', event.type, event.payload);

                    if (event.type === 'spin_start') {
                        // 开始抽奖动画
                        setPhase('spinning');
                        setResult(event.payload.resultId || null);
                        setSpinSeed(event.payload.seed || Date.now());
                    } else if (event.type === 'veto_used') {
                        // 有人使用否决权，重置状态
                        setPhase('waiting');
                        setResult(null);
                        setSpinSeed(null);
                        setVetoCount(prev => prev + 1);
                    } else if (event.type === 'result_accepted') {
                        // 结果被接受
                        setPhase('result');
                    }
                }
            )
            .subscribe();

        // 订阅房间状态变化
        const roomChannel = supabase
            .channel(`room_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    const updatedRoom = payload.new as Room;
                    setRoom(updatedRoom);
                }
            )
            .subscribe();

        return () => {
            console.log('🔌 取消订阅房间:', roomId);
            participantsChannel.unsubscribe();
            optionsChannel.unsubscribe();
            eventsChannel.unsubscribe();
            roomChannel.unsubscribe();
        };
    }, [room?.id]);

    const fetchRoom = async () => {
        if (!code) return;

        try {
            // 获取房间信息
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (roomError) {
                setError('房间不存在或已关闭');
                setIsLoading(false);
                return;
            }

            setRoom(roomData);

            // 获取参与者
            const { data: participantsData } = await supabase
                .from('room_participants')
                .select('*')
                .eq('room_id', roomData.id);

            setParticipants(participantsData || []);

            // 获取选项
            const { data: optionsData } = await supabase
                .from('room_options')
                .select('*')
                .eq('room_id', roomData.id);

            setOptions(optionsData || []);

            // 检查是否已加入，如果没有则自动加入
            const isParticipant = participantsData?.some((p) => p.user_id === user?.id);
            if (!isParticipant && user) {
                await supabase.from('room_participants').insert({
                    room_id: roomData.id,
                    user_id: user.id,
                    nickname: user.email?.split('@')[0] || '访客',
                    is_ready: false,
                });
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching room:', err);
            setError('加载房间失败');
            setIsLoading(false);
        }
    };

    const handleAddOption = async (restaurantId: string): Promise<void> => {
        if (!room || !user) return;

        // 检查是否已经存在（防止重复添加）
        const alreadyExists = options.some(o => o.restaurant_id === restaurantId);
        if (alreadyExists) {
            console.warn('选项已存在，跳过添加');
            return;
        }

        const { error } = await supabase.from('room_options').insert({
            room_id: room.id,
            added_by: user.id,
            restaurant_id: restaurantId,
            weight: 1,
        });

        if (error) {
            console.error('Error adding option:', error);
            throw error;
        }
    };

    const handleRemoveOption = async (optionId: string): Promise<void> => {
        const { error } = await supabase.from('room_options').delete().eq('id', optionId);

        if (error) {
            console.error('Error removing option:', error);
            throw error;
        }
    };

    // 开始抽奖
    const handleStartSpin = async () => {
        if (!room || options.length === 0) return;

        // 随机选择一个结果
        const randomIndex = Math.floor(Math.random() * options.length);
        const resultId = options[randomIndex].restaurant_id;
        const seed = Date.now();

        try {
            // 更新房间状态
            await supabase
                .from('rooms')
                .update({ status: 'spinning' })
                .eq('id', room.id);

            // 发送开始事件 - 所有参与者都会收到
            await supabase.from('room_events').insert({
                room_id: room.id,
                type: 'spin_start',
                payload: { resultId, seed },
            });

        } catch (err) {
            console.error('Error starting spin:', err);
        }
    };

    // 动画完成后的回调
    const handleSpinComplete = useCallback((restaurant: Restaurant) => {
        console.log('🎉 动画完成，结果:', restaurant.name);
        setPhase('result');
    }, []);

    // 否决/重新抽取
    const handleVeto = async () => {
        if (!room || !user) return;

        try {
            // 更新房间状态回等待
            await supabase
                .from('rooms')
                .update({ status: 'waiting' })
                .eq('id', room.id);

            // 发送否决事件
            await supabase.from('room_events').insert({
                room_id: room.id,
                type: 'veto_used',
                payload: { userId: user.id },
            });

        } catch (err) {
            console.error('Error vetoing:', err);
        }
    };

    // 接受结果
    const handleAcceptResult = async () => {
        if (!room) return;

        try {
            await supabase
                .from('rooms')
                .update({ status: 'showing_result' })
                .eq('id', room.id);

            await supabase.from('room_events').insert({
                room_id: room.id,
                type: 'result_accepted',
                payload: { resultId: result },
            });

        } catch (err) {
            console.error('Error accepting result:', err);
        }
    };

    const handleLeaveRoom = async () => {
        if (!room || !user) return;

        try {
            await supabase
                .from('room_participants')
                .delete()
                .eq('room_id', room.id)
                .eq('user_id', user.id);

            navigate('/');
        } catch (err) {
            console.error('Error leaving room:', err);
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
                <div className="text-6xl mb-4">🚪</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">请先登录</h1>
                <p className="text-gray-500 mb-4">登录后即可加入房间</p>
                <a href="/login" className="btn-primary">
                    去登录
                </a>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">{error}</h1>
                <a href="/" className="btn-primary">
                    返回首页
                </a>
            </div>
        );
    }

    if (!room) return null;

    const isHost = room.host_id === user.id;
    const settings = room.settings as RoomSettings;
    const resultRestaurant = result ? restaurants.find((r) => r.id === result) : null;

    // 获取选项池对应的餐厅列表
    const poolRestaurants = options
        .map(o => restaurants.find(r => r.id === o.restaurant_id))
        .filter((r): r is Restaurant => r !== undefined);

    // 构建权重
    const weights: Record<string, number> = {};
    options.forEach(o => {
        weights[o.restaurant_id] = o.weight;
    });

    // 渲染决策组件
    const renderDecisionComponent = () => {
        if (phase === 'waiting' || poolRestaurants.length === 0) {
            return null;
        }

        // 根据房间设置的模式显示对应组件
        switch (settings.mode) {
            case 'gacha':
                return (
                    <div className="card">
                        <Gacha
                            restaurants={poolRestaurants}
                            onPull={handleSpinComplete}
                            disabled={phase === 'result'}
                            key={spinSeed}
                        />
                    </div>
                );
            case 'slot':
                return (
                    <div className="card">
                        <Slot
                            restaurants={poolRestaurants}
                            onResult={handleSpinComplete}
                            disabled={phase === 'result'}
                            key={spinSeed}
                        />
                    </div>
                );
            case 'wheel':
            default:
                return (
                    <div className="card">
                        <Wheel
                            restaurants={poolRestaurants}
                            weights={weights}
                            onSpin={handleSpinComplete}
                            disabled={phase === 'result'}
                            key={spinSeed}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* 房间信息 */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">房间 #{code}</h1>
                        <p className="text-sm text-gray-500">
                            {isHost ? '你是房主' : '等待房主开始'} ·
                            {settings.mode === 'wheel' && ' 🎡 转盘模式'}
                            {settings.mode === 'gacha' && ' 🎴 抽卡模式'}
                            {settings.mode === 'slot' && ' 🎰 老虎机模式'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('房间链接已复制');
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    >
                        📋 复制链接
                    </button>
                </div>
            </div>

            {/* 参与者列表 */}
            <ParticipantList
                participants={participants}
                hostId={room.host_id}
                currentUserId={user.id}
            />

            {/* 抽奖动画/结果展示区域 */}
            {phase !== 'waiting' && (
                <div className="space-y-4">
                    {/* 动画组件 */}
                    {renderDecisionComponent()}

                    {/* 结果确认卡片 */}
                    {phase === 'result' && resultRestaurant && (
                        <div className="card bg-gradient-to-r from-ecnu-gold/20 to-ecnu-red/20 border-2 border-ecnu-gold">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {resultRestaurant.name}
                                </h2>
                                <p className="text-gray-600">{resultRestaurant.location.name}</p>

                                {/* 否决/接受按钮 */}
                                {settings.allowVeto && (
                                    <div className="flex gap-3 mt-6 justify-center">
                                        <button
                                            onClick={handleVeto}
                                            className="px-6 py-3 rounded-xl border-2 border-orange-300 text-orange-600 hover:bg-orange-50 transition flex items-center gap-2"
                                        >
                                            <span>🔄</span>
                                            <span>否决重抽</span>
                                        </button>
                                        <button
                                            onClick={handleAcceptResult}
                                            className="btn-primary px-6 py-3 flex items-center gap-2"
                                        >
                                            <span>✅</span>
                                            <span>就这个了！</span>
                                        </button>
                                    </div>
                                )}

                                {vetoCount > 0 && (
                                    <p className="text-sm text-gray-400 mt-3">
                                        已重抽 {vetoCount} 次
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 选项池 - 等待阶段显示 */}
            {phase === 'waiting' && (
                <RoomOptionPool
                    options={options}
                    onAddOption={handleAddOption}
                    onRemoveOption={handleRemoveOption}
                    currentUserId={user.id}
                />
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
                {isHost && phase === 'waiting' && (
                    <button
                        onClick={handleStartSpin}
                        disabled={options.length === 0}
                        className="btn-primary flex-1 disabled:opacity-50"
                    >
                        🎲 开始决策
                    </button>
                )}

                {/* 非房主在等待时显示提示 */}
                {!isHost && phase === 'waiting' && options.length > 0 && (
                    <div className="flex-1 text-center py-3 text-gray-500 bg-gray-50 rounded-xl">
                        ⏳ 等待房主开始决策...
                    </div>
                )}

                <button
                    onClick={handleLeaveRoom}
                    className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition"
                >
                    退出房间
                </button>
            </div>
        </div>
    );
}
