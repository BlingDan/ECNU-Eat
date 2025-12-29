// ============== 核心类型定义 ==============

/**
 * 校区枚举
 */
export enum Campus {
  MINHANG = 'minhang',
  PUTUO = 'putuo',
}

/**
 * 饭点类型
 */
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  LATE_NIGHT = 'late_night',
}

/**
 * 抽卡稀有度
 */
export enum Rarity {
  SSR = 'ssr',      // 昂贵但偶尔想吃的餐厅
  SR = 'sr',        // 比较喜欢的餐厅
  R = 'r',          // 普通餐厅
  N = 'n',          // 第一食堂等日常选择
}

/**
 * 决策方式类型
 */
export enum DecisionMode {
  WHEEL = 'wheel',       // 幸运大转盘
  GACHA = 'gacha',       // 美食抽卡
  SLOT = 'slot',         // 老虎机
}

/**
 * 食堂位置
 */
export interface Location {
  id: string;
  name: string;
  campus: Campus;
  description?: string;
}

/**
 * 餐厅/窗口信息
 */
export interface Restaurant {
  id: string;
  name: string;
  location: Location;
  window?: string;        // 窗口号，如 "3号窗口"
  cuisine: string[];      // 菜系标签
  priceLevel: 1 | 2 | 3 | 4; // 价格等级
  rarity: Rarity;
  spicyLevel?: 0 | 1 | 2 | 3; // 辣度等级
  availableMeals: MealType[]; // 提供的饭点
  isOpen: boolean;        // 是否营业中
  estimatedCalories?: number; // 估计卡路里
  tags?: string[];        // 额外标签
}

/**
 * 选项池
 */
export interface OptionPool {
  id: string;
  name: string;
  restaurants: Restaurant[];
  excludedIds: string[];  // 排除的餐厅ID
  weights: Record<string, number>; // 自定义权重
}

/**
 * 用户设置
 */
export interface UserSettings {
  campus: Campus;
  defaultMealType: MealType;
  favoriteIds: string[];  // 收藏的餐厅
  recentHistory: string[]; // 最近吃过的
  preferences: {
    maxSpicyLevel?: number;
    maxPriceLevel?: number;
    maxCalories?: number;
  };
}

/**
 * 抽卡结果
 */
export interface GachaResult {
  restaurant: Restaurant;
  rarity: Rarity;
  isNew: boolean;         // 是否是新解锁的
}

/**
 * 决策会话状态
 */
export interface DecisionSession {
  phase: 'setup' | 'pool' | 'deciding' | 'result';
  mode: DecisionMode;
  pool: OptionPool;
  vetoUsed: boolean;
  retryCount: number;
  maxRetries: number;
  result?: Restaurant;
}

/**
 * 共享房间（未来社交功能）
 */
export interface ShareRoom {
  id: string;
  host: string;
  participants: string[];
  pools: OptionPool[];
  status: 'waiting' | 'deciding' | 'finished';
}
