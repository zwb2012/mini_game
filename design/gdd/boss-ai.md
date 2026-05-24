# Boss AI 系统 (Boss AI)

> **Status**: In Design (Revised after /design-review — 2026-05-21)
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-21
> **Implements Pillar**: Pillar 4（通关靠脑子——Boss 是终极物理谜题，不可被直接射击击杀）

## Overview

Boss AI 系统定义了坍塌禁区中所有 Boss 敌人的行为——Boss 不是"血条更厚的普通敌人"，而是**不可被直接射击击杀的终极物理谜题**。每个 Boss 拥有多阶段行为模式（通常 2-3 阶段），其攻击不是向玩家倾泻子弹，而是**主动操纵战场物理**：砸碎地板改变地形、投掷爆炸物触发连锁、摧毁支撑柱改变整个房间的结构。玩家无法用子弹击杀 Boss——每发子弹只能造成微乎其微的伤害（dtc=0.3），真正的伤害来源是环境连锁：让吊车砸向 Boss、引爆 Boss 身边的燃料库、让 Boss 自己撞碎支撑柱导致天花板坍塌。

Boss AI 继承敌人 AI 系统的基础状态机架构（IDLE→COMBAT→SEARCHING + STUNNED + DEAD），但在此基础上叠加了**阶段转换系统**——当 Boss HP 降至特定阈值时，行为模式发生质变（新攻击、新环境交互、新弱点窗口）。每个 Boss 的设计核心是一个"物理谜题公式"：**环境要素配置 × Boss 行为模式 × 玩家连锁策略 = 唯一解**。这不是让玩家靠反应速度赢，而是让玩家在反复尝试中"读懂"Boss 的物理规律。

没有 Boss AI 系统，坍塌禁区只是 50 个物理谜题房间的集合——有挑战但无高潮。Boss 战是 Pillar 4（通关靠脑子）的终极验证：如果玩家能用高 APM 枪法通关而不使用环境连锁，Boss 设计即为失败。

## Player Fantasy

Boss 战服务于一种复合幻想——**"我是物理规则的学生，而 Boss 是毕业考试"**。

在面对一个 Boss 时，玩家的第一反应不应该是"我需要多少发子弹"——而是"这个 Boss 在告诉我什么？它砸碎的那块地板下面有什么？它为什么总是避开那根柱子？" Boss 是坍塌禁区物理系统的终极教师：它的每个攻击模式都在**展示**一种环境交互，它的每个弱点都在**暗示**一条连锁路径。玩家不是在"打 Boss"——是在**阅读 Boss 的身体语言**，从中推导物理谜题的解法。

这种幻想的精髓在于**不对称性**：Boss 体型巨大、不可被子弹直接伤害、能单方面改变战场——而玩家只有两把枪和对物理规则的理解。胜利不来自手速或装备，来自"我读懂了"的那个顿悟时刻。当玩家触发一条 8 步连锁、看着 Boss 在自己引发的坍塌中被压碎时，体验到的不是射击游戏的"我打死了它"，而是解谜游戏的"我破解了它"。

**参考游戏**：
- **Shadow of the Colossus** 的"找到弱点→攀爬→击杀"循环——Boss 不是被击败的，是被解构的
- **Noita** 中 Boss 被环境连锁意外击杀的涌现感——物理规则对 Boss 同样适用
- **Zelda 系列** Boss 战——每个 Boss 需要特定策略/道具，不是纯战斗

**不应像**：传统射击/动作游戏的 Boss 战——高血量 + 弹幕攻击 + 躲避翻滚 + 持续输出。坍塌禁区的 Boss 战更像"在倒塌的建筑里和一个比你强一百倍的敌人下象棋"。

这个幻想与 Pillar 4（通关靠脑子）直接对齐——Boss 战是"脑子 vs 蛮力"的终极体现。如果玩家能在 2 分钟内不依赖环境连锁纯用子弹击杀一个 Boss，Boss AI 的设计就是失败的。

## Detailed Design

### Core Rules

**1. MVP Boss: 废墟巨像 (Ruin Colossus)**

由外星废墟碎片组装成的大型构造体——一个活体建筑。玩家不能直接击杀它——必须破坏其支撑结构使其失去平衡，在它暴露弱点时用环境连锁造成致命伤害。

**体型**: ~400×600 px，约为玩家角色（~48×64 px）的 8-10 倍，占屏幕约 1/3。

**身体部件系统**:

| 部件 | 材质 | 破坏阈值 | 占 Boss HP | 功能 |
|------|------|---------|-----------|------|
| 左腿支柱 | Concrete | 1000 | 25% | 支撑+移动。破坏→移动能力减半 |
| 右腿支柱 | Concrete | 1000 | 25% | 支撑+移动。破坏→移动能力减半 |
| 核心躯干 | Composite | 1500 | 40% | 主血量池。双腿全破后 armor 降为 1000 |
| 左臂 | Metal | 500 | 5% | 攻击肢。破坏→失去横扫。**双臂完整时**：核心躯干免疫 crush 伤害（手臂形成保护结构——必须先破坏至少一臂才能用倒塌伤害核心） |
| 右臂 | Metal | 500 | 5% | 攻击肢。破坏→失去投掷。**双臂完整时**：核心躯干免疫 crush 伤害 |

身体部件是 Boss 根节点下的独立 `RigidBody2D` 子节点（碰撞层 5 — PhysicsObject 层），各自拥有碰撞体和材质属性。破坏判定由材质破坏系统统一处理——每个部件独立累积损伤、独立触发 `object_destroyed`。

**Composite 材质**: 核心躯干使用 Composite 材质（已在 material-destruction.md 中定义为第 5 种游戏材质：`destruction_threshold = 1500`，裂缝阶段 = 2，倒塌方向 = 重力向下，碎片数 = 6–10）。预设参数：`destruction_threshold = 1500`，裂缝阶段 = 2（微裂→大裂→碎裂），倒塌方向 = 重力向下（优先），碎片数 = 6–10。Composite 作为 Boss 专用材质，视觉上应为不规则废墟碎片聚合体——与混凝土的规则块状区分。

**2. 阶段系统**

**Phase 1 — "完整巨像" (HP 100%–50%)**:
- 移动速度: 80 px/s，沿预定义锚点路径移动（由关卡设计数据系统提供锚点序列）
- 所有攻击模式可用（地面猛击、碎片投掷、手臂横扫）
- 玩家目标：破坏至少一条腿以进入 Phase 2

**Phase 2 — "崩塌巨像" (HP 50%–0%)**:
- 触发条件：至少一条腿被破坏
- 移动速度降至 30 px/s（仅当至少一条腿被破坏时——若双腿完好仅因 HP≤50% 进入 Phase 2，移动速度保持 80 px/s，见公式 3），转向速度减半
- 解锁新攻击（自毁投掷、崩塌冲锋），失去手臂横扫（如果双臂已损坏）
- 核心躯干 composite armor 从 1500 降至 1000（更容易被连锁破坏）
- 玩家目标：利用环境连锁完成击杀

**DOWNED — "末日巨像" (双腿全破 → 死亡)**:
- 触发条件：双腿全破
- 移动速度=0（无法移动），核心暴露——永久 VULNERABLE（vuln_mult=2.0）
- 解锁专属攻击：末日脉冲（Doom Pulse，CD 4.0s）——周期性全屏冲击波
- 自毁投掷仍可用（CD 保持 8.0s）
- **房间崩塌倒计时**：DOWNED 触发后启动 20.0s 倒计时（HUD 显示）。倒计时归零 → Boss 失控自毁，房间完全坍塌 → 玩家即死（crush 类型，无视所有减免）。玩家必须在 20s 内完成击杀
- **末日脉冲 — 地板破碎**：末日脉冲每释放一次，Boss 周围的地板平台破碎一块（从 Boss 脚下向外扩散，每次破碎半径扩大约 80px）。最后 5s 倒计时时，安全站立区域缩小至房间面积的约 15-20%。玩家必须在越来越小的安全区内躲避脉冲——不动 Boss 的威胁来自**环境本身的动态收缩**，而非脉冲波数值
- DOWNED 不是"胜利在望的等待"——是"在崩塌的竞技场中和时间赛跑的最后一击"。Boss 知道自己要死了，最后的冲击波疯狂地试图把玩家一起拖入地狱，同时摧毁玩家赖以立足的一切
- 玩家目标：在倒计时压力 + 地板逐步消失的双重威胁下，利用永久 VULNERABLE ×2.0 伤害窗口 + 末日脉冲触发的额外连锁，完成最后一击

**3. 弱点与暴露机制**

- 任一腿部被破坏 → Boss 进入 VULNERABLE 状态 2.0s（STUNNED 的扩展）
- VULNERABLE 期间：环境连锁伤害 ×2.0（`vulnerability_multiplier = 2.0`）
- 双腿全破 → Boss 倒地，永久 VULNERABLE（移动速度=0，无法执行除自毁投掷外的攻击）
- 子弹直射始终享受 dtc=0.3——无论是否 VULNERABLE，子弹本身不是有效击杀手段（Pillar 4 约束）

**4. 攻击模式**

| 攻击 | Phase | CD | 预警 | 效果 |
|------|-------|-----|------|------|
| 地面猛击 (Ground Slam) | 1, 2 | 4.0s | 1.0s 地面红色波纹扩散 | AOE 半径 300px，冲击力 600。触发半径内爆炸物和可破坏物（与连锁传播的 explosion 参数一致）。**攻击后暴露连锁机会**：若地面下有隐藏结构弱点或爆炸物，猛击后地面碎裂暴露之（视觉：地面裂缝纹理 → 可射击破坏） |
| 碎片投掷 (Debris Throw) | 1, 2 | 6.0s | 1.5s 着弹预警圈 | 抓取场景中最近 PhysicsObject 投向玩家。着弹冲击力 = 物体 mass × 10。物体落地后保留为可交互 PhysicsObject |
| 手臂横扫 (Arm Sweep) | 1 only | 5.0s | 1.2s 手臂后摆动画（移动端适配——触屏反应约 300-500ms，预留充足操作窗口） | 横扫画面下方 1/2 区域。推动范围内所有 PhysicsObject 和玩家（impulse 400）。仅当至少一臂完整时可用 |
| 自毁投掷 (Self-Destruct Throw) | 2 only | 8.0s | 1.5s 着弹预警圈 | 撕下自身次要装甲部件（5% HP 损失）投向玩家。部件落地后成为可交互 PhysicsObject——可被玩家用于连锁 |
| 崩塌冲锋 (Collapse Charge) | 2 only | 10.0s | 1.2s 蓄力动画（身体倾斜+地面裂缝） | 向玩家最后已知位置冲锋（200 px/s）。撞到 World 层后对周围 200px 产生冲击力 800。如果冲锋路径上有结构支撑 → 该结构被摧毁。**攻击后暴露连锁机会**：撞碎支撑柱后暴露之前被遮挡的平台或悬挂物，为玩家创造新路径或连锁要素 |
| 末日脉冲 (Doom Pulse) | DOWNED only | 4.0s | 1.0s 核心蓄力闪光（光晕从红→白） | 全屏冲击波（无法躲避，但伤害递减）。Boss 核心释放环形冲击波，中心伤害 200 impulse × 0.3 dtc = 60 dmg，每远离 100px 衰减 30%。可触发场景中爆炸物和可破坏物——玩家需要利用环境遮挡或提前破坏连锁要素。同时也为玩家创造新的连锁机会（冲击波可能引爆远处的爆炸桶） |

