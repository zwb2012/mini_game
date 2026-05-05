---
name: prototype-planner
description: Use when a candidate is approved for validation and the next step is to define the smallest prototype that can confirm or reject the core gameplay loop.
---

# Prototype Planner

## Overview
把候选方向压缩成最小可验证原型。目标不是做完整产品，而是在短时间内验证核心玩法是否成立。

## When to Use
- 候选方向已被推进
- 当前有原型名额
- 需要验证核心循环是否成立

## Required Fields
- validation_goal
- core_hypothesis
- out_of_scope
- core_loop
- time_box
- success_signals
- failure_signals

## Workflow
1. 定义这个原型只回答哪一个核心问题。
2. 去掉所有不能帮助回答这个问题的内容。
3. 用几个简洁步骤描述核心循环。
4. 锁定 3 到 7 天时间盒。
5. 明确成功信号和失败信号。
6. 正文说明默认使用中文。

## Output
只按 `prototype-plan.md` 模板输出。

## Common Mistakes
- 把“验证”做成“内容生产”
- 让 UI 打磨抢占验证范围
- 使用“感觉还不错”这类模糊信号
- 主要内容用英文表达
