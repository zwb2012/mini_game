# Game Studio Agent Architecture -- 快速入门指南

## 这是什么？

这是一套用于游戏开发的完整 Claude Code agent 架构。它将 49 个专用 AI agents
组织成类似真实游戏开发团队的工作室层级，包含明确的职责、委派规则和协调协议。
它包含 Godot、Unity 和 Unreal 的引擎专家 agents — 每个引擎都有主要子系统的专用 sub-specialists。
所有设计 agents 和 templates 都基于成熟的游戏设计理论（MDA Framework、Self-Determination Theory、
Flow State、Bartle Player Types）。请选择与你项目匹配的引擎组。

## 如何使用

### 1. 理解层级

Agents 分为三层：

- **Tier 1（Opus）**：做出高层决策的 directors
  - `creative-director` -- 愿景与创意冲突解决
  - `technical-director` -- 架构与技术决策
  - `producer` -- 排期、协调和风险管理

- **Tier 2（Sonnet）**：拥有各自领域的部门 leads
  - `game-designer`、`lead-programmer`、`art-director`、`audio-director`、
    `narrative-director`、`qa-lead`、`release-manager`、`localization-lead`

- **Tier 3（Sonnet/Haiku）**：在各自领域内执行的 specialists
  - Designers、programmers、artists、writers、testers、engineers

### 2. 为工作选择正确的 Agent

问自己：“在真实工作室中，哪个部门会处理这件事？”

| I need to... | Use this agent |
|-------------|---------------|
| 设计新机制 | `game-designer` |
| 编写战斗代码 | `gameplay-programmer` |
| 创建 shader | `technical-artist` |
| 编写对白 | `writer` |
| 规划下一个 sprint | `producer` |
| 评审代码质量 | `lead-programmer` |
| 编写测试用例 | `qa-tester` |
| 设计关卡 | `level-designer` |
| 修复性能问题 | `performance-analyst` |
| 设置 CI/CD | `devops-engineer` |
| 设计 loot table | `economy-designer` |
| 解决创意冲突 | `creative-director` |
| 做出架构决策 | `technical-director` |
| 管理 release | `release-manager` |
| 准备翻译字符串 | `localization-lead` |
| 快速测试机制想法 | `prototyper` |
| 审查代码安全问题 | `security-engineer` |
| 检查 accessibility compliance | `accessibility-specialist` |
| 获取 Unreal Engine 建议 | `unreal-specialist` |
| 获取 Unity 建议 | `unity-specialist` |
| 获取 Godot 建议 | `godot-specialist` |
| 设计 GAS abilities/effects | `ue-gas-specialist` |
| 定义 BP/C++ boundaries | `ue-blueprint-specialist` |
| 实现 UE replication | `ue-replication-specialist` |
| 构建 UMG/CommonUI widgets | `ue-umg-specialist` |
| 设计 DOTS/ECS architecture | `unity-dots-specialist` |
| 编写 Unity shaders/VFX | `unity-shader-specialist` |
| 管理 Addressable assets | `unity-addressables-specialist` |
| 构建 UI Toolkit/UGUI screens | `unity-ui-specialist` |
| 编写符合习惯的 GDScript | `godot-gdscript-specialist` |
| 编写 Godot C# code | `godot-csharp-specialist` |
| 创建 Godot shaders | `godot-shader-specialist` |
| 构建 GDExtension modules | `godot-gdextension-specialist` |
| 规划 live events 和 seasons | `live-ops-designer` |
| 为玩家编写 patch notes | `community-manager` |
| 构思新游戏想法 | 使用 `/brainstorm` skill |

### 3. 使用 Slash Commands 完成常见任务

