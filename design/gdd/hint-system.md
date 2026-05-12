# 提示系统

> **Status**: In Design
> **Author**: cocos-specialist + game-designer
> **Last Updated**: 2026-05-10
> **Implements Pillar**: Pillar 1（纯逻辑零运气）、Pillar 2（一分钟一关）

## Summary

提示系统为卡关玩家提供下一步最优连线方向的视觉指引。玩家消耗提示次数后，系统通过简化版 BFS 路径查找计算从当前数字节点到下一节点的最短路径方向，在网格上以箭头动画展示。MVP 阶段每日赠送 3 次免费提示，不依赖完整关卡求解器。

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `网格连线引擎`

## Overview

提示系统为卡关玩家提供"下一步该走哪个方向"的视觉指引，是防挫败机制的直接实现。玩家消耗一次提示机会后，系统从网格连线引擎获取当前格子状态，通过简化版 BFS（广度优先搜索）计算从当前数字节点到下一节点的最短路径第一步方向，在游戏网格上叠加动态箭头指引——箭头从玩家当前位置指向下一步最优格。MVP 阶段每日赠送 3 次免费提示，不依赖关卡求解器。

提示系统是 Pillar 2（"一分钟一关"）的防护网——当一关超过 3 分钟仍未解出，玩家可以"求助而非放弃"。它同时服务于 Pillar 1（纯逻辑零运气）：提示并非猜测或随机结果，而是对当前关卡状态的确定性推演。没有提示系统，卡关的挫败感会直接导致流失。

## Player Fantasy

"原来这么走！" 提示不是认输，而是看清算法的那个瞬间。玩家在网格前卡了两分钟，各种路径都试过就是不对。点击提示按钮——一个箭头在网格上亮起，指向一个之前完全没想过的方向。"啊，从那里绕过去！" 那一瞬间不是"我被帮了"的羞耻，而是"原来如此"的顿悟快感。

提示系统是核心幻想（"别人觉得乱的东西，我看得到秩序"）的辅助执行者。正常游戏时，秩序由玩家自己发现；卡关时，秩序由提示揭示。提示箭头像是一个友善的旁观者指着棋盘说："你有没有想过走这边？"——引导但不灌输，暗示但不剧透。

参考体验：填字游戏 app 中"显示一个字母"按钮——不会填完整词，只是让你跨过卡点然后自己继续。好的提示让玩家觉得"就差这一点，我自己也快想到了"。

## Detailed Design

### Core Rules

**规则 1：提示计数器**

每位玩家每日 3 次免费提示（`maxDailyHints = 3`）。存储结构为 `{ remaining: number, lastResetDate: "YYYY-MM-DD" }`。每次消耗提示后 `remaining -= 1`，立即同步写入本地存储。App 启动和每次点击提示按钮时检查：若 `lastResetDate != today`，重置为 3。

**规则 2：提示按钮**

HUD 新增提示按钮（灯泡图标 + 剩余次数角标），位置在屏幕底部右侧（撤销按钮旁）。Playing 状态显示，LevelComplete 状态隐藏。`remaining = 0` 时灰色不可点击。Drawing 状态下禁用——手指触屏时不可点。

**规则 3：触发流程**

1. 玩家点击提示按钮 → `remaining -= 1`，同步写入存储
2. 从引擎获取当前格子状态 → 运行简化 BFS（见 Formulas）
3. BFS 找到路径 → 在网格上渲染箭头，进入 ACTIVE
4. BFS 无路径（玩家堵死自己）→ `remaining += 1` 回退，Toast 显示"无路可走，试试撤销"

**规则 4：箭头渲染**

三角形箭头叠加在网格 Cell 层之上、HUD 层之下。指向 4 方向之一（↑↓←→），标明下一步应移动的格子。箭头位于目标格中央，颜色与 currentNumber 对应色一致，带微弱辉光增强辨识。箭头指向的是 BFS 路径的第一格，不显示完整路径。

**规则 5：箭头消失条件**

以下任一触发即消失：(a) 玩家做出任何有效填充（立即消失）、(b) 超时 `arrowTimeoutMs = 5000`（渐隐消失）、(c) 游戏进入 Paused 状态（立即消失）、(d) 玩家再次点击提示按钮（取消当前提示）。

