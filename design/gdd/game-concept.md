# Game Concept: 坍塌禁区 (Collapse Zone)

*Created: 2026-05-20*
*Status: Draft*

---

## Elevator Pitch

> 它是一款物理驱动横版动作射击游戏。你在一片重力异常的外星废墟中战斗——不靠子弹数量压死敌人，而是用每一次射击触发连锁物理反应：打碎天花板压死下面的怪物、引爆燃料罐把敌人炸进酸液池、射断吊索让集装箱横扫整个房间。每一次扣下扳机，都是一次有重量的事件。

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | 横版跑射 + 物理解谜 (Run-and-gun × Physics Sandbox) |
| **Platform** | 移动端 (iOS / Android) |
| **Target Audience** | 成就型 + 探索型玩家（喜欢征服关卡、钻研系统机制的硬核玩家） |
| **Player Count** | 单人（双人合作列为打磨期可选功能） |
| **Session Length** | 10-15 分钟（移动端碎片时间），完整关卡约 30 分钟 |
| **Monetization** | 付费下载（Premium），无内购抽卡 |
| **Estimated Scope** | Large（~15 个月，单人开发） |
| **Comparable Titles** | 魂斗罗（关卡结构）、Noita（物理涌现）、Teardown（环境破坏） |

---

## Core Fantasy

**"我不是在射击，我是在用子弹重塑战场。"**

在大多数射击游戏中，子弹只是伤害输出器。在坍塌禁区中，每一发子弹是一个物理事件的触发器——你会看到柱子倾斜、天花板坍塌、敌人被冲击波震飞撞向另一个敌人引爆它背上的燃料罐。玩家不是在"瞄准敌人"，而是在"阅读空间"——快速判断：这个结构朝哪个方向倒？哪个先引爆？连锁路径的最优解是什么？

最终幻想：当你在一个房间里用一发子弹触发 8 步连锁反应清空所有敌人时，你感受到的不是手速的快感，而是**物理推理被验证的智力快感**。

---

## Unique Hook

> 像魂斗罗，**同时**每一发子弹的命中不只是扣血——它是物理事件的触发器。枪不是武器，是**连锁反应的第一个多米诺骨牌**。

可分享瞬间：每次出现一个意外的 5+ 步连锁，就是一段天然短视频素材。

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics (What the player FEELS)

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Sensation** (sensory pleasure) | 1 | 碎片的飞溅轨迹、爆炸屏幕震动、结构倒塌的逐帧物理——每一次连锁都是一场视觉演出 |
| **Fantasy** (make-believe, role-playing) | 5 | 外星废墟探险者的角色感，但故事很薄——重点在"物理破坏者"的幻想 |
| **Narrative** (drama, story arc) | 8 | 仅通过环境叙事——废墟本身在讲发生了什么 |
| **Challenge** (obstacle course, mastery) | 2 | 关卡越往后物理复杂度越高，Boss 战是终极物理谜题 |
| **Fellowship** (social connection) | 7 | 打磨期可选双人合作；上线后有排行榜 |
| **Discovery** (exploration, secrets) | 3 | 每个房间都是物理谜题——"这里的吊灯能不能砸穿那个平台？" 系统驱动的实验感 |
| **Expression** (self-expression, creativity) | 4 | 每个战斗房间有多种物理连锁路径，解法不唯一 |
| **Submission** (relaxation, comfort zone) | 6 | 不适用——这是一个需要专注的高强度游戏，但物理破坏的压力释放确有解压成分 |

### Key Dynamics (Emergent player behaviors)

- 玩家会自发"先观察再开枪"——进入新房间先用 2 秒扫描物理要素，而非直接扣扳机
- 玩家会尝试"最少子弹清场"——追求一发子弹触发最长连锁
- 玩家会分享意外连锁的短视频——涌现式物理天然适合传播
- 玩家会在脑中建立"材质词典"——什么结构需要几枪才能破坏、什么爆炸范围多大

### Core Mechanics (Systems we build)

