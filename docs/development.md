# 开发指南

## 初始化已 clone 的仓库

推荐 Node.js 24.9.0，与项目 Volta 配置一致；最低版本为 20.9。

锁文件使用 npm 公共源，仓库不依赖内部包地址。

在目标仓库根目录执行，`my-app` 替换为实际 npm 包名。模板目录放在目标仓库之外。

macOS / Linux：

```bash
NEXTPIER_TEMPLATE_DIR="$(mktemp -d)"
git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git "$NEXTPIER_TEMPLATE_DIR"
node "$NEXTPIER_TEMPLATE_DIR/scripts/init.mjs" --project . --name my-app
npm install
```

Windows PowerShell：

```powershell
$nextpierTemplateDir = Join-Path ([System.IO.Path]::GetTempPath()) ("nextpier-" + [guid]::NewGuid())
git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git $nextpierTemplateDir
node (Join-Path $nextpierTemplateDir "scripts/init.mjs") --project . --name my-app
npm install
```

导入命令保留目标仓库的 `.git`（含历史与 remote）、现有 `LICENSE` 和 README；`.gitignore` 保留原规则并补入模板规则。其他同名文件内容一致时跳过，不一致时在写入前列出冲突，由 Agent 按实际差异合并。已有完整 NextPier 工程时直接返回，保留业务代码和包信息。

模板使用 Git 的 `main` 分支下载，Next.js 及其他依赖版本由模板的 `package.json` 和锁文件确定。导入命令只使用 Node.js 标准库，完成后在目标目录安装依赖；项目规范与技能沿用 `AGENTS.md` 和 `.agents/skills/`。

已有本地 NextPier 副本时，可直接执行 `node /path/to/nextpier/scripts/init.mjs --project . --name my-app`。

## 创建新目录

使用上述模板下载命令，把导入参数改为 `--project ./my-app --name my-app`，然后进入 `my-app` 执行 `npm install`。目标路径与 npm 包名分别指定，目录可包含空格或使用绝对路径。需要版本管理时，在新工程目录执行 `git init`。

默认开发地址为 [localhost:3900](http://localhost:3900)。直接使用仓库时，先执行 `npm install`。

交给 ChatGPT / Codex 创建项目时，使用 [建项 Prompt](ai-agent.md)，填入目录、业务目标和数据来源即可。初始化后可执行 `npm run dev`。

## 常用命令

在项目根目录执行：

| 命令                                                        | 用途                                        |
| ----------------------------------------------------------- | ------------------------------------------- |
| `npm run dev`                                               | Web 开发服务，端口 3900                     |
| `npm run build`                                             | Web 生产构建                                |
| `npm run start`                                             | 启动 Web 构建产物，默认端口 3000            |
| `npm run init:project -- --project ../my-app --name my-app` | 将当前模板导入独立的目标目录                |
| `npm run typecheck`                                         | TypeScript 检查                             |
| `npm run lint`                                              | ESLint 检查                                 |
| `npm run test:cli`                                          | Wails、Harness 升级与运行时收集测试         |
| `npm run test:desktop-template`                             | 临时 Wails 工程的 Go 测试，需要桌面编译依赖 |
| `npm run upgrade:wails`                                     | 生成桌面工程                                |
| `npm run upgrade:harness`                                   | 生成 AI 对话工程并安装依赖                  |
| `npm run harness:prepare -- --project /path/to/target`      | 为任意已有项目准备迁移包和候选工具报告      |
| `npm run test:harness-template`                             | 临时 Harness 工程的类型、Lint 与运行时测试  |

升级后增加 `desktop:doctor`、`desktop:dev`、`desktop:build`，用法见 [桌面指南](desktop.md)。ChatGPT / Codex 的执行规则以 [AGENTS.md](../AGENTS.md) 为准。

顶部全局设置入口为 `/settings/system`，可保存浅色、深色或跟随系统。Harness 升级后增加 `harness:doctor` 和 `test:harness`，对话入口为 `/harness`，管理页为 `/settings/harness`。模型、会话与插件配置见 [Browser Harness](harness.md)。

## 文件放哪里

```text
app/                  页面、layout、状态边界和 API
components/ui/        基础交互、AnimateIcons 和 Cult UI 适配组件
components/examples/  工作台与配置示例
components/build-in/  工具栏、主题切换
hooks/                通用 hooks
lib/                  数据读取、工具、校验与 provider
types/               共享类型
public/               静态资源
docs/                 建项 Prompt、开发、样式与集成文档
scripts/              模板导入、Wails 与 Harness CLI、运行时收集和测试
templates/wails/      Wails 工程模板
templates/harness/    Browser Harness 工程模板
desktop/              升级后生成的桌面工程
harness/              升级后生成的 AI 对话核心、适配器与插件
nextpier.config.json  可选功能导航开关
```

共享类型从 `types/index.ts` 导出；旧 `lib/types/` 路径保留兼容。

## 接入自己的业务

首页在 `app/page.tsx`，当前渲染 `FoundationWorkbench`。示例工作项用 React state 保存，刷新恢复初始值；搜索、筛选和表单可作为交互参考。

接入数据时，在 Server Component 里调用 `lib/` 的读取函数，再把结果传给交互组件。业务写入优先使用 Server Actions，先校验和鉴权，再写入并调用 `revalidatePath()`。React Query 留给轮询、分页和交互后的刷新。

主题由 `next-themes` 管理，服务端配置写入 `data/config.json`，可通过 `NEXTPIER_DATA_DIR` 调整目录。当前配置作用于项目或本机；多用户应用要改为按用户存储。`ExampleConfigApi` 演示接收服务端 `initialConfig` 并通过兼容 API 更新主题。

开始交付前，替换这些默认项：

| 文件                                                         | 要改的内容                           |
| ------------------------------------------------------------ | ------------------------------------ |
| `lib/metadata.ts`                                            | 名称、描述、站点地址、作者、仓库链接 |
| `components/build-in/header/`                                | 工具栏布局与 Logo                    |
| `public/logo.png`、`public/dark-logo.png`、`app/favicon.ico` | 品牌资源                             |
| `app/page.tsx`                                               | 业务首页                             |

界面遵循 [组件与样式](design-system.md)。Next.js API 以当前安装版本的 `node_modules/next/dist/docs/` 为准。

NextPier 的公开名称、GitHub About 描述与 Topics 见 [GitHub 发布](github.md)。

[文档目录](README.md)
