# Director Gates — 共享评审模式

本文档定义所有 director 和 lead reviews 在各工作流阶段使用的标准 gate prompts。
Skills 会引用本文档中的 gate IDs，而不是在内部嵌入完整 prompts — 这样当 prompts 需要更新时可避免漂移。

**Scope**：全部 7 个制作阶段（Concept → Release）、全部 3 个 Tier 1 directors、
以及所有关键 Tier 2 leads。任何 skill、team orchestrator 或 workflow 都可以调用这些 gates。

---

## 如何使用本文档

在任何 skill 中，用引用替换内联 director prompt：

```
Spawn `creative-director` via subagent using gate **CD-PILLARS** from
`.claude/docs/director-gates.md`.
```

传入该 gate 的 **Context to pass** 字段列出的上下文，然后使用下面的 **Verdict handling** 规则处理 verdict。

---

## 评审模式

评审强度控制 director gates 是否运行。它可以全局设置（跨会话保留），
也可以在每次 skill 运行时覆盖。

**Global config**：`production/review-mode.txt` — 一个单词：`full`、`lean` 或 `solo`。
在 `/start` 期间设置一次。要随时更改，可直接编辑该文件。

**Per-run override**：任何使用 gate 的 skill 都接受 `--review [full|lean|solo]` 作为参数。
这只会覆盖该次运行的全局配置。

示例：
```
/brainstorm space horror           → uses global mode
/brainstorm space horror --review full   → forces full mode this run
/architecture-decision --review solo     → skips all gates this run
```

| Mode | What runs | Best for |
|------|-----------|----------|
| `full` | 所有 gates 激活 — 每个工作流步骤都被评审 | 团队、学习型用户，或希望每一步都有彻底 director feedback 的场景 |
| `lean` | 仅 PHASE-GATEs（`/gate-check`）— 跳过每个 skill 内部 gates | **Default** — solo devs 和 small teams；directors 仅在 milestones 评审 |
| `solo` | 所有地方都不运行 director gates | Game jams、prototypes、追求最高速度 |

**检查模式 — 每次生成 gate 前应用：**

```
Before spawning gate [GATE-ID]:
1. If skill was called with --review [mode], use that
2. Else read production/review-mode.txt
3. Else default to lean

Apply the resolved mode:
- solo → skip all gates. Note: "[GATE-ID] skipped — Solo mode"
- lean → skip unless this is a PHASE-GATE (CD-PHASE-GATE, TD-PHASE-GATE, PR-PHASE-GATE, AD-PHASE-GATE)
         Note: "[GATE-ID] skipped — Lean mode"
- full → spawn as normal
```

---

## 调用模式（复制到任何 skill 中）

**MANDATORY：每次生成 gate 前解析 review mode。** 绝不要在未检查的情况下生成 gate。
解析后的 mode 在每次 skill 运行中只确定一次：
1. 如果 skill 调用带有 `--review [mode]`，使用该 mode
2. 否则读取 `production/review-mode.txt`
3. 否则默认使用 `lean`

应用解析后的 mode：
- `solo` → **skip all gates**。在输出中注明：`[GATE-ID] skipped — Solo mode`
- `lean` → **除非这是 PHASE-GATE**（CD-PHASE-GATE、TD-PHASE-GATE、PR-PHASE-GATE、AD-PHASE-GATE），否则跳过。注明：`[GATE-ID] skipped — Lean mode`
- `full` → 正常生成

```
# Apply mode check, then:
Spawn `[agent-name]` via subagent:
- Gate: [GATE-ID] (see .claude/docs/director-gates.md)
- Context: [fields listed under that gate]
- Await the verdict before proceeding.
```

对于并行生成（同一 gate 点有多个 directors）：

```
# Apply mode check for each gate first, then spawn all that survive:
Spawn all [N] agents simultaneously via subagent — issue all subagent calls before
waiting for any result. Collect all verdicts before proceeding.
```

---

## 标准 Verdict 格式

所有 gates 返回三种 verdict 之一。Skills 必须处理全部三种：

