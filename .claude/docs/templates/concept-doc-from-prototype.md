# [Prototype Name]— 概念文件

---
**状态**：原型中的Reverse-Documented
**原型路径**：`prototypes/[name]/`
**日期**：[YYYY-MM-DD]
**创建者**：[User name]
**结果**：[Success | Partial Success | Failed | Needs More Testing]
---

> **⚠️反向文件通知**
>
> 该概念文档是在原型构建**之后**创建的。它捕捉到
> 通过原型设计发现的核心机制、学习和设计见解。
> 这是实验工作的形式化，而不是预先计划的设计。

---

## 1. 原型概述

**原始假设**：
[What question or idea was this prototype testing?]

**方法**：
[How was the prototype built? Quick and dirty? Focused on one mechanic?]

**期间**：
- 花费时间：[X hours/days]
- 复杂性：[Throwaway | Could be production-ready | Needs full rewrite]

**结果**（澄清）：
- ✅ **已验证**：[What worked and should move forward]
- ⚠️ **需要工作**：[What showed promise but needs refinement]
- ❌ **无效**：[What didn't work and should be abandoned]

---

## 2. 核心机制

**原型的作用**：
[Describe the mechanic or system that was prototyped]

**感觉如何**（用户反馈）：
- [Feeling 1 — e.g., "Satisfying", "Clunky", "Too complex"]
- [Feeling 2 — e.g., "Intuitive", "Confusing", "Needs tutorial"]
- [Feeling 3 — e.g., "Fun", "Boring", "Has potential"]

**玩家幻想**：
[What fantasy or experience does this mechanic create?]

**核心循环**（如果适用）：
```
[Action 1] → [Result 1] → [Action 2] → [Result 2] → [Repeat or Conclude]
```

**紧急行为**（无意但有趣）：
- [Behavior 1]：[What players did that wasn't planned]
- [Behavior 2]：[Unexpected strategy or interaction]

---

## 3. 什么有效

### 机械成功

✅ **[Success 1]**：[What worked well]
- **为什么**：[What made this successful]
- **保留用于生产**：[Should this be preserved?]

✅ **[Success 2]**：[What worked well]
- **为什么**：[What made this successful]
- **保留用于生产**：[Should this be preserved?]

### 技术成功

✅ **[Technical win 1]**：[What technical approach worked]
- **课程**：[What we learned]
- **可重复使用**：[Can this code/approach be used in production?]

✅ **[Technical win 2]**：[What worked]
- **课程**：[What we learned]

---

## 4.什么不起作用

### 机械故障

❌ **[Failure 1]**：[What didn't work]
- **为什么**：[Root cause]
- **可以修复吗**：[Is it salvageable or fundamentally flawed?]

❌ **[Failure 2]**：[What didn't work]
- **为什么**：[Root cause]
- **可以修复吗**：[Yes/No + how]

### 技术故障

❌ **[Technical issue 1]**：[What caused problems]
- **课程**：[What to avoid in production]

❌ **[Technical issue 2]**：[What caused problems]
- **课程**：[What to avoid]

---

## 5. 需要改进的地方

⚠️ **[Element 1]**：[What showed promise but needs work]
- **问题**：[What's wrong with it currently]
- **前进道路**：[How to improve it]
- **努力**：[Small | Medium | Large refactor]

⚠️ **[Element 2]**：[What needs refinement]
- **问题**：[Current problem]
- **前进道路**：[Improvement approach]
- **努力**：[Estimate]

---

## 6. 主要经验教训

### 设计见解

💡 **[Insight 1]**：[What we learned about game design]
- **含义**：[How this affects future work]

💡 **[Insight 2]**：[Design learning]
- **含义**：[Impact on GDD or other systems]

### 技术见解

💡 **[Insight 3]**：[Technical learning]
- **含义**：[Architecture or implementation guidance]

💡 **[Insight 4]**：[Technical learning]
- **含义**：[Future technical decisions]

### 玩家心理洞察

💡 **[Insight 5]**：[What we learned about player behavior]
- **含义**：[How this affects design philosophy]

---

## 7. 生产准备评估

**这应该成为一个完整的功能吗？**：[Yes | No | Needs More Testing | Pivot to Different Approach]

**如果是—生产要求**：
- [ ][Requirement 1 — e.g., "Rewrite for performance"]
- [ ][Requirement 2 — e.g., "Add proper UI"]
- [ ][Requirement 3 — e.g., "Design 10 more variations"]
- [ ][Requirement 4 — e.g., "Integrate with progression system"]

**预计生产工作量**：[Small | Medium | Large]
- 原型可重用性：可以保留代码的[X%]
- 从头开始的努力：[X hours/days to production-ready]

**如果不——为什么不呢？**：
- [Reason 1 — e.g., "Fun but doesn't fit game pillars"]
- [Reason 2 — e.g., "Too complex for target audience"]
- [Reason 3 — e.g., "Technically infeasible at scale"]

**如果枢轴——建议方向**：
- [Alternative approach 1]
- [Alternative approach 2]

---

## 8. 设计支柱对齐

**这与游戏支柱有何关系**（如果定义了游戏支柱）：

| 支柱 | 结盟 | 笔记 |
|--------|-----------|-------|
| [Pillar 1] | ✅ 强 / ⚠️ 弱 / ❌ 冲突 | [Explanation] |
| [Pillar 2] | ✅ 强 / ⚠️ 弱 / ❌ 冲突 | [Explanation] |
| [Pillar 3] | ✅ 强 / ⚠️ 弱 / ❌ 冲突 | [Explanation] |

**整体支持者支持**：[Does this belong in the game?]

---

## 9. 后续步骤

### 立即（如果继续）
1. **[Task 1]**：[e.g., "Create full design doc for this system"]
2. **[Task 2]**：[e.g., "Write ADR for technical approach"]
3. **[Task 3]**：[e.g., "Add to backlog for Sprint X"]

### 生产前（如果需要更多工作）
1. **[Task 1]**：[e.g., "Build second prototype testing X variation"]
2. **[Task 2]**：[e.g., "Playtest with 5+ people"]
3. **[Task 3]**：[e.g., "Investigate technical feasibility of Y"]

### 如果放弃
1. **[Task 1]**：[e.g., "Archive prototype with this document"]
2. **[Task 2]**：[e.g., "Extract reusable code/learnings"]
3. **[Task 3]**：[e.g., "Update game pillars if this changed thinking"]

---

## 10. 技术说明

**原型实现**：
- Language/Engine:[What was used]
- 架构：[How it was structured]
- 采用的快捷方式：[What was hacky or throwaway]

**可重用代码**（如果有）：
- `[file/path 1]`:[What it does, reusability]
- `[file/path 2]`:[What it does, reusability]

**技术债务**（如果转向生产）：
- [Debt 1]：[What needs rewriting]
- [Debt 2]：[What needs proper implementation]

---

## 11. 游戏测试反馈

*（如果原型经过游戏测试）*

**测试人员**：[N people, [internal/external]]

**积极反馈**：
- “[Quote 1]” —[Tester name/role]
- “[Quote 2]” —[Tester name/role]

**负面反馈**：
- “[Quote 1]” —[Tester name/role]
- “[Quote 2]” —[Tester name/role]

**建议**：
- “[Suggestion 1]” —[Tester name]
- “[Suggestion 2]” —[Tester name]

**主题**：
- [Theme 1]：[What multiple testers agreed on]
- [Theme 2]：[Common feedback]

---

## 12. 相关工作

**灵感来源**（games/mechanics这受到影响）：
- [Game 1]：[What mechanic or feeling]
- [Game 2]：[What was borrowed or adapted]

**与**不同（这是独特或不同的）：
- [Difference 1]
- [Difference 2]

**与**集成（现有游戏系统）：
- [System 1]：[How they would connect]
- [System 2]：[How they would connect]

---

## 13. 开放式问题

**设计问题**：
1. **[Question 1]**：[What's still undecided about the design?]
2. **[Question 2]**：[What needs playtesting or iteration?]

**技术问题**：
3. **[Question 3]**：[What technical unknowns remain?]
4. **[Question 4]**：[What needs feasibility testing?]

---

## 14. 附录：原型资产

**代码**：
- 地点：`prototypes/[name]/src/`
- 状态：[Archival | Partial reuse | Full reuse]

**Art/Audio** （如果有）：
- 地点：`prototypes/[name]/assets/`
- 状态：[Placeholder | Production-ready | Needs replacement]

**文档**：
- 自述文件：[Exists | Missing]
- 构建指令：[Exists | Missing]

---

## 版本历史

| 日期 | 作者 | 变化 |
|------|--------|---------|
| [Date] | 克劳德（反向文档） | 原型分析的初始概念文档 |
| [Date] | [User] | 澄清结果，添加游戏测试反馈 |

---

**最终建议**：[GO | NO-GO | PIVOT]

**理由**：[1-2 sentence summary of why]

---

*此概念文件由`/reverse-document concept prototypes/[name]`生成 *