**5. Boss 伤害模型**

```
boss_damage = floor(impulse × type_factor × dtc_effective × vulnerability_multiplier)
```

| 参数 | 值 | 说明 |
|------|-----|------|
| dtc_effective | crush=1.0, 其余=0.3 | 基线伤害减免 |
| vulnerability_multiplier | 1.0 或 2.0 | VULNERABLE 状态下翻倍 |
| 致死冲量（bullet） | ∞（见下方子弹分离规则） | 子弹不扣减 BossTotalHP——Pillar 4 数学强制 |
| 致死冲量（VULNERABLE，crush） | `floor(3000/(0.30×1.0×2.0)) ≈ 5000` | 约需 3-4 次大型倒塌 |

**子弹伤害分离规则（Pillar 4 强制执行）**:

子弹命中 Boss 身体部件时：**不扣减 BossTotalHP**。子弹仅累积到被命中部件的 `accumulated_damage`（见公式 2），提供视觉反馈（裂缝、火花、碎片飞溅）——但不直接降低 Boss HP。非 bullet 伤害类型（explosion, fragment, crush）正常扣减 BossTotalHP。这确保 Pillar 4（"不可被直接射击击杀"）在数学上不可绕过。

**6. 特殊规则 — crush 伤害穿透**

Boss 被倒塌结构（crush 类型）砸中时：dtc_effective 强制 = 1.0（不享受 0.3 减免），且 vulnerability_multiplier 仍正常应用。这反映了"你无法用子弹伤害一座建筑，但你可以让建筑砸在它身上"的物理直觉。

**7. 特殊规则 — 手臂保护核心**

双臂完整时：核心躯干免疫 crush 伤害（手臂形成环绕躯干的保护结构——crush 冲击力被手臂吸收）。必须先破坏至少一臂，crush 类型伤害才能穿透到核心。这确保了手臂的战略价值——它们不只是攻击组件，更是核心的物理护盾。此规则反转了"无视手臂只打腿"的支配策略：玩家想用倒塌直接压碎核心 → 必须先破坏手臂。

**8. Boss 移动与物理**

> **架构决策**: 采用 ADR-0012 方案 D——RigidBody2D 根节点 + `_integrate_forces` 锚点跟随 + PinJoint2D 身体部件。原 GDD 方案 A（CharacterBody2D + top_level 手动同步）因根本性缺陷被拒绝：手动位置赋值每帧覆盖 PhysicsServer 积分结果，外部 impulse 仅存活一帧即被擦除——部件永远无法积累有效速度。详见 `docs/architecture/adr-0012-boss-body-part-architecture.md`。

- **根节点**: RigidBody2D（层 2 — Enemy），`gravity_scale=0`, `mass=100`, `continuous_cd=true`
  - 碰撞层: 与 Player(1)、World(4)、PhysicsObject(5) 碰撞
  - 锚点移动通过 `_integrate_forces(state)` 设置 `state.linear_velocity` 实现——到达精度 <5px
  - 不受外部 `apply_impulse()` 影响——Boss 体型太大无法被击飞
- **身体部件实现 (body parts)**: 每个部件是独立的 `RigidBody2D` 子节点（碰撞层 5 — PhysicsObject），通过 `PinJoint2D` 与根节点连接——**不设置 `top_level`**，共享父级物理空间，关节原生响应外部冲击力
  - 关节参数: `softness=0.2`, `bias=0.8`（可配置——从 `assets/data/boss/ruin_colossus_parts.json` 读取）
  - 外部 impulse 通过 PinJoint2D 弹簧约束自然传递——部件产生真实晃动和偏移（不被手动同步覆盖）
- **部件破坏**: 移除对应 PinJoint2D → 部件 `gravity_scale` 恢复 1.0 → 成为自由 RigidBody2D（掉落动画 + 连锁传播素材）
- **碰撞例外**: Boss 根节点（层 2）与自身身体部件（层 5）之间通过 `add_collision_exception_with()` **双向**禁用碰撞。各身体部件之间也互相禁用碰撞——防止自碰撞抖动
- 移动沿预定义锚点路径，非自由导航——每个锚点是关卡设计数据中的命名位置

> **技术验证要求（BLOCKING — spike 前）**: 方案 D 需要在 MVP 实现前通过技术原型验证。Spike 范围: 1 个 RigidBody2D 根 + 1 个 PinJoint2D 子节点。6 项门禁标准见 ADR-0012 Spike Gate。关键风险: 移动端 6 个 RigidBody2D + 5 个 PinJoint2D 的物理帧预算（目标 <3ms/帧）。

> **物理引擎注意事项 (GodotPhysics2D)**: Godot 4.6 2D 项目使用 GodotPhysics2D（Jolt 仅用于 3D）。`add_collision_exception_with()` 必须**双向调用**。`object_destroyed` 等 signal 在物理步进中触发时，若接收方尝试修改物理状态，需使用 `call_deferred()` 延迟到物理步进完成后执行。若 2D 物理引擎为 Jolt（4.6 可能默认），PinJoint2D softness 行为和碰撞排除 API 需重新验证——spike 第一步确认物理引擎配置。

**9. 感知模型**

- 继承 enemy-ai.md 视野锥（vision_range=800px，适配更大的 Boss 房间）
- Boss 总是知道玩家大致位置（boss_room 范围 = 全图感知）——感知系统用于触发特定攻击的时机判断（如"玩家在射程内→选择攻击"）
- Phase 2 新增"威胁感知"：Boss 检测对其支撑结构有威胁的连锁事件（如正在倒塌的柱子），优先攻击或规避
- 威胁感知每 0.5s 评估一次：`threat_score = imminent_collapse_damage × distance_factor`

**10. Boss 与环境交互**

- Boss 攻击本身破坏场景——地面猛击触发爆炸物、碎片投掷创造新 PhysicsObject
- Boss 可"自杀"——冲锋撞碎自身支撑结构、猛击引爆脚下爆炸桶
- Boss 对倒塌结构无特殊免疫——被 crush 类型伤害命中时 dtc=1.0（见规则 6）
- Boss 破坏的物体同样触发连锁传播系统的 `object_destroyed` → 可能触发对玩家或 Boss 自身的连锁

**11. Boss 房间规则**

- MVP Boss 战无杂兵——Boss 单独出现，威胁完全来自 Boss 攻击 + 玩家连锁失误
- Boss 房间至少 20% 空间为"安全高度"（平台/悬挂区），PlayerController 的移动能力在此有效
- 房间至少配置 3 种环境物理要素（爆炸物、悬挂物、不稳定结构），确保至少 2 条独立连锁路径（Pillar 2 要求）
- **DOWNED 阶段保留要素**：至少 1 个爆炸物 + 1 个不稳定结构专门保留给 DOWNED 阶段——放置于锚点距离 >400px 的位置，Phase 1-2 中 Boss 攻击无法触及。确保倒计时阶段玩家仍有可用的连锁素材
- **教学关要求**：Boss 房间前的 3 个房间应逐级引入 Boss 战所需的 3 种环境要素——Room N-3（爆炸物引导）、Room N-2（悬挂结构+重力连锁）、Room N-1（柱体破坏+结构塌陷）。Boss 战是三种要素的综合验证

### States and Transitions

Boss 状态机继承敌人 AI 系统（enemy-ai.md）的 5 状态模型，并扩展以下新状态：

```
                ┌─────────┐
                │  IDLE   │ ← 玩家未进入 Boss 房间。Boss 不可交互、不可伤害
                └────┬────┘
                     │ 玩家进入 Boss 房间触发区域
                     ▼
                ┌─────────┐
                │  INTRO  │ ← 入场动画/演出（2.0s）。Boss 激活，不可伤害
                └────┬────┘
                     │ 入场结束
                     ▼
         ┌───────────────────────┐
         │  COMBAT (Phase 1)     │ ← 100%–50% HP。5 种攻击模式全开
         └───────┬───────────────┘
                 │ 第一条腿部部件被破坏
                 ▼
         ┌───────────────────────┐
         │  STUNNED              │ ← 2.0s 硬直。Boss 摇晃、不可行动
         └───────┬───────────────┘
                 │ 2.0s 结束
                 ▼
         ┌───────────────────────┐
         │  VULNERABLE           │ ← 5.0s 弱点窗口。连锁伤害 ×2.0
         └───────┬───────────────┘
                 │ 5.0s 结束（一腿已破 → Phase 2）
                 ▼
         ┌───────────────────────┐
         │  COMBAT (Phase 2)     │ ← 减速移动。新攻击解锁。威胁感知激活
         └───────┬───────────────┘
                 │ 第二条腿被破坏 → 直接进入（跳过第二次 STUNNED）
                 ▼
         ┌───────────────────────┐
         │  DOWNED               │ ← 永久 VULNERABLE + 末日脉冲 + 20s 崩塌倒计时
         └───────┬───────────────┘
                 │ HP=0 或 倒计时归零
                 ▼
         ┌───────────────────────┐
         │  DEAD                 │ ← HP=0 → 倒塌动画（3.0s）→ 关卡通关
         └───────────────────────┘     倒计时归零 → 房间坍塌 → 玩家即死
```


**状态行为明细**:

| 状态 | 移动 | 攻击 | 感知 | 物理响应 | 可被伤害 |
|------|------|------|------|---------|---------|
| IDLE | 静止 | 无 | 无 | 无敌 | 否 |
| INTRO | 按脚本移动（入场动画） | 无 | 无 | 无敌 | 否 |
| COMBAT (P1) | 锚点路径 80 px/s | 全攻击 | 全图感知 | 身体部件接受冲击力，根节点免疫推力 | 是（dtc=0.3, vuln=1.0） |
| STUNNED | 不可控 | 中断 | 中断 | 仅接受重力 | 是（vuln=1.0） |
| VULNERABLE | 减速 40 px/s | 仅地面猛击（CD 翻倍到 8.0s） | 仅威胁感知 | 身体部件接受冲击力 | 是（vuln=2.0） |
| COMBAT (P2) | 锚点路径 30 px/s | 地面猛击+碎片投掷+自毁投掷+崩塌冲锋 | 全图+威胁感知 | 同 P1 | 是（dtc=0.3, vuln=1.0） |
| DOWNED | 静止（0 px/s） | 末日脉冲（CD 4.0s）+ 自毁投掷（CD 8.0s） | 仅威胁感知（检测可被脉冲引爆的爆炸物） | 身体部件接受冲击力，核心暴露 | 是（dtc=0.3, vuln=2.0, 永久 VULNERABLE） |
| DEAD | 倒塌动画（不可控） | 无 | 无 | 碰撞体保留（等待回收） | 否 |

**状态转换表**:

