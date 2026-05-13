# 示例会话：/adopt — Brownfield 项目接入

**背景：** 开发者在发现这个 agent 系统前，已经开发游戏 3 个月。他们有代码、一些设计文档和粗略笔记——但格式都不符合技能可使用的标准。

**起始状态：**
- `src/gameplay/` — 约 4000 行 Godot 4.6 GDScript
- `design/` — 3 个带有粗略设计笔记的 markdown 文件（不是 GDD 模板格式）
- 没有 `design/gdd/` 目录
- 没有 `docs/architecture/` 目录
- 没有 `production/` 目录
- 没有 `design/gdd/systems-index.md`
- CLAUDE.md 存在（引擎已配置：Godot 4.6）

**会话时长：** 约 30 分钟
**轮次：** 8
**结果：** 写入接入计划，并立即修复最紧急的缺口（缺失系统索引）

---

## Turn 1: User 调用 /adopt

**User:**
> /adopt

## Turn 2: Agent 检测项目状态

**Agent（technical-director，通过 /adopt，context: fork）:**
> Running brownfield audit...
>
> **Phase 1: Project State Detection**
>
> | Artifact Category | Found | Notes |
> |------------------|-------|-------|
> | Engine configuration | ✅ | Godot 4.6 in CLAUDE.md |
> | Source code | ✅ | ~4000 lines in `src/gameplay/` |
> | Design docs | ⚠️ | 3 files in `design/`, not in GDD format |
> | Architecture docs | ❌ | `docs/architecture/` missing |
> | Systems index | ❌ | `design/gdd/systems-index.md` missing |
> | Production tracking | ❌ | `production/` directory missing |
> | Sprint/story files | ❌ | None |
>
> **Phase 2: Format Audit (existing files)**
>
> Checking internal structure of the 3 design files...
>
> *`design/combat-notes.md`:*
> - 有非正式笔记，没有 GDD 模板章节
> - 包含：一些规则描述、一个伤害公式、粗略平衡数值
> - 缺少 GDD 模板章节：Overview、Player Fantasy、Edge Cases、Dependencies、Tuning Knobs、Acceptance Criteria（8 个章节中缺 6 个）
>
> *`design/crafting-ideas.md`:*
> - 头脑风暴式笔记，没有结构
> - 没有公式，没有验收标准
> - 代表早期概念思考——适合作为 GDD 输入，但尚不是 GDD
>
> *`design/inventory.md`:*
> - 最接近 GDD——有 Overview 和 Rules 章节
> - 缺少：Player Fantasy、Formulas、Edge Cases、Tuning Knobs、Acceptance Criteria（8 个章节中缺 5 个）
>
> **Phase 3: Gap Classification**
>
> | Gap | Severity | Reason |
> |-----|----------|--------|
> | No systems index | BLOCKING | `/design-system`, `/create-stories`, `/gate-check` all require it |
> | GDD files not in template format | HIGH | Skills cannot reference TR-IDs from malformed GDDs |
> | No architecture docs | HIGH | Cannot run `/architecture-review` or `/create-control-manifest` |
> | No production tracking | MEDIUM | Sprint and story skills won't work, but not needed until production phase |
> | `design/crafting-ideas.md` — pre-GDD content | LOW | Useful as input; needs full GDD authoring before it blocks anything |

## Turn 3: Agent 提出迁移计划

**Agent:**
> **Phase 4: Migration Plan**
>
> 7 个有顺序的步骤，可让你的项目完全对齐。绝不覆盖已有内容——每一步只补齐缺口。
>
> | # | Step | Skill | Priority | Notes |
> |---|------|-------|----------|-------|
> | 1 | 创建 `design/gdd/systems-index.md` | `/map-systems` 或 `/adopt` inline | BLOCKING | 解锁所有下游技能 |
> | 2 | 将 `design/inventory.md` 改造为 GDD 格式 | `/design-system retrofit design/inventory.md` | HIGH | 添加 5 个缺失章节，保留已有内容 |
> | 3 | 将 `design/combat-notes.md` 改造为 GDD 格式 | `/design-system retrofit design/combat-notes.md` | HIGH | 添加 6 个缺失章节 |
> | 4 | 将 `design/crafting-ideas.md` 转换为完整 GDD | `/design-system crafting`（新建作者流程，以 ideas 为输入） | MEDIUM | 不是 retrofit——太非正式，无法改造 |
> | 5 | 从现有代码创建架构 ADR | `/reverse-document` + `/architecture-decision` | HIGH | 捕捉代码中已经做出的决策 |
> | 6 | 创建主架构文档 | `/create-architecture` | HIGH | 在 ADR 之后 |
> | 7 | 建立生产跟踪 | `/sprint-plan new` | MEDIUM | 在架构阶段之后 |
>
> **Important:** Step 1 必须先于其他任何步骤。其余步骤可以并行，或根据你的优先级重新排序。
>
> May I write this plan to `docs/adoption-plan-2026-03-12.md`?

