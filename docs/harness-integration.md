# 将 Harness 接入已有项目

将下面的 Prompt 交给能读取源模板和目标项目的 Codex。它会按目标技术栈发现业务工具、适配宿主、开发基础 Agent 与流程，并生成全局对话框和 Harness 管理页。目标无需先初始化成 NextPier。

## 直接使用的 Prompt

只需替换源模板与目标项目路径；有明确业务场景时一并提供。

```text
请将 NextPier 的 Browser Harness 接入以下已有项目并直接完成实现。

NextPier 源模板：[NextPier 本地绝对路径]
目标项目：[目标项目绝对路径]
业务场景：[可选；为空时从项目现有业务里选择一个真实的只读闭环]
模型配置：[可选；优先复用目标项目现有服务端模型配置]

先读取源模板的 .agents/skills/harness-integrator/SKILL.md，按该 Skill 完成全过程。
读取目标项目规范并保留其技术栈、鉴权、数据库、路由和用户改动。
通过源模板的 scripts/harness.mjs prepare --project 准备迁移包与工具发现报告。
审核现有服务、API 和数据契约，开发真实业务工具、一个基础 Agent 和一个可执行流程，
接入全局对话框入口及 Harness 管理页面，能力列表来自实际注册结果。
参数保存必须影响后续运行，写操作经权限检查和人工确认。
更新目标项目的 docs/harness-integration.md 与运行说明，完成允许的静态和运行时测试。
不要只给方案，不用演示能力冒充业务功能；默认不启动 dev、不 build、不打包。
区分已完成、实际检查结果和缺少配置或环境的具体未验证项。
```

本机使用源模板 `/Users/yango/github/agents/nextpier` 时，第一项填写该路径即可。不在同一台机器上时，可让 Codex 先在目标之外通过 `git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git` 获取源码，再读取 Skill；这不会覆盖目标项目。

## 准备命令

也可先准备后交给另一个 Codex 会话：

```bash
node /path/to/nextpier/scripts/harness.mjs prepare --project /path/to/target
```

在 NextPier 根目录执行的等价命令：

```bash
npm run harness:prepare -- --project /path/to/target
```

默认输出到专用临时目录，也可用 `--output /path/to/new-kit` 指定一个尚不存在的目录。迁移包必须位于目标项目与源模板之外；已存在的输出目录拒绝覆盖。准备命令只读取目标项目，不安装依赖、不运行工具、不启动服务。

| 输出           | 内容                                                   |
| -------------- | ------------------------------------------------------ |
| INTEGRATE.md   | 接入任务，可直接交给 Codex                             |
| manifest.json  | 源码分层、依赖参考、文件 SHA-256                       |
| discovery.json | 技术栈建议、源码位置、候选符号、OpenAPI 操作与扫描缺项 |
| source/        | Harness 源码、UI 依赖、许可证及 Skill                  |

有完整迁移包时，给 Codex 这一段即可：

```text
请读取 [迁移包绝对路径]/INTEGRATE.md，在其中指定的项目里完成 Harness 接入。
按包内 harness-integrator Skill 发现和审核真实业务工具，完成基础 Agent、流程、全局对话框与管理页。
保留现有工程和用户改动，完成允许的验证并说明未验证项，默认不启动 dev/build 或打包。
```

Node.js 20.9+ 可准备迁移包。源模板安装过 npm 依赖时，使用 TypeScript AST 发现 JS/TS 导出函数；未安装时仍提供文件与 JSON OpenAPI 清单，Codex 继续源码发现。默认扫描上限为 5000 个目录条目、单文件 256 KiB，报告明确列出截断和跳过项。其他语言、类方法、重导出和 YAML OpenAPI 由 Agent 补查。

## 支持方式

Next.js App Router 可复用宿主页面、Actions、SSE 和拦截路由；React 与其他 Router 适配通信层和导航；Vue、Svelte 等沿用自己的组件体系。Python、Go、Java 等后端通过部署可用的 Node 适配服务复用核心，工具调用现有授权业务接口。并非所有项目都能原样复制 Next.js 页面；宿主与部署限制必须在接入记录中说明。

准备命令不直接运行 `upgrade:harness`，也不修改目标 package.json、锁文件、全局设置或 AGENTS.md。实际合并由 Codex 按 Skill 完成。已有 Harness 时走增量合并，重复使用同一 Prompt 不重置业务插件或权限。

候选工具的 permissionHint 是线索，不是授权。Agent 必须检查真实副作用与鉴权后再注册；模型工具列表只包含已审核能力。基础 Agent 必须执行真实业务流程，管理页显示实际 Registry 投影。宿主适配与验收要求见 [Skill](../.agents/skills/harness-integrator/SKILL.md)。

## 检查

维护准备工具时执行：

```bash
npm run test:cli
npm run typecheck
npm run lint
git diff --check
```

CLI 测试覆盖跨项目扫描、源文件打包、只读目标、输出冲突、路径边界、符号链接和失败清理。目标项目的具体接入还要验证实际服务包装、Agent 与流程、身份、确认、流停止、参数生效和浏览器入口；迁移包准备成功不代表目标应用已经完成。

[Browser Harness](harness.md) · [建项 Prompt](ai-agent.md) · [文档目录](README.md)