| Verdict | Meaning | Default action |
|---------|---------|----------------|
| **APPROVE / READY** | 无问题。继续。 | 继续工作流 |
| **CONCERNS [list]** | 存在问题但不阻塞。 | 通过 `ask_user_question` 呈现给用户 — 选项：`Revise flagged items` / `Accept and proceed` / `Discuss further` |
| **REJECT / NOT READY [blockers]** | 阻塞性问题。不要继续。 | 向用户呈现 blockers。在解决前不要写文件或推进阶段。 |

**Escalation rule**：当多个 directors 并行生成时，采用最严格 verdict — 一个 NOT READY 会覆盖所有 READY verdicts。

---

## 记录 Gate 结果

Gate 解决后，在相关文档的 status header 中记录 verdict：

```markdown
> **[Director] Review ([GATE-ID])**: APPROVED [date] / CONCERNS (accepted) [date] / REVISED [date]
```

对于 phase gates，根据情况记录到 `docs/architecture/architecture.md` 或
`production/session-state/active.md`。

---

## Tier 1 — Creative Director Gates

Agent：`creative-director` | Model tier：Opus | Domain：Vision、pillars、player experience

---

### CD-PILLARS — Pillar 压力测试

**Trigger**：在 game pillars 和 anti-pillars 定义后（brainstorm Phase 4，或任何 pillars 修订时）

**Context to pass**：
- 完整 pillar set，包含 names、definitions 和 design tests
- Anti-pillars list
- Core fantasy statement
- Unique hook（"Like X, AND ALSO Y"）

**Prompt**：
> “评审这些 game pillars。它们是否可证伪 — 一个真实设计决策是否可能实际违反该 pillar？
> 它们彼此之间是否形成有意义的张力？它们是否让本游戏区别于最接近的同类作品？
> 它们在实践中是否能帮助解决设计分歧，还是过于模糊而无用？请返回每个 pillar 的具体反馈，
> 以及整体 verdict：APPROVE（强）、CONCERNS [list]（需要打磨），或 REJECT（弱 — pillars 缺乏约束力）。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### CD-GDD-ALIGN — GDD Pillar 对齐检查

**Trigger**：系统 GDD 撰写完成后（design-system、quick-design，或任何产出 GDD 的 workflow）

**Context to pass**：
- GDD file path
- Game pillars（来自 `design/gdd/game-concept.md` 或 `design/gdd/game-pillars.md`）
- 本游戏的 MDA aesthetics target
- 该系统声明的 Player Fantasy section

**Prompt**：
> “评审此 system GDD 的 pillar alignment。每个章节是否都服务于声明的 pillars？
> 是否存在与某个 pillar 冲突或削弱它的 mechanics 或 rules？Player Fantasy section 是否匹配游戏 core fantasy？
> 返回 APPROVE、CONCERNS [有问题的具体章节]，或 REJECT [在系统可实现前必须重设计的 pillar violations]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### CD-SYSTEMS — Systems Decomposition 愿景检查

**Trigger**：`/map-systems` 写入 systems index 后 — 在 GDD 撰写开始前验证完整 system set

**Context to pass**：
- Systems index path（`design/gdd/systems-index.md`）
- Game pillars 和 core fantasy（来自 `design/gdd/game-concept.md`）
- Priority tier assignments（MVP / Vertical Slice / Alpha / Full Vision）
- 依赖图中识别出的任何 high-risk 或 bottleneck systems

**Prompt**：
> “根据游戏 design pillars 评审此 systems decomposition。完整 MVP-tier systems 是否共同交付 core fantasy？
> 是否存在不服务于任何声明 pillar 的 systems — 表明它们可能是 scope creep？
> 是否有 pillar-critical player experiences 没有对应 system 负责交付？Core loop 是否缺少必要 systems？
> 返回 APPROVE（systems serve the vision）、CONCERNS [具体 gaps 或 misalignments 及其 pillar implications]，
> 或 REJECT [fundamental gaps — decomposition 缺失关键设计意图，GDD authoring 前必须修订]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### CD-NARRATIVE — 叙事一致性检查

**Trigger**：narrative GDDs、lore documents、dialogue specs 或 world-building documents 撰写完成后
（team-narrative、story systems 的 design-system、writer deliverables）

