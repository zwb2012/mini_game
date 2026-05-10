# 关卡数据结构

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 1（纯逻辑零运气）、Pillar 4（越简单越好）

## Summary

关卡数据结构是数字连线游戏的关卡数据格式定义，为所有系统提供统一的数据契约。它定义了单关的 JSON Schema——网格尺寸、数字节点坐标、障碍格、最优步数和解锁条件——以及配套的数据校验规则。关卡数据在构建时强制校验，确保每关都有唯一最优解（Pillar 1），格式极简（Pillar 4）。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

关卡数据结构定义了数字连线游戏中每一关的数据格式与约束规则。它是所有其他系统的数据契约——网格连线引擎从中读取网格布局和数字节点位置来渲染可玩关卡；关卡求解器依据此格式验证关卡可解性；本地存储用它序列化玩家进度。数据以 JSON 格式存储，包含网格尺寸、数字节点坐标序列、障碍格列表、关卡最优步数基准值以及关卡元信息（编号、难度等级、所属章节）。所有关卡数据在构建时通过求解器验证，确保每一关都有唯一最优解（Pillar 1），且格式极简、无冗余字段（Pillar 4）。

## Player Fantasy

关卡数据结构是纯基础设施，玩家不直接感知其存在。玩家体验的是它支撑的结果：每一关都有确定的最优解（Pillar 1）、难度曲线平滑、操作响应即时。数据格式的质量直接影响"划线本身就是奖励"（Pillar 3）的实现——结构清晰则加载快，加载快则手感流畅。

## Detailed Design

### Core Rules

**规则 1：关卡数据容器**

```
LevelData = {
  version: string,       // 数据格式版本（"1.0"）
  levels: Level[]        // 关卡数组，按 id 升序排列
}
```

**规则 2：单关数据结构**

```
Level = {
  id: number,            // 关卡唯一 ID，从 1 开始递增
  name: string,          // 显示名称（如 "1-3"）
  chapter: number,       // 所属章节（1-based）
  difficulty: number,    // 难度等级 1-5（1=最简单 3x3，5=最难 10x10+障碍）
  grid: {
    rows: number,        // 行数，范围 [3, 10]
    cols: number         // 列数，范围 [3, 10]
  },
  nodes: Node[],         // 数字节点列表，按 number 升序
  blockedCells: Cell[],  // 障碍格列表（可选，空数组表示无障碍）
  optimalSteps: number,  // 理论最小步数（由求解器计算并写入）
  unlockCondition: null | {  // 解锁条件（null = 默认解锁，即通关上一关）
    type: "stars",       // 条件类型：累计星级
    value: number        // 所需星数
  }
}
```

**规则 3：数字节点**

```
Node = {
  number: number,    // 数字（从 1 开始，必须连续：1,2,3,...）
  row: number,       // 所在行（0-based，范围 [0, rows-1]）
  col: number        // 所在列（0-based，范围 [0, cols-1]）
}
```

约束：
- 节点数量必须 ≥ 2
- number 必须从 1 开始，连续无跳跃
- 两个节点不能占据同一格
- 所有节点必须在网格范围内

**规则 4：障碍格**

```
Cell = {
  row: number,    // 行坐标（0-based）
  col: number     // 列坐标（0-based）
}
```

约束：
- 障碍格不能与任何节点重合
- 障碍格必须在网格范围内
- 障碍格数量不能超过 `(rows * cols) - nodes.length`（否则关卡无解）

**规则 5：最优步数**
- `optimalSteps` 由关卡求解器计算并写入，非手工设定
- 一步定义为从一个格子移动到相邻格子（上下左右）
- 最优步数值 = 按序连接所有节点的最短路径总步数
- MVP 阶段手工预设此值（由人工验证），Vertical Slice 阶段由求解器自动计算

### States and Transitions

关卡数据为静态数据，无运行时状态。

### Interactions with Other Systems

| 交互系统 | 方向 | 数据流 |
|----------|------|--------|
| 网格连线引擎 | 读取关卡数据 | 读取 grid、nodes、blockedCells 渲染关卡 |
| 步数评分系统 | 读取 optimalSteps | 与玩家实际步数比较，输出星级 |
| 关卡求解器 | 读取 + 写入 optimalSteps | 读取 nodes/blockedCells 计算最优解，回写 optimalSteps |
| 本地存储 | 读取 id + 写入进度 | 以 level.id 为 key 存储通关状态和星级 |
| 关卡选择界面 | 读取关卡元信息 | 读取 id、name、chapter、difficulty、unlockCondition 渲染列表 |

