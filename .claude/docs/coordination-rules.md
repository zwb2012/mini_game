# Agent 协调规则

1. **Vertical Delegation**：领导层 agents 委派给部门 leads，部门 leads
   再委派给 specialists。复杂决策绝不要跳过层级。
2. **Horizontal Consultation**：同一层级的 agents 可以彼此咨询，
   但不得在自己的领域之外做出有约束力的决策。
3. **Conflict Resolution**：当两个 agents 意见不一致时，升级给共同上级。
   如果没有共同上级，设计冲突升级给 `creative-director`，技术冲突升级给 `technical-director`。
4. **Change Propagation**：当设计变更影响多个领域时，由 `producer` agent 协调传播。
5. **No Unilateral Cross-Domain Changes**：agent 绝不得在没有明确委派的情况下，
   修改其指定目录之外的文件。

## 模型层级分配

Skills 和 agents 会根据任务复杂度分配到模型层级：

| Tier | Model | When to use |
|------|-------|-------------|
| **Haiku** | `claude-haiku-4-5-20251001` | 只读状态检查、格式化、简单查找 — 不需要创造性判断 |
| **Sonnet** | `claude-sonnet-4-6` | 实现、设计撰写、单个系统分析 — 大多数工作的默认选择 |
| **Opus** | `claude-opus-4-6` | 多文档综合、高风险阶段 gate verdicts、跨系统整体评审 |

带 `model: haiku` 的 skills：`/help`、`/sprint-status`、`/story-readiness`、`/scope-check`、
`/project-stage-detect`、`/changelog`、`/patch-notes`、`/onboard`

带 `model: opus` 的 skills：`/review-all-gdds`、`/architecture-review`、`/gate-check`

所有其他 skills 默认使用 Sonnet。创建新 skill 时，如果 skill 只读取和格式化，则分配 Haiku；
如果必须综合 5+ 个文档并输出高风险结果，则分配 Opus；否则保持未设置（Sonnet）。

## Subagents vs Agent Teams

本项目使用两种不同的多 agent 模式：

### Subagents（当前，始终可用）
在单个 Claude Code 会话中通过 `Task` 生成。所有 `team-*` skills
和编排 skills 都会使用。Subagents 共享会话的权限上下文，在会话内按顺序或并行运行，
并将结果返回给父级。

**何时并行生成**：如果两个 subagents 的输入相互独立（任一方都不需要另一方的输出才能开始），
则同时发起两个 Task calls，而不是等待。例如：`/review-all-gdds` Phase 1（consistency）和 Phase 2
（design theory）相互独立 — 应同时生成。

### Agent Teams（实验性 — opt-in）
多个独立 Claude Code *sessions* 同时运行，并通过共享 task list 协调。
每个 session 都有自己的上下文窗口和 token 预算。
需要 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 环境变量。

**在以下情况下使用 agent teams**：
- 工作跨越多个不会触碰相同文件的子系统
- 每条 workstream 都会耗时 >30 分钟，并从真正并行中受益
- senior agent（technical-director、producer）需要协调 3+ specialist
  sessions 同时处理不同 epics

**不要在以下情况下使用 agent teams**：
- 一个 session 的输出是另一个 session 的输入（使用顺序 subagents）
- 任务适合放在单个 session 的上下文中（改用 subagents）
- 成本是顾虑 — 每个 team member 都会独立消耗 tokens

**Current status**：通过 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` opt-in。采用时在此记录第一次使用。

## 并行 Task 协议

当编排 skill 生成多个独立 agents 时：

1. 在等待任何结果之前，发起所有独立 Task calls
2. 在进入依赖阶段前收集所有结果
3. 如果任何 agent 为 BLOCKED，立即呈现 — 不要静默跳过
4. 如果部分 agents 完成而其他 agents blocked，始终产出 partial report