**Context to pass**：
- Document file path(s)
- Game pillars
- Narrative direction brief 或 tone guide（如果 `design/narrative/` 中存在）
- 新文档引用的任何 existing lore

**Prompt**：
> “评审此 narrative content 是否与游戏 pillars 和已建立 world rules 一致。Tone 是否匹配游戏既定 voice？
> 是否与 existing lore 或 world-building 矛盾？内容是否服务于 player experience pillar？
> 返回 APPROVE、CONCERNS [具体 inconsistencies]，或 REJECT [破坏 world coherence 的 contradictions]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### CD-PLAYTEST — 玩家体验验证

**Trigger**：生成 playtest reports 后（`/playtest-report`），或任何产出 player feedback 的 session 后

**Context to pass**：
- Playtest report file path
- Game pillars 和 core fantasy statement
- 正在测试的具体 hypothesis

**Prompt**：
> “根据游戏 design pillars 和 core fantasy 评审此 playtest report。玩家体验是否匹配预期 fantasy？
> 是否存在系统性问题，代表 pillar drift — 某些 mechanics 单独看没问题，但削弱了预期体验？
> 返回 APPROVE（core fantasy is landing）、CONCERNS [预期体验与实际体验的 gaps]，
> 或 REJECT [core fantasy 不存在 — 进一步 playtesting 前需要重设计]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### CD-PHASE-GATE — 阶段转换时的创意准备度

**Trigger**：始终在 `/gate-check` 时触发 — 与 TD-PHASE-GATE 和 PR-PHASE-GATE 并行生成

**Context to pass**：
- Target phase name
- 所有存在 artifacts 的列表（file paths）
- Game pillars 和 core fantasy

**Prompt**：
> “从 creative direction 角度评审当前项目状态对 [target phase] gate 的准备度。
> Game pillars 是否在所有 design artifacts 中被忠实体现？当前状态是否保留 core fantasy？
> GDDs 或 architecture 中是否有任何 design decisions 损害预期 player experience？
> 返回 READY、CONCERNS [list]，或 NOT READY [blockers]。”

**Verdicts**：READY / CONCERNS / NOT READY

---

## Tier 1 — Technical Director Gates

Agent：`technical-director` | Model tier：Opus | Domain：Architecture、engine risk、performance

---

### TD-SYSTEM-BOUNDARY — 系统边界架构评审

**Trigger**：`/map-systems` Phase 3 dependency mapping 达成一致后、GDD authoring 开始前 —
在团队投入 GDD 撰写前验证 system structure 架构上是否健全

**Context to pass**：
- Systems index path（或如果 index 尚未写入，则为 dependency map summary）
- Layer assignments（Foundation / Core / Feature / Presentation / Polish）
- 完整 dependency graph（每个 system 依赖什么）
- 标记出的任何 bottleneck systems（有许多 dependents）
- 发现的任何 circular dependencies 及其 proposed resolutions

**Prompt**：
> “在 GDD authoring 开始前，从架构角度评审此 systems decomposition。System boundaries 是否清晰 —
> 每个 system 是否拥有独立 concern 且重叠最小？是否存在 God Object risks（systems 做得太多）？
> dependency ordering 是否造成 implementation sequencing problems？ proposed boundaries 中是否有 implicit shared-state problems，
> 实现时会导致 tight coupling？是否有 Foundation-layer systems 实际依赖 Feature-layer systems（inverted dependency）？
> 返回 APPROVE（boundaries architecturally sound — proceed to GDD authoring）、CONCERNS [需要在 GDDs 自身中处理的具体 boundary issues]，
> 或 REJECT [fundamental boundary problems — system structure 会导致架构问题，任何 GDD 编写前必须重构]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### TD-FEASIBILITY — 技术可行性评估

**Trigger**：在 scope/feasibility 中识别最大技术风险后（brainstorm Phase 6、quick-design，
或任何带有技术未知项的早期概念）

**Context to pass**：
- Concept 的 core loop description
- Platform target
- Engine choice（或 “undecided”）
- 已识别 technical risks 列表

