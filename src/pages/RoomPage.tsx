import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { restaurants } from '@/data/restaurants';
import type { Room, RoomParticipant, RoomOption, RoomEvent } from '@/types/database';
import { ParticipantList } from '@/components/room/ParticipantList';
import { RoomOptionPool } from '@/components/room/RoomOptionPool';

export default function RoomPage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [options, setOptions] = useState<RoomOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        if (code && user) {
            fetchRoom();
            subscribeToRoom();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [code, user, authLoading]);

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

    const subscribeToRoom = () => {
        if (!code || !room) return;

        // 订阅参与者变化
        const participantsChannel = supabase
            .channel('room_participants')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_participants',
                    filter: `room_id=eq.${room.id}`,
                },
                () => {
                    fetchRoom();
                }
            )
            .subscribe();

        // 订阅选项变化
        const optionsChannel = supabase
            .channel('room_options')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_options',
                    filter: `room_id=eq.${room.id}`,
                },
                () => {
                    fetchRoom();
                }
            )
            .subscribe();

        // 订阅事件
        const eventsChannel = supabase
            .channel('room_events')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_events',
                    filter: `room_id=eq.${room.id}`,
                },
                (payload) => {
                    const event = payload.new as RoomEvent;
                    if (event.type === 'spin_start' && event.payload.resultId) {
                        setResult(event.payload.resultId);
                    }
                }
            )
            .subscribe();

        return () => {
            participantsChannel.unsubscribe();
            optionsChannel.unsubscribe();
            eventsChannel.unsubscribe();
        };
    };

    const handleAddOption = async (restaurantId: string) => {
        if (!room || !user) return;

        try {
            await supabase.from('room_options').insert({
                room_id: room.id,
                added_by: user.id,
                restaurant_id: restaurantId,
                weight: 1,
            });
        } catch (err) {
            console.error('Error adding option:', err);
        }
    };

    const handleRemoveOption = async (optionId: string) => {
        try {
            await supabase.from('room_options').delete().eq('id', optionId);
        } catch (err) {
            console.error('Error removing option:', err);
        }
    };

    const handleStartSpin = async () => {
        if (!room || options.length === 0) return;

        // 随机选择一个结果
        const randomIndex = Math.floor(Math.random() * options.length);
        const resultId = options[randomIndex].restaurant_id;

        try {
            // 更新房间状态
            await supabase
                .from('rooms')
                .update({ status: 'spinning' })
                .eq('id', room.id);

            // 发送开始事件
            await supabase.from('room_events').insert({
                room_id: room.id,
                type: 'spin_start',
                payload: { resultId, seed: Date.now() },
            });

            setResult(resultId);
        } catch (err) {
            console.error('Error starting spin:', err);
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
    const resultRestaurant = result ? restaurants.find((r) => r.id === result) : null;

    return (
        <div className="space-y-6">
            {/* 房间信息 */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">房间 #{code}</h1>
                        <p className="text-sm text-gray-500">
                            {isHost ? '你是房主' : '等待房主开始'}
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

            {/* 结果展示 */}
            {resultRestaurant && (
                <div className="card bg-gradient-to-r from-ecnu-gold/20 to-ecnu-red/20 border-2 border-ecnu-gold">
                    <div className="text-center">
                        <div className="text-4xl mb-2">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {resultRestaurant.name}
                        </h2>
                        <p className="text-gray-600">{resultRestaurant.location.name}</p>
                    </div>
                </div>
            )}

            {/* 选项池 */}
            {!result && (
                <RoomOptionPool
                    options={options}
                    onAddOption={handleAddOption}
                    onRemoveOption={handleRemoveOption}
                    currentUserId={user.id}
                />
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
                {isHost && !result && (
                    <button
                        onClick={handleStartSpin}
                        disabled={options.length === 0}
                        className="btn-primary flex-1 disabled:opacity-50"
                    >
                        🎲 开始决策
                    </button>
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