**规则 6：BFS 起点与目标**

- 若当前段 `path[]` 为空：起点 = `nodeNumber === currentNumber` 的节点格
- 若当前段 `path[]` 非空：起点 = `path[path.length - 1]`
- 目标 = `nodeNumber === currentNumber + 1` 的节点格

**规则 7：连续使用**

每次消耗 1 次提示显示当前段的下一步方向，玩家可连续消耗多次——这是直觉性设计而非 bug。

### States and Transitions

| 当前状态 | 事件 | 目标状态 |
|----------|------|----------|
| IDLE | 点击提示且 remaining>0 | COMPUTING |
| IDLE | remaining=0 | COOLDOWN |
| COMPUTING | BFS 找到路径 | ACTIVE |
| COMPUTING | BFS 无路径 | IDLE（回退计数 + Toast） |
| ACTIVE | 玩家移动 / 超时 / 暂停 / 再次点击 | IDLE |
| COOLDOWN | 日历日重置 | IDLE |

COMPUTING 是瞬态（<1 帧完成），玩家不可感知。COOLDOWN 状态下点击按钮弹出 Toast："今日提示已用完，明日重置"。

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 网格连线引擎 | 读取 + 渲染 | 读取 Cell[][]、currentNumber、path[]；提供 hintArrow {row, col, direction} 供引擎渲染 |
| 本地存储 | 读写 | 读写 hint remaining 和 lastResetDate |
| 游戏内 HUD | 双向 | 提供 remaining 给 HUD 显示；HUD 发送 hint 点击事件 |

## Formulas

### 简化 BFS 路径查找

```
findNextStep(grid, start, target):
  queue ← [{pos: start, path: [start]}]
  visited ← {start.key}

  while queue not empty:
    current ← queue.dequeue()
    for dir in [UP, DOWN, LEFT, RIGHT]:
      neighbor ← current.pos + dir
      if neighbor == target:
        return dirFrom(start, neighbor)     // 返回从起点出发的第一步方向
      if neighbor is invalid (越界/filled/blocked/visited):
        continue
      visited.add(neighbor.key)
      queue.enqueue({pos: neighbor, path: current.path + [neighbor]})

  return null                               // 无路可达
```

**变量：**

| 变量 | 符号 | 类型 | 范围 | 描述 |
|------|------|------|------|------|
| grid | G | Cell[][] | [3×3, 10×10] | 引擎当前格子状态 |
| start | S | {row, col} | [0,0]–[rows-1, cols-1] | BFS 起点 |
| target | T | {row, col} | [0,0]–[rows-1, cols-1] | BFS 目标（下一数字节点） |
| dirFrom | — | function | {UP, DOWN, LEFT, RIGHT} | 从 start 到 neighbor 的方向 |

**输出范围：** 4 方向之一或 `null`（无路径）
**性能：** 最坏情况 10×10=100 格，BFS 访问 <100 节点，预估 <0.1ms
**示例：** start={2,0}, target={2,3}, grid 无障碍 → BFS 返回 RIGHT

### 每日重置判定

```
shouldReset = (lastResetDate != todayDate())
若 true → remaining = 3, lastResetDate = todayDate()
```

