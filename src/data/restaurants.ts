import { Restaurant, Location, Campus, MealType, Rarity } from '@/types';

// ============== ECNU 餐厅数据 ==============

/**
 * 闵行校区食堂位置
 */
const MINHANG_LOCATIONS: Location[] = [
  { id: 'mh-north', name: '北区食堂', campus: Campus.MINHANG, description: '本科生生活区' },
  { id: 'mh-south', name: '南区食堂', campus: Campus.MINHANG, description: '研究生生活区' },
  { id: 'mh-library', name: '图书馆食堂', campus: Campus.MINHANG, description: '图书馆附近' },
  { id: 'mh-east', name: '河东食堂', campus: Campus.MINHANG, description: '河东宿舍区' },
  { id: 'mh-west', name: '河西食堂', campus: Campus.MINHANG, description: '河西宿舍区' },
];

/**
 * 普陀校区食堂位置
 */
const PUTUO_LOCATIONS: Location[] = [
  { id: 'pt-main', name: '主校区食堂', campus: Campus.PUTUO, description: '主校区' },
  { id: 'pt-west', name: '西部食堂', campus: Campus.PUTUO, description: '西部校区' },
];

// 辅助函数获取位置
function getLocation(id: string): Location {
  return [...MINHANG_LOCATIONS, ...PUTUO_LOCATIONS].find(l => l.id === id) || MINHANG_LOCATIONS[0];
}

/**
 * 闵行校区餐厅数据
 */
