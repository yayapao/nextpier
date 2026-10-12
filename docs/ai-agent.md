# ChatGPT / Codex 建项

把目标和流程写清楚，ChatGPT / Codex 就能从 NextPier 开始做业务。下方 Prompt 适用于具备文件读写和 CLI 执行能力的 ChatGPT / Codex。

## 完整 Prompt

替换方括号里的值；在已 clone 的新项目中使用时，目标目录填写当前仓库的绝对路径或 `.`。单用户本地应用可以不提供外部接口。

```text
请基于 https://github.com/yayapao/nextpier 创建并完成以下应用。

项目参数：
- 目标目录：[绝对路径或当前目录下的文件夹名]
- 项目名称：[展示名]
- npm 包名：[小写英文，可含连字符]
- 使用者和业务目标：[谁使用、要完成什么]
- 主要流程：[按操作顺序列出流程和验收条件]
- 数据来源：[已有 API/数据库及说明，或单用户本地持久化]
- 界面语言：[默认中文]
- 能力：[Web / Web+AI / Wails / Wails+AI]
- 桌面应用 ID：[使用 Wails 时填写，如 com.example.myapp]
- AI 能力：[使用 AI 时填写模型配置来源、只读工具和需确认的写操作]

执行要求：
1. 先解析目标目录的绝对路径并检查文件，再初始化。
   - 已有 NextPier 工程（package.json、nextpier.config.json 和升级脚本齐全）：直接继续。
   - 尚未初始化（包括已 clone、仅有 .git、LICENSE、README 或 .gitignore 的仓库）：
     在目标目录之外创建本次专用临时目录，通过下面的命令获取模板：
     git clone --depth 1 --branch main https://github.com/yayapao/nextpier.git "[模板目录]"
     先读取模板的 AGENTS.md、docs/README.md 和 docs/development.md，然后执行：
     node "[模板目录]/scripts/init.mjs" --project "[目标目录绝对路径]" --name "[npm包名]"
     命令原地导入模板，保留目标仓库的 .git、历史、remote、LICENSE 与 README，补齐 .gitignore。
     同名文件冲突时，读取并合并差异，保留用户内容，解决后再继续；只有无法合并时才说明阻碍。
   - 已有其他业务工程：按文件差异接入 NextPier，保留现有数据、配置和 Git 仓库。
   下载失败时记录 Git 的实际错误；有可用的本地 NextPier 副本时直接作为模板目录重试。
   在目标目录执行 npm install，版本以导入的 package.json 和 package-lock.json 为准。
2. 先读 AGENTS.md、docs/README.md、docs/development.md、docs/design-system.md，
   写 Next.js 代码前读 node_modules/next/dist/docs/ 中相关指南。
   需要 Harness 时读 docs/harness.md，需要 Wails 时读 docs/desktop.md。
3. 替换工作台示例，第一屏就是可用的业务页面。完成主要流程、校验、提交状态、
   加载、空数据和错误处理。展示真实数据；没有数据时保留空状态。
   未提供外部后端时，按单用户本地应用实现持久化并在 README 写明使用范围。
4. 沿用 Server Component 读取初始数据，交互组件接收 props。
   业务写入使用 Server Actions，先 Zod 校验并按数据源要求校验身份与权限，再写入和刷新。
   共享类型放 types/；文件数据写 NEXTPIER_DATA_DIR 或 data/，不写运行时缓存。
5. 优先评估 AnimateIcons 与 Cult UI，使用现有 AnimatedIconButton、AnimatedNumber、
   TextureButton、MinimalCard；基础交互沿用 shadcn/Radix。
   使用语义 token、紧凑控件、深浅主题与 reduced-motion，保持窄屏可用。
   文案按项目语言编写；单个代码文件不超过 360 行。
6. 按能力调用 CLI：
   - Web：直接完成业务。
   - Web+AI：运行 npm run upgrade:harness，接入业务插件、模型和存储。
   - Wails：运行 npm run upgrade:wails -- --name "[项目展示名]" --id [桌面应用ID]。
   - Wails+AI：依次执行上述两种升级。
   用生成的工程和运行时继续开发。写入和删除工具保留人工确认，业务权限在工具内校验。
   模型密钥只放服务端环境变量；提供 .env.example，真实密钥不进源码或 NEXT_PUBLIC_*。
   缺少真实模型配置时保留演示模式，并在交付结果中标明尚未验证模型连通性。
7. 更新 package.json、lib/metadata.ts、首页品牌资源和 README；
   仓库与作者填写实际信息，未知站点地址和品牌资源列为待办。
   README 写项目用途、数据来源、环境变量和运行命令。
8. 运行 npm run typecheck、npm run lint、npm run test:cli 和 git diff --check。
   已接入 Harness 时再运行 npm run test:harness。
   修改了 Wails Go 模板时运行 npm run test:desktop-template；业务 Go 代码在 desktop/ 下执行 go test ./...。
   桌面环境可用时执行 npm run desktop:doctor；缺少依赖时列出缺项。
   默认不启动 dev、不运行 build、不打包桌面应用。
9. 直接完成实现和文档。交付时给出项目路径、已完成流程、实际检查结果、启动命令，
   分开说明静态检查、运行时测试、浏览器验收和原生打包的状态。
```

