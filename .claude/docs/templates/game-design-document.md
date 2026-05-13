# [Mechanic/System Name]

> **状态**：Draft|In Review|Approved|Implemented
> **作者**：[Agent or person]
> **最后更新**：[Date]
> **最后验证**：[Date — when this doc was last confirmed accurate against current design]
> **实施支柱**：[Which game pillar this supports]

## 概括

[2-3 句话：这个系统是什么，它为玩家做什么，以及为什么它
存在于这个游戏中。为分层上下文加载而编写——技能扫描
20 GDD 使用本节来决定是否进一步阅读。No行话。]

> **快速参考** — 图层：`[Foundation | Core | Feature | Presentation]`· 优先级：`[MVP | Vertical Slice | Alpha | Full Vision]`· 关键部门：`[System names or "None"]`

## 概述

[向一无所知的人解释这一机制的一段话
该项目。它是什么，玩家做什么，为什么存在？]

## 玩家幻想

[当玩家接触这个机制时应该有什么感觉？什么是
情感或权力幻想得到满足吗？本节指导所有细节
决定如下。]

## 详细设计

### 核心规则

[精确、明确的规则。程序员应该能够实现这个
部分，无需提问。对顺序流程使用编号规则
以及属性的要点。]

### 状态和转换

[如果该系统有状态（e.g.、武器状态、状态效果、阶段），
记录每个状态以及状态之间的每个有效转换。]

| 状态 | 入场条件 | 退出条件 | 行为 |
|-------|----------------|----------------|----------|

### 与其他系统的交互

[这个系统如何与战斗互动？存货？进展？用户界面？
对于每次交互，指定接口：数据流入什么、流向什么
出去，谁负责什么。]

## 公式

[Every mathematical formula used by this system. For each formula:]

### [Formula Name]

```
result = base_value * (1 + modifier_sum) * scaling_factor
```

| 多变的 | 类型 | 范围 | 来源 | 描述 |
|----------|------|-------|--------|-------------|
| 基值 | 漂浮 | 1-100 | 数据文件 | 修饰符之前的基本量 |
| 修饰符_和 | 漂浮 | -0.9至5.0 | 计算出的 | 所有有效修改器的总和 |
| 缩放因子 | 漂浮 | 0.5-2.0 | 数据文件 | 基于级别的缩放 |

**预期输出范围**：[min]至[max]
**边缘情况**：当modifier_sum < -0.9时，钳制至-0.9以防止出现负结果。

## 边缘情况

[明确记录异常情况下发生的情况。每个边缘情况
应该有一个明确的解决方案。]

| 设想 | 预期行为 | 基本原理 |
|----------|------------------|-----------|
| [What if X is zero?] | [This happens] | [Because of this reason] |
| [What if both effects trigger?] | [Priority rule] | [Design reasoning] |

## 依赖关系

[List every system this mechanic depends on or that depends on this mechanic.]

| 系统 | 方向 | 依赖性的性质 |
|--------|-----------|---------------------|
| [Combat] | 这个要看战斗力 | 需要伤害计算结果 |
| [Inventory] | 库存就看这个了 | 提供物品效果数据 |

## 调音旋钮

[为了平衡而应该调整的每个值。包括当前的
值、安全范围以及极端情况下会发生什么。]

| 范围 | 当前值 | 安全范围 | 增加效果 | 减少的影响 |
|-----------|--------------|------------|-------------------|-------------------|

## Visual/Audio要求

[What visual and audio feedback does this mechanic need?]

| 事件 | 视觉反馈 | 音频反馈 | 优先级 |
|-------|----------------|---------------|----------|

## 游戏感

> **为什么此部分与Visual/Audio要求分开存在**：Visual/Audio
> 需求记录发生了什么反馈事件（映射到资产的事件表）。
> 游戏感觉记录了机械师操作时的感觉——响应能力、重量、
> 交互的快感和动觉质量。这些是时序的设计目标，
> 帧数据和控制的身体感觉。设计时必须指定游戏感觉
> 时间，因为它驱动动画预算、输入处理架构和命中盒
> 定时。实施后改造感觉目标的成本很高，而且通常需要
> 根本性返工。

### 感觉参考

[说出能够捕捉目标感觉的特定游戏、机制或时刻。准确一点——
引用确切的机制，而不仅仅是游戏。解释一下你借用的是什么品质。
可以选择包含反引用（这不应该是这样的感觉）。]

> 示例：“应该感觉像《黑暗之魂》中的武器挥舞一样——沉重、坚定、坚定
> 已发电报，但联系后满意。不像早期的光环混战那样飘逸。”

