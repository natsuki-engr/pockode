# Web AGENTS.md

React 前端的 AI 编程助手指南。

## 技术栈

- React 19 + TypeScript
- Vite 7（构建工具）
- Tailwind CSS 4（样式）
- Biome（Linter + Formatter）

## 命令

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建
npm run build

# 类型检查 + 构建
tsc -b && npm run build

# Lint 检查
npm run lint

# 格式化
npm run format

# 预览构建结果
npm run preview
```

## 项目结构

```
web/
├── src/
│   ├── main.tsx      # 入口
│   ├── App.tsx       # 根组件
│   └── index.css     # Tailwind 导入
├── index.html        # HTML 模板
├── vite.config.ts    # Vite 配置
├── biome.json        # Biome 配置
├── tsconfig.json     # TypeScript 配置
├── package.json
├── AGENTS.md         # AI 助手规范（本文件）
└── CLAUDE.md         # Claude Code 入口
```

## 代码风格

### Biome 配置

- 缩进：Tab
- 引号：双引号
- 分号：必须
- 自动整理 import

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `ChatPanel.tsx` |
| Hook | camelCase + use 前缀 | `useWebSocket.ts` |
| 工具函数 | camelCase | `formatMessage.ts` |
| 类型/接口 | PascalCase | `Message`, `ChatProps` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |

### 组件模式

```tsx
// ✅ 函数组件 + 类型定义
interface Props {
  title: string;
  onClose: () => void;
}

function Dialog({ title, onClose }: Props) {
  return (
    <div className="p-4">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default Dialog;
```

```tsx
// ❌ 避免：类组件、any 类型、内联样式
class Dialog extends React.Component<any> { ... }
```

### Tailwind 使用

- 优先使用 Tailwind 类，避免自定义 CSS
- 响应式设计使用 `sm:`, `md:`, `lg:` 前缀
- 深色模式使用 `dark:` 前缀（如需要）

## 测试

（待添加 Vitest 配置）

## 边界

### Always Do

- 运行 `npm run lint` 确认无错误
- 运行 `npm run build` 确认构建成功
- 使用 TypeScript 严格模式
- 组件使用函数式写法
- Props 必须定义类型

### Ask First

- 添加新的 npm 依赖
- 修改 Vite 或 TypeScript 配置
- 创建新的全局状态管理
- 修改路由结构

### Never Do

- 使用 `any` 类型（用 `unknown` 或具体类型）
- 使用 `!` 非空断言（用条件检查）
- 直接编辑 `package-lock.json`（使用 `npm install`）
- 在组件中硬编码 API 地址
- 提交 `console.log` 调试代码
