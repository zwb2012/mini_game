# Agent 协作规则

1. **纵向委托**: 导演级 agent 委托给部门主管，部门主管再委托给专员。复杂决策不可跳过层级。
2. **横向咨询**: 同层级 agent 可以相互咨询，但不得做出自己领域之外的绑定性决策。
3. **冲突解决**: 两个 agent 意见不一时，升级到共同上级。无共同上级时，设计冲突升级到 `creative-director`，技术冲突升级到 `technical-director`。
4. **变更传播**: 当设计变更影响多个领域时，由 `producer` agent 协调传播。
5. **禁止单方面跨领域变更**: Agent 不得在未获明确委托的情况下修改指定目录之外的文件。

## 模型层级分配

Skill 和 agent 根据任务复杂度分配到不同模型层级:

| 层级 | 模型 | 适用场景 |
|------|-------|-------------|
| **Haiku** | `claude-haiku-4-5-20251001` | 只读状态检查、格式化、简单查询——不需要创造性判断 |
| **Sonnet** | `claude-sonnet-4-6` | 实现、设计撰写、单系统分析——大多数工作的默认选择 |
| **Opus** | `claude-opus-4-6` | 多文档综合、高风险阶段门禁判定、跨系统整体评审 |

使用 Haiku 的 skill: `/help`、`/sprint-status`、`/story-readiness`、`/scope-check`、`/project-stage-detect`、`/changelog`、`/patch-notes`、`/onboard`

使用 Opus 的 skill: `/review-all-gdds`、`/architecture-review`、`/gate-check`

其余所有 skill 默认使用 Sonnet。创建新 skill 时，如果只做读取和格式化则分配 Haiku；如果必须综合 5 个以上文档且输出高风险则分配 Opus；否则不设（默认 Sonnet）。

## Subagent 与 Agent Team

本项目使用两种不同的多 agent 模式:

### Subagent（当前，始终激活）
通过 `Task` 在单个 Claude Code session 内启动。所有 `team-*` skill 和编排类 skill 都使用此方式。Subagent 共享 session 的权限上下文，在 session 内顺序或并行运行，并将结果返回给父级。

**何时并行启动**: 如果两个 subagent 的输入互不依赖，同时发出两个 Task 调用而不是等待。例如：`/review-all-gdds` 阶段 1（一致性）和阶段 2（设计理论）互不依赖——同时启动两者。

### Agent Team（实验性——需主动开启）
多个独立的 Claude Code *session* 同时运行，通过共享任务列表协调。每个 session 有自己独立的上下文窗口和 token 预算。需要设置环境变量 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`。

**适用场景**:
- 工作跨越多个不触碰相同文件的子系统
- 每个工作流超过 30 分钟，且能从真正的并行中获益
- 高级 agent（technical-director、producer）需要协调 3 个以上专员 session 同时处理不同 epic

**不适用场景**:
- 一个 session 的输出是另一个 session 的输入（使用顺序 subagent）
- 任务适合单个 session 的上下文（使用 subagent）
- 成本敏感——每个团队成员独立消耗 token

## 并行 Task 协议

当编排类 skill 启动多个独立 agent 时:

1. 在等待任何结果之前，先发出所有独立的 Task 调用
2. 收集所有结果后再进入依赖阶段
3. 如果任何 agent 被 BLOCKED，立即提示——不可静默跳过
4. 如果部分 agent 完成、部分阻塞，始终产出部分报告