| Command | What it does |
|---------|-------------|
| `/start` | 首次入门 — 询问你当前所处位置，引导到正确工作流 |
| `/help` | 上下文感知的“我下一步该做什么？” — 读取你的当前阶段和 artifacts |
| `/project-stage-detect` | 分析项目状态、检测阶段、识别缺口 |
| `/setup-engine` | 配置 engine + version，填充 reference docs |
| `/adopt` | 针对现有项目的 Brownfield 审计与迁移计划 |
| `/brainstorm` | 从零开始的引导式游戏概念构思 |
| `/map-systems` | 将概念拆解为系统、映射依赖、引导逐系统 GDD |
| `/design-system` | 为单个游戏系统逐章节引导式撰写 GDD |
| `/quick-design` | 小变更的轻量 spec — tuning、tweaks、minor additions |
| `/review-all-gdds` | 跨 GDD 一致性和游戏设计理论评审 |
| `/propagate-design-change` | 查找受 GDD 变更影响的 ADRs 和 stories |
| `/art-bible` | 逐章节引导式 Art Bible 撰写 — 在资产生产前创建视觉身份 spec |
| `/asset-spec` | 从 GDDs 或 character profiles 生成逐资产视觉规格和 AI generation prompts |
| `/ux-design` | 撰写 UX specs（screen/flow、HUD、interaction patterns） |
| `/ux-review` | 验证 UX specs 的 accessibility 和 GDD alignment |
| `/create-architecture` | 游戏 master architecture document |
| `/architecture-decision` | 创建 ADR |
| `/architecture-review` | 验证所有 ADRs、dependency ordering、GDD traceability |
| `/create-control-manifest` | 从 Accepted ADRs 生成扁平 programmer rules sheet |
| `/create-epics` | 将 GDDs + ADRs 转换为 epics（每个 architectural module 一个） |
| `/create-stories` | 将单个 epic 拆分为可实现的 story files |
| `/dev-story` | 读取 story 并实现 — 路由到正确的 programmer agent |
| `/sprint-plan` | 创建或更新 sprint plans |
| `/sprint-status` | 快速 30 行 sprint snapshot |
| `/story-readiness` | 在领取前验证 story 已准备好实现 |
| `/story-done` | Story 完成评审 — 验证 acceptance criteria |
| `/estimate` | 产出结构化工作量估算 |
| `/design-review` | 评审设计文档 |
| `/code-review` | 评审代码质量和架构 |
| `/balance-check` | 分析游戏平衡 data |
| `/asset-audit` | 审计 assets 合规性 |
| `/content-audit` | GDD 指定内容 vs. 已实现内容 — 查找缺口 |
| `/scope-check` | 检测相对计划的 scope creep |
| `/perf-profile` | Performance profiling 和 bottleneck ID |
| `/tech-debt` | 扫描、跟踪并排序 tech debt |
| `/gate-check` | 验证阶段准备度（PASS/CONCERNS/FAIL） |
| `/consistency-check` | 扫描所有 GDDs 的跨文档不一致（冲突 stats、names、rules） |
| `/security-audit` | 审计安全漏洞：save tampering、cheat vectors、network exploits、data exposure |
| `/reverse-document` | 从现有代码生成 design/architecture docs |
| `/milestone-review` | 评审 milestone 进度 |
| `/retrospective` | 运行 sprint/milestone retrospective |
| `/bug-report` | 创建结构化 bug report |
| `/playtest-report` | 创建或分析 playtest feedback |
| `/onboard` | 为某角色生成 onboarding docs |
| `/release-checklist` | 验证 pre-release checklist |
| `/launch-checklist` | 完整 launch readiness validation |
| `/changelog` | 从 git history 生成 changelog |
| `/patch-notes` | 生成面向玩家的 patch notes |
| `/hotfix` | 带 audit trail 的紧急修复 |
| `/day-one-patch` | 为 gold master 后发现的已知问题准备聚焦 day-one patch |
| `/prototype` | 概念原型 — 写 GDD 前验证核心想法（Phase 1） |
| `/vertical-slice` | Production-quality 端到端 build — 验证完整游戏循环（Phase 4） |
| `/localize` | Localization scan、extract、validate |
| `/team-combat` | 编排完整 combat team pipeline |
| `/team-narrative` | 编排完整 narrative team pipeline |
| `/team-ui` | 编排完整 UI team pipeline |
| `/team-release` | 编排完整 release team pipeline |
| `/team-polish` | 编排完整 polish team pipeline |
| `/team-audio` | 编排完整 audio team pipeline |
| `/team-level` | 编排完整 level creation pipeline |
| `/team-live-ops` | 编排 live-ops team，处理 seasons、events 和 post-launch content |
| `/team-qa` | 编排完整 QA team cycle — test plan、test cases、smoke check、sign-off |
| `/qa-plan` | 为 sprint 或 feature 生成 QA test plan |
| `/bug-triage` | 重新排序 open bugs、分配到 sprints、暴露系统性趋势 |
| `/smoke-check` | QA hand-off 前运行 critical path smoke test gate（PASS/FAIL） |
| `/soak-test` | 为长时间 play sessions 生成 soak test protocol |
| `/regression-suite` | 将 coverage 映射到 GDD critical paths、标记 gaps、维护 regression suite |
| `/test-setup` | 为项目引擎搭建 test framework + CI pipeline（运行一次） |
| `/test-helpers` | 生成引擎特定 test helper libraries 和 factory functions |
| `/test-flakiness` | 从 CI history 检测 flaky tests，标记 quarantine 或 fix |
| `/test-evidence-review` | 测试文件和手动 evidence 的质量评审 — ADEQUATE/INCOMPLETE/MISSING |
| `/skill-test` | 验证 skill files 的合规性和正确性（static / spec / audit） |
| `/skill-improve` | 使用 test-fix-retest loop 改进 skill — 诊断、提出修复、重写、验证 |

