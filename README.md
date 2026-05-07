<p align="center">
  <h1 align="center">Claude Code Game Studios</h1>
  <p align="center">
    把一次 Claude Code 会话变成一个完整的游戏开发工作室
    <br />
    52 个 agent · 72 个 skill · 一套协作式 AI 团队
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href=".claude/agents"><img src="https://img.shields.io/badge/agents-52-blueviolet" alt="52 Agents"></a>
  <a href=".claude/skills"><img src="https://img.shields.io/badge/skills-72-green" alt="72 Skills"></a>
  <a href=".claude/hooks"><img src="https://img.shields.io/badge/hooks-12-orange" alt="12 Hooks"></a>
  <a href=".claude/rules"><img src="https://img.shields.io/badge/rules-12-red" alt="12 Rules"></a>
  <a href="https://docs.anthropic.com/en/docs/claude-code"><img src="https://img.shields.io/badge/built%20for-Claude%20Code-f5f5f5?logo=anthropic" alt="Built for Claude Code"></a>
</p>

---

## 这是什么

一个人用 AI 做游戏很强大，但一个聊天 session 没有结构。没人阻止你硬编码魔法数字、跳过设计文档、或者写意大利面条代码。没有 QA 检查、没有设计评审、没人问"这真的符合游戏愿景吗？"

**Claude Code Game Studios** 通过给你的 AI 会话注入真实工作室的结构来解决这个问题。你得到的不是一个通用助手，而是 52 个按工作室层级组织的专业 agent——守护愿景的导演、独当一面的部门主管、以及动手实现的专员。每个 agent 有明确职责、升级路径和质量门禁。

结果：你依然是所有决策的最终拍板人，但现在你有了一个团队——他们问对的问题、及早发现错误、并让你的项目从头脑风暴到发布始终保持组织。

**本分支是 CCGS 的增强版**，额外支持 Cocos Creator 引擎、微信小游戏平台和后端 API 开发。所有文档和对话默认使用中文。

---

## 目录

