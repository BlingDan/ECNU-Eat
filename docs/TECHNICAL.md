# ECNU Eat 技术文档

## 项目架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 7.x | 构建工具 |
| Tailwind CSS | 3.x | CSS 框架 |
| LocalStorage | - | 数据持久化 |

### 项目结构

```
ecnu-eat/
├── public/                  # 静态资源
│   └── manifest.json        # PWA 配置
├── src/
│   ├── components/          # React 组件
│   │   ├── decision/        # 决策引擎组件
│   │   │   ├── Wheel.tsx    # 大转盘
│   │   │   ├── Gacha.tsx    # 抽卡
│   │   │   └── Slot.tsx     # 老虎机
│   │   ├── OptionPoolManager.tsx  # 选项池管理
│   │   └── ResultScreen.tsx        # 结果展示
│   ├── data/                # 数据层
│   │   └── restaurants.ts   # 餐厅数据
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useDecisionEngine.ts   # 决策引擎
│   │   └── useLocalStorage.ts     # 本地存储
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── docs/                    # 文档
│   └── API.md               # API 文档
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
└── tsconfig.json            # TypeScript 配置
```

---

## 核心设计模式

### 1. 状态管理模式

使用 React Hooks 进行状态管理，主要状态包括：

- **DecisionSession**: 决策会话状态
- **UserSettings**: 用户设置（持久化到 LocalStorage）

### 2. 决策流程

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Setup  │────▶│  Pool   │────▶│Deciding │────▶│ Result  │
│ (设置)  │     │ (选项池) │     │ (决策)  │     │ (结果)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                      ▲                                │
                      └────────否决权──────────────────┘
```

### 3. 组件层次结构

```
App
├── SetupScreen (设置阶段)
│   ├── 校区选择
│   ├── 饭点选择
│   └── 决策方式选择
├── OptionPoolManager (选项池管理)
│   ├── 当前选项列表
│   ├── 权重调整
│   └── 添加/移除选项
├── DecidingScreen (决策阶段)
│   ├── Wheel (大转盘)
│   ├── Gacha (抽卡)
│   └── Slot (老虎机)
└── ResultScreen (结果展示)
    ├── 餐厅信息
    ├── 否决按钮
    └── 确认按钮
```

---

## 数据流设计

### 用户设置流程

```
用户操作
    │
    ▼
useUserSettings Hook
    │
    ├─▶ setSettings()
    │       │
    │       ▼
    │   更新状态
    │       │
    │       ▼
    │   LocalStorage (持久化)
    │
    └─▶ 组件重新渲染
```

### 决策流程

```
开始会话
    │
    ▼
startSession()
    │
    ├─▶ 获取默认选项池 (基于校区+饭点)
    │       │
    │       ▼
    │   过滤最近吃过的
    │       │
    │       ▼
    │   创建 DecisionSession
    │
    ├─▶ 用户编辑选项池
    │       │
    │       ▼
    │   startDeciding()
    │
    ├─▶ 决策组件渲染
    │       │
    │       ▼
    │   用户触发决策
    │       │
    │       ▼
    │   setResult()
    │       │
    │       ▼
    │   添加到历史记录
    │
    └─▶ 展示结果
            │
            ├─▶ 确认 → 结束
            │
            └─▶ 否决 → 重新决策
```

---

## 决策算法

### 加权随机算法

```typescript
function weightedRandom(
  restaurants: Restaurant[],
  weights: Record<string, number>
): Restaurant {
  // 1. 计算总权重
  const totalWeight = restaurants.reduce(
    (sum, r) => sum + (weights[r.id] || 1),
    0
  );

  // 2. 生成随机值
  let random = Math.random() * totalWeight;

  // 3. 选择结果
  for (const restaurant of restaurants) {
    random -= weights[restaurant.id] || 1;
    if (random <= 0) {
      return restaurant;
    }
  }

  return restaurants[restaurants.length - 1];
}
```

### 权重说明

- 默认权重: 1
- 用户可设置任意正整数权重
- 权重越高，被选中概率越大

**计算示例:**
```
选项池: [A(权重1), B(权重2), C(权重3)]
总权重: 1 + 2 + 3 = 6

A 被选中概率: 1/6 ≈ 16.7%
B 被选中概率: 2/6 ≈ 33.3%
C 被选中概率: 3/6 = 50%
```

---

## 样式系统

### Tailwind 自定义配置

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      ecnu: {
        red: '#C8102E',    // ECNU 红
        blue: '#003366',   // ECNU 蓝
        gold: '#D4AF37',   // 金色（强调色）
      },
    },
    animation: {
      'spin-slow': 'spin 3s linear infinite',
      'bounce-slow': 'bounce 1s infinite',
      'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },
}
```

