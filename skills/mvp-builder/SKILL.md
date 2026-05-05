---
name: mvp-builder
description: Use when a prototype has proven the core loop and the next step is to define the smallest launchable version with ads, instrumentation, and review constraints.
---

# MVP Builder

## Overview
把已验证的原型收敛成最小可上线版本。重点是控制范围、明确广告和埋点、满足性能和审核约束，而不是提前打磨完整产品。

## When to Use
- 原型验证信号足够好
- 当前目标是形成最小可上线版本
- 范围膨胀风险开始出现

## Required Fields
- must_have
- defer
- ad_points
- instrumentation
- performance_constraints
- review_checks

## Workflow
1. 只保留构成首发版本闭环所必需的功能。
2. 把可延后内容明确放进 `defer`。
3. 指出关键广告触点，但不过度设计广告流程。
4. 列出上线后决策所需的最小埋点。
5. 用性能和审核检查项收尾。
6. 正文说明默认使用中文。

## Output
只按 `mvp-brief.md` 模板输出。

## Common Mistakes
- 把打磨项偷偷塞进上线范围
- 把广告设计当成事后补充
- 忽略性能与审核约束
- 主要内容用英文表达
