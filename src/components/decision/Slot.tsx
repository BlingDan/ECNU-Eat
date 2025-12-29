import { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant } from '@/types';
import { playClickSound, playWinSound, playStartSound, playReelStopSound, calculateVolumeAttenuation } from '@/utils/sound';

interface SlotProps {
  restaurants: Restaurant[];
  onResult: (restaurant: Restaurant) => void;
  disabled?: boolean;
}

interface SlotReelProps {
  items: Restaurant[];
  spinning: boolean;
  result?: Restaurant;
  onStop?: () => void;
  reelIndex: number;
}

// 食物图标映射
const FOOD_ICONS = ['🍜', '🍔', '🍕', '🍣', '🍲', '🥘', '🍛', '🍱', '🥗', '🌮', '🍝', '🥪'];

function getRandomIcon(seed: string): string {
  const hash = seed.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  return FOOD_ICONS[Math.abs(hash) % FOOD_ICONS.length];
}

/**
 * 老虎机单个卷轴 - 复古游戏风格
 */
function SlotReel({ items, spinning, result, onStop, reelIndex }: SlotReelProps) {
  const [displayItems, setDisplayItems] = useState<Restaurant[]>(items.slice(0, 5));
  const indexRef = useRef(0);
  const lastClickTimeRef = useRef(Date.now());

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % items.length;
        // 更新显示项 - 显示当前项前后的几个
        const newDisplay = [];
        for (let i = -2; i <= 2; i++) {
          const idx = (indexRef.current + i + items.length) % items.length;
          newDisplay.push(items[idx]);
        }
        setDisplayItems(newDisplay);

        // 每次滚动播放木质咔嗒声，带动态音量衰减
        const now = Date.now();
        const interval_ms = now - lastClickTimeRef.current;
        const attenuation = calculateVolumeAttenuation(interval_ms, 60);
        lastClickTimeRef.current = now;
        playClickSound(0.25, attenuation);
      }, 80 + reelIndex * 10); // 每个卷轴速度略有不同

      return () => clearInterval(interval);
    } else if (result) {
      // 停止时设置结果
      const resultIndex = items.findIndex((i) => i.id === result.id);
      const newDisplay = [];
      for (let i = -2; i <= 2; i++) {
        const idx = (resultIndex + i + items.length) % items.length;
        newDisplay.push(items[idx]);
      }
      setDisplayItems(newDisplay);
      indexRef.current = resultIndex;

      // 播放卷轴停止音效
      playReelStopSound();
      setTimeout(() => onStop?.(), 200);
    }
  }, [spinning, result, items, onStop, reelIndex]);

  return (
    <div className="relative">
      {/* 卷轴外框 - 复古金属质感 */}
      <div className="relative w-24 h-72 overflow-hidden rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,215,0,0.1)',
          border: '3px solid #2d2d44',
        }}
      >
        {/* 顶部阴影渐变 */}
        <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
        />

        {/* 底部阴影渐变 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
        />

        {/* 中间选中行高亮 */}
        <div className="absolute top-1/2 left-0 right-0 h-14 -translate-y-1/2 z-5 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)',
            borderTop: '2px solid rgba(255,215,0,0.4)',
            borderBottom: '2px solid rgba(255,215,0,0.4)',
          }}
        />

        {/* 滚动内容 */}
        <div className="flex flex-col items-center justify-center h-full py-2">
          {displayItems.map((item, index) => {
            const isCenter = index === 2;
            const distance = Math.abs(index - 2);
            const opacity = isCenter ? 1 : 0.4 - distance * 0.15;
            const scale = isCenter ? 1 : 0.75 - distance * 0.1;

            return (
              <div
                key={`${item.id}-${index}`}
                className={`flex flex-col items-center justify-center transition-all duration-100 ${spinning ? 'animate-pulse' : ''
                  }`}
                style={{
                  height: '56px',
                  opacity,
                  transform: `scale(${scale})`,
                }}
              >
                <span className="text-2xl mb-0.5">{getRandomIcon(item.id)}</span>
                <span className={`text-xs font-bold text-center leading-tight px-1 ${isCenter ? 'text-yellow-300' : 'text-gray-400'
                  }`}
                  style={{
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: isCenter ? '0 0 10px rgba(255,215,0,0.5)' : 'none',
                  }}
                >
                  {item.name.length > 6 ? item.name.slice(0, 6) + '...' : item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 卷轴装饰边框 */}
      <div className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          border: '2px solid transparent',
          borderImage: 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #ffd700 100%) 1',
        }}
      />
    </div>
  );
}

/**
 * 老虎机组件 - 吸血鬼幸存者风格
 */
