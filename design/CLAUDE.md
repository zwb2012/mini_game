# Design 目录

在本目录中撰写或编辑文件时，请遵循以下标准。

## GDD 文件（`design/gdd/`）

每个 GDD 必须按顺序包含全部 **8 个必要章节**:
1. 概述 — 一段话总结
2. 玩家幻想 — 预期的感受和体验
3. 详细规则 — 无歧义的机制描述
4. 公式 — 所有数学公式含变量定义
5. 边界情况 — 已处理的异常情况
6. 依赖 — 列出关联的其他系统
7. 调优参数 — 标识出的可配置值
8. 验收标准 — 可测试的成功条件

**文件命名:** `[system-slug].md`（例如 `movement-system.md`、`combat-system.md`）

**系统索引:** `design/gdd/systems-index.md` — 添加新 GDD 时更新。

**设计顺序:** Foundation → Core → Feature → Presentation → Polish

**校验:** 撰写任何 GDD 后运行 `/design-review [path]`。完成一组关联 GDD 后运行 `/review-all-gdds`。

## 快速规格（`design/quick-specs/`）

用于调优变更、小机制或数值调整的轻量规格。使用 `/quick-design` 撰写。

## UX 规格（`design/ux/`）

- 逐界面规格: `design/ux/[screen-name].md`
- HUD 设计: `design/ux/hud.md`
- 交互模式库: `design/ux/interaction-patterns.md`
- 无障碍要求: `design/ux/accessibility-requirements.md`

使用 `/ux-design` 撰写。在交给 `/team-ui` 之前使用 `/ux-review` 校验。
