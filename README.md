# NextPier

**给 Agent 的 Next.js 工作台起点。**

一句 Prompt 创建业务页面，一条命令接入 [app-harness](https://github.com/yayapao/app-harness)，需要桌面时再加 Wails。NextPier 把页面、数据、AI 工具和桌面能力放进一条清晰的交付路径。

[English](README.en.md) · [给 Agent 的建项 Prompt](docs/ai-agent.md) · [app-harness](https://github.com/yayapao/app-harness) · [开发指南](docs/development.md)

## 30 秒开工

```bash
NEXTPIER_TEMPLATE_DIR="$(mktemp -d)"
git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git "$NEXTPIER_TEMPLATE_DIR"
node "$NEXTPIER_TEMPLATE_DIR/scripts/init.mjs" --project ./my-app --name my-app
cd my-app
npm install
npm run dev
```

打开 [localhost:3900](http://localhost:3900)。已 clone 的仓库可以在仓库内使用 `--project .`，初始化会保留 `.git`、`LICENSE`、README 和已有业务文件。完整流程见[开发指南](docs/development.md)。

## 直接交给 ChatGPT / Codex

把方括号替换成你的项目内容：

```text
请基于 https://github.com/yayapao/nextpier 在 [目标目录] 创建 [项目名]。

使用者和目标：[谁使用、要完成什么]
主要流程：[按顺序列出流程和验收条件]
数据来源：[API、数据库或单用户本地持久化]
能力：[Web / Web+AI / Wails / Wails+AI]
npm 包名：[小写英文，可含数字和连字符]

先读取目标目录，再按 NextPier 的 AGENTS.md、docs/README.md 和当前 Next.js 文档执行。
目标为空或只有 .git、LICENSE、README 时，按 docs/development.md 在目标目录外获取模板并运行 scripts/init.mjs；已有 NextPier 或业务项目则增量处理。
保留目标仓库的 Git 历史、remote、LICENSE 和用户文件；冲突先读取差异并合并。
完成真实页面、数据读写、校验、加载、空状态和错误处理，不只生成演示壳子。
需要 AI 时运行 npm run upgrade:harness，使用 GitHub app-harness 接入业务工具、Agent、流程、对话入口和管理页。
需要桌面时运行 npm run upgrade:wails -- --name "[展示名]" --id [应用 ID]。
运行 typecheck、lint、test:cli；接入 app-harness 后再运行 test:harness。
默认不启动 dev、不 build、不打包；交付时列出已完成能力、检查结果和未验证项。
```

更多可复制 Prompt 和业务示例见[建项指南](docs/ai-agent.md)。

## Agent 能力

- 读取项目规范和 Next.js 文档，识别目标项目的技术栈与现有代码。
- 安全初始化或增量接入，保留用户仓库和业务改动。
- 使用 Server Components、Server Actions、Zod 和现有数据源完成真实业务闭环。
- 通过 app-harness 发现并审核业务工具，创建基础 Agent、可执行流程、全局对话框和管理页。
- 对写入和删除操作执行权限校验与人工确认，区分静态检查、运行时测试、浏览器验收和真实模型验证。

## 接入 app-harness

在 NextPier 项目根目录执行：

```bash
npm run upgrade:harness
npm run harness:doctor
```

命令从 [GitHub app-harness](https://github.com/yayapao/app-harness) 获取运行时、UI、安装器和 Agent Skill，并写入当前项目。需要固定版本或本地联调时：

```bash
npm run upgrade:harness -- --ref <tag或完整commit>
npm run upgrade:harness -- --source /path/to/app-harness --skip-install
```

接入后，顶部入口打开当前页对话框，`/harness` 是完整对话页，`/settings/harness` 管理模型参数、Agent、工具和权限。模型配置放在服务端环境变量；写操作必须确认。详细配置与验收见 [app-harness 文档](docs/harness.md)。

## 给已有项目接入

让 Agent 读取[跨项目接入 Prompt](docs/harness-integration.md)，或先生成迁移包：

```bash
npm run harness:prepare -- --project /path/to/existing-project
```

命令会准备 app-harness 源码、扫描报告和接入说明，目标项目由 Agent 按自身技术栈完成适配。目标项目不需要先变成 NextPier。

## 再加桌面

```bash
npm run upgrade:wails -- --name MyApp --id com.example.myapp
npm run desktop:doctor
npm run desktop:dev
```

Wails 与 Web 共用页面、Server Actions、SSE 和 app-harness 运行时。桌面环境与打包命令见[桌面指南](docs/desktop.md)。

## 默认技术选择

- Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4。
- AnimateIcons、Cult UI、shadcn/Radix，紧凑控件和语义化主题。
- Server Components 读取初始数据，Server Actions 处理业务写入。
- app-harness 提供可替换的模型、存储、工具、Agent 和流程。

## 文档

[建项 Prompt](docs/ai-agent.md) · [开发指南](docs/development.md) · [组件与样式](docs/design-system.md) · [app-harness](docs/harness.md) · [桌面指南](docs/desktop.md) · [GitHub 发布](docs/github.md)

代码采用 [MIT](LICENSE)；Cult UI 组件保留来源与许可证。
