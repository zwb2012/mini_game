# Cross-GDD Review Report
**Date**: 2026-05-22
**GDDs Reviewed**: 15
**Verdict**: FAIL — 11 blocking, 20 warnings
**Review type**: Full (consistency + design theory)

---

## Summary

15 份系统 GDD 通过了独立设计审查，但跨文档审查揭示了 11 个阻塞项和 20 个警告。最严重的问题集中在三个领域：(1) 射击调用链的 `fire()` 函数签名在 4 个 GDD 中不一致，(2) Pillar 4（通关靠脑子）仅在 Boss 战强制执行——80% 的普通战斗可用直接射击暴力通过，(3) 连锁评分系统缺少消费者，核心反馈循环断裂。另外 enemy-ai.md 和 boss-ai.md 包含虚假的双向依赖声明。所有阻塞项必须在 `/create-architecture` 之前解决。

---

## Part 1: Cross-GDD Consistency (Phase 2)

### 🔴 Blocking (11 issues)

#### C1 — fire() 函数签名在 4 个 GDD 中不一致
- **GDDs**: shooting-projectile.md, player-controller.md, weapon-system.md, enemy-ai.md
- **What**: shooting-projectile.md 定义的唯一接口是 `fire(origin: Vector2, target: Vector2, bullet_type: String)`。但其他 GDD 引用了三个不存在的签名：`fire_single(aim_position)`（player-controller）、`fire_current(origin, target)`（weapon-system）、`fire_single(target_pos, source_entity)`（enemy-ai 依赖表）。整个射击调用链被阻塞。
- **Fix**: 统一为 `fire(origin, target, bullet_type, source_entity)`，增加 source_entity 参数。更新全部 4 个调用方 GDD。

#### C2 — player-controller 绕过 weapon-system
- **GDDs**: player-controller.md, weapon-system.md
- **What**: player-controller 直接调用 shooting-projectile，weapon-system 期望调用通过自己路由。player-controller 不经过武器系统就创建子弹。
- **Fix**: 决定架构：(a) player-controller → weapon-system → shooting-projectile，或 (b) player-controller 直接调用 shooting-projectile，weapon-system 仅为配置层。更新双方 GDD。

#### C3 — hit_stop time_scale=0.05 低于 camera 系统最小值
- **GDDs**: shooting-projectile.md (§8), camera-system.md (§5)
- **What**: shooting-projectile 硬编码 time_scale=0.05，camera-system 文档范围 [0.1, 0.3]。0.05 超出 camera 设计处理能力。
- **Fix**: 提高 shooting-projectile 的 hit_stop time_scale 至 0.1 或扩充 camera 范围至 0.05。

#### C4 — Boss HP: 范围 vs 固定值矛盾
- **GDDs**: health-damage.md, boss-ai.md, entities.yaml
- **What**: health-damage 列 Boss HP 为 2000-5000（范围），boss-ai.md + entities.yaml 固定为 3000。公式实现者用范围值会算出错误结果。
- **Fix**: health-damage.md 改为 "3000（MVP: Ruin Colossus）"。

#### C5 — enemy-ai.md 两个虚假双向依赖声明
- **GDDs**: enemy-ai.md (交叉验证节)
- **What**: enemy-ai 声称 "player-controller.md 将敌人 AI 列为下游"（FALSE——player-controller 未提及 enemy-ai）和 "health-damage.md 将敌人 AI 列为隐式依赖"（FALSE——health-damage 是无状态公式引擎，不依赖 AI）。
- **Fix**: 删除 enemy-ai.md 交叉验证节中这两条声明。

#### C6 — boss-ai.md 虚假声明：material-destruction 列出 Boss 身体部件
- **GDDs**: boss-ai.md (交叉验证节), material-destruction.md
- **What**: boss-ai 声称 "material-destruction.md 将 Boss 身体部件列为 PhysicsObject 用户"。material-destruction.md 全文零处提及 Boss。
- **Fix**: 删除 boss-ai.md 的虚假声明，或在 material-destruction.md 中添加 Boss 引用。