export function Slot({ restaurants, onResult, disabled }: SlotProps) {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<(Restaurant | undefined)[]>([undefined, undefined, undefined]);
  const [stoppedCount, setStoppedCount] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);

  // 按食堂分组
  const byLocation = useMemo(() => {
    const groups: Record<string, Restaurant[]> = {};
    restaurants.forEach((r) => {
      const loc = r.location.id;
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(r);
    });
    return groups;
  }, [restaurants]);

  const locations = Object.keys(byLocation);
  const hasMultipleLocations = locations.length >= 3;

  const handleReelStop = () => {
    setStoppedCount((prev) => prev + 1);
  };

  useEffect(() => {
    if (stoppedCount === 3 && spinning) {
      setShowJackpot(true);
      setTimeout(() => {
        playWinSound();
        setShowJackpot(false);
      }, 500);
      setStoppedCount(0);
    }
  }, [stoppedCount, spinning]);

  const spin = () => {
    if (spinning || disabled || restaurants.length === 0) return;

    setSpinning(true);
    setResults([undefined, undefined, undefined]);
    setStoppedCount(0);
    setShowJackpot(false);

    // 播放开始蓄力音效
    playStartSound();

    // 随机选择结果
    const finalResults: Restaurant[] = [];
    if (hasMultipleLocations) {
      const shuffled = [...locations].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 3; i++) {
        const loc = shuffled[i % shuffled.length];
        const items = byLocation[loc];
        finalResults.push(items[Math.floor(Math.random() * items.length)]);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        finalResults.push(restaurants[Math.floor(Math.random() * restaurants.length)]);
      }
    }

    // 依次停止卷轴 - 更戏剧化的时间间隔
    finalResults.forEach((result, index) => {
      setTimeout(() => {
        setResults((prev) => {
          const newResults = [...prev];
          newResults[index] = result;
          return newResults;
        });

        if (index === 2) {
          setSpinning(false);
          onResult(finalResults[0]);
        }
      }, 1800 + index * 600);
    });
  };

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">请先添加选项到池子中</p>
      </div>
    );
  }

  const reel1Items = hasMultipleLocations ? byLocation[locations[0]] || restaurants : restaurants;
  const reel2Items = hasMultipleLocations ? byLocation[locations[1]] || restaurants : restaurants;
  const reel3Items = hasMultipleLocations ? byLocation[locations[2]] || restaurants : restaurants;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 老虎机主体 - 暗黑复古风格 */}
      <div className="relative p-1 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 50%, #ffd700 100%)',
        }}
      >
        <div className="relative p-6 rounded-xl"
          style={{
            background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* 顶部装饰 */}
          <div className="flex justify-center mb-4">
            <div className="px-6 py-2 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%)',
                border: '2px solid #ffd700',
                boxShadow: '0 0 15px rgba(255,215,0,0.3)',
              }}
            >
              <span className="text-yellow-400 font-bold tracking-widest text-sm"
                style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}
              >
                🎰 ECNU SLOTS 🎰
              </span>
            </div>
          </div>

          {/* 卷轴区域 */}
          <div className="flex gap-3 justify-center p-4 rounded-xl mb-4"
            style={{
              background: 'linear-gradient(180deg, #0a0a14 0%, #12121f 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
              border: '2px solid #2d2d44',
            }}
          >
            <SlotReel items={reel1Items} spinning={spinning} result={results[0]} onStop={handleReelStop} reelIndex={0} />
            <SlotReel items={reel2Items} spinning={spinning} result={results[1]} onStop={handleReelStop} reelIndex={1} />
            <SlotReel items={reel3Items} spinning={spinning} result={results[2]} onStop={handleReelStop} reelIndex={2} />
          </div>

          {/* Jackpot 闪光效果 */}
          {showJackpot && (
            <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
              }}
            />
          )}

          {/* 拉杆按钮 */}
          <button
            onClick={spin}
            disabled={spinning || disabled}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 active:scale-95"
            style={{
              background: spinning
                ? 'linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%)'
                : 'linear-gradient(180deg, #dc143c 0%, #8b0000 100%)',
              color: spinning ? '#888' : '#fff',
              boxShadow: spinning
                ? 'none'
                : '0 4px 15px rgba(220,20,60,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '2px solid',
              borderColor: spinning ? '#555' : '#ff6b6b',
              textShadow: spinning ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {spinning ? '🎲 转动中...' : '🎰 拉杆！'}
          </button>

          {/* 底部装饰灯 */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${spinning ? 'animate-pulse' : ''}`}
                style={{
                  background: spinning
                    ? `hsl(${(i * 72 + Date.now() / 50) % 360}, 80%, 50%)`
                    : '#ffd700',
                  boxShadow: spinning
                    ? `0 0 10px hsl(${(i * 72) % 360}, 80%, 50%)`
                    : '0 0 8px rgba(255,215,0,0.5)',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 结果显示 */}
      {!spinning && results[0] && (
        <div className="w-full max-w-sm p-6 rounded-xl text-center animate-result-bounce"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #ffd700',
            boxShadow: '0 0 20px rgba(255,215,0,0.3)',
          }}
        >
          <div className="text-yellow-400 text-sm mb-2"
            style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}
          >
            ✨ 食神的旨意 ✨
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{results[0].name}</h3>
          <p className="text-gray-400 text-sm">{results[0].location.name}</p>
        </div>
      )}

      {/* 说明文字 */}
      <div className="text-center text-sm text-gray-500">
        {hasMultipleLocations ? '🎲 匹配三个不同地点的选项' : '🎲 随机匹配三个选项'}
      </div>
    </div>
  );
}
