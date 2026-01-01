import type { AchievementType } from '@/types/database';

interface AchievementBadgeProps {
    type: string;
    unlockedAt: string;
}

const achievementData: Record<AchievementType, { name: string; emoji: string; description: string }> = {
    first_use: {
        name: '初来乍到',
        emoji: '🎒',
        description: '首次使用 ECNU Eat',
    },
    canteen_regular: {
        name: '食堂常客',
        emoji: '🏠',
        description: '集齐任意食堂 5 个窗口',
    },
    minhang_master: {
        name: '闵行通',
        emoji: '🗺️',
        description: '解锁闵行校区 50% 餐厅',
    },
    all_unlocked: {
        name: '全能王',
        emoji: '👑',
        description: '解锁全部餐厅',
    },
    reviewer: {
        name: '美食家',
        emoji: '✍️',
        description: '发表 10 条评价',
    },
    explorer: {
        name: '探险家',
        emoji: '🧭',
        description: '连续 7 天尝试新餐厅',
    },
};

export function AchievementBadge({ type, unlockedAt }: AchievementBadgeProps) {
    const achievement = achievementData[type as AchievementType];

    if (!achievement) {
        return null;
    }

    const formattedDate = new Date(unlockedAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-ecnu-gold/20 to-amber-100 border border-ecnu-gold/30"
            title={`${achievement.description}\n解锁于 ${formattedDate}`}
        >
            <span className="text-xl">{achievement.emoji}</span>
            <span className="text-sm font-medium text-amber-800">{achievement.name}</span>
        </div>
    );
}