**Prompt**：
> “评审这些面向 [platform]、使用 [engine or 'undecided engine'] 的 [genre] 游戏技术风险。
> 标记任何可能推翻当前概念描述的 HIGH risk items、任何应影响 engine choice 的 engine-specific risks，
> 以及 solo developers 常低估的 risks。返回 VIABLE（风险可管理）、CONCERNS [list with mitigation suggestions]，
> 或 HIGH RISK [需要修订 concept 或 scope 的 blockers]。”

**Verdicts**：VIABLE / CONCERNS / HIGH RISK

---

### TD-ARCHITECTURE — 架构签核

**Trigger**：master architecture document 起草完成后（`/create-architecture` Phase 7），以及任何重大架构修订后

**Context to pass**：
- Architecture document path（`docs/architecture/architecture.md`）
- Technical requirements baseline（TR-IDs 和 count）
- ADR list with statuses
- Engine knowledge gap inventory

**Prompt**：
> “评审此 master architecture document 的技术健全性。检查：(1) baseline 中每个 technical requirement 是否都有 architectural decision 覆盖？
> (2) 是否明确处理或标记所有 HIGH risk engine domains 为 open questions？
> (3) API boundaries 是否清晰、最小且可实现？(4) Implementation 开始前 Foundation layer ADR gaps 是否已解决？
> 返回 APPROVE、CONCERNS [list]，或 REJECT [coding 开始前必须解决的 blockers]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### TD-ADR — 架构决策评审

**Trigger**：单个 ADR 撰写后（`/architecture-decision`），在标记为 Accepted 前

**Context to pass**：
- ADR file path
- 该领域的 engine version 和 knowledge gap risk level
- Related ADRs（如有）

**Prompt**：
> “评审此 Architecture Decision Record。它是否有清晰的问题陈述和 rationale？被拒绝的 alternatives 是否真正被考虑？
> Consequences section 是否诚实承认 trade-offs？是否标注 engine version？是否标记 post-cutoff API risks？
> 是否链接到它覆盖的 GDD requirements？返回 APPROVE、CONCERNS [specific gaps]，
> 或 REJECT [decision underspecified 或作出了不健全的技术假设]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### TD-ENGINE-RISK — 引擎版本风险评审

**Trigger**：当架构决策涉及 post-cutoff engine APIs，或在最终确定任何 engine-specific implementation approach 前

**Context to pass**：
- 正在使用的具体 API 或 feature
- Engine version 和 LLM knowledge cutoff（来自 `docs/engine-reference/[engine]/VERSION.md`）
- breaking-changes 或 deprecated-apis docs 中的相关 excerpt

**Prompt**：
> “根据 version reference 评审此 engine API usage。此 API 是否存在于 [engine version]？
> 自 LLM knowledge cutoff 以来，其 signature、behaviour 或 namespace 是否改变？
> 是否有已知 deprecations 或 post-cutoff alternatives？返回 APPROVE（可按描述安全使用）、
> CONCERNS [implementing 前需验证]，或 REJECT [API 已改变 — 提供 corrected approach]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### TD-PHASE-GATE — 阶段转换时的技术准备度

**Trigger**：始终在 `/gate-check` 时触发 — 与 CD-PHASE-GATE 和 PR-PHASE-GATE 并行生成

**Context to pass**：
- Target phase name
- Architecture document path（如存在）
- Engine reference path
- ADR list

**Prompt**：
> “从 technical direction 角度评审当前项目状态对 [target phase] gate 的准备度。
> 架构对该阶段是否健全？所有 high-risk engine domains 是否已处理？Performance budgets 是否现实且已记录？
> Foundation-layer decisions 是否足够完整，可以开始 implementation？返回 READY、CONCERNS [list]，或 NOT READY [blockers]。”

**Verdicts**：READY / CONCERNS / NOT READY

---

## Tier 1 — Producer Gates

Agent：`producer` | Model tier：Opus | Domain：Scope、timeline、dependencies、production risk

---

### PR-SCOPE — Scope 与 Timeline 验证

**Trigger**：scope tiers 定义后（brainstorm Phase 6、quick-design，或任何产出 MVP definition 和 timeline estimate 的 workflow）

**Context to pass**：
- Full vision scope description
- MVP definition
- Timeline estimate
- Team size（solo / small team / etc.）
- Scope tiers（如果时间用尽，哪些内容会发布）

