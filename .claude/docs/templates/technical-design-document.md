# 技术设计：[System Name]

## 文档状态
- **Version**: 1.0
- **Last Updated**: [Date]
- **Author**: [Agent/Person]
- **Reviewer**: lead-programmer
- **Related ADR**: [ADR-XXXX if applicable]
- **Related Design Doc**: [实现的游戏设计文档链接]

## 引擎 API 表面

| Field | Value |
|-------|-------|
| **Engine** | [e.g. Godot 4.6 / Unity 6 / Unreal Engine 5.4] |
| **APIs Depended On** | [使用的具体类/方法/节点，按版本固定——例如 `CharacterBody3D.move_and_slide() (Godot 4.x)`] |
| **References Consulted** | [撰写前阅读过的 engine-reference 文档——例如 `docs/engine-reference/godot/modules/physics.md`] |
| **Post-Cutoff Features Used** | [使用了超出 LLM 训练截止时间的引擎版本功能，或“None”] |
| **Unverified Assumptions** | [针对目标版本尚未测试的 API 行为假设，或“None”] |
| **Engine Upgrade Risk** | [LOW / MEDIUM / HIGH — 如果引擎版本变化，该设计有多脆弱？] |

> **Rule**: 如果列出了任何 **Unverified Assumptions**，在实际引擎环境中验证这些假设前，本文档不能标记为 Accepted。

## 概览
[用 2-3 句话总结该系统做什么以及为什么存在]

## 需求
### 功能需求
- [FR-1]: [描述]
- [FR-2]: [描述]

### 非功能需求
- **Performance**: [预算——例如，“< 1ms per frame”]
- **Memory**: [预算——例如，“< 50MB at peak”]
- **Scalability**: [限制——例如，“Support up to 1000 entities”]
- **Thread Safety**: [需求]

## 架构

### 系统图
```
[展示组件和数据流的 ASCII 图]
```

### 组件拆解
| Component | Responsibility | Owns |
| --------- | -------------- | ---- |
| [Name] | [它做什么] | [它拥有哪些数据] |

### 公共 API
```
[用伪代码或目标语言写出的接口/API 定义]
```

### 数据结构
```
[关键数据结构及字段说明]
```

### 数据流
[逐步说明：在典型帧中，数据如何穿过系统]

## 实施计划

### Phase 1: [Core Functionality]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 2: [Extended Features]
- [ ] [Task 3]
- [ ] [Task 4]

### Phase 3: [Optimization/Polish]
- [ ] [Task 5]

## 依赖
| Depends On | For What |
| ---------- | -------- |
| [System] | [Reason] |

| Depended On By | For What |
| -------------- | -------- |
| [System] | [Reason] |

## 测试策略
- **Unit Tests**: [单元层面要测试什么]
- **Integration Tests**: [需要的跨系统测试]
- **Performance Tests**: [要创建的基准测试]
- **Edge Cases**: [要测试的具体场景]

## 已知限制
[该设计有意不支持什么，以及原因]

## 未来考虑
[如果需求演化，可能需要改变什么——但现在不要为此构建]
