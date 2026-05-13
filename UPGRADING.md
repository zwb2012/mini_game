# 升级 Claude Code Game Studios

本指南说明如何将你现有的游戏项目仓库从模板的一个版本升级到下一个版本。

**在 git 日志中查找当前版本**：
```bash
git log --oneline | grep -i "release\|setup"
```
或者检查 `README.md` 中的版本徽章。

---

## 目录

- [升级策略](#upgrade-strategies)
- [v1.0.0-beta → v1.0](#v100-beta--v10)
- [v0.4.x → v1.0](#v04x--v10)
- [v0.4.0 → v0.4.1](#v040--v041)
- [v0.3.0 → v0.4.0](#v030--v040)
- [v0.2.0 → v0.3.0](#v020--v030)
- [v0.1.0 → v0.2.0](#v010--v020)

---

## 升级策略

有三种方式可以拉取模板更新。请根据你的仓库设置选择。

### 策略 A — Git Remote Merge（推荐）

适用场景：你克隆了模板，并在其之上拥有自己的提交。

```bash
# 将模板添加为远程仓库（一次性设置）
git remote add template https://github.com/Donchitos/Claude-Code-Game-Studios.git

# 拉取新版本
git fetch template main

# 合并到你的分支
git merge template/main --allow-unrelated-histories
```

Git 只会在模板和你都修改过的文件中标记冲突。逐一解决冲突——保留你的游戏内容，同时带入结构性改进。然后提交此次合并。

**提示：** 最容易冲突的文件是 `CLAUDE.md` 和 `.claude/docs/technical-preferences.md`，因为你已经在其中填写了引擎和项目设置。保留你的内容；接受结构性变更。

---

### 策略 B — Cherry-pick 指定提交

适用场景：你只想要某个特定功能（例如只要新技能，不要完整更新）。

```bash
git remote add template https://github.com/Donchitos/Claude-Code-Game-Studios.git
git fetch template main

# Cherry-pick 你想要的特定提交
git cherry-pick <commit-sha>
```

每个版本的提交 SHA 都列在下方版本章节中。

---

### 策略 C — 手动复制文件

适用场景：你没有使用 git 设置模板（只是下载了 zip）。

1. 在你的仓库旁边下载或克隆新版本。
2. 直接复制 **"Safe to overwrite"** 下列出的文件。
3. 对于 **"Merge carefully"** 下的文件，并排打开两个版本，在保留你内容的同时手动合并结构性变更。

---

## v0.4.1

**Released:** 2026-04-02
**Key themes:** 美术指导集成，资产规格流水线

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能** | `/art-bible` — 分章节引导式视觉身份创作（9 个章节）。每个章节必须生成 art-director Task。AD-ART-BIBLE 签核门禁。Technical Setup 阶段必需。 |
| **新技能** | `/asset-spec` — 单资产视觉规格与 AI 生成提示生成器。读取 art bible + GDD/level/character 文档。写入 `design/assets/specs/` 文件和 `design/assets/asset-manifest.md`。支持 full/lean/solo 模式。 |
| **新总监门禁 (3)** | `AD-CONCEPT-VISUAL`（brainstorm Phase 4）、`AD-ART-BIBLE`（art bible 签核）、`AD-PHASE-GATE`（gate-check 面板） |
| **`/brainstorm` 更新** | 向 allowed-tools 添加了 `Task`（之前缺失，阻塞了所有总监生成）。art-director 现在会在 pillars 锁定后与 creative-director 并行生成。Visual Identity Anchor 写入 game-concept.md。 |
| **`/gate-check` 更新** | art-director 作为第 4 个并行总监加入（AD-PHASE-GATE）。视觉产物检查：Visual Identity Anchor（Concept 门禁）、art bible（Technical Setup 门禁）、AD-ART-BIBLE 签核 + 角色视觉档案（Pre-Production 门禁）。 |
| **`/team-level` 更新** | art-director 加入 Step 1 并行生成（布局之前的视觉方向）。level-designer 现在会把 art-director 目标作为明确约束接收。Step 4 art-director 角色修正为仅 production-concepts。 |
| **`/team-narrative` 更新** | art-director 加入 Phase 2 并行生成（角色视觉设计、环境叙事、电影化基调）。 |
| **`/design-system` 更新** | 路由表扩展，Combat、UI、Dialogue、Animation/VFX、Character 类别加入 art-director + technical-artist。Visual/Audio 章节现在对 7 个系统类别为必需（并生成 art-director Task）。 |
| **`workflow-catalog.yaml`** | `/art-bible` 加入 Technical Setup（必需）。`/asset-spec` 加入 Pre-Production（可选，可重复）。 |

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/skills/art-bible/SKILL.md
.claude/skills/asset-spec/SKILL.md
.claude/docs/director-gates.md
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/brainstorm/SKILL.md
.claude/skills/gate-check/SKILL.md
.claude/skills/team-level/SKILL.md
.claude/skills/team-narrative/SKILL.md
.claude/skills/design-system/SKILL.md
.claude/docs/workflow-catalog.yaml
README.md
UPGRADING.md
```

### 文件：Merge Carefully

无——所有变更都属于基础设施文件，没有用户内容。

---

## v1.0.0-beta → v1.0

**Released:** 2026-05-13
**Commit range:** `49d1e45..HEAD`
**Key themes:** 新 `/vertical-slice` 门禁、技能打磨与 bug 修复、贡献者文档

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能** | `/vertical-slice` — Pre-Production 门禁，在进入 Production 前用生产质量的端到端构建验证完整游戏循环。与全面改造后的 `/prototype` 配套（在 `/brainstorm` 后立即进行概念验证）。 |
| **新流程** | `/map-systems` 中的实体清点步骤——预先暴露所有命名实体，使下游 GDD 创作更清晰。 |
| **UX 打磨** | 向 7 个技能添加缺失的 `AskUserQuestion` widgets；对一致性、提示和流程缺口进行全面技能审计；为所有 `team-*` 技能在 `argument-hints` 中暴露 `--review` 标志。 |
| **Bug 修复** | `#21` log-agent 钩子记录了 "unknown" `agent_type`；`#36` `/architecture-decision` 和 `/story-done` 缺少 `allowed-tools`；`#42` `rg --type gdscript` 无效（现在使用 `--glob *.gd`）；`#43` session-start 预览显示最旧状态而不是最新状态；`#45` `/architecture-decision` 中重复的 `## 0.` 标题和损坏的步骤编号。 |
| **项目文档** | 添加 `CONTRIBUTING.md`（框架贡献指南）和 `SECURITY.md`（协调披露政策）。 |
| **计数/引用** | 同步 `WORKFLOW-GUIDE.md`、`README.md` 和代理名册中的代理/技能/钩子计数；修复过时代理名称和技能 model-tier 字段。 |

---

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/skills/vertical-slice/SKILL.md
CONTRIBUTING.md
SECURITY.md
```

**可覆盖的现有文件（无用户内容）：**
- 提交范围内修改的所有 `.claude/skills/` 文件（技能审计 + AskUserQuestion widgets + `--review` argument-hints）
- `.claude/hooks/log-agent.sh`（修复 #21）
- `README.md`、`docs/WORKFLOW-GUIDE.md`、`docs/examples/skill-flow-diagrams.md`
- `UPGRADING.md`

---

### 文件：Merge Carefully

无——所有变更都属于基础设施文件，没有用户内容。

---

## v0.4.x → v1.0

**Released:** 2026-03-29
**Commit range:** `6c041ac..HEAD`
**Key themes:** 总监门禁系统、门禁强度模式、Godot C# 专家

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新系统** | 总监门禁——所有工作流技能共享的命名评审检查点。定义在 `.claude/docs/director-gates.md` 中 |
| **新功能** | 门禁强度模式：`full`（所有总监门禁）、`lean`（仅阶段门禁）、`solo`（无总监）。可在 `/start` 期间通过 `production/review-mode.txt` 全局设置，或在任何使用门禁的技能上用 `--review [mode]` 单次覆盖 |
| **新代理** | `godot-csharp-specialist` — Godot 4 项目中的 C# 代码质量 |
| **技能更新 (13)** | 所有使用门禁的技能现在都会解析 `--review [full\|lean\|solo]` 并将其包含在 argument-hint 中：`brainstorm`、`map-systems`、`design-system`、`architecture-decision`、`create-architecture`、`create-epics`、`create-stories`、`sprint-plan`、`milestone-review`、`playtest-report`、`prototype`、`story-done`、`gate-check` |
| **`/start` 更新** | 添加 Phase 3b——在入门流程中设置 review mode，写入 `production/review-mode.txt` |
| **`/setup-engine` 更新** | Godot 的语言选择步骤（GDScript vs C#） |
| **文档** | `director-gates.md`——完整门禁目录；`WORKFLOW-GUIDE.md`——Director Review Modes 章节；`README.md`——评审强度自定义 |

---

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/agents/godot-csharp-specialist.md
.claude/docs/director-gates.md
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/brainstorm/SKILL.md
.claude/skills/map-systems/SKILL.md
.claude/skills/design-system/SKILL.md
.claude/skills/architecture-decision/SKILL.md
.claude/skills/create-architecture/SKILL.md
.claude/skills/create-epics/SKILL.md
.claude/skills/create-stories/SKILL.md
.claude/skills/sprint-plan/SKILL.md
.claude/skills/milestone-review/SKILL.md
.claude/skills/playtest-report/SKILL.md
.claude/skills/prototype/SKILL.md
.claude/skills/story-done/SKILL.md
.claude/skills/gate-check/SKILL.md
.claude/skills/start/SKILL.md
.claude/skills/quick-design/SKILL.md
.claude/skills/setup-engine/SKILL.md
README.md
docs/WORKFLOW-GUIDE.md
UPGRADING.md
```

---

### 文件：Merge Carefully

此版本没有需要手动合并的文件。所有变更都属于基础设施文件，没有用户内容。

---

### 新功能

#### 总监门禁系统

所有主要工作流技能现在都会引用定义在 `.claude/docs/director-gates.md` 中的命名门禁检查点。门禁以领域前缀和名称标识（例如 `CD-CONCEPT`、`TD-ARCHITECTURE`、`LP-CODE-REVIEW`）。每个门禁定义要生成哪个总监、传入哪些输入、verdict 的含义，以及 lean/solo 模式如何影响它。

技能使用带门禁 ID 和文档化输入的 `Task` 生成门禁，而不是在技能正文中嵌入总监提示。这让技能正文保持简洁，并使门禁行为在所有工作流阶段保持一致。

#### 门禁强度模式

三种模式可控制你获得多少总监评审：

- **`full`**（默认）——在每个评审检查点运行所有总监门禁
- **`lean`** —— 跳过每个技能内的总监评审；`/gate-check` 的阶段门禁仍会运行
- **`solo`** —— 不运行任何总监门禁；`/gate-check` 只检查产物是否存在

在 `/start` 期间全局设置（写入 `production/review-mode.txt`）。也可在任何使用门禁的技能上用 `--review [mode]` 覆盖单次运行：

```
/design-system combat --review lean
/gate-check concept --review full
/brainstorm my-game-idea --review solo
```

---

### 升级后

1. 运行一次 `/start` 以设置你偏好的 review mode——或手动创建 `production/review-mode.txt`，内容为 `full`、`lean` 或 `solo`。
2. 如果你正处于项目中途，请查看 `.claude/docs/director-gates.md`，了解哪些门禁适用于当前阶段。
3. 运行 `/skill-test static all`，验证所有技能都通过结构检查。

---

## v0.4.0 → v0.4.1

**Released:** 2026-03-26
**Commit range:** `04ed5d5..HEAD`
**Key themes:** 类型无关代理、新技能、技能修复

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能 (1)** | `/consistency-check` — 跨 GDD 实体一致性扫描器 |
| **技能修复（所有 team-*）** | 添加无参数保护、正式 `Verdict: COMPLETE / BLOCKED` 关键词、每步 AskUserQuestion 门禁、相邻区域依赖检查（team-level）、伦理执行（team-live-ops）、带 Phase 跳过的 NO-GO 路径（team-release） |
| **代理修复 (4)** | game-designer、systems-designer、economy-designer、live-ops-designer 中的类型无关语言——移除 RPG 特定术语 |

---

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/skills/consistency-check/SKILL.md
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/team-combat/SKILL.md      ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/team-narrative/SKILL.md   ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/team-ui/SKILL.md          ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/team-release/SKILL.md     ← 无参数保护、verdict 关键词、NO-GO 路径
.claude/skills/team-polish/SKILL.md      ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/team-audio/SKILL.md       ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/team-level/SKILL.md       ← 无参数保护、verdict 关键词、相邻区域检查
.claude/skills/team-live-ops/SKILL.md    ← 无参数保护、verdict 关键词、伦理执行
.claude/skills/team-qa/SKILL.md          ← 无参数保护、verdict 关键词、门禁改进
.claude/skills/map-systems/SKILL.md      ← verdict 关键词
.claude/skills/create-epics/SKILL.md     ← "May I write" 协议修复、verdict 关键词
.claude/skills/create-stories/SKILL.md   ← verdict 关键词
.claude/agents/game-designer.md          ← 类型无关语言
.claude/agents/systems-designer.md       ← 类型无关语言
.claude/agents/economy-designer.md       ← 类型无关语言
.claude/agents/live-ops-designer.md      ← 类型无关语言
```

---

### 文件：Merge Carefully

此版本没有需要手动合并的文件。所有变更都属于基础设施文件，没有用户内容。

---

### 升级后

1. 运行 `/skill-test catalog`，验证所有技能都已编入索引。
2. 在任何技能编辑后运行 `/skill-test lint [skill-name]`，检查结构合规性。
3. 如果你自定义过任何 team-* 技能，请检查更新后的版本——无参数保护和 `Verdict:` 关键词现在是所有 team-* 技能的必需项。

---

## v0.3.0 → v0.4.0

**Released:** 2026-03-21
**Commit range:** `b1cad29..HEAD`
**Key themes:** 完整 UX/UI 流水线、完整故事生命周期、brownfield 采用、综合 QA/测试框架、流水线完整性、29 个新技能

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能 (17)** | `/ux-design`、`/ux-review`、`/help`、`/quick-design`、`/review-all-gdds`、`/story-readiness`、`/story-done`、`/sprint-status`、`/adopt`、`/create-architecture`、`/create-control-manifest`、`/create-epics`、`/create-stories`、`/dev-story`、`/propagate-design-change`、`/content-audit`、`/architecture-review` |
| **新 QA 技能 (12)** | `/qa-plan`、`/smoke-check`、`/soak-test`、`/regression-suite`、`/test-setup`、`/test-helpers`、`/test-evidence-review`、`/test-flakiness`、`/skill-test`、`/bug-triage`、`/team-live-ops`、`/team-qa` |
| **新钩子 (4)** | `log-agent-stop.sh` — 代理审计轨迹停止；`notify.sh` — Windows toast 通知；`post-compact.sh` — 压缩后的会话恢复提醒；`validate-skill-change.sh` — 技能编辑后建议 `/skill-test` |
| **新模板 (8)** | `ux-spec.md`、`hud-design.md`、`accessibility-requirements.md`、`interaction-pattern-library.md`、`player-journey.md`、`difficulty-curve.md`，以及 2 个采用计划模板 |
| **新基础设施** | `workflow-catalog.yaml`（7 阶段流水线，由 `/help` 读取）、`docs/architecture/tr-registry.yaml`（稳定 TR-ID）、`production/sprint-status.yaml` schema |
| **技能更新** | `/gate-check` — 3 个门禁现在要求 UX 产物；Pre-Production 门禁要求 vertical slice（HARD gate） |
| **技能更新** | `/sprint-plan` — 写入 `sprint-status.yaml`；`/sprint-status` 读取它 |
| **技能更新** | `/story-done` — 8 阶段完成评审，更新故事文件，浮现下一个 ready story |
| **技能更新** | `/design-review` — 移除架构缺口检查（阶段错误） |
| **技能更新** | `/team-ui` — 完整 UX 流水线（ux-design → ux-review → team phases） |
| **代理更新** | 14 个专家代理——添加 `memory: project` |
| **代理更新** | `prototyper` — `isolation: worktree`（在隔离 git 分支中进行一次性工作） |
| **模型路由** | Haiku/Sonnet/Opus 层级分配记录在 coordination rules；技能在 frontmatter 中声明其层级 |
| **目录 CLAUDE.md** | 搭建 `design/CLAUDE.md`、`src/CLAUDE.md`、`docs/CLAUDE.md`——每个目录的路径范围说明 |
| **流水线完整性** | TR-ID 稳定性、manifest 版本化、ADR 状态门禁、TR-ID 引用而非引用文本 |
| **GDD 模板** | 添加 `## Game Feel` 章节（输入响应性、动画目标、冲击时刻） |

---

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/skills/ux-design/SKILL.md
.claude/skills/ux-review/SKILL.md
.claude/skills/help/SKILL.md
.claude/skills/quick-design/SKILL.md
.claude/skills/review-all-gdds/SKILL.md
.claude/skills/story-readiness/SKILL.md
.claude/skills/story-done/SKILL.md
.claude/skills/sprint-status/SKILL.md
.claude/skills/adopt/SKILL.md
.claude/skills/create-architecture/SKILL.md
.claude/skills/create-control-manifest/SKILL.md
.claude/skills/create-epics/SKILL.md
.claude/skills/create-stories/SKILL.md
.claude/skills/dev-story/SKILL.md
.claude/skills/propagate-design-change/SKILL.md
.claude/skills/content-audit/SKILL.md
.claude/skills/architecture-review/SKILL.md
.claude/skills/qa-plan/SKILL.md
.claude/skills/smoke-check/SKILL.md
.claude/skills/soak-test/SKILL.md
.claude/skills/regression-suite/SKILL.md
.claude/skills/test-setup/SKILL.md
.claude/skills/test-helpers/SKILL.md
.claude/skills/test-evidence-review/SKILL.md
.claude/skills/test-flakiness/SKILL.md
.claude/skills/skill-test/SKILL.md
.claude/skills/bug-triage/SKILL.md
.claude/skills/team-live-ops/SKILL.md
.claude/skills/team-qa/SKILL.md
.claude/hooks/log-agent-stop.sh
.claude/hooks/notify.sh
.claude/hooks/post-compact.sh
.claude/hooks/validate-skill-change.sh
.claude/docs/workflow-catalog.yaml
.claude/docs/templates/ux-spec.md
.claude/docs/templates/hud-design.md
.claude/docs/templates/accessibility-requirements.md
.claude/docs/templates/interaction-pattern-library.md
.claude/docs/templates/player-journey.md
.claude/docs/templates/difficulty-curve.md
design/CLAUDE.md
src/CLAUDE.md
docs/CLAUDE.md
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/gate-check/SKILL.md
.claude/skills/sprint-plan/SKILL.md
.claude/skills/sprint-status/SKILL.md
.claude/skills/design-review/SKILL.md
.claude/skills/team-ui/SKILL.md
.claude/skills/story-readiness/SKILL.md
.claude/skills/story-done/SKILL.md
.claude/docs/templates/game-design-document.md    ← 添加 Game Feel 章节
README.md
docs/WORKFLOW-GUIDE.md
UPGRADING.md
```

**可覆盖的代理文件**（如果你没有向其中写入自定义提示）：
```
.claude/agents/prototyper.md         ← 添加 isolation: worktree
.claude/agents/art-director.md       ← 添加 memory: project
.claude/agents/audio-director.md     ← 添加 memory: project
.claude/agents/economy-designer.md   ← 添加 memory: project
.claude/agents/game-designer.md      ← 添加 memory: project
.claude/agents/gameplay-programmer.md ← 添加 memory: project
.claude/agents/lead-programmer.md    ← 添加 memory: project
.claude/agents/level-designer.md     ← 添加 memory: project
.claude/agents/narrative-director.md ← 添加 memory: project
.claude/agents/systems-designer.md   ← 添加 memory: project
.claude/agents/technical-artist.md   ← 添加 memory: project
.claude/agents/ui-programmer.md      ← 添加 memory: project
.claude/agents/ux-designer.md        ← 添加 memory: project
.claude/agents/world-builder.md      ← 添加 memory: project
```

---

### 文件：Merge Carefully

#### `.claude/settings.json`

此版本注册了四个新钩子。如果你没有自定义 `settings.json`，覆盖是安全的。否则，请手动添加以下钩子条目：

- `log-agent-stop.sh` — `SubagentStop` 事件（代理审计轨迹停止）
- `notify.sh` — `Notification` 事件（Windows toast 通知）
- `post-compact.sh` — `PostCompact` 事件（会话恢复提醒）
- `validate-skill-change.sh` — 过滤到 `.claude/skills/` 写入的 `PostToolUse` 事件

#### 已自定义的代理文件

如果你向代理 `.md` 文件添加了项目特定知识，请进行 diff，并在适当位置手动向 YAML frontmatter 添加 `memory: project` 行。creative 和 technical director 代理有意保留 `memory: user`——只有专家代理使用 `memory: project`。

---

### 新功能

#### 完整故事生命周期

故事现在拥有由两个技能强制执行的正式生命周期：

- **`/story-readiness`** —— 在开发者接手前验证故事是否已可实现。检查 Design（已链接 GDD req）、Architecture（ADR 已接受）、Scope（criteria 可测试）和 DoD（manifest 版本当前）。Verdict: READY / NEEDS WORK / BLOCKED。
- **`/story-done`** —— 实现后的 8 阶段完成评审。验证每个 acceptance criterion，检查 GDD/ADR 偏差，提示进行 code review，将故事文件更新为 `Status: Complete`，并浮现下一个 ready story。

流程：`/story-readiness` → implement → `/story-done` → next story

#### 完整 UX/UI 流水线

- **`/ux-design`** —— 分章节引导式 UX 规格创作。三种模式：screen/flow、HUD 或 interaction pattern library。读取 GDD UI requirements 和 player journey。输出到 `design/ux/`。
- **`/ux-review`** —— 根据 GDD 对齐、无障碍层级和 pattern library 验证 UX 规格。Verdict: APPROVED / NEEDS REVISION / MAJOR REVISION。
- **`/team-ui`** 已更新：Phase 1 现在会先运行 `/ux-design` + `/ux-review` 作为 hard gate，然后才开始视觉设计。

#### Brownfield 采用

**`/adopt`** 将现有项目接入模板格式。审计 GDD、ADR、stories、systems-index 和 infra 的内部结构。对缺口分类（BLOCKING/HIGH/MEDIUM/LOW）。构建有序迁移计划。绝不重新生成现有产物——只填补缺口。

参数模式：`full | gdds | adrs | stories | infra`

另外：`/design-system retrofit [path]` 和 `/architecture-decision retrofit [path]` 会检测现有文件并只添加缺失章节。

#### 冲刺跟踪 YAML

`production/sprint-status.yaml` 现在是权威的故事跟踪格式：
- 由 `/sprint-plan` 写入（初始化所有故事）并由 `/story-done` 写入（设置 status 为 `done`）
- 由 `/sprint-status` 读取（快速快照）并由 `/help` 读取（production 阶段的逐故事状态）
- 状态值：`backlog | ready-for-dev | in-progress | review | done | blocked`
- 如果文件不存在，会优雅回退到 markdown 扫描

#### `/help` — 上下文感知的下一步

`/help` 读取你的当前阶段和进行中的工作，检查哪些产物已完成，并准确告诉你下一步要做什么——一个主要必需步骤，外加可选机会。它不同于 `/start`（仅首次使用）和 `/project-stage-detect`（完整审计）。

#### 综合 QA 和测试框架

九个新的 QA/测试技能覆盖完整测试生命周期：

- **`/test-setup`** —— 为你的引擎搭建测试框架和 CI/CD 流水线
- **`/test-helpers`** —— 生成引擎特定测试辅助库（GDUnit4、NUnit 等）
- **`/qa-plan`** —— 为冲刺或功能生成 QA 测试计划，按测试类型分类 stories
- **`/smoke-check`** —— 在 QA 交接前运行关键路径 smoke test gate
- **`/soak-test`** —— 为长时间游玩会话生成 soak test 协议（稳定性、内存泄漏）
- **`/regression-suite`** —— 将测试覆盖映射到 GDD 关键路径，识别缺少回归测试的已修复 bug
- **`/test-evidence-review`** —— 对测试文件和手动证据文档进行质量评审
- **`/test-flakiness`** —— 通过读取 CI run logs 检测非确定性测试
- **`/skill-test`** —— 验证技能文件的结构合规性和行为正确性（三种模式：lint、spec、catalog）

另外新增：**`/bug-triage`** 会重新评估所有开放 bug 的优先级、严重性和归属。

#### 技能验证器（`/skill-test`）

`/skill-test` 是用于验证 harness 本身的元技能。编辑任何技能文件后运行它。三种模式：
- `lint` —— 验证 YAML frontmatter 和必填字段
- `spec [skill-name]` —— 针对特定技能运行行为规格测试
- `catalog` —— 检查 `.claude/skills/` 中的所有技能都已在目录中建立索引

新的 `validate-skill-change.sh` 钩子会在技能文件被修改时自动提醒你运行 `/skill-test`。

#### Team Live-Ops 和 Team QA 编排

- **`/team-live-ops`** —— 协调 live-ops-designer + economy-designer + community-manager + analytics-engineer 进行发布后内容规划（季节活动、battle pass、留存）
- **`/team-qa`** —— 通过完整 QA 周期编排 qa-lead + qa-tester + gameplay-programmer + producer：策略、执行、覆盖和签核

#### 模型层级路由

技能现在会根据任务复杂度明确分配到 Haiku、Sonnet 或 Opus 层级。只读状态检查使用 Haiku；复杂多文档综合使用 Opus；其他所有内容默认使用 Sonnet。层级分配记录在 `.claude/docs/coordination-rules.md` 中。

#### 目录 CLAUDE.md 文件

三个新的目录范围 CLAUDE.md 文件（`design/`、`src/`、`docs/`）为在这些目录中工作的代理提供路径特定说明。当 Claude Code 读取该目录中的文件时，这些说明会自动加载。

---

### 升级后

1. **验证新钩子** 已注册到 `.claude/settings.json`——检查全部四个：`log-agent-stop.sh`、`notify.sh`、`post-compact.sh`、`validate-skill-change.sh`。

2. **测试审计轨迹**：生成任意子代理——start 和 stop 事件都应出现在 `production/session-logs/` 中。

3. 如果你处于活跃 production，**生成 sprint-status.yaml**：
   ```
   /sprint-plan status
   ```

4. 如果你有早于此模板版本的现有 GDD 或 ADR，**运行 `/adopt`**——它会识别需要添加哪些章节，而不会覆盖你的内容。

5. 在任何技能编辑后用 `/skill-test` **验证你的技能**——新的 `validate-skill-change.sh` 钩子会自动提醒你这样做。

---

## v0.2.0 → v0.3.0

**Released:** 2026-03-09
**Commit range:** `e289ce9..HEAD`
**Key themes:** `/design-system` GDD 创作、`/map-systems` 重命名、自定义状态行

### 破坏性变更

#### `/design-systems` 重命名为 `/map-systems`

`/design-systems` 技能被重命名为 `/map-systems`，以提高清晰度（decomposing = *mapping*，而不是 *designing*）。

**必需操作：** 更新任何调用 `/design-systems` 的文档、笔记或脚本。新的调用方式是 `/map-systems`。

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能** | `/design-system`（分章节引导式 GDD 创作） |
| **重命名技能** | `/design-systems` → `/map-systems`（破坏性重命名） |
| **新文件** | `.claude/statusline.sh`、`.claude/settings.json` statusline 配置 |
| **技能更新** | `/gate-check` — 在 PASS 时写入 `production/stage.txt`，新阶段定义 |
| **技能更新** | `brainstorm`、`start`、`design-review`、`project-stage-detect`、`setup-engine` — 交叉引用修复 |
| **Bug 修复** | `log-agent.sh`、`validate-commit.sh` — 钩子执行修复 |
| **文档** | 添加 `UPGRADING.md`，更新 `README.md`、`WORKFLOW-GUIDE.md` |

---

### 文件：Safe to Overwrite

**要添加的新文件：**
```
.claude/skills/design-system/SKILL.md
.claude/statusline.sh
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/map-systems/SKILL.md      ← 原 design-systems/SKILL.md
.claude/skills/gate-check/SKILL.md
.claude/skills/brainstorm/SKILL.md
.claude/skills/start/SKILL.md
.claude/skills/design-review/SKILL.md
.claude/skills/project-stage-detect/SKILL.md
.claude/skills/setup-engine/SKILL.md
.claude/hooks/log-agent.sh
.claude/hooks/validate-commit.sh
README.md
docs/WORKFLOW-GUIDE.md
UPGRADING.md
```

**删除（被重命名替代）：**
```
.claude/skills/design-systems/   ← 整个目录；由 map-systems/ 替代
```

---

### 文件：Merge Carefully

#### `.claude/settings.json`

新版本添加了指向 `.claude/statusline.sh` 的 `statusLine` 配置块。如果你没有自定义 `settings.json`，覆盖是安全的。否则，请手动添加此块：

```json
"statusLine": {
  "script": ".claude/statusline.sh"
}
```

---

### 新功能

#### 自定义状态行

`.claude/statusline.sh` 会在终端状态行中显示 7 阶段制作流水线面包屑：

```
ctx: 42% | claude-sonnet-4-6 | Systems Design
```

在 Production/Polish/Release 阶段，如果 `production/session-state/active.md` 中存在 `<!-- STATUS -->` 块，它还会显示活跃的 Epic/Feature/Task：

```
ctx: 42% | claude-sonnet-4-6 | Production | Combat System > Melee Combat > Hitboxes
```

当前阶段会从项目产物自动检测，也可以通过向 `production/stage.txt` 写入阶段名称来固定。

#### `/gate-check` 阶段推进

当 gate PASS verdict 被确认时，`/gate-check` 现在会将新阶段名称写入 `production/stage.txt`。这会立即更新所有未来会话的状态行，无需手动编辑文件。

---

### 升级后

1. **删除旧技能目录：**
   ```bash
   rm -rf .claude/skills/design-systems/
   ```

2. **测试状态行**：启动 Claude Code 会话——你应该会在终端页脚看到阶段面包屑。

3. **验证钩子执行** 仍然有效：
   ```bash
   bash .claude/hooks/log-agent.sh '{}' '{}'
   bash .claude/hooks/validate-commit.sh '{}' '{}'
   ```

---

## v0.1.0 → v0.2.0

**Released:** 2026-02-21
**Commit range:** `ad540fe..e289ce9`
**Key themes:** 上下文韧性、AskUserQuestion 集成、`/map-systems` 技能

### 变更内容

| 类别 | 变更 |
|----------|---------|
| **新技能** | `/start`（入门）、`/map-systems`（系统拆解）、`/design-system`（引导式 GDD 创作） |
| **新钩子** | `session-start.sh`（恢复）、`detect-gaps.sh`（缺口检测） |
| **新模板** | `systems-index.md`、3 个 collaborative-protocol 模板 |
| **上下文管理** | 大幅重写——添加基于文件的状态策略 |
| **代理更新** | 14 个设计/创意代理——AskUserQuestion 集成 |
| **技能更新** | 全部 7 个 `team-*` 技能 + `brainstorm`——在阶段转换处使用 AskUserQuestion |
| **CLAUDE.md** | 从约 159 行精简到约 60 行；用 5 个文档导入替代 10 个 |
| **钩子更新** | 全部 8 个钩子——Windows 兼容性修复、新功能 |
| **移除文档** | `docs/IMPROVEMENTS-PROPOSAL.md`、`docs/MULTI-STAGE-DOCUMENT-WORKFLOW.md` |

---

### 文件：Safe to Overwrite

这些都是纯基础设施——你没有自定义它们。可以直接复制新版本，不会影响你的项目内容。

**要添加的新文件：**
```
.claude/skills/start/SKILL.md
.claude/skills/map-systems/SKILL.md
.claude/skills/design-system/SKILL.md
.claude/docs/templates/systems-index.md
.claude/docs/templates/collaborative-protocols/design-agent-protocol.md
.claude/docs/templates/collaborative-protocols/implementation-agent-protocol.md
.claude/docs/templates/collaborative-protocols/leadership-agent-protocol.md
.claude/hooks/detect-gaps.sh
.claude/hooks/session-start.sh
production/session-state/.gitkeep
docs/examples/README.md
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/PULL_REQUEST_TEMPLATE.md
```

**可覆盖的现有文件（无用户内容）：**
```
.claude/skills/brainstorm/SKILL.md
.claude/skills/design-review/SKILL.md
.claude/skills/gate-check/SKILL.md
.claude/skills/project-stage-detect/SKILL.md
.claude/skills/setup-engine/SKILL.md
.claude/skills/team-audio/SKILL.md
.claude/skills/team-combat/SKILL.md
.claude/skills/team-level/SKILL.md
.claude/skills/team-narrative/SKILL.md
.claude/skills/team-polish/SKILL.md
.claude/skills/team-release/SKILL.md
.claude/skills/team-ui/SKILL.md
.claude/hooks/log-agent.sh
.claude/hooks/pre-compact.sh
.claude/hooks/session-stop.sh
.claude/hooks/validate-assets.sh
.claude/hooks/validate-commit.sh
.claude/hooks/validate-push.sh
.claude/rules/design-docs.md
.claude/docs/hooks-reference.md
.claude/docs/skills-reference.md
.claude/docs/quick-start.md
.claude/docs/directory-structure.md
.claude/docs/context-management.md
docs/COLLABORATIVE-DESIGN-PRINCIPLE.md
docs/WORKFLOW-GUIDE.md
README.md
```

**可覆盖的代理文件**（如果你没有向其中写入自定义提示）：
```
.claude/agents/art-director.md
.claude/agents/audio-director.md
.claude/agents/creative-director.md
.claude/agents/economy-designer.md
.claude/agents/game-designer.md
.claude/agents/level-designer.md
.claude/agents/live-ops-designer.md
.claude/agents/narrative-director.md
.claude/agents/producer.md
.claude/agents/systems-designer.md
.claude/agents/technical-director.md
.claude/agents/ux-designer.md
.claude/agents/world-builder.md
.claude/agents/writer.md
```

如果你**已经**自定义了代理提示，请参阅下方 "Merge carefully"。

---

### 文件：Merge Carefully

这些文件同时包含模板结构和你的项目特定内容。**不要**覆盖它们——请手动合并变更。

#### `CLAUDE.md`

模板版本从约 159 行精简到约 60 行。关键结构性变更：移除了 5 个文档导入，因为 Claude Code 本来就会自动加载它们（agent-roster、skills-reference、hooks-reference、rules-reference、review-workflow）。

**从你的版本中保留：**
- `## Technology Stack` 章节（你的引擎/语言选择）
- 你添加的任何项目特定内容

**从新版本采用：**
- 更精简的导入列表（如果存在，删除 5 个冗余的 `@` 导入）
- 更新后的 collaboration protocol 措辞

#### `.claude/docs/technical-preferences.md`

如果你运行过 `/setup-engine`，此文件包含你的引擎配置、命名约定和性能预算。全部保留。模板版本只是空占位符。

#### `.claude/docs/templates/game-concept.md`

小型结构更新——添加了一个 `## Next Steps` 章节，指向 `/map-systems`。如果你想要更新后的指导，可以把该章节添加到你的副本中，但这不是必需的。

#### `.claude/settings.json`

检查新版本是否添加了你想要的权限规则。此次变更很小（schema 更新）。如果你没有自定义 `settings.json`，覆盖是安全的。

#### 已自定义的代理文件

如果你向任何代理 `.md` 文件添加了项目特定知识或自定义行为，请进行 diff，并手动添加新的 AskUserQuestion 集成章节，而不是覆盖。每个代理中的变更都是系统提示末尾的标准化 collaborative protocol 块。

---

### 文件：删除

这些文件已在 v0.2.0 中移除。如果你的仓库中存在它们，可以安全删除——它们已被组织更好的替代内容取代。

```
docs/IMPROVEMENTS-PROPOSAL.md      → 被 WORKFLOW-GUIDE.md 取代
docs/MULTI-STAGE-DOCUMENT-WORKFLOW.md → 内容合并到 context-management.md
```

---

### 升级后

1. **运行 `/project-stage-detect`**，验证系统能用新的检测逻辑正确读取你的项目。

2. 如果你还没用过，**运行一次 `/start`**——它现在会正确识别你的阶段，并跳过你已经完成的入门步骤。

3. **检查 `production/session-state/`** 存在且已被 gitignored：
   ```bash
   ls production/session-state/
   cat .gitignore | grep session-state
   ```

4. **测试钩子执行**——如果你在 Windows 上，请在 Git Bash 中验证新钩子运行无错误：
   ```bash
   bash .claude/hooks/detect-gaps.sh '{}' '{}'
   bash .claude/hooks/session-start.sh '{}' '{}'
   ```

---

*每个未来版本都会在此文件中拥有自己的章节。*
