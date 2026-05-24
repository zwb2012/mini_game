# 玩家控制器 (Player Controller)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（子弹重量——射击姿势影响弹道）、Pillar 4（通关靠脑子——操作简单，思考复杂）

## Summary

玩家控制器将触屏输入信号转化为角色的移动、瞄准和射击行为。它管理玩家的 CharacterBody2D 运动、面向方向、射击状态和与环境的物理交互。操作方案极简——左滑移动、右点射击——但通过物理反馈（后坐力、命中停顿）让每一个动作都有重量感。

> **Quick reference** — Layer: `Core Gameplay` · Priority: `MVP` · Key deps: `触屏输入系统, 物理引擎配置`

## Overview

玩家控制器是"玩家意图"到"角色行为"的翻译器。它每帧从触屏输入系统读取标准化信号，驱动 CharacterBody2D 移动（基于 move_direction 和速度参数），控制瞄准方向（基于 aim_position），并触发射击（通过 shoot_tapped/shoot_held 调用射击与弹道系统）。它还管理角色的基本属性——移动速度、面向方向、射击冷却。

## Player Fantasy

玩家控制器承载的是**"精准操控感"**——手指滑动多少角色就移动多少，点击哪里子弹就打向哪里。它不应有"迟缓感"或"不可预测性"——当玩家操作失误时，他们会说"我判断错了"，而不是"角色没按我想的动"。

参考：Dead Cells Mobile 的响应速度 + 魂斗罗的角色灵活性。**不应像**：坦克式操控（移动和瞄准耦合在一起）或虚拟按键式射击（需要"按按钮"而非"点即射"）。

## Detailed Design

### Core Rules

1. **移动**：
   - 每 `_physics_process` 读取 `move_direction`（已归一化，0~1 范围）
   - `velocity = move_direction * move_speed`
   - CharacterBody2D 使用 `move_and_slide()`，不手动设置 `position`
   - `move_speed` 默认 400 px/s

2. **面向方向**：
   - 瞄准点在角色右侧 → face_right = true
   - 瞄准点在角色左侧 → face_right = false
   - 无瞄准输入时（右区无手指）：保持最后一次的面向方向
   - 面向方向决定子弹发射方向和角色 sprite 翻转

3. **射击**：
   - `shoot_tapped`（点击）→ 调用武器系统的 `weapon_system.fire_current(origin, target)`
   - `shoot_held`（按住）→ 每帧调用 `weapon_system.fire_current(origin, target)`
   - 射速限制（CD）由 WeaponSystem 内部管理——PlayerController 不做 CD 检查（见 ADR-0009）

4. **射击冷却**：委托给 WeaponSystem。PlayerController 不追踪 `last_fire_time` 或 `shoot_interval`——每帧调用 `fire_current()`，由 WeaponSystem 内部拒绝 CD 未完成的调用。

5. **移动射击**：移动和射击可同时进行，移动速度不因射击而降低。Pillar 1：站立射击和移动射击的弹道不同——移动中射击的后坐力方向受移动方向影响（Alpha 阶段实现）。

6. **角色碰撞**：CharacterBody2D 在 Player 层（层1），碰撞 Enemy(2)、World(4)、PhysicsObject(5)。被 PhysicsObject（碎片）击中时受到推力（通过 `move_and_slide` 自然响应）。

### States and Transitions

| 状态 | 条件 | 行为 |
|------|------|------|
| **IDLE** | move_direction=(0,0), 无射击 | 角色静止，可立即响应输入 |
| **MOVING** | move_direction≠(0,0), 无射击 | 角色移动，面向随移动方向 |
| **AIMING** | 右区有手指, 无射击 | 角色可静止或移动，面向随瞄准点 |
| **SHOOTING** | 射击信号活跃 | 播放射击动画（1帧枪口闪光），子弹生成 |
| **MOVING_AND_SHOOTING** | 移动+射击同时 | 两者行为叠加 |

### Interactions with Other Systems

| 目标系统 | 方向 | 数据流 |
|----------|------|--------|
| 触屏输入系统 | 上游 | 读取 move_direction, aim_position, shoot_tapped, shoot_held, is_aiming |
| 物理引擎配置 | 上游 | 使用 CharacterBody2D，读取重力、碰撞层级 |
| 武器系统 | 输出 | 调用 weapon_system.fire_current(origin, target) 委托射击 |
| 2D 摄像机系统 | 输出 | 提供角色位置、面向方向（摄像机会据此偏移） |
| HUD 系统 | 输出 | 提供当前武器、弹药状态（通过武器系统间接） |

## Formulas

### 移动速度

```
velocity = move_direction * move_speed
```

| 变量 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `move_direction` | Vector2 | 长度 0~1 | 来自触屏输入系统的归一化方向 |
| `move_speed` | float | 200~800 | 最大移动速度（px/s），默认 400 |

### 射击间隔（委托给 WeaponSystem）