**Prompt**：
> “评审此 scope estimate。对于声明的 team size，MVP 是否能在给定 timeline 内完成？
> Scope tiers 是否按风险正确排序 — 如果工作停在每个 tier，是否都能交付 shippable product？
> 在时间压力下最可能的 cut point 是什么，它是优雅 fallback 还是 broken product？
> 返回 REALISTIC（scope matches capacity）、OPTIMISTIC [specific adjustments recommended]，
> 或 UNREALISTIC [blockers — timeline 或 MVP 必须修订]。”

**Verdicts**：REALISTIC / OPTIMISTIC / UNREALISTIC

---

### PR-SPRINT — Sprint 可行性评审

**Trigger**：最终确定 sprint plan 前（`/sprint-plan`），以及任何 mid-sprint scope change 后

**Context to pass**：
- Proposed sprint story list（titles、estimates、dependencies）
- Team capacity（hours available）
- Current sprint backlog debt（如有）
- Milestone constraints

**Prompt**：
> “评审此 sprint plan 的可行性。Story load 对 available capacity 是否现实？Stories 是否按 dependency 正确排序？
> Stories 之间是否有隐藏 dependencies 可能在 sprint 中途造成阻塞？是否有 stories 因技术复杂度而被低估？
> 返回 REALISTIC（plan achievable）、CONCERNS [specific risks]，或 UNREALISTIC [sprint must be descoped — 指出应推迟哪些 stories]。”

**Verdicts**：REALISTIC / CONCERNS / UNREALISTIC

---

### PR-MILESTONE — Milestone 风险评估

**Trigger**：milestone review（`/milestone-review`）、mid-sprint retrospectives，
或提出影响 milestone 的 scope change 时

**Context to pass**：
- Milestone definition 和 target date
- Current completion percentage
- Blocked stories count
- Sprint velocity data（如可用）

**Prompt**：
> “评审此 milestone status。基于当前 velocity 和 blocked story count，此 milestone 能否按目标日期完成？
> 从现在到 milestone 的 top 3 production risks 是什么？是否有应削减以保护 milestone 日期的 scope items，
> 以及不可协商的 items？返回 ON TRACK、AT RISK [specific mitigations]，或 OFF TRACK [日期必须延后或 scope 必须削减 — 提供两种选项]。”

**Verdicts**：ON TRACK / AT RISK / OFF TRACK

---

### PR-EPIC — Epic 结构可行性评审

**Trigger**：`/create-epics` 定义 epics 后、拆分 stories 前 —
在调用 `/create-stories` 前验证 epic structure 是否可生产

**Context to pass**：
- Epic definition file paths（刚创建的所有 epics）
- Epic index path（`production/epics/index.md`）
- Milestone timeline 和 target dates
- Team capacity（solo / small team / size）
- Layer being epiced（Foundation / Core / Feature / etc.）

**Prompt**：
> “在 story breakdown 开始前评审此 epic structure 的 production feasibility。Epic boundaries 是否 scope 合理 —
> 每个 epic 是否能在 milestone deadline 前现实完成？Epics 是否按 system dependency 正确排序 —
> 是否有 epic 需要另一个 epic 的输出才能开始？是否有 epics underscoped（太小，应合并）或 overscoped（太大，应拆成 2-3 个聚焦 epics）？
> Foundation-layer epics 的 scope 是否允许 Core-layer epics 在 Foundation 完成后的下一个 sprint 开始？
> 返回 REALISTIC（epic structure producible）、CONCERNS [stories 写作前需调整的具体结构问题]，
> 或 UNREALISTIC [epics must be split, merged, or reordered — 解决前不能开始 story breakdown]。”

**Verdicts**：REALISTIC / CONCERNS / UNREALISTIC

---

### PR-PHASE-GATE — 阶段转换时的制作准备度

**Trigger**：始终在 `/gate-check` 时触发 — 与 CD-PHASE-GATE 和 TD-PHASE-GATE 并行生成

**Context to pass**：
- Target phase name
- Sprint 和 milestone artifacts present
- Team size 和 capacity
- Current blocked story count