#### C7 — scene-manager 内部矛盾：Dependencies vs Interactions
- **GDDs**: scene-manager.md
- **What**: Dependencies 表说 death-respawn 是"下游（依赖本系统）"，Interactions 表说是"上游"（触发场景重置）。两张表断言了相反的依赖方向。
- **Fix**: 正确方向是 death-respawn 调用 scene-manager → Dependencies 表应改为"上游"。

---

### ⚠️ Warnings (12 issues)

W1 — camera-system 未列出 death-respawn 为上游调用方（单向依赖）
W2 — physics-config 未列出 game-state-machine 为上游（单向依赖）
W3 — hit-detection 列出 enemy-ai 为下游但 enemy-ai 未列出 hit-detection（单向依赖）
W4 — hit-detection 列出 death-respawn 为下游但 death-respawn 未列出 hit-detection（单向依赖）
W5 — boss-ai 碎片 TTL 8-10s vs material-destruction 默认 7.0s（值不匹配）
W6 — camera shake 接口不匹配：boss-ai 用像素值，camera 用归一化 0-1（12px/20px 请求超过 max_shake_pixels=10，被静默截断）
W7 — recoil_force 双所有权：shooting-projectile（全局默认）+ weapon-system（每武器覆盖）
W8 — shoot_interval 三处定义：player-controller（全局默认）+ weapon-system（每武器）+ 隐式
W9 — entities.yaml stun_duration 范围 [0.3, 1.2] 缺少 0（低于阈值时）
W10 — boss-ai.md Jolt 注释在 GodotPhysics2D 项目中可能误导
W11 — physics-config 碰撞矩阵未注明敌人子弹运行时禁用 Enemy(2) 碰撞
W12 — camera AC1 "玩家始终在屏幕左半区" 对 lerp 相机过于严格

---

## Part 2: Game Design Holism (Phase 3)

### 🔴 Blocking (4 issues)

#### D1 — 直接射击是统治策略（违反 Pillar 4）
- **Systems**: weapon-system, shooting-projectile, enemy-ai, health-damage
- **What**: Scout 2 枪(0.6s) / Soldier 5 枪(1.5s) / Carrier 2 枪(0.6s) 即可击杀。仅 Heavy(16枪/4.8s) 和 Boss(子弹伤害=0) 强制使用连锁。无限标准弹药 + 零死亡惩罚 → "直接射杀一切"始终是更优策略。Pillar 4 在 80% 的战斗中是愿望而非系统。
- **Recommendation**: (a) 限制标准弹药（每房间 20 发），(b) 增加子弹免疫敌人原型，(c) 要求房间连锁目标（"触发 3 次连锁"）。

#### D2 — 移动端认知过载（7 活跃系统 > 3-4 上限）
- **Systems**: touch-input, player-controller, chain-propagation, enemy-ai, weapon-system
- **What**: 战斗时刻 7 个活跃系统同时运行：双拇指触控 + 敌人追踪 + 连锁规划 + 武器选择 + 粘弹引信计时 + 弹药计数 + HP 监控。移动端舒适上限为 3-4。
- **Recommendation**: 减少至 4-5 个：(a) 连锁要素自动高亮（被动），(b) 粘弹自动瞄准辅助，(c) 简化双拇指为单拇指 + 点击。

#### D3 — 连锁评分无消费者（悬空激励）
- **Systems**: chain-propagation（生产者），无评分系统（消费者缺失）
- **What**: chain-propagation 用 depth_bonus=chain_depth^1.5 和 destroyed_value 权重计算评分，但无系统读取。玩家无外在动力参与连锁——反馈循环断裂。
- **Recommendation**: 立即添加 scoring-system.md GDD。MVP 至少显示房间评分（1-3 星基于平均连锁深度）。