1. **射击冲击力系统**：每把武器不只是伤害值 —— 它有冲击力向量、后坐力曲线、弹道特性
2. **材质破坏系统**：每种材质有破坏阈值和倒塌方向规则（木 < 金属 < 混凝土；悬空物优先向下塌）
3. **连锁传播系统**：爆炸、火焰、酸液、电流之间的转化规则（火焰引爆爆炸物、酸液腐蚀金属结构）
4. **关卡物理设计系统**：每个战斗房间 = 敌人布局 × 环境可破坏物布局，构成一个"物理谜题"

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** (freedom, meaningful choice) | 每个战斗房间有多种物理连锁路径，没有"唯一解法" | Core |
| **Competence** (mastery, skill growth) | 从"乱射"到"精准引爆"的技能曲线清晰可见；通关评价系统量化成长 | Core |
| **Relatedness** (connection, belonging) | 可选双人合作 + 排行榜；物理连锁的"可分享瞬间"建立社区连接 | Supporting |

### Player Type Appeal (Bartle Taxonomy)

- [x] **Achievers** (goal completion, collection, progression) — 关卡通关、连锁评分、速通排行榜
- [x] **Explorers** (discovery, understanding systems, finding secrets) — 物理系统深度实验、隐藏连锁路径
- [ ] **Socializers** (relationships, cooperation, community) — 非核心目标用户
- [x] **Killers/Competitors** (domination, PvP, leaderboards) — 速通排行榜（次要吸引力）

### Flow State Design

- **Onboarding curve**: 前 10 分钟 = 单一物理要素逐一教学（第一枪打爆油桶 → 第二枪射断吊索 → 第三枪打碎地板），然后组合出现
- **Difficulty scaling**: 关卡递进 = 物理复杂度递进（更多要素类型同时在场、连锁路径更长、反应窗口更短）
- **Feedback clarity**: 每次物理交互都有明确的视觉反馈（碎裂粒子、倒塌动画、屏幕震动），玩家瞬间知道"这一枪造成了什么"
- **Recovery from failure**: 死亡后回到房间起点，物理状态重置。失败是学习的一部分——"这次我知道了，那个柱子可以打"

---

## Core Loop

### Moment-to-Moment (30 seconds)

扫描房间 → 识别物理要素（0.5 秒）→ 射击触发点（0.1 秒）→ 观察连锁展开（1-2 秒）→ 清理残敌 / 移动到下一个射击位置。

这是"设置→引爆→收获"的微型循环。每次开枪都是一个物理决策。

### Short-Term (5-15 minutes)

一个战斗房间 = 一组配置好的物理谜题。清空后获得喘息点 + 战术奖励（用优雅连锁清场 = 额外弹药/隐藏通道）。每个房间让人想"再来一局"的动力来自于"刚才那个连锁够不够长？能不能换个路径？"

### Session-Level (30-120 minutes)

线性关卡结构（8 大关），每关 5-8 个战斗房间 + Boss 战。Boss 房间是终极物理谜题——Boss 本身无法被直接射击击杀，必须用环境要素（让吊车撞它、引爆燃料库、让它自己撞碎支撑柱）。关卡结束 = 明显高潮点 + 自然休息点。

### Long-Term Progression

- **技能成长**：玩家学会更高效的物理连锁模式，建立"材质词典"和"连锁直觉"
- **武器解锁**：过关解锁新武器，每把新武器 = 一种新的物理交互方式（标准弹 = 冲击力、粘弹 = 延时引爆、磁力弹 = 吸引/排斥金属物）
- **终极目标**：通关全部 8 关 → 解锁 Boss Rush → 解锁 Speedrun 计时模式

### Retention Hooks

- **Curiosity**: "下一关有什么新环境要素？新武器能触发什么新连锁？"
- **Investment**: 对物理系统的深度理解是无形资产——"我花了时间学会的物理直觉，不能白费"
- **Social**: 排行榜排名；分享精彩连锁视频
- **Mastery**: 从 C 评分到 S 评分，从普通通关到 Speedrun 前十

---

## Game Pillars

### Pillar 1: 每一发子弹都有重量 (Every Bullet Has Weight)

武器不是数值输出器，而是物理事件的触发器。后坐力、弹道、冲击力都是真实的。每发子弹命中时都有命中停顿 (hit-stop)、屏幕震动、环境反应。