| 从 | 到 | 触发条件 |
|----|-----|---------|
| IDLE | INTRO | 玩家进入 Boss 房间触发区域 |
| INTRO | COMBAT (P1) | 2.0s 入场动画结束 |
| COMBAT (P1) | STUNNED | 任一腿部部件 `object_destroyed` |
| COMBAT (P2) | STUNNED | 另一腿部部件 `object_destroyed`，且当前不在 STUNNED/VULNERABLE 中（第一次 VULNERABLE 已过期，第二腿独立破坏 → 正常奖励窗口） |
| COMBAT (P2) | DOWNED (permanent) | 另一腿部部件 `object_destroyed`，且当前在 STUNNED 或 VULNERABLE 中（第一腿的窗口尚未结束 → 跳过第二次 STUNNED，直接 DOWNED） |
| STUNNED | VULNERABLE | 2.0s 硬直结束，且（仅一腿已破 **OR** 双腿在同一帧被破坏）——同帧破坏不是压制循环，玩家获得完整奖励窗口 |
| STUNNED | DOWNED (permanent) | 双腿全破，且第二腿在**不同帧**被破坏（跨帧压制——第一腿 STUNNED 由先前事件触发 → 跳过第二次 VULNERABLE，直接 DOWNED） |
| VULNERABLE | COMBAT (P2) | 5.0s 弱点窗口结束，且双腿未全破（仅第一腿已破） |
| VULNERABLE | DOWNED (permanent) | 双腿全破——永久弱点 + 20s 崩塌倒计时启动，不再退出 |
| 任意战斗状态 | DEAD | HP=0 |

**注意**: 不再有 VULNERABLE→COMBAT(P1) 路径。腿部破坏是进入 STUNNED/VULNERABLE 的唯一途径，因此 VULNERABLE 结束时至少一腿已破 → 始终进入 COMBAT(P2)。COMBAT(P1)→STUNNED 仅第一次腿部破坏时触发。第二次腿部破坏的行为取决于时机：
- **同帧双腿全破**（AC29）：两条腿在同一帧的 DestroyPart 处理中先后破坏 → 经历一次完整 STUNNED (2.0s) → VULNERABLE (5.0s) → DOWNED。玩家获得全部奖励窗口（同帧破坏不是压制循环）。
- **跨帧压制**：第二腿在第一腿的 STUNNED 或 VULNERABLE 窗口内（不同帧）被破坏 → 直接进入 DOWNED（防止无限压制循环 2s 晕→5s 弱→2s 晕→5s 弱→…）。
- **独立破坏**：第二腿在第一腿的 VULNERABLE 已过期、Boss 在 COMBAT(P2) 中时被破坏 → 正常触发 STUNNED→VULNERABLE→DOWNED（玩家获得应得的奖励窗口）。

**Phase 逻辑**:

Phase 由 HP 阈值和腿部状态联合决定，不是独立状态——是 COMBAT（及 VULNERABLE）状态的内部行为模式切换：

```
current_phase = if legs_destroyed >= 2 → "DOWNED"
                else if legs_destroyed >= 1 OR hp_ratio <= 0.5 → 2
                else → 1
```

- Phase 1: 完整移动 + 全攻击
- Phase 2: 减速 + 新攻击解锁
- DOWNED: 移动=0 + 末日脉冲 + 自毁投掷 + 永久 VULNERABLE + 20s 房间崩塌倒计时

### Interactions with Other Systems

| 系统 | 方向 | 性质 | 数据流 |
|------|------|------|--------|
| **玩家控制器** | 上游 | 硬依赖 | 读取 `global_position`（Boss 感知和瞄准）、`face_right`（判断玩家朝向）。用于攻击目标选择和锚点切换决策 |
| **物理引擎配置** | 上游 | 硬依赖 | Boss 根节点使用 RigidBody2D（层 2, `_integrate_forces` 锚点移动）。5 个身体部件通过 PinJoint2D 连接为子节点（层 5 — PhysicsObject）——受材质破坏系统管理。Boss 根节点不接受外部 `apply_impulse`（免疫击飞）。架构见 ADR-0012 |
| **材质破坏系统** | 上游+下游 | 硬依赖 | **上游**：身体部件的材质属性（threshold、debris 参数）由材质破坏系统管理。**下游**：Boss 监听自身部件的 `object_destroyed` signal → 触发 STUNNED 和 Phase 转换。Boss 攻击（地面猛击、碎片投掷）对场景物体的冲击力 → 通过材质破坏系统判定 |
| **生命值与伤害系统** | 上游+下游 | 硬依赖 | **上游**：Boss HP 池初始化（默认 3000），接收伤害计算。dtc=0.3（基线），crush 穿透时 dtc=1.0。**下游**：发射 `health_changed(entity, old_hp, new_hp)` 用于阶段判定。发射 `entity_died(entity, killer_source)` 触发关卡通关 |
| **连锁传播系统** | 上游+下游 | 硬依赖 | **上游**：Boss 攻击（地面猛击/碎片投掷）触发连锁传播的传播事件。**下游**：Boss 接收连锁传播的 HitData（爆炸/碎片/倒塌伤害）。VULNERABLE 状态期间 `vulnerability_multiplier=2.0`。**碎片 TTL 要求**：连锁传播产生的 RigidBody2D 碎片生命周期遵循 material-destruction.md 的 `debris_lifetime` 默认值（7.0s，可配置范围 3~15s）。场景中碎片总数 > 对象池容量（50）时 FIFO 回收最早生成的碎片——由 PhysicsObjectPool（ADR-0003）管理。防止 Boss 战中碎片无限累积导致物理超预算（移动端关键约束） |
| **关卡设计数据系统** | 上游 | 硬依赖 | 读取 Boss 房间配置：锚点路径序列（`anchor_points[]`）、环境物理要素布局（爆炸物/悬挂物/不稳定结构的位置和类型）、Boss 初始位置和朝向、房间触发区域边界 |
| **射击与弹道系统** | 下游 | 软依赖 | 玩家子弹命中 Boss 身体部件 → 正常计算冲击力 → 传递 HitData。子弹不直接造成显著伤害（dtc=0.3），但可累积部件损伤 |
| **2D 摄像机系统** | 下游 | 软依赖 | Boss 事件触发屏幕震动：地面猛击（shake intensity=0.8, 0.3s）、腿部破坏（shake intensity=1.0, 0.5s）、Boss 死亡倒塌（shake intensity=1.0, 1.0s→衰减）。camera 的 `max_shake_pixels=20` 以容纳 Boss 事件——见 camera-system.md §4 |
| **游戏状态机** | 下游 | 硬依赖 | Boss 战开始/结束 → 触发状态切换。INTRO 结束时通知 `boss_fight_started`。DEAD 状态时通知 `boss_defeated` → 游戏状态机切换到 VICTORY |
| **场景管理器** | 下游 | 硬依赖 | Boss 死亡后：延迟 3.0s（倒塌动画），然后场景管理器加载通关结算或下一关 |
| **音频系统** | 下游 | 软依赖 | 所有 Boss 攻击和状态转换触发音频事件（见 Visual/Audio Requirements） |
| **敌人生成与波次管理** | 下游 | 硬依赖 | Boss 房间由敌人生成系统激活（`activate_boss(boss_id, room_config)`）。Alpha 阶段的"Boss+杂兵"模式由此系统管理 |

**与 enemy-ai.md 的继承关系**:

Boss AI 继承以下 enemy-ai 定义：
- 视野锥感知基础逻辑（扩展：全图感知 + 威胁感知）
- CharacterBody2D 移动框架（修改：锚点路径替代 free navigation）
- `state_changed(from, to)` signal 发射——供音频/VFX/UI 监听
- 眩晕公式 `stun_duration`（Boss 的 STUNNED 使用固定 2.0s 而非公式计算——Boss 腿部破坏是脚本事件而非冲击力事件）

**临时假设（关卡设计数据系统未设计）**:
- `anchor_points[]` 格式：
  ```
  {
    id: String,                     // 锚点唯一标识
    position: Vector2,              // 锚点世界坐标
    wait_duration: float,           // 到达后停留时间（秒），0=不停留立即前往下一锚点
    next_anchor_id: String,         // 下一锚点 ID（支持分支路径）
    facing_direction: Vector2,      // Boss 在该锚点的朝向（正右=(1,0)，默认朝向玩家）
    phase_mask: int,                // 1=仅 Phase 1, 2=仅 Phase 2, 3=全部 Phase
    allowed_attacks: Array[String], // 该锚点可执行的攻击 ID 列表。空=全部可用
    trigger_condition: String       // "immediate"=到达后直接前往下一锚点 | "cooldown_complete"=至少一次攻击 CD 完成后 | "player_in_zone"=玩家进入该锚点的触发区域后
  }
  ```
  由 Boss AI 定义 schema，关卡数据系统填充具体坐标。推荐每个 Boss 房间 5-8 个锚点。
- Boss 房间结构：至少包含 `{room_bounds, room_center, anchor_points[], environmental_elements[], trigger_zone}` — schema 在本 GDD 中定义，内容由关卡数据系统提供
- 房间最小尺寸推导值：~1600×1000 px（基于 Boss 体积 400×600px + 崩塌冲锋最佳距离 700px + 玩家躲避空间 200px）。具体尺寸由关卡设计数据系统确认

## Formulas

### 1. Boss 伤害公式 (Boss Damage)

The `boss_final_damage` formula extends health-damage.md's `final_damage` with vulnerability multiplier, crush penetration, and bullet separation:

```
boss_final_damage = floor(impulse × type_factor × dtc_effective × vuln_mult)
dtc_effective = (damage_type == "crush") ? 1.0
                : (damage_type == "bullet") ? 0.0    // Pillar 4: 子弹不扣减 BossTotalHP
                : BOSS_DTC                             // explosion, fragment 等
```

**Variables:**

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 冲击力 | `impulse` | float | 0–5000+ | HitData 传入的碰撞冲量大小 |
| 伤害类型系数 | `type_factor` | float | 0.05–0.30 | bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30 |
| Boss 基线减伤 | `BOSS_DTC` | const float | 0.3 | 适用于 explosion、fragment 等非 bullet/crush 类型 |
| 有效减伤系数 | `dtc_effective` | float | 0.0, 0.3, or 1.0 | crush=1.0（穿透），bullet=0.0（Pillar 4 强制——不扣减 HP），其余=0.3 |
| 弱点倍率 | `vuln_mult` | float | 1.0 or 2.0 | VULNERABLE 状态期间 2.0，其余 1.0 |
| Boss 最终伤害 | `boss_final_damage` | int | 0–3000 | 从 Boss 总 HP 中扣除的整数伤害值 |

**Output Range:** 0 (bullet 或低 impulse × 非 VULNERABLE) 到 floor(5000×0.30×1.0×2.0)=3000 (极端 crush+VULN，恰好满血击杀)。

**Key constraint (Pillar 4):** `dtc_effective = 0.0` for bullet type——子弹对 BossTotalHP 的直接伤害为零。子弹仅累积身体部件损伤（见公式 2），不扣减 HP。`vuln_mult` 是伤害乘数——crush 穿透只豁免 dtc（0.3→1.0），不额外豁免 vuln_mult。

**Examples:**

| 场景 | impulse | type | dtc_eff | vuln | 伤害 | 占 Boss HP |
|------|---------|------|---------|------|------|-----------|
| 标准弹直射 | 500 | bullet | **0.0** | 1.0 | **0** | 0% |
| VULN 期间弹直射 | 500 | bullet | **0.0** | 2.0 | **0** | 0% |
| 正常倒塌压伤 | 1200 | crush | 1.0 | 1.0 | **360** | 12.0% |
| VULN 期间倒塌压伤 | 1200 | crush | 1.0 | 2.0 | **720** | 24.0% |
| 深度 8 连锁爆炸余波 | 400 | explosion | 0.3 | 1.0 | **18** | 0.6% |