### 响应式设计

| 断点 | 宽度 | 目标设备 |
|------|------|----------|
| default | < 768px | 手机竖屏 |
| md | ≥ 768px | 平板/手机横屏 |
| lg | ≥ 1024px | 桌面 |

### 组件样式类

```css
/* 通用按钮 */
.btn-primary    /* 主按钮 */
.btn-secondary  /* 次要按钮 */

/* 卡片 */
.card           /* 白色卡片容器 */

/* 输入框 */
.input-field    /* 标准输入框 */
```

---

## PWA 支持

### Manifest 配置

```json
{
  "name": "ECNU Eat",
  "short_name": "ECNU Eat",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#C8102E",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 安装提示

使用 `usePWAInstall` Hook 检测和提示安装：

```typescript
const { isInstallable, promptInstall } = usePWAInstall();
```

---

## 性能优化

### 1. 代码分割

使用动态导入进行路由级别的代码分割（未来添加路由时）

### 2. 内存优化

- 使用 `useCallback` 缓存函数引用
- 使用 `useMemo` 缓存计算结果

### 3. 渲染优化

- 避免不必要的重渲染
- 使用 `key` 属性优化列表渲染

### 4. 包体积优化

当前构建输出:
- HTML: 0.77 kB
- CSS: 21.11 kB (gzip: 4.38 kB)
- JS: 220.89 kB (gzip: 68.78 kB)

---

## 数据持久化

### LocalStorage 结构

```json
{
  "ecnu-eat-settings": {
    "campus": "minhang",
    "defaultMealType": "lunch",
    "favoriteIds": ["mh-north-1", "mh-south-2"],
    "recentHistory": ["mh-north-2", "mh-lib-1"],
    "preferences": {
      "maxSpicyLevel": 2,
      "maxPriceLevel": 3
    }
  }
}
```

### 数据同步

- 设置变更自动同步到 LocalStorage
- 应用启动时从 LocalStorage 恢复设置

---

## 错误处理

### 边界情况处理

1. **选项池为空**: 显示提示信息，禁用决策按钮
2. **达到最大重试次数**: 禁用否决按钮
3. **LocalStorage 不可用**: 使用内存默认值
4. **网络资源加载失败**: 显示占位符

### 错误边界

建议在未来版本中添加 React Error Boundary

---

## 测试策略

### 单元测试

- 对核心算法进行单元测试
- 测试加权随机算法的分布
- 测试数据过滤和搜索功能

### 集成测试

- 测试完整决策流程
- 测试状态持久化

### 手动测试清单

- [ ] 所有决策方式正常工作
- [ ] 权重设置生效
- [ ] 否决权功能正确
- [ ] 历史记录正确保存
- [ ] 响应式布局在各设备正常

---

## 部署指南

### 构建命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 静态托管

项目构建后生成 `dist/` 目录，可部署到任何静态托管服务：

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

### 环境变量

当前版本无需环境变量配置。

---

## 未来扩展方向

### 阶段 2 功能

1. **后端集成**
   - Supabase 实时数据库
   - 共享房间功能
   - 多人协同决策

2. **社交功能**
   - 选项合并 API
   - 实时同步
   - 用户认证

3. **数据增强**
   - 众包菜单更新
   - 营养信息数据库
   - 用户评价系统

### 性能改进

- Service Worker 缓存策略
- 离线支持
- 图片懒加载

### 用户体验

- 美食集邮册功能
- 成就和徽章系统
- 个性化推荐算法

---

## 开发指南

### 添加新的餐厅

编辑 `src/data/restaurants.ts`:

```typescript
{
  id: 'unique-id',
  name: '餐厅名称',
  location: getLocation('location-id'),
  window: '窗口号',
  cuisine: ['菜系1', '菜系2'],
  priceLevel: 2,
  rarity: Rarity.R,
  spicyLevel: 1,
  availableMeals: [MealType.LUNCH, MealType.DINNER],
  isOpen: true,
  estimatedCalories: 700,
  tags: ['标签1', '标签2'],
}
```

### 添加新的决策模式

1. 更新 `DecisionMode` 枚举
2. 创建组件实现 `DecisionMode` 组件接口
3. 在 `DecidingScreen` 添加渲染逻辑
4. 更新设置页面

### 调试技巧

```typescript
// 查看当前会话状态
console.log(session);

// 查看用户设置
console.log(settings);

// 模拟特定结果
setResult(mockRestaurant);
```
