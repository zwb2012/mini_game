# 协作式会话示例

本目录包含真实、端到端的会话记录，展示 Game Studio Agent Architecture 在实践中如何工作。每个示例都展示了**协作式工作流**：agents 会提问、提出选项并等待用户批准，而不是自主生成内容。

---

## 可视化参考

**刚接触本系统？从这里开始：**
[Skill Flow Diagrams](skill-flow-diagrams.md) — 7 个阶段的可视化地图，以及技能如何串联。

---

## 📚 **可用示例**

### 核心工作流

### [Skill Flow Diagrams](skill-flow-diagrams.md)
**Type:** Visual Reference
**Complexity:** All levels

完整 pipeline overview（从零到发布），以及以下内容的详细 chain diagrams：
design-system、story lifecycle、UX pipeline 和 brownfield onboarding。
**如果你想理解各部分如何组合，请从这里开始。**

---

### [会话：使用 /design-system 编写 GDD](session-design-system-skill.md)
**Type:** Design (skill-driven)
**Skill:** `/design-system`
**Duration:** ~60 minutes (14 turns)
**Complexity:** Medium

**场景：**
Dev 在 `/map-systems` 生成 systems index 后运行 `/design-system movement`。该技能从 game concept 和 dependency GDDs 加载上下文，运行 technical feasibility pre-check，然后逐一引导完成全部 8 个 GDD 章节——每节先起草、批准，再写入磁盘，然后进入下一节。

**关键时刻：**
- Technical feasibility pre-check 标记 Jolt physics default change（Godot 4.6）
- Incremental writing：每个章节获批后立即落盘
- Section 5 期间会话崩溃 → agent 从第一个空章节恢复
- Dependency signals（stamina、inventory）在 Dependencies 章节浮现
- 以明确 handoff 结束："run `/design-review` before the next system"

**你将学到：**
- `/design-system` 与让 agent “write a GDD” 有何不同
- section-by-section cycle 如何避免 30k-token context bloat
- incremental file writing 如何在会话崩溃后保留进度
- 技能如何暴露 downstream dependency contracts

---

### [会话：完整 Story 生命周期](session-story-lifecycle.md)
**Type:** Full Workflow
**Skills:** `/story-readiness` → implementation → `/story-done`
**Duration:** ~50 minutes (13 turns)
**Complexity:** Medium

**场景：**
Dev 从 sprint backlog 中领取一个 story。`/story-readiness` 在写任何代码前捕捉到 roll-direction 歧义。实现后，`/story-done` 验证 9 条 acceptance criteria，识别 2 条 deferred criteria（inventory 尚未集成），并带备注关闭 story。

**关键时刻：**
- `/story-readiness` 在 Turn 2 捕捉 spec ambiguity——实现前解决
- ADR status check：如果 ADR 仍是 Proposed，story 会是 BLOCKED
- Manifest version check：确认 story guidance 未偏离当前架构
- 集成暂不可行时追踪 deferred criteria（不会丢失）
- `sprint-status.yaml` 在 story close 时更新，自动浮现下一个 ready story

**你将学到：**
- 为什么 `/story-readiness` 能防止实现后期歧义
- deferred criteria 如何工作（COMPLETE WITH NOTES vs. BLOCKED）
- TR-ID references 如何防止误报 deviation flags
- 从 backlog → implemented → closed 的完整循环

---

### [会话：Gate Check 和阶段转换](session-gate-check-phase-transition.md)
**Type:** Phase Gate
**Skill:** `/gate-check`
**Duration:** ~20 minutes (7 turns)
**Complexity:** Low

**场景：**
Dev 完成 Systems Design 阶段并运行 `/gate-check` 推进。Gate 发现全部 6 个 MVP GDD 完整，cross-review 以一个低严重度 concern 通过。Gate 通过，`stage.txt` 更新，agent 给出 Technical Setup 的具体有序清单。

