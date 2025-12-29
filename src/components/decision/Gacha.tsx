import { useState, useRef } from 'react';
import { Restaurant, Rarity } from '@/types';
import { getRarityConfig } from '@/data/restaurants';
import { playGachaSound, playWinSound, playClickSound } from '@/utils/sound';

interface GachaProps {
  restaurants: Restaurant[];
  onPull: (restaurant: Restaurant) => void;
  disabled?: boolean;
}

// 卡牌状态
type CardPhase = 'idle' | 'opening' | 'revealing' | 'flipping' | 'revealed';

/**
 * 美食抽卡组件 - TCG卡牌店模拟器风格
 */
export function Gacha({ restaurants, onPull, disabled }: GachaProps) {
  const [phase, setPhase] = useState<CardPhase>('idle');
  const [result, setResult] = useState<Restaurant | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const particleIdRef = useRef(0);

  // 生成粒子效果
  const spawnParticles = (count: number, colors: string[]) => {
    const newParticles = Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 50 + (Math.random() - 0.5) * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    // 清理粒子
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  };

  // 开始抽卡
  const startPull = () => {
    if (phase !== 'idle' || disabled || restaurants.length === 0) return;

    // 随机选择结果
    const selected = restaurants[Math.floor(Math.random() * restaurants.length)];
    setResult(selected);

    // 开始卡包开启动画
    setPhase('opening');
    playGachaSound();

    // 震动效果
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      setShakeIntensity(Math.sin(shakeCount * 0.5) * 5);
      shakeCount++;
      if (shakeCount > 20) {
        clearInterval(shakeInterval);
        setShakeIntensity(0);
      }
    }, 50);

    // 进入揭示阶段
    setTimeout(() => {
      setPhase('revealing');
      // 生成开包粒子
      const config = getRarityConfig(selected.rarity);
      spawnParticles(30, config.particleColors || ['#fff', '#ffd700']);
      playClickSound(0.5);
    }, 1200);
  };

  // 点击揭示卡牌
  const revealCard = () => {
    if (phase !== 'revealing') return;

    setPhase('flipping');
    playClickSound(0.3);

    // 翻转完成后显示结果
    setTimeout(() => {
      setPhase('revealed');
      if (result) {
        const config = getRarityConfig(result.rarity);
        spawnParticles(50, config.particleColors || ['#fff', '#ffd700']);
      }
      playWinSound();
    }, 600);
  };

  // 收下卡牌
  const collectCard = () => {
    if (phase !== 'revealed' || !result) return;

    setPhase('idle');
    onPull(result);
    setResult(null);
    setParticles([]);
  };

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">请先添加选项到池子中</p>
      </div>
    );
  }

  const rarityConfig = result ? getRarityConfig(result.rarity) : null;

  return (
    <div className="flex flex-col items-center gap-6 relative">
      {/* 粒子效果层 */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
          />
        ))}
      </div>

      {/* 主内容区 */}
      <div
        className="relative"
        style={{ transform: `translateX(${shakeIntensity}px)` }}
      >
        {/* 待机状态 - 卡包展示 */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6">
            {/* 卡包 */}
            <div
              className="relative w-72 h-96 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              onClick={startPull}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                border: '3px solid #ffd700',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* 卡包装饰 */}
              <div className="absolute inset-4 border-2 border-yellow-500/30 rounded-xl" />

              {/* 中央图标 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="text-8xl mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))' }}
                >
                  🎴
                </div>
                <div
                  className="text-2xl font-bold text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
                    textShadow: '0 0 20px rgba(255,215,0,0.5)',
                  }}
                >
                  ECNU 美食包
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  {restaurants.length} 张卡牌待抽取
                </div>

                {/* 点击提示 */}
                <div className="absolute bottom-8 text-yellow-400/80 text-sm animate-pulse">
                  👆 点击开启卡包
                </div>
              </div>

              {/* 光效 */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle at 50% 30%, rgba(255,215,0,0.2), transparent 60%)',
                }}
              />
            </div>

            {/* 稀有度说明 */}
            <div className="flex gap-4 flex-wrap justify-center mt-4">
              {([
                { rarity: Rarity.SSR, label: 'SSR', prob: '5%' },
                { rarity: Rarity.SR, label: 'SR', prob: '15%' },
                { rarity: Rarity.R, label: 'R', prob: '30%' },
                { rarity: Rarity.N, label: 'N', prob: '50%' },
              ]).map((item) => {
                const config = getRarityConfig(item.rarity);
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className={`w-5 h-5 rounded bg-gradient-to-br ${config.bg}`} />
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.prob}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 开包动画 */}
        {phase === 'opening' && (
          <div className="w-72 h-96 flex items-center justify-center">
            <div
              className="w-72 h-96 rounded-2xl animate-pack-open"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                border: '3px solid #ffd700',
                boxShadow: '0 0 60px rgba(255, 215, 0, 0.6)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl animate-pulse" style={{ filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' }}>
                  ✨
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 待揭示 - 卡牌背面 */}
        {phase === 'revealing' && (
          <div
            className="w-72 h-96 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={revealCard}
            style={{
              background: `linear-gradient(135deg, ${rarityConfig?.glowColor || '#333'} 0%, #1a1a2e 50%, ${rarityConfig?.glowColor || '#333'} 100%)`,
              border: `3px solid ${rarityConfig?.glowColor || '#ffd700'}`,
              boxShadow: `0 0 40px ${rarityConfig?.glowColor || '#ffd700'}80`,
            }}
          >
            {/* 卡背图案 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-6xl mb-4 animate-bounce"
                style={{ filter: `drop-shadow(0 0 20px ${rarityConfig?.glowColor || '#ffd700'})` }}
              >
                🎴
              </div>
              <div className="text-white/80 font-bold text-xl">???</div>

              {/* 稀有度预告光环 */}
              <div
                className="absolute inset-0 rounded-2xl animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${rarityConfig?.glowColor || '#ffd700'}40 0%, transparent 70%)`,
                }}
              />

              {/* 点击提示 */}
              <div className="absolute bottom-8 text-white/70 text-sm animate-pulse">
                👆 点击翻开卡牌
              </div>
            </div>
          </div>
        )}

        {/* 翻转动画 */}
        {phase === 'flipping' && result && (
          <div className="w-72 h-96 perspective-1000">
            <div
              className="w-full h-full rounded-2xl animate-card-flip preserve-3d"
              style={{
                background: `linear-gradient(135deg, ${rarityConfig?.glowColor || '#333'})`,
              }}
            >
              {renderCardContent(result, false)}
            </div>
          </div>
        )}

        {/* 揭示完成 - 显示卡牌正面 */}
        {phase === 'revealed' && result && (
          <div className="flex flex-col items-center gap-6">
            <div
              className="w-72 h-auto min-h-96 rounded-2xl overflow-hidden animate-result-bounce"
              style={{
                boxShadow: `0 0 60px ${rarityConfig?.glowColor || '#ffd700'}`,
              }}
            >
              {renderCardContent(result, true)}
            </div>

            {/* 收下按钮 */}
            <button
              onClick={collectCard}
              className="px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${rarityConfig?.glowColor || '#ffd700'}, ${rarityConfig?.glowColor || '#ffd700'}cc)`,
                color: '#000',
                boxShadow: `0 4px 20px ${rarityConfig?.glowColor || '#ffd700'}60`,
              }}
            >
              ✨ 收下卡牌 ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 渲染卡牌内容
 */
