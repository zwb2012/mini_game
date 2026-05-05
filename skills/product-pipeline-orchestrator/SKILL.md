---
name: product-pipeline-orchestrator
description: Use when a game direction has entered the automated product pipeline and a single controller must advance the project across stages, enforce gates, stop conditions, and artifact validation with minimal user interruption.
---

# Product Pipeline Orchestrator

## Overview
这是单项目自动化流水线的总控入口。它不直接替代各阶段产出，而是负责识别当前状态、调用正确的叶子技能或子代理、验证产物、命中门禁时停住，并在异常情况下安全停止。

## When to Use
- 某个方向已经进入正式产品流水线
- 需要从 PRD 一路推进到提审包完成
- 用户希望低打断、少手动调用、强门禁控制

## Inputs
- `specs/projects/<slug>/state.yaml`
- `specs/workflows/automation/state-machine.md`
- `specs/workflows/automation/gates.md`
- `specs/workflows/automation/rules.md`
- `specs/workflows/automation/artifact-schema.md`
- 当前项目的最新阶段产物

## Workflow
1. 读取项目状态文件中的 `stage`、`status`、`next_state` 与 `blockers`。
2. 验证当前阶段产物是否存在且符合 schema。
3. 若处于 `direction_selected`，调度 `prd-writer`。
4. 若处于 `prd_approved`，依次调度 `architecture-designer`、`solution-designer`、`uiux-designer`。
5. 若处于 `implementation`，调度 `implementation-orchestrator`，随后进入 `test-orchestrator` 与 `acceptance-checker`。
6. 若验收通过，调度 `launch-prep`。
7. 遇到方向选择、PRD 审批、提审包完成三个门禁时立即停住。
8. 遇到 blocker、测试失败、验收失败、输入缺失或文档非中文主输出时立即停住。

## Output
- 当前项目阶段
- 下一步应调用的能力
- 命中门禁 / 阻塞 / 回退 / 完成 的结论
- 下一份必需产物路径

## Common Mistakes
- 不验证产物就盲目推进
- 跳过 PRD 审批门禁
- 把 orchestrator 当成写文档的人，而不是控制器
- 在文档主体不是中文时继续推进