const MINHANG_RESTAURANTS: Restaurant[] = [
  // 北区食堂
  {
    id: 'mh-north-1',
    name: '北区食堂·大众快餐',
    location: getLocation('mh-north'),
    window: '1号窗口',
    cuisine: ['中式快餐', '家常菜'],
    priceLevel: 1,
    rarity: Rarity.N,
    spicyLevel: 0,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 600,
    tags: ['经济实惠', '不用排队'],
  },
  {
    id: 'mh-north-2',
    name: '北区食堂·麻辣烫',
    location: getLocation('mh-north'),
    window: '2号窗口',
    cuisine: ['川菜', '麻辣烫'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 3,
    availableMeals: [MealType.LUNCH, MealType.DINNER, MealType.LATE_NIGHT],
    isOpen: true,
    estimatedCalories: 700,
    tags: ['辣', '现煮'],
  },
  {
    id: 'mh-north-3',
    name: '北区食堂·铁板烧',
    location: getLocation('mh-north'),
    window: '3号窗口',
    cuisine: ['铁板烧', '日式'],
    priceLevel: 2,
    rarity: Rarity.SR,
    spicyLevel: 0,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 800,
    tags: ['现做', '香味浓郁'],
  },
  // 南区食堂
  {
    id: 'mh-south-1',
    name: '南区食堂·粤菜窗口',
    location: getLocation('mh-south'),
    window: '5号窗口',
    cuisine: ['粤菜', '煲仔饭'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 0,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 650,
    tags: ['清淡', '营养'],
  },
  {
    id: 'mh-south-2',
    name: '南区食堂·韩国料理',
    location: getLocation('mh-south'),
    window: '8号窗口',
    cuisine: ['韩式', '石锅拌饭', '泡菜'],
    priceLevel: 2,
    rarity: Rarity.SR,
    spicyLevel: 1,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 750,
    tags: ['拌饭', '年糕火锅'],
  },
  // 图书馆食堂
  {
    id: 'mh-lib-1',
    name: '图书馆食堂·意式面食',
    location: getLocation('mh-library'),
    window: '意面窗口',
    cuisine: ['西餐', '意大利面'],
    priceLevel: 3,
    rarity: Rarity.SR,
    spicyLevel: 0,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 700,
    tags: ['环境好', '适合学习'],
  },
  {
    id: 'mh-lib-2',
    name: '图书馆食堂·日式定食',
    location: getLocation('mh-library'),
    window: '日料窗口',
    cuisine: ['日式', '定食', '拉面'],
    priceLevel: 3,
    rarity: Rarity.SSR,
    spicyLevel: 0,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 800,
    tags: ['精致', '偶尔犒劳自己'],
  },
  // 河东食堂
  {
    id: 'mh-east-1',
    name: '河东食堂·兰州拉面',
    location: getLocation('mh-east'),
    window: '拉面窗口',
    cuisine: ['西北菜', '拉面'],
    priceLevel: 1,
    rarity: Rarity.R,
    spicyLevel: 1,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 650,
    tags: ['热乎', '量大'],
  },
  // 河西食堂
  {
    id: 'mh-west-1',
    name: '河西食堂·麻辣香锅',
    location: getLocation('mh-west'),
    window: '香锅窗口',
    cuisine: ['川菜', '麻辣香锅'],
    priceLevel: 2,
    rarity: Rarity.SR,
    spicyLevel: 2,
    availableMeals: [MealType.LUNCH, MealType.DINNER, MealType.LATE_NIGHT],
    isOpen: true,
    estimatedCalories: 850,
    tags: ['下饭', '自选菜'],
  },
  // 周边外卖/餐厅
  {
    id: 'mh-mcd',
    name: '麦当劳 (虹梅路店)',
    location: getLocation('mh-north'),
    cuisine: ['快餐', '汉堡', '薯条'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 0,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.LATE_NIGHT],
    isOpen: true,
    estimatedCalories: 900,
    tags: ['外卖', '炸鸡', '快乐水'],
  },
  {
    id: 'mh-kfc',
    name: '肯德基 (虹梅路店)',
    location: getLocation('mh-north'),
    cuisine: ['快餐', '炸鸡'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 0,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.LATE_NIGHT],
    isOpen: true,
    estimatedCalories: 950,
    tags: ['外卖', '疯狂星期四'],
  },
  {
    id: 'mh-dumpling',
    name: '东北饺子馆',
    location: getLocation('mh-south'),
    cuisine: ['东北菜', '饺子'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 0,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 600,
    tags: ['水饺', '热乎'],
  },
];

/**
 * 普陀校区餐厅数据
 */
const PUTUO_RESTAURANTS: Restaurant[] = [
  {
    id: 'pt-main-1',
    name: '主校区食堂·大众快餐',
    location: getLocation('pt-main'),
    window: '1楼',
    cuisine: ['中式快餐', '家常菜'],
    priceLevel: 1,
    rarity: Rarity.N,
    spicyLevel: 0,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 600,
    tags: ['经济实惠'],
  },
  {
    id: 'pt-main-2',
    name: '主校区食堂·小炒',
    location: getLocation('pt-main'),
    window: '2楼',
    cuisine: ['中式', '小炒'],
    priceLevel: 2,
    rarity: Rarity.R,
    spicyLevel: 1,
    availableMeals: [MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 700,
    tags: ['现炒', '下饭'],
  },
  {
    id: 'pt-west-1',
    name: '西部食堂·面点',
    location: getLocation('pt-west'),
    window: '面食窗口',
    cuisine: ['面食', '汤面'],
    priceLevel: 1,
    rarity: Rarity.N,
    spicyLevel: 0,
    availableMeals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
    isOpen: true,
    estimatedCalories: 550,
    tags: ['汤面', '馄饨'],
  },
];

// ============== 数据访问接口 ==============

/**
 * 所有餐厅列表
 */
export const restaurants: Restaurant[] = [...MINHANG_RESTAURANTS, ...PUTUO_RESTAURANTS];

/**
 * 根据校区获取餐厅列表
 */
export function getRestaurantsByCampus(campus: Campus): Restaurant[] {
  switch (campus) {
    case Campus.MINHANG:
      return MINHANG_RESTAURANTS;
    case Campus.PUTUO:
      return PUTUO_RESTAURANTS;
  }
}

/**
 * 根据饭点筛选餐厅
 */
export function filterByMealType(restaurants: Restaurant[], mealType: MealType): Restaurant[] {
  return restaurants.filter(r => r.availableMeals.includes(mealType));
}

/**
 * 根据ID获取餐厅
 */
export function getRestaurantById(id: string): Restaurant | undefined {
  return [...MINHANG_RESTAURANTS, ...PUTUO_RESTAURANTS].find(r => r.id === id);
}

/**
 * 获取默认推荐池（基于饭点）
 */
export function getDefaultPool(campus: Campus, mealType: MealType): Restaurant[] {
  const restaurants = getRestaurantsByCampus(campus);
  return filterByMealType(restaurants, mealType);
}

/**
 * 搜索餐厅
 */
export function searchRestaurants(campus: Campus, query: string): Restaurant[] {
  const restaurants = getRestaurantsByCampus(campus);
  const lowerQuery = query.toLowerCase();
  return restaurants.filter(r =>
    r.name.toLowerCase().includes(lowerQuery) ||
    r.cuisine.some(c => c.toLowerCase().includes(lowerQuery)) ||
    r.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 获取稀有度配置
 */
export function getRarityConfig(rarity: Rarity) {
  switch (rarity) {
    case Rarity.SSR:
      return {
        color: '#FFD700',
        label: 'SSR',
        glow: 'shadow-yellow-400/50',
        bg: 'from-yellow-400 to-yellow-600',
        glowColor: '#FFD700',
        particleColors: ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'],
      };
    case Rarity.SR:
      return {
        color: '#C0C0C0',
        label: 'SR',
        glow: 'shadow-gray-400/50',
        bg: 'from-purple-400 to-purple-600',
        glowColor: '#A855F7',
        particleColors: ['#A855F7', '#C084FC', '#E879F9', '#FFFFFF'],
      };
    case Rarity.R:
      return {
        color: '#CD7F32',
        label: 'R',
        glow: 'shadow-orange-400/50',
        bg: 'from-blue-400 to-blue-600',
        glowColor: '#3B82F6',
        particleColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#FFFFFF'],
      };
    case Rarity.N:
      return {
        color: '#808080',
        label: 'N',
        glow: 'shadow-gray-400/50',
        bg: 'from-gray-400 to-gray-600',
        glowColor: '#9CA3AF',
        particleColors: ['#9CA3AF', '#D1D5DB', '#E5E7EB', '#FFFFFF'],
      };
  }
}