- [包含什么](#包含什么)
- [工作室层级](#工作室层级)
- [Slash 命令](#slash-命令)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [工作原理](#工作原理)
- [设计哲学](#设计哲学)
- [自定义](#自定义)
- [平台支持](#平台支持)
- [相比 CCGS 的扩展](#相比-ccgs-的扩展)
- [许可证](#license)

---

## 包含什么

| 类别 | 数量 | 说明 |
|----------|-------|-------------|
| **Agents** | 52 | 涵盖设计、编程、美术、音频、叙事、QA 和制作的专业 subagent |
| **Skills** | 72 | 覆盖全部工作流阶段的 Slash 命令（`/start`、`/design-system`、`/create-epics`、`/dev-story` 等） |
| **Hooks** | 12 | 自动化校验（commit、push、资源变更、session 生命周期、agent 审计追踪、缺口检测） |
| **Rules** | 12 | 按文件路径自动应用的编码规范（玩法代码、引擎代码、UI 代码等 + 中文文档输出规则） |
| **Templates** | 39 | 文档模板（GDD、UX 规格、ADR、Sprint 计划、HUD 设计、无障碍等） |

## 工作室层级

Agent 按三个层级组织，匹配真实工作室的运作方式：

```
第一层 — 导演（Opus）
  creative-director    technical-director    producer

第二层 — 部门主管（Sonnet）
  game-designer        lead-programmer       art-director
  audio-director       narrative-director    qa-lead
  release-manager      localization-lead

第三层 — 专员（Sonnet/Haiku）
  gameplay-programmer  engine-programmer     ai-programmer
  network-programmer   tools-programmer      ui-programmer
  systems-designer     level-designer        economy-designer
  technical-artist     sound-designer        writer
  world-builder        ux-designer           prototyper
  performance-analyst  devops-engineer       analytics-engineer
  security-engineer    qa-tester             accessibility-specialist
  live-ops-designer    community-manager
```

### 引擎专员

本模板包含四大引擎的 agent 组。使用匹配你项目的引擎：

| 引擎 | 主 Agent | 子专员 |
|--------|-----------|-----------------|
| **Godot 4** | `godot-specialist` | GDScript、Shaders、GDExtension |
| **Unity** | `unity-specialist` | DOTS/ECS、Shaders/VFX、Addressables、UI Toolkit |
| **Unreal Engine 5** | `unreal-specialist` | GAS、Blueprints、Replication、UMG/CommonUI |
| **Cocos Creator** | `cocos-specialist` | TypeScript 组件架构、微信小游戏导出、资源管理 |

### 平台专员（本分支新增）

| Agent | 职责 |
|-------|------|
| `wechat-platform-specialist` | 微信小游戏 API（登录/支付/广告/排行榜/分享） |
| `backend-developer` | Express/TypeScript 后端 API（排行榜/用户数据/配置/支付验证） |

## Slash 命令

在 Claude Code 中输入 `/` 即可访问全部 72 个 skill：

**入门与导航**
`/start` `/help` `/project-stage-detect` `/setup-engine` `/adopt`

**游戏设计**
`/brainstorm` `/map-systems` `/design-system` `/quick-design` `/review-all-gdds` `/propagate-design-change`

**美术与资源**
`/art-bible` `/asset-spec` `/asset-audit`

**UX 与界面设计**
`/ux-design` `/ux-review`

**架构**
`/create-architecture` `/architecture-decision` `/architecture-review` `/create-control-manifest`

**Story 与 Sprint**
`/create-epics` `/create-stories` `/dev-story` `/sprint-plan` `/sprint-status` `/story-readiness` `/story-done` `/estimate`

**评审与分析**
`/design-review` `/code-review` `/balance-check` `/content-audit` `/scope-check` `/perf-profile` `/tech-debt` `/gate-check` `/consistency-check`

**QA 与测试**
`/qa-plan` `/smoke-check` `/soak-test` `/regression-suite` `/test-setup` `/test-helpers` `/test-evidence-review` `/test-flakiness` `/skill-test` `/skill-improve`

**制作**
`/milestone-review` `/retrospective` `/bug-report` `/bug-triage` `/reverse-document` `/playtest-report`

**发布**
`/release-checklist` `/launch-checklist` `/changelog` `/patch-notes` `/hotfix`

**创意与内容**
`/prototype` `/onboard` `/localize`

**团队协作**（协调多个 agent 完成一个功能）
`/team-combat` `/team-narrative` `/team-ui` `/team-release` `/team-polish` `/team-audio` `/team-level` `/team-live-ops` `/team-qa`

## 快速开始

### 前置条件

- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)
- **推荐**: [jq](https://jqlang.github.io/jq/)（hook 校验用）和 Python 3（JSON 校验用）

所有 hook 在缺少可选工具时会优雅降级——不会报错，只是少一层校验。

### 安装

1. **克隆或用作模板**：
   ```bash
   git clone https://github.com/zwb2012/mini_game.git my-game
   cd my-game
   git checkout ccgs-cocos-wechat
   ```

2. **打开 Claude Code** 并开始会话：
   ```bash
   claude
   ```

3. **运行 `/start`** — 系统会问你在哪个阶段（毫无想法 / 模糊概念 / 清晰设计 / 已有项目），然后引导你到正确的工作流。

   如果你已经明确知道需要什么，也可以直接跳到特定 skill：
   - `/brainstorm` — 从零开始探索游戏想法
   - `/setup-engine cocos` — 选择 Cocos Creator 作为引擎
   - `/setup-engine godot 4.6` — 选择 Godot 引擎
   - `/project-stage-detect` — 分析已有项目状态

### 语言规则

**本分支所有文档和 Agent 对话默认使用中文。** 代码、API 名称、技术术语保留英文。详见 `.claude/rules/chinese-output.md`。

## 项目结构

```
CLAUDE.md                           # 主配置文件
.claude/
  settings.json                     # Hooks、权限、安全规则
  agents/                           # 52 个 agent 定义（Markdown + YAML frontmatter）
  skills/                           # 72 个 slash 命令（每个 skill 一个子目录）
  hooks/                            # 12 个 hook 脚本（bash，跨平台）
  rules/                            # 12 个路径级编码规范（含中文输出规则）
  statusline.sh                     # 状态栏脚本
  docs/
    workflow-catalog.yaml           # 7 阶段流水线定义（供 /help 读取）
    templates/                      # 39 个文档模板
src/                                # 游戏源码
assets/                             # 美术、音频、VFX、Shader、数据文件
design/                             # GDD、叙事文档、关卡设计
docs/                               # 技术文档和 ADR
templates/                          # 代码模板（Cocos 基座 / 微信适配器 / 后端骨架）
tests/                              # 测试套件
tools/                              # 构建和流水线工具
prototypes/                         # 一次性原型（与 src/ 隔离）
production/                         # Sprint 计划、里程碑、发布追踪
```

## 工作原理

### Agent 协作

Agent 遵循结构化的委托模型：

1. **纵向委托** — 导演委托给主管，主管委托给专员
2. **横向咨询** — 同层 agent 可以互相咨询，但不能做跨领域绑定性决策
3. **冲突解决** — 分歧升级到共同上级（设计冲突 → `creative-director`，技术冲突 → `technical-director`）
4. **变更传播** — 跨部门变更由 `producer` 协调
5. **领域边界** — agent 不会在未获委托的情况下修改自己领域外的文件

### 协作式，非自主式

这**不是**自动驾驶系统。每个 agent 都遵循严格的协作协议：

1. **询问** — agent 在提出方案之前先问问题
2. **呈现选项** — agent 展示 2-4 个选项及其优缺点
3. **你决定** — 最终拍板的永远是你
4. **草稿** — agent 在最终确定前展示工作成果
5. **审批** — 没有得到你的签字，不会写入任何东西

你始终在掌控之中。Agent 提供的是结构和专业经验，不是自主权。

### 自动化安全

**Hooks** 在每个会话中自动运行：

| Hook | 触发条件 | 功能 |
|------|---------|------|
| `validate-commit.sh` | PreToolUse (Bash) | 检查硬编码值、TODO 格式、JSON 有效性、设计文档章节 |
| `validate-push.sh` | PreToolUse (Bash) | 对受保护分支的 push 发出警告 |
| `validate-assets.sh` | PostToolUse (Write/Edit) | 校验资源命名规范和 JSON 结构 |
| `session-start.sh` | 会话打开 | 展示当前分支和最近 commits |
| `detect-gaps.sh` | 会话打开 | 检测新项目（建议 `/start`）和缺失的设计文档 |
| `pre-compact.sh` | 压缩前 | 保存会话进度笔记 |
| `post-compact.sh` | 压缩后 | 提醒恢复会话状态 |
| `session-stop.sh` | 会话关闭 | 归档 session 记录和 git 活动 |
| `log-agent.sh` | Agent 启动 | 审计追踪开始 — 记录 subagent 调用 |
| `log-agent-stop.sh` | Agent 停止 | 审计追踪结束 — 补全 subagent 记录 |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | 技能文件变更后建议运行 `/skill-test` |

**settings.json** 中的权限规则自动放行安全操作（git status、test 运行），阻止危险操作（force push、`rm -rf`、读取 `.env` 文件）。

### 路径级规则

编码规范基于文件位置自动应用：

| 路径 | 强制执行 |
|------|----------|
| `src/gameplay/**` | 数据驱动值、delta time 使用、禁止 UI 引用 |
| `src/core/**` | 热点路径零分配、线程安全、API 稳定性 |
| `src/ai/**` | 性能预算、可调试性、数据驱动参数 |
| `src/networking/**` | 服务端权威、版本化消息、安全 |
| `src/ui/**` | 不持有游戏状态、本地化就绪、无障碍 |
| `design/gdd/**` | 必含 8 个章节、公式格式、边界情况 |
| `design/**`, `docs/**`, `production/**` | **中文输出（详细规则）** |
| `tests/**` | 测试命名、覆盖率要求、fixture 模式 |
| `prototypes/**` | 宽松标准、必需 README、假设记录 |

## 设计哲学

本模板扎根于专业游戏开发实践：

- **MDA 框架** — 机制、动态、美学分析
- **自决理论** — 自主性、胜任感、关联感驱动玩家动机
- **心流状态设计** — 挑战-技能平衡驱动玩家投入
- **Bartle 玩家类型** — 受众定位与验证
- **验证驱动开发** — 先写测试，再实现

## 自定义

这是一个**模板**，不是锁死的框架。一切都可自定义：

- **添加/删除 agent** — 删除不需要的 agent 文件，为你的领域新增
- **编辑 agent 提示** — 调整 agent 行为，添加项目特定知识
- **修改 skill** — 调整工作流以匹配你的团队流程
- **添加 rule** — 为你的项目目录结构创建新的路径级规则
- **调整 hook** — 调整校验严格度，添加新检查
- **选择引擎** — 使用 Godot、Unity、Unreal 或 Cocos Creator agent 组
- **设置评审强度** — `full`（全部导演门禁）、`lean`（仅阶段门禁）或 `solo`（无门禁）。在 `/start` 时设置或编辑 `production/review-mode.txt`

## 平台支持

已测试：**Windows 10** with Git Bash、**macOS**、**Linux**。所有 hook 使用 POSIX 兼容模式。

## 相比 CCGS 的扩展

| 扩展 | 说明 |
|------|------|
| `cocos-specialist` | Cocos Creator 3.x + TypeScript 引擎专家 |
| `wechat-platform-specialist` | 微信小游戏 API 适配（登录/支付/广告/排行榜/分享） |
| `backend-developer` | Express/TypeScript 后端 API 开发 |
| `templates/cocos-game-base/` | TypeScript 运行时核心（GameState/EventBus/SceneFlow 等）+ noop 适配器 |
| `templates/wechat-adapter/` | 微信小游戏平台适配骨架 |
| `templates/backend-base/` | Express 后端骨架（排行榜/用户数据/配置下发/支付验证 API） |
| `.claude/rules/chinese-output.md` | 中文文档输出规则 |
| `/setup-engine cocos` | `/setup-engine` 已支持 Cocos Creator 选项 |

---

## License

MIT License. 详见 [LICENSE](LICENSE)。