*Design test*: 在"增加子弹数"和"让每发子弹冲击力翻倍"之间犹豫 → 选后者。

### Pillar 2: 战场是一个多米诺骨牌阵列 (The Battlefield Is a Domino Array)

关卡设计的第一原则不是"在哪里放敌人"，而是"这个场景里有什么可以推倒的"。敌人布局永远围绕物理要素展开。每个战斗房间必须有至少 2 种可连锁的环境要素。

*Design test*: 一个房间如果没有至少 2 条物理连锁路径 → 重做。

### Pillar 3: 规则稳定，结果惊喜 (Stable Rules, Surprising Results)

物理规则透明、可学习、可预测。但每次执行允许偏差——计划基本如预期展开，但偶尔会有"没想到那个敌人刚好被炸飞进那个角落"的时刻。理想比例：70% 可预测 + 30% 惊喜。

*Design test*: 同一房间同一枪法连续测试 10 次——如果结果完全一致（太死板），加入变量；如果结果差异超过 50%（太混乱），收紧规则。

### Pillar 4: 通关靠脑子，不靠反应 (Brain Over Reflexes)

虽然外壳是动作射击，真正的技能门槛是**快速物理推理**——判断什么结构会朝哪个方向倒、什么连锁路径最高效——而非纯粹的手速。反应快但不理解物理的玩家和理解了物理但反应慢的玩家，后者应该走得更远。

*Design test*: 如果某个 Boss 战可以用纯粹的高 APM 枪法通过而不使用环境连锁 → 设计失败，需要重做 Boss 房间。

### Anti-Pillars (What This Game Is NOT)

- **不是弹幕游戏**: 敌人不靠子弹数量压死你。威胁来自房间的物理复杂度，不是满屏弹幕。子弹数量应该克制到每发都有意义。
- **不是刷刷刷**: 不刷装备、不抽卡、不堆数值。武器解锁靠过关，变强靠理解物理。
- **不是 Metroidvania**: 关卡线性推进。专注做"从 A 点到 B 点一路上把所有东西砸烂"的体验。没有回头路、没有锁住的门需要以后回来开。

---

## Visual Identity Anchor

**Direction**: 可读性废墟 (Readable Ruins)

**One-line visual rule**: 「每一块碎片都在讲战斗的故事」——所有物理破坏必须清晰可读，碎片轨迹、裂缝蔓延、结构倒塌的每个阶段都是可识别的事件。

**Supporting visual principles**:

1. **破坏清晰度 (Destruction Clarity)**: 碎片轨迹、裂缝蔓延方向、倒塌节奏必须让玩家在 0.2 秒内识别。"什么被破坏了"和"破坏的结果是什么"是两个不同层次的视觉信息，前者用粒子系统，后者用慢动作 + 屏幕拉焦。
   *Design test*: 一个没玩过的人看 3 秒连锁反应录像 → 能说出"发生了什么"。

2. **危险色语言 (Hazard Language)**: 所有可交互物理要素使用统一的颜色编码——橙色 = 爆炸性（燃料罐、油桶）、绿色 = 腐蚀性（酸液、毒气）、红色 = 结构不稳定（裂缝墙、摇摇欲坠的天花板）。玩家在任何画面中 0.2 秒内识别"可以打的东西"。
   *Design test*: 截一张游戏画面 → 圈出所有可交互物理要素 → 颜色是否一致传达了要素类型。

3. **重量感传达 (Weight Communication)**: 物体的物理属性通过视觉设计传达——重的物体（金属、混凝土）使用暗色 + 粗边缘 + 厚实块状；轻的物体（木箱、碎片）使用亮色 + 细边缘 + 小型不规则形状。玩家凭直觉就知道"这个东西打一枪会怎样"。
   *Design test*: 给一个玩家看 5 秒场景截图 → 他应该能大致判断每个物体的重量和破坏后会发生什么。

