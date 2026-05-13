<p align="center">
  <h1 align="center">Claude Code Game Studios</h1>
  <p align="center">
    将一个 Claude Code 会话变成完整的游戏开发工作室。
    <br />
    49 个代理。73 个技能。一个协同工作的 AI 团队。
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href=".claude/agents"><img src="https://img.shields.io/badge/agents-49-blueviolet" alt="49 Agents"></a>
  <a href=".claude/skills"><img src="https://img.shields.io/badge/skills-73-green" alt="73 Skills"></a>
  <a href=".claude/hooks"><img src="https://img.shields.io/badge/hooks-12-orange" alt="12 Hooks"></a>
  <a href=".claude/rules"><img src="https://img.shields.io/badge/rules-11-red" alt="11 Rules"></a>
  <a href="https://docs.anthropic.com/en/docs/claude-code"><img src="https://img.shields.io/badge/built%20for-Claude%20Code-f5f5f5?logo=anthropic" alt="Built for Claude Code"></a>
  <a href="https://www.buymeacoffee.com/donchitos3"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20this%20project-FFDD00?logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee"></a>
  <a href="https://github.com/sponsors/Donchitos"><img src="https://img.shields.io/badge/GitHub%20Sponsors-Support%20this%20project-ea4aaa?logo=githubsponsors&logoColor=white" alt="GitHub Sponsors"></a>
</p>

---

## 为什么存在这个项目

用 AI 独自构建游戏很强大，但单个聊天会话缺少结构。没有人会阻止你硬编码魔法数字、跳过设计文档，或写出意大利面式代码。没有 QA 检查，没有设计评审，也没有人追问“这真的符合游戏愿景吗？”

**Claude Code Game Studios** 通过为你的 AI 会话提供真实工作室的结构来解决这个问题。你得到的不是一个通用助手，而是 49 个专门代理，它们按工作室层级组织：守护愿景的总监、负责各自领域的部门负责人，以及执行具体工作的专家。每个代理都有明确的职责、升级路径和质量门禁。

结果是：每个决策仍由你做出，但现在你拥有一个会提出正确问题、及早发现错误，并从最初头脑风暴到发布都保持项目井然有序的团队。

---

## 目录

