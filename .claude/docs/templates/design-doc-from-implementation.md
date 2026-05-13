# [System Name] — 设计文档

---
**状态**：Reverse-Documented
**来源**：`[path to implementation code]`
**日期**：[YYYY-MM-DD]
**验证者**：[User name or "pending review"]
**实施状态**：[Fully implemented | Partially implemented | Needs extension]
---

> **⚠️反向文件通知**
>
> 该设计文档是在实现已经存在之后**创建的。
> 它捕获当前行为并基于代码分析阐明设计意图
> 以及用户咨询。某些部分可能不完整，具体实施情况
> 逆向工程期间部分或设计意图不清楚。

---

## 1. 概述

**目的**：[What problem does this system solve?]

**范围**：[What is included/excluded from this system?]

**当前实施**：[Brief description of what exists in code]

**设计意图**（澄清）：
- [Intent 1 — why this feature exists]
- [Intent 2 — what player experience it creates]
- [Intent 3 — how it fits into overall game pillars]

---

## 2、详细设计

### 2.1 核心机制

[Describe the mechanics as implemented, organized clearly]

**[Mechanic 1 Name]**：
- **描述**：[What it does]
- **实施**：[How it works in code]
- **设计原理**：[Why it exists — from user clarification]
- **面向玩家**：[How players experience this]

**[Mechanic 2 Name]**：
- **描述**：[What it does]
- **实施**：[How it works]
- **设计原理**：[Why it exists]
- **面向玩家**：[Player experience]

### 2.2 规则和公式

**代码中发现的公式**：

| 公式 | 表达 | 目的 | 已验证？ |
|---------|-----------|---------|-----------|
| [Formula 1] | `[mathematical expression]` | [What it calculates] | ✅ / ⚠️ 需要调整 |
| [Formula 2] | `[expression]` | [Purpose] | ✅ / ⚠️ 需要调整 |

**澄清**：
- [Formula X]：最初是[value/approach]，用户澄清的意图是[corrected intent]
- [Formula Y]: 实现与[X]一样，但应该是[Y]— 标记为更新

### 2.3 状态和数据

**数据结构**（来自代码）：
- [Data structure 1]:`[fields/properties]`
- [Data structure 2]:`[fields/properties]`

**状态机**（如果适用）：
```
[State diagram or list of states and transitions]
```

**坚持**：
- 已保存：[What is saved to player save file]
- 未保存：[What is session-only or recalculated]

### 2.4 集成点

**依赖关系**（依赖的系统）：
- [System 1]：[What it provides]
- [System 2]：[What it provides]

**依赖者**（依赖于此的系统）：
- [System 3]：[How it uses this system]
- [System 4]：[How it uses this system]

**API Surface**（公共接口）：
- [Method/Function 1]：[Purpose]
- [Method/Function 2]：[Purpose]

---

## 3. 边缘情况

**在代码中处理**：
- ✅ [Edge case 1]：[How it's handled]
- ✅ [Edge case 2]：[How it's handled]

**尚未处理**（分析过程中发现）：
- ⚠️ [Edge case 3]：[What happens? Needs implementation]
- ⚠️ [Edge case 4]：[What happens? Needs implementation]

**不清楚**（需要用户澄清）：
- ❓ [Edge case 5]：[What should happen? Pending decision]

---

## 4. 依赖关系

**技术依赖性**：
- [Dependency 1]：[Why needed]
- [Dependency 2]：[Why needed]

**设计依赖关系**（其他设计文档）：
- [System X Design]：[How they interact]
- [System Y Design]：[How they interact]

**内容依赖性**：
- [Asset type]：[What's needed]
- [Data files]：[Required config/balance data]

---

## 5. 平衡与调音

**当前值**（已实施）：

| 范围 | 当前值 | 基本原理 | 需要调整吗？ |
|-----------|--------------|-----------|---------------|
| [Param 1] | [value] | [Why this value] | ✅ / ⚠️ / ❌ |
| [Param 2] | [value] | [Why this value] | ✅ / ⚠️ / ❌ |

**确定的平衡问题**：
- ⚠️ [Concern 1]：[What's wrong, suggested fix]
- ⚠️ [Concern 2]：[What's wrong, suggested fix]

**推荐平衡Pass**：
- 在[specific aspect]上运行`/balance-check`
- 重点关注[specific scenario]的游戏测试

---

## 6. 验收标准

**存在什么**（已实施）：
- ✅ [Criterion 1]
- ✅ [Criterion 2]
- ⚠️ [Criterion 3]— 部分实现

**缺少什么**（尚未实施）：
- ❌ [Criterion 4]— 标记为未来工作
- ❌ [Criterion 5]— 标记为未来工作

**完成的定义**（这个系统什么时候“完成”？）：
- [ ][Requirement 1]
- [ ][Requirement 2]
- [ ][Requirement 3]

---

## 7. 开放性问题和后续工作

### 需要用户决定的问题
1. **[Question 1]**：[What needs to be decided?]
   - 选项 A：[Approach A]
   - 选项 B：[Approach B]

2. **[Question 2]**：[What needs to be decided?]

### 标记的后续工作
- [ ] **更新[Formula X]**：从指数变为线性（根据用户说明）
- [ ] **实现[Edge Case Y]**：处理当前代码中没有的场景
- [ ] **创建 ADR**：记录选择[architectural decision]的原因
- [ ] **平衡传递**：在进度曲线上运行`/balance-check`
- [ ] **扩展设计文档**：当实现[related feature]时，更新此文档

---

## 8. 版本历史

| 日期 | 作者 | 变化 |
|------|--------|---------|
| [Date] | 克劳德（反向文档） | 来自`[source path]`的初始反向文档 |
| [Date] | [User] | 澄清设计意图，更正[X] |

---

**后续步骤**：
1. [Priority 1 task based on gaps identified]
2. [Priority 2 task]
3. [Priority 3 task]

**相关技能**：
- `/balance-check`— 验证公式和等级数
- `/architecture-decision`— 记录技术决策
- `/code-review`—确保代码与明确的设计相匹配

---

*本文档由`/reverse-document design [path]`生成 *
