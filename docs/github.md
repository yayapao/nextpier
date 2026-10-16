# GitHub 发布

## 名称与描述

展示名用 **NextPier**，仓库名用 `nextpier`，短句用 `Web first. Desktop next.`。

GitHub About 描述与 `package.json.description` 保持一致：

```text
Next.js workbench starter for agents with AnimateIcons, Cult UI, Wails, and app-harness AI chat.
```

中文介绍：

```text
面向 Agent 的 Next.js 工作台模板，提供 AnimateIcons、Cult UI、Wails 和 app-harness AI 对话。
```

Topics：

```text
nextjs react typescript tailwindcss wails desktop-app starter-template animateicons cult-ui shadcn-ui app-harness ai-agent
```

## 仓库地址

公开仓库：[yayapao/nextpier](https://github.com/yayapao/nextpier)。本地目录名为 `nextpier`，npm 包名同为 `nextpier`。

已有 checkout 可更新 remote：

```bash
git remote set-url origin git@github.com:yayapao/nextpier.git
```

在 About 中填写上述描述和 Topics。`README.md` 是英文主入口，`README.en.md` 提供英文镜像；两者的安装命令和 Agent Prompt 保持一致。

新桌面工程使用 `NEXTPIER_*` 与 `desktop/nextpier.json`。旧工程兼容规则见 [桌面指南](desktop.md)。

[文档目录](README.md)
