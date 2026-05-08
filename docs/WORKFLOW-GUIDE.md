# Claude Code Game Studios -- 完整工作流指南

> **如何使用 Agent 架构从零到发布游戏。**
>
> 本指南带你走完使用 52 agent 系统、72 个 Slash 命令和 12 个自动 Hook 进行游戏开发的每个阶段。
> 假设你已安装 Claude Code 并从项目根目录开始工作。
>
> 流水线共有 7 个阶段。每个阶段有正式门禁（`/gate-check`），进入下一阶段前必须通过。
> 权威的阶段序列定义在 `.claude/docs/workflow-catalog.yaml` 中，由 `/help` 读取。

---

## 目录

1. [快速开始](#快速开始)
2. [阶段 1: 概念](#阶段-1-概念)
3. [阶段 2: 系统设计](#阶段-2-系统设计)
4. [阶段 3: 技术搭建](#阶段-3-技术搭建)
5. [阶段 4: 预生产](#阶段-4-预生产)
6. [阶段 5: 生产](#阶段-5-生产)
7. [阶段 6: 打磨](#阶段-6-打磨)
8. [阶段 7: 发布](#阶段-7-发布)
9. [跨阶段关注点](#跨阶段关注点)
10. [附录 A: Agent 速查](#附录-a-agent-速查)
11. [附录 B: Slash 命令速查](#附录-b-slash-命令速查)
12. [附录 C: 常用工作流](#附录-c-常用工作流)

---

## 快速开始

### 你需要什么

开始之前，确保你有：

- **Claude Code** 已安装并正常工作
- **Git** 及 Git Bash（Windows）或标准终端（Mac/Linux）
- **jq**（可选但推荐 -- hook 在缺失时会回退到 `grep`）
- **Python 3**（可选 -- 部分 hook 用它做 JSON 校验）

### 第 1 步: 克隆并打开

```bash
git clone <repo-url> my-game
cd my-game
```

### 第 2 步: 运行 /start

如果这是你的第一次会话：

```
/start
```

这个引导式入门会问你在哪个阶段，然后路由到正确的位置：

- **路径 A** -- 还没有想法: 路由到 `/brainstorm`
- **路径 B** -- 模糊想法: 带种子路由到 `/brainstorm`
- **路径 C** -- 清晰概念: 路由到 `/setup-engine` 和 `/map-systems`
- **路径 D1** -- 已有项目，少量产物: 正常流程
- **路径 D2** -- 已有项目，GDD/ADR 已存在: 运行 `/project-stage-detect` 然后 `/adopt`

### 第 3 步: 验证 Hook 是否正常

启动新的 Claude Code 会话。你会看到 `session-start.sh` hook 的输出：

```
=== Claude Code Game Studios -- Session Context ===
Branch: main
Recent commits:
  abc1234 Initial commit
===================================
```

如果看到这个，说明 hook 正常工作。如果没有，检查 `.claude/settings.json` 确认 hook 路径对你的操作系统是正确的。

### 第 4 步: 随时求助

任何时候都可以运行：

```
/help
```

这会读取你的当前阶段，检查已有产物，并准确告诉你下一步该做什么。

### 第 5 步: 创建目录结构

目录按需创建。系统预期以下布局：

```
src/                  # 游戏源码
  core/               # 引擎/框架代码
  gameplay/           # 玩法系统
  ai/                 # AI 系统
  networking/         # 多人游戏代码
  ui/                 # UI 代码
  tools/              # 开发工具
assets/               # 游戏资源
design/               # 设计文档
  gdd/                # 游戏设计文档
  narrative/          # 故事、背景、对话
  levels/             # 关卡设计文档
  balance/            # 数值表格和数据
  ux/                 # UX 规格
docs/                 # 技术文档
  architecture/       # 架构决策记录 (ADR)
tests/                # 测试套件
prototypes/           # 一次性原型
production/           # Sprint 计划、里程碑、发布
templates/            # 代码模板
```

> **提示:** 你不需要第一天就建好所有目录。用到哪个阶段再创建。重要的是按此结构创建，因为 **规则系统** 根据文件路径强制执行标准。

---

## 阶段 1: 概念

### 本阶段做什么

从"没有想法"或"模糊想法"到结构化的游戏概念文档。这是你明确**要做什么**以及**为什么**的阶段。

### 阶段 1 流水线

```
/brainstorm  -->  game-concept.md  -->  /design-review  -->  /setup-engine
     |                                        |                    |
     v                                        v                    v
  概念生成          含支柱的概念文档         概念验证           引擎锁定到
  MDA 分析         MDA, 核心循环, USP                       technical-preferences.md
                                                                   |
                                                                   v
                                                             /map-systems
                                                                   |
                                                                   v
                                                            systems-index.md
```

### 第 1.1 步: 用 /brainstorm 脑暴

这是你的起点：

```
/brainstorm
```

或带类型提示：

```
/brainstorm roguelike deckbuilder
```

**做什么:** 使用专业工作室技术引导你完成 6 阶段构思流程。

概念文档包括: 一句话简介、核心幻想、MDA 分解、目标受众、核心循环图、独特卖点、游戏支柱（3-5 个不可协商的设计价值）、反支柱。

### 第 1.2 步: 评审概念（可选但推荐）

```
/design-review design/gdd/game-concept.md
```

### 第 1.3 步: 选择引擎

```
/setup-engine
```

或直接指定：

```
/setup-engine cocos
/setup-engine godot 4.6
```

**做什么:** 填充技术偏好、检测知识缺口、创建锁定版本的参考文档。一旦选择引擎，系统就知道用哪些引擎专员 agent。

### 第 1.4 步: 将概念拆解为系统

```
/map-systems
```

创建 `design/gdd/systems-index.md` -- 列出所有需要的系统、映射依赖关系、分配优先级层级（MVP / Vertical Slice / Alpha / Full Vision）。

### 阶段 1 门禁

```
/gate-check concept
```

**通过条件:** 引擎已配置、game-concept.md 存在并有支柱、systems-index.md 存在并有依赖排序。

---

## 阶段 2: 系统设计

### 本阶段做什么

创建所有定义游戏运作方式的设计文档。还没到编码阶段——纯设计。系统中每个系统都要有自己的 GDD。

### 阶段 2 流水线

```
/map-systems next  -->  /design-system  -->  /design-review  -->  /review-all-gdds
```

### 第 2.1 步: 撰写系统 GDD

```
/map-systems next
```

或直接指定：

```
/design-system combat-system
```

**8 个必要 GDD 章节:** 概述、玩家幻想、详细规则、公式、边界情况、依赖、调优参数、验收标准。

### 第 2.2 步: 逐 GDD 评审

```
/design-review design/gdd/combat-system.md
```

### 第 2.3 步: 小变更无需完整 GDD

```
/quick-design "侧翼攻击额外 10% 伤害加成"
```

### 第 2.4 步: 跨 GDD 一致性评审

```
/review-all-gdds
```

### 阶段 2 门禁

```
/gate-check systems-design
```

---

## 阶段 3: 技术搭建

### 本阶段做什么

做出关键技术决策，记录为 ADR，验证，产出控制清单。

### 阶段 3 流水线

```
/create-architecture  -->  /architecture-decision (×N)  -->  /architecture-review  -->  /create-control-manifest
```

### 关键步骤

```
/create-architecture                                    # 主体架构文档
/architecture-decision "NPC AI 用状态机还是行为树"         # 逐决策 ADR
/architecture-review                                     # 验证全部 ADR
/create-control-manifest                                 # 平面程序员规则单
```

### 阶段 3 门禁

```
/gate-check technical-setup
```

---

## 阶段 4: 预生产

### 本阶段做什么

创建 UX 规格、原型验证风险机制、将设计文档转化为可实现的 Story、规划首个 Sprint、构建 Vertical Slice。

### 阶段 4 流水线

```
/ux-design  -->  /prototype  -->  /create-epics  -->  /create-stories  -->  /sprint-plan
```

### 关键步骤

```
/ux-design main-menu                              # UX 规格
/ux-design core-gameplay-hud                      # 核心 HUD
/prototype "带惯性的抓钩移动"                       # 原型
/create-epics layer: foundation                    # 创建 Epic
/create-stories [epic-slug]                        # 拆分为 Story
/sprint-plan new                                   # 首个 Sprint
/playtest-report                                   # Vertical Slice 可玩性测试
```

### 阶段 4 门禁

```
/gate-check pre-production
```

**硬性门禁:** Vertical Slice 必须被真人无引导玩过至少 3 次。

---

## 阶段 5: 生产

### 本阶段做什么

核心生产循环。按 Sprint 迭代实现功能、追踪进度。重复至内容完成。

### Story 生命周期

```
/story-readiness  -->  实现  -->  /story-done  -->  下一个 story
```

### 关键步骤

```
/sprint-plan new                                    # 新 Sprint
/story-readiness production/stories/combat.md       # 验证就绪
/dev-story production/stories/combat.md             # 实现
/story-done production/stories/combat.md            # 完成评审
/sprint-status                                      # Sprint 快照
/retrospective                                      # Sprint 复盘
```

### 阶段 5 门禁

```
/gate-check production
```

---

## 阶段 6: 打磨

### 本阶段做什么

功能完成，现在把它做得好。性能、数值平衡、无障碍、音频、视觉打磨、可玩性测试。

### 关键步骤

```
/perf-profile                                       # 性能分析
/balance-check                                      # 数值平衡
/asset-audit                                        # 资源审计
/playtest-report (×3)                               # 可玩性测试
/team-polish                                        # 协调打磨
/localize                                           # 本地化
```

### 阶段 6 门禁

```
/gate-check polish
```

---

## 阶段 7: 发布

### 本阶段做什么

游戏打磨完成，测试通过，准备发布。

### 关键步骤

```
/release-checklist v1.0.0                           # 发布检查清单
/launch-checklist                                   # 全面上线就绪验证
/team-release                                       # 协调发布
/patch-notes v1.0.0                                 # 补丁说明
/changelog v1.0.0                                   # Changelog
/hotfix "玩家物品超 99 件时存档丢失"                    # 紧急修复
```

### 发布

```bash
git tag v1.0.0
git push origin main --tags
```

---

## 跨阶段关注点

### 评审模式

在 `/start` 时设置评审强度，保存到 `production/review-mode.txt`:

| 模式 | 运行内容 | 适用场景 |
|------|-----------|----------|
| `full` | 每步都运行全部导演门禁 | 新项目、学习系统 |
| `lean` | 仅阶段转换时运行导演门禁 | 有经验开发者 |
| `solo` | 无导演评审 | Game Jam、原型、极速 |

单次覆盖: `/brainstorm space horror --review full`

### 协作协议

**用户驱动的协作，不是自主式。** 模式: 提问 > 选项 > 决策 > 草稿 > 审批。详见 `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md`。

### Agent 协作（3 层）

```
第一层 (导演):     creative-director, technical-director, producer
第二层 (主管):     game-designer, lead-programmer, art-director, ...
第三层 (专员):     gameplay-programmer, engine-programmer, cocos-specialist, ...
```

### Brownfield 采用

对于已有项目: `/adopt` — 审计现有产物格式，分类缺口，构建迁移计划。

### 门禁系统

门禁判定: **PASS** (通过) / **CONCERNS** (有风险但可通过) / **FAIL** (阻塞，需修复)。

---

## 附录 A: Agent 速查

### "我该用哪个 agent？"

| 我需要... | Agent | 层级 |
|-------------|-------|------|
| 脑暴游戏想法 | `/brainstorm` skill | -- |
| 设计游戏机制 | `game-designer` | 2 |
| 设计 Cocos 组件 | `cocos-specialist` | 3 |
| 对接微信 API | `wechat-platform-specialist` | 3 |
| 写后端 API | `backend-developer` | 3 |
| 规划 Sprint | `producer` | 1 |
| 做创意决策 | `creative-director` | 1 |
| 做技术决策 | `technical-director` | 1 |
| 实现玩法代码 | `gameplay-programmer` | 3 |
| 写 Shader | `technical-artist` | 3 |
| 设计 UX 流程 | `ux-designer` | 3 |
| 写测试用例 | `qa-tester` | 3 |
| 性能分析 | `performance-analyst` | 3 |
| 管理发布 | `release-manager` | 2 |

---

## 附录 B: Slash 命令速查（完整 72 个）

### 入门与导航 (5)
`/start` `/help` `/project-stage-detect` `/setup-engine` `/adopt`

### 游戏设计 (6)
`/brainstorm` `/map-systems` `/design-system` `/quick-design` `/review-all-gdds` `/propagate-design-change`

### UX 与界面 (2)
`/ux-design` `/ux-review`

### 架构 (4)
`/create-architecture` `/architecture-decision` `/architecture-review` `/create-control-manifest`

### Story 与 Sprint (8)
`/create-epics` `/create-stories` `/dev-story` `/sprint-plan` `/sprint-status` `/story-readiness` `/story-done` `/estimate`

### 评审与分析 (10)
`/design-review` `/code-review` `/balance-check` `/asset-audit` `/content-audit` `/scope-check` `/perf-profile` `/tech-debt` `/gate-check` `/consistency-check`

### QA 与测试 (9)
`/qa-plan` `/smoke-check` `/soak-test` `/regression-suite` `/test-setup` `/test-helpers` `/test-evidence-review` `/test-flakiness` `/skill-test`

### 制作管理 (6)
`/milestone-review` `/retrospective` `/bug-report` `/bug-triage` `/playtest-report` `/onboard`

### 发布 (5)
`/release-checklist` `/launch-checklist` `/changelog` `/patch-notes` `/hotfix`

### 创意 (2)
`/prototype` `/localize`

### 团队协作 (9)
`/team-combat` `/team-narrative` `/team-ui` `/team-release` `/team-polish` `/team-audio` `/team-level` `/team-live-ops` `/team-qa`

---

## 附录 C: 常用工作流

### "我刚起步，没有游戏想法"
1. `/start` → 2. `/brainstorm` → 3. `/setup-engine` → 4. `/map-systems` → 5. `/gate-check concept`

### "我有设计，想开始写代码"
1. 每个 GDD 跑 `/design-review` → 2. `/review-all-gdds` → 3. `/create-architecture` → 4. `/architecture-decision` ×N → 5. `/create-epics` → 6. `/create-stories` → 7. `/sprint-plan new` → 8. `/dev-story` 逐个实现

### "我需要添加一个复杂功能"
1. `/design-system` → 2. `/design-review` → 3. 用 `/team-combat` 等 team skill 协调实现

### "线上出问题了"
1. `/hotfix "问题描述"` → 2. 修复 → 3. `/code-review` → 4. 部署

### "我迷失了"
1. `/help` → 2. 如不够 → `/project-stage-detect`
