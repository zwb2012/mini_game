# Claude Code Game Studios -- 完整工作流指南

> **如何使用代理架构从零开始做出并发布一款游戏。**
>
> 本指南会带你走过游戏开发的每个阶段，使用 49 个代理、73 个斜杠命令和 12 个自动化钩子。它假设你已经安装了 Claude Code，并且正在项目根目录下工作。
>
> 流水线包含 7 个阶段。每个阶段都有一个正式关卡（`/gate-check`），必须通过后才能推进。权威阶段顺序定义在 `.claude/docs/workflow-catalog.yaml` 中，并由 `/help` 读取。

---

## 目录

1. [快速开始](#quick-start)
2. [阶段 1：概念](#phase-1-concept)
3. [阶段 2：系统设计](#phase-2-systems-design)
4. [阶段 3：技术设置](#phase-3-technical-setup)
5. [阶段 4：预制作](#phase-4-pre-production)
6. [阶段 5：制作](#phase-5-production)
7. [阶段 6：打磨](#phase-6-polish)
8. [阶段 7：发布](#phase-7-release)
9. [贯穿性关注点](#cross-cutting-concerns)
10. [附录 A：代理速查](#appendix-a-agent-quick-reference)
11. [附录 B：斜杠命令速查](#appendix-b-slash-command-quick-reference)
12. [附录 C：常见工作流](#appendix-c-common-workflows)

---

## 快速开始

### 你需要准备什么

开始之前，请确保你已经具备：

- 已安装并可正常工作的 **Claude Code**
- **Git**，以及 Git Bash（Windows）或标准终端（Mac/Linux）
- **jq**（可选但推荐 -- 如果缺失，钩子会回退到 `grep`）
- **Python 3**（可选 -- 某些钩子会用它做 JSON 校验）

### 步骤 1：克隆并打开

```bash
git clone <repo-url> my-game
cd my-game
```

### 步骤 2：运行 /start

如果这是你的第一次会话：

```
/start
```

这个引导式 onboarding 会询问你当前处于哪里，并把你路由到正确阶段：

- **Path A** -- 还没有想法：路由到 `/brainstorm`
- **Path B** -- 想法模糊：带种子路由到 `/brainstorm`
- **Path C** -- 概念清晰：路由到 `/setup-engine` 和 `/map-systems`
- **Path D1** -- 既有项目，工件很少：正常流程
- **Path D2** -- 既有项目，已有 GDD/ADR：运行 `/project-stage-detect`，然后运行 `/adopt` 做 brownfield 迁移

### 步骤 3：验证钩子正在工作

启动一个新的 Claude Code 会话。你应该会看到来自 `session-start.sh` 钩子的输出：

```
=== Claude Code Game Studios -- Session Context ===
Branch: main
Recent commits:
  abc1234 Initial commit
===================================
```

如果看到这些，说明钩子正常工作。否则，请检查 `.claude/settings.json`，确保钩子路径适合你的 OS。

### 步骤 4：随时请求帮助

在任何时候运行：

```
/help
```

它会从 `production/stage.txt` 读取你的当前阶段，检查哪些工件已经存在，并准确告诉你下一步该做什么。它会区分 REQUIRED 下一步和 OPTIONAL 机会。

### 步骤 5：创建目录结构

目录会按需创建。系统期望如下布局：

```
src/                  # Game source code
  core/               # Engine/framework code
  gameplay/           # Gameplay systems
  ai/                 # AI systems
  networking/         # Multiplayer code
  ui/                 # UI code
  tools/              # Dev tools
assets/               # Game assets
  art/                # Sprites, models, textures
  audio/              # Music, SFX
  vfx/                # Particle effects
  shaders/            # Shader files
  data/               # JSON config/balance data
design/               # Design documents
  gdd/                # Game design documents
  narrative/          # Story, lore, dialogue
  levels/             # Level design documents
  balance/            # Balance spreadsheets and data
  ux/                 # UX specifications
docs/                 # Technical documentation
  architecture/       # Architecture Decision Records
  api/                # API documentation
  postmortems/        # Post-mortems
tests/                # Test suites
prototypes/           # Throwaway prototypes
production/           # Sprint plans, milestones, releases
  sprints/
  milestones/
  releases/
  epics/              # Epic and story files (from /create-epics + /create-stories)
  playtests/          # Playtest reports
  session-state/      # Ephemeral session state (gitignored)
  session-logs/       # Session audit trail (gitignored)
```

> **提示：** 你不需要在第一天就拥有所有这些目录。到达需要它们的阶段时再创建即可。重要的是，一旦创建就遵循这个结构，因为**规则系统**会根据文件路径强制执行标准。`src/gameplay/` 中的代码会应用 gameplay 规则，`src/ai/` 中的代码会应用 AI 规则，依此类推。

---

## 阶段 1：概念

### 本阶段会发生什么

你会从“没有想法”或“模糊想法”，推进到一份结构化的游戏概念文档，其中包含明确的支柱和玩家旅程。这一阶段决定你要做**什么**以及**为什么**要做。

### 阶段 1 流水线

```
/brainstorm  -->  game-concept.md  -->  /design-review  -->  /setup-engine
     |                                        |                    |
     v                                        v                    v
  10 concepts     Concept doc with       Validation          Engine pinned in
  MDA analysis    pillars, MDA,          of concept          technical-preferences.md
  Player motiv.   core loop, USP         document
                                                                   |
                                                                   v
                                                             /prototype
                                                       (concept prototype — 1-3 days)
                                                        PROCEED ↓     PIVOT → /brainstorm
                                                                   |
                                                                   v (PROCEED)
                                                             /map-systems
                                                                   |
                                                                   v
                                                            systems-index.md
                                                            (all systems, deps,
                                                             priority tiers)
```

### 步骤 1.1：用 /brainstorm 进行头脑风暴

这是你的起点。运行 brainstorm 技能：

```
/brainstorm
```

或带一个类型提示：

```
/brainstorm roguelike deckbuilder
```

**会发生什么：** brainstorm 技能会使用专业工作室技法，引导你完成一个协作式 6 阶段创意流程：

1. 询问你的兴趣、主题和约束
2. 生成 10 个概念种子，并附带 MDA（Mechanics, Dynamics, Aesthetics）分析
3. 你选择 2-3 个最喜欢的概念进行深度分析
4. 执行玩家动机映射和受众定位
5. 你选择胜出的概念
6. 将其正式化为 `design/gdd/game-concept.md`

概念文档包括：

- 电梯陈述（一句话）
- 核心幻想（玩家想象自己在做什么）
- MDA 拆解
- 目标受众（Bartle 类型、人口统计）
- 核心循环图
- 独特卖点
- 可比作品和差异化
- 游戏支柱（3-5 个不可妥协的设计价值）
- 反支柱（游戏有意避免的内容）

### 步骤 1.2：审查概念（可选但推荐）

```
/design-review design/gdd/game-concept.md
```

在继续之前验证结构和完整性。

### 步骤 1.3：选择你的引擎

```
/setup-engine
```

或指定具体引擎：

```
/setup-engine godot 4.6
```

**/setup-engine 会做什么：**

- 填充 `.claude/docs/technical-preferences.md`，包括命名约定、性能预算和引擎特定默认值
- 检测知识缺口（引擎版本晚于 LLM 训练数据），并建议交叉参考 `docs/engine-reference/`
- 在 `docs/engine-reference/` 中创建版本固定的参考文档

**为什么重要：** 设置引擎后，系统就知道该使用哪些引擎专家代理。如果你选择 Godot，`godot-specialist`、`godot-gdscript-specialist` 和 `godot-shader-specialist` 等代理就会成为你的主要专家。

### 步骤 1.4：将概念分解为系统

在编写单个 GDD 之前，先枚举你的游戏需要的所有系统：

```
/map-systems
```

这会创建 `design/gdd/systems-index.md` -- 一个主跟踪文档，它会：

- 列出游戏所需的每个系统（战斗、移动、UI 等）
- 映射系统之间的依赖
- 分配优先级层级（MVP、Vertical Slice、Alpha、Full Vision）
- 确定设计顺序（Foundation > Core > Feature > Presentation > Polish）

这个步骤在进入阶段 2 前是**必需的**。来自 155 个游戏 postmortem 的研究确认，跳过系统枚举会在制作阶段带来 5-10 倍成本。

### 阶段 1 关卡

```
/gate-check concept
```

**通过要求：**

- 引擎已在 `technical-preferences.md` 中配置
- `design/gdd/game-concept.md` 存在且包含支柱
- `design/gdd/systems-index.md` 存在且包含依赖排序

**Verdict：** PASS / CONCERNS / FAIL。CONCERNS 在风险已确认的情况下可通过。FAIL 会阻止推进。

---

## 阶段 2：系统设计

### 本阶段会发生什么

你会创建所有定义游戏如何运作的设计文档。此时还不写代码 -- 这是纯设计阶段。系统索引中识别出的每个系统都会有自己的 GDD，按章节编写、单独审查，然后对所有 GDD 做一致性交叉检查。

### 阶段 2 流水线

```
/map-systems next  -->  /design-system  -->  /design-review
       |                     |                     |
       v                     v                     v
  Picks next system    Section-by-section     Validates 8
  from systems-index   GDD authoring          required sections
                       (incremental writes)   APPROVED/NEEDS REVISION
       |
       |  (repeat for each MVP system)
       v
/review-all-gdds
       |
       v
  Cross-GDD consistency + design theory review
  PASS / CONCERNS / FAIL
```

### 步骤 2.1：编写系统 GDD

按依赖顺序使用引导式工作流设计每个系统：

```
/map-systems next
```

这会选择最高优先级且尚未设计的系统，并交给 `/design-system`，由它引导你逐节创建 GDD。

你也可以直接设计某个具体系统：

```
/design-system combat-system
```

**/design-system 会做什么：**

1. 读取你的游戏概念、系统索引，以及任何上游/下游 GDD
2. 运行技术可行性预检查（领域映射 + 可行性简报）
3. 引导你逐一完成 8 个必需 GDD 章节
4. 每个章节遵循：Context > Questions > Options > Decision > Draft > Approval > Write
5. 每个章节在获批后立即写入文件（可抵抗崩溃）
6. 标记与现有已批准 GDD 的冲突
7. 按类别路由到专家代理（systems-designer 负责数学、economy-designer 负责经济、narrative-director 负责叙事系统）

**8 个必需 GDD 章节：**

| # | 章节 | 这里写什么 |
|---|---------|---------------|
| 1 | **Overview** | 系统的一段式摘要 |
| 2 | **Player Fantasy** | 玩家使用该系统时想象/感受到什么 |
| 3 | **Detailed Rules** | 明确无歧义的机制规则 |
| 4 | **Formulas** | 每个计算，包含变量定义和范围 |
| 5 | **Edge Cases** | 异常情况会发生什么？必须明确解决。 |
| 6 | **Dependencies** | 与哪些其他系统连接（双向） |
| 7 | **Tuning Knobs** | 设计师可以安全修改哪些值，以及安全范围 |
| 8 | **Acceptance Criteria** | 如何测试它是否有效？具体且可衡量。 |

外加一个 **Game Feel** 章节：手感参考、输入响应（ms/frames）、动画手感目标（startup/active/recovery）、冲击瞬间、重量感画像。

### 步骤 2.2：审查每个 GDD

在开始下一个系统之前，验证当前系统：

```
/design-review design/gdd/combat-system.md
```

检查所有 8 个章节的完整性、公式清晰度、边缘情况解决、双向依赖，以及可测试的验收标准。

**Verdict：** APPROVED / NEEDS REVISION / MAJOR REVISION。只有 APPROVED 的 GDD 才应继续推进。

### 步骤 2.3：无需完整 GDD 的小变更

对于不值得写完整 GDD 的调参、小增补或微调：

```
/quick-design "add 10% damage bonus for flanking attacks"
```

这会在 `design/quick-specs/` 中创建轻量级规格，而不是完整的 8 章节 GDD。用于调参、数值变化和小增补。

### 步骤 2.4：跨 GDD 一致性审查

当所有 MVP 系统 GDD 都单独获批后：

```
/review-all-gdds
```

它会同时读取所有 GDD，并运行两个分析阶段：

**Phase 1 -- Cross-GDD Consistency：**
- 依赖双向性（A 引用 B，B 是否引用 A？）
- 系统之间的规则矛盾
- 指向已重命名或已移除系统的过期引用
- 归属冲突（两个系统声称同一责任）
- 公式范围兼容性（System A 的输出是否适合 System B 的输入？）
- 验收标准交叉检查

**Phase 2 -- Design Theory (Game Design Holism)：**
- 相互竞争的进程循环（两个系统是否争夺同一奖励空间？）
- 认知负载（同时活跃系统超过 4 个？）
- 主导策略（某种玩法让所有其他玩法无关紧要）
- 经济循环分析（来源和消耗是否平衡？）
- 跨系统难度曲线一致性
- 支柱对齐和反支柱违规
- 玩家幻想一致性

**输出：** `design/gdd/gdd-cross-review-[date].md`，包含 verdict。

### 步骤 2.5：叙事设计（如适用）

如果你的游戏包含故事、背景或对话，此时构建它们：

1. **世界构建** -- 使用 `world-builder` 定义阵营、历史、地理和世界规则
2. **故事结构** -- 使用 `narrative-director` 设计故事弧、角色弧和叙事节拍
3. **角色表** -- 使用 `narrative-character-sheet.md` 模板

### 阶段 2 关卡

```
/gate-check systems-design
```

**通过要求：**

- `systems-index.md` 中所有 MVP 系统都具有 `Status: Approved`
- 每个 MVP 系统都有已审查的 GDD
- 跨 GDD 审查报告存在（`design/gdd/gdd-cross-review-*.md`），且 verdict 为 PASS 或 CONCERNS（不是 FAIL）

---

## 阶段 3：技术设置

### 本阶段会发生什么

你会做出关键技术决策，将其记录为 Architecture Decision Records (ADRs)，通过审查验证，并产出一个控制清单，为程序员提供扁平、可执行的规则。你还会建立 UX 基础。

### 阶段 3 流水线

```
/create-architecture  -->  /architecture-decision (x N)  -->  /architecture-review
        |                          |                                   |
        v                          v                                   v
  Master architecture       Per-decision ADRs              Validates completeness,
  document covering         in docs/architecture/          dependency ordering,
  all systems               adr-*.md                       engine compatibility
                                                                      |
                                                                      v
                                                         /create-control-manifest
                                                                      |
                                                                      v
                                                         Flat programmer rules
                                                         docs/architecture/
                                                         control-manifest.md
        Also in this phase:
        -------------------
        /ux-design  -->  /ux-review
        Accessibility requirements doc
        Interaction pattern library
```

### 步骤 3.1：主架构文档

```
/create-architecture
```

创建总览架构文档 `docs/architecture/architecture.md`，覆盖系统边界、数据流和集成点。

### 步骤 3.2：架构决策记录（ADRs）

针对每个重要技术决策：

```
/architecture-decision "State Machine vs Behavior Tree for NPC AI"
```

**会发生什么：** 该技能会引导你创建 ADR，包含：
- 上下文和决策驱动因素
- 所有选项及其优缺点和引擎兼容性
- 选定方案及理由
- 后果（正面、负面、风险）
- 依赖（Depends On, Enables, Blocks, Ordering Note）
- 已覆盖的 GDD Requirements（按 TR-ID 链接）

ADR 生命周期：Proposed > Accepted > Superseded/Deprecated。

**关卡检查前至少需要 3 个 Foundation-layer ADR。**

**改造既有 ADR：** 如果你已有来自 brownfield 项目的 ADR：

```
/architecture-decision retrofit docs/architecture/adr-005.md
```

它会检测模板缺失哪些章节，并只添加缺失部分，绝不覆盖现有内容。

### 步骤 3.3：架构审查

```
/architecture-review
```

整体验证所有 ADR：
- ADR 依赖的拓扑排序（检测循环）
- 引擎兼容性验证
- GDD Revision Flags（根据 ADR 选择标记需要更新的 GDD 章节）
- TR-ID 注册表维护（`docs/architecture/tr-registry.yaml`）

### 步骤 3.4：控制清单

```
/create-control-manifest
```

读取所有 Accepted ADR，产出一份扁平的程序员规则表：

```
docs/architecture/control-manifest.md
```

其中包含按代码层组织的 Required patterns、Forbidden patterns 和 Guardrails。之后创建的 story 会嵌入清单版本日期，以便检测过期。

### 步骤 3.5：无障碍要求

使用模板创建 `design/accessibility-requirements.md`。确定一个层级（Basic / Standard / Comprehensive / Exemplary），并填写 4 轴功能矩阵（visual, motor, cognitive, auditory）。

该文档在阶段 3 必需，因为 UX 规格（阶段 4 编写）会引用此层级 — 它是设计前置条件，而不是 UX 交付物。

### 阶段 3 关卡

```
/gate-check technical-setup
```

**通过要求：**

- `docs/architecture/architecture.md` 存在
- 至少存在 3 个 ADR 且为 Accepted
- 架构审查报告存在
- `docs/architecture/control-manifest.md` 存在
- `design/accessibility-requirements.md` 存在

---

## 阶段 4：预制作

### 本阶段会发生什么

你会为关键界面创建 UX 规格，原型验证高风险机制，将设计文档转换为可实现的 story，规划第一个 sprint，并构建一个证明核心循环有趣的 Vertical Slice。

### 阶段 4 流水线

```
/ux-design  -->  /vertical-slice  -->  /create-epics  -->  /create-stories  -->  /sprint-plan
    |                   |                   |                   |                       |
    v                   v                   v                   v                       v
  UX specs       Production-quality   Epic files in       Story files in          First sprint with
  design/ux/     end-to-end build     production/         production/             prioritized stories
                 in prototypes/       epics/*/EPIC.md     epics/*/story-*.md      production/sprints/
                 PROCEED/PIVOT/KILL   (one per module)    (one per behaviour)     sprint-*.md
    |                                                          |
    v                                                          v
 /ux-review                                             /story-readiness
 (validates specs                                       (validates each story
  before epics)                                          before pickup)
                                                               |
                                                               v
                                                           /dev-story
                                                         (implements the story,
                                                          routes to right agent)
```

### 步骤 4.1：关键界面的 UX 规格

在编写 epic 之前，先创建 UX 规格，让 story 作者知道有哪些界面，以及它们必须支持哪些玩家交互。

**UX 规格：**

```
/ux-design main-menu
/ux-design core-gameplay-hud
```

三种模式：screen/flow、HUD 和 interaction patterns。输出到 `design/ux/`。每份规格包含：玩家需求、布局区域、状态、交互映射、数据需求、触发事件、无障碍、本地化。

会读取你的 `accessibility-requirements.md`（阶段 3 编写）以及 `technical-preferences.md` 中的输入方式配置，以驱动无障碍和输入覆盖检查 — 无需在每个界面中重复指定。

> **提示：** `/design-system` 会为每个有 UI 需求的系统发出 📌 UX Flag。使用这些 flag 作为需要哪些界面规格的检查清单。

**交互模式库：**

```
/ux-design interaction-patterns
```

创建 `design/ux/interaction-patterns.md` — 16 个标准控件加游戏特定模式（inventory slot、ability icon、HUD bar、dialogue box 等），包含动画和音效标准。

**UX 审查：**

```
/ux-review all
```

验证 UX 规格是否符合 GDD 对齐和无障碍层级要求。产出 APPROVED / NEEDS REVISION / MAJOR REVISION NEEDED verdict。

### 步骤 4.2：构建 Vertical Slice

Vertical Slice 是一个生产质量证明，用于确认你能在投入完整 Production 前端到端构建完整游戏循环。

```
/vertical-slice
```

**它证明什么：** 玩家从零开始时，是否能在几分钟内、无需开发者指导地体验核心幻想？

**它构建什么：** 一个接近生产质量的可玩构建，覆盖至少一个完整 [start → challenge → resolution] 循环。使用真实架构层、真实命名约定、无硬编码值 — 但不要求最终美术或音频。它不像概念原型那样是一次性抛弃物；它展示生产流水线可行性。

**关于概念原型的说明：** 如果你在阶段 1（概念）运行过 `/prototype`，你已经验证了核心想法是否有趣。Vertical Slice 现在验证你能否正确地构建它。它们回答不同问题。如果你跳过了概念原型，现在先跑一个再投入完整 slice 也是合理的。

**Verdict：** Vertical Slice 会产生 PROCEED / PIVOT / KILL verdict。
- **PROCEED** → 转到步骤 4.3（epics 和 stories）
- **PIVOT** → 用 `/design-system [mechanic]` 修订受影响的 GDD，然后重新运行 `/vertical-slice`
- **KILL** → 带着学到的内容回到 `/brainstorm`

### 步骤 4.3：从设计工件创建 Epics 和 Stories

```
/create-epics layer: foundation
/create-stories [epic-slug]   # repeat for each epic
/create-epics layer: core
/create-stories [epic-slug]   # repeat for each core epic
```

`/create-epics` 读取你的 GDD、ADR 和架构来定义 epic 范围 — 每个架构模块一个 epic。然后 `/create-stories` 将每个 epic 拆解为 `production/epics/[slug]/` 中的可实现 story 文件。每个 story 嵌入：
- GDD requirement 引用（TR-IDs，而不是引用文本 -- 保持新鲜）
- ADR 引用（只引用 Accepted ADR；Proposed ADR 会导致 `Status: Blocked`）
- 控制清单版本日期（用于过期检测）
- 引擎特定实现说明
- 来自 GDD 的验收标准

story 存在后，运行 `/dev-story [story-path]` 实现其中一个 — 它会自动路由到正确的程序员代理。

### 步骤 4.4：接取前验证 Stories

```
/story-readiness production/epics/combat/story-combat-damage-calc.md
```

检查：设计完整性、架构覆盖、范围清晰度、Definition of Done。Verdict: READY / NEEDS WORK / BLOCKED。

### 步骤 4.5：工作量估算

```
/estimate production/epics/combat/story-combat-damage-calc.md
```

提供带风险评估的工作量估算。

### 步骤 4.6：规划你的第一个 Sprint

```
/sprint-plan new
```

**会发生什么：** `producer` 代理会协作进行 sprint 规划：
- 询问 sprint 目标和可用时间
- 将目标拆分为 Must Have / Should Have / Nice to Have 任务
- 识别风险和阻塞
- 创建 `production/sprints/sprint-01.md`
- 填充 `production/sprint-status.yaml`（机器可读的 story 跟踪）

### 步骤 4.7：Vertical Slice（硬关卡）

进入 Production 前，你必须构建并 playtest 一个 Vertical Slice：

- 一个完整的端到端核心循环，可从开始玩到结束
- 代表性质量（不能全是占位物）
- 至少在 3 次会话中进行无引导游玩
- 写下 playtest 报告（`/playtest-report`）

这是一个**硬关卡** -- 如果没有真人无引导玩过构建，`/gate-check` 会自动 FAIL。

### 阶段 4 关卡

```
/gate-check pre-production
```

**通过要求：**

- `design/ux/` 中至少有 1 个已审查 UX 规格
- UX 审查已完成（APPROVED 或 NEEDS REVISION 且风险已记录）
- 至少有 1 个带 README 的原型
- story 文件存在于 `production/epics/[epic-slug]/`
- 至少有 1 个 sprint plan
- 至少有 1 个 playtest 报告（Vertical Slice 已在 3+ 次会话中游玩）

---

## 阶段 5：制作

### 本阶段会发生什么

这是核心制作循环。你会按 sprint 工作（通常 1-2 周），逐个 story 实现功能，跟踪进度，并通过结构化完成审查关闭 story。本阶段会重复，直到游戏内容完成。

### 阶段 5 流水线（每个 Sprint）

```
/sprint-plan new  -->  /story-readiness  -->  implement  -->  /story-done
       |                     |                    |                |
       v                     v                    v                v
  Sprint created       Story validated      Code written     8-phase review:
  sprint-status.yaml   READY verdict        Tests pass       verify criteria,
  populated                                                  check deviations,
                                                             update story status
       |
       |  (repeat per story until sprint complete)
       v
  /sprint-status  (quick 30-line snapshot anytime)
  /scope-check    (if scope is growing)
  /retrospective  (at sprint end)
```

### 步骤 5.1：Story 生命周期

制作阶段以 **story 生命周期** 为中心：

```
/story-readiness  -->  implement  -->  /story-done  -->  next story
```

**1. Story Readiness：** 接取 story 前先验证：

```
/story-readiness production/epics/combat/story-combat-damage-calc.md
```

这会检查设计完整性、架构覆盖、ADR 状态（如果 ADR 仍为 Proposed 会阻塞）、控制清单版本（如果过期会警告）和范围清晰度。Verdict: READY / NEEDS WORK / BLOCKED。

**2. 实现：** 与合适的代理协作：

- `gameplay-programmer` 负责 gameplay systems
- `engine-programmer` 负责核心引擎工作
- `ai-programmer` 负责 AI 行为
- `network-programmer` 负责多人游戏
- `ui-programmer` 负责 UI 代码
- `tools-programmer` 负责开发工具

所有代理都遵循协作协议：读取设计文档、提出澄清问题、呈现架构选项、获得你的批准，然后实现。

**3. Story Completion：** 当 story 完成时：

```
/story-done production/epics/combat/story-combat-damage-calc.md
```

这会运行 8 阶段完成审查：
1. 查找并读取 story 文件
2. 加载引用的 GDD、ADR 和控制清单
3. 验证验收标准（自动可检查、手动、延后）
4. 检查 GDD/ADR 偏差（BLOCKING / ADVISORY / OUT OF SCOPE）
5. 提示进行代码审查
6. 生成完成报告（COMPLETE / COMPLETE WITH NOTES / BLOCKED）
7. 更新 story `Status: Complete` 并添加完成备注
8. 显示下一个 ready story

审查过程中发现的技术债会记录到 `docs/tech-debt-register.md`。

### 步骤 5.2：Sprint 跟踪

随时检查进度：

```
/sprint-status
```

从 `production/sprint-status.yaml` 读取的快速 30 行快照。

如果范围正在增长：

```
/scope-check production/sprints/sprint-03.md
```

这会将当前范围与原计划比较，标记范围增长，并建议裁剪。

### 步骤 5.3：内容跟踪

```
/content-audit
```

比较 GDD 指定内容与已实现内容。尽早发现内容缺口。

### 步骤 5.4：设计变更传播

当 GDD 在 story 创建后发生变化：

```
/propagate-design-change design/gdd/combat-system.md
```

对 GDD 做 Git diff，查找受影响 ADR，生成影响报告，并引导你做 Superseded/update/keep 决策。

### 步骤 5.5：多系统功能（团队编排）

对于跨多个领域的功能，使用团队技能：

```
/team-combat "healing ability with HoT and cleanse"
/team-narrative "Act 2 story content"
/team-ui "inventory screen redesign"
/team-level "forest dungeon level"
/team-audio "combat audio pass"
```

每个团队技能都会协调一个 6 阶段协作工作流：
1. **Design** -- game-designer 提问并呈现选项
2. **Architecture** -- lead-programmer 提出代码结构
3. **Parallel Implementation** -- 专家同时工作
4. **Integration** -- gameplay-programmer 将所有内容接线整合
5. **Validation** -- qa-tester 根据验收标准运行验证
6. **Report** -- coordinator 汇总状态

编排是自动化的，但**决策点仍由你掌握**。

### 步骤 5.6：Sprint Review 和下一个 Sprint

在 sprint 结束时：

```
/retrospective
```

分析计划与完成、速度、阻塞和可执行改进。

然后规划下一个 sprint：

```
/sprint-plan new
```

### 步骤 5.7：里程碑审查

在里程碑检查点：

```
/milestone-review "alpha"
```

产出功能完整性、质量指标、风险评估和 go/no-go 建议。

### 阶段 5 关卡

```
/gate-check production
```

**通过要求：**

- 所有 MVP stories 完成
- Playtesting：3 次会话，覆盖新玩家、中期游戏和难度曲线
- 趣味假设已验证
- playtest 数据中没有 confusion loops

---

## 阶段 6：打磨

### 本阶段会发生什么

你的游戏已经功能完成。现在要让它变好。本阶段聚焦性能、平衡、无障碍、音频、视觉打磨和 playtesting。

### 阶段 6 流水线

```
/perf-profile  -->  /balance-check  -->  /asset-audit  -->  /playtest-report (x3)
       |                  |                    |                    |
       v                  v                    v                    v
  Profile CPU/GPU    Analyze formulas     Verify naming,      Cover: new player,
  memory, optimize   and data for         formats, sizes      mid-game, difficulty
  bottlenecks        broken progressions                      curve

  /tech-debt  -->  /team-polish
       |                |
       v                v
  Track and        Coordinated pass:
  prioritize       performance + art +
  debt items       audio + UX + QA
```

### 步骤 6.1：性能分析

```
/perf-profile
```

引导你进行结构化性能分析：
- 建立目标（FPS、内存、平台）
- 按影响力排序识别瓶颈
- 生成包含代码位置和预期收益的可执行优化任务

### 步骤 6.2：平衡分析

```
/balance-check assets/data/combat_damage.json
```

分析平衡数据中的统计离群值、破坏性成长曲线、退化策略和经济失衡。

### 步骤 6.3：资源审计

```
/asset-audit
```

验证所有资源的命名约定、文件格式标准和大小预算。

### 步骤 6.4：Playtesting（必需：3 次会话）

```
/playtest-report
```

生成结构化 playtest 报告。需要三次会话，覆盖：
- 新玩家体验
- 中期系统
- 难度曲线

### 步骤 6.5：技术债评估

```
/tech-debt
```

扫描 TODO/FIXME/HACK 注释、代码重复、过度复杂函数、缺失测试和过期依赖。每个条目都会分类并排序优先级。

### 步骤 6.6：协同打磨 Pass

```
/team-polish "combat system"
```

并行协调 4 个专家：
1. 性能优化（performance-analyst）
2. 视觉打磨（technical-artist）
3. 音频打磨（sound-designer）
4. 手感/juice（gameplay-programmer + technical-artist）

你设定优先级；团队在每一步获得你的批准后执行。

### 步骤 6.7：本地化和无障碍

```
/localize src/
```

扫描硬编码字符串、会破坏翻译的拼接、不考虑文本扩展的文本，以及缺失 locale 文件。

无障碍会根据阶段 3 无障碍要求文档中承诺的层级进行审计。

### 阶段 6 关卡

```
/gate-check polish
```

**通过要求：**

- 至少存在 3 个 playtest 报告
- 已完成协同打磨 pass（`/team-polish`）
- 没有阻塞性性能问题
- 满足无障碍层级要求

---

## 阶段 7：发布

### 本阶段会发生什么

你的游戏已经打磨、测试并准备就绪。现在发布它。

### 阶段 7 流水线

```
/release-checklist  -->  /launch-checklist  -->  /team-release
        |                       |                      |
        v                       v                      v
  Pre-release             Full cross-department    Coordinate:
  validation across       validation (Go/No-Go     build, QA sign-off,
  code, content,          per department)           deployment, launch
  store, legal
                    Also: /changelog, /patch-notes, /hotfix
```

### 步骤 7.1：发布检查清单

```
/release-checklist v1.0.0
```

生成全面的预发布检查清单，覆盖：
- 构建验证（所有平台可编译并运行）
- 认证要求（平台特定）
- 商店元数据（描述、截图、预告片）
- 法律合规（EULA、隐私政策、评级）
- 存档兼容性
- 分析验证

### 步骤 7.2：发布就绪（完整验证）

```
/launch-checklist
```

完整跨部门验证：

| 部门 | 检查内容 |
|-----------|---------------|
| **Engineering** | 构建稳定性、崩溃率、内存泄漏、加载时间 |
| **Design** | 功能完整性、教程流程、难度曲线 |
| **Art** | 资源质量、缺失贴图、LOD levels |
| **Audio** | 缺失音效、混音电平、空间音频 |
| **QA** | 按严重程度统计的未解决 bug 数、回归套件通过率 |
| **Narrative** | 对话完整性、背景一致性、错别字 |
| **Localization** | 所有字符串已翻译、无截断、locale 测试 |
| **Accessibility** | 合规检查清单、辅助功能测试 |
| **Store** | 元数据完整、截图已批准、定价已设置 |
| **Marketing** | Press kit 就绪、发布预告片、社交媒体已排期 |
| **Community** | Patch notes 草案、FAQ 准备、支持渠道就绪 |
| **Infrastructure** | 服务器已扩容、CDN 已配置、监控已激活 |
| **Legal** | EULA finalized、隐私政策、COPPA/GDPR 合规 |

每个项目都会获得 **Go / No-Go** 状态。所有项目必须为 Go 才能发布。

### 步骤 7.3：生成面向玩家的内容

```
/patch-notes v1.0.0
```

根据 git 历史和 sprint 数据生成玩家友好的 patch notes。将开发者语言转换为玩家语言。

```
/changelog v1.0.0
```

生成内部 changelog（更技术化，面向团队）。

### 步骤 7.4：协调发布

```
/team-release
```

协调 release-manager、QA 和 DevOps 完成：
1. 预发布验证
2. 构建管理
3. 最终 QA sign-off
4. 部署准备
5. Go/No-Go 决策

### 步骤 7.5：发布

`validate-push` 钩子会在推送到 `main` 或 `develop` 时警告你。这是有意为之 -- 发布推送应该是慎重的：

```bash
git tag v1.0.0
git push origin main --tags
```

### 步骤 7.6：发布后

**Hotfix workflow** 用于关键生产 bug：

```
/hotfix "Players losing save data when inventory exceeds 99 items"
```

绕过正常 sprint 流程，但保留完整审计轨迹：
1. 创建 hotfix branch
2. 实现修复
3. 确保 backport 到 development branch
4. 记录事件

**Post-mortem** 在发布稳定后进行：

```
Ask Claude to create a post-mortem using the template at
.claude/docs/templates/post-mortem.md
```

---

## 贯穿性关注点

这些主题适用于所有阶段。

### Director Review Modes

Director gates 是专家代理，会在关键工作流步骤审查你的工作。默认情况下它们在每个 checkpoint 运行。你可以控制获得多少审查。

**在 `/start` 期间设置一次审查强度。** 保存到 `production/review-mode.txt`。

| 模式 | 运行内容 | 最适合 |
|------|-----------|----------|
| `full` | 每一步都运行所有 director gates | 新项目、学习系统 |
| `lean` | Directors 只在阶段转换（`/gate-check`）时运行 | 有经验的开发者 |
| `solo` | 不运行 director reviews | Game jams、原型、最高速度 |

**单次运行覆盖**，不改变全局设置：

```
/brainstorm space horror --review full
/architecture-decision --review solo
```

`--review` 标志适用于所有使用 gate 的技能。可随时通过直接编辑 `production/review-mode.txt` 或重新运行 `/start` 来改变全局模式。

完整 gate 定义和检查模式：`.claude/docs/director-gates.md`

---

### 协作协议

该系统是**用户驱动协作式**，不是自主式。

**模式：** Question > Options > Decision > Draft > Approval

每次代理交互都遵循此模式：
1. 代理提出澄清问题
2. 代理提供 2-4 个带权衡和理由的选项
3. 你做出决定
4. 代理基于你的决定起草
5. 你审查并细化
6. 代理在写入前询问 “May I write this to [filepath]?”

完整协议和示例见 `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md`。

### AskUserQuestion 工具

代理使用 `AskUserQuestion` 工具进行结构化选项呈现。模式是先解释再捕获：先在对话文本中完整分析，然后使用干净的 UI 选择器进行决策。用于设计选择、架构决策和战略问题。不要用于开放式探索问题或简单 yes/no 确认。

### 代理协调（3 层层级）

```
Tier 1 (Directors):    creative-director, technical-director, producer
                                          |
Tier 2 (Leads):        game-designer, lead-programmer, art-director,
                       audio-director, narrative-director, qa-lead,
                       release-manager, localization-lead
                                          |
Tier 3 (Specialists):  gameplay-programmer, engine-programmer,
                       ai-programmer, network-programmer, ui-programmer,
                       tools-programmer, systems-designer, level-designer,
                       economy-designer, world-builder, writer,
                       technical-artist, sound-designer, ux-designer,
                       qa-tester, performance-analyst, devops-engineer,
                       analytics-engineer, accessibility-specialist,
                       live-ops-designer, prototyper, security-engineer,
                       community-manager, godot-specialist,
                       godot-gdscript-specialist, godot-shader-specialist,
                       godot-csharp-specialist, godot-gdextension-specialist,
                       unity-specialist, unity-dots-specialist,
                       unity-shader-specialist, unity-addressables-specialist,
                       unity-ui-specialist, unreal-specialist,
                       ue-blueprint-specialist, ue-gas-specialist,
                       ue-replication-specialist, ue-umg-specialist
```

**协调规则：**
- 垂直委派：Directors > Leads > Specialists。复杂决策绝不跳级。
- 横向咨询：同层代理可以相互咨询，但不得在自己领域外做有约束力的决策。
- 冲突解决：设计冲突交给 `creative-director`。技术冲突交给 `technical-director`。范围冲突交给 `producer`。
- 不允许单方面跨领域变更。

### 自动化钩子（安全网）

系统有 12 个自动运行的钩子：

| Hook | Trigger | 作用 |
|------|---------|-------------|
| `session-start.sh` | Session start | 显示 branch、recent commits，检测 active.md 用于恢复 |
| `detect-gaps.sh` | Session start | 检测新项目（无引擎、无概念）并建议 `/start` |
| `pre-compact.sh` | Before compaction | 将 session state 转储到对话中以便自动恢复 |
| `post-compact.sh` | After compaction | 提醒 Claude 从 `active.md` 恢复 session state |
| `notify.sh` | Notification event | 通过 PowerShell 显示 Windows toast notification |
| `validate-commit.sh` | Before commit | 检查设计文档引用、有效 JSON、无硬编码值 |
| `validate-push.sh` | Before push | 推送到 main/develop 时警告 |
| `validate-assets.sh` | Before commit | 检查资源命名和大小 |
| `validate-skill-change.sh` | Skill file written | `.claude/skills/` 变更后建议运行 `/skill-test` |
| `log-agent.sh` | Agent start | 记录 agent invocations 供审计追踪 |
| `log-agent-stop.sh` | Agent stop | 完成代理审计轨迹（start + stop） |
| `session-stop.sh` | Session end | 最终会话日志 |

### 上下文韧性

**会话状态文件：** `production/session-state/active.md` 是一个活的 checkpoint。每个重要里程碑后更新它。任何中断（compaction、crash、`/clear`）后，先读取此文件。

**增量写入：** 创建多章节文档时，每个章节获批后立即写入文件。这意味着已完成章节能在崩溃和上下文压缩后保留。关于已写入章节的旧讨论可以安全压缩。

**自动恢复：** `session-start.sh` 钩子会自动检测并预览 `active.md`。`pre-compact.sh` 钩子会在压缩前将状态转储进对话。

**Sprint 状态跟踪：** `production/sprint-status.yaml` 是机器可读的 story 跟踪器。由 `/sprint-plan`（初始化）和 `/story-done`（状态更新）写入。由 `/sprint-status`、`/help` 和 `/story-done`（下一个 story）读取。消除脆弱的 markdown 扫描。

### Brownfield Adoption

对于已有一些工件的既有项目：

```
/adopt
```

或定向：

```
/adopt gdds
/adopt adrs
/adopt stories
/adopt infra
```

这会审计既有工件的**格式**（不是存在性），将缺口分类为 BLOCKING/HIGH/MEDIUM/LOW，构建有序迁移计划，并写入 `docs/adoption-plan-[date].md`。核心原则：MIGRATION not REPLACEMENT -- 它绝不重新生成既有工作，只填补缺口。

单个技能也支持 retrofit 模式：

```
/design-system retrofit design/gdd/combat-system.md
/architecture-decision retrofit docs/architecture/adr-005.md
```

它们会检测哪些章节存在、哪些缺失，并只填补缺口。

### Gate System

阶段关卡是正式 checkpoint。用转换名称运行 `/gate-check`：

```
/gate-check concept              # Concept -> Systems Design
/gate-check systems-design       # Systems Design -> Technical Setup
/gate-check technical-setup      # Technical Setup -> Pre-Production
/gate-check pre-production       # Pre-Production -> Production
/gate-check production           # Production -> Polish
/gate-check polish               # Polish -> Release
```

**Verdicts：**
- **PASS** -- 所有要求满足，推进到下一阶段
- **CONCERNS** -- 要求满足但存在已确认风险，可通过
- **FAIL** -- 要求未满足，阻止推进并给出具体补救措施

当 gate 通过时，`production/stage.txt` 会被更新（且仅在此时），它控制状态行和 `/help` 行为。

### 反向文档化

对于已有代码但没有设计文档的情况（brownfield adoption 后很常见）：

```
/reverse-document src/gameplay/combat/
```

读取既有代码，并从中生成 GDD 格式设计文档。

---

## 附录 A：代理速查

### “我需要做 X -- 应该用哪个代理？”

| 我需要…… | 代理 | 层级 |
|-------------|-------|------|
| 想出游戏创意 | `/brainstorm` skill | -- |
| 设计游戏机制 | `game-designer` | 2 |
| 设计具体公式/数值 | `systems-designer` | 3 |
| 设计游戏关卡 | `level-designer` | 3 |
| 设计掉落表/经济 | `economy-designer` | 3 |
| 构建世界背景 | `world-builder` | 3 |
| 编写对话 | `writer` | 3 |
| 规划故事 | `narrative-director` | 2 |
| 规划 sprint | `producer` | 1 |
| 做创意决策 | `creative-director` | 1 |
| 做技术决策 | `technical-director` | 1 |
| 实现 gameplay code | `gameplay-programmer` | 3 |
| 实现核心引擎系统 | `engine-programmer` | 3 |
| 实现 AI 行为 | `ai-programmer` | 3 |
| 实现多人游戏 | `network-programmer` | 3 |
| 实现 UI | `ui-programmer` | 3 |
| 构建开发工具 | `tools-programmer` | 3 |
| 审查代码架构 | `lead-programmer` | 2 |
| 创建 shaders / VFX | `technical-artist` | 3 |
| 定义视觉风格 | `art-director` | 2 |
| 定义音频风格 | `audio-director` | 2 |
| 设计音效 | `sound-designer` | 3 |
| 设计 UX flows | `ux-designer` | 3 |
| 编写测试用例 | `qa-tester` | 3 |
| 规划测试策略 | `qa-lead` | 2 |
| 分析性能 | `performance-analyst` | 3 |
| 设置 CI/CD | `devops-engineer` | 3 |
| 设计 analytics | `analytics-engineer` | 3 |
| 检查无障碍 | `accessibility-specialist` | 3 |
| 规划 live operations | `live-ops-designer` | 3 |
| 管理发布 | `release-manager` | 2 |
| 管理本地化 | `localization-lead` | 2 |
| 快速原型 | `prototyper` | 3 |
| 审计安全 | `security-engineer` | 3 |
| 与玩家沟通 | `community-manager` | 3 |
| Godot-specific help | `godot-specialist` | 3 |
| GDScript-specific help | `godot-gdscript-specialist` | 3 |
| Godot shader help | `godot-shader-specialist` | 3 |
| GDExtension modules | `godot-gdextension-specialist` | 3 |
| Unity-specific help | `unity-specialist` | 3 |
| Unity DOTS/ECS | `unity-dots-specialist` | 3 |
| Unity shaders/VFX | `unity-shader-specialist` | 3 |
| Unity Addressables | `unity-addressables-specialist` | 3 |
| Unity UI Toolkit | `unity-ui-specialist` | 3 |
| Unreal-specific help | `unreal-specialist` | 3 |
| Unreal GAS | `ue-gas-specialist` | 3 |
| Unreal Blueprints | `ue-blueprint-specialist` | 3 |
| Unreal replication | `ue-replication-specialist` | 3 |
| Unreal UMG/CommonUI | `ue-umg-specialist` | 3 |

### 代理层级

```
                    creative-director / technical-director / producer
                                         |
          ---------------------------------------------------------------
          |            |           |           |          |        |       |
    game-designer  lead-prog  art-dir  audio-dir  narr-dir  qa-lead  release-mgr
          |            |           |           |          |        |        |
     specialists  programmers  tech-art  snd-design  writer   qa-tester  devops
     (systems,    (gameplay,             (sound)     (world-  (perf,     (analytics,
      economy,     engine,                           builder)  access.)   security)
      level)       ai, net,
                   ui, tools)
```

**升级规则：** 如果两个代理意见不一致，就向上升级。设计冲突交给 `creative-director`。技术冲突交给 `technical-director`。范围冲突交给 `producer`。

---

## 附录 B：斜杠命令速查

### 按类别列出全部 73 个命令

#### Onboarding and Navigation (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/start` | 引导式 onboarding，路由到正确工作流 | Any（第一次会话） |
| `/help` | 上下文感知的“我下一步做什么？” | Any |
| `/project-stage-detect` | 完整项目审计以确定当前阶段 | Any |
| `/setup-engine` | 配置引擎、固定版本、设置偏好 | 1 |
| `/adopt` | Brownfield 审计和迁移计划 | Any（既有项目） |
| `/skill-improve` | 通过 test-fix-retest 循环改进技能 | Any |

#### Game Design (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/brainstorm` | 带 MDA 分析的协作式创意 | 1 |
| `/map-systems` | 将概念分解为系统索引 | 1-2 |
| `/design-system` | 引导式逐章节 GDD 编写 | 2 |
| `/quick-design` | 小变更轻量规格 | 2+ |
| `/review-all-gdds` | 跨 GDD 一致性和设计理论审查 | 2 |
| `/propagate-design-change` | 查找受 GDD 变更影响的 ADR/stories | 5 |

#### UX and Interface (2)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/ux-design` | 编写 UX 规格（screen/flow、HUD、patterns） | 4 |
| `/ux-review` | 验证 UX 规格的无障碍和 GDD 对齐 | 4 |

#### Architecture (4)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/create-architecture` | 主架构文档 | 3 |
| `/architecture-decision` | 创建或 retrofit 一个 ADR | 3 |
| `/architecture-review` | 验证所有 ADR、依赖顺序 | 3 |
| `/create-control-manifest` | 从 Accepted ADR 生成扁平程序员规则 | 3 |

#### Stories and Sprints (8)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/create-epics` | 将 GDD + ADR 转换为 epics（每模块一个） | 4 |
| `/create-stories` | 将单个 epic 拆分为 story 文件 | 4 |
| `/dev-story` | 实现一个 story — 路由到正确程序员代理 | 5 |
| `/sprint-plan` | 创建或管理 sprint plans | 4-5 |
| `/sprint-status` | 快速 30 行 sprint snapshot | 5 |
| `/story-readiness` | 验证 story 是否可实现 | 4-5 |
| `/story-done` | 8 阶段 story 完成审查 | 5 |
| `/estimate` | 带风险评估的工作量估算 | 4-5 |

#### Reviews and Analysis (13)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/design-review` | 根据 8 章节标准验证 GDD | 1-2 |
| `/code-review` | 架构代码审查 | 5+ |
| `/balance-check` | 游戏平衡公式分析 | 5-6 |
| `/asset-audit` | 资源命名、格式、大小验证 | 6 |
| `/asset-spec` | 单资源视觉规格和 AI 生成提示词 | 5-6 |
| `/content-audit` | GDD 指定内容 vs. 已实现内容 | 5 |
| `/consistency-check` | 跨 GDD 实体和公式不一致扫描 | 2+ |
| `/scope-check` | 范围蔓延检测 | 5 |
| `/perf-profile` | 性能分析工作流 | 6 |
| `/tech-debt` | 技术债扫描和优先级排序 | 6 |
| `/gate-check` | 带 PASS/CONCERNS/FAIL 的正式阶段关卡 | All transitions |
| `/reverse-document` | 从既有代码生成设计文档 | Any |
| `/security-audit` | 安全漏洞审计（存档、网络、输入） | 6-7 |

#### QA and Testing (9)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/qa-plan` | 为 sprint 或功能生成 QA 测试计划 | 5 |
| `/smoke-check` | QA hand-off 前的关键路径 smoke test gate | 5-6 |
| `/soak-test` | 长时间游玩会话的 soak test 协议 | 6 |
| `/regression-suite` | 映射测试覆盖，识别缺少回归测试的已修 bug | 5-6 |
| `/test-setup` | 搭建测试框架和 CI/CD pipeline | 4 |
| `/test-helpers` | 生成引擎特定测试 helper 库 | 4-5 |
| `/test-evidence-review` | 测试文件和手动证据的质量审查 | 5 |
| `/test-flakiness` | 从 CI 日志检测非确定性测试 | 5-6 |
| `/skill-test` | 验证技能文件的结构和行为正确性 | Any |

#### Production Management (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/milestone-review` | 里程碑进展和 go/no-go | 5 |
| `/retrospective` | Sprint retrospective 分析 | 5 |
| `/bug-report` | 结构化 bug report 创建 | 5+ |
| `/bug-triage` | 重新评估未解决 bug 的优先级、严重性和 owner | 5+ |
| `/playtest-report` | 结构化 playtest session report | 4-6 |
| `/onboard` | Onboard 新团队成员 | Any |

#### Release (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/release-checklist` | 预发布验证 | 7 |
| `/launch-checklist` | 完整跨部门发布就绪 | 7 |
| `/changelog` | 自动生成内部 changelog | 7 |
| `/patch-notes` | 面向玩家的 patch notes | 7 |
| `/hotfix` | 紧急修复工作流 | 7+ |
| `/day-one-patch` | 针对 gold master 后发现问题的范围化 patch | 7+ |

#### Creative (4)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/prototype` | 概念原型 — 在 GDD 前验证核心想法 | 1 |
| `/art-bible` | 引导式 Art Bible 编写 — 视觉身份规格 | 1-2 |
| `/vertical-slice` | Production 前的生产质量端到端构建 | 4 |
| `/localize` | 字符串提取和验证 | 6-7 |

#### Team Orchestration (9)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/team-combat` | 战斗功能：从设计到实现 | 5 |
| `/team-narrative` | 叙事内容：从结构到对话 | 5 |
| `/team-ui` | UI 功能：从 UX 规格到打磨实现 | 5 |
| `/team-level` | 关卡：从布局到布置遭遇 | 5 |
| `/team-audio` | 音频：从方向到已实现事件 | 5-6 |
| `/team-polish` | 协同打磨：perf + art + audio + QA | 6 |
| `/team-release` | 发布协调：build + QA + deployment | 7 |
| `/team-live-ops` | Live-ops 规划：seasonal events、battle pass、retention | 7+ |
| `/team-qa` | 完整 QA cycle：strategy、execution、coverage、sign-off | 6-7 |

---

## 附录 C：常见工作流

### 工作流 1：“我刚开始，还没有游戏想法”

```
1. /start (routes you based on where you are)
2. /brainstorm (collaborative ideation, pick a concept)
3. /setup-engine (pin engine and version)
4. /design-review on concept doc (optional, recommended)
5. /map-systems (decompose concept into systems with deps and priorities)
6. /gate-check concept (verify you're ready for Systems Design)
7. /design-system per system (guided GDD authoring)
```

### 工作流 2：“我有设计，想开始编码”

```
1. /design-review on each GDD (make sure they're solid)
2. /review-all-gdds (cross-GDD consistency)
3. /gate-check systems-design
4. /create-architecture + /architecture-decision (per major decision)
5. /architecture-review
6. /create-control-manifest
7. /gate-check technical-setup
8. /create-epics layer: foundation + /create-stories [slug] (define epics, break into stories)
9. /sprint-plan new
10. /story-readiness -> implement -> /story-done (story lifecycle)
```

### 工作流 3：“我需要在制作中途添加一个复杂功能”

```
1. /design-system or /quick-design (depending on scope)
2. /design-review to validate
3. /propagate-design-change if modifying existing GDDs
4. /estimate for effort and risk
5. /team-combat, /team-narrative, /team-ui, etc. (appropriate team skill)
6. /story-done when complete
7. /balance-check if it affects game balance
```

### 工作流 4：“生产中有东西坏了”

```
1. /hotfix "description of the issue"
2. Fix is implemented on hotfix branch
3. /code-review the fix
4. Run tests
5. /release-checklist for hotfix build
6. Deploy and backport
```

### 工作流 5：“我有既有项目，想使用这套系统”

```
1. /start (choose Path D -- existing work)
2. /project-stage-detect (determines current phase)
3. /adopt (audits existing artifacts, builds migration plan)
4. /design-system retrofit [path] (fill GDD gaps)
5. /architecture-decision retrofit [path] (fill ADR gaps)
6. /gate-check at appropriate transition
```

### 工作流 6：“开始新的 sprint”

```
1. /retrospective (review last sprint)
2. /sprint-plan new (create next sprint)
3. /scope-check (ensure scope is manageable)
4. /story-readiness per story before pickup
5. Implement stories
6. /story-done per completed story
7. /sprint-status for quick progress checks
```

### 工作流 7：“发布游戏”

```
1. /gate-check polish (verify Polish phase is complete)
2. /tech-debt (decide what's acceptable at launch)
3. /localize (final localization pass)
4. /release-checklist v1.0.0
5. /launch-checklist (full cross-department validation)
6. /team-release (coordinate the release)
7. /patch-notes and /changelog
8. Ship!
9. /hotfix if anything breaks post-launch
10. Post-mortem after launch stabilizes
```

### 工作流 8：“我迷路了 / 不知道下一步做什么”

```
1. /help (reads your phase, checks artifacts, tells you what's next)
2. If /help doesn't help: /project-stage-detect (full audit)
3. If stage seems wrong: /gate-check at the transition you think you're at
```

---

## 充分利用系统的提示

1. **始终先设计，再实现。** 代理系统建立在“写代码前已有设计文档”的假设之上。代理会不断引用 GDD。

2. **对跨领域功能使用团队技能。** 不要尝试手动协调 4 个代理 -- 让 `/team-combat`、`/team-narrative` 等处理编排。

3. **信任规则系统。** 当规则标记你的代码有问题时，修复它。规则编码了来之不易的游戏开发经验（数据驱动值、delta time、无障碍等）。

4. **主动压缩。** 在约 65-70% 上下文使用量时进行 compact 或 `/clear`。pre-compact 钩子会保存你的进度。不要等到接近上限。

5. **使用正确层级的代理。** 不要让 `creative-director` 写 shader。不要让 `qa-tester` 做设计决策。层级结构是有原因的。

6. **不确定时运行 /help。** 它会读取你的实际项目状态，并告诉你最重要的下一步。

7. **在把设计交给程序员前运行 `/design-review`。** 这能尽早发现不完整规格，节省返工。

8. **每个主要功能后运行 `/code-review`。** 在架构问题扩散前捕获它们。

9. **先原型验证高风险机制。** 一天的原型可以避免你在无效机制上浪费一周制作时间。

10. **保持 sprint plans 诚实。** 定期使用 `/scope-check`。范围蔓延是独立游戏的头号杀手。

11. **用 ADR 记录决策。** 未来的你会感谢现在的你记录了事物为何如此构建。

12. **严格使用 story 生命周期。** 接取前 `/story-readiness`，完成后 `/story-done`。这能尽早捕获偏差，并保持流水线诚实。

13. **尽早且频繁写入文件。** 增量章节写入意味着你的设计决策能在崩溃和压缩后保留。文件就是记忆，而不是对话。
