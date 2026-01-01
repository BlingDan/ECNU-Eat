/**
 * Supabase 数据库类型定义
 * 
 * 这些类型对应 Supabase 中的表结构
 * 用于提供类型安全的数据库操作
 */

// ============== 用户与社交 ==============

export interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
}

export interface Collection {
    id: string;
    user_id: string;
    restaurant_id: string;
    eaten_count: number;
    last_eaten_at: string;
}

export interface Review {
    id: string;
    user_id: string;
    restaurant_id: string;
    rating: number;
    content: string | null;
    tags: string[];
    created_at: string;
}

// ============== 多人房间 ==============

export type RoomStatus = 'waiting' | 'spinning' | 'showing_result' | 'closed';

export interface RoomSettings {
    allowVeto: boolean;
    mode: 'wheel' | 'gacha' | 'slot';
    maxParticipants?: number;
}

export interface Room {
    id: string;
    code: string;
    host_id: string;
    status: RoomStatus;
    settings: RoomSettings;
    created_at: string;
}

export interface RoomParticipant {
    room_id: string;
    user_id: string | null;
    nickname: string;
    is_ready: boolean;
    joined_at: string;
}

export interface RoomOption {
    id: string;
    room_id: string;
    added_by: string | null;
    restaurant_id: string;
    weight: number;
}

export type RoomEventType = 'spin_start' | 'veto_used' | 'result_accepted';

export interface RoomEventPayload {
    resultId?: string;
    seed?: number;
    userId?: string;
}

export interface RoomEvent {
    id: string;
    room_id: string;
    type: RoomEventType;
    payload: RoomEventPayload;
    created_at: string;
}

// ============== 用户偏好与历史 ==============

export interface UserPreferences {
    user_id: string;
    weights: Record<string, number>;
    excluded: string[];
    updated_at: string;
}

export interface DecisionHistory {
    id: string;
    user_id: string;
    restaurant_id: string;
    decision_mode: 'wheel' | 'gacha' | 'slot';
    created_at: string;
}

// ============== 成就系统 ==============

export type AchievementType =
    | 'first_use'      // 初来乍到
    | 'canteen_regular' // 食堂常客
    | 'minhang_master' // 闵行通
    | 'all_unlocked'   // 全能王
    | 'reviewer'       // 美食家
    | 'explorer';      // 探险家

export interface Achievement {
    id: string;
    user_id: string;
    achievement_type: string;
    unlocked_at: string;
}

// ============== 餐厅统计 ==============

export interface RestaurantStats {
    restaurant_id: string;
    avg_rating: number;
    review_count: number;
    popular_tags: string[];
}

// ============== Supabase Database 类型 ==============
// 使用简化的类型定义，避免复杂的泛型推断问题

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Database { }

// ============== 辅助类型 ==============

/**
 * 带有 Profile 信息的 Review
 */
export interface ReviewWithProfile extends Review {
    profiles: Pick<Profile, 'username' | 'avatar_url'> | null;
}

/**
 * 带有参与者信息的房间
 */
export interface RoomWithParticipants extends Room {
    room_participants: RoomParticipant[];
    room_options: RoomOption[];
}
