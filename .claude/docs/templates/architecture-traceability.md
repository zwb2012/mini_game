# 架构可追溯性索引

<!-- 活文档 — 每次 /architecture-review 运行后更新。
     除非修正错误，否则不要手动编辑。 -->

## 文档状态

- **Last Updated**: [YYYY-MM-DD]
- **Engine**: [e.g. Godot 4.6]
- **GDDs Indexed**: [N]
- **ADRs Indexed**: [M]
- **Last Review**: [link to docs/architecture/architecture-review-[date].md]

## 覆盖摘要

| Status | Count | Percentage |
|--------|-------|-----------|
| ✅ Covered | [X] | [%] |
| ⚠️ Partial | [Y] | [%] |
| ❌ Gap | [Z] | [%] |
| **Total** | **[N]** | |

---

## 可追溯性矩阵

<!-- 每个从 GDD 提取的技术需求一行。
     “技术需求”指任何暗示特定架构决策的 GDD 陈述：
     数据结构、性能约束、所需引擎能力、跨系统通信、状态持久化。 -->

| Req ID | GDD | System | Requirement Summary | ADR(s) | Status | Notes |
|--------|-----|--------|---------------------|--------|--------|-------|
| TR-[gdd]-001 | [filename] | [system name] | [one-line summary] | [ADR-NNNN] | ✅ | |
| TR-[gdd]-002 | [filename] | [system name] | [one-line summary] | — | ❌ GAP | Needs `/architecture-decision [title]` |

---

## 已知缺口

未被 ADR 覆盖的需求，按层级优先级排序（Foundation 优先）：

### Foundation Layer Gaps（BLOCKING — 编码前必须解决）
- [ ] TR-[id]: [requirement] — GDD: [file] — Suggested ADR: "[title]"

### Core Layer Gaps（构建相关系统前必须解决）
- [ ] TR-[id]: [requirement] — GDD: [file] — Suggested ADR: "[title]"

### Feature Layer Gaps（应在功能 sprint 前解决）
- [ ] TR-[id]: [requirement] — GDD: [file] — Suggested ADR: "[title]"

### Presentation Layer Gaps（可推迟到实现阶段）
- [ ] TR-[id]: [requirement] — GDD: [file] — Suggested ADR: "[title]"

---

## 跨 ADR 冲突

<!-- 作出矛盾主张的 ADR 对。必须解决。 -->

| Conflict ID | ADR A | ADR B | Type | Status |
|-------------|-------|-------|------|--------|
| CONFLICT-001 | ADR-NNNN | ADR-MMMM | Data ownership | 🔴 Unresolved |

---

## ADR → GDD 覆盖（反向索引）

<!-- 对每个 ADR，它处理了哪些 GDD 需求？ -->

| ADR | Title | GDD Requirements Addressed | Engine Risk |
|-----|-------|---------------------------|-------------|
| ADR-0001 | [title] | TR-combat-001, TR-combat-002 | HIGH |

---

## 已被取代的需求

<!-- ADR 编写时 GDD 中存在、但后来 GDD 已改变的需求。
     ADR 可能需要更新。 -->

| Req ID | GDD | Change | Affected ADR | Status |
|--------|-----|--------|-------------|--------|
| TR-[id] | [file] | [what changed] | ADR-NNNN | 🔴 ADR needs update |

---

## 如何使用本文档

**编写新 ADR 时**：将其添加到 “ADR → GDD Coverage” 表，并在矩阵中将其满足的需求标记为 ✅。

**批准 GDD 变更时**：扫描矩阵中来自该 GDD 的需求，检查该变更是否使任何现有 ADR 失效。如是，添加到 “Superseded Requirements”。

**运行 `/architecture-review` 时**：该技能会自动用当前状态更新本文档。

**Gate check**：Pre-Production gate 要求本文档存在，且 Foundation Layer Gaps 为零。
