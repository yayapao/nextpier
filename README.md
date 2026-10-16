# NextPier

**Web first. Desktop next.**

面向工作台的 Next.js 模板。AnimateIcons、Cult UI 和紧凑样式已就位；Wails 桌面和 Browser Harness AI 对话，用 CLI 按需接上。

[English](README.en.md) · [开发指南](docs/development.md) · [桌面指南](docs/desktop.md)

## 开工

```bash
NEXTPIER_TEMPLATE_DIR="$(mktemp -d)"
git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git "$NEXTPIER_TEMPLATE_DIR"
node "$NEXTPIER_TEMPLATE_DIR/scripts/init.mjs" --project ./my-app --name my-app
cd my-app
npm install
npm run dev
```

打开 [localhost:3900](http://localhost:3900)。已 clone 新项目时，在该仓库中用 `--project .` 导入模板，保留原 `.git` 和 `LICENSE`，详见 [初始化指南](docs/development.md#初始化已-clone-的仓库)。直接使用 NextPier 仓库，先执行 `npm install`。

## 交给 ChatGPT / Codex

改掉方括号里的内容，直接发给 ChatGPT / Codex：

```text
请基于 https://github.com/yayapao/nextpier 在 [目标目录] 创建 [项目名]。
npm 包名：[小写英文，可含数字和连字符]。
业务目标：[谁使用、要完成什么]。主要流程：[列出流程]。
数据来源：[API、数据库或单用户本地持久化]。能力：[Web / Web+AI / Wails / Wails+AI]。
先检查目标目录。已有 NextPier 工程时直接继续；已 clone 但只有 .git、LICENSE、README 等文件时，在该目录初始化。
初始化时，把模板通过 git clone --depth 1 --branch main 获取到目标目录外的专用临时目录。
运行 node "[模板目录]/scripts/init.mjs" --project "[目标目录]" --name "[npm包名]"，然后在目标目录执行 npm install。
保留目标仓库的 .git、历史、remote、LICENSE 和用户文件；同名文件冲突先读取差异并合并。
先读 AGENTS.md、docs/README.md、docs/ai-agent.md 和当前安装的 Next.js 文档。
按现有组件与样式规范完成业务首页、数据读写、表单校验及加载、空、错误状态。
需要 AI 时运行 npm run upgrade:harness；需要桌面时运行 npm run upgrade:wails 并设置应用名称和 ID。
更新项目名称、metadata 和 README，运行 typecheck、lint、test:cli；接入 AI 后运行 test:harness。
直接完成实现。默认不启动 dev、不构建或打包；交付时列出命令、检查结果和待验证项。
```

完整 Prompt 与具体场景见 [ChatGPT / Codex 建项](docs/ai-agent.md)。

## 上桌面

```bash
npm run upgrade:wails -- --name MyApp --id com.example.myapp
npm run desktop:doctor
npm run desktop:dev
```

升级命令生成 `desktop/`。打包执行 `npm run desktop:build`，产物在 `desktop/build/bin/`。

桌面开发需要 Go 1.25+、Wails CLI 2.15.0 和系统编译依赖。应用运行需要 Node.js 20.9+，安装包暂未内置 Node。详见 [桌面指南](docs/desktop.md)。

## 接上 AI

```bash
npm run upgrade:harness
npm run harness:doctor
```

该命令从 [GitHub app-harness](https://github.com/yayapao/app-harness) 获取模板并安装；NextPier 不再内置 Harness 实现。可用 `--ref <tag或commit>` 固定版本，或用 `--source /path/to/app-harness` 联合开发。

顶部全局设置进入 `/settings/system`，支持浅色、深色和跟随系统。AI 对话入口在当前页打开弹窗，`/harness` 保留完整对话页；统一设置中的 `/settings/harness` 提供 Halo 运行参数、能力卡片及同宽 Agent / 工具明细，旧 `/harness/settings` 自动跳转。对话布局与 ViewAI 对齐，支持移动会话侧栏、消息滚动跟随、自动增高输入与分层关闭。默认演示模式无需 Key；接模型、换插件或存储，见 [Browser Harness](docs/harness.md)。Web 与 Wails 共用这套运行时。

## 迁移到已有项目

将 [跨项目接入 Prompt](docs/harness-integration.md) 发给 Codex，使用独立的 [GitHub app-harness](https://github.com/yayapao/app-harness) 仓库，也可指定已验证的本地 checkout。`harness-integrator` Skill 会发现和审核业务工具，完成基础 Agent、可执行流程、全局对话入口与管理页，并适配目标技术栈。

```bash
npm run harness:prepare -- --project /path/to/existing-project
```

该命令只生成外部迁移包与发现报告，目标项目的实际接入由 Codex 完成，无需先初始化为 NextPier。其他语言后端通过可部署的 Node 适配服务复用核心，详见 [跨项目接入](docs/harness-integration.md)。

## 默认取舍

- Next.js 16.2、React 19、TypeScript、Tailwind CSS 4。
- 动态图标优先 AnimateIcons，视觉组件先看 Cult UI；基础交互用 shadcn/Radix。
- 中文短文案、32px 控件、6px 基础圆角，深浅主题共用语义色。
- 服务端读初始数据，客户端处理交互；表单用 React Hook Form + Zod。
- Wails 包装本地 Next.js 服务，保留 Server Actions、Flight 和 SSE。
- AI 对话按需接入，模型、存储、业务插件可替换，写操作由用户确认。

首页放了可操作的工作台示例。工作项只保存在当前会话，接入业务时换成自己的数据。

## 继续读

[建项 Prompt](docs/ai-agent.md) · [开发指南](docs/development.md) · [组件与样式](docs/design-system.md) · [桌面指南](docs/desktop.md) · [Browser Harness](docs/harness.md) · [AGENTS.md](AGENTS.md)

组件与样式规范沿用 [Niu](https://github.com/yayapao/niu)。代码采用 [MIT](LICENSE)，Cult UI 的来源与许可证随组件保留。