## Web 工作台示例

```text
请用 https://github.com/yayapao/nextpier 创建 ./issue-desk，项目名「工单台」。
按 docs/ai-agent.md 的初始化流程操作：已有 NextPier 时直接继续；已 clone 的新仓库保留 .git 与 LICENSE，
把模板浅 clone 到目标目录外，再用模板的 scripts/init.mjs --project 导入并安装依赖。
读取 AGENTS.md、docs/ai-agent.md 与样式规范后直接实现。
这是单用户本地工作台：工单列表支持搜索和状态筛选，可新建、编辑、关闭工单，刷新后数据仍在。
字段包括标题、优先级、状态和创建时间。数据保存到 NEXTPIER_DATA_DIR 或 data/，通过 Server Actions 写入。
使用中文紧凑界面、AnimateIcons 和现有基础组件，补齐表单校验、空状态和错误反馈。
更新项目名称、metadata、README，运行 typecheck、lint、test:cli 和 git diff --check。
默认不启动 dev、不构建，最后给出项目路径、运行命令和检查结果。
```

## 接入业务 AI

已有 NextPier 工程时，可以直接追加这段：

```text
请为当前 NextPier 项目接入 Browser Harness，先读 docs/harness.md，再运行 npm run upgrade:harness。
顶部入口使用当前页对话弹窗，保留 /harness 直达；全局设置中的 /settings/harness 使用 Halo 参数、能力卡片、Halo Tabs 与同宽明细 Popover，保留旧 /harness/settings 的跳转兼容。
保留根 layout 的 harness 插槽，能力关系来自代码注册；保存配置后验证实际运行读取，界面与运行时不能脱节。
把示例插件换成工单能力：搜索和读取工单为 read，修改状态为 write，删除为 destructive。
工具调用现有业务服务，共用页面的身份与权限；写入和删除必须人工确认。
有现成持久化层时复用它保存会话；没有时说明内存会话的生命周期。
模型使用 .env.local 的服务端配置，缺少 Key 时保留 demo 模式，补齐环境变量示例。
更新 README，运行 typecheck、lint、test:cli、test:harness 和 git diff --check。
不自动启动服务，不请求真实模型。报告哪些能力已测试、哪些还需要模型或浏览器验收。
```

## 升级桌面应用

```text
请把当前 NextPier 项目升级为 Wails 应用「工单台」，ID 为 com.example.issuedesk。
先读 docs/desktop.md，再运行 npm run upgrade:wails -- --name "工单台" --id com.example.issuedesk。
检查用户文件数据经 NEXTPIER_DATA_DIR 写入配置目录，窗口拖拽区与交互区符合现有约定。
保留 Server Actions；已接入的 Harness 继续使用同一服务与 SSE。
更新 README 的桌面环境与命令，运行 typecheck、lint、test:cli 和 git diff --check。
环境具备时运行 desktop:doctor，修改业务 Go 代码时在 desktop/ 执行 go test ./...。
不自动打开原生窗口、不构建或打包。报告检查结果和待验证的原生流程。
```

应用名和 ID 按实际项目替换；正式发布使用自己的反向域名。

## 需要启动或打包时

在 Prompt 末尾明确加入对应指令：

| 目标     | 追加指令                                                                 |
| -------- | ------------------------------------------------------------------------ |
| Web 预览 | `完成后启动 npm run dev；3900 被占用时使用空闲端口，并给出 URL。`        |
| 桌面调试 | `完成后运行 npm run desktop:doctor，再用 npm run desktop:dev 打开应用。` |
| Web 构建 | `完成后执行 npm run build 并报告实际结果。`                              |
| 桌面打包 | `完成后执行 npm run desktop:build，报告产物路径与原生验收状态。`         |

这些指令授权对应操作；模型请求、部署与发布另按实际需求说明。

[开发指南](development.md) · [Browser Harness](harness.md) · [桌面指南](desktop.md) · [文档目录](README.md)
