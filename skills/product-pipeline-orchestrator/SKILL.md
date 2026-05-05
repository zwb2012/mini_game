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
- `specs/projects/<slug>/project-request.md`（首次启动时）
- `specs/projects/<slug>/state.yaml`
- `specs/workflows/automation/state-machine.md`
- `specs/workflows/automation/gates.md`
- `specs/workflows/automation/rules.md`
- `specs/workflows/automation/artifact-schema.md`
- 当前项目的最新阶段产物

## Workflow
1. 若项目尚未启动，先读取 `project-request.md` 与 `state.yaml`，进入 `research_options`。
2. 读取项目状态文件中的 `stage`、`status`、`next_state` 与 `blockers`。
3. 验证当前阶段产物是否存在且符合 schema。
4. 若处于 `direction_selected`，调度 `prd-writer`。
5. 若处于 `prd_approved`，依次调度 `architecture-designer`、`solution-designer`、`uiux-designer`。
6. 若处于 `implementation`，调度 `implementation-orchestrator`，随后进入 `test-orchestrator` 与 `acceptance-checker`。
7. 若验收通过，调度 `launch-prep`。
8. 遇到方向选择、PRD 审批、提审包完成三个门禁时立即停住，并输出明确的人工确认协议。
9. 遇到 blocker、测试失败、验收失败、输入缺失或文档非中文主输出时立即停住。

## Output
总控每次运行后都应尽量输出：
- 当前项目
- 当前状态
- 下一动作
- 当前产物路径
- 是否需要人工确认

## Common Mistakes
- 不验证产物就盲目推进
- 跳过 PRD 审批门禁
- 把 orchestrator 当成写文档的人，而不是控制器
- 在文档主体不是中文时继续推进
- 到达门禁后没有给出明确的人类响应格式