射击 CD 由 WeaponSystem 管理（ADR-0008, ADR-0009）。PlayerController 不追踪 `shoot_interval` 或 `last_fire_time`——每帧无条件调用 `WeaponSystem.fire_current()`，由 WeaponSystem 内部拒绝 CD 未完成的请求。参见 `weapon-system.md` 和 `docs/architecture/adr-0008-weapon-system-ammo.md`。

## Edge Cases

- **玩家被夹在 PhysicsObject 和 World 之间**: CharacterBody2D 的 `move_and_slide` 自动处理挤压——角色会被推出。如果完全无法推出（被卡死），持续受到挤压伤害（1 HP/秒）。
- **移动和瞄准方向相反（向左移动同时向右瞄准）**: 合法操作——角色向左移动但面向右方射击。这是战术玩法的一部分。
- **shoot_tapped 和 shoot_held 同帧到达**: shoot_tapped 优先——先处理单发射击，该帧内忽略 shoot_held。
- **玩家在边缘滑动（移动输入但被墙面阻挡）**: `move_and_slide` 自动沿墙面滑动。这是预期行为——玩家不需要精确操作来贴墙移动。
- **射击冷却恰好与物理帧边界对齐**: 使用 `>=` 而非 `>` 判断冷却完成，确保第 0 帧可以射击。

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| **触屏输入系统** | 上游（本系统依赖它） | 硬依赖——所有操作信号来自触屏输入 |
| **物理引擎配置** | 上游（本系统依赖它） | 硬依赖——CharacterBody2D、重力、碰撞层 |
| **射击与弹道系统** | 下游（依赖本系统） | 硬依赖——射击触发和瞄准位置由玩家控制器提供 |
| **2D 摄像机系统** | 下游（依赖本系统） | 软依赖——摄像机跟随角色位置 |
| **HUD 系统** | 下游（依赖本系统） | 软依赖——显示生命值、弹药 |

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 增大效果 | 减小效果 |
|------|--------|----------|----------|----------|
| `move_speed` | 400 | 200~800 | 角色更快——更灵活但物理谜题变简单 | 角色更慢——增加难度但可能感觉迟钝 |
| `squeeze_damage` | 1 | 0~10 | 被卡住时更快死亡 | 被卡住时可存活更久 |

> **射击 CD（shoot_interval）由 WeaponSystem 管理**——参见 `weapon-system.md` Tuning Knobs 和 ADR-0008。PlayerController 不做射速限制。

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 责任系统 |
|------|------|------|----------|
| 射击 | 枪口闪光（1帧）+ 后坐力动画 | 射击音效 | 射击与弹道系统 |
| 移动 | 角色朝向翻转 | 脚步声（Alpha） | 本系统 + 音频系统 |
| 受伤 | 红色闪白 + 屏幕震动 | 受伤音效 | 生命值与伤害系统 |

## UI Requirements

玩家控制器本身不渲染 UI。但以下 HUD 元素需要控制器数据：当前武器图标（通过武器系统）、生命值（通过生命值系统）。

## Acceptance Criteria

- [ ] **AC1**: GIVEN move_direction = (1, 0)，WHEN _physics_process 运行，THEN 角色以 400 px/s 向右移动
- [ ] **AC2**: GIVEN move_direction = (0, 0)，WHEN 检查 velocity，THEN velocity = (0, 0)（静止）
- [ ] **AC3**: GIVEN 瞄准点在角色右侧，WHEN 检查 face_right，THEN face_right = true
- [ ] **AC4**: GIVEN shoot_tapped = true，WHEN 检查射击调用，THEN weapon_system.fire_current(origin, target) 被调用一次
- [ ] **AC5**: GIVEN shoot_held = true 持续 1 秒，当前武器为标准步枪（shoot_interval=0.3，由 WeaponSystem 管理），WHEN 检查射击次数，THEN 约 3~4 次 fire_current 调用（CD 由 WeaponSystem 拒绝多余的调用）
- [ ] **AC6**: GIVEN 角色站在 World 层地板上，WHEN 施加 gravity=980，THEN 角色不穿透地板（`is_on_floor() = true`）
- [ ] **AC7**: GIVEN 角色面向右方，WHEN 瞄准点切换到左侧，THEN face_right = false 且 sprite 翻转
- [ ] **AC8**: GIVEN 角色被 PhysicsObject 和 World 夹住无法移动，WHEN 持续 1 秒，THEN 每秒受到 1 点挤压伤害
- [ ] **AC9**: **性能**: 移动+射击响应延迟 ≤ 33ms（2 帧，60fps）
- [ ] **AC10**: move_speed 从配置文件读取，无硬编码。shoot_interval 由 weapon-system 配置文件管理（非 PlayerController 职责）。

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 移动中射击是否需要降低精度（扩散角）？ | game-designer | MVP 前 | 暂不做——保持操作简单 |
| 是否需要二段跳或冲刺？ | game-designer | Alpha 前 | MVP 不做——聚焦核心物理射击 |
