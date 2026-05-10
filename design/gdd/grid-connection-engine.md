# 网格连线引擎

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 1（纯逻辑零运气）、Pillar 3（划线本身就是奖励）、Pillar 4（越简单越好）

## Summary

网格连线引擎是数字连线游戏的核心玩法实现。它将关卡数据渲染为可玩网格，处理玩家的滑屏连线操作——按数字顺序连接节点、填充格子、播放音效——在全部格子填满后触发通关。它是 Pillar 1（确定性关卡）+ Pillar 3（划线手感）+ Pillar 4（极简网格渲染）的直接执行者。

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `关卡数据结构, 游戏状态机, 输入管理器, 音频管理器`

## Overview

网格连线引擎是数字连线游戏的核心玩法实现。玩家在网格上滑动手指，按数字顺序（1→2→3→...）依次连接节点，途经的每个格子被填充为当前数字的颜色。所有格子填满即通关。引擎负责：将关卡数据渲染为可玩网格、接收并验证玩家的每一步连线、管理撤销操作、在全部格子填充完毕后触发通关事件。引擎是 Pillar 3（"划线本身就是奖励"）的主要执行者——每步连线的咔嗒音效、格子填充动画、连线轨迹的实时渲染，共同构成"画线很爽"的触觉体验。

## Player Fantasy

"别人觉得乱的东西，我看得到秩序。" 网格连线引擎是核心幻想的直接载体。玩家手指划过屏幕时，每一格被瞬间填满的满足感、按序连接数字的"我有计划"掌控感、以及全屏格子都被颜色填满后的"整齐了！"——这些情感高潮都由引擎精准交付。参考体验：Flow Free 的流畅跟手 + 数独的严肃逻辑掌控。

## Detailed Design

### Core Rules

**规则 1：网格初始化**

引擎在 `onEnter(Playing)` 时执行：
1. 从关卡数据加载 Level 对象（grid.rows, grid.cols, nodes[], blockedCells[]）
2. 创建 rows × cols 的二维网格单元数组 `grid[row][col]`
3. 每个网格单元 Cell 包含：

```
Cell = {
  filled: boolean,           // 是否已被填充
  ownerNumber: number | null, // 填充它的数字（null=未填充）
  isNode: boolean,           // 是否为数字节点
  nodeNumber: number | null, // 节点上的数字（1, 2, 3...）
  isBlocked: boolean         // 是否为障碍格
}
```

4. 在对应坐标放置数字节点（标记 isNode=true, nodeNumber=N）
5. 标记障碍格（标记 isBlocked=true）
6. 计算并发送 gridOriginX/Y 和 cellSize 给输入管理器

**规则 2：路径追踪（核心循环）**

响应 INPUT_MOVE(row, col) 事件：
1. 检查 Cell(row, col).filled —— 若已填充，执行规则 4（回溯）
2. 检查 Cell(row, col).isBlocked —— 若为障碍格，忽略
3. 若当前路径为空（第一次触摸），检查是否触摸在数字节点上
   - 是：开始新路径，`currentNumber = nodeNumber`
   - 否：忽略（必须从数字节点开始）
4. 填充该格：filled=true, ownerNumber=currentNumber
5. 触发音频管理器 play('TICK')
6. 将该格坐标推入当前路径数组 `path[]`
7. 若该格是数字节点且 `nodeNumber == currentNumber + 1`：
   - 锁定当前数字段的路径
   - `currentNumber += 1`（切换到下一个数字的颜色）
8. 若该格是数字节点且 `nodeNumber == currentNumber`：不做特殊处理

**规则 3：序列连接验证**

- 引擎不强制一次连对所有数字——玩家可以先连 1→2，抬手指，再开始连 2→3
- 当前路径始终以 currentNumber 的颜色填充，直到触达 currentNumber+1 节点
- 不能跳数字：如果 currentNumber=2，触摸到 nodeNumber=4 的节点 → 无效

**规则 4：路径回溯（撤销单步）**

- 若手指滑入已填充格，且该格等于 `path[path.length-1]`（当前路径末尾）：
  - 执行撤销：filled=false, ownerNumber=null, path.pop()
  - 触发音频 TICK（降低音调表示撤回）
- 若该已填充格不属于当前路径末尾（已锁定或属于更早数字段）：
  - 忽略输入——不可修改已锁定的路径

**规则 5：通关检测**

