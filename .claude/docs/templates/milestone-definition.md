# 里程碑：[Name]

## 概览

- **Target Date**: [Date]
- **Type**: [Prototype | Vertical Slice | Alpha | Beta | Gold | Post-Launch]
- **Duration**: [N weeks]
- **Number of Sprints**: [N]

## 里程碑目标

[用 2-3 句话描述该里程碑达成什么以及为什么重要。该里程碑结束时，我们能展示或评估什么？]

## 成功标准

[具体、可衡量的标准。只有全部满足时，里程碑才算完成。]

- [ ] [Criterion 1 -- specific and testable]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] 所有 S1 和 S2 bug 已解决
- [ ] 目标硬件上性能在预算内
- [ ] 构建连续 [X] 天稳定

## 功能列表

### 必须交付（没有这些则里程碑失败）

| Feature | Design Doc | Owner | Sprint Target | Status |
|---------|-----------|-------|--------------|--------|

### 应该交付（已计划但可裁剪）

| Feature | Design Doc | Owner | Sprint Target | Cut Impact | Status |
|---------|-----------|-------|--------------|-----------|--------|

### 延展目标（仅在进度超前时）

| Feature | Design Doc | Owner | Value Add |
|---------|-----------|-------|----------|

## 质量门槛

| Gate | Threshold | Measurement Method |
|------|-----------|-------------------|
| Crash rate | < [X] per hour | Automated crash reporting |
| Frame rate | > [X] FPS on min spec | Performance profiling |
| Load time | < [X] seconds | Automated timing |
| Critical bugs | 0 open S1 | Bug tracker |
| Major bugs | < [X] open S2 | Bug tracker |
| Test coverage | > [X]% | Test framework report |

## 风险登记

| Risk | Probability | Impact | Mitigation | Owner | Status |
|------|------------|--------|-----------|-------|--------|

## 依赖

### 内部依赖

| Feature | Depends On | Owner of Dependency | Status |
|---------|-----------|-------------------|--------|

### 外部依赖

| Dependency | Provider | Status | Risk if Delayed |
|-----------|---------|--------|----------------|

## 评审日程

| Date | Review Type | Attendees |
|------|-----------|-----------|
| [Week 2] | Early progress check | Producer, Directors |
| [Midpoint] | Mid-milestone review | Full team |
| [Week N-1] | Pre-milestone review | Full team |
| [Target Date] | Milestone review | Full team |
