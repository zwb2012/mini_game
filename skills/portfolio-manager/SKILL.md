---
name: portfolio-manager
description: Use when a solo developer is managing multiple game ideas, candidate directions, or formal projects and needs to decide what to advance, pause, rework, observe, or kill across a shared portfolio.
---

# Portfolio Manager

## Overview
负责多个项目与候选方向的组合管理，而不是单个项目的具体实现。核心目标是控制 WIP、比较候选和正式项目的优先级，并为组合层输出“现在最该推进谁、推进到哪一步”。

## When to Use
- 同时存在多个小游戏想法、候选方向或正式项目
- 需要先处理 idea pool 和候选池，再决定是否 promote
- 每日优先级不清晰
- 需要每周做 promote、hold、reject、scale、rework、kill 决策
- 需要为多个项目分配下一步动作

## Inputs
- `portfolio/portfolio-board.md`
- `portfolio/registry.yaml`
- `portfolio/idea-pool.yaml`
- `portfolio/candidates/`
- `portfolio/candidate-score-rules.yaml`
- 各项目仓库中的最新阶段产物摘要
- 当前 WIP 限制

## Workflow
1. 按状态汇总组合层对象：`idea_pool`、`candidate_intake`、`candidate_scored`、`promoted_to_registry`、`researching`、`direction_waiting`、`active_pipeline`、`blocked`、`submission_ready`、`killed`。
2. 先处理原始想法与候选层，再执行 WIP 限制，避免太多对象同时进入高投入阶段。
3. 选择 `today-primary`、`today-secondary` 和 `today-observe` 候选或项目。
4. 将 `today-observe` 解释为当前处于观察类状态的候选或项目队列，并映射到看板中的“今日观察”。
5. 对每个优先对象输出唯一下一步动作、建议阶段和需要调用的下游能力。
6. 若证据混合，优先推荐最短验证路径，而不是继续扩范围。
7. 正文说明默认使用中文。

## Output
- 更新后的组合层摘要
- 候选与项目优先级排序
- promote / hold / reject / scale / rework / kill 建议
- 每个活跃对象的下一步动作

## Common Mistakes
- 把所有想法、候选和项目都当成同等紧急
- 在没有证据时持续给弱方向续命
- 让多个项目同时进入高投入实现阶段
- 把候选层和正式项目层混为一谈
- 用英文写主要结论和组合层判断
