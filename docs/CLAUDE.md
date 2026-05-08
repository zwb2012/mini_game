# Docs 目录

在本目录中撰写或编辑文件时，请遵循以下标准。

## 架构决策记录（`docs/architecture/`）

使用 ADR 模板: `.claude/docs/templates/architecture-decision-record.md`

**必要章节:** 标题、状态、上下文、决策、后果、ADR 依赖、引擎兼容性、覆盖的 GDD 需求

**状态生命周期:** `Proposed` → `Accepted` → `Superseded`
- 不可跳过 `Accepted` — 引用 `Proposed` 状态 ADR 的 Story 会自动阻塞
- 使用 `/architecture-decision` 通过引导流程创建 ADR

**TR Registry:** `docs/architecture/tr-registry.yaml`
- 稳定的需求 ID（例如 `TR-MOV-001`），将 GDD 需求链接到 Story
- 绝不重新编号已有 ID — 只能追加新 ID
- 由 `/architecture-review` 阶段 8 更新

**Control Manifest:** `docs/architecture/control-manifest.md`
- 平面程序员规则单: Required / Forbidden / Guardrails 按层分类
- 头部带日期戳 `Manifest Version:`
- Story 嵌入此版本号；`/story-done` 检查是否过期

**校验:** 完成一组 ADR 后运行 `/architecture-review`。

## 引擎参考（`docs/engine-reference/`）

锁定版本的引擎 API 快照。**使用任何引擎 API 之前务必在此检查**——LLM 的训练数据早于锁定版本的引擎。

当前引擎: 参见 `docs/engine-reference/godot/VERSION.md`
