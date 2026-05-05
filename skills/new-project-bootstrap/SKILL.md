---
name: new-project-bootstrap
description: Use when a user wants to start a new mini-game project from a brief game-type idea and the system should initialize project request and state files before entering the automated pipeline.
---

# New Project Bootstrap

## Overview
用一句话或一小段“想做什么类型的游戏”描述，初始化一个新项目的最小起点。目标不是直接完成整条流水线，而是自动生成项目请求、状态文件和最小组合层登记，让总控入口可以立刻接管。

## When to Use
- 用户只给出一个游戏类型或方向描述
- 还没有 `project-request.md` 和 `state.yaml`
- 需要从零启动一个新项目，而不是继续已有项目

## Required Inputs
- game_type_or_pitch
- monetization_goal
- platform
- constraints
- optional_candidate_pool

## Workflow
1. 从用户输入里提取游戏类型、目标平台和商业目标。
2. 生成一个稳定的项目名称与 slug。
3. 创建 `specs/projects/<slug>/project-request.md`。
4. 创建 `specs/projects/<slug>/state.yaml`，初始为 `idea_pool -> research_options`。
5. 若组合层启用，则把项目登记到 `portfolio/projects.yaml`。
6. 输出启动结果，并提示可直接交给 `product-pipeline-orchestrator` 继续推进。
7. 文档主体默认使用中文。

## Output
- 新项目名称与 slug
- `project-request.md` 路径
- `state.yaml` 路径
- 是否已登记到组合层
- 下一步建议：进入 research_options

## Common Mistakes
- 直接把一句话想法当作完整 PRD
- 不生成状态文件就试图推进流水线
- 没有把项目登记到组合层却希望多项目统一管理
- 主要内容用英文表达
