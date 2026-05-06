---
name: product-pipeline-orchestrator
description: Use when a game direction has been promoted into a formal project and a single controller must advance the project across stages, enforce gates, stop conditions, and artifact validation with minimal user interruption.
---

# Product Pipeline Orchestrator

## Overview
这是正式项目流水线的总控入口。它不负责候选层整理，也不直接替代各阶段产出，而是负责识别正式项目状态、调用正确的叶子技能或子代理、验证产物、命中门禁时停住，并在异常情况下安全停止。

## When to Use
- 某个方向已经 `promoted_to_registry`，进入正式项目生命周期
- 需要从 `research_options` 一路推进到提审包完成
- 用户希望低打断、少手动调用、强门禁控制

## Inputs
- `specs/projects/<slug>/project-request.md`（正式项目启动时）
- `specs/projects/<slug>/state.yaml`
- `specs/workflows/automation/state-machine.md`
- `specs/workflows/automation/gates.md`
- `specs/workflows/automation/rules.md`
- `specs/workflows/automation/artifact-schema.md`
- 当前正式项目的最新阶段产物

## Workflow
1. 仅当项目已处于 `promoted_to_registry` 或更后续的正式项目状态时，才读取 `project-request.md` 与 `state.yaml` 并进入正式项目流。
2. 读取项目状态文件中的 `stage`、`status`、`next_state` 与 `blockers`。
3. 验证当前阶段产物是否存在且符合 schema。
4. 若处于 `research_options`，调度调研能力并等待方向选择门禁。
5. 若处于 `direction_selected`，调度 `prd-writer`。
6. 若处于 `prd_approved`，依次调度 `architecture-designer`、`solution-designer`、`uiux-designer`。
7. 若处于 `implementation`，调度 `implementation-orchestrator`，随后进入 `test-orchestrator` 与 `acceptance-checker`。
8. 若验收通过，调度 `launch-prep`。
9. 遇到方向选择、PRD 审批、提审包完成三个门禁时立即停住，并输出明确的人工确认协议。
10. 遇到 blocker、测试失败、验收失败、输入缺失或文档非中文主输出时立即停住。

## Output
总控每次运行后都应尽量输出：
- 当前正式项目
- 当前状态
- 下一动作
- 当前产物路径
- 是否需要人工确认

## Common Mistakes
- 把 orchestrator 当成候选层管理器
- 不验证产物就盲目推进
- 跳过 PRD 审批门禁
- 把 orchestrator 当成写文档的人，而不是控制器
- 在文档主体不是中文时继续推进
- 到达门禁后没有给出明确的人类响应格式
