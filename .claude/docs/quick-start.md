# 游戏工作室 Agent 架构 — 快速上手指南

## 这是什么？

这是一套完整的 Claude Code 游戏开发 Agent 架构。它把 52 个专业 AI agent 组织成一个镜像真实游戏开发团队的工作室层级，有明确的职责、委托规则和协作协议。本分支额外支持 Cocos Creator 引擎和微信小游戏平台。

## 如何使用

### 1. 理解层级

Agent 分三个层级：

- **第一层（Opus）**：做出高层决策的导演
  - `creative-director` — 创意愿景和设计冲突裁决
  - `technical-director` — 架构和技术决策
  - `producer` — 排期、协调和风险管理

- **第二层（Sonnet）**：独当一面的部门主管
  - `game-designer`、`lead-programmer`、`art-director`、`audio-director`、`narrative-director`、`qa-lead`、`release-manager`、`localization-lead`

- **第三层（Sonnet/Haiku）**：在自己领域内执行的专员
  - 设计师、程序员、美术、写手、测试、工程师

### 2. 找到正确的 Agent

问自己："在真实工作室里，这个任务应该交给哪个部门？"

| 我需要... | 使用这个 agent |
|-------------|---------------|
| 设计一个新机制 | `game-designer` |
| 写 TypeScript 组件代码 | `cocos-specialist` 或 `gameplay-programmer` |
| 对接微信登录/支付 | `wechat-platform-specialist` |
| 写后端 API | `backend-developer` |
| 设计一个关卡 | `level-designer` |
| 写 shader | `technical-artist` |
| 写对话/文案 | `writer` |
| 规划下一个 Sprint | `producer` |
| 代码评审 | `lead-programmer` 或 `/code-review` |
| 写测试用例 | `qa-tester` |
| 快速测试一个机制 | `prototyper` |
| 做架构决策 | `technical-director` |
| 解决创意冲突 | `creative-director` |
| 脑暴新游戏想法 | `/brainstorm` skill |
| 配置引擎 | `/setup-engine [engine] [version]` |
| 从微信小游戏角度评估 | `wechat-platform-specialist` |

### 3. 使用 Slash 命令

| 命令 | 功能 |
|---------|-------------|
| `/start` | 首次引导 — 问你在哪，引导到正确的工作流 |
| `/help` | 上下文感知的"下一步做什么？" |
| `/project-stage-detect` | 分析项目状态、检测阶段、识别缺口 |
| `/setup-engine` | 配置引擎 + 版本（支持 godot/unity/unreal/cocos） |
| `/brainstorm` | 从零开始的引导式游戏概念构思 |
| `/map-systems` | 解构概念为系统、映射依赖关系 |
| `/design-system` | 逐个章节引导式 GDD 撰写 |
| `/create-architecture` | 游戏主体架构文档 |
| `/create-epics` | 将 GDD + ADR 翻译为 Epics |
| `/create-stories` | 将 Epic 拆分为可实现的 Story 文件 |
| `/dev-story` | 读取 Story 并实现 — 路由到正确的程序员 agent |
| `/sprint-plan` | 创建或更新 Sprint 计划 |
| `/sprint-status` | 30 行 Sprint 快照 |
| `/story-done` | Story 结束时的完成评审 |
| `/code-review` | 代码质量和架构评审 |
| `/design-review` | 设计文档评审 |
| `/gate-check` | 验证阶段就绪度（PASS/CONCERNS/FAIL） |
| `/release-checklist` | 发布前检查清单 |
| `/launch-checklist` | 完整上线就绪验证 |

### 4. 遵循协作规则

1. 工作沿层级流下：导演 → 主管 → 专员
2. 冲突沿层级升级
3. 跨部门工作由 `producer` 协调
4. agent 不会在未委托的情况下修改自己领域外的文件
5. 所有决策文档化

## 新项目的第一步

**不知道从哪里开始？** 运行 `/start`。它会问你的情况并路由到正确的工作流。

### 路径 A："我完全不知道要做什么"

1. **运行 `/start`**（或 `/brainstorm open`）
2. **设置引擎** — 运行 `/setup-engine`（如果不确定，系统会推荐引擎）
3. **验证概念** — 运行 `/design-review design/gdd/game-concept.md`
4. **系统拆解** — 运行 `/map-systems`
5. **逐系统设计** — 运行 `/design-system [system-name]`
6. **原型验证** — 运行 `/prototype [core-mechanic]`
7. **可玩性测试** — 运行 `/playtest-report`
8. **规划首个 Sprint** — 运行 `/sprint-plan new`

### 路径 B："我知道我想做什么"

1. **设置引擎** — 运行 `/setup-engine [engine] [version]`（例如 `/setup-engine cocos`）
2. **写游戏支柱** — 委托给 `creative-director`
3. **系统拆解** — 运行 `/map-systems`
4. **逐系统设计** — 运行 `/design-system [system-name]`
5. **创建初始 ADR** — 运行 `/architecture-decision`
6. **规划首个 Sprint** — 运行 `/sprint-plan new`

### 路径 C："我想做微信小游戏"

1. **设置引擎** — 运行 `/setup-engine cocos`
2. **平台适配** — `wechat-platform-specialist` 会帮你对接微信 API
3. **如需后端** — `backend-developer` 会帮你搭建排行榜、用户数据、支付验证 API
4. 后续按路径 B 或 A 推进

### 路径 D："我有现成项目"

1. **运行 `/start`**（或 `/project-stage-detect`）— 分析现状
2. **运行 `/adopt`** — 审核格式、构建迁移计划
3. **配置引擎** — 运行 `/setup-engine`（如尚未配置）
4. **验证阶段就绪度** — 运行 `/gate-check`

## 语言规则

**本分支所有文档和对话默认使用中文。** 代码、API 名称、技术术语保留英文。
