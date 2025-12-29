# 贡献指南

感谢你对 ECNU Eat 项目的关注！欢迎提交 Issue 和 Pull Request。

## 🐛 报告问题

如果你发现了 bug 或有功能建议，请创建一个 Issue：

1. 搜索现有 Issues，避免重复
2. 使用清晰的标题描述问题
3. 提供详细的复现步骤（如适用）
4. 附上截图或错误日志（如适用）

## 🔧 提交代码

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（不增加功能，不修复 bug） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

**示例：**

```
feat(gacha): add particle effects for SSR cards

- Added confetti animation for SSR reveals
- Implemented color-coded particles based on rarity
- Optimized performance with requestAnimationFrame

Closes #123
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式风格
- 使用有意义的变量名和函数名
- 添加必要的注释（中文或英文均可）

### 测试

在提交 PR 之前，请确保：

```bash
# 类型检查通过
npm run lint

# 构建成功
npm run build
```

## 🍜 添加餐厅数据

欢迎补充 ECNU 食堂和周边餐厅数据！

1. 编辑 `src/data/restaurants.ts`
2. 按照现有格式添加新餐厅
3. 确保所有字段填写完整
4. 提交 PR 并说明添加的餐厅

### 餐厅数据模板

```typescript
{
  id: 'mh-xxx-1',              // 格式: {校区}-{位置}-{序号}
  name: '餐厅名称',
  location: getLocation('mh-north'), // 使用现有位置
  window: '窗口号',             // 可选
  cuisine: ['菜系1', '菜系2'],
  priceLevel: 2,               // 1-4
  rarity: Rarity.R,            // N/R/SR/SSR
  spicyLevel: 1,               // 0-3
  availableMeals: [MealType.LUNCH, MealType.DINNER],
  isOpen: true,
  estimatedCalories: 700,
  tags: ['特色标签'],
}
```

## 📝 文档

如果你发现文档有误或需要改进，欢迎提交 PR！

## 💬 讨论

有任何问题或想法，欢迎在 Issues 或 Discussions 中交流。

---

再次感谢你的贡献！🎉
