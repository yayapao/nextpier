# 组件与样式

沿用 Niu 的紧凑工作台布局：标题与操作同一行，内容直接展开，数据留在视线里。Web 保持窄屏可用，桌面窗口尺寸见 [桌面指南](desktop.md)。

## 先选组件

| 场景                           | 首选                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| 动态图标、图标按钮             | AnimateIcons、`AnimatedIconButton`                              |
| 数值变化、纹理按钮、条目卡片   | Cult UI 适配版 `AnimatedNumber`、`TextureButton`、`MinimalCard` |
| 参数、能力卡片、模式与明细   | `HaloInput`、`HaloCard`、`HaloTabs`、`MorphPopoverContent`        |
| 表单、弹窗、菜单、选择器、表格 | `components/ui/` 中的 shadcn/Radix 组件                         |
| 静态符号、缺少动态图标         | Lucide                                                          |

Cult UI 组件按源码放在 `components/ui/`，来源和许可证见 `cult-ui.LICENSE`。新增组件先查 [Cult UI](https://www.cult-ui.com)，再适配本地 token、尺寸和无障碍行为。合并样式统一用 `lib/utils.ts` 的 `cn`。

## 用语义色

颜色定义在 `app/globals.css`，业务组件使用对应的 Tailwind 类。

| 用途                   | 类名                                                            |
| ---------------------- | --------------------------------------------------------------- |
| 页面                   | `bg-background text-foreground`                                 |
| 条目、弹窗             | `bg-card`、`bg-popover`                                         |
| 辅助文字               | `text-muted-foreground`                                         |
| 边框、输入、焦点       | `border-border`、`border-input`、`ring-ring`                    |
| 成功、警告、信息、错误 | `text-success`、`text-warning`、`text-info`、`text-destructive` |
| 选中状态               | `text-control-active`                                           |
| 图表                   | `chart-1` 至 `chart-5`                                          |
| 侧栏                   | `bg-sidebar`、`bg-sidebar-accent`                               |

深浅主题各有一套状态色和图表色。状态还要带文字或符号，组件里不写硬编码色值。

## 尺寸有默认值

| 项目                     | 默认值                                            |
| ------------------------ | ------------------------------------------------- |
| 工具栏                   | 48px                                              |
| Input、Button、Select    | 32px；按钮另有 24/28/36px 和对应 icon 尺寸        |
| 基础圆角                 | 6px；普通卡片最多 8px                             |
| 页面标题、正文、辅助文字 | 20px / 14px / 12px                                |
| 间距                     | 4px 网格，常用 8/12/16/24px                       |
| 字间距                   | 0                                                 |
| 字体                     | 本机中文系统字体；数字用 `font-mono tabular-nums` |

页面标题用 `page-heading`。内容区域加 `min-w-0`，长文本换行或截断并提供完整内容入口；表格可独立横向滚动。

卡片用于重复条目或需要独立边框的工具，避免嵌套。弹窗统一用 shadcn Dialog，宽度可选 `sm:max-w-125`、`sm:max-w-180`、`sm:max-w-275`。

## Harness 交互

顶部对话入口在当前业务页打开 Dialog；直接访问 `/harness` 使用完整页面。对话弹窗采用受视口约束的固定高度，消息区独立滚动，输入区保持可见；嵌套确认、运行记录和能力明细继续使用 Radix 的焦点与关闭管理。关闭后恢复到顶部入口，管理按钮进入 `/settings/harness`。

管理页参数用 Halo Input，桌面布局将模型、运行限额、单轮输出上限排在一行，窄屏按字段换行。已注册能力用 Halo Card 展示标题与描述，点击后用 Agent / 工具 Halo Tabs 查看对应明细、权限及确认标记。保存使用 Texture Button，恢复与关闭使用动态图标按钮。

Popover 通过 `--radix-popover-trigger-width` 跟随卡片宽度，外层作为稳定锚点，打开时读取卡片实际高度用于顶部对齐。面板由 Radix 定位和避让，Motion 仅执行局部入场动画；不得将卡片和弹层通过跨 Portal 的共享 `layoutId` 连接，也不延迟卸载旧面板。连续切换时只保留一个弹层，Escape、外部点击和关闭按钮均可关闭；减少动态效果时无入场位移。

## 全局设置

顶部齿轮始终进入 `/settings/system`；启用 Harness 后，`SettingsShell` 增加 `/settings/harness`。设置导航使用普通链接和 `aria-current`，桌面侧栏、窄屏换行；两个页面共享布局，保留返回工作台入口。

常规设置用 Halo 视觉的分段单选选择浅色、深色或跟随系统，保留 RadioGroup 的键盘与单选语义，通过 Server Action 校验和保存至 `NEXTPIER_DATA_DIR/config.json`，未配置时为 `data/config.json`。保存成功后更新 `next-themes`；恢复按钮只撤销未保存修改。该文件是宿主配置，多用户应用应接入自己的鉴权和偏好存储。

Halo Tabs 沿用 Niu / Cult UI 的活动项光晕，使用当前 Radix 的键盘导航和状态。Motion 的活动指示器限制在同一 Tabs 内，减少动态效果时无过渡；不替换基础 `Tabs`，也不增加 Base UI 依赖。

## 动画跟着操作走

```tsx
'use client';

import { RefreshCwIcon } from '@animateicons/react/lucide/refresh-cw-icon';
import { AnimatedIconButton } from '@/components/ui/animated-icon-button';

export function RefreshButton() {
  return (
    <AnimatedIconButton
      icon={RefreshCwIcon}
      label="刷新"
      onClick={() => window.location.reload()}
    />
  );
}
```

图标按子路径导入。`AnimatedIconButton` 在 hover/focus 时启动动画，在 leave/blur 时停止；`label` 同时提供无障碍名称和 Tooltip。提交中通过 `disabled` 禁用。

导航按钮通过 `href` 渲染 Next.js Link，可用 `scroll={false}` 保持背景滚动位置。禁用链接设置 `aria-disabled`、移出 Tab 顺序并阻止导航；命令按钮继续使用原生 `disabled`。

根 layout 已配置 `TooltipProvider` 和 `MotionConfig reducedMotion="user"`。动态图标、动态数字和全局 CSS 都遵循减少动态效果设置。

## 表单与状态

普通按钮默认 `outline`，主要提交显式用 `variant="default"`。`TextureButton` 的主要按钮使用 `variant="primary"`。

表单用 React Hook Form + Zod，配合 `FormField`、`FormItem`、`FormLabel`、`FormControl`、`FormMessage`。服务端错误写入 `form.setError('root', ...)`，提交按钮绑定 `form.formState.isSubmitting`。

Input 默认 `autoComplete="off"`，登录字段可按语义覆盖。数字输入显式解析；Select 在 flex/grid 内加 `w-full`。`Badge` 支持 `success`、`warning`、`info` 和 `destructive`。

完整交互示例见 `components/examples/foundation-workbench.tsx`，包括搜索、筛选、创建、完成、删除和表单校验。

[开发指南](development.md) · [文档目录](README.md)
