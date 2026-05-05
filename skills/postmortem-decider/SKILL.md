---
name: postmortem-decider
description: Use when an observation or milestone is complete and the next decision must clearly say whether to promote, hold, reject, scale, rework, or kill the project.
---

# Postmortem Decider

## Overview
把阶段结论收敛成明确决策。它不是继续泛泛讨论可能性，而是基于已有证据给出下一状态，并记录是否有人为覆盖。

## When to Use
- 一个观察轮次已经结束
- 一个里程碑已经完成
- 当前需要明确项目下一状态

## Allowed Decisions
- `promote`
- `hold`
- `reject`
- `scale`
- `rework`
- `kill`

## Workflow
1. 从允许值中明确写出一个决策。
2. 写出支撑这个决策的主要证据。
3. 记录是否有人为覆盖默认结论。
4. 若有人为覆盖，记录原因与下次复核时间。
5. 正文说明默认使用中文。

## Output
只按 `decision-note.md` 模板输出。

## Common Mistakes
- 把真实决策藏在长段落里
- 建议继续投入却不写复核时间
- 把所有弱项目都默认视为可重做
- 主要内容用英文表达
