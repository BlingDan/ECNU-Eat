# Phase 2 技术设计文档：连接校园

本文档概述了 ECNU Eat 第二阶段的技术架构和实施计划。目标是将应用程序从纯本地工具演变为协作社交平台。

## 1. 架构概览

- **前端计划**：继续使用现有的 React + Vite + Tailwind 技术栈。
- **后端基础设施**：使用 **Supabase** (BaaS) 来实现：
    - **身份验证 (Authentication)**：管理用户身份。
    - **数据库 (Database)**：使用 PostgreSQL 存储持久化数据（用户资料、历史记录、房间）。
    - **实时同步 (Realtime)**：在多人房间中同步状态（WebSocket）。
    - **边缘函数 (Edge Functions)**（可选）：如果严格要求安全的服务器端随机数生成（对于此用例，简单的客户端种子随机数通常就足够了），则用于复杂的决策逻辑。

## 2. 数据库模式 (PostgreSQL)

我们将使用关系模型。以下是关键表结构。

### 2.1 用户与社交
**`profiles`**
(链接到 `auth.users` 的公开信息)
- `id`: `uuid` (主键, 引用 `auth.users`)
- `username`: `text` (唯一, 详细显示名称)
- `avatar_url`: `text`
- `bio`: `text`
- `created_at`: `timestamptz`

**`collections`**
("美食集邮" - 记录用户吃过的地方)
- `id`: `uuid` (主键)
- `user_id`: `uuid` (外键 -> profiles.id)
- `restaurant_id`: `text` (匹配 `src/data/restaurants.ts` 中的 ID)
- `eaten_count`: `int` (默认 1)
- `last_eaten_at`: `timestamptz`
*在 (user_id, restaurant_id) 上设置唯一约束*

**`reviews`**
- `id`: `uuid` (主键)
- `user_id`: `uuid`
- `restaurant_id`: `text`
- `rating`: `int` (1-5)
- `content`: `text`
- `tags`: `text[]` (例如: ["辣", "排队久"])
- `created_at`: `timestamptz`

### 2.2 多人房间

**`rooms`**
- `id`: `uuid` (主键)
- `code`: `text` (用于加入的短代码，例如 "AF3D")
- `host_id`: `uuid` (外键 -> profiles.id)
- `status`: `enum` ('waiting', 'spinning', 'showing_result', 'closed')
- `settings`: `jsonb` (存储配置，如: `{ allowVeto: true, mode: 'wheel' }`)
- `created_at`: `timestamptz`

**`room_participants`**
- `room_id`: `uuid` (外键)
- `user_id`: `uuid` (外键, 如果允许游客则可空)
- `nickname`: `text` (用于显示)
- `is_ready`: `boolean`
- `joined_at`: `timestamptz`

**`room_options`**
(协作选项池)
- `id`: `uuid` (主键)
- `room_id`: `uuid` (外键)
- `added_by`: `uuid` (外键 -> user_id)
- `restaurant_id`: `text`
- `weight`: `int` (默认 1)

**`room_events`**
(用于驱动 UI 状态的操作日志)
- `id`: `uuid` (主键)
- `room_id`: `uuid` (外键)
- `type`: `enum` ('spin_start', 'veto_used', 'result_accepted')
- `payload`: `jsonb` (例如: `{ resultId: 'canteen-x', seed: 12345 }`)
- `created_at`: `timestamptz`

## 3. 功能分解与实现逻辑

### 3.1 身份验证流程
1.  **依赖**: 安装 `@supabase/supabase-js`。
2.  **UI**: 在标题栏添加 `LoginButton`。
3.  **逻辑**: 支持 GitHub/Google OAuth 或 邮箱魔术链接 (Magic Link)。
4.  **策略**: 使用 RLS (行级安全性) 确保用户只能编辑自己的资料。

### 3.2 "共享房间" (核心功能)

**房主流程**:
1.  点击 "创建房间"。
2.  调用 `supabase.from('rooms').insert(...)`。
3.  跳转到 `/room/:code`。
4.  订阅此房间 ID 的实时变更。