---

### 2. 身体部件伤害分配 (Body Part Damage Distribution)

采用**离散部件 HP 模型**：每个身体部件独立累积损伤。当 `accumulated_damage` ≥ 材质破坏阈值时，部件被摧毁，Boss 总 HP 扣除对应份额。

```
PartDamaged(part_id, impulse, type_factor, dtc_part):
  // 部件累积使用独立的 dtc_part——bullet 对部件仍有效（dtc_part=0.3），
  // 与 BossTotalHP 的 dtc_effective（bullet=0.0）分离
  dtc_part = (damage_type == "crush") ? 1.0 : BOSS_DTC  // bullet 在部件累积中不归零
  accumulated_damage[part_id] += impulse × type_factor × dtc_part
  if accumulated_damage[part_id] >= PART_THRESHOLD[part_id]:
    DestroyPart(part_id)

DestroyPart(part_id):
  BossTotalHP -= BossMaxHP × HPShare[part_id]
  TriggerBehaviorEffect(part_id)
  if BossTotalHP <= 0: BossDeath()
```

**Variables:**

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 部件累积损伤 | `accumulated_damage[part]` | float | 0–threshold | 累加到该部件的冲击力效果（与 material-destruction 机制一致） |
| 部件材质阈值 | `PART_THRESHOLD[part]` | const int | 500–1500 | Legs=1000, Core=1500, Arms=500 |
| 部件 HP 份额 | `HPShare[part]` | const float | 0.05–0.40 | 各占 BossMaxHP 的比例 |
| Boss 当前 HP | `BossTotalHP` | float | 0–3000 | 实时总 HP |
| Boss 最大 HP | `BossMaxHP` | const int | 3000 | — |

**部件破坏序列 (完整击杀):**

| 破坏事件 | 所需累积 impulse | Boss HP 减少 | 剩余 HP | 触发效果 |
|---------|-----------------|-------------|--------|----------|
| 初始 | 0 | — | 3000 (100%) | INTRO→COMBAT P1 |
| 左腿破坏 | 1000 | -750 (25%) | 2250 (75%) | STUNNED 2.0s → VULNERABLE 5.0s |
| 第二条腿破坏 | 2000 | -750 (25%) | 1500 (50%) | 直接进入 DOWNED（永久 VULNERABLE） |
| 左臂破坏 | 2500 | -150 (5%) | 1350 (45%) | 失去手臂横扫 |
| 右臂破坏 | 3000 | -150 (5%) | 1200 (40%) | 失去碎片投掷（自毁投掷和崩塌冲锋不依赖手臂） |
| 核心破坏 | 4500 | -1200 (40%) | **0 (死亡)** | DEAD → 倒塌动画 3.0s |

**设计意图:** Boss HP 以离散跳变下降——每次跳变对应明确的玩家成就（"我打断它的腿了！"）。部件阈值总和（4500）大于 Boss HP（3000）意味着 1500 "精度税"——玩家必须命中特定部位，不能乱射。

**HP 双轨伤害模型**: Boss 承受两种并行伤害路径：
1. **环境连锁伤害**（公式 1）：非 bullet 类型的 HitData（explosion, fragment, crush）通过 `boss_final_damage` 扣减 `BossTotalHP`。**bullet 类型对 BossTotalHP 的直接伤害为零**（Pillar 4 强制执行——`dtc_effective=0.0`）
2. **部件破坏扣除**（公式 2）：所有伤害类型（含 bullet）累积到部件 `accumulated_damage`。当累积达到阈值 → 部件被摧毁 → 额外扣除固定 HP 份额（如单腿 750 HP）

子弹的战术角色：子弹不扣减 HP，但累积部件损伤（视觉反馈：裂缝、火花、碎片）。玩家射击是在"削掉 Boss 的防御层"——而非"造成 HP 伤害"。核心击杀手段是部件破坏 + VULNERABLE 窗口的环境连锁。这从数学上强制 Pillar 4："不可被直接射击击杀"。

**连续腿部破坏规则:** 双腿全破的时机决定行为路径：
- **同帧双腿全破**（两条腿在同一帧 DestroyPart 中先后触发）→ 经历一次完整 STUNNED (2.0s) → VULNERABLE (5.0s) → DOWNED。同帧破坏是玩家的精确定位奖励，不触发防压制机制。
- **跨帧压制**（第二腿在第一腿的 STUNNED 或 VULNERABLE 窗口内、不同帧被破坏）→ 跳过第二次 STUNNED+VULNERABLE，直接进入 DOWNED（永久 VULNERABLE + 20s 倒计时）。防止玩家无限压制（2s 晕→5s 弱→途中第二腿破→2s 晕→5s 弱→…的连锁循环）。
- **独立破坏**（第二腿在第一腿的 VULNERABLE 过期后、Boss 处于 COMBAT(P2) 时被破坏）→ 正常触发 STUNNED (2.0s) → VULNERABLE (5.0s) → DOWNED。这是玩家分批破坏双腿应得的完整奖励窗口。

DOWNED 的倒计时确保 Boss 不会永远站着挨打——20s 内不完成击杀则玩家即死。

**自毁投掷自损规则:** 自毁投掷消耗的 150 HP 仅减少对应部件的 `accumulated_damage` 需求（加速部件损坏），不直接扣减 BossTotalHP。防止挂机等 Boss 自杀的策略。

---

### 3. 阶段判定 (Phase Determination)

```
current_phase =
  if legs_destroyed >= 2                          → DOWNED
  else if legs_destroyed >= 1 OR hp_ratio <= 0.5 → 2
  else                                            → 1
```

**Variables:**

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| HP 比例 | `hp_ratio` | float | 0.0–1.0 | `BossTotalHP / BossMaxHP` |
| 腿部破坏数 | `legs_destroyed` | int | 0, 1, 2 | 已破坏的腿部部件数量 |
| 当前阶段 | `current_phase` | enum | {1, 2, DOWNED} | 决定可用攻击和行为模式 |

**Phase 判定表:**

| hp_ratio | legs_destroyed | Phase | 行为 |
|----------|---------------|-------|------|
| > 0.5 | 0 | **1** | 全速移动 (80 px/s)，5 种攻击全开 |
| > 0.5 | 1 | **2** | 减速 (30 px/s)，解锁自毁投掷+崩塌冲锋 |
| ≤ 0.5 | 0 | **2** | 解锁新攻击但移动仍 80 px/s（双腿完好） |
| ≤ 0.5 | 1 | **2** | 减速+新攻击 |
| 任意 | 2 | **DOWNED** | 移动=0，末日脉冲+自毁投掷，永久 VULNERABLE，20s 崩塌倒计时 |

**移动速度修正（独立于 Phase）:**

```
move_speed =
  if legs_destroyed >= 2    → 0 px/s     (DOWNED)
  else if legs_destroyed >= 1 → 30 px/s  (腿部破坏导致减速)
  else                       → 80 px/s   (双腿完好，即使 Phase 2)
```

移动减速由腿部破坏触发而非单纯 HP 阈值——保持视觉与机制的一致性（HP≤50% 但双腿完好的 Boss 仍能快速移动）。

**判定更新时机:** 仅在两个事件触发时重新计算：
1. `BossTotalHP` 变化（部件被破坏后）
2. 腿部部件的 `object_destroyed` signal

不每帧重新计算。

---

### 4. 攻击选择优先级 (Attack Selection Priority)

Boss 每 0.5s（或当前攻击结束时）评估攻击池中所有可用攻击，计算 `attack_score`，选最高分执行。若无攻击得分超过 `EXECUTION_THRESHOLD`，执行"基础动作"（移动到下一锚点，1.0-2.0s 后重评）。

```
attack_score[a] = base_priority[a]
                  × range_factor(a, player_dist)
                  × vertical_factor(a, player_height)
                  × repetition_penalty(a)
                  × threat_modifier(a, threat_score)   // Phase 2 only
```

**攻击参数表:**

| 攻击 a | Phase | base_priority | 最佳距离 (px) | 垂直偏好 | 特殊约束 |
|--------|-------|--------------|--------------|----------|---------|
| 地面猛击 | 1, 2 | 15 | 100–350 | 同层 / 下方 | 无 |
| 碎片投掷 | 1, 2 | 12 | 200–600 | 任意 | 需要场景中 ≥1 PhysicsObject 可抓取 |
| 手臂横扫 | 1 only | 14 | 0–400 | 同层 | 需要 ≥1 臂完整 |
| 自毁投掷 | 2 only | 10 | 200–500 | 任意 | 不依赖手臂完整性 |
| 崩塌冲锋 | 2 only | 8 | 300–700 | 同层 | 不依赖手臂完整性；需要路径上有 ≥1 可破坏结构 |
| 末日脉冲 | DOWNED only | 6 | 0–800 | 任意 | 无条件——全屏冲击波。激活时始终可用（仅受 CD 限制） |

**距离系数公式:**

```
range_factor(a, player_dist) =
  if dist < MIN_RANGE[a]                               → max(dist/MIN_RANGE[a] × 0.5, 0.3)   // 最小值下限 0.3——防止极近距离攻击池枯竭
  if MIN_RANGE[a] ≤ dist ≤ OPTIMAL_MAX[a]              → 1.0
  if OPTIMAL_MAX[a] < dist ≤ MAX_RANGE[a]              → 1.0 - (dist-OPTIMAL_MAX)/(MAX_RANGE-OPTIMAL_MAX) × 0.7
  if dist > MAX_RANGE[a]                               → 0.3
```

**最小值下限 (Pillar 3 — 无不可反制策略):** 所有距离段 `range_factor` 不低于 0.3。防止玩家通过紧贴 Boss (dist≈0) 使全部攻击失效，强制 Boss 必须移动的"无敌近身"策略。

**重复惩罚:** `repetition_penalty(a) = 1.0 - 0.2 × count_last_3(a)` — 同一攻击在最近 3 次已执行攻击中出现 N 次则扣 N×0.2。确保相同攻击不连续出现 >2 次。

**执行阈值:** `EXECUTION_THRESHOLD = 4.0` — 最高分低于此值不执行攻击，改为基础动作（移动到下一锚点）。

**威胁修正系数定义 (threat_modifier):**

`threat_modifier(a, threat_score)` 是威胁感知对攻击选择的量化影响。仅在 Phase 2 生效，Phase 1 恒为 1.0。

```
threat_modifier(a, threat_score) =
  if threat_score < THREAT_ACT (12.0)          → 1.0   (威胁不足以改变攻击选择)
  else if attack_covers_threat(a, threat_pos)  → min(1.0 + threat_score × 0.05, 2.0)
  else                                          → 1.0   (无法打到威胁的攻击不受影响)
```

`attack_covers_threat(a, threat_pos)`：检查攻击 a 的 `MIN_RANGE[a]` 到 `MAX_RANGE[a]` 是否覆盖威胁位置与 Boss 的距离，且垂直偏好匹配。

