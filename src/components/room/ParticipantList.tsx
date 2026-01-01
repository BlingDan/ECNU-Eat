import type { RoomParticipant } from '@/types/database';

interface ParticipantListProps {
    participants: RoomParticipant[];
    hostId: string;
    currentUserId: string | undefined;
}

export function ParticipantList({ participants, hostId, currentUserId }: ParticipantListProps) {
    return (
        <div className="card">
            <h2 className="font-bold text-gray-800 mb-3">
                👥 参与者 ({participants.length})
            </h2>
            <div className="space-y-2">
                {participants.map((participant, index) => {
                    const isHost = participant.user_id === hostId;
                    const isCurrentUser = participant.user_id === currentUserId;

                    return (
                        <div
                            key={`${participant.room_id}-${participant.user_id || index}`}
                            className={`flex items-center gap-3 p-2 rounded-lg ${isCurrentUser ? 'bg-ecnu-blue/10' : 'bg-gray-50'
                                }`}
                        >
                            {/* 头像 */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ecnu-blue to-ecnu-red flex items-center justify-center text-white font-bold">
                                {participant.nickname[0].toUpperCase()}
                            </div>

                            {/* 名称 */}
                            <div className="flex-1">
                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                    {participant.nickname}
                                    {isHost && (
                                        <span className="text-xs bg-ecnu-gold text-white px-1.5 py-0.5 rounded">
                                            房主
                                        </span>
                                    )}
                                    {isCurrentUser && (
                                        <span className="text-xs text-gray-400">(你)</span>
                                    )}
                                </div>
                            </div>

                            {/* 准备状态 */}
                            <div className={`text-lg ${participant.is_ready ? 'text-green-500' : 'text-gray-300'}`}>
                                {participant.is_ready ? '✓' : '○'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