function renderCardContent(restaurant: Restaurant, showDetails: boolean) {
  const config = getRarityConfig(restaurant.rarity);

  return (
    <div
      className={`relative w-full h-full min-h-96 bg-gradient-to-br ${config.bg} p-1 rounded-2xl`}
    >
      {/* 内框 */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
        }}
      >
        {/* 稀有度标签 */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full z-10"
          style={{
            background: `linear-gradient(135deg, ${config.glowColor}, ${config.glowColor}88)`,
            boxShadow: `0 0 15px ${config.glowColor}`,
          }}
        >
          <span className="text-white font-bold text-sm">{config.label}</span>
        </div>

        {/* 卡面装饰 */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${config.glowColor}30 0%, transparent 50%)`,
          }}
        />

        {/* 主要内容 */}
        <div className="relative flex flex-col items-center justify-center h-full py-8 px-4">
          {/* 食物图标区 */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mb-4"
            style={{
              background: `radial-gradient(circle, ${config.glowColor}40 0%, transparent 70%)`,
              boxShadow: `0 0 30px ${config.glowColor}50`,
            }}
          >
            <span className="text-7xl" style={{ filter: `drop-shadow(0 0 20px ${config.glowColor})` }}>
              🍽️
            </span>
          </div>

          {/* 餐厅名称 */}
          <h3
            className="text-2xl font-bold text-white text-center mb-2"
            style={{ textShadow: `0 0 20px ${config.glowColor}` }}
          >
            {restaurant.name}
          </h3>

          {/* 位置 */}
          <p className="text-white/80 text-sm mb-4">{restaurant.location.name}</p>

          {showDetails && (
            <>
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {restaurant.cuisine.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{
                      background: `${config.glowColor}30`,
                      border: `1px solid ${config.glowColor}50`,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* 属性 */}
              <div className="flex justify-center gap-6 text-white/90">
                <div className="flex flex-col items-center">
                  <span className="text-lg">{'¥'.repeat(restaurant.priceLevel)}</span>
                  <span className="text-xs text-white/50">价格</span>
                </div>
                {restaurant.spicyLevel !== undefined && restaurant.spicyLevel > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{'🌶️'.repeat(restaurant.spicyLevel)}</span>
                    <span className="text-xs text-white/50">辣度</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 底部装饰 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: `linear-gradient(0deg, ${config.glowColor}20 0%, transparent 100%)`,
          }}
        />
      </div>
    </div>
  );
}