#### D4 — 触屏精度 vs 物理瞄准
- **Systems**: touch-input, shooting-projectile, chain-propagation
- **What**: 2000px/s 子弹速度 × 48-72px 目标 × 5-6" 拇指触控（±20-40px 误差）。"知道打哪里"和"打到那里"之间的鸿沟是指控精度而非物理推理。Pillar 4 需要洁净执行才能感觉公平。
- **Recommendation**: (a) PhysicsObject 层瞄准辅助（30px 吸附），(b) 增大子弹碰撞半径，(c) 子弹速度降至 1200px/s。

---

### ⚠️ Warnings (8 issues)

W13 — 玩家 400px/s 可风筝全部敌人（除 Scout 350px/s），不需与房间几何互动
W14 — 零失败成本：无限死亡、无限弹药、无死亡计数 → 暴力重试 = 学习尝试，无区别
W15 — 敌人造成环境爆炸违反 Pillar 4：士兵流弹引爆玩家附近油桶 → 无法预测的伤害
W16 — 3.3 发/秒射速阻止连锁观察：玩家永远在射击，"看多米诺倒"的幻想无法实现
W17 — 难度曲线 Room 1(1元素) → Room 3(4元素) 缺少 2-3 元素中间过渡房间
W18 — Boss 难度悬崖：前三关可暴力的玩家在 Boss 处撞墙，无渐进教学
W19 — 无评分系统 GDD：最基础的反馈循环缺失
W20 — 核心幻想冲突：观察者 vs 操作者（3.3 发/秒）、精度 vs 触控、学习 vs 全重置

---

## Part 3: Cross-System Scenario Walkthrough

### Scenario 1: 玩家在 4 元素房间初次遇敌
- Trigger → 双拇指激活 + 扫描 4 物理要素 + 追踪 4 敌人原型 + 选择武器
- ⚠️ 7 活跃系统 → 认知过载
- ⚠️ "直接射击"是最简单替代 → Pillar 4 被绕过

### Scenario 2: 玩家 Boss 战死亡重试
- Trigger → entity_died → scene-manager 全房间重置 → 所有物理状态回到初始
- ⚠️ 连锁设置工作丢失 → 无渐进学习
- ⚠️ 暴力过关玩家无任何准备 → Boss 难度悬崖

### Scenario 3: 玩家尝试 depth≥5 长连锁
- Trigger → 第一枪 → chain-propagation 传播 → chain_score 计算 → ...无消费者
- 🔴 chain_score 从未展示给玩家 → 核心反馈循环断裂

---

## GDDs Flagged for Revision

| GDD | Reason | Priority |
|-----|--------|----------|
| player-controller.md | fire_single 过期签名 + 绕过 weapon-system | 🔴 Blocking |
| weapon-system.md | fire_current 过期签名 + 调用链未明确 | 🔴 Blocking |
| shooting-projectile.md | hit_stop 0.05 超范围 + 缺 source_entity | 🔴 Blocking |
| enemy-ai.md | 2 虚假双向依赖声明 | 🔴 Blocking |
| boss-ai.md | 虚假声明 + 像素 shake vs 归一化 | 🔴 Blocking |
| health-damage.md | Boss HP 范围 vs 固定值 | 🔴 Blocking |
| scene-manager.md | 内部依赖方向矛盾 | 🔴 Blocking |
| camera-system.md | shake 接口不匹配 | ⚠️ Warning |

---

## Required Actions Before Architecture

1. 统一 `fire()` 函数签名至全部 4 个 GDD（C1, C2）
2. 修正 shooting-projectile hit_stop time_scale 或 camera 范围（C3）
3. 修正 health-damage Boss HP 为固定值 3000（C4）
4. 删除 enemy-ai.md 的 2 个虚假声明（C5）
5. 删除 boss-ai.md 的 1 个虚假声明 + 修正 shake 单位（C6, W6）
6. 修正 scene-manager 内部矛盾（C7）
7. 解决 Pillar 4 强制执行缺口：限制弹药 或 子弹免疫敌人（D1）
8. 降低移动端认知负载：自动连锁高亮 + 瞄准辅助（D2, D4）
9. 添加评分系统 GDD 消费 chain_score（D3）
