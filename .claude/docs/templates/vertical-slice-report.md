# 垂直切片报告：[Concept Name]

> **Date**: [YYYY-MM-DD]
> **Slice Duration**: [N days]
> **Target Scope**: 3–5 minutes of polished, continuous gameplay
> **Source GDD**: design/gdd/game-concept.md

---

## 验证问题

[该构建要证明的完整游戏循环问题——同时包含体验与可行性：
“从零开始的玩家，是否能在 [N] 分钟内、无需开发者指导，体验到 [core fantasy]；并且我们是否能在 [X] 天内以代表性质量构建一个这样的循环？”]

---

## 已构建范围

[已实现系统、美术质量层级、刻意省略的内容。]

**Systems included:**
- [System 1]
- [System 2]
- [...]

**Art/audio quality level:** [Placeholder / Representative / Near-shipping]
**Shortcuts taken deliberately:** [List]
**What was cut from original scope:** [List]

---

## 构建速度日志

[逐日记录完成内容。这是你的真实生产速度数据——在冲刺计划中使用它。]

| Day | Completed |
|-----|-----------|
| Day 1 | [构建了什么] |
| Day 2 | [构建了什么] |
| Day 3 | [构建了什么] |
| ... | ... |

**Total elapsed:** [N days] for [scope summary]
**Velocity estimate:** [每等价范围单位 N 小时——例如，“每个战斗遭遇 1 天，每个 UI 屏幕 0.5 天”]

---

## 试玩结果

| Attribute | Value |
|-----------|-------|
| Total sessions | [N] |
| Internal testers | [N] |
| External testers | [N — people who had not seen the game, if available] |
| Avg session length | [N minutes (target: [N] minutes)] |
| Time to first meaningful action | [N seconds (target: [N] seconds)] |

---

## 观察

[来自试玩会话的具体、非观点观察。必要时引用测试者原话。]

**测试者无需指导即可成功的地方：**
- [...]

**测试者困惑或卡住的地方：**
- [...]

**观察到的情绪反应：**
- [...]

---

## 指标

| Metric | Target | Actual |
|--------|--------|--------|
| Time to first meaningful action | [N sec] | [N sec] |
| Session length | [N min] | [N min] |
| Critical fun blockers found | 0 | [N] |
| Pipeline blockers found | 0 | [N] |
| Architecture surprises | 0 | [N] |

**Feel assessment:** [具体描述——“战斗反馈弱；命中时没有打击音”，不要写“感觉粗糙”]

---

## 建议：[PROCEED / PIVOT / KILL]

[用一段话给出证据——直接引用验证问题。玩家是否在目标时间内、无需开发者指导体验到核心幻想？团队是否能按预计排期构建出这种质量？]

---

## 如果继续推进

**Production requirements**（从切片到生产必须改变什么）：
- [例如，“用可发布资源替换占位美术”]
- [例如，“战斗系统需要再增加 2 种武器类型”]

**Architecture adjustments needed:**
- [要更新或创建的 ADR]

**Sprint velocity estimate based on slice data:**
- [例如，“每种敌人 1 天，每个关卡段落 2 天，每个 UI 屏幕 0.5 天”]

**Scope adjustments from original design:**
- [切片揭示的真实生产范围]

**Performance targets:** [Confirmed / Revised — 如果修订，请列出变化]

**Playtest note:** 在运行 `/gate-check pre-production` 前，运行 `/playtest-report` 来整理更多会话数据。

**Next steps:**
1. `/gate-check pre-production` — 正式推进到 Production
2. `/create-epics layer:foundation` — 规划 Foundation 层 epic
3. `/create-epics layer:core` — 规划 Core 层 epic
4. `/sprint-plan` — 在估算中使用本报告的速度数据

---

## 如果转向

[哪些 GDD 需要修订以及为什么——具体说明观察到的失败模式。]

**Systems requiring GDD revision:** [List]
**Architecture decisions to revisit:** [List — use `/architecture-decision` to update]
**Core loop change needed:** [具体要改变什么]

**Next steps:**
1. `/design-system [mechanic]` — 修订受影响的 GDD
2. `/architecture-decision [decision]` — 处理架构问题
3. `/vertical-slice` — 修订后重新验证

---

## 如果终止

[为什么完整游戏循环在该质量层级下行不通。具体是什么阻止玩家体验到核心幻想。改做什么。]

**Next step:** `/brainstorm` 探索新方向，或 `/prototype [new-concept]` 先低成本测试不同概念，再投资另一个垂直切片。

---

## 经验教训

- **构建到近生产质量后，哪些假设被打破？**
  [...]

- **关于管线或架构，有什么让我们意外？**
  [...]

- **如果重新运行一次，我们会如何改变切片范围？**
  [...]

---

> *Vertical slice code location: `prototypes/[concept-name]-vertical-slice/`*
> *此代码仅作为参考材料。生产实现从零编写。*
> *绝不要将此代码导入或重构进生产。*
