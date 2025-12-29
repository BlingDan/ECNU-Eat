import { useState, useRef, useEffect } from 'react';
import { Restaurant } from '@/types';
import { getRarityConfig } from '@/data/restaurants';
import { playClickSound, playWinSound, playStartSound, calculateVolumeAttenuation } from '@/utils/sound';

interface WheelProps {
  restaurants: Restaurant[];
  weights: Record<string, number>;
  onSpin: (restaurant: Restaurant) => void;
  disabled?: boolean;
}

/**
 * 幸运大转盘组件
 */
export function Wheel({ restaurants, weights, onSpin, disabled }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const soundIntervalRef = useRef<number | null>(null);

  // 计算扇区角度
  const segmentAngle = 360 / restaurants.length;

  // 根据选项数量动态调整字体大小
  const getFontSize = () => {
    if (restaurants.length <= 6) return { base: 'text-sm', md: 'text-base' };
    if (restaurants.length <= 10) return { base: 'text-xs', md: 'text-sm' };
    if (restaurants.length <= 15) return { base: 'text-[10px]', md: 'text-xs' };
    return { base: 'text-[9px]', md: 'text-[10px]' };
  };

  const fontSize = getFontSize();

  // 根据选项数量调整转盘大小
  const getWheelSize = () => {
    if (restaurants.length <= 8) return 'w-80 h-80 md:w-96 md:h-96';
    if (restaurants.length <= 15) return 'w-96 h-96 md:w-[28rem] md:h-[28rem]';
    return 'w-[28rem] h-[28rem] md:w-[32rem] md:h-[32rem]';
  };

  const spin = () => {
    if (isSpinning || disabled || restaurants.length === 0) return;

    setIsSpinning(true);

    // 阶段1: 播放开始/蓄力音效
    playStartSound();

    // 加权随机选择
    const totalWeight = restaurants.reduce((sum, r) => sum + (weights[r.id] || 1), 0);
    let random = Math.random() * totalWeight;
    let selectedRestaurant = restaurants[0];

    for (const restaurant of restaurants) {
      random -= weights[restaurant.id] || 1;
      if (random <= 0) {
        selectedRestaurant = restaurant;
        break;
      }
    }

    // 计算旋转角度
    const selectedAngle = restaurants.indexOf(selectedRestaurant) * segmentAngle;
    const spins = 5 + Math.random() * 3; // 5-8圈
    const finalAngle = spins * 360 + (360 - selectedAngle - segmentAngle / 2);

    // 计算总转动时间和经过的扇区数
    const duration = 4000;
    const totalDegrees = spins * 360 + (360 - selectedAngle);
    const totalSegments = Math.floor(totalDegrees / segmentAngle);

    setRotation(finalAngle);

    // 阶段2: 播放旋转咔嗒声 - 使用 ease-out 缓动，越往后越慢
    let segmentIndex = 0;
    let lastClickTime = Date.now();

    const easeOut = (t: number): number => {
      // cubic ease-out: 1 - (1-t)^3
      return 1 - Math.pow(1 - t, 3);
    };

    const scheduleClick = () => {
      if (segmentIndex >= totalSegments) {
        // 阶段3: 转动结束，播放胜利音效
        setTimeout(() => {
          playWinSound();
        }, 200);
        return;
      }

      // 计算当前进度和下一个扇区的时间
      const currentProgress = segmentIndex / totalSegments;
      const nextProgress = (segmentIndex + 1) / totalSegments;

      // 使用 easeOut 计算实际时间
      const currentTime = easeOut(currentProgress) * duration;
      const nextTime = easeOut(nextProgress) * duration;
      const interval = nextTime - currentTime;

      // 计算音量衰减 - 高频触发时自动降低音量
      const now = Date.now();
      const actualInterval = now - lastClickTime;
      const attenuation = calculateVolumeAttenuation(actualInterval, 50);
      lastClickTime = now;

      // 播放木质咔嗒声
      playClickSound(0.35, attenuation);
      segmentIndex++;

      soundIntervalRef.current = window.setTimeout(scheduleClick, Math.max(interval, 30));
    };

    // 短暂延迟后开始咔嗒声，让开始音效先播放
    setTimeout(() => scheduleClick(), 200);

    setTimeout(() => {
      setIsSpinning(false);
      onSpin(selectedRestaurant);
    }, duration);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        clearTimeout(soundIntervalRef.current);
      }
    };
  }, []);

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">请先添加选项到池子中</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 转盘 */}
      <div className="relative">
        {/* 指针 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-ecnu-red drop-shadow-lg" />
        </div>

        {/* 转盘容器 */}
        <div
          ref={wheelRef}
          className={`${getWheelSize()} rounded-full overflow-hidden shadow-2xl border-8 border-ecnu-gold relative transition-transform duration-[4000ms] ease-out`}
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {restaurants.map((restaurant, index) => {
            const angle = index * segmentAngle;
            const rarity = getRarityConfig(restaurant.rarity);
            return (
              <div
                key={restaurant.id}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${angle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)}%)`,
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${rarity.bg} flex items-center justify-center`}
                  style={{ clipPath: 'inherit' }}
                >
                  <span
                    className={`absolute font-bold text-white text-center px-2 leading-tight ${fontSize.base} md:${fontSize.md}`}
                    style={{
                      transform: `rotate(${segmentAngle / 2}deg) translateY(-${restaurants.length > 15 ? 80 : 100}px)`,
                      transformOrigin: 'center',
                    }}
                  >
                    {restaurant.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* 中心点 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-ecnu-gold">
            <span className="text-2xl">🍜</span>
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        onClick={spin}
        disabled={isSpinning || disabled}
        className="btn-primary text-xl px-12 py-4"
      >
        {isSpinning ? '转动中...' : '开始抽奖'}
      </button>

      {/* 选项列表 - 可折叠 */}
      <details className="w-full max-w-md">
        <summary className="text-center text-gray-600 cursor-pointer hover:text-ecnu-blue transition mb-3">
          当前选项池 ({restaurants.length}个) - 点击展开
        </summary>
        <div className="flex flex-wrap gap-2 justify-center mt-3 p-4 bg-white/50 rounded-xl max-h-40 overflow-y-auto">
          {restaurants.map((r) => {
            const rarity = getRarityConfig(r.rarity);
            return (
              <span
                key={r.id}
                className={`px-3 py-1 rounded-full text-sm text-white ${rarity.bg}`}
              >
                {r.name}
              </span>
            );
          })}
        </div>
      </details>
    </div>
  );
}