**设计意图**: 当 Boss 处于 ACT 或 PANIC 威胁状态时，能打到威胁源的攻击获得最高 2.0× 优先加成——Boss "本能地"选择能消除威胁的攻击（如对即将倒塌的柱子使用地面猛击，而非对玩家投掷碎片）。但加成上限 2.0 确保在无合适攻击时 Boss 不会彻底无视玩家。

**分数平局:** 按 `pattern_history` 中最近使用过的攻击优先——制造可学习模式。

**工作示例:**

```
Phase 2 Boss, 玩家距离 250px (同层), 最近 3 次攻击: [碎片投掷, 地面猛击, 碎片投掷]
左腿已断, 右腿完好, 双臂完好

地面猛击: base=15 × range(250)=1.0 × vert(同层)=1.0 × rep(1/3)=0.8 = 12.0
碎片投掷: base=12 × range(250)=1.0 × vert(任意)=1.0 × rep(2/3)=0.6 = 7.2
自毁投掷: base=10 × range(250)=1.0 × vert(任意)=1.0 × rep(0/3)=1.0 = 10.0
崩塌冲锋: base=8 × range(250)=0.42 × vert(同层)=1.0 × rep(0/3)=1.0 × threat_mod(phase1)=1.0 = 3.33

→ 选择：地面猛击 (12.0)
```

---

### 5. 威胁感知 (Threat Perception, Phase 2 only)

Phase 2 中，每 0.5s Boss 评估战场中对自身的环境威胁。`threat_score` 影响攻击选择中的 `threat_modifier`（见公式 4）。

```
threat_score = Σ (imminent_collapse_impulse × proximity_factor × threat_type_weight) / 100
proximity_factor = max(0, 1 - distance_to_threat / PERCEPTION_RADIUS)
```

**Variables:**

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 即时倒塌预估冲量 | `imminent_collapse_impulse` | float | 0–5000 | 该威胁如果完成将释放的原始 impulse 量（使用 pre-dtc 值——伤害类型中立）。threat_score 除以 100 归一化到 0–150 范围以匹配阈值 |
| 接近系数 | `proximity_factor` | float | 0.0–1.0 | 威胁距离 Boss 越近越高 |
| 威胁类型权重 | `threat_type_weight` | const float | 0.5–3.0 | 见下表 |
| 感知半径 | `PERCEPTION_RADIUS` | const float | 600 px | Boss 可感知威胁的最大距离 |

**威胁类型权重:**

| 威胁类型 | weight | 检测方式 |
|---------|--------|---------|
| 正在倒塌的结构 | 3.0 | 监听 `object_destroyed` signal + 计算倒塌方向是否朝向 Boss |
| 即将爆炸的爆炸桶 | 2.0 | 检测 DAMAGED 状态爆炸桶（accumulated_damage ≥ threshold×0.5） |
| 玩家瞄准弱点部位 | 1.5 | 玩家枪口射线与 Boss 脆弱部件的交叠检测 |
| 进行中的连锁链 | 1.0 | 连锁传播系统 PROPAGATING 状态 + 传播方向朝向 Boss |

**行动阈值:**

| 条件 | 行为 |
|------|------|
| `threat_score < THREAT_NOTICE` (5.0) | 忽略威胁，正常攻击选择 |
| `THREAT_NOTICE ≤ threat_score < THREAT_ACT` (12.0) | Boss 朝向最大威胁方向 0.5s（视觉暗示），但不改变攻击选择 |
| `THREAT_ACT ≤ threat_score < THREAT_PANIC` (25.0) | 60% 攻击威胁源 / 30% 正常攻击玩家 / 10% 无视（防止诱饵战术 100% 可靠） |
| `threat_score ≥ THREAT_PANIC` (25.0) | 强制放弃当前行动，远离威胁中心 100px（若可移动） |

**Example:**

```
Phase 2 Boss（一条腿被破坏，move_speed=30），感知到：
1. DAMAGED 混凝土柱（accumulated=700/1000）在 Boss 右方 200px，预估倒塌 impulse=1200
2. 轻微损伤爆炸桶（accumulated=200/500，未达 50% 阈值）在 Boss 左方 450px——不参与计算

threat_score = (1200 × max(0, 1-200/600) × 3.0 + 0 (爆炸桶 accumulated=200 < 250=threshold×0.5)) / 100
             = (1200 × 0.667 × 3.0) / 100
             = 24.0

THREAT_ACT (12.0) ≤ 24.0 < THREAT_PANIC (25.0)
→ 60% 概率：Boss 对柱子位置执行地面猛击（若在 range 内）或转向怒吼 0.5s
→ 30% 概率：正常攻击玩家
→ 10% 概率：无视，继续原计划
```

**设计理由 — 威胁感知使用 impulse 而非 final_damage:** `imminent_collapse_impulse` 使用原始 impulse 值（在 dtc 和 type_factor 应用之前）。如果使用 final_damage，Boss 对 crush 威胁（dtc=1.0）的敏感度会远超其他类型（dtc=0.3），导致 Boss 只规避倒塌而忽视爆炸——这不真实。impulse 作为输入使威胁感知对伤害类型保持中立。

---

### 6. 碎片投掷瞄准 (Debris Throw Targeting)

Boss 抓取场景中最近 PhysicsObject，预测玩家运动，在预测落点生成 1.5s 固定预警圈。

```
aim_position = player_pos + player_vel × travel_time × LEAD_FACTOR + random_offset
travel_time = WARNING_DURATION - WINDUP_DURATION = 1.2s (固定)
effective_throw_speed = distance(aim_position, boss_pos) / travel_time
debris_impact_impulse = clamp(grabbed_object.mass, 1, 50) × MASS_IMPULSE_FACTOR
```

**Variables:**

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 玩家当前位置 | `player_pos` | Vector2 | 场景内 | 抓取开始时的玩家位置 |
| 玩家当前速度 | `player_vel` | Vector2 | 0–600 px/s | 玩家移动速度向量 |
| 飞行时间 | `travel_time` | float | 1.2s (固定) | 碎片从发射到落地的固定时间 |
| 预判系数 | `LEAD_FACTOR` | const float | 0.7 | 不完全预判——给玩家留闪避空间（≠1.0） |
| 随机散布 | `random_offset` | Vector2 | 半径 0–60px | 圆形均匀分布，增加不可完全预测性 |
| 预警时长 | `WARNING_DURATION` | const float | 1.5s | 预警圈固定显示时间 |
| 抓取动画 | `WINDUP_DURATION` | const float | 0.3s | Boss 抓取碎片的前置动画 |
| 质量-冲量系数 | `MASS_IMPULSE_FACTOR` | const float | 10.0 | 将物体质量转化为落地冲击力 |
| 碎片落地冲击力 | `debris_impact_impulse` | float | 10–500 | 碎片命中时传递的 impulse。mass 在 1–50 范围内钳制（`clamp(mass, 1, 50) × 10`）——防止极端轻物体无效和极端重物体一击杀 |
| 预警圈半径 | `warning_radius` | const float | 60 px | 视觉指示器圆半径 |

**时序:** Boss 抓取动画（0.3s）→ 预警圈出现 + 碎片发射 → 1.2s 后碎片在 aim_position 落地（travel_time = 1.2s，与公式一致）。预警圈总显示时长 = 0.3s（抓取）+ 1.2s（飞行）= 1.5s。

**Output Range:** `aim_position` 为场景坐标，距离 Boss 100–600px（受可抓取物体分布限制）。

**Example:**

```
Boss 在 (500, 200)，玩家在 (900, 200) 向右移动 (vel=+150 px/s)
抓取物体: 钢材 debris (mass=20) 在 Boss 左侧

travel_time = 1.2s (fixed)
predicted_pos = player_pos + (150, 0) × 1.2 × 0.7 = (900, 200) + (126, 0) = (1026, 200)
random_offset = (rng_range(-30,30), rng_range(-30,30)) = (12, -18)
aim_position = (1038, 182)

effective_throw_speed = distance((500,200), (1038,182)) / 1.2 ≈ 449 px/s

预警圈在 (1038, 182) 出现，半径 60px，持续 1.5s
着弹冲击力 = 20 × 10 = 200 impulse
```

## Edge Cases

- **多个部件同一帧被破坏**: 按部件优先级依次处理——先腿、后臂、最后核心。每条腿独立处理，但第二条腿若在第一条腿的 VULNERABLE 窗口内被破坏 → 直接进入 DOWNED（永久 VULNERABLE），跳过第二次 STUNNED，防止玩家无限压制循环（2s 晕→5s 弱→2s 晕→5s 弱→…）。

- **Boss 被自己的攻击引发的连锁杀死（自杀）**: 这是**有意支持的行为**——地面猛击引爆脚下爆炸桶、崩塌冲锋撞碎支撑结构、碎片投掷引发的连锁波及自身——连锁伤害正常计算，Boss 无豁免。这是 Pillar 3（规则稳定——物理规则对 Boss 同样适用）的体现。自毁投掷的自损是唯一例外——自损仅加速部件破坏需求，不直接扣减 HP。

- **玩家在 Boss 战中死亡**: 游戏状态机处理——Boss 回到 IDLE 状态，但不重置 HP 或部件状态。玩家重生后重新进入 Boss 房间 → Boss 从当前 HP 和 Phase 继续。VULNERABLE/STUNNED 状态在玩家死亡期间保留——不给 Boss"免费恢复"窗口。

- **Boss 被卡在场景几何体中**: Boss 沿锚点路径移动，不会自行导航到不可通行区域。如果场景破坏导致锚点路径被碎片阻塞 → 使用 `PhysicsRayQuery2D` 从 Boss 位置向目标锚点发射射线检查路径是否通畅 → 若不通 → 跳过当前锚点，移动到下一可用锚点。如果所有锚点不可达 → Boss 原地战斗（仍可执行攻击）。

- **锚点位于已被破坏的平台上**: Boss 到达锚点前检查该位置是否仍有 World 层或 PhysicsObject 支撑。如果锚点位置已失去地板支撑 → 跳过该锚点。如果所有锚点不可用 → Boss 移动到房间中心安全坐标（由关卡数据定义 `room_center`）。

- **双臂全失后攻击池枯竭风险**: 即使双臂全失，自毁投掷和崩塌冲锋不依赖手臂完整性。Phase 2 仍至少有 3 种攻击（地面猛击、自毁投掷、崩塌冲锋）。Phase 1 双臂全失 → 仅剩地面猛击和碎片投掷（碎片投掷不依赖手臂——Boss 可用身体撞击物体）。

- **VULNERABLE 窗口在连锁进行中到期**: VULNERABLE 状态结束时，正在飞行中的碎片和进行中的倒塌继续以窗口启动时的 `vuln_mult` 值计算——`vuln_mult` 在 HitData 生成时锁定，而非伤害计算时。防止碎片飞行跨窗口导致的伤害不确定。

- **Boss 倒塌动画（3.0s）期间玩家继续射击**: 倒塌动画期间 Boss 处于 DEAD 状态——不接受伤害、不响应冲击力。这是纯演出时间。玩家子弹穿过 Boss（碰撞体禁用）。

- **碎片投掷时场景中无可抓取物体**: 攻击选择系统在评估碎片投掷前检查 `get_tree().get_nodes_in_group("physics_object")` 是否非空。若无可用物体 → 碎片投掷从 `available_attacks` 中排除（`attack_score=0`）。

