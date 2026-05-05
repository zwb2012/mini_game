---
name: implementation-orchestrator
description: Use when architecture, solution design, and UI/UX are ready and the next step is to coordinate implementation scope, module progress, and integration in Chinese before testing begins.
---

# Implementation Orchestrator

## Overview
协调实现阶段。目标是把当前实现范围、模块状态、关键变更和剩余工作表达清楚，为测试和回退判断提供可靠输入。

## When to Use
- 项目刚从 `uiux` 进入 `implementation`，或已经处于 `implementation`
- 编码工作已经开始或即将开始
- 当前需要一份可供测试阶段继续使用的实现状态文档

## Required Fields
- current_scope
- excluded_scope
- module_status
- key_changes
- unfinished_items

## Workflow
1. 定义本轮实现范围。
2. 明确哪些内容不在本轮范围内。
3. 清楚总结各模块状态。
4. 记录测试必须重点覆盖的关键变更。
5. 用未完成事项收尾。
6. 正文说明默认使用中文。

## Output
Write `implementation.md` using the template structure only.

## Common Mistakes
- 把实现文档写成原始提交日志
- 隐藏未完成模块
- 不说明测试需要重点关注什么
- 主要内容用英文表达
