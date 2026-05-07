---
name: new-project-bootstrap
description: Use when a user wants to start from a raw game idea or an already promoted direction and the system should initialize the candidate pool or formal project state before entering the automated pipeline.
---

# New Project Bootstrap

## Overview
用一句话或一小段“想做什么类型的游戏”描述，先把想法纳入候选层，再根据结果决定是否升级为正式项目。这个入口不是直接跳进完整流水线，而是负责把状态、请求文件和组合层登记初始化到正确的层级，让总控可以继续接管。

## When to Use
- 用户只给出一个游戏类型、灵感或方向描述
- 还没有 `project-request.md` / `state.yaml`，或者候选层还没有成形
- 需要先进入候选池，或者候选已被 promote 之后要初始化正式项目
- 需要从零启动一个新想法，而不是继续已有正式项目

## Required Inputs
- game_type_or_pitch
- monetization_goal
- platform
- constraints
- optional_candidate_pool
- bootstrap_mode（`candidate_pool` 或 `formal_project`）

## Workflow
1. 从用户输入里提取游戏类型、目标平台和商业目标。
2. 生成稳定的名称、slug 与候选标识。
3. 若处于 `candidate_pool` 模式，先创建或更新候选层请求与状态文件，初始为 `idea_pool -> candidate_intake -> candidate_scored`。
4. 只有当候选已经被 `promote`，才允许切换到 `formal_project` 模式。
5. `formal_project` 模式下，创建 `specs/projects/<slug>/project-request.md` 与 `specs/projects/<slug>/state.yaml`，初始为 `promoted_to_registry -> research_options`。
6. 若组合层启用，则把想法或正式项目登记到对应的组合层事实源。
7. 输出启动结果，并提示可直接交给 `product-pipeline-orchestrator` 继续推进正式项目流。
8. 文档主体默认使用中文。

## Output
- 新项目或候选名称与 slug
- bootstrap_mode
- 请求文件路径
- 状态文件路径
- 是否已登记到组合层
- 下一步建议：候选池走 candidate_intake / candidate_scored，或正式项目走 research_options

## Common Mistakes
- 直接把一句话想法当作完整 PRD
- 候选还没完成评分就强行按正式项目推进
- 让 fresh idea 直接跳过候选层进入 `research_options`
- promote 之后没有切到正式项目的状态初始化
- 没有把候选或项目登记到组合层却希望多项目统一管理
- 主要内容用英文表达
