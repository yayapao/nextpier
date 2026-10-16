# 桌面指南

Wails 提供原生窗口，Next.js 在本机处理页面和数据。现有 Web 项目可以继续使用 Server Actions。

需要 AI 对话时，可叠加 [app-harness](harness.md) 的 CLI 集成；桌面代理同时支持它的 Server Actions 和 SSE 消息流。

## 一键生成工程

在已安装 npm 依赖的项目根目录执行：

```bash
npm run upgrade:wails -- --name MyApp --id com.example.myapp
```

| 参数     | 用途                                  | 默认值                       |
| -------- | ------------------------------------- | ---------------------------- |
| `--name` | 应用名，允许中文和空格                | 从 `package.json.name` 派生  |
| `--id`   | 应用 ID，至少三段，每段以小写字母开头 | `com.example.<处理后的包名>` |

正式应用填写自己的 ID，它也决定用户数据目录。

命令生成 `desktop/`，加入 `desktop:doctor`、`desktop:dev`、`desktop:build` 和 Git 忽略规则。若有 `public/logo.png`，同时复制为桌面应用图标。重复执行保留已有工程；未知 `desktop/` 或同名脚本冲突会使命令退出。该命令只生成工程，开发和打包分别执行。

## 准备环境

| 依赖      | 要求                            |
| --------- | ------------------------------- |
| Node.js   | 20.9+，项目 Volta 配置为 24.9.0 |
| Go        | 1.25+                           |
| Wails CLI | 2.15.0                          |
| macOS     | Xcode Command Line Tools        |
| Windows   | WebView2 和 Wails 所需编译环境  |
| Linux     | GTK/WebKit 开发依赖             |

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.15.0
npm run desktop:doctor
```

Go 的可执行文件目录需在 `PATH` 中，具体缺项由 `desktop:doctor` 检查。

## 开发与打包

开发窗口：

```bash
npm run desktop:dev
```

CLI 分配空闲的 `127.0.0.1` 端口，启动 Next.js HMR，等待 `/api/health` 成功后打开 Wails。命令退出时清理开发服务。

发布构建：

```bash
npm run desktop:build
# macOS 双架构客户端
npm run desktop:build -- --platform darwin/universal
```

按当前系统和架构构建，产物在 `desktop/build/bin/`；命令不会安装或启动应用。跨系统发布应在目标系统构建。

安装包暂未内置 Node.js，运行机器仍需安装兼容版本。`darwin/universal` 只生成双架构 Go 客户端；若项目引入原生 Node 依赖，需要另行为目标架构准备运行时依赖。

## 本地服务如何运行

桌面构建自动设置 `NEXTPIER_DESKTOP=1`，启用 Next.js `output: 'standalone'` 和 `images.unoptimized`。

1. 将 standalone、`.next/static`、`public` 收集为 `runtime.tar.gz`，解引用依赖链接。单个压缩包可容纳动态路由和 Turbopack 的文件名。
2. 应用启动后按包内容摘要解压到系统用户缓存，检查路径和文件类型，完成后写入标记。
3. Node 服务监听动态 `127.0.0.1` 端口。Wails 代理页面、API、Flight、Server Actions 和 SSE，退出时结束 Node 进程树。

非根 HTML 路由补充 Wails runtime 脚本，SSE/Flight 保持流式传输。代理统一受信任 Wails Origin 与 forwarded host，其他 Origin 留给 Next.js 校验。

默认窗口 1280 × 800，最小 800 × 560。`app-toolbar` 是拖拽区，`app-toolbar__interactive` 是交互区。macOS 提供原生 Edit 菜单；新增 Go 绑定时同步补齐前端类型。

## 数据留在用户目录

| 系统    | 配置目录                                              |
| ------- | ----------------------------------------------------- |
| macOS   | `~/Library/Application Support/<app-id>/`             |
| Windows | `%AppData%/<app-id>/`                                 |
| Linux   | `$XDG_CONFIG_HOME/<app-id>/` 或 `~/.config/<app-id>/` |

配置目录内的文件：

| 路径          | 内容                                  |
| ------------- | ------------------------------------- |
| `.env.local`  | 本地服务环境变量，进程环境优先        |
| `data/`       | 用户数据；由 `NEXTPIER_DATA_DIR` 指向 |
| `desktop.log` | 服务输出与启动日志                    |

运行时缓存与用户数据分开存放，重新打包不会覆盖这个目录。收集阶段排除 `.env*`、`.git` 和 standalone 顶层 `data/`；`NEXT_PUBLIC_*` 会在构建时进入前端产物，只放公开值。

指定 Node 路径时，在启动应用的进程环境中设置 `NEXTPIER_NODE`。它在读取配置目录的 `.env.local` 之前使用。macOS 还会查找 PATH、Homebrew 和 zsh 登录环境中的 Node。

新工程的标记文件为 `desktop/nextpier.json`，生成器名为 `nextpier-wails`。修改应用身份需同步标记文件、`desktop/main.go`、`desktop/wails.json` 和两个 macOS plist。修改 ID 后，数据目录也会变化，需要迁移原数据。

CLI 设置 `NEXTPIER_DEV_URL` 连接开发服务；生产服务设置 `NEXTPIER_INTERNAL_URL` 为本机 Node 地址。两者由桌面运行时管理。

## 旧工程兼容

已有 `desktop/mynextjs.json` 仍可读取，重复升级保留源码与应用 ID。Web 配置读取旧 `MYNEXTJS_DATA_DIR`，以 `NEXTPIER_DATA_DIR` 为优先。CLI 和桌面运行时保留 `MYNEXTJS_*` 别名，便于旧工程继续开发；目录更名不会改变应用 ID 或迁移用户数据。

## 改过 Next 配置

CLI 检查 `next.config.ts` 中的 `NEXTPIER_DESKTOP` 标记，也接受旧标记。重写配置时保留以下分支：

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...((process.env.NEXTPIER_DESKTOP ?? process.env.MYNEXTJS_DESKTOP) === '1'
    ? {
        output: 'standalone',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
```

运行时收集按 `.next/standalone/server.js` 结构工作。改为 monorepo 或自定义 `distDir` 时，同步调整 tracing 配置和收集路径。

## 验证

```bash
npm run test:cli
npm run test:desktop-template
```

CLI 测试覆盖生成、重复执行、新旧标记兼容、冲突和运行时收集。模板测试在临时工程执行 `go test`，检查解压、环境变量、代理和 runtime 注入；需要 Go 与系统编译依赖。

发布前另行验证实际打包产物、原生窗口和业务流程。测试通过不等于完成窗口验收。

[建项 Prompt](ai-agent.md) · [开发指南](development.md) · [文档目录](README.md)
