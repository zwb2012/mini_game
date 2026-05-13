# ADR-[NNNN]：[Title]

## 地位

[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## 日期

[YYYY-MM-DD — when this ADR was written]

## 最后验证

[YYYY-MM-DD — 上次确认此ADR相对于当前准确的时间
发动机版本和设计。当您重新阅读并确认时更新此日期
即使没有任何改变，仍然是正确的。]

## 决策者

[Who was involved in this decision]

## 概括

[2句话：这个ADR解决了什么问题，决定了什么。写给
分层装载 - 扫描 20 个 ADR 的技能使用此来决定是否
阅读完整的决定。具体：命名系统、问题和解决方案
选择的方法。]

## 发动机兼容性

| 场地 | 价值 |
|-------|-------|
| **引擎** | [e.g. Godot 4.6 / Unity 6 / Unreal Engine 5.4] |
| **领域** | [Physics / Rendering / UI / Audio / Navigation / Animation / Networking / Core / Input / Scripting] |
| **知识风险** | [LOW — in training data / MEDIUM — near cutoff, verify / HIGH — post-cutoff, must verify] |
| **查阅参考文献** | [e.g. `docs/engine-reference/godot/modules/physics.md`, `breaking-changes.md`] |
| **使用的截止后 API** | [Specific APIs from post-cutoff engine versions this decision depends on, or "None"] |
| **需要验证** | [Concrete behaviours to test against the target engine version before shipping, or "None"] |

> **注意**：如果知识风险为“中”或“高”，则必须重新验证此 ADR
> 项目升级引擎版本。将其标记为“Superseded”并写入新的ADR。

## ADR 依赖性

| 场地 | 价值 |
|-------|-------|
| **取决于** | [ADR-NNNN (must be Accepted before this can be implemented), or "None"] |
| **启用** | [ADR-NNNN (this ADR unlocks that decision), or "None"] |
| **块** | [Epic/Story name — cannot start until this ADR is Accepted, or "None"] |
| **订购须知** | [Any sequencing constraint that isn't captured above] |

## 语境

### 问题陈述

[我们要解决什么问题？为什么现在必须做出这个决定？什么是
不做决定的代价？]

### 当前状态

[How does the system work today? What is wrong with the current approach?]

### 约束条件

- [Technical constraints -- engine limitations, platform requirements]
- [Timeline constraints -- deadline pressures, dependencies]
- [Resource constraints -- team size, expertise available]
- [Compatibility requirements -- must work with existing systems]

### 要求

- [Functional requirement 1]
- [Functional requirement 2]
- [Performance requirement -- specific, measurable]
- [Scalability requirement]

## 决定

[具体的技术决策，描述得足够详细，以便某人能够
无需进一步说明即可实施。]

### 建筑学

```
[ASCII diagram showing the system architecture this decision creates.
Show components, data flow direction, and key interfaces.]
```

### 关键接口

```
[Pseudocode or language-specific interface definitions that this decision
creates. These become the contracts that implementers must respect.]
```

### 实施指南

[Specific guidance for the programmer implementing this decision.]

## 考虑的替代方案

### 替代方案 1：[Name]

- **描述**：[How this approach would work]
- **优点**：[What is good about this approach]
- **缺点**：[What is bad about this approach]
- **估计工作量**：[Relative effort compared to chosen approach]
- **拒绝原因**：[Why this was not chosen]

### 替代方案 2：[Name]

[Same structure as above]

## 结果

### 积极的

- [Good outcomes of this decision]

### 消极的

- [Trade-offs and costs we are accepting]

### 中性的

- [Changes that are neither good nor bad, just different]

## 风险

| 风险 | 可能性 | 影响 | 减轻 |
|------|------------|--------|-----------|

## 性能影响

| 公制 | 前 | 预计之后 | 预算 |
|--------|--------|---------------|--------|
| CPU（帧时间） | [X]毫秒 | [Y]毫秒 | [Z]毫秒 |
| 记忆 | [X]MB | [Y]MB | [Z]MB |
| 加载时间 | [X]s | [Y]s | [Z]s |
| 网络（如果适用） | [X]KB/s | [Y]KB/s | [Z]KB/s |

## 迁移计划

[If this changes existing systems, the step-by-step plan to migrate.]

1. [Step 1 -- what changes, what breaks, how to verify]
2. [Step 2]
3. [Step 3]

**回滚计划**：[How to revert if this decision proves wrong]

## 验证标准

[How we will know this decision was correct after implementation.]

- [ ][Measurable criterion 1]
- [ ][Measurable criterion 2]
- [ ][Performance criterion]

## 满足 GDD 要求

<!-- 本节是接下来的。每个 ADR 必须至少加上一个 GDD
     要求，或明确声明这是一个没有 GDD 的基本决定
     依赖性。可追溯性由/architecture-review审核。 -->

| 广州开发区文件 | 系统 | 要求 | 该 ADR 如何满足其要求 |
|-------------|--------|-------------|--------------------------|
| [e.g. `design/gdd/combat.md`] | [e.g. Combat] | [e.g. "Hitbox detection must resolve within 1 frame"] | [e.g. "Jolt physics collision queries run synchronously in _physics_process"] |

> 如果这是一个不直接依赖 GDD 的基本决策，请写：
> “基础 — 无 GDD 要求。 启用：[上市此 GDD 系统
> 决定解锁或限制]”

## 有关的

- [Link to related ADRs — note if supersedes, contradicts, or depends on]
- [Link to relevant code files once implemented]