**关键时刻：**
- Gate 验证 artifact 是否存在，也验证内部完整性（每个 GDD 8 个章节）
- CONCERNS ≠ FAIL：低严重度 cross-review note 不阻止 gate
- stage.txt update 会改变 `/help`、`/sprint-status` 和所有技能后续看到的状态
- Agent 将 cross-review concern 转化为下一步要写的具体 ADR
- 下一阶段清单具体且有序，而非泛泛建议

**你将学到：**
- gate check 实际验证什么（不只是“文件是否存在？”）
- PASS/CONCERNS/FAIL verdicts 如何工作
- 为什么 stage.txt 是阶段跟踪权威来源
- 阶段转换后会发生什么变化

---

### [会话：UX Pipeline — /ux-design → /ux-review → /team-ui](session-ux-pipeline.md)
**Type:** UX Design Pipeline
**Skills:** `/ux-design`, `/ux-review`, `/team-ui`
**Duration:** ~90 minutes (16 turns)
**Complexity:** Medium-High

**场景：**
Dev 设计 HUD 和 inventory screen。`/ux-design` 读取 player journey 和 GDDs，用玩家情绪状态支撑决策。`/ux-review` 捕捉到 blocking accessibility gap（drag-drop 缺少 keyboard alternative）和 advisory colorblind issue。修复后，`/team-ui` 接受 handoff。

**关键时刻：**
- HUD philosophy choice（diegetic vs. persistent vs. tactical）基于 survival genre conventions
- `/ux-review` 区分 BLOCKING（阻止 handoff）和 ADVISORY（可在 visual pass 修复）
- Accessibility 在实现前捕捉，而不是 QA 阶段才发现
- Keyboard alternative 一轮加入；review 重新运行并通过
- `/team-ui` 在开始 visual design 前检查是否有通过的 `/ux-review`

**你将学到：**
- `/ux-design` 如何使用 player journey context 支撑 UI 决策
- `/ux-review` 实际检查什么（不只是“是否有 spec？”）
- HUD doc（`design/ux/hud.md`）与 per-screen specs 的区别
- Accessibility issues 如何在设计时处理，而不是实现时处理

---

### [会话：使用 /adopt 接入 Brownfield 项目](session-adopt-brownfield.md)
**Type:** Brownfield Adoption
**Skill:** `/adopt`
**Duration:** ~30 minutes (8 turns)
**Complexity:** Low-Medium

**场景：**
Dev 有 3 个月的现有代码和粗略设计笔记，但格式都不正确。`/adopt` 审计 format compliance（不只是 file existence），按严重度分类 4 个 gaps，构建有序 7 步迁移计划，并立即通过从代码库推断来修复 BLOCKING gap（缺失 systems index）。

**关键时刻：**
- FORMAT audit 区分 “file exists” 与 “file has required internal structure”
- 识别 BLOCKING gap：缺失 systems index 会阻止 4+ 技能运行
- Migration plan 有序：blocking gaps 优先，然后 high，再 medium
- Systems index 从代码结构引导生成——brownfield code 已包含答案
- Retrofit mode vs. new authoring：`/design-system retrofit` 在不覆盖的情况下填补缺口

**你将学到：**
- `/adopt` 与 `/project-stage-detect` 的区别
- format compliance 如何检查（章节检测，而不只是文件存在）
- brownfield 项目如何接入而不丢失已有工作
- 何时使用 retrofit mode，何时使用 full authoring

---

### 基础示例

### [会话：设计 Crafting System](session-design-crafting-system.md)
**Type:** Design
**Agent:** game-designer
**Duration:** ~45 minutes (12 turns)
**Complexity:** Medium

**场景：**
Solo dev 需要设计服务于 Pillar 2（"Emergent Discovery Through Experimentation"）的 crafting system。Agent 引导其完成问答，提出 3 个带 game theory analysis 的设计选项，纳入 user 修改，并逐步起草 GDD，每一步都经过批准。