**Color philosophy**: 灰棕底色（废墟环境基础色）→ 鲜艳危险色（可交互物理要素）→ 高对比度角色剪影（玩家和敌人）。层级关系：角色 > 危险要素 > 环境废墟。任何画面中玩家的视线应该自然先看到"什么在威胁我"，再看到"我能打什么"，最后才看到"我站在哪里"。

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| 魂斗罗 (Contra) | 关卡结构、Boss 战节奏、横版跑射的"推图快感" | 子弹不直接杀敌，子弹是物理触发器 | 验证了横版射击关卡推进的核心循环是成立的 |
| Noita | 物理涌现、材质交互、元素连锁 | 横版线性而非开放沙盒，物理规则更透明可控 | 证明了"每像素物理模拟"可以创造深度和可分享性 |
| Teardown | 环境破坏的视觉满足感、结构倒塌的物理真实性 | 2D 横版而非 3D，加入敌人战斗而非纯破坏 | 证明"破坏有市场"——玩家愿意为高质量的物理破坏付费 |
| Dead Cells | 高难度、死亡重生循环的快节奏 | 不加入肉鸽随机元素，保持手工设计的关卡 | 验证了移动端高难度动作游戏有可行性 |

**Non-game inspirations**: 工业废墟美学（Chernobyl 纪录片、破败工厂摄影）、多米诺骨牌装置艺术（连锁反应的节奏美感）、成龙动作片（用环境道具打架的"即兴物理战斗"）

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 18-35 |
| **Gaming experience** | Mid-core to Hardcore（能接受高难度但不需要竞技级手速） |
| **Time availability** | 通勤碎片时间（10-15 分钟）+ 周末较长时段（1-2 小时） |
| **Platform preference** | 移动端为主（可能有手柄外设） |
| **Current games they play** | Dead Cells Mobile、Pascal's Wager、Grimvalor、Brawlhalla |
| **What they're looking for** | 移动端缺少的"有质量的硬核动作体验"——不是数值堆砌的伪硬核，而是真正考验理解和技能的硬核 |
| **What would turn them away** | 满屏虚拟按键、pay-to-win 数值系统、自动战斗 |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | Godot 4.6（用户已选择）——Jolt 物理引擎默认启用，2D 物理性能优异 |
| **Key Technical Challenges** | (1) Jolt 物理在移动端的性能上限——同时活跃物理对象数的极限测试 (2) 触屏三指操作方案（移动+瞄准+射击）的交互设计 (3) 物理状态同步（如果后续加入双人合作） |
| **Art Style** | 2D 像素或低多边形——清晰可读优先，美术资产量可控 |
| **Art Pipeline Complexity** | Low-Medium（2D sprite + 粒子效果，无 3D 建模需求） |
| **Audio Needs** | Moderate——需要高质量的破坏音效层级（不同材质的碎裂声、爆炸的低频、连锁反应中逐层递进的声音反馈） |
| **Networking** | None（MVP 和 Alpha），可选的 P2P 双人合作（打磨期） |
| **Content Volume** | 8 关 × 5-8 房间 = 约 50 个物理谜题房间 + 8 个 Boss 房间 + 6-8 把武器 |
| **Procedural Systems** | 无——所有关卡手工设计以保证物理谜题质量 |

---

## Risks and Open Questions

### Design Risks

- **物理规则平衡点难以量化**: "70% 可预测 + 30% 惊喜"是理想目标，但如何测量和调整需要大量内部测试。一旦失衡，要么变成无聊的解谜游戏，要么变成不可控的随机生成器。
- **Boss 战的物理谜题设计天花板**: 8 个 Boss 每个都需要独特的物理解法（不能用枪直接打），设计空间可能不够 8 个。需要考虑是否可以降低到 5-6 个 Boss + 2 个纯物理追逐关。
- **移动端玩家的挫败感管理**: 硬核难度 + 物理推理门槛可能在移动端造成较高的早期流失率。前几关的难度曲线需要非常小心。

### Technical Risks

- **Godot 4.6 Jolt 物理移动端性能未知**: 同时活跃 30-50 个物理对象在低端 Android 设备上能否稳定 60fps——这是 MVP 阶段必须验证的第一件事。如果不行，需要引入物理对象池 + LOD（远处对象简化模拟）。
- **Godot 4.6 的新特性稳定性**: 作为 2026 年 1 月发布的新版本，Jolt 作为默认物理引擎的移动端表现社区数据有限。需要自己 profiling。
- **触屏操作精度**: 物理连锁需要精确的瞄准——在触屏上精确选择"打柱子的左下角"而非"打柱子的大概位置"是交互设计上的硬挑战。可能需要自动瞄准辅助（吸附到最近的可交互物理要素）。

