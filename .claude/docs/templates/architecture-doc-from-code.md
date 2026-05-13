# 美国存托凭证：[Decision Name]

---
**状态**：Reverse-Documented
**来源**：`[path to implementation code]`
**日期**：[YYYY-MM-DD]
**决策者**：[User name or "inferred from code"]
**实施状态**：[Deployed | Partial | Planned]
---

> **⚠️反向文件通知**
>
> 该架构决策记录是在实施之后**创建的
> 存在过。它掌握了当前的实施方法并阐明了理由
> 基于代码分析和用户咨询。某些上下文可能会被重建
> 而不是同时记录。

---

## 语境

**问题陈述**：[What problem did this implementation solve?]

**背景**（从代码推断）：
- [Context 1 — why this problem needed solving]
- [Context 2 — constraints at the time]
- [Context 3 — alternatives that were likely considered]

**系统范围**：[What parts of the codebase does this affect?]

**利益相关者**：
- [Role 1]：[Their concern or requirement]
- [Role 2]：[Their concern or requirement]

---

## 决定

**采取的方法**（已实施）：

[Describe the architectural approach found in the code]

**关键实施细节**：
- [Detail 1]：[How it works]
- [Detail 2]：[Pattern or structure used]
- [Detail 3]：[Notable design choice]

**澄清的理由**（来自用户）：
- [Reason 1 — why this approach was chosen]
- [Reason 2 — what problem it solves]
- [Reason 3 — what benefit it provides]

**代码位置**：
- `[file/path 1]`:[What's there]
- `[file/path 2]`:[What's there]

---

## 考虑的替代方案

*（这些可以由用户推断或澄清）*

### 替代方案 1：[Approach Name]

**描述**：[What this alternative would have been]

**优点**：
- ✅ [Advantage 1]
- ✅ [Advantage 2]

**缺点**：
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**为什么不选择**：[Reason — from user clarification or inference]

### 替代方案 2：[Approach Name]

**描述**：[What this alternative would have been]

**优点**：
- ✅ [Advantage 1]
- ✅ [Advantage 2]

**缺点**：
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**为什么不选择**：[Reason]

### 替代方案 3：[Status Quo / No Change]

**描述**：[What "doing nothing" would mean]

**为什么不可接受**：[Why the problem needed solving]

---

## 结果

### 积极的后果（实现的好处）

✅ **[Benefit 1]**：[How the implementation provides this]

✅ **[Benefit 2]**：[Impact]

✅ **[Benefit 3]**：[Impact]

### 负面后果（权衡Accepted）

⚠️ **[Trade-off 1]**：[What was sacrificed or made harder]

⚠️ **[Trade-off 2]**：[Limitation or cost]

⚠️ **[Trade-off 3]**：[Complexity or maintenance burden]

### 中性后果（观察）

ℹ️ **[Observation 1]**：[Emergent property or side effect]

ℹ️ **[Observation 2]**：[Unexpected outcome]

---

## 实施说明

**使用的模式**：
- [Pattern 1]：[Where and why]
- [Pattern 2]：[Where and why]

**引入的依赖**：
- [Dependency 1]：[Why needed]
- [Dependency 2]：[Why needed]

**性能特点**：
- 时间复杂度：[O(n), etc.]
- 空间复杂度：[Memory usage]
- 瓶颈：[Known performance concerns]

**线程安全**：
- [Thread safety approach — single-threaded, mutex-protected, lock-free, etc.]

**测试策略**：
- [How this is tested — unit tests, integration tests, etc.]
- 覆盖范围：[Estimated or measured]

---

## 验证

**我们如何知道这是有效的**：
- ✅ [Evidence 1 — e.g., "6 months in production without issues"]
- ✅ [Evidence 2 — e.g., "handles 10k entities at 60 FPS"]
- ⚠️ [Evidence 3 — e.g., "works but needs monitoring"]

**已知问题**（分析过程中发现）：
- ⚠️ [Issue 1]：[Problem and potential fix]
- ⚠️ [Issue 2]：[Problem and potential fix]

**风险**：
- [Risk 1]：[Potential problem if X happens]
- [Risk 2]：[Scalability concern]

---

## 开放性问题

**反向文档期间未解决**：
1. **[Question 1]**：[What's unclear about the decision or implementation?]
   - 需要来自[Who]的澄清
   - 如果未解决，影响：[Consequence]

2. **[Question 2]**：[What needs to be decided for future work?]

---

## 后续工作

**即时**：
- [ ][Task 1 — e.g., "Add missing unit tests"]
- [ ][Task 2 — e.g., "Document edge case handling"]

**短期**：
- [ ][Task 3 — e.g., "Refactor X for clarity"]
- [ ][Task 4 — e.g., "Add performance monitoring"]

**长期**：
- [ ][Task 5 — e.g., "Revisit decision when Y is available"]

---

## 相关决定

**取决于**（此基础上的 ADR）：
- [ADR-XXX]：[Related decision]

**影响**（受此影响的 ADR）：
- [ADR-YYY]：[How this impacts it]

**取代**：
- [ADR-ZZZ]：[Old decision this replaces, if any]

**Superseded作者**：
- [None yet | ADR-WWW if this decision is later replaced]

---

## 参考

**代码位置**：
- `[path/file 1]`:[Primary implementation]
- `[path/file 2]`:[Related code]

**外部资源**：
- [Article/Book]：[Relevant pattern or technique reference]
- [Documentation]：[Engine or library docs consulted]

**设计文件**：
- [GDD Section]：[If this implements a design]

---

## 版本历史

| 日期 | 作者 | 变化 |
|------|--------|---------|
| [Date] | 克劳德（反向文档） | 来自`[source path]`的初始反向文档 |
| [Date] | [User] | 澄清了[X]的理由 |

---

## 状态图例

- **Proposed**：正在讨论中，未实施
- **Accepted**：已决定，正在实施
- **Deprecated**：不再推荐使用No，但可能存在于代码中
- **Superseded**：被另一个决定取代
- **Reverse-Documented**：实施后创建（本文档）

---

**当前状态**：**Reverse-Documented**

---

*此 ADR 由`/reverse-document architecture [path]`生成 *

---

## 附录：代码片段

**关键实施模式**：

```[language]
[Code snippet showing the core pattern or decision]
```

**理由**：[Why this code structure embodies the decision]

**替代方法**（未选择）：

```[language]
[Code snippet showing what the alternative would look like]
```

**为什么不**：[Why the implemented approach was preferred]