`todayDate()` 返回设备本地时区的 `YYYY-MM-DD` 字符串。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| BFS 找不到路径（玩家把自己堵死） | 不消耗提示次数（remaining 回退 +1），Toast "无路可走，试试撤销" |
| ACTIVE 状态下玩家撤销回起点 | 箭头在玩家移动事件触发时消失（规则 5a），可重新点击获取新提示 |
| 连续快速点击提示按钮 | 每次独立处理——第二次点击在第一次 ACTIVE→IDLE 后生效 |
| 3 次提示全部用完 | 按钮灰色；点击弹出 Toast "今日提示已用完，明日重置" |
| 跨日历日（午夜 0:00 游戏中） | 下次点击提示按钮时检测到日期变更，自动重置 remaining=3 |
| 首次使用（存储 key 不存在或损坏） | 初始化为 `{ remaining: 3, lastResetDate: today }` |
| 玩家刚进关卡尚未开始连线 | BFS 起点 = nodeNumber=1 节点格，目标 = nodeNumber=2 节点格 |
| 关卡最后一段（currentNumber = 最大数字-1） | BFS 正常执行，与普通段一致 |
| Drawing 状态下点击提示按钮 | 按钮灰色禁用，不响应点击——触摸状态冲突 |
| 微信切后台时提示箭头正在显示 | 状态机触发 PAUSE → 箭头立即消失（规则 5c） |
| 提示箭头指向的格子在 ACTIVE 期间被其他操作填充 | 不走此路径——箭头消失优先于任何填充操作（规则 5a） |
| 关卡通关后提示按钮未隐藏 | 规则 2：LevelComplete 状态隐藏——防御层确保不可见 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 网格连线引擎 | 提示系统依赖引擎 | 硬依赖——读取网格状态（Cell[][]、currentNumber、path[]），提供箭头渲染数据 |
| 本地存储 | 提示系统依赖存储 | 硬依赖——读写提示剩余次数和日期标记 |
| 游戏内 HUD | HUD 依赖提示系统 | 硬依赖——HUD 集成提示按钮，显示剩余次数，发送点击事件 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| 每日免费次数 maxDailyHints | 3 | [1, 10] | 增大→更宽容但降低激励视频价值；减小→更克制但可能增加挫败 |
| 箭头超时 arrowTimeoutMs | 5000 | [2000, 15000] | 太短箭头来不及看；太长遮挡网格影响游戏 |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 |
|------|------|------|
| 箭头出现 | 三角形从 0→1 scale 缩放入场（100ms），指向目标格 | 短促上升音（"叮"——提示激活） |
| 箭头超时消失 | opacity 从 1→0 渐变（300ms） | 无 |
| 箭头被移动触发消失 | 立即消失（无动画） | 无 |
| 提示次数用尽 | 按钮变灰 + 角标显示 "0" 红色 | 短促下降音（"嘟"——无法使用） |

> 📌 **Asset Spec** — 视觉/音频需求已定义。美术 Bible 批准后运行 `/asset-spec system:hint-system` 产出箭头图标、灯泡按钮和音效的视觉描述。

## UI Requirements

- **提示按钮**：HUD 新增，灯泡图标 + 角标数字，44×44px 最小触控区域
- **Toast 提示**：屏幕中央半透明黑底白字，显示 1.5 秒后消失
- **箭头指示器**：三角形，尺寸 = cellSize × 0.6，与当前数字同色，2px 白色描边增强辨识
- HUD 设计师参考 `design/gdd/in-game-hud.md` 整合提示按钮到现有布局

> 📌 **UX Flag — 提示系统**：此系统有 UI 需求。在 Phase 4 (Pre-Production) 运行 `/ux-design` 创建提示按钮的 UX spec 后再写 epic。

## Acceptance Criteria

- **GIVEN** 玩家首次进入关卡且 remaining=3，**WHEN** 点击提示按钮，**THEN** 箭头出现在网格上指向下一步方向，remaining 变为 2
- **GIVEN** remaining=0，**WHEN** 点击提示按钮，**THEN** 无效果，Toast "今日提示已用完，明日重置"
- **GIVEN** 提示箭头正在显示，**WHEN** 玩家做出任何有效填充，**THEN** 箭头立即消失
- **GIVEN** 提示箭头正在显示且经过 5 秒，**WHEN** 无任何操作，**THEN** 箭头渐隐消失
- **GIVEN** BFS 找到从起点到下一数字节点的路径，**WHEN** 箭头渲染，**THEN** 箭头方向为 BFS 路径第一步的方向
- **GIVEN** 玩家当前路径将自己完全堵死，**WHEN** 点击提示，**THEN** BFS 返回 null，remaining 不变，Toast "无路可走，试试撤销"
- **GIVEN** 日期跨越午夜，**WHEN** 点击提示按钮，**THEN** remaining 重置为 3
- **GIVEN** 手指正在网格上滑动（Drawing 态），**WHEN** 检查提示按钮，**THEN** 按钮灰色不可点击

## Open Questions

- 后续版本是否需要"完整路径提示"（显示整段而非仅下一步）？→ Vertical Slice 评估
- 激励视频接入后，看完广告奖励多少提示次数？→ 激励视频广告 GDD 中定义
- 是否需要"无提示通关"成就标记？→ 关卡求解器上线后评估
