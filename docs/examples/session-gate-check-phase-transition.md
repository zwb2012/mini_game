# 示例会话：/gate-check 阶段转换 — Systems Design → Technical Setup

**背景：** 独立开发者，第 5 周末。Systems Design 阶段看起来已经完成——6 个 MVP GDD 已写完，cross-review 已完成，引擎已设置。User 想正式推进到 Technical Setup。

**起始状态：**
- `production/stage.txt` — 当前为 `systems-design`
- `design/gdd/systems-index.md` — 列出 6 个 MVP 系统，全部标记为 `Status: GDD Complete`
- `design/gdd/` — 存在 6 个 GDD 文件
- `design/gdd/gdd-cross-review-2026-03-10.md` — cross-review 报告，verdict: CONCERNS（1 条低优先级备注）
- 引擎已配置（Godot 4.6，`/setup-engine` 完成）

**会话时长：** 约 20 分钟
**轮次：** 7
**结果：** Gate 通过，`stage.txt` 更新为 `technical-setup`，并给出清晰的后续清单

---

## Turn 1: User 发起 Gate Check

**User:**
> /gate-check

## Turn 2: Agent 检测当前阶段并运行检查

**Agent（通过 /gate-check）:**
> Reading `production/stage.txt` — current phase: **systems-design**
>
> Running gate: **Systems Design → Technical Setup**
>
> ---
> **Required Artifacts Checklist:**
>
> | Artifact | Requirement | Status |
> |----------|-------------|--------|
> | `design/gdd/systems-index.md` | Exists, all MVP systems listed | ✅ |
> | Per-system GDDs | All MVP systems have a GDD | ✅ (6/6) |
> | `/design-review` per GDD | Each GDD reviewed | ✅ (6/6 review comments found) |
> | Cross-GDD review report | `design/gdd/gdd-cross-review-*.md` exists | ✅ |
> | Cross-review verdict | PASS or CONCERNS (not FAIL) | ✅ CONCERNS |
> | Engine configured | `production/stage.txt` or CLAUDE.md engine entry | ✅ Godot 4.6 |
>
> ---
> **Content Scan:**
>
> Checking GDD completeness (8 required sections each)...
>
> | GDD | Missing Sections |
> |-----|-----------------|
> | movement-system.md | None ✅ |
> | stamina-system.md | None ✅ |
> | combat-system.md | None ✅ |
> | inventory-system.md | None ✅ |
> | crafting-system.md | None ✅ |
> | exploration-system.md | None ✅ |
>
> ---
> **Cross-Review Concerns (from `gdd-cross-review-2026-03-10.md`):**
>
> 1. ⚠️ LOW — Crafting and inventory both define "item stack size" independently with different defaults (crafting: 99, inventory: 64). One system should be the authority; the other should reference it. Not blocking — can resolve in ADR.
>
> ---
> **Verdict: PASS**
>
> 所有必需 artifact 都存在。Cross-review concern 是 LOW severity，可在 Technical Setup 中通过 ADR 解决。这在此阶段是正常发现。
>
> **May I advance `production/stage.txt` to `technical-setup`?**

## Turn 3: User 确认

**User:**
> Yes, advance it.

## Turn 4: Agent 更新阶段并提出下一步

**Agent:**
> Updated `production/stage.txt` → `technical-setup`
>
> ---
> **You are now in: Technical Setup**
>
> 该阶段会在生产编码开始前建立技术基础。你的目标是形成完整、已批准的架构，使 Pre-Production 中编写的每个 story 都有清晰、无歧义的技术指导。
>
> **Required steps this phase (in order):**
>
> 1. **`/create-architecture`** — 编写主架构文档。覆盖 system decomposition、data flow、layer boundaries 和 module responsibilities。
>
> 2. **`/architecture-decision`（每个重要技术选择一份）** — 至少包括：
>    - Rendering approach（2D camera、viewport 等）
>    - Save/load strategy
>    - Audio bus architecture
>    - Cross-review 中的 “item stack size authority” 问题（crafting vs inventory）
>
> 3. **`/architecture-review`** — 验证所有 ADR 的完整性、依赖顺序和 GDD traceability。生成 TR-registry。
>
> 4. **`/create-control-manifest`** — 将 Accepted ADR 转换为扁平的 programmer rules sheet。实现 agent 编码时会参考它。
>
> 5. **`/gate-check`** — Technical Setup → Pre-Production gate。要求：architecture doc、所有 ADR Accepted、control manifest、依赖顺序已解决。
>
> **Optional but recommended:**
> - 如果你有计划保留的 prototype code，运行 `/tech-debt` scan
> - 如果尚未获取 Godot 4.6 API snapshots，重新运行 `/setup-engine`
>
> **Tip:** 从 item stack size conflict 的 `/architecture-decision` 开始。这是一个 quick win，可以在它之后造成两个 ADR 歧义前关闭一个开放问题。

## Turn 5: User 询问 Cross-Review Concern

**User:**
> What do I actually write in the ADR for the stack size conflict?

## Turn 6: Agent 建议

**Agent:**
> ADR 的决策是：**哪个系统拥有 canonical `max_stack_size` value？**
>
> 可以考虑两个选项：
>
> **Option A: Inventory owns it**
> - `ItemData` resource（由 inventory 拥有）获得 `max_stack_size: int = 64`
> - Crafting system 从 `ItemData` 读取，永不设置自己的值
> - Pros: inventory 是所有 item properties 的 source of truth
> - Cons: crafting team 需要知道去 inventory data 中查找
>
> **Option B: Item data resource owns it (shared resource)**
> - `ItemData.max_stack_size` 是两个系统的权威来源
> - Crafting 和 inventory 都从 `ItemData` 导入
> - Pros: 单一来源，crafting 和 inventory modules 之间无耦合
> - Cons: shared data layer 中多一个内容
>
> 大多数 studio 在超过 2 个系统接触 item data 时会选择 B（shared resource）。但对于 solo project，两者都有效。
>
> 运行 `/architecture-decision`，它会引导你完成 ADR 格式，包括将此 ADR 链接回两个 GDD 的 Dependencies 章节。

## Turn 7: User 收尾

**User:**
> Got it. I'll start with /architecture-decision for this.

**Agent:**
> 很好的起点。ADR 会记录决策、理由和它处理的 GDD requirements——这样几个月后写代码时，rationale 仍被保留下来。
>
> 你的 phase gate 已记录。Technical Setup 期间可随时运行 `/help`，查看你针对必需清单的当前进度。

---

## 此示例展示了什么

- **Gate check 是自动化的，不是手动表格**：agent 读取 artifacts 并检查它们——user 不需要填写表单
- **CONCERNS ≠ FAIL**：cross-review concern 是 LOW severity，因此 gate 通过。FAIL 会要求先解决才能推进。
- **Stage.txt 是权威来源**：status line、`/help` 和所有技能都读取 `production/stage.txt`——在这里更新它会改变后续每个技能看到的阶段
- **Next steps 是阶段专属的**：agent 不会给泛泛的 “good luck”——它会给 Technical Setup 专属的有序清单
- **Gate check 会浮现延续工作**：stack size conflict 原本是 cross-review note；gate check 确保它变成具体 ADR，而不是丢失
- **每个 gate 只推进一次**：user 明确确认推进。gate 不会自动推进；需要人类确认。