- **地面猛击 AOE 范围内无任何可破坏物**: 猛击正常执行但仅推动玩家/敌人（impulse=600），不触发连锁。视觉上冲击波环仍显示（传达"攻击发生了"），但无后续效果。这是低威胁周期——给玩家恢复时机。

- **Boss HP 在 VULNERABLE 窗口启动前瞬间归零**: `DestroyPart()` 中先扣减 HP 再判断死亡——HP 归零立即触发 DEAD，跳过 STUNNED→VULNERABLE 后续流程。死亡优先于一切。

- **崩塌冲锋路径上无结构支撑**: 攻击选择系统评估崩塌冲锋时检查 path 上是否有可破坏 World 层或 PhysicsObject。若无 → `range_factor` 降低（×0.3，因冲锋不会产生碰撞事件），攻击仍可选择——Boss 只是冲向玩家，无额外破坏效果。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **玩家控制器** | 上游 | 硬依赖 | 读取 `global_position`、`face_right`——用于所有攻击目标选择和锚点切换决策 |
| **物理引擎配置** | 上游 | 硬依赖 | Boss 根节点使用 RigidBody2D（`_integrate_forces` 移动，见 ADR-0012）（层 2）；身体部件子节点使用 PhysicsObject（层 5） |
| **材质破坏系统** | 上游+下游 | 硬依赖 | 上游：部件材质属性（threshold 等）。下游：Boss 监听自身部件 `object_destroyed` signal |
| **生命值与伤害系统** | 上游+下游 | 硬依赖 | 上游：HP 池初始化（3000），接收伤害计算。下游：发射 `health_changed`、`entity_died` |
| **连锁传播系统** | 上游+下游 | 硬依赖 | 上游：Boss 攻击触发传播事件。下游：Boss 接收连锁 HitData |
| **关卡设计数据系统** | 上游 | 硬依赖 | 读取 `anchor_points[]`、环境要素布局、`room_center`、触发区域边界 |
| **射击与弹道系统** | 下游 | 软依赖 | 玩家子弹命中部件→累积损伤。不直接造成显著伤害（dtc=0.3） |
| **2D 摄像机系统** | 下游 | 软依赖 | 攻击/状态事件触发屏幕震动 |
| **游戏状态机** | 下游 | 硬依赖 | `boss_fight_started` / `boss_defeated` 状态切换 |
| **场景管理器** | 下游 | 硬依赖 | Boss 死亡后 3.0s → 加载下一场景 |
| **音频系统** | 下游 | 软依赖 | 攻击和状态转换音频事件 |
| **敌人生成与波次管理** | 下游 | 硬依赖 | `activate_boss(boss_id, room_config)` |
| **敌人 AI 系统** | 上游（继承） | 硬依赖 | 继承视野锥基础逻辑、CharacterBody2D 框架、`state_changed` signal |

**交叉验证:**
- enemy-ai.md 将 Boss AI 列为下游扩展（"Boss 继承/扩展敌人基础 AI"）✓
- health-damage.md 将 Boss（dtc=0.3, HP=3000）列入实体表 ✓
- material-destruction.md 定义 Composite 材质（Boss 核心躯干专用：threshold=1500, collapse_dir=gravity_down, debris=6–10） ✓

## Tuning Knobs

### Boss 属性

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `BOSS_DTC` | 0.3 | 0.1–0.5 | Boss 非 crush 伤害减免 | 子弹完全无效→玩家挫败 | 子弹有效→连锁失去必要性 |
| `BossMaxHP` | 3000 | 2000–5000 | Boss 总 HP | 战斗过长→疲劳 | 战斗过短→无史诗感 |
| `vulnerability_multiplier` | 2.0 | 1.5–3.0 | VULNERABLE 状态伤害乘数 | 弱点窗口内可秒杀 | 弱点窗口无意义 |
| `crush_penetration` | enabled | enabled/disabled | crush 穿透 dtc 减免 | — | Boss 对 crush 也减免→无击杀手段 |

### 部件参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `PART_THRESHOLD_leg` | 1000 | 600–1500 | 腿部破坏所需累积 impulse |
| `PART_THRESHOLD_core` | 1500 | 1000–2500 | 核心破坏所需累积 impulse |
| `PART_THRESHOLD_arm` | 500 | 300–800 | 手臂破坏所需累积 impulse |
| `HPShare_leg` | 0.25 | 0.15–0.35 | 单腿对 Boss HP 的贡献比例 |
| `HPShare_core` | 0.40 | 0.30–0.50 | 核心对 Boss HP 的贡献比例 |
| `HPShare_arm` | 0.05 | 0.03–0.10 | 单臂对 Boss HP 的贡献比例 |

### 状态时长

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `INTRO_DURATION` | 2.0 | 1.0–4.0 | 入场动画时长（秒） | 玩家等待过长 | 入场太急促 |
| `STUN_DURATION_boss` | 2.0 | 1.5–3.0 | 腿部破坏后硬直时长（秒） | VULNERABLE 窗口被压缩 | Boss 恢复太快→窗口间来不及连锁 |
| `VULNERABLE_DURATION` | 5.0 | 3.0–8.0 | 弱点窗口时长（秒） | Boss 长时间脆弱→太简单 | 窗口太短→来不及布置连锁 |
| `DEATH_ANIM_DURATION` | 3.0 | 2.0–5.0 | 倒塌动画时长（秒） | 玩家等待过长 | 倒塌太急促→不满足 |

### 移动参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `move_speed_phase1` | 80 | 50–150 | Phase 1 移动速度（px/s） |
| `move_speed_phase2` | 30 | 15–60 | Phase 2 移动速度（px/s） |
| `move_speed_downed` | 0 | — | DOWNED 状态移动速度 |
| `turn_rate` | 180 | 90–360 | Boss 朝向锚点旋转速度（deg/s）。Phase 2 减半至 90 deg/s（"转向速度减半"） |

### 攻击参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `GROUND_SLAM_CD` | 4.0 | 2.0–8.0 | 地面猛击冷却（秒） |
| `GROUND_SLAM_RADIUS` | 300 | 200–500 | 地面猛击 AOE 半径（px） |
| `GROUND_SLAM_IMPULSE` | 600 | 300–1000 | 地面猛击冲击力 |
| `DEBRIS_THROW_CD` | 6.0 | 3.0–10.0 | 碎片投掷冷却（秒） |
| `ARM_SWEEP_CD` | 5.0 | 3.0–8.0 | 手臂横扫冷却（秒） |
| `ARM_SWEEP_WARNING` | 1.2 | 0.8–1.5 | 手臂横扫预警时长（秒）。移动端下限 1.0s——低于此值触屏反应不足 |
| `ARM_SWEEP_IMPULSE` | 400 | 200–800 | 手臂横扫推力 |
| `SELF_DESTRUCT_THROW_CD` | 8.0 | 5.0–15.0 | 自毁投掷冷却（秒） |
| `COLLAPSE_CHARGE_CD` | 10.0 | 6.0–20.0 | 崩塌冲锋冷却（秒） |
| `COLLAPSE_CHARGE_SPEED` | 200 | 100–400 | 冲锋速度（px/s） |
| `COLLAPSE_CHARGE_IMPULSE` | 800 | 400–1500 | 冲锋撞击冲击力 |
| `DOOM_PULSE_CD` | 4.0 | 2.0–8.0 | 末日脉冲冷却（秒）。冲击波中心 impulse=200，每 100px 衰减 30% |
| `COLLAPSE_COUNTDOWN` | 20.0 | 12.0–30.0 | 房间崩塌倒计时（秒）。归零→房间坍塌→玩家即死 |

### 感知与威胁参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `PERCEPTION_RADIUS` | 600 | 400–1000 | 威胁感知半径（px） |
| `THREAT_NOTICE` | 5.0 | 2.0–10.0 | 威胁注意阈值 |
| `THREAT_ACT` | 12.0 | 8.0–20.0 | 威胁行动阈值 |
| `THREAT_PANIC` | 25.0 | 15.0–40.0 | 威胁恐慌阈值 |

### 瞄准参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `LEAD_FACTOR` | 0.7 | 0.3–1.0 | 碎片投掷预判系数 |
| `WARNING_DURATION` | 1.5 | 1.0–2.5 | 预警圈显示时长（秒） |
| `MASS_IMPULSE_FACTOR` | 10.0 | 5.0–20.0 | 质量→冲量转换系数 |

## Visual/Audio Requirements

### Boss 视觉设计 — 废墟巨像

| 特征 | 规格 |
|------|------|
| **体型** | ~400×600 px，占屏幕约 1/3 |
| **身体结构** | 5 个视觉上可区分的部件：双腿（粗大混凝土柱）、双臂（金属梁+关节）、核心躯干（不规则废墟碎片聚合体，中央发光裂隙） |
| **颜色编码** | 暗灰+暗棕基底（废墟材质），腿部关节处红色裂隙（Hazard Language — 结构弱点），核心躯干中央橙黄色脉动（能量核心） |
| **重量感传达** | 粗黑边缘（4-6px）、大型块状轮廓、移动时地面微震+尘土粒子 |
| **设计原则** | 遵循 Art Bible：可读性废墟 — 每个部件独立可读、破坏后视觉反馈清晰 |

### 部件状态视觉

| 部件 | INTACT | DAMAGED (50-99%) | DESTROYED |
|------|--------|-----------------|-----------|
| **腿部** | 完整混凝土柱 | 裂缝纹理递增（3 阶段），碎片粒子掉落 | 柱体碎裂→Boss 倾斜，底部瓦砾堆 |
| **手臂** | 完整金属梁 | 凹痕+火花，关节处变形 | 断落→掉在地上成为 PhysicsObject |
| **核心** | 完整躯干，脉动光晕 | 光晕频率加快，碎片脱落加速 | 整体碎裂→倒塌动画 |

### VFX 需求

| 事件 | VFX | 优先级 |
|------|-----|--------|
| **Boss 被命中** | 命中点火花飞溅 + 部件材质碎片溅射（材质关联：金属=火花、混凝土=碎石粉尘） | MVP |
| 地面猛击 | 从 Boss 拳头发出的圆形冲击波（0.3s 扩展→衰减）+ 地面裂缝线 + 屏幕震动 | MVP |
| 碎片投掷 — 预警圈 | 1.5s 红色脉动圆（60px 半径），频率递增（0.5Hz→2Hz） | MVP |
| 碎片投掷 — 着弹 | 着弹点冲击波（100px 半径）+ 碎片飞溅 | MVP |
| 手臂横扫 | 手臂轨迹线（半透明运动拖尾，0.2s 残留） | MVP |
| 崩塌冲锋 | 冲锋方向地面裂缝+尘土+ Boss 身体倾斜动画 | MVP |
| 末日脉冲 | 核心蓄力闪光（1.0s，红→白渐变）+ 全屏环形冲击波（白色，0.2s 扩展→衰减）+ 屏幕边缘红色脉冲 | MVP |
| 自毁投掷 | Boss 装甲片撕裂粒子+闪光 → 投掷 | Alpha |
| 腿部破坏 | Boss 身体摇晃+碎片爆炸+屏幕震动（0.5s, 12px） | MVP |
| STUNNED | Boss 头部/核心摇晃+星形图标（继承 enemy-ai VFX） | MVP |
| VULNERABLE | 核心光晕从橙黄变为红色→脉动频率翻倍→Boss 全身微弱红光 | MVP |
| 入场 (INTRO) | Boss 从废墟中组装起身（碎片聚合动画，2.0s） | MVP |
| 死亡倒塌 | Boss 逐块碎裂+碎片飞溅+尘土云+屏幕长震动（3.0s） | MVP |

