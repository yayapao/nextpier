# Browser Harness

NextPier 通过 [GitHub app-harness](https://github.com/yayapao/app-harness) 接入 AI 对话。核心、适配器、业务插件参考、会话 UI、路由模板、安装器与完整 Skill 在 app-harness 维护。NextPier 保留接入命令、`features.harness` 开关、Header 入口、根布局插槽和设置导航。

## 接入

在已安装依赖的 NextPier 项目根目录执行，需要 Git 和 Node.js 20.9+：

```bash
npm run upgrade:harness
npm run harness:doctor
```

默认浅 clone GitHub app-harness 的默认分支到外部临时目录，再调用其安装器，完成后清理源码副本。生成文件、增加依赖与类型导出、启用入口，并执行 `npm install`。命令不启动服务、不调用模型、不构建。

```bash
# 固定 tag 或完整 commit，便于复现
npm run upgrade:harness -- --ref <tag或完整commit>

# 联合开发或离线接入：源码目录必须位于目标项目之外
npm run upgrade:harness -- --source /path/to/app-harness --skip-install
npm install
```

`APP_HARNESS_SOURCE=/path/to/app-harness` 可替代 `--source`，便于本地测试；它不能与 `--ref` 同时使用。正式接入使用 GitHub 版本，不把机器路径写入项目配置。

源码与源仓库的信息写入 `harness/app-harness.json`：工具包版本、Git commit、源工作区改动状态、生成内容 SHA-256 和受管路径。首次生成冲突时拒绝覆盖，文件写入失败回滚。重复执行保留已生成源码与业务修改，检查文件完整性；不自动升级已接入工程。旧 `harness/nextpier.json` 继续识别。依赖安装失败后保留工程，重新运行 `npm install` 即可。

## 入口与配置

顶部 AI 图标在当前页打开对话弹窗；`/harness` 保留完整页，`/settings/harness` 管理运行参数与 Registry 能力，旧 `/harness/settings` 跳转兼容。桌面与窄屏弹窗、输入、焦点与滚动交互由 app-harness 提供。Web 和 Wails 共用服务端运行时。

默认演示模式无需密钥。真实模型在 `.env.local` 配置，模板为 `.env.harness.example`：

```dotenv
HARNESS_MODE=openai
HARNESS_MODEL=你的模型名称
OPENAI_API_KEY=你的密钥
# 可选
OPENAI_BASE_URL=https://api.openai.com/v1
```

新工程 `harness:doctor` 使用生成的本地检查脚本，可离线检查文件、依赖与环境配置，不请求模型。旧工程可用 `node scripts/harness.mjs doctor --source /path/to/app-harness` 检查。

业务接入需替换演示工具，复用登录鉴权、数据范围和持久化存储；写操作保持人工确认。细节与验收见 [app-harness README](https://github.com/yayapao/app-harness#add-it-to-an-existing-app)。

## 验证

```bash
npm run typecheck
npm run lint
npm run test:cli
# 在临时工程验证外部接入、类型、Lint 与运行时
npm run test:harness-template
# 使用本地版本验证：APP_HARNESS_SOURCE=/path/to/app-harness npm run test:harness-template
# 已接入的业务工程
npm run test:harness
```

未接入 Harness 的模板自身不包含 runtime。实际业务工具、浏览器入口和真实模型仍须在目标工程验证。跨技术栈接入使用 [app-harness Prompt](harness-integration.md)。