**Prompt**：
> “从 production 角度评审当前项目状态对 [target phase] gate 的准备度。
> 对于声明的 timeline 和 team size，scope 是否现实？Dependencies 是否正确排序，使团队能按顺序实际执行？
> 是否存在可能在前两个 sprints 内破坏该阶段的 milestone 或 sprint risks？
> 返回 READY、CONCERNS [list]，或 NOT READY [blockers]。”

**Verdicts**：READY / CONCERNS / NOT READY

---

## Tier 1 — Art Director Gates

Agent：`art-director` | Model tier：Sonnet | Domain：Visual identity、art bible、visual production readiness

---

### AD-CONCEPT-VISUAL — 视觉身份锚点

**Trigger**：game pillars 锁定后（brainstorm Phase 4），与 CD-PILLARS 并行

**Context to pass**：
- Game concept（elevator pitch、core fantasy、unique hook）
- 完整 pillar set，包含 names、definitions 和 design tests
- Target platform（如已知）
- 用户提到的任何 reference games 或 visual touchstones

**Prompt**：
> “基于这些 game pillars 和 core concept，提出 2-3 个不同的 visual identity directions。
> 对每个方向提供：(1) 一条能指导所有视觉决策的 one-line visual rule（例如 ‘everything must move’、‘beauty is in the decay’），
> (2) mood and atmosphere targets，(3) shape language（sharp/rounded/organic/geometric emphasis），
> (4) color philosophy（palette direction、colors 在世界中的含义）。要具体 — 避免泛泛而谈。
> 其中一个方向应直接服务 primary design pillar。为每个方向命名。推荐最能服务声明 pillars 的方向并解释原因。”

**Verdicts**：CONCEPTS（多个有效选项 — 用户选择）/ STRONG（一个方向明显占优）/ CONCERNS（pillars 尚不足以区分 visual identity）

---

### AD-ART-BIBLE — Art Bible 签核

**Trigger**：art bible 起草完成后（`/art-bible`），asset production 开始前

**Context to pass**：
- Art bible path（`design/art/art-bible.md`）
- Game pillars 和 core fantasy
- Platform 和 performance constraints（如果已配置，来自 `.claude/docs/technical-preferences.md`）
- brainstorm 中选择的 visual identity anchor（来自 `design/gdd/game-concept.md`）

**Prompt**：
> “评审此 art bible 的完整性和内部一致性。Color system 是否匹配 mood targets？
> Shape language 是否源自 visual identity statement？Asset standards 是否可在 platform constraints 内达成？
> Character design direction 是否给 artists 足够依据且不过度规定？Sections 之间是否有矛盾？
> 外包团队能否无需额外 briefing 即根据此文档制作 assets？返回 APPROVE（art bible production-ready）、
> CONCERNS [需要澄清的具体 sections]，或 REJECT [asset production 前必须解决的 fundamental inconsistencies]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### AD-PHASE-GATE — 阶段转换时的视觉准备度

**Trigger**：始终在 `/gate-check` 时触发 — 与 CD-PHASE-GATE、TD-PHASE-GATE 和 PR-PHASE-GATE 并行生成

**Context to pass**：
- Target phase name
- 所有 art/visual artifacts present 的列表（file paths）
- 来自 `design/gdd/game-concept.md` 的 visual identity anchor（如存在）
- Art bible path（如存在：`design/art/art-bible.md`）

**Prompt**：
> “从 visual direction 角度评审当前项目状态对 [target phase] gate 的准备度。
> Visual identity 是否已按该阶段所需程度建立并记录？是否具备正确 visual artifacts？
> Visual teams 是否能在没有会导致后续昂贵返工的 visual direction gaps 的情况下开始工作？
> 是否有 visual decisions 被推迟到 latest responsible moment 之后？返回 READY、CONCERNS [可能导致 production rework 的具体 visual direction gaps]，
> 或 NOT READY [此阶段成功前必须存在的 visual blockers — 指出缺失 artifact 及其在此阶段为何重要]。”

**Verdicts**：READY / CONCERNS / NOT READY

---

## Tier 2 — Lead Gates