### 音频需求

| 事件 | 音频 | 优先级 |
|------|------|--------|
| **Boss 被命中** | 命中音（材质关联：金属=清脆撞击、混凝土=低沉闷响）+ 部件损伤状态变化时音高递增提示 | MVP |
| 地面猛击 | 低频冲击音+瓦砾碎裂层+地面震动 sub-bass | MVP |
| 碎片投掷 — 预警 | 递增音高 beep（4 次，0.5→2Hz） | MVP |
| 碎片投掷 — 着弹 | 金属/混凝土撞击音（材质相关） | MVP |
| 手臂横扫 | 风声 whoosh + 金属摩擦音 | Alpha |
| 崩塌冲锋 | 低频隆隆 crescendo + 撞击爆炸音 | MVP |
| 末日脉冲 | 核心蓄力嗡声 crescendo（1.0s）+ 冲击波释放低频轰鸣（与倒计时节奏同步） | MVP |
| 腿部破坏 | 混凝土碎裂+低频冲击+金属扭曲 | MVP |
| STUNNED | 低频嗡声（loop，眩晕期间持续） | MVP |
| VULNERABLE | 心跳加速节律+高频警报音（loop，弱点期间持续） | MVP |
| 入场 | 碎片聚合 crescendo + 低音轰鸣→激活音 | MVP |
| 死亡倒塌 | 多层碎裂音（treble→mid→bass 逐层叠加）+ 低频余音衰减（3.0s） | MVP |
| 阶段转换 (P1→P2) | 金属断裂声+音调下降 | Alpha |
| Boss 脚步声 | 重低音脚步（与移动锚点同步），音量随距离衰减 | Alpha |

**Asset Spec**: 视觉和音频需求已定义。Art Bible 批准后，运行 `/asset-spec system:boss-ai` 生成具体 asset 描述和 AI 生成 prompt。

## UI Requirements

### 玩家可见 UI

| UI 元素 | 显示内容 | 位置 | 触发时机 | 优先级 |
|---------|---------|------|---------|--------|
| **Boss HP 条** | 横向血条 + "废墟巨像" 名称 | 画面上方居中 | 进入 COMBAT 后持续显示 | MVP |
| **部件状态指示器** | 5 个小图标（双腿/双臂/核心），三态：完整(灰)/损伤(黄)/破坏(红) | Boss HP 条下方 | 进入 COMBAT 后持续显示，部件状态变化时更新 | MVP |
| **VULNERABLE 倒计时** | "WEAK POINT — 5.0" → 倒计时数字 | Boss HP 条右侧 | VULNERABLE 状态期间显示，数字每秒递减 | MVP |
| **Phase 提示** | "PHASE 2" 大字弹出（1.5s 后消失） | 画面中央 | 阶段转换时触发 | MVP |
| **STUNNED 提示** | "STUNNED" 文字 + Boss 头顶星形图标 | Boss 头顶 | STUNNED 期间显示 | MVP |
| **崩塌倒计时** | "COLLAPSE — 20.0" → 倒计时数字（红色，最后 5s 闪烁加速） | 画面上方居中（HP 条下方） | DOWNED 状态期间持续显示 | MVP |

### 开发/调试 UI

| UI 元素 | 用途 | 可见性 |
|---------|------|--------|
| Boss 状态标签 | 显示当前状态 (IDLE/INTRO/COMBAT/P1/P2/STUNNED/VULNERABLE/DOWNED/DEAD) | 仅调试模式 |
| 攻击冷却指示器 | 5 个攻击图标 + 冷却环 | 仅调试模式 |
| 部件损伤数值 | 每个部件的 accumulated_damage / threshold | 仅调试模式 |
| 威胁评分面板 | 当前 threat_score + 各威胁源详情 | 仅调试模式 |
| 锚点路径可视化 | 锚点连线 + 当前目标锚点高亮 | 仅调试模式 |

**UX Flag — Boss AI**: 本系统有实质性 UI 需求（Boss HP 条、部件状态、VULNERABLE 倒计时）。在 Phase 4 (Pre-Production)，运行 `/ux-design` 创建 Boss 战 HUD 的 UX spec。

## Acceptance Criteria

### A. Boss 初始化

- **AC1**: GIVEN a new Boss encounter is initialized, WHEN the Boss spawns into the scene, THEN the Boss has exactly 5 body part child nodes — 2 legs (Concrete, threshold=1000), 2 arms (Metal, threshold=500), 1 core body (Composite, threshold=1500) — each registered with the material destruction system.

- **AC2**: GIVEN a new Boss encounter is initialized, WHEN the Boss HP values are queried, THEN BossMaxHP = 3000 and BossTotalHP = 3000.

- **AC3**: GIVEN a new Boss encounter is initialized and no player has entered the trigger zone, WHEN the Boss state machine is queried, THEN the current state is IDLE, the Boss is invulnerable, performs no movement, and has no active attacks.

- **AC4**: GIVEN a boss room has anchor_points[] defined in the level data, WHEN the Boss enters COMBAT(P1), THEN the Boss moves along the anchor point path at 80 px/s, pausing at each anchor for its configured wait_duration before proceeding to the next.

### B. 阶段转换

- **AC5**: GIVEN the Boss is in COMBAT(P1) with legs_destroyed=0 and BossTotalHP=1600, WHEN a hit deals 100 direct HP damage reducing BossTotalHP to 1500 (≤50%), THEN the HP change triggers phase recalculation and phase transitions to 2, unlocking Self-Destruct Throw and Collapse Charge while move_speed remains 80 px/s (legs intact).

- **AC6**: GIVEN the Boss is in COMBAT(P1) with legs_destroyed=0 and BossTotalHP=2250 (75%), WHEN one leg's accumulated_damage reaches 1000 and DestroyPart fires, THEN legs_destroyed becomes 1, BossTotalHP is reduced by 750 to 1500 (50%), phase becomes Phase 2, and the Boss enters STUNNED.

- **AC7**: GIVEN the Boss is in any COMBAT phase with legs_destroyed=1, WHEN the second leg's accumulated_damage reaches 1000 and DestroyPart fires, THEN legs_destroyed becomes 2, BossTotalHP is reduced by another 750, and the phase transitions to DOWNED (move_speed=0, permanent VULNERABLE).

- **AC8**: GIVEN the Boss is in COMBAT(P1) with both legs intact and BossTotalHP > 1500, WHEN a hit reduces BossTotalHP to ≤1500 (≤50%) and triggers phase recalculation, THEN phase = Phase 2 but move_speed remains 80 px/s (legs are still intact, so the speed reduction from leg loss does not apply).

- **AC9**: GIVEN the Boss is currently not in a COMBAT state (e.g., STUNNED, IDLE, DEAD), WHEN a phase transition condition (HP <= 50%) is met, THEN the phase field updates internally, but the state machine does not change.

### C. STUNNED / VULNERABLE 机制

- **AC10**: GIVEN the Boss is in COMBAT(P1) with both legs intact, WHEN a leg's accumulated_damage reaches its threshold and DestroyPart fires, THEN the Boss enters STUNNED state for exactly 2.0 seconds — movement is disabled, current attack is interrupted.

- **AC11**: GIVEN the Boss has been in STUNNED state for exactly 2.0 seconds, WHEN the stun timer expires, THEN the Boss enters VULNERABLE state for exactly 5.0 seconds, during which vuln_mult=2.0 for all incoming damage calculations.

- **AC12**: GIVEN the Boss is in VULNERABLE state, WHEN a crush hit with impulse=1000 is applied, THEN the final damage is floor(1000 × 0.30 × 1.0 × 2.0) = 600.

- **AC13**: GIVEN the Boss is in VULNERABLE state with legs_destroyed=1 and hp_ratio <= 0.5, WHEN the 5.0-second VULNERABLE window expires, THEN the Boss returns to COMBAT(P2), vuln_mult returns to 1.0, and normal attack selection resumes.

- **AC14**: GIVEN the Boss is in VULNERABLE state with legs_destroyed=1 and hp_ratio > 0.5 (one leg destroyed, first VULNERABLE window, HP still above 50%), WHEN the 5.0-second VULNERABLE window expires, THEN the Boss returns to COMBAT(P2) with vuln_mult=1.0, and the attack pool includes Phase 2 attacks (Self-Destruct Throw, Collapse Charge). Note: there is no VULNERABLE→COMBAT(P1) path — leg destruction is the only entry to VULNERABLE, so at least one leg is always destroyed when VULNERABLE expires.

### D. 公式验证

- **AC15**: GIVEN the Boss is in COMBAT(P1) with vuln_mult=1.0, WHEN a bullet hit (impulse=500, type_factor=0.20) is applied, THEN boss_final_damage = floor(500 × 0.20 × 0.0 × 1.0) = 0 (Pillar 4 — 子弹不扣减 BossTotalHP). The bullet's impulse still accumulates on the hit body part via PartDamaged (dtc_part=0.3).

- **AC16**: GIVEN the Boss is in COMBAT(P1) with vuln_mult=1.0, WHEN a crush hit (impulse=1200, type_factor=0.30) is applied, THEN boss_final_damage = floor(1200 × 0.30 × 1.0 × 1.0) = 360.

- **AC17**: GIVEN the Boss is in VULNERABLE state (vuln_mult=2.0), WHEN a crush hit (impulse=1200, type_factor=0.30) is applied, THEN boss_final_damage = floor(1200 × 0.30 × 1.0 × 2.0) = 720 — exactly double the non-VULNERABLE value from AC16.

- **AC18**: GIVEN the Boss is in VULNERABLE state (vuln_mult=2.0), WHEN a bullet hit (impulse=500, type_factor=0.20) is applied, THEN boss_final_damage = floor(500 × 0.20 × 0.0 × 2.0) = 0 — Pillar 4 enforced: bullet dtc_effective=0.0 regardless of vuln_mult. Bullet still accumulates on body part via PartDamaged.

- **AC19**: GIVEN a Boss leg currently has accumulated_damage=970, WHEN a bullet hit (impulse=500, type_factor=0.20) is applied to that leg, THEN accumulated_damage becomes 970 + 500 × 0.20 × 0.3 = 1000, which meets the leg's threshold, so DestroyPart fires.

- **AC20**: GIVEN a Boss leg has reached its destruction threshold and DestroyPart fires, WHEN the part destruction is processed, THEN BossTotalHP is reduced by exactly 750 (3000 × 0.25), and legs_destroyed increments by 1.

- **AC21**: GIVEN the Boss is in COMBAT(P1) and the player is at distance 250px on the same vertical level, and the last 3 attacks were [Ground Slam, Debris Throw, Arm Sweep], WHEN attack selection evaluates Ground Slam, THEN Ground Slam appears once in the last 3 (count=1), repetition_penalty = 1.0 - 0.2×1 = 0.8, and attack_score = 15 × 1.0 × 1.0 × 0.8 × 1.0 = 12.0.

