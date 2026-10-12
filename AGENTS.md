<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NextPier 开发规范

## 项目入口

- 技术栈：Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4。
- 编码工具使用 ChatGPT / Codex，项目规范保存在 `AGENTS.md`，项目技能保存在 `.agents/skills/`。
- 开始任务先读本文件和 `docs/README.md`；界面任务读 `docs/design-system.md`，桌面任务读 `docs/desktop.md`，Harness 任务读 `docs/harness.md`。
- 从模板创建业务项目可使用 `docs/ai-agent.md` 的 Prompt；按业务需求完成页面、数据和可选 CLI 集成。
- 已 clone 的新仓库通过模板的 `scripts/init.mjs --project` 原地初始化；模板放在目标目录外，保留目标的 `.git`、许可证和用户文件，具体命令见 `docs/development.md`。
- 保留已有工作区改动，不擅自回退、覆盖或清理用户文件。
- 默认中文 UI 和回复，文案只保留标题、标签、操作、数据、状态、权限提示和校验错误。

## 数据与类型

- 页面和 layout 默认 Server Component；在服务端直接调用 `lib/` 的读取函数，不调用自己的 HTTP API。
- 交互组件才加 `'use client'`，初始数据通过 props 传入；React Query 用于轮询、分页和交互后的刷新。
- 业务变更优先 Server Actions（`actions.ts` + `'use server'`），先 Zod 校验与鉴权，再更新数据和 `revalidatePath()`。
- Route Handler 用于外部调用、上传、回调和兼容 API；同时检查 HTTP 状态码与业务结果。
- `params`、`searchParams`、`cookies()`、`headers()` 按当前 Next.js 文档使用异步 API。
- 共享业务类型集中在 `types/`，从 `types/index.ts` 导出并用 `import type`；第三方基础组件的泛型和局部 props 可就地定义。
- 服务端文件操作使用 `NEXTPIER_DATA_DIR` 或项目 `data/`；不得把用户数据写入桌面运行时缓存。

## 基础组件

- 优先评估 AnimateIcons（`@animateicons/react/lucide/*`）和 Cult UI。本仓库提供 `AnimatedIconButton`、`AnimatedNumber`、`TextureButton`、`MinimalCard`、`HaloInput`、`HaloCard`、`HaloTabs`、`MorphPopoverContent`。
- 顶部保留全局设置入口，统一使用 `/settings/system` 和可选 `/settings/harness`，共享 `SettingsShell`；导航链接用 `AnimatedIconButton` 的 `href`，保留 Tooltip、禁用与焦点反馈。
- 图标按子路径导入，避免整库注册；图标按钮用 `AnimatedIconButton`，同时提供 `label`、Tooltip 和键盘焦点反馈。
- AnimateIcons 不支持的符号用 Lucide；静态状态图标不必强行动画。动画遵循 `prefers-reduced-motion`，禁止持续装饰动画。
- Cult UI 按源码引入并适配本项目 token、紧凑尺寸和无障碍要求；保留来源与许可证。
- shadcn/Radix 提供表单、Dialog、Select、Tabs、Tooltip、菜单、表格等基础交互。弹窗统一用 `components/ui/dialog.tsx`。
- 默认按钮 `outline`；主要提交按钮显式 `variant="default"`，工具按钮用 icon 尺寸。按钮必须有明确动作、禁用和提交状态。
- 表单使用 React Hook Form + Zod + `zodResolver`；服务端错误用 `form.setError('root', ...)`；编辑时 `form.reset()`。
- 数字输入显式解析；Input 默认 `autoComplete="off"`，登录字段可按语义覆盖；Select 在 flex/grid 内加 `w-full`。

## 基础样式

- 仅使用语义 token：`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border` 和状态颜色。
- 状态使用 `success`、`warning`、`info`、`destructive`，配合文字或符号，不只靠颜色。
- 基础圆角 6px，卡片最多 8px；禁止卡片嵌套、整页浮动卡片和无意义的大标题、副文案。
- 控件默认 32px，页面标题 20px，正文 14px，辅助文本 12px；间距遵循 4px 网格，字间距为 0。
- 数字用 `tabular-nums`；内容区域加 `min-w-0`，长文本换行或截断并提供完整内容入口。
- Web 页面保持窄屏可用；升级 Wails 后优先桌面窗口，窗口拖拽区与交互控件使用独立 CSS 类。
- 主题依赖 `next-themes` 和 CSS token；禁止在业务组件写硬编码色值或直接使用 zinc/slate 原色。

## 文件与验证

- Harness 通过 `npm run upgrade:harness` 可选接入；核心、适配器、宿主和业务插件分层，模型密钥仅在服务端使用。
- Harness 新工具同时更新注册与权限；写入、删除必须人工确认。浏览器会话和业务鉴权分别校验，追踪默认不记录载荷。
- Harness 顶部入口用拦截路由在当前页打开 shadcn Dialog，保留 `/harness` 直达，管理页为 `/settings/harness`，旧 `/harness/settings` 跳转兼容。根 layout 保留 `harness` 插槽，关闭恢复入口焦点；离开对话时取消消息流。
- Harness 参数使用 Halo Input，桌面上模型、运行限额、输出上限排在一行；保存后验证后续运行确实读取配置。能力使用 Halo Card，Agent、工具、权限和确认标记来自代码注册，默认示例无 Agent 时不得虚构。
- 能力 Popover 与卡片同宽，锚定静止的卡片外层；按实际卡片高度定位，保留碰撞处理。动画只作用于弹层，禁止跨 Portal 共享 `layoutId`，切换时只保留一个弹层并正确恢复焦点。
- 基础模板的 Harness 验证用 `npm run test:harness-template`；业务工程生成后用 `npm run test:harness`。不以演示模型结果代替真实模型或浏览器验收。

- 单个代码文件不超过 360 行；按职责拆分，不通过压缩格式达标。生成文件不手工修改。
- 不自动运行 dev、build 或桌面打包；仅在用户当轮明确要求时执行。
- 优先 `npm run typecheck`、`npm run lint`、`npm run test:cli` 和 `git diff --check`。
- 区分静态检查、运行时检查和原生打包验证；未实际运行时不得声称已验证。
- 增加组件、规范或 CLI 能力时同步更新对应 `docs/` 和 README 命令。