这些 gates 由 orchestration skills 和 senior skills 在需要 domain specialist feasibility sign-off 时调用。
Tier 2 leads 使用 Sonnet（默认）。

---

### LP-FEASIBILITY — Lead Programmer 实现可行性

**Trigger**：master architecture document 写入后（`/create-architecture` Phase 7b），
或提出新的 architectural pattern 时

**Context to pass**：
- Architecture document path
- Technical requirements baseline summary
- ADR list with statuses

**Prompt**：
> “评审此 architecture 的 implementation feasibility。标记：(a) 任何用声明的 engine 和 language 难以或不可能实现的 decisions，
> (b) 任何 programmers 需要自行发明的 missing interface definitions，
> (c) 任何会造成可避免 technical debt 或违反标准 [engine] idioms 的 patterns。
> 返回 FEASIBLE、CONCERNS [list]，或 INFEASIBLE [让此架构无法按现状实现的 blockers]。”

**Verdicts**：FEASIBLE / CONCERNS / INFEASIBLE

---

### LP-CODE-REVIEW — Lead Programmer 代码评审

**Trigger**：dev story 实现后（`/dev-story`、`/story-done`），或作为 `/code-review` 的一部分

**Context to pass**：
- Implementation file paths
- Story file path（用于 acceptance criteria）
- Relevant GDD section
- Governing ADR

**Prompt**：
> “根据 story acceptance criteria 和 governing ADR 评审此 implementation。代码是否匹配 architecture boundary definitions？
> 是否违反 coding standards 或 forbidden patterns？Public API 是否可测试并有文档？
> 相对 GDD rules 是否存在 correctness issues？返回 APPROVE、CONCERNS [specific issues]，或 REJECT [merge 前必须修订]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### QL-STORY-READY — QA Lead Story 准备度检查

**Trigger**：Story 被接受进 sprint 前 — 由 `/create-stories`、`/story-readiness` 和 `/sprint-plan` 在 story selection 期间调用

**Context to pass**：
- Story file path
- Story type（Logic / Integration / Visual/Feel / UI / Config/Data）
- Acceptance criteria list（逐字来自 story）
- 该 story 覆盖的 GDD requirement（TR-ID 和 text）

**Prompt**：
> “在 story 进入 sprint 前，评审其 acceptance criteria 的 testability。所有 criteria 是否足够具体，让 developer 明确知道何时完成？
> 对 Logic-type stories：每个 criterion 是否都能用 automated test 验证？对 Integration stories：每个 criterion 是否能在 controlled test environment 中观察？
> 标记过于模糊、无法据此实现的 criteria，并标记需要 full game build 才能测试的 criteria（将这些标为 DEFERRED，而不是 BLOCKED）。
> 返回 ADEQUATE（criteria 可按现状实现）、GAPS [需要细化的具体 criteria]，或 INADEQUATE [criteria 过于模糊 — sprint inclusion 前必须修订 story]。”

**Verdicts**：ADEQUATE / GAPS / INADEQUATE

---

### QL-TEST-COVERAGE — QA Lead 测试覆盖评审

**Trigger**：Implementation stories 完成后、标记 epic done 前，或 `/gate-check` Production → Polish 时

**Context to pass**：
- 已实现 stories 列表及 story types（Logic / Integration / Visual / UI / Config）
- `tests/` 中的 test file paths
- 系统的 GDD acceptance criteria

**Prompt**：
> “评审这些 implementation stories 的 test coverage。所有 Logic stories 是否都有 passing unit tests 覆盖？
> Integration stories 是否由 integration tests 或 documented playtests 覆盖？GDD acceptance criteria 是否每项都映射到至少一个 test？
> 是否存在 GDD Edge Cases section 中未测试的 edge cases？返回 ADEQUATE（coverage meets standards）、GAPS [specific missing tests]，
> 或 INADEQUATE [critical logic untested — do not advance]。”

**Verdicts**：ADEQUATE / GAPS / INADEQUATE

---

### ND-CONSISTENCY — Narrative Director 一致性检查

**Trigger**：Writer deliverables（dialogue、lore、item descriptions）撰写后，
或某项 design decision 具有 narrative implications 时