### 输入响应能力

[Maximum acceptable latency from player input to visible/audible response, per action.]

| 行动 | 最大输入到响应延迟（毫秒） | 帧预算（60fps） | 笔记 |
|--------|-----------------------------------|------------------------|-------|
| [Primary action] | [e.g., 50ms] | [e.g., 3 frames] | |
| [Secondary action] | | | |

### 动画感觉目标

[此机制中每个动画的帧数据目标。启动 = 之前结束
Active = 动作“发生”时的帧（hitbox live，
射击能力等）。恢复=动作结算后已承诺/易受攻击帧。]

| 动画片 | 启动帧 | 活动帧 | 恢复框架 | 感觉目标 | 笔记 |
|-----------|---------------|--------------|----------------|-----------|-------|
| [e.g., Light attack] | | | | [e.g., Snappy, low commitment] | |
| [e.g., Heavy attack] | | | | [e.g., Weighty, high commitment] | |

### 冲击时刻

[定义机制的标点符号 - 峰值反馈强度的时刻
让行动变得有意义。每项高风险活动都应至少有一项参赛作品。]

| 冲击型 | 持续时间（毫秒） | 效果说明 | 可配置？ |
|-------------|--------------|-------------------|---------------|
| 命中停止（冻结帧） | [e.g., 80ms] | [Freeze both objects on contact] | Yes |
| 屏幕抖动 | [e.g., 150ms] | [Directional, decaying] | Yes |
| 相机影响 | | | |
| 控制器隆隆声 | | | |
| 时间尺度减慢 | | | |

### 重量和响应能力概况

[A short prose description of the overall feel target. Answer the following:]

- **重量**：感觉是沉重而刻意的，还是轻盈而反应性的？
- **玩家控制**：玩家每时每刻的掌控感有多大？
  （高控制=可以在行动中修正方向；低控制=坚定、基于动力）
- **快照质量**：这感觉是清脆和二元的，还是平滑和模拟的？
- **加速模型**：movement/action是否立即启动（街机感觉）或
  从零开始（模拟感觉）？减速也是同样的问题。
- **失败纹理**：当玩家犯错误时，机制是否感觉公平
  还是惩罚？他们失败的原因是什么？

### 感觉接受标准

[游戏测试者可以在没有测量仪器的情况下验证的具体的、可测试的标准。
这些是主观目标，表述得足够精确，以获得一致的结论。]

- [ ][e.g., "Combat feels impactful — playtesters comment on weight unprompted"]
- [ ][e.g., "No reviewer uses the words 'floaty', 'slippery', or 'unresponsive'"]
- [ ][e.g., "Input latency is imperceptible at target 60fps framerate"]
- [ ][e.g., "Hit-stop reads as satisfying, not as lag or stutter"]

## 用户界面要求

[What information needs to be displayed to the player and when?]

| 信息 | 显示位置 | 更新频率 | 健康）状况 |
|-------------|-----------------|-----------------|-----------|

## 交叉参考

[声明对另一个GDD的特定机制、值或
规则。该表由`/review-all-gdds`Phase 2c 进行机器检查 - 它取代了
带有可验证声明的隐式散文引用。如果您引用另一个
系统的行为在本文档中的任何位置，它必须出现在这里。]

| 本文档参考文献 | 目标开发面积 | 引用的特定元素 | 自然 |
|--------------------------|-----------|----------------------------|--------|
| [e.g., "combo multiplier feeds score"] | `design/gdd/score.md` | `combo_multiplier`输出值 | 数据依赖 |
| [e.g., "death triggers respawn"] | `design/gdd/respawn.md` | 死亡状态转换 | 状态触发 |
| [e.g., "stamina gates dodge"] | `design/gdd/stamina.md` | 体力消耗规则 | 规则依赖 |

> **关于“自然”的注释**：使用其中之一 —`Data dependency`（我们消耗它们的输出），
> `State trigger`（他们的状态变化触发我们的行为），`Rule dependency`
> （我们的规则假设他们的规则也成立），`Ownership handoff`（我们移交
> 对他们来说有价值的所有权）。

## 验收标准

[Testable criteria that confirm this mechanic is working as designed.]

- [ ][Criterion 1: specific, measurable, testable]
- [ ][Criterion 2]
- [ ][Criterion 3]
- [ ]性能：系统更新在[X]毫秒内完成
- [ ]No实现中的硬编码值

## 开放性问题

[Anything not yet decided. Each question should have an owner and deadline.]

| 问题 | 所有者 | 最后期限 | 解决 |
|----------|-------|----------|-----------|
