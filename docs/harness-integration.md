# 将 app-harness 接入已有项目

完整实现、发现工具与接入 Skill 已集中到 [app-harness](https://github.com/yayapao/app-harness)。直接复制其 [接入 Prompt](https://github.com/yayapao/app-harness/blob/main/docs/integration-prompt.md)，修改目标项目路径与业务场景后交给 Codex。目标无需先初始化为 NextPier。

也可以通过 NextPier 命令获取 app-harness 工具包：

```bash
npm run harness:prepare -- --project /path/to/target
# 固定版本或使用外部本地源码
npm run harness:prepare -- --project /path/to/target --ref <tag或完整commit>
npm run harness:prepare -- --project /path/to/target --source /path/to/app-harness
```

命令从 GitHub app-harness 获取源码，再只读扫描目标。输出含 `INTEGRATE.md`、`manifest.json`、`discovery.json`、源码参考和完整 Skill；默认放在外部临时目录，可用 `--output /path/to/new-kit` 指定尚不存在的外部目录。

将迁移包的 `INTEGRATE.md` 交给 Codex，按 app-harness Skill 完成真实业务工具、基础 Agent、可执行流程、全局弹窗、独立对话页和管理页。候选函数和权限提示只是审核线索；写操作需业务鉴权与人工确认。准备成功只代表材料齐全，实际接入与验证须在目标项目完成。

已有 NextPier 工程的一键接入见 [app-harness](harness.md)。
