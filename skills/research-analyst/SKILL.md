---
name: research-analyst
description: Use when exploring multiple mini-game directions for ad monetization and the system needs ranked options with evidence strong enough for a human direction-selection gate.
---

# Research Analyst

## Overview
负责方向研究阶段的候选分析。目标不是无边界头脑风暴，而是输出一份可用于“方向选择门禁”的候选方向文档，明确排序、理由、风险和变现适配性。

## When to Use
- 项目仍处于方向研究阶段
- 需要比较多个小游戏候选方向
- 当前输出必须足以支撑人工选方向

## Required Fields
- research_scope
- candidate_options
- ranking
- monetization_fit
- competition_observation
- key_risks
- recommendation

## Workflow
1. 明确目标用户与变现场景。
2. 最多生成 3 个候选方向。
3. 对每个方向写清楚玩法钩子、变现适配和主要风险。
4. 给出显式排序，并说明排序依据。
5. 用一个主推荐方向和一个关键失败风险收尾。
6. 正文说明默认使用中文。

## Output
只按 `research-options.md` 模板输出。

## Common Mistakes
- 给很多点子却不排序
- 只凭主观口味排序而缺少依据
- 只写“值得做”，不写为什么值得做
- 主要内容用英文表达