### Market Risks

- **移动端横版动作是小众品类**: 虽然有 Dead Cells Mobile 验证了市场存在，但整体量级无法与休闲手游相比。需要管理预期。
- **付费下载模式在移动端困难**: F2P + 广告/IAP 是移动端主流。纯付费可能限制用户量，但 F2P 不适合这个设计（没有数值养成可以变现）。需要探索 NetEase/腾讯等发行商，或考虑 Steam 首发再移植移动端。

### Scope Risks

- **50 个手设计物理谜题房间的工作量**: 每个房间需要反复测试和调整——不像传统关卡只需要"放敌人 + 放平台"。实际设计时间可能是传统横版关卡的 2-3 倍。
- **首次做游戏 + 物理重度系统 = 高风险组合**: 建议在 MVP 阶段通过大量原型测试降低设计风险，不要直接投入关卡量产。

### Open Questions

- **触屏操作方案选择**: 虚拟摇杆 + 自动瞄准最近物理要素？点击瞄准 + 滑动移动？这两个方案需要在 MVP 阶段做 A/B 测试。
- **关卡结构的最佳粒度**: 传统魂斗罗的"一命到底" vs 房间制的"清空→前进"——哪种节奏更适合移动端碎片时间？MVP 应该两种都试。
- **是否先从 Steam 版本开始**: 避开移动端性能限制，先验证核心循环和关卡设计，再移植到移动端。这个策略可能降低技术风险。

---

## MVP Definition

**Core hypothesis**: 物理连锁反应作为横版射击的核心战斗机制，在移动端触屏操作下是爽的、可学的、有深度的。

**Required for MVP**:

1. 完整的物理系统原型：射击冲击力 + 3 种材质破坏 + 爆炸传播 + 连锁伤害
2. 2 把武器（标准弹 + 粘弹）+ 5 种环境物理要素（可破坏墙、爆炸桶、悬挂物、酸液池、不稳定结构）
3. 3 个战斗房间 + 1 个 Boss 房间（验证"计划式连锁"的战斗节奏和操作手感）
4. 基础触屏操作方案（至少尝试 2 种方案对比）

**Explicitly NOT in MVP**:

- 完整关卡美术（用灰色 box + 简单色块代替）
- 多武器解锁系统
- 评分/排行榜
- 双人合作
- 音效（仅保留关键反馈音效用于测试）

### Scope Tiers

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **MVP** | 3 房间 + 1 Boss（灰盒美术） | 物理系统 + 2 武器 + 基础操作 | ~12 周 |
| **Alpha** | 4 关完整内容 | 全部武器 + 全部敌人类型 + 关卡选择 + 评分系统 | ~28 周 |
| **Full Vision** | 8 关 + Boss Rush | Speedrun 模式 + 排行榜 + 完整美术和音效 | ~45 周 |
| **Polish** | 8 关 + 额外挑战关 | 双人合作 + 成就系统 + 全平台性能优化 | ~60 周 |

---

## Next Steps

- [ ] Run `/setup-engine` to configure Godot 4.6 and populate version-aware reference docs
- [ ] Run `/art-bible` to create the visual identity specification — establish the "Readable Ruins" visual direction before writing system GDDs
- [ ] Use `/design-review design/gdd/game-concept.md` to validate concept completeness
- [ ] Run `/map-systems` — decompose the concept into individual systems (shooting physics, material destruction, chain propagation, level design, etc.)
- [ ] Author per-system GDDs with `/design-system` for each system in dependency order
- [ ] Run `/create-architecture` — produce the master architecture blueprint
- [ ] Record key architectural decisions with `/architecture-decision` for each Required ADR
- [ ] Run `/architecture-review` — bootstrap TR registry and traceability matrix
- [ ] Run `/gate-check pre-production` — validate readiness before committing to sprints