每步填充后检查：
- `allCellsFilled = grid 中所有非障碍格均已 filled`
- 若 true → 引擎发出 `LEVEL_COMPLETE` 事件给游戏状态机
- 检测在每次 INPUT_MOVE 和 INPUT_END 后均执行

**规则 6：撤销操作**

- 提供 `undo()` 方法供 HUD 的撤销按钮调用
- 移除当前 path 最后一格：filled=false, ownerNumber=null, path.pop()
- 若该格为数字节点，还需恢复 currentNumber：`currentNumber = nodeNumber - 1`
- 若 path 为空，无操作

### States and Transitions

| 内部状态 | 含义 | 触发条件 |
|----------|------|----------|
| `Idle` | 无触摸，等待玩家开始画线 | onEnter(Playing) 初始化后 |
| `Drawing` | 手指按下并滑动中 | 第一次有效 INPUT_MOVE |
| `Dirty` | 手指抬起，等待继续或新路径 | INPUT_END |

```
Idle ──(首次有效触摸)──→ Drawing
Drawing ──(INPUT_END)──→ Dirty
Dirty ──(新 TOUCH_START)──→ Drawing（继续路径）或 Idle（新起点）
Drawing ──(全部填满)──→ 触发 LEVEL_COMPLETE
```

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 关卡数据结构 | 读取 | Level(grid, nodes, blockedCells) → 初始化网格单元 |
| 游戏状态机 | 双向 | 监听 onEnter(Playing) 初始化 + onExit(Playing) 清理；触发 LEVEL_COMPLETE |
| 输入管理器 | 订阅事件 + 提供布局参数 | 订阅 INPUT_MOVE(row,col)、INPUT_END；提供 gridOriginX/Y、cellSize |
| 音频管理器 | 调用 | play('TICK') 每步填充 + 回溯；play('LEVEL_COMPLETE') 通关 |
| 步数评分系统 | 通知 | 每步填充后通知 stepCount++；通关时发送最终步数 |

## Formulas

引擎维护步数计数 `stepCount`——每成功填充一格 +1，每撤销一格 -1。星级评分的具体公式由步数评分系统（系统 #8）负责。引擎不计算星级。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 玩家从非数字格开始滑动 | 忽略——必须从数字节点开始 |
| 玩家在 Drawing 状态手指滑到网格外 | 输入管理器丢弃越界坐标，引擎不感知 |
| 玩家抬手指后从不同的数字节点重新开始 | 视为新路径——currentNumber 重置为触摸的数字 |
| 快速滑动导致跳格（>1 格/帧） | 对跳过的格子进行 Bresenham 直线插值填充，确保无空格 |
| 当前路径回溯到起点（路径完全回退） | 所有格恢复未填充，保持 currentNumber，等待新触摸 |
| 最后一个非障碍格恰好在 INPUT_END 时才被填充 | 通关检测在 INPUT_END 后执行，正常触发 LEVEL_COMPLETE |
| 网格初始化时关卡数据格式异常 | console.error + 回退到 MenuScene |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 关卡数据结构 | 引擎依赖 | 硬依赖——无数据则无网格可渲染 |
| 游戏状态机 | 引擎依赖 | 硬依赖——引擎仅在 Playing 态运行 |
| 输入管理器 | 引擎依赖 | 硬依赖——引擎的唯一输入来源 |
| 音频管理器 | 引擎依赖 | 硬依赖——无音频则划线手感降级 |
| 步数评分系统 | 评分依赖引擎 | 评分系统读取引擎的 stepCount |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| cellSize (px) | 自动计算 | [40, 120] | 格子越大越易操作但网格越小；越小越难精确触摸 |
| Bresenham 插值 | 开启 | on/off | 关闭会导致快速滑动时跳格出现空隙 |
| 回溯 TICK 音调降低 | -12 半音 | [-6, -24] | 更大幅度让撤销反馈更明显 |

## Visual/Audio Requirements

| 事件 | 视觉反馈 | 音频反馈 | 帧预算 |
|------|----------|----------|--------|
| 手指滑入新格 | 格子瞬间填充当前颜色（0ms 延迟），可选 ≤100ms 缩放入场动画 | TICK（60ms 咔嗒音） | 3 帧 |
| 回溯/撤销 | 填充色消失，格子恢复空白 | TICK 低音版（60ms） | 3 帧 |
| 通关 | 全部格子闪烁一次（200ms），然后弹出结算弹窗 | LEVEL_COMPLETE 音效 | — |