- [包含内容](#whats-included)
- [工作室层级](#studio-hierarchy)
- [斜杠命令](#slash-commands)
- [快速开始](#getting-started)
- [升级](#upgrading)
- [项目结构](#project-structure)
- [工作原理](#how-it-works)
- [设计哲学](#design-philosophy)
- [自定义](#customization)
- [平台支持](#platform-support)
- [社区](#community)
- [支持本项目](#supporting-this-project)
- [许可证](#license)

---

## 包含内容

| 类别 | 数量 | 描述 |
|----------|-------|-------------|
| **代理** | 49 | 覆盖设计、编程、美术、音频、叙事、QA 和制作的专门子代理 |
| **技能** | 73 | 覆盖每个工作流阶段的斜杠命令（`/start`、`/design-system`、`/create-epics`、`/create-stories`、`/dev-story`、`/story-done` 等） |
| **钩子** | 12 | 对提交、推送、资产变更、会话生命周期、代理审计轨迹和缺口检测进行自动验证 |
| **规则** | 11 | 编辑玩法、引擎、AI、UI、网络代码等时强制执行的路径范围编码标准 |
| **模板** | 41 | 用于 GDD、UX 规格、ADR、冲刺计划、HUD 设计、无障碍等的文档模板 |

## 工作室层级

代理被组织为三个层级，与真实工作室的运作方式一致：

```
Tier 1 — Directors (Opus)
  creative-director    technical-director    producer

Tier 2 — Department Leads (Sonnet)
  game-designer        lead-programmer       art-director
  audio-director       narrative-director    qa-lead
  release-manager      localization-lead

Tier 3 — Specialists (Sonnet/Haiku)
  gameplay-programmer  engine-programmer     ai-programmer
  network-programmer   tools-programmer      ui-programmer
  systems-designer     level-designer        economy-designer
  technical-artist     sound-designer        writer
  world-builder        ux-designer           prototyper
  performance-analyst  devops-engineer       analytics-engineer
  security-engineer    qa-tester             accessibility-specialist
  live-ops-designer    community-manager
```

### 引擎专家

该模板包含三大主流引擎的代理集合。使用与你项目匹配的集合：

| 引擎 | 负责人代理 | 子专家 |
|--------|-----------|-----------------|
| **Godot 4** | `godot-specialist` | GDScript、Shaders、GDExtension |
| **Unity** | `unity-specialist` | DOTS/ECS、Shaders/VFX、Addressables、UI Toolkit |
| **Unreal Engine 5** | `unreal-specialist` | GAS、Blueprints、Replication、UMG/CommonUI |

## 斜杠命令

在 Claude Code 中输入 `/` 可访问全部 73 个技能：

**入门与导航**
`/start` `/help` `/project-stage-detect` `/setup-engine` `/adopt`

**游戏设计**
`/brainstorm` `/map-systems` `/design-system` `/quick-design` `/review-all-gdds` `/propagate-design-change`

**美术与资产**
`/art-bible` `/asset-spec` `/asset-audit`

**UX 与界面设计**
`/ux-design` `/ux-review`

**架构**
`/create-architecture` `/architecture-decision` `/architecture-review` `/create-control-manifest`

**故事与冲刺**
`/create-epics` `/create-stories` `/dev-story` `/sprint-plan` `/sprint-status` `/story-readiness` `/story-done` `/estimate`

**评审与分析**
`/design-review` `/code-review` `/balance-check` `/content-audit` `/scope-check` `/perf-profile` `/tech-debt` `/gate-check` `/consistency-check` `/security-audit`

**QA 与测试**
`/qa-plan` `/smoke-check` `/soak-test` `/regression-suite` `/test-setup` `/test-helpers` `/test-evidence-review` `/test-flakiness` `/skill-test` `/skill-improve`

**制作**
`/milestone-review` `/retrospective` `/bug-report` `/bug-triage` `/reverse-document` `/playtest-report`

**发布**
`/release-checklist` `/launch-checklist` `/changelog` `/patch-notes` `/hotfix` `/day-one-patch`

**创意与内容**
`/prototype` `/onboard` `/localize`

**团队编排**（协调多个代理处理单个功能）
`/team-combat` `/team-narrative` `/team-ui` `/team-release` `/team-polish` `/team-audio` `/team-level` `/team-live-ops` `/team-qa`

## 快速开始

### 前置条件

- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)
- **推荐**：[jq](https://jqlang.github.io/jq/)（用于钩子验证）和 Python 3（用于 JSON 验证）

如果缺少可选工具，所有钩子都会优雅失败——不会破坏任何东西，你只是会失去对应验证。

### 设置

1. **克隆或作为模板使用**：
   ```bash
   git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git my-game
   cd my-game
   ```

2. **打开 Claude Code** 并启动会话：
   ```bash
   claude
   ```

3. **运行 `/start`** —— 系统会询问你当前处于什么状态（没有想法、模糊概念、清晰设计、已有工作），并引导你进入合适的工作流。不会做任何预设假设。

   如果你已经知道需要什么，也可以直接跳转到某个技能：
   - `/brainstorm` —— 从零探索游戏创意
   - `/setup-engine godot 4.6` —— 如果你已经确定引擎，则配置引擎
   - `/project-stage-detect` —— 分析现有项目

## 升级

已经在使用该模板的旧版本？请参阅 [UPGRADING.md](UPGRADING.md)，其中包含逐步迁移说明、版本之间变更内容的拆解，以及哪些文件可以安全覆盖、哪些文件需要手动合并。

## 项目结构

```
CLAUDE.md                           # 主配置
.claude/
  settings.json                     # 钩子、权限、安全规则
  agents/                           # 49 个代理定义（markdown + YAML frontmatter）
  skills/                           # 73 个斜杠命令（每个技能一个子目录）
  hooks/                            # 12 个钩子脚本（bash，跨平台）
  rules/                            # 11 个路径范围编码标准
  statusline.sh                     # 状态行脚本（context%、model、stage、epic 面包屑）
  docs/
    workflow-catalog.yaml           # 7 阶段流水线定义（由 /help 读取）
    templates/                      # 41 个文档模板
src/                                # 游戏源代码
assets/                             # 美术、音频、VFX、着色器、数据文件
design/                             # GDD、叙事文档、关卡设计
docs/                               # 技术文档和 ADR
tests/                              # 测试套件（单元、集成、性能、试玩）
tools/                              # 构建和流水线工具
prototypes/                         # 一次性原型（与 src/ 隔离）
production/                         # 冲刺计划、里程碑、发布跟踪
```

## 工作原理

### 代理协调

代理遵循结构化的委派模型：

1. **纵向委派** —— 总监委派给负责人，负责人委派给专家
2. **横向咨询** —— 同层级代理可以相互咨询，但不能做出跨领域的绑定性决策
3. **冲突解决** —— 分歧会升级到共同上级（设计问题交给 `creative-director`，技术问题交给 `technical-director`）
4. **变更传播** —— 跨部门变更由 `producer` 协调
5. **领域边界** —— 未经明确委派，代理不会修改其领域之外的文件

### 协作式，而非自治式

这**不是**自动驾驶系统。每个代理都遵循严格的协作协议：

1. **提问** —— 代理在提出解决方案之前先提问
2. **呈现选项** —— 代理展示 2-4 个选项，并附优缺点
3. **由你决定** —— 用户始终做最终决定
4. **草稿** —— 代理在定稿前展示工作内容
5. **批准** —— 未经你确认，不会写入任何内容

你始终掌控全局。代理提供的是结构和专业知识，而不是自主权。

### 自动化安全

**钩子** 会在每个会话中自动运行：

| 钩子 | 触发器 | 作用 |
|------|---------|--------------|
| `validate-commit.sh` | PreToolUse (Bash) | 检查硬编码值、TODO 格式、JSON 有效性、设计文档章节——如果命令不是 `git commit` 则提前退出 |
| `validate-push.sh` | PreToolUse (Bash) | 对推送到受保护分支发出警告——如果命令不是 `git push` 则提前退出 |
| `validate-assets.sh` | PostToolUse (Write/Edit) | 验证命名约定和 JSON 结构——如果文件不在 `assets/` 中则提前退出 |
| `session-start.sh` | Session open | 显示当前分支和最近提交，帮助定位上下文 |
| `detect-gaps.sh` | Session open | 检测新项目（建议 `/start`）以及在已有代码或原型时缺失的设计文档 |
| `pre-compact.sh` | Before compaction | 保留会话进度笔记 |
| `post-compact.sh` | After compaction | 提醒 Claude 从 `active.md` 恢复会话状态 |
| `notify.sh` | Notification event | 通过 PowerShell 显示 Windows toast 通知 |
| `session-stop.sh` | Session close | 将 `active.md` 归档到会话日志并记录 git 活动 |
| `log-agent.sh` | Agent spawned | 审计轨迹开始——记录子代理调用 |
| `log-agent-stop.sh` | Agent stops | 审计轨迹结束——完成子代理记录 |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | 建议在任何 `.claude/skills/` 变更后运行 `/skill-test` |

> **注意**：`validate-commit.sh`、`validate-assets.sh` 和 `validate-skill-change.sh` 会在每次 Bash/Write 工具调用时触发，并在命令或文件路径不相关时立即退出（exit 0）。这是正常的钩子行为，不是性能问题。

`settings.json` 中的**权限规则**会自动允许安全操作（git status、测试运行），并阻止危险操作（强制推送、`rm -rf`、读取 `.env` 文件）。

### 路径范围规则

编码标准会根据文件位置自动强制执行：

| 路径 | 强制执行内容 |
|------|----------|
| `src/gameplay/**` | 数据驱动值、delta time 使用、无 UI 引用 |
| `src/core/**` | 热路径零分配、线程安全、API 稳定性 |
| `src/ai/**` | 性能预算、可调试性、数据驱动参数 |
| `src/networking/**` | 服务端权威、版本化消息、安全性 |
| `src/ui/**` | 不拥有游戏状态、可本地化、无障碍 |
| `design/gdd/**` | 必需的 8 个章节、公式格式、边界情况 |
| `tests/**` | 测试命名、覆盖率要求、fixture 模式 |
| `prototypes/**` | 放宽标准、必须有 README、记录假设 |

## 设计哲学

该模板植根于专业游戏开发实践：

- **MDA Framework** —— 用于游戏设计的 Mechanics、Dynamics、Aesthetics 分析
- **Self-Determination Theory** —— 用于玩家动机的 Autonomy、Competence、Relatedness
- **Flow State Design** —— 用挑战-技能平衡提升玩家投入度
- **Bartle Player Types** —— 受众定位与验证
- **Verification-Driven Development** —— 先测试，再实现

## 自定义

这是一个**模板**，不是锁死的框架。一切都旨在被自定义：

- **添加/移除代理** —— 删除不需要的代理文件，为你的领域添加新代理
- **编辑代理提示** —— 调整代理行为，加入项目特定知识
- **修改技能** —— 调整工作流以匹配你的团队流程
- **添加规则** —— 为你的项目目录结构创建新的路径范围规则
- **调整钩子** —— 调整验证严格度，添加新检查
- **选择你的引擎** —— 使用 Godot、Unity 或 Unreal 代理集合（也可以不用）
- **设置评审强度** —— `full`（所有总监门禁）、`lean`（仅阶段门禁）或 `solo`（无）。在 `/start` 期间设置，或编辑 `production/review-mode.txt`。可在任何技能运行时用 `--review solo` 覆盖。

## 平台支持

主要开发和测试环境为带 Git Bash 的 **Windows 10**。所有钩子都使用 POSIX 兼容模式（`grep -E`，不是 `grep -P`），并为缺失工具提供回退，因此应可在 macOS 和 Linux 上运行。`notify.sh` 钩子使用 PowerShell 发送 Windows toast 通知，在其他平台上为空操作——macOS/Linux 的桌面通知尚未接入。跨平台测试仍在进行中；如遇任何平台特定故障，请提交 issue。

## 社区

- **Discussions** —— [GitHub Discussions](https://github.com/Donchitos/Claude-Code-Game-Studios/discussions)，用于提问、分享想法和展示你构建的内容
- **Issues** —— [Bug reports and feature requests](https://github.com/Donchitos/Claude-Code-Game-Studios/issues)

---

## 支持本项目

Claude Code Game Studios 是免费开源的。如果它为你节省了时间，或帮助你发布游戏，请考虑支持持续开发：

<p>
  <a href="https://www.buymeacoffee.com/donchitos3"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
  &nbsp;
  <a href="https://github.com/sponsors/Donchitos"><img src="https://img.shields.io/badge/GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="GitHub Sponsors"></a>
</p>

- **[Buy Me a Coffee](https://www.buymeacoffee.com/donchitos3)** —— 一次性支持
- **[GitHub Sponsors](https://github.com/sponsors/Donchitos)** —— 通过 GitHub 定期支持

赞助有助于资助维护技能、添加新代理、跟进 Claude Code 和引擎 API 变更，以及回应社区 issue 所需的时间。

---

*为 Claude Code 构建。持续维护和扩展——欢迎通过 [GitHub Discussions](https://github.com/Donchitos/Claude-Code-Game-Studios/discussions) 贡献。*

## 许可证

MIT License。详情请参阅 [LICENSE](LICENSE)。
