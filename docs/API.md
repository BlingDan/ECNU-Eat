# API 文档

## 概述

ECNU Eat 使用模块化架构，所有功能通过 React Hooks 和工具函数暴露。本文档描述了主要的 API 接口。

---

## 目录

- [类型定义](#类型定义)
- [数据访问 API](#数据访问-api)
- [Hooks API](#hooks-api)
- [组件 API](#组件-api)

---

## 类型定义

### Campus

校区枚举

```typescript
enum Campus {
  MINHANG = 'minhang',  // 闵行校区
  PUTUO = 'putuo',      // 普陀校区
}
```

### MealType

饭点类型枚举

```typescript
enum MealType {
  BREAKFAST = 'breakfast',    // 早餐
  LUNCH = 'lunch',            // 午餐
  DINNER = 'dinner',          // 晚餐
  LATE_NIGHT = 'late_night',  // 夜宵
}
```

### Rarity

抽卡稀有度枚举

```typescript
enum Rarity {
  SSR = 'ssr',  // 昂贵但偶尔想吃的餐厅
  SR = 'sr',    // 比较喜欢的餐厅
  R = 'r',      // 普通餐厅
  N = 'n',      // 第一食堂等日常选择
}
```

### DecisionMode

决策方式类型

```typescript
enum DecisionMode {
  WHEEL = 'wheel',  // 幸运大转盘
  GACHA = 'gacha',  // 美食抽卡
  SLOT = 'slot',    // 老虎机
}
```

### Location

食堂位置信息

```typescript
interface Location {
  id: string;              // 位置ID
  name: string;            // 位置名称
  campus: Campus;          // 所属校区
  description?: string;    // 描述
}
```

### Restaurant

餐厅/窗口信息

```typescript
interface Restaurant {
  id: string;                       // 唯一标识符
  name: string;                     // 餐厅名称
  location: Location;               // 所在位置
  window?: string;                  // 窗口号
  cuisine: string[];                // 菜系标签
  priceLevel: 1 | 2 | 3 | 4;        // 价格等级 (1-4)
  rarity: Rarity;                   // 稀有度
  spicyLevel?: 0 | 1 | 2 | 3;       // 辣度等级 (0-3)
  availableMeals: MealType[];       // 提供的饭点
  isOpen: boolean;                  // 是否营业中
  estimatedCalories?: number;       // 估计卡路里
  tags?: string[];                  // 额外标签
}
```

### OptionPool

选项池

```typescript
interface OptionPool {
  id: string;                              // 选项池ID
  name: string;                            // 选项池名称
  restaurants: Restaurant[];               // 包含的餐厅列表
  excludedIds: string[];                   // 排除的餐厅ID列表
  weights: Record<string, number>;         // 自定义权重 {restaurantId: weight}
}
```

### UserSettings

用户设置

```typescript
interface UserSettings {
  campus: Campus;                  // 默认校区
  defaultMealType: MealType;       // 默认饭点
  favoriteIds: string[];           // 收藏的餐厅ID列表
  recentHistory: string[];         // 最近吃过的餐厅ID列表
  preferences: {
    maxSpicyLevel?: number;        // 最大辣度
    maxPriceLevel?: number;        // 最大价格等级
    maxCalories?: number;          // 最大卡路里
  };
}
```

### DecisionSession

决策会话状态

```typescript
interface DecisionSession {
  phase: 'setup' | 'pool' | 'deciding' | 'result';  // 当前阶段
  mode: DecisionMode;                                // 决策方式
  pool: OptionPool;                                  // 当前选项池
  vetoUsed: boolean;                                 // 是否已使用否决权
  retryCount: number;                                // 当前重试次数
  maxRetries: number;                                // 最大重试次数
  result?: Restaurant;                               // 决策结果
}
```

---

## 数据访问 API

模块位置: `src/data/restaurants.ts`

### getRestaurantsByCampus()

根据校区获取餐厅列表

```typescript
function getRestaurantsByCampus(campus: Campus): Restaurant[]
```

**参数:**
- `campus`: 校区枚举值

**返回:** 餐厅数组

**示例:**
```typescript
const minhangRestaurants = getRestaurantsByCampus(Campus.MINHANG);
```

### filterByMealType()

根据饭点筛选餐厅

```typescript
function filterByMealType(restaurants: Restaurant[], mealType: MealType): Restaurant[]
```

**参数:**
- `restaurants`: 餐厅数组
- `mealType`: 饭点类型

**返回:** 筛选后的餐厅数组

### getRestaurantById()

根据ID获取餐厅

```typescript
function getRestaurantById(id: string): Restaurant | undefined
```

**参数:**
- `id`: 餐厅ID

**返回:** 餐厅对象或 undefined

### getDefaultPool()

获取默认推荐池（基于饭点）

```typescript
function getDefaultPool(campus: Campus, mealType: MealType): Restaurant[]
```

**参数:**
- `campus`: 校区
- `mealType`: 饭点类型

**返回:** 推荐的餐厅数组

### searchRestaurants()

搜索餐厅

```typescript
function searchRestaurants(campus: Campus, query: string): Restaurant[]
```

**参数:**
- `campus`: 校区
- `query`: 搜索关键词（匹配名称、菜系、标签）

**返回:** 匹配的餐厅数组

### getRarityConfig()

获取稀有度配置

```typescript
function getRarityConfig(rarity: Rarity): {
  color: string;
  label: string;
  glow: string;
  bg: string;
}
```

**参数:**
- `rarity`: 稀有度枚举值

**返回:** 稀有度样式配置对象

---

## Hooks API

### useDecisionEngine()

核心决策引擎 Hook

```typescript
function useDecisionEngine(): {
  session: DecisionSession;
  settings: UserSettings;
  startSession(mode: DecisionMode, userSettings: UserSettings): void;
  updatePool(updates: Partial<OptionPool>): void;
  excludeRestaurant(restaurantId: string): void;
  includeRestaurant(restaurantId: string, allRestaurants: Restaurant[]): void;
  setWeight(restaurantId: string, weight: number): void;
  startDeciding(): void;
  decide(): Restaurant;
  setResult(restaurant: Restaurant): void;
  useVeto(): void;
  resetSession(): void;
  setSettings(settings: UserSettings): void;
}
```

**返回值和方法说明:**

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `session` | DecisionSession | 当前会话状态 |
| `settings` | UserSettings | 用户设置 |
| `startSession` | function | 开始新的决策会话 |
| `updatePool` | function | 更新选项池 |
| `excludeRestaurant` | function | 从选项池中排除餐厅 |
| `includeRestaurant` | function | 将餐厅添加回选项池 |
| `setWeight` | function | 设置餐厅权重 |
| `startDeciding` | function | 进入决策阶段 |
| `decide` | function | 执行决策（内部随机） |
| `setResult` | function | 直接设置决策结果 |
| `useVeto` | function | 使用否决权重抽 |
| `resetSession` | function | 重置会话 |
| `setSettings` | function | 更新用户设置 |

**使用示例:**
```typescript
const { session, startSession, decide, useVeto, resetSession } = useDecisionEngine();

// 开始会话
startSession(DecisionMode.WHEEL, userSettings);

// 执行决策
const result = decide();

// 使用否决权
useVeto();
```

### useLocalStorage()

通用本地存储 Hook

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

**参数:**
- `key`: localStorage 键名
- `initialValue`: 初始值

**返回:** `[storedValue, setValue]` 元组

**示例:**
```typescript
const [settings, setSettings] = useLocalStorage('user-settings', defaultSettings);
```

### useUserSettings()

用户设置专用 Hook

```typescript
function useUserSettings(): {
  settings: UserSettings;
  setSettings(settings: UserSettings): void;
  addToHistory(restaurantId: string): void;
  toggleFavorite(restaurantId: string): void;
  clearHistory(): void;
}
```

**返回值和方法说明:**

| 方法 | 说明 |
|------|------|
| `settings` | 当前用户设置 |
| `setSettings` | 更新设置 |
| `addToHistory` | 添加餐厅到历史记录 |
| `toggleFavorite` | 切换收藏状态 |
| `clearHistory` | 清空历史记录 |

### usePWAInstall()

PWA 安装提示 Hook

```typescript
function usePWAInstall(): {
  isInstallable: boolean;
  promptInstall: () => Promise<boolean>;
}
```

**返回值:**
- `isInstallable`: 是否可安装为 PWA
- `promptInstall`: 触发安装提示

---

## 组件 API

### Wheel

幸运大转盘组件

```tsx
<Wheel
  restaurants={Restaurant[]}
  weights={Record<string, number>}
  onSpin={(restaurant: Restaurant) => void}
  disabled?: boolean
/>
```

**Props:**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `restaurants` | Restaurant[] | 是 | 选项池餐厅列表 |
| `weights` | Record<string, number> | 是 | 餐厅权重 |
| `onSpin` | function | 是 | 转动结束回调 |
| `disabled` | boolean | 否 | 是否禁用 |

### Gacha

美食抽卡组件

```tsx
<Gacha
  restaurants={Restaurant[]}
  onPull={(restaurant: Restaurant) => void}
  disabled?: boolean
/>
```

**Props:**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `restaurants` | Restaurant[] | 是 | 选项池餐厅列表 |
| `onPull` | function | 是 | 抽卡结束回调 |
| `disabled` | boolean | 否 | 是否禁用 |

### Slot

老虎机组件

```tsx
<Slot
  restaurants={Restaurant[]}
  onResult={(restaurant: Restaurant) => void}
  disabled?: boolean
/>
```

**Props:**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `restaurants` | Restaurant[] | 是 | 选项池餐厅列表 |
| `onResult` | function | 是 | 老虎机停止回调 |
| `disabled` | boolean | 否 | 是否禁用 |

### OptionPoolManager

选项池管理组件

```tsx
<OptionPoolManager
  pool={OptionPool}
  campus={Campus}
  mealType={MealType}
  onUpdatePool={(updates: Partial<OptionPool>) => void}
  onExclude={(id: string) => void}
  onInclude={(id: string) => void}
  onNext={() => void}
/>
```

### ResultScreen

决策结果展示组件

```tsx
<ResultScreen
  session={DecisionSession}
  onVeto={() => void}
  onConfirm={() => void}
  onRestart={() => void}
/>
```

---

## 存储键名

### LocalStorage

| 键名 | 类型 | 说明 |
|------|------|------|
| `ecnu-eat-settings` | UserSettings | 用户设置 |

---

## 常量

### DEFAULT_SETTINGS

默认用户设置

```typescript
export const DEFAULT_SETTINGS: UserSettings = {
  campus: Campus.MINHANG,
  defaultMealType: MealType.LUNCH,
  favoriteIds: [],
  recentHistory: [],
  preferences: {},
};
```

### 最大重试次数

```typescript
const MAX_RETRIES = 3;
```

---

## 错误处理

### 决策引擎可能抛出的错误

```typescript
// 选项池为空时
throw new Error('选项池为空');

// 达到最大重试次数时
throw new Error('已达到最大重试次数');
```

建议在调用 `decide()` 时使用 try-catch:

```typescript
try {
  const result = decide();
} catch (error) {
  console.error(error.message);
  // 处理错误
}
```

---

## 扩展指南

### 添加新的决策方式

1. 在 `DecisionMode` 枚举中添加新模式
2. 在 `src/components/decision/` 创建新组件
3. 在 `DecidingScreen` 中添加对应的 case
4. 更新设置界面中的选项

### 添加新的餐厅数据

编辑 `src/data/restaurants.ts`，在对应的数组中添加新的餐厅对象。

### 自定义样式

编辑 `tailwind.config.js` 添加自定义颜色和样式：

```javascript
theme: {
  extend: {
    colors: {
      // 自定义颜色
    },
    animation: {
      // 自定义动画
    },
  },
}
```