> 📌 **Asset Spec** — 视觉/音频需求已定义。美术 Bible 批准后运行 `/asset-spec system:grid-connection-engine` 产出每个资产的视觉描述、尺寸和生成提示。

## Game Feel

### Feel Reference

Flow Free 的流畅跟手 + 机械键盘的咔嗒确认感。手指划过的每一格都能"感觉到"——像按下一个个微型开关。NOT floaty like early touch games with no haptic feedback.

### Input Responsiveness

| 操作 | 最大延迟 (ms) | 帧预算 (@60fps) |
|------|-------------|-----------------|
| 手指触屏 → 首格填充 | 50ms | 3 帧 |
| 滑动到下一格 → 填充 | 16ms | 1 帧 |
| 撤销 → 填充恢复 | 16ms | 1 帧 |

### Animation Feel Targets

动画全部 ≤ 100ms——填充动画为快速缩放（0.85→1.0 scale，100ms），通关闪烁为 opacity 脉冲（1.0→0.5→1.0，200ms）。

### Weight and Responsiveness Profile

- **Weight**: 轻量级——手指划过的瞬间就有反馈。不沉重，不惯性。
- **Player control**: 高控制——手指到哪画到哪，可随时回溯撤销。
- **Snap quality**: 清晰干脆——填充是瞬间的，不是渐变的。
- **Failure texture**: 公平——卡关是因为路径策略错误，不是操作失误。手指滑错可立即回溯纠正。

### Feel Acceptance Criteria

- [ ] 手指挥过网格时，填充没有可感知延迟（目标 ≤16ms/格）
- [ ] 玩家不用看手指就知道画到哪了——音频咔嗒声提供触觉替代
- [ ] "这游戏画线很爽"——可玩性测试中至少 50% 玩家自发提到手感

## UI Requirements

引擎本身无 UI。引擎通过以下方式驱动 UI：
- 发送 stepCount → HUD 显示步数计数器
- 发送 currentNumber → HUD 显示当前连线的数字/颜色
- 触发 LEVEL_COMPLETE → 结算弹窗显示

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| 读取 Level 数据 | `design/gdd/level-data-schema.md` | Level(grid, nodes, blockedCells) | Data dependency |
| 监听 Playing 状态 | `design/gdd/game-state-machine.md` | onEnter(Playing) / onExit(Playing) | State trigger |
| 订阅 INPUT_MOVE | `design/gdd/input-manager.md` | INPUT_MOVE(gridRow, gridCol) | Data dependency |
| 提供布局参数 | `design/gdd/input-manager.md` | gridOriginX/Y, cellSize | Data dependency |
| 触发音效 | `design/gdd/audio-manager.md` | play('TICK') / play('LEVEL_COMPLETE') | Data dependency |
| 发送步数 | `design/gdd/step-scoring.md` | stepCount 输出 | Data dependency |

## Acceptance Criteria

- **GIVEN** onEnter(Playing) + 有效 Level(id=1, 4x4, 3 nodes)，**WHEN** 引擎初始化，**THEN** 4×4 网格渲染完毕，3 个数字节点在正确位置
- **GIVEN** 当前路径为空，**WHEN** 玩家触摸 nodeNumber=1 的格子，**THEN** currentNumber=1，该格被填充，stepCount=1
- **GIVEN** currentNumber=1，**WHEN** 玩家滑动到 nodeNumber=2 的格子，**THEN** currentNumber 变为 2，1-2 段路径被锁定
- **GIVEN** currentNumber=2，**WHEN** 玩家直接触摸 nodeNumber=4 的格子（跳过 3），**THEN** 触摸被忽略，currentNumber 保持为 2
- **GIVEN** 玩家从 (1,0) 开始绘制并滑过 (1,1)→(1,2)，**WHEN** 手指滑回 (1,1)，**THEN** (1,1) 被撤销填充，stepCount 减少
- **GIVEN** 全部非障碍格已填充，**WHEN** INPUT_END 触发，**THEN** LEVEL_COMPLETE 事件发送给状态机
- **GIVEN** 手指快速从 (0,0) 滑到 (0,3)（跳过中间 3 格），**WHEN** 该帧处理完成，**THEN** 跳过的所有格子均被填充（Bresenham 插值）

## Open Questions

- Bresenham 插值是否在所有网格尺寸下都产生正确的格子序列？→ 需要单元测试验证 3x3 到 10x10 网格
- 微信小游戏 Canvas 上 60fps 稳定渲染能否保证？→ /prototype 核心连线操作 第一周验证
