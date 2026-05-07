---
name: candidate-scorer
description: Use when a candidate intake artifact exists and the system needs an explainable promote, hold, or reject outcome based on structured scoring rules.
---

# Candidate Scorer

## Overview
按 `portfolio/candidate-score-rules.yaml` 对候选做结构化评估，输出可解释的 `promote / hold / reject` 结论。

## When to Use
- 候选 intake 已完成
- 需要进入候选评分阶段
- 系统需要决定是否把候选送进正式项目控制平面

## Required Fields
- audience_pull
- platform_fit
- monetization_fit
- implementation_cost
- differentiation
- content_burden
- recommendation
- fatal_flags
- threshold_result
- threshold_reason
- required_rework
- human_override

## Workflow
1. 读取 `portfolio/candidate-score-rules.yaml`。
2. 按规则给每个维度写 `high / medium / low`。
3. 基于阈值规则写入 `threshold_result`、`threshold_reason`、`required_rework`、`human_override`。
4. 用可解释规则输出 `promote / hold / reject`，并把结果同步到候选评分卡。
5. 生成 `candidate-scorecard.md` 与 `candidate-scorecard.meta.yaml`。
6. 不直接写入正式项目目录；promote 只是给组合层动作建议。
7. 正文默认使用中文。

## Output
- `candidate-scorecard.md`
- `candidate-scorecard.meta.yaml`
- `threshold_result`
- `threshold_reason`
- `required_rework`
- `human_override`

## Common Mistakes
- 伪精确总分
- 不可解释的推荐结论
- 跳过规则文件直接主观打分