**关键协作时刻：**
- Agent 开头提出 5 个澄清问题
- 提出 3 个不同选项，带 pros/cons + MDA alignment
- User 修改推荐方案，agent 立即纳入
- 主动标记边界情况（"what if non-recipe combo?"）
- 每个 GDD 章节在进入下一步前都展示审批
- 创建文件前明确询问 "May I write to [file]?"

**你将学到：**
- 设计 agents 如何询问目标、约束和 references
- 如何用 game design theory（MDA、SDT、Bartle）提出选项
- 如何 section-by-section 迭代 drafts
- 何时委派给 specialists（systems-designer、economy-designer）

---

### [会话：实现 Combat Damage Calculation](session-implement-combat-damage.md)
**Type:** Implementation
**Agent:** gameplay-programmer
**Duration:** ~30 minutes (10 turns)
**Complexity:** Low-Medium

**场景：**
User 有完整设计文档，并希望实现 damage calculation。Agent 读取 spec，识别 7 个 ambiguities/gaps，提出澄清问题，提交架构供批准，按规则执行实现，并主动编写 tests。

**关键协作时刻：**
- Agent 先读取设计文档，识别 7 个 spec ambiguities
- 实现前用 code samples 提出架构
- User 请求 type safety，agent 优化并重新提出
- Rules 捕捉 issues（hardcoded values），agent 透明修复
- 按 verification-driven development 主动编写 tests
- Agent 提供下一步选项，而不是假设

**你将学到：**
- 实现 agents 如何在 coding 前澄清 specs
- 如何用 code samples 提出架构供批准
- rules 如何自动执行标准
- 如何处理 spec gaps（询问，不假设）
- Verification-driven development（tests prove it works）

---

### [会话：范围危机 - 战略决策](session-scope-crisis-decision.md)
**Type:** Strategic Decision
**Agent:** creative-director
**Duration:** ~25 minutes (8 turns)
**Complexity:** High

**场景：**
Solo dev 面临危机：Alpha milestone 还有 2 周，crafting system 需要 3 周，investor demo 事关成败。Creative director 收集上下文、框定决策，提出 3 个带诚实 trade-off analysis 的战略选项，给出推荐但把决定权留给 user，然后用 ADR 和 demo script 记录决策。

**关键协作时刻：**
- Agent 在提出方案前读取上下文文档
- 提出 5 个问题来理解决策约束
- 正确框定决策（利害关系、评估标准）
- 提出 3 个选项，带 risk analysis 和 historical precedent
- 给出强推荐但明确说："this is your call"
- 记录决策 + 提供 demo script 支持 user

**你将学到：**
- leadership agents 如何框定战略决策
- 如何提出带 trade-off analysis 的选项
- 如何在推荐中使用 game dev precedent 和 theory
- 如何记录决策（ADRs）
- 如何将决策级联给受影响部门

---

### [Reverse Documentation Workflow](reverse-document-workflow-example.md)
**Type:** Brownfield Documentation
**Agent:** game-designer
**Duration:** ~20 minutes
**Complexity:** Low

**场景：**
Developer 已构建 skill tree system，但从未写设计文档。Agent 读取代码，推断设计意图，询问 ambiguous decisions 的澄清问题，并产出 retroactive GDD。

---

## 🎯 **这些示例展示了什么**

所有示例都遵循**协作式工作流模式：**

```
Question → Options → Decision → Draft → Approval
```

> **Note:** 这些示例以对话文本展示协作模式。
> 实践中，agents 现在会在决策点使用 `AskUserQuestion` tool，
> 展示结构化 option pickers（包含 labels、descriptions 和 multi-select）。
> 模式是 **Explain → Capture**：agents 先在对话中解释分析，
> 然后为用户决策展示结构化 UI picker。

### ✅ **展示的协作行为：**

1. **Agents Ask Before Assuming**
   - Design agents 询问 goals、constraints、references
   - Implementation agents 澄清 spec ambiguities
   - Leadership agents 在推荐前收集完整上下文

