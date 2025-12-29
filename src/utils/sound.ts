/**
 * 音效工具 - 优化版
 * 参考转盘/老虎机音效设计最佳实践
 */

let audioContext: AudioContext | null = null;

/**
 * 获取音频上下文
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * 播放木质咔嗒声 (Mechanical Ratchet Click)
 * 模拟指针撞击轮盘钉子的声音
 * - 偏木质、闷一点的点击声
 * - 支持动态音量衰减，避免高频触发时的听觉疲劳
 * 
 * @param volume 基础音量 (0-1)
 * @param attenuation 衰减系数，用于高频触发时自动降低音量
 */
export function playClickSound(volume: number = 0.3, attenuation: number = 1): void {
  try {
    const ctx = getAudioContext();
    const actualVolume = volume * Math.min(attenuation, 1);

    // 主振荡器 - 低频三角波，模拟木质敲击
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 木质敲击特性 - 低频到更低频的快速衰减
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    // 音量包络 - 快速起音，自然衰减
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(actualVolume * 0.5, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);

    // 添加噪声成分，增加真实感
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
    }

    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800; // 低通滤波，去除刺耳高频

    noiseSource.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseGain.gain.setValueAtTime(actualVolume * 0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    noiseSource.start(ctx.currentTime);
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 播放开始/蓄力音效 (Start/Trigger Sound)
 * 按下按钮的瞬间，有一个蓄力的声音或清脆的开始音
 */
export function playStartSound(): void {
  try {
    const ctx = getAudioContext();

    // 上升音调 - 蓄力感
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    // 添加一个"嘭"的低频冲击
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();

    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    thump.type = 'sine';
    thump.frequency.setValueAtTime(150, ctx.currentTime);
    thump.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

    thumpGain.gain.setValueAtTime(0.3, ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    thump.start(ctx.currentTime);
    thump.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 播放胜利音效 (Result/Win Sound)
 * 大奖高频音 + 和谐琶音
 */
export function playWinSound(): void {
  try {
    const ctx = getAudioContext();

    // C大调琶音上行 - 胜利感
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime + i * 0.12);

      gainNode.gain.setValueAtTime(0, startTime + i * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + i * 0.12 + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.12 + 0.4);

      oscillator.start(startTime + i * 0.12);
      oscillator.stop(startTime + i * 0.12 + 0.4);
    });

    // 添加闪亮的高频泛音
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();

    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2093, ctx.currentTime + 0.4); // C7

    shimmerGain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
    shimmerGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.45);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    shimmer.start(ctx.currentTime + 0.4);
    shimmer.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 播放普通结果音效 (安慰奖)
 * 短促低沉，不会让人失望但也不张扬
 */
export function playNormalResultSound(): void {
  try {
    const ctx = getAudioContext();

    // 简单的确认音 - 低频版
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(330, ctx.currentTime); // E4
    oscillator.frequency.setValueAtTime(392, ctx.currentTime + 0.1); // G4

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 播放卷轴停止音效 (Casino Reel Stop)
 * 老虎机停止的爽脆声
 */
export function playReelStopSound(): void {
  try {
    const ctx = getAudioContext();

    // 清脆的"咔"声
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    // 添加金属共振
    const resonance = ctx.createOscillator();
    const resGain = ctx.createGain();

    resonance.connect(resGain);
    resGain.connect(ctx.destination);

    resonance.type = 'sine';
    resonance.frequency.setValueAtTime(1200, ctx.currentTime);
    resonance.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    resGain.gain.setValueAtTime(0.1, ctx.currentTime);
    resGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    resonance.start(ctx.currentTime);
    resonance.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 播放抽卡音效 (翻卡刷刷声)
 */
export function playGachaSound(): void {
  try {
    const ctx = getAudioContext();

    // 创建刷刷声效果
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }

    const noise = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.start();
  } catch (e) {
    console.debug('Audio play failed:', e);
  }
}

/**
 * 计算基于速度的音量衰减
 * 用于高频触发时动态降低音量，避免听觉疲劳
 * 
 * @param interval 当前触发间隔(ms)
 * @param minInterval 最小间隔阈值(ms)，低于此值开始衰减
 * @returns 衰减后的音量系数 (0-1)
 */
export function calculateVolumeAttenuation(interval: number, minInterval: number = 50): number {
  if (interval >= minInterval) {
    return 1;
  }
  // 间隔越小，衰减越多
  return Math.max(0.3, interval / minInterval);
}