## Formulas

关卡数据结构本身不包含计算公式。`optimalSteps` 的最优路径计算由关卡求解器（系统 #12）负责，不属于本系统的公式范围。

## Edge Cases

| 场景 | 预期行为 | 理由 |
|------|----------|------|
| JSON 文件格式损坏或缺失必填字段 | 关卡加载失败，显示"关卡数据错误"，不崩溃 | 优雅降级——不让坏数据导致白屏 |
| 两个节点的坐标相同 (row, col) | 数据校验拒绝，关卡不通过验证 | 违反"每个格子最多一个节点"约束 |
| optimalSteps ≤ 0 | 数据校验拒绝，必须 ≥ 1 | 最小也要 1 步才能完成 |
| grid.rows 或 cols 超出 [3, 10] 范围 | 数据校验拒绝 | 3x3 是最小可玩网格，10x10 是手机屏幕可读上限 |
| nodes 数量 < 2 | 数据校验拒绝 | 至少要 1→2 才有连线意义 |
| blockedCells 覆盖所有剩余空格 | 数据校验拒绝 | 必须给路径留出空间 |
| 关卡文件过大（>500KB） | 警告但不拒绝 | 微信小游戏包体敏感，但 MVP 不设硬限制 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 网格连线引擎 | 连线引擎依赖本系统 | 读取 Level 数据渲染关卡，硬依赖——无数据则引擎无输入 |
| 关卡求解器 | 求解器依赖本系统 | 读取 nodes/blockedCells，输出 optimalSteps，硬依赖 |
| 步数评分系统 | 评分依赖本系统（间接） | 通过 optimalSteps 字段获取基准值 |
| 本地存储 | 存储依赖本系统（间接） | 以 level.id 为 key 索引玩家进度 |
| 关卡选择界面 | 界面依赖本系统 | 读取 id/name/chapter/difficulty 渲染列表 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 增大效果 | 减小效果 |
|------|--------|----------|----------|----------|
| grid.rows / grid.cols | — | [3, 10] | 网格更大，路径更长，难度提升 | 网格更小，更简易 |
| difficulty | — | [1, 5] | 关卡归类到更高难度段 | 关卡归类到更低难度段 |
| nodes 数量 | — | [2, rows×cols-1] | 更多连线步骤，增加复杂度 | 更少步骤，降低复杂度 |
| unlockCondition.value | — | [0, 150] | 需要更多累计星级才能解锁 | 解锁门槛降低 |
| 最大 blockedCells 比例 | — | [0, 0.5] | 更多障碍，路径约束更严 | 更少障碍，更自由 |

## Visual/Audio Requirements

不适用——纯数据层，无视觉或音频反馈。

## UI Requirements

不适用——纯数据层，无直接 UI。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| optimalSteps 被读取 | `design/gdd/step-scoring.md` | `optimalSteps` 作为评分基准 | Data dependency |
| Level.id 被索引 | `design/gdd/local-storage.md` | `level.id` 作为存档 key | Data dependency |
| grid/nodes/blockedCells 被读取 | `design/gdd/grid-connection-engine.md` | Level 全部几何数据 | Data dependency |

## Acceptance Criteria

- **GIVEN** 一份符合 Schema 的 levels.json，**WHEN** 加载器解析它，**THEN** 返回 `LevelData` 对象，`levels` 数组按 `id` 升序排列
- **GIVEN** 一个 Level 对象，**WHEN** `nodes` 的 `number` 为 `[1, 2, 3]` 且连续，**THEN** 数据校验通过
- **GIVEN** 一个 Level 对象，**WHEN** `nodes` 的 `number` 为 `[1, 3]`（不连续），**THEN** 校验拒绝，返回明确错误信息
- **GIVEN** 一个 Level 对象，**WHEN** `grid.rows = 12`（超出 [3,10]），**THEN** 校验拒绝
- **GIVEN** 一个 Level 对象，**WHEN** 两个 Node 坐标相同，**THEN** 校验拒绝
- **GIVEN** 一个 Level 对象，**WHEN** `optimalSteps = 0`，**THEN** 校验拒绝
- **GIVEN** 一份包含 50 关的有效 levels.json，**WHEN** 加载并校验全部，**THEN** 50 关全部通过，无遗漏
- 性能：加载并校验 50 关的 JSON（~50KB），在微信小游戏环境中 ≤ 100ms

## Open Questions

暂无。所有字段和约束已在 Detailed Design 中明确定义。