**User:**
> Yes. Write it.

**Agent 写入接入计划。**

## Turn 4: Agent 提议修复最紧急缺口

**Agent:**
> BLOCKING 缺口是缺失 `design/gdd/systems-index.md`。
>
> 我可以现在通过读取你的现有代码和设计文档来推断已经构建的系统，并创建一份索引。这比从零运行 `/map-systems` 更快——我会基于已有内容填充它，然后由你确认或调整。
>
> 你想让我现在做吗？

**User:**
> Yes, do it.

## Turn 5: Agent 读取代码库并起草系统索引

**Agent:**
> Reading `src/gameplay/` to infer systems...
>
> 在代码中发现这些系统边界：
>
> - `src/gameplay/combat/` — 伤害计算、命中检测、状态效果
> - `src/gameplay/inventory/` — 物品管理、重量、堆叠
> - `src/gameplay/crafting/` — 配方查找、结果生成（引用 inventory）
> - `src/gameplay/movement/` — CharacterBody2D、地形修饰符（combat 用于定位）
> - `src/gameplay/ui/` — HUD、inventory screen、dialogue box
> - `src/gameplay/world/` — tile map、terrain types、chunk loading
>
> **Draft systems index:**
>
> | System | Category | Priority | Dependencies | GDD Status |
> |--------|----------|----------|--------------|------------|
> | Movement | Foundation | MVP | None | ❌ Missing |
> | World/Terrain | Foundation | MVP | Movement | ❌ Missing |
> | Combat | Core | MVP | Movement | ⚠️ Needs retrofit |
> | Inventory | Core | MVP | None | ⚠️ Needs retrofit |
> | Crafting | Feature | MVP | Inventory | ❌ Pre-GDD only |
> | UI / HUD | Presentation | MVP | Combat, Inventory, Movement | ❌ Missing |
>
> 这看起来对吗？有没有遗漏或分类错误的内容？

**User:**
> Looks right. Add a Stamina system — it's in combat/ but should be its own system.

**Agent:**
> 已将 Stamina 添加为 Core / MVP 系统：
>
> | Stamina | Core | MVP | Movement, Combat | ❌ Missing |
>
> 已更新依赖：Movement 依赖 Stamina（movement 会消耗它）。
>
> May I write this to `design/gdd/systems-index.md`?

## Turn 6: User 批准

**User:**
> Yes

**Agent 写入 `design/gdd/systems-index.md`。**

## Turn 7: Agent 展示现在已解锁的内容

**Agent:**
> `design/gdd/systems-index.md` created.
>
> **BLOCKING gap resolved.** 以下技能现在可以运行：
>
> - ✅ `/design-system [name]` — 任意系统的引导式 GDD 作者流程
> - ✅ `/design-system retrofit [path]` — 填补现有文档缺失章节
> - ✅ `/gate-check` — 现在有系统索引用于验证
> - ✅ `/help` — 现在可以显示正确阶段工作流
>
> **Recommended next steps（来自接入计划）：**
>
> 1. 运行 `/design-system retrofit design/inventory.md` — 这是你最完整的现有文档，最容易获得成果
> 2. 运行 `/design-system retrofit design/combat-notes.md`
> 3. 运行 `/design-system crafting` — 使用你的 ideas 文件作为输入来编写 crafting GDD
>
> 完成这 3 项后，7 个系统中将有 5 个拥有完整 GDD。然后运行 `/review-all-gdds`，在架构工作前捕捉跨系统一致性问题。

## Turn 8: User 确认计划

**User:**
> Perfect. I'll start with the inventory retrofit.

**Agent:**
> Run:
> ```
> /design-system retrofit design/inventory.md
> ```
>
> 该技能会检测你已有的 Overview 和 Rules 章节，显示 8 个章节中缺失哪些，并只针对缺口运行章节循环。你的现有内容不会被改动。

---

## 此示例展示了什么

- **FORMAT 审计，而非存在性审计**：`/adopt` 不只是检查文件是否存在——它会检查内部结构是否符合技能预期。一个名为 `gdd.md` 但没有模板章节的文件会被标记为缺口。
- **迁移，而非替换**：现有内容绝不会被覆盖。计划只填补缺口。
- **BLOCKING 缺口优先浮现**：缺失系统索引被识别为 BLOCKING，因为它阻止最多技能运行。
- **内联创建紧急缺口**：agent 不只是报告缺口，而是提出在同一会话中立即修复。
- **从代码推断**：系统索引从代码库结构中引导生成，而不是从零编写——brownfield 代码已经包含答案。
- **Retrofit vs. new authoring**：`/design-system retrofit` 处理已有但不完整的文档；完整 `/design-system` 处理全新文档。接入计划会区分每个文件适用哪一种。
- **Context: fork**：`/adopt` 在 forked context 中运行，避免用跨整个代码库的大量文件读取污染主会话。