**访客流程**:
1.  在首页输入房间代码。
2.  调用 `supabase.from('rooms').select().eq('code', input)`。
3.  如果存在，插入数据到 `room_participants`。
4.  重定向到 `/room/:code` 并订阅。

**同步机制 (Realtime)**:
- **选项合并**: 当用户将本地收藏添加到房间时，向 `room_options` 表插入行。监听 `room_options` 表 `INSERT` 事件的所有客户端将立即更新 UI。
- **旋转 (The Spin)**:
    1.  房主点击 "开始"。
    2.  房主客户端生成随机种子（或简单的结果索引）。
    3.  房主向 `room_events` 表插入 `spin_start` 事件，包含目标结果。
    4.  所有客户端收到该事件。
    5.  所有客户端在本地触发*相同*的动画，并停在*相同*的结果上。
    6.  *安全说明*：对于美食应用，客户端侧的信任是可以接受的。我们尚不需要赌场级的服务器端 RNG 验证。

### 3.3 美食集邮 (Collection)
1.  **触发**: 在做出决定并接受后（单人或多人模式），显示 "标记为已吃" 按钮。
2.  **动作**: 更新 `collections` 表。
3.  **显示**: 一个新的 "护照" 或 "菜单" 页面，显示已访问地点的徽章/贴纸。

## 4. 实施优先级 (Phase 2 路线图)

1.  **设置与认证** (第 1 周)
    - 初始化 Supabase 项目。
    - 设置数据库模式。
    - 实现登录/个人资料功能。

2.  **房间基础设施** (第 1-2 周)
    - 创建/加入 API。
    - 实时参与者列表。

3.  **协作选项池** (第 2 周)
    - 用于向共享池添加选项的 UI。
    - 池的实时同步。

4.  **同步游戏** (第 3 周)
    - 同步 "旋转" 动作。
    - 同步结果和否决状态。

5.  **社交包装** (第 4 周)
    - 评价和收藏。
    - 个人资料统计。

## 5. 安全策略 (RLS)
- **Profiles**: 公开读取，所有者写入。
- **Rooms**: 公开读取 (如果有 ID/Code)，参与者写入 (添加选项)。
- **Room Events**: 参与者插入。

## 6. 前端结构变更

### 6.1 新增 Context/Providers
- `AuthProvider`: 管理用户认证状态、登录/登出逻辑
- `RoomProvider`: 管理房间状态、实时订阅
- `CollectionProvider`: 管理用户集邮数据缓存

### 6.2 完整路由设计
| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 现有决策页面 |
| `/login` | 登录页 | OAuth / Magic Link 登录 |
| `/profile` | 个人中心 | 用户资料、统计数据 |
| `/collection` | 美食集邮册 | 集邮进度、成就展示 |
| `/reviews` | 我的评价 | 用户发表的评价列表 |
| `/room/create` | 创建房间 | 房间设置页 |
| `/room/:code` | 房间页 | 多人协同决策 |

## 7. 用户评价系统详细设计

### 7.1 评价入口触发点
1. **决策完成后**: 接受结果时弹出 "去过了？留下评价" 浮层
2. **集邮册页面**: 在已访问的餐厅卡片上显示 "写评价" 按钮
3. **历史记录**: 查看历史决策记录时可追加评价

### 7.2 评价表单设计
```
┌─────────────────────────────────┐
│  ⭐⭐⭐⭐☆  4/5                │
├─────────────────────────────────┤
│  快捷标签: [好吃] [排队长] [辣]  │
├─────────────────────────────────┤
│  📝 写点什么...                 │
│  _____________________________ │
│                                 │
├─────────────────────────────────┤
│        [取消]    [提交评价]     │
└─────────────────────────────────┘
```

### 7.3 评价展示逻辑
- **餐厅详情页**: 显示评分聚合 (平均分 + 评价数量)
- **评价列表**: 按时间倒序展示，支持分页加载
- **热门标签**: 统计高频标签展示在餐厅信息中

### 7.4 数据库补充
**`restaurant_stats`** (物化视图或定期计算)
- `restaurant_id`: `text` (主键)
- `avg_rating`: `numeric(2,1)`
- `review_count`: `int`
- `popular_tags`: `text[]` (Top 5 标签)