2. **Agents Present Options, Not Dictates**
   - 2-4 个选项，带 pros/cons
   - Reasoning 基于 theory、precedent、project pillars
   - 提出推荐，但由 user 决定

3. **Agents Show Work Before Finalizing**
   - Design drafts section-by-section 展示
   - Architecture proposals 在实现前展示
   - Strategic analysis 在决策前展示

4. **Agents Get Approval Before Writing Files**
   - 使用 Write/Edit tools 前明确询问 "May I write to [file]?"
   - Multi-file changes 先列出所有受影响文件
   - User 说 "Yes" 后才创建文件

5. **Agents Iterate on Feedback**
   - User modifications 立即纳入
   - User 改变推荐时不防御
   - 当 user 改进 agent 建议时应认可

---

## 📖 **如何使用这些示例**

### 对新用户：
第一次会话前阅读这些示例。它们展示 agents 工作方式的现实预期：
- Agents 是 consultants，不是 autonomous executors
- 你做出所有 creative/strategic decisions
- Agents 提供 expert guidance 和 options

### 理解具体工作流：
- **刚接触系统？** → 先读 skill-flow-diagrams.md
- **第一次运行 /design-system？** → 读 session-design-system-skill.md
- **领取一个 story？** → 读 session-story-lifecycle.md
- **完成一个阶段？** → 读 session-gate-check-phase-transition.md
- **开始 UI 工作？** → 读 session-ux-pipeline.md
- **有现有项目？** → 读 session-adopt-brownfield.md
- **设计一个系统（agent-driven）？** → 读 session-design-crafting-system.md
- **实现代码？** → 读 session-implement-combat-damage.md
- **做战略决策？** → 读 session-scope-crisis-decision.md

### 用于培训：
如果你在教别人使用本系统，可以逐轮讲解一个示例，展示：
- 好问题是什么样
- 如何评估提出的选项
- 何时批准 vs. 请求修改
- 如何在利用 AI 专业能力的同时保持 creative control

---

## 🔍 **所有示例中的常见模式**

### Turn 1-2: **Understand Before Acting**
- Agent 读取 context（design docs、specs、constraints）
- Agent 提出澄清问题
- 不假设、不猜测

### Turn 3-5: **Present Options with Reasoning**
- 2-4 个不同 approaches
- 每个都有 pros/cons
- Theory/precedent 支撑分析
- 提出推荐，但把决定权留给 user

### Turn 6-8: **Iterate on Drafts**
- 增量展示 work
- 立即纳入反馈
- 主动标记 edge cases 或 ambiguities

### Turn 9-10: **Approval and Completion**
- "May I write to [file]?"
- User: "Yes"
- Agent writes files
- Agent 提供下一步（tests、review、integration）

---

## 🚀 **自己试一试**

阅读这些示例后，尝试这个练习：

1. 选择你的一个 game system（combat、inventory、progression 等）
2. 让相关 agent 设计或实现它
3. 观察 agent 是否：
   - ✅ 一开始提出澄清问题
   - ✅ 提出带 reasoning 的选项
   - ✅ 最终确定前展示 drafts
   - ✅ 写文件前请求批准

如果 agent 跳过任何一步，提醒它：
> "Please follow the collaborative protocol from docs/COLLABORATIVE-DESIGN-PRINCIPLE.md"

---

## 📝 **其他资源**

- **完整原则文档：** [docs/COLLABORATIVE-DESIGN-PRINCIPLE.md](../COLLABORATIVE-DESIGN-PRINCIPLE.md)
- **工作流指南：** [docs/WORKFLOW-GUIDE.md](../WORKFLOW-GUIDE.md)
- **Agent 名册：** [.claude/docs/agent-roster.md](../../.claude/docs/agent-roster.md)
- **CLAUDE.md（协作协议）：** [CLAUDE.md](../../CLAUDE.md#collaboration-protocol)