- **AC22**: GIVEN the Boss is at position (500, 200) and the player is at position (900, 200) with velocity (150, 0) px/s, WHEN Debris Throw fires and grabs a mass=20 object, THEN aim_position is within a 60px-radius circle around (1026, 200), and debris_impact_impulse = 20 × 10 = 200.

### E. 攻击行为

- **AC23**: GIVEN the Boss executes Ground Slam at position (X, Y), WHEN the 1.0s warning animation completes, THEN all entities within 300px radius receive 600 impulse, the attack goes on 4.0s cooldown, and any explosive or destructible objects within the AOE are triggered.

- **AC24**: GIVEN the Boss is in COMBAT(P1) and there are zero nodes in the "physics_object" group, WHEN attack selection evaluates Debris Throw, THEN the attack is excluded (attack_score=0) and the remaining available attacks compete normally.

- **AC25**: GIVEN the Boss is in COMBAT(P1) with at least one arm intact, WHEN attack selection runs, THEN Arm Sweep is in the available_attacks pool with base_priority=14 and CD=5.0s, and sweeps the lower 2/3 of the screen dealing 400 impulse.

- **AC26**: GIVEN the Boss is in COMBAT(P2), WHEN attack selection runs, THEN Arm Sweep is NOT in the available_attacks pool regardless of arm status. The available attacks are: Ground Slam, Debris Throw, Self-Destruct Throw, and Collapse Charge.

- **AC27**: GIVEN the Boss is in COMBAT(P2) and there is at least one destructible structure on the charge path to the player's last known position, WHEN Collapse Charge is selected and executed, THEN the Boss charges at 200 px/s, and upon hitting the structure deals 800 impulse within a 200px radius.

- **AC28**: GIVEN the Boss is in COMBAT(P2), WHEN Self-Destruct Throw fires, THEN (a) the Boss applies 5% HP loss to one of its own body parts (reducing that part's remaining accumulated_damage needed to reach threshold), (b) BossTotalHP is NOT reduced by this action (自损仅加速部件破坏不扣 HP), (c) a throwable RigidBody2D is spawned from the torn-off armor piece, and (d) the spawned object is thrown at the player's predicted position with a 1.5s warning circle.

### F. 边缘案例验证

- **AC29**: GIVEN both legs reach accumulated_damage >= their thresholds in the same damage evaluation frame, WHEN both DestroyPart events are processed sequentially, THEN the Boss enters STUNNED state exactly once (2.0s), followed by VULNERABLE (5.0s), and then transitions directly to permanent VULNERABLE / DOWNED — the second leg does NOT trigger a second STUNNED state.

- **AC30**: GIVEN the Boss performs Ground Slam on a position containing an explosive barrel, WHEN the barrel's explosion deals crush damage to the Boss that reduces BossTotalHP to 0, THEN the Boss correctly enters DEAD state and plays the 3.0s death animation.

- **AC31**: GIVEN the Boss is in COMBAT(P2) with BossTotalHP=1800 and legs_destroyed=1, WHEN the player dies and the death-respawn cycle completes, THEN the Boss returns to IDLE state, and upon re-entering the room, the Boss resumes at BossTotalHP=1800 with legs_destroyed=1 and phase=2.

- **AC32**: GIVEN the Boss is in VULNERABLE state and an explosive barrel is triggered, generating a HitData with vuln_mult=2.0 locked in, WHEN the VULNERABLE window expires before the explosion debris reaches the Boss, THEN the debris impact still uses vuln_mult=2.0 (locked at HitData generation time).

- **AC33**: GIVEN the Boss has BossTotalHP reduced to 0 and enters DEAD state, WHEN any damage source hits the Boss during the 3.0s death animation, THEN the damage is ignored and the animation plays uninterrupted.

- **AC34**: GIVEN the Boss is in COMBAT(P1) with no HP change and no leg destroyed since the last phase evaluation, WHEN the AI tick function runs for 10 consecutive cycles (5.0s), THEN `current_phase` is not recalculated (verified by mock/spy on the phase evaluation function call count — should be 0 across the 10 cycles). Phase evaluation only triggers on `BossTotalHP` change or leg `object_destroyed` signal.

### G. 跨系统接口

- **AC35**: GIVEN the Boss transitions from STUNNED to VULNERABLE, WHEN the state change fires, THEN the Boss emits the signal state_changed("STUNNED", "VULNERABLE") with the new state's expected duration (5.0s).

- **AC36**: GIVEN the Boss enters DEAD state after BossTotalHP reaches 0, WHEN the death animation begins, THEN the Boss emits boss_defeated, and the game state machine receives this event to transition to the victory sequence.

- **AC37**: GIVEN the Boss performs Ground Slam, WHEN the slam impact occurs, THEN the camera system receives a shake event with duration=0.3s and amplitude=8px.

- **AC38**: GIVEN a leg's accumulated_damage reaches its threshold and DestroyPart fires, THEN the camera system receives a shake event with duration=0.5s and amplitude=12px.

### H. 性能

- **AC39**: GIVEN the Boss is in any combat state (COMBAT(P1), COMBAT(P2), VULNERABLE, DOWNED) with default configuration, WHEN the AI update cycle runs (every 0.5s), THEN the total CPU time for state health check, phase evaluation, attack selection, AND threat perception does not exceed 1.5ms per cycle (measured by `Time.get_ticks_usec()` delta across ≥1000 consecutive cycles in a release build, reporting average and p99 — measurements taken separately for each combat state, reporting the worst-case state). Note: this measures AI logic only—physics simulation and rendering are measured separately.

- **AC40**: GIVEN the Boss is in IDLE state (player not yet in boss room trigger zone), WHEN the AI tick function is called, THEN the function completes in ≤0.01ms and performs zero calls to attack_selection(), threat_perception(), or anchor_path_update().

### I. 补充验收标准

- **AC41** (INTRO 计时器): GIVEN the player enters the Boss room trigger zone, WHEN the Boss transitions from IDLE to INTRO, THEN exactly 2.0s later the Boss transitions to COMBAT(P1), and during INTRO the Boss is invulnerable and performs no attacks.

- **AC42** (威胁感知忽略): GIVEN the Boss is in COMBAT(P2) and threat_score < THREAT_NOTICE (5.0), WHEN attack selection runs, THEN threat_modifier = 1.0 for all attacks and the Boss does not orient toward any threat.

- **AC43** (威胁感知注意): GIVEN the Boss is in COMBAT(P2) and THREAT_NOTICE ≤ threat_score < THREAT_ACT, WHEN the threat evaluation cycle runs, THEN the Boss orients toward the highest-threat source for exactly 0.5s but attack selection is unchanged (threat_modifier = 1.0).

- **AC44** (威胁感知行动 — 确定性): GIVEN the Boss is in COMBAT(P2) and THREAT_ACT ≤ threat_score < THREAT_PANIC, WHEN attack selection evaluates attacks that can reach the threat position, THEN threat_modifier > 1.0 for those attacks (verified by unit test with mocked threat_score). The 60%/30%/10% probability distribution (threat/player/ignore) is verified via statistical test: ≥1000 trials, chi-squared goodness-of-fit, p<0.05 — NOT a single-run assertion.

- **AC45** (威胁感知恐慌): GIVEN the Boss is in COMBAT(P2) and threat_score ≥ THREAT_PANIC (25.0), WHEN the threat evaluation cycle runs, THEN the Boss interrupts the current attack (if mid-execution, cancels the attack animation and any pending damage frames), and moves at least 100px away from the threat center (if move_speed > 0).

- **AC46** (攻击冷却): GIVEN the Boss has executed Ground Slam, WHEN attack selection evaluates Ground Slam within 4.0s of execution, THEN Ground Slam is excluded from available_attacks (attack_score=0) until the cooldown expires.

- **AC47** (VULNERABLE 攻击限制): GIVEN the Boss is in VULNERABLE state, WHEN attack selection runs, THEN only Ground Slam is available (CD doubled to 8.0s), and all other attacks are excluded regardless of Phase.

- **AC48** (几何卡阻回退): GIVEN the Boss is in COMBAT state and PhysicsRayQuery2D from its position to the next anchor point is blocked by debris, WHEN the anchor path update runs, THEN the Boss skips to the next available anchor. If all anchors are unreachable, the Boss moves toward room_center and continues fighting from there.

- **AC49** (锚点平台破坏回退): GIVEN the Boss's current target anchor position no longer has World layer or PhysicsObject support, WHEN the Boss arrives at or before the anchor, THEN it skips that anchor. If all anchors are invalid, the Boss redirects to room_center.

- **AC50** (双臂全失 Phase 1 攻击池): GIVEN the Boss is in COMBAT(P1) and both arms are destroyed, WHEN attack selection runs, THEN the available attacks are Ground Slam and Debris Throw only (碎片投掷不依赖手臂完整性——Boss 可用身体撞击物体). Arm Sweep is permanently excluded.

- **AC51** (DOWNED 崩塌倒计时): GIVEN the Boss enters DOWNED state, WHEN the state transition completes, THEN a 20.0s collapse countdown begins. If the countdown reaches 0 before BossTotalHP reaches 0, the room collapses and the player dies (crush type, no mitigation).

- **AC52** (DOWNED 末日脉冲): GIVEN the Boss is in DOWNED state, WHEN the attack selection cycle runs, THEN Doom Pulse is available (CD 4.0s) and fires a full-screen shockwave dealing 200 impulse at center with 30% damage decay per 100px distance.

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | MVP Boss 房间的具体布局——3 种环境物理要素的放置位置和锚点路径——需要在关卡设计数据系统中定义 | level-designer | MVP 前 | Boss AI 的行为参数依赖房间配置 |
| 2 | 废墟巨像的入场动画（2.0s）是否需要可跳过？首次不可跳、后续可跳？ | game-designer | MVP 前 | 影响 INTRO 状态的行为 |
| 3 | ~~双腿全破（DOWNED）后 Boss 是否仍有足够威胁？~~ **已解决 (2026-05-21)**：DOWNED 重新设计为"房间崩塌倒计时 + 末日脉冲"——20s 倒计时归零即死，末日脉冲提供持续威胁并创造连锁机会。挂机不再可行。 | game-designer | — | 已解决 |
| 4 | Boss 战是否允许玩家在战斗中退出房间（逃跑）？如果允许，Boss 状态如何保留？ | game-designer | MVP 前 | 当前设计假设 Boss 房间是封闭的 |
| 5 | 后续 Boss（Alpha/Full Vision）的行为框架是否完全复用废墟巨像的部件+阶段模型？还是每个 Boss 可以有独特的行为模型？ | game-designer | Alpha 前 | 影响 Boss AI 架构的抽象层级 |
| 6 | Boss 房间内是否需要 checkpoint？玩家死亡后从房间起点重生 vs 从关卡起点重生？ | game-designer | MVP 前 | 与死亡重生系统和关卡数据结构交互 |
| 7 | Phase 2 解锁的新攻击是否在 Phase 1 有任何"预告"——让玩家知道"这个 Boss 还有更多招"？ | game-designer | Alpha 前 | MVP 可不做——Phase 转换本身就是惊喜 |
