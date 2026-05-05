---
name: candidate-evaluator
description: Use when a project card exists and the next decision is whether the idea is strong enough to deserve a short prototype.
---

# Candidate Evaluator

## Overview
判断一个项目卡是否值得进入原型验证阶段。重点是低成本验证与淘汰不合适方向，而不是把每个有趣想法都继续往下推。

## When to Use
- 已经有项目卡
- 原型名额有限
- 当前需要做 `promote`、`hold` 或 `reject` 的判断

## Required Fields
- attraction_judgment
- development_cost_judgment
- ad_fit_judgment
- competition_risk
- decision
- prototype_direction

## Workflow
1. 用文字判断吸引力，不用打分数字。
2. 判断原型是否能落进短时间盒。
3. 判断广告是否能接入而不破坏体验。
4. 指出最大的同质化或重复性风险。
5. 用 `promote`、`hold` 或 `reject` 结束。
6. 正文说明默认使用中文。

## Output
只按 `candidate-review.md` 模板输出。

## Common Mistakes
- 只因为“看起来有趣”就推进原型
- 忽略玩法重复性
- 没有给出明确原型方向
- 主要内容用英文表达