**Context to pass**：
- Document 或 content file path(s)
- Narrative bible 或 tone guide path（如存在）
- Relevant world-building rules
- 受影响的 character 或 faction profiles

**Prompt**：
> “评审此 narrative content 的内部一致性，以及是否遵循已建立 world rules。
> Character voices 是否与既定 profiles 一致？Lore 是否与任何已建立 facts 矛盾？Tone 是否与游戏 narrative direction 一致？
> 返回 APPROVE、CONCERNS [specific inconsistencies to fix]，或 REJECT [破坏 narrative foundation 的 contradictions]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

### AD-VISUAL — Art Director 视觉一致性评审

**Trigger**：做出 art direction decisions 后、引入新 asset types 时，或 tech art decision 影响 visual style 时

**Context to pass**：
- Art bible path（如果 `design/art/art-bible.md` 存在）
- 正在评审的具体 asset type、style decision 或 visual direction
- Reference images 或 style descriptions
- Platform 和 performance constraints

**Prompt**：
> “评审此 visual direction decision 是否与已建立 art style 和 production constraints 一致。
> 是否匹配 art bible？是否能在 platform performance budget 内达成？是否有造成 technical risk 的 asset pipeline implications？
> 返回 APPROVE、CONCERNS [specific adjustments]，或 REJECT [style violation 或 production risk，必须先解决]。”

**Verdicts**：APPROVE / CONCERNS / REJECT

---

## 并行 Gate 协议

当 workflow 在同一 checkpoint 需要多个 directors（最常见于 `/gate-check`）时，同时生成所有 agents：

```
Spawn in parallel (issue all subagent calls before waiting for any result):
1. creative-director  → gate CD-PHASE-GATE
2. technical-director → gate TD-PHASE-GATE
3. producer           → gate PR-PHASE-GATE
4. art-director       → gate AD-PHASE-GATE

Collect all four verdicts, then apply escalation rules:
- Any NOT READY / REJECT → overall verdict minimum FAIL
- Any CONCERNS → overall verdict minimum CONCERNS
- All READY / APPROVE → eligible for PASS (still subject to artifact checks)
```

---

## 添加新 Gates

当新的 skill 或 workflow 需要新 gate 时：

1. 分配 gate ID：`[DIRECTOR-PREFIX]-[DESCRIPTIVE-SLUG]`
   - Prefixes：`CD-` `TD-` `PR-` `LP-` `QL-` `ND-` `AD-`
   - 为新 agents 添加新 prefixes：`audio-director` → `AU-`，`ux-designer` → `UX-`
2. 将 gate 添加到对应 director section 下，并包含全部五个字段：
   Trigger、Context to pass、Prompt、Verdicts，以及任何 special handling notes
3. 在 skills 中仅按 ID 引用它 — 永远不要把 prompt text 复制进 skill

---

## 按阶段划分的 Gate 覆盖

| Stage | Required Gates | Optional Gates |
|-------|---------------|----------------|
| **Concept** | CD-PILLARS, AD-CONCEPT-VISUAL | TD-FEASIBILITY, PR-SCOPE |
| **Systems Design** | TD-SYSTEM-BOUNDARY, CD-SYSTEMS, PR-SCOPE, CD-GDD-ALIGN（每个 GDD） | ND-CONSISTENCY, AD-VISUAL |
| **Technical Setup** | TD-ARCHITECTURE, TD-ADR（每个 ADR）, LP-FEASIBILITY, AD-ART-BIBLE | TD-ENGINE-RISK |
| **Pre-Production** | PR-EPIC, QL-STORY-READY（每个 story）, PR-SPRINT, all four PHASE-GATEs（通过 gate-check） | CD-PLAYTEST |
| **Production** | LP-CODE-REVIEW（每个 story）, QL-STORY-READY, PR-SPRINT（每个 sprint）, QL-TEST-COVERAGE（每次 sprint close-out） | PR-MILESTONE, AD-VISUAL |
| **Polish** | QL-TEST-COVERAGE, CD-PLAYTEST, PR-MILESTONE | AD-VISUAL |
| **Release** | All four PHASE-GATEs（通过 gate-check） | QL-TEST-COVERAGE |