### 4. 使用 Templates 创建新文档

Templates 位于 `.claude/docs/templates/`：

- `game-design-document.md` -- 用于新 mechanics 和 systems
- `architecture-decision-record.md` -- 用于技术决策
- `architecture-traceability.md` -- 将 GDD requirements 映射到 ADRs 和 story IDs
- `risk-register-entry.md` -- 用于新 risks
- `narrative-character-sheet.md` -- 用于新 characters
- `test-plan.md` -- 用于 feature test plans
- `sprint-plan.md` -- 用于 sprint planning
- `milestone-definition.md` -- 用于新 milestones
- `level-design-document.md` -- 用于新 levels
- `game-pillars.md` -- 用于核心 design pillars
- `art-bible.md` -- 用于视觉风格参考
- `technical-design-document.md` -- 用于逐系统 technical designs
- `post-mortem.md` -- 用于 project/milestone retrospectives
- `sound-bible.md` -- 用于音频风格参考
- `release-checklist-template.md` -- 用于平台 release checklists
- `changelog-template.md` -- 用于面向玩家的 patch notes
- `release-notes.md` -- 用于面向玩家的 release notes
- `incident-response.md` -- 用于 live incident response playbooks
- `game-concept.md` -- 用于初始游戏概念（MDA、SDT、Flow、Bartle）
- `pitch-document.md` -- 用于向 stakeholders pitch 游戏
- `economy-model.md` -- 用于虚拟经济设计（sink/faucet model）
- `faction-design.md` -- 用于 faction identity、lore 和 gameplay role
- `systems-index.md` -- 用于 systems decomposition 和 dependency mapping
- `project-stage-report.md` -- 用于 project stage detection output
- `design-doc-from-implementation.md` -- 用于将现有代码反向文档化为 GDDs
- `architecture-doc-from-code.md` -- 用于将代码反向文档化为 architecture docs
- `concept-doc-from-prototype.md` -- 用于将 prototypes 反向文档化为 concept docs
- `ux-spec.md` -- 用于逐 screen UX specifications（layout zones、states、events）
- `hud-design.md` -- 用于整游戏 HUD philosophy、zones 和 element specs
- `accessibility-requirements.md` -- 用于项目级 accessibility tier 和 feature matrix
- `interaction-pattern-library.md` -- 用于标准 UI controls 和游戏特定 patterns
- `player-journey.md` -- 用于 6 阶段 emotional arc 和按时间尺度划分的 retention hooks
- `difficulty-curve.md` -- 用于 difficulty axes、onboarding ramp 和 cross-system interactions
- `test-evidence.md` -- 用于记录 manual test evidence（screenshots、walkthrough notes）的模板

另有 `.claude/docs/templates/collaborative-protocols/`（供 agents 使用，通常不直接编辑）：

- `design-agent-protocol.md` -- design agents 的 question-options-draft-approval cycle
- `implementation-agent-protocol.md` -- programming agents 的 story pickup 到 /story-done cycle
- `leadership-agent-protocol.md` -- director-tier agents 的 cross-department delegation 和 escalation

### 5. 遵循协调规则

1. 工作沿层级向下流动：Directors -> Leads -> Specialists
2. 冲突沿层级向上升级
3. 跨部门工作由 `producer` 协调
4. Agents 没有委派不得修改其领域之外的文件
5. 所有决策都要记录

## 新项目的第一步

**不知道从哪里开始？** 运行 `/start`。它会询问你当前所处位置，并把你路由到正确工作流。
不会假设你的游戏、引擎或经验水平。