## 8. 美食集邮册详细设计

### 8.1 页面布局
```
┌──────────────────────────────────────┐
│  🏆 美食护照            进度 24/87   │
│  ████████░░░░░░░░░░░░░  27.6%        │
├──────────────────────────────────────┤
│  [全部] [闵行] [普陀] [周边]         │
├──────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │ 🍜 │ │ 🍔 │ │ ❓ │ │ ❓ │        │
│  │已解锁│ │已解锁│ │未解锁│ │未解锁│        │
│  └────┘ └────┘ └────┘ └────┘        │
└──────────────────────────────────────┘
```

### 8.2 成就系统
| 成就名称 | 条件 | 徽章 |
|----------|------|------|
| 初来乍到 | 首次使用 | 🎒 |
| 食堂常客 | 集齐任意食堂 5 个窗口 | 🏠 |
| 闵行通 | 解锁闵行校区 50% 餐厅 | 🗺️ |
| 全能王 | 解锁全部餐厅 | 👑 |
| 美食家 | 发表 10 条评价 | ✍️ |
| 探险家 | 连续 7 天尝试新餐厅 | 🧭 |

### 8.3 分享功能
- 生成集邮册进度图片 (Canvas 渲染)
- 支持保存到相册或分享到社交平台
- 包含: 用户名、进度百分比、解锁成就数

### 8.4 数据库补充
**`achievements`**
- `id`: `uuid` (主键)
- `user_id`: `uuid` (外键)
- `achievement_type`: `text` (成就类型枚举)
- `unlocked_at`: `timestamptz`

## 9. 数据迁移策略

### 9.1 LocalStorage → Supabase 迁移

**迁移场景**: 用户在 Phase 1 使用本地存储积累的偏好数据

**迁移数据**:
| LocalStorage Key | 目标表 | 说明 |
|------------------|--------|------|
| `ecnu-eat-weights` | `user_preferences` | 餐厅权重偏好 |
| `ecnu-eat-excluded` | `user_preferences` | 排除的餐厅 |
| `ecnu-eat-history` | `decision_history` | 决策历史 |

**迁移流程**:
```
用户首次登录
    ↓
检测 LocalStorage 是否有旧数据
    ↓
[有数据] → 弹出迁移确认框
    ↓
用户确认 → 批量写入 Supabase
    ↓
迁移成功 → 清除 LocalStorage (可选保留备份)
```

### 9.2 新增数据表
**`user_preferences`**
- `user_id`: `uuid` (主键, 外键)
- `weights`: `jsonb` (餐厅权重 Map)
- `excluded`: `text[]` (排除的餐厅 ID)
- `updated_at`: `timestamptz`

**`decision_history`**
- `id`: `uuid` (主键)
- `user_id`: `uuid`
- `restaurant_id`: `text`
- `decision_mode`: `enum` ('wheel', 'gacha', 'slot')
- `created_at`: `timestamptz`

## 10. 离线支持策略

### 10.1 降级逻辑
```
应用启动
    ↓
检测网络状态 (navigator.onLine)
    ↓
[在线] → 使用完整功能
[离线] → 进入离线模式
```

### 10.2 离线模式功能矩阵
| 功能 | 离线可用 | 说明 |
|------|----------|------|
| 单人决策 | ✅ | 使用本地餐厅数据 |
| 权重设置 | ✅ | 暂存 LocalStorage，联网后同步 |
| 多人房间 | ❌ | 需要实时连接 |
| 美食集邮 | 🔶 | 只读缓存，无法新增 |
| 发表评价 | 🔶 | 暂存本地，联网后提交 |

### 10.3 离线数据同步
- 使用 LocalStorage 作为离线缓冲区
- 网络恢复时自动触发同步 (监听 `online` 事件)
- 冲突解决: 以服务器数据为准，本地增量合并

### 10.4 PWA 增强 (Future)
- Service Worker 缓存静态资源
- 离线首页骨架屏
- 后台同步 API (Background Sync)
