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

| Tier | 适用场景 |
|------|-----------|
| **Light** | 只读状态检查、格式化、简单查找 — 不需要创造性判断 |
| **Standard** | 实现、设计撰写、单个系统分析 — 大多数工作的默认选择 |
| **Heavy** | 多文档综合、高风险阶段 gate verdicts、跨系统整体评审 |

轻量任务技能（如 `help`、`sprint-status`、`story-readiness`、`scope-check`、
`project-stage-detect`、`changelog`、`patch-notes`、`onboard`）可用较低推理档位。

重型综合技能（如 `review-all-gdds`、`architecture-review`、`gate-check`）需要更高档位。

所有其他技能使用 DSH 会话默认的模型与推理档位（见 DSH 设置）。

## Subagents vs Agent Teams

本项目使用 DSH 的委派模型组织多 agent 工作：

### Subagents（始终可用）
通过 `subagent` 工具生成。所有 `team-*` skills 和编排 skills 都会使用。
子 agent 拥有独立上下文窗口，在会话内按顺序或并行运行，并把结果返回给父级。
默认后台运行（`run_in_background: true`），父级可继续做独立工作；仅当下一步依赖其
结果时才前台运行。

**何时并行生成**：如果多个子 agents 的输入相互独立（任一方都不需要另一方的输出才能开始），
则同时发起多个 `subagent` 调用，而不是等待。例如 `review-all-gdds` 的 Phase 1（consistency）
和 Phase 2（design theory）相互独立 — 应同时生成。

### Workflows（大规模扇出）
当需要在大量独立单元之间展开工作（审计、迁移、多角度研究、并行改写）时，使用 `workflow` 工具。

**用 subagent**：少量委派或研究。
**用 workflow**：数十个独立单元分阶段展开。

## 并行协议

当编排 skill 生成多个独立子 agents 时：

1. 在等待任何结果之前，发起所有独立 `subagent` 调用
2. 在进入依赖阶段前收集所有结果
3. 如果任何 agent 为 BLOCKED，立即呈现 — 不要静默跳过
4. 如果部分 agents 完成而其他 agents blocked，始终产出 partial report