如果你已经知道需要什么，可以直接进入相关路径：

### 路径 A：“我不知道要做什么”

1. **运行 `/start`**（或 `/brainstorm open`）— 引导式创意探索：
   什么让你兴奋、你玩过什么、你的约束
   - 生成 3 个概念，帮助选择一个，定义 core loop 和 pillars
   - 产出 game concept document 并推荐 engine
2. **设置引擎** — 运行 `/setup-engine`（使用 brainstorm 推荐）
   - 配置 CLAUDE.md、检测知识缺口、填充 reference docs
   - 创建 `.claude/docs/technical-preferences.md`，包含 naming conventions、
     performance budgets 和 engine-specific defaults
   - 如果引擎版本新于 LLM 的训练数据，它会从 web 获取当前 docs，确保 agents 建议正确 APIs
3. **验证概念** — 运行 `/design-review design/gdd/game-concept.md`
4. **拆解系统** — 运行 `/map-systems` 映射所有 systems 和 dependencies
5. **设计每个系统** — 运行 `/design-system [system-name]`（或 `/map-systems next`）
   按依赖顺序撰写 GDDs
6. **制作机制原型** — 运行 `/prototype [core-mechanic]`（1–3 天 — 在撰写 GDDs 前）
7. **设计每个系统** — 运行 `/design-system [system-name]`，根据原型发现撰写 GDDs
8. **规划第一个 sprint** — 架构和 `/vertical-slice` 后，运行 `/sprint-plan new`
9. 开始构建

### 路径 B：“我知道想做什么”

如果你已有游戏概念和引擎选择：

1. **设置引擎** — 运行 `/setup-engine [engine] [version]`
   （例如 `/setup-engine godot 4.6`）— 也会创建 technical preferences
2. **编写 Game Pillars** — 委派给 `creative-director`
3. **拆解系统** — 运行 `/map-systems` 枚举 systems 和 dependencies
4. **设计每个系统** — 运行 `/design-system [system-name]` 按依赖顺序撰写 GDDs
5. **创建初始 ADR** — 运行 `/architecture-decision`
6. 在 `production/milestones/` 中**创建第一个 milestone**
7. **规划第一个 sprint** — 运行 `/sprint-plan new`
8. 开始构建

### 路径 C：“我知道游戏，但不知道引擎”

如果你有概念但不知道哪种引擎合适：

1. **不带参数运行 `/setup-engine`** — 它会询问你的游戏需求
   （2D/3D、platforms、team size、language preferences），并根据回答推荐引擎
2. 从路径 B 的第 2 步继续

### 路径 D：“我有现有项目”

如果你已有 design docs、prototypes 或 code：

1. **运行 `/start`**（或 `/project-stage-detect`）— 分析已有内容、
   识别缺口并推荐下一步
2. **如果你已有 GDDs、ADRs 或 stories，运行 `/adopt`** — 审计
   内部格式合规性，并建立编号迁移计划，在不覆盖现有工作的情况下填补缺口
3. **如需配置引擎** — 若尚未配置，运行 `/setup-engine`
4. **验证阶段准备度** — 运行 `/gate-check` 查看当前状态
5. **规划下一个 sprint** — 运行 `/sprint-plan new`

## 文件结构参考

```
CLAUDE.md                          -- 主配置（先读这个，约 60 行）
.claude/
  settings.json                    -- Claude Code hooks 和项目设置
  agents/                          -- 49 个 agent definitions（YAML frontmatter）
  skills/                          -- 73 个 slash command definitions（YAML frontmatter）
  hooks/                           -- settings.json 连接的 12 个 hook scripts（.sh）
  rules/                           -- 11 个 path-specific rule files
  docs/
    quick-start.md                 -- 本文件
    technical-preferences.md       -- 项目特定标准（由 /setup-engine 填充）
    coding-standards.md            -- 编码和设计文档标准
    coordination-rules.md          -- Agent 协调规则
    context-management.md          -- 上下文预算和压缩说明
    directory-structure.md         -- 项目目录布局
    workflow-catalog.yaml          -- 7 阶段 pipeline definition（由 /help 读取）
    setup-requirements.md          -- 系统先决条件（Git Bash、jq、Python）
    settings-local-template.md     -- 个人 settings.local.json 指南
    templates/                     -- 41 个 document templates
```
