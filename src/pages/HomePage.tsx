import { useState } from 'react';
import { Campus, MealType, DecisionMode, Restaurant } from '@/types';
import { useDecisionEngine } from '@/hooks/useDecisionEngine';
import { useUserSettings } from '@/hooks/useLocalStorage';
import { getDefaultPool } from '@/data/restaurants';
import { Wheel } from '@/components/decision/Wheel';
import { Gacha } from '@/components/decision/Gacha';
import { Slot } from '@/components/decision/Slot';
import { OptionPoolManager } from '@/components/OptionPoolManager';
import { ResultScreen } from '@/components/ResultScreen';
import { JoinRoomModal } from '@/components/room/JoinRoomModal';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 设置阶段
 */
function SetupScreen({
    onStart,
    onJoinRoom,
}: {
    onStart: (campus: Campus, mealType: MealType, mode: DecisionMode) => void;
    onJoinRoom: () => void;
}) {
    const { user } = useAuth();
    const [campus, setCampus] = useState<Campus>(Campus.MINHANG);
    const [mealType, setMealType] = useState<MealType>(MealType.LUNCH);
    const [mode, setMode] = useState<DecisionMode>(DecisionMode.WHEEL);

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-ecnu-blue mb-2">🍜 ECNU Eat</h1>
                <p className="text-gray-600">今天吃什么？让食神来决定！</p>
            </div>

            {/* 多人房间入口 */}
            {user && (
                <div className="card bg-gradient-to-r from-ecnu-blue/10 to-ecnu-red/10 border-2 border-dashed border-ecnu-blue/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800">👥 和朋友一起？</h3>
                            <p className="text-sm text-gray-500">创建或加入房间，一起决定吃什么</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onJoinRoom}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-ecnu-blue transition"
                            >
                                加入
                            </button>
                            <a
                                href="/room/create"
                                className="px-4 py-2 rounded-lg bg-ecnu-blue text-white hover:bg-ecnu-blue/90 transition"
                            >
                                创建
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* 校区选择 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-3">选择校区</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setCampus(Campus.MINHANG)}
                        className={`p-4 rounded-xl border-2 transition ${campus === Campus.MINHANG
                                ? 'border-ecnu-red bg-ecnu-red/10'
                                : 'border-gray-200 hover:border-ecnu-red/50'
                            }`}
                    >
                        <div className="text-2xl mb-1">🏫</div>
                        <div className="font-bold">闵行校区</div>
                    </button>
                    <button
                        onClick={() => setCampus(Campus.PUTUO)}
                        className={`p-4 rounded-xl border-2 transition ${campus === Campus.PUTUO
                                ? 'border-ecnu-red bg-ecnu-red/10'
                                : 'border-gray-200 hover:border-ecnu-red/50'
                            }`}
                    >
                        <div className="text-2xl mb-1">🏛️</div>
                        <div className="font-bold">普陀校区</div>
                    </button>
                </div>
            </div>

            {/* 饭点选择 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-3">选择饭点</h2>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: MealType.BREAKFAST, label: '早餐', emoji: '🌅' },
                        { value: MealType.LUNCH, label: '午餐', emoji: '☀️' },
                        { value: MealType.DINNER, label: '晚餐', emoji: '🌙' },
                        { value: MealType.LATE_NIGHT, label: '夜宵', emoji: '🌃' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setMealType(item.value)}
                            className={`p-3 rounded-xl border-2 transition ${mealType === item.value
                                    ? 'border-ecnu-blue bg-ecnu-blue/10'
                                    : 'border-gray-200 hover:border-ecnu-blue/50'
                                }`}
                        >
                            <div className="text-xl mb-1">{item.emoji}</div>
                            <div className="font-medium">{item.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 决策方式 */}
            <div className="card">
                <h2 className="font-bold text-gray-800 mb-3">选择决策方式</h2>
                <div className="space-y-2">
                    {[
                        { value: DecisionMode.WHEEL, label: '幸运大转盘', desc: '可自定义权重', emoji: '🎡' },
                        { value: DecisionMode.GACHA, label: '美食抽卡', desc: '随机抽取美食卡', emoji: '🎴' },
                        { value: DecisionMode.SLOT, label: '老虎机', desc: '匹配三个选项', emoji: '🎰' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setMode(item.value)}
                            className={`w-full p-4 rounded-xl border-2 transition text-left ${mode === item.value
                                    ? 'border-ecnu-gold bg-ecnu-gold/10'
                                    : 'border-gray-200 hover:border-ecnu-gold/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.emoji}</span>
                                <div>
                                    <div className="font-bold">{item.label}</div>
                                    <div className="text-sm text-gray-500">{item.desc}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onStart(campus, mealType, mode)}
                className="btn-primary w-full text-lg"
            >
                开始决策
            </button>
        </div>
    );
}

/**
 * 决策阶段
 */
function DecidingScreen({
    mode,
    pool,
    onDecide,
    disabled,
}: {
    mode: DecisionMode;
    pool: any;
    onDecide: (restaurant: any) => void;
    disabled?: boolean;
}) {
    switch (mode) {
        case DecisionMode.WHEEL:
            return (
                <Wheel restaurants={pool.restaurants} weights={pool.weights} onSpin={onDecide} disabled={disabled} />
            );
        case DecisionMode.GACHA:
            return <Gacha restaurants={pool.restaurants} onPull={onDecide} disabled={disabled} />;
        case DecisionMode.SLOT:
            return <Slot restaurants={pool.restaurants} onResult={onDecide} disabled={disabled} />;
        default:
            return null;
    }
}

/**
 * 首页
 */
export default function HomePage() {
    const { session, startSession, updatePool, excludeRestaurant, includeRestaurant, startDeciding, setResult, useVeto, resetSession } =
        useDecisionEngine();
    const { settings, setSettings, addToHistory } = useUserSettings();
    const [currentCampus, setCurrentCampus] = useState<Campus>(Campus.MINHANG);
    const [currentMealType, setCurrentMealType] = useState<MealType>(MealType.LUNCH);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // 开始新会话
    const handleStart = (campus: Campus, mealType: MealType, mode: DecisionMode) => {
        setCurrentCampus(campus);
        setCurrentMealType(mealType);
        setSettings({ ...settings, campus, defaultMealType: mealType });
        startSession(mode, { ...settings, campus, defaultMealType: mealType });
    };

    // 决策完成
    const handleDecide = (restaurant: Restaurant) => {
        addToHistory(restaurant.id);
        setResult(restaurant);
    };

    // 确认结果
    const handleConfirm = () => {
        // 可以添加跳转到地图或其他功能
        alert('🎉 祝你用餐愉快！');
        resetSession();
    };

    return (
        <>
            {session.phase === 'setup' && (
                <SetupScreen
                    onStart={handleStart}
                    onJoinRoom={() => setShowJoinModal(true)}
                />
            )}

            {session.phase === 'pool' && (
                <div>
                    <button onClick={resetSession} className="mb-4 text-gray-500 hover:text-ecnu-blue">
                        ← 返回设置
                    </button>
                    <OptionPoolManager
                        pool={session.pool}
                        campus={currentCampus}
                        mealType={currentMealType}
                        onUpdatePool={updatePool}
                        onExclude={excludeRestaurant}
                        onInclude={(id) => includeRestaurant(id, getDefaultPool(currentCampus, currentMealType))}
                        onNext={startDeciding}
                    />
                </div>
            )}

            {session.phase === 'deciding' && (
                <div>
                    <button onClick={resetSession} className="mb-4 text-gray-500 hover:text-ecnu-blue">
                        ← 返回设置
                    </button>
                    <DecidingScreen
                        mode={session.mode}
                        pool={session.pool}
                        onDecide={handleDecide}
                        disabled={session.retryCount >= session.maxRetries}
                    />
                </div>
            )}

            {session.phase === 'result' && session.result && (
                <ResultScreen
                    session={session}
                    onVeto={useVeto}
                    onConfirm={handleConfirm}
                    onRestart={resetSession}
                />
            )}

            {/* 加入房间弹窗 */}
            <JoinRoomModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
            />
        </>
    );
}
