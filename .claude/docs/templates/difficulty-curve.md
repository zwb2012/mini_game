# 难度曲线：[Game Title]

> **状态**：Draft|In Review|Approved
> **作者**：[game-designer / systems-designer]
> **最后更新**：[Date]
> **链接到**：`design/gdd/game-concept.md`
> **相关 GDD**：[e.g., `design/gdd/combat.md`, `design/gdd/progression.md`]

---

## 困难哲学

[一段很难建立起这个游戏的关系。这是
不是机械描述——它是所有调校的设计价值陈述
决策必须发挥作用。

四种常见的难度理念是：

1. **受虐挑战作为核心幻想**：难度就是产品。
   克服它是情感上的奖励。降低难度消除了
   观点。 （《黑暗之魂》，塞莱斯特处于最大辅助关闭状态）
2. **无障碍入口，可选深度**：基本体验可通过以下方式完成：
   大多数玩家；深度和挑战是那些想要的人可以选择的。
   （哈迪斯、空洞骑士，具有无障碍模式）
3. **难度服务于叙事节奏**：挑战的上升和下降相匹配
   故事节拍。玩家必须在故事解决过程中感受到自己的能力，并且
   在故事危机期间受到威胁。 （最后生还者，战神）
4. **轻松参与**：挑战存在，但从来不是焦点。失败
   是温和且罕见的。体验优先考虑舒适度和表达力
   越过障碍物。 （《星露谷物语》、《动物森友会》）

明确地陈述理念，然后添加一句话来说明玩家是什么
允许感受：允许他们感到沮丧吗？提前多久
设计必须介入？可接受的失败成本是多少？]

---

## 难度轴

> **指南**：大多数游戏都有多个独立的挑战维度。
> 明确识别它们可以防止只调整一根轴的错误
> （通常是执行困难），同时让其他人未经审查。一个游戏可以
> 执行时感觉“轻松”，但决策复杂性令人难以承受——玩家
> 感觉这很混乱，没有吸引力。
>
> 对于每个轴，回答：玩家是否可以通过以下方式控制或减少该轴：
> 选择、构建或设置？如果不是，那就是强行挑战维度——
> 对于如何使用它要非常有意识。

| 轴 | 描述 | 主要系统 | 玩家控制？ |
|------|-------------|----------------|-----------------|
| **执行难度** | [The precision and timing demands of core actions. e.g., "Dodging enemy attacks requires correct timing within a 200ms window."] | [e.g., Combat, movement] | [Yes — practice reduces this / No — fixed mechanical threshold] |
| **知识难度** | [The cost of not knowing information. e.g., "Enemy weaknesses are not telegraphed; players who have not discovered them take significantly more damage."] | [e.g., Enemy design, UI, lore] | [Yes — through in-game discovery / No — requires external knowledge] |
| **资源压力** | [How scarce are the resources needed to progress? e.g., "Health consumables are limited; efficient play is required to sustain long dungeon runs."] | [e.g., Economy, loot, crafting] | [Yes — through build optimization / Partially] |
| **时间压力** | [Does the player have time to think, or does the game demand rapid decisions? e.g., "Enemy spawn timers and attack windows require real-time response."] | [e.g., Combat pacing, timers] | [Yes — through difficulty settings / No — core to genre] |
| **决策复杂性** | [How many meaningful choices must the player evaluate simultaneously? e.g., "Build decisions interact across 4 systems; suboptimal combinations create compounding disadvantage."] | [e.g., Progression, inventory, skills] | [Yes — through UI and tutorialization / No — inherent to strategy depth] |
| **[Add axis]** | [Description] | [Systems] | [Player control] |

---

## 难度曲线概述

> **指导**：此表描述了整个过程中的预期挑战弧
> 游戏。难度级别采用 1-10 等级，其中 1 = 没有有意义的挑战，
> 10 = 游戏可以产生的最大挑战。规模是相对于本游戏的
> 设计意图——《魂类》中的6/10与舒适模拟游戏中的6/10不同。
>
> “主要挑战类型”指的是难度轴（来自上表）
> 这是这个阶段做最多工作的。引入的新系统应列出
> 仅首次引入的系统——学习的认知负荷
> 新系统本身就是一种困难。
>
> “目标玩家状态”是设计师想要的情绪状态。如果实际
> 游戏测试状态与预期状态存在偏差，此栏正是需要的
> 要实现的。

| 阶段 | 期间 | 难度级别（1-10） | 主要挑战类型 | 推出新系统 | 目标玩家状态 |
|-------|----------|------------------------|----------------------|----------------------|---------------------|
| [Prologue / Tutorial] | [e.g., 0-15 min] | [2/10] | [Knowledge] | [Core movement, basic interaction] | [Safe, curious, building confidence] |
| [Early game] | [e.g., 15 min - 2 hrs] | [3-5/10] | [Execution] | [Combat, inventory, first upgrade path] | [Learning, occasional failure, clear cause-effect] |
| [Mid game - opening] | [e.g., 2-6 hrs] | [5-7/10] | [Decision complexity] | [Build choices, advanced enemies, crafting] | [Engaged, strategizing, feeling growth] |
| [Mid game - depth] | [e.g., 6-15 hrs] | [6-8/10] | [Resource pressure] | [Elite enemies, optional hard content, endgame previews] | [Challenged, invested, approaching mastery] |
| [Late game] | [e.g., 15-25 hrs] | [7-9/10] | [Execution + knowledge] | [Endgame systems, NG+ or equivalent] | [Mastery, confident in build identity, seeking peak challenge] |
| [Optional / Endgame] | [e.g., 25+ hrs] | [8-10/10] | [All axes combined] | [Mastery challenges, achievement targets] | [Expert play, self-imposed goals, community comparison] |

---

## 入职坡道

> **指导**：第一个小时值得有自己的详细细分，因为它
> 做最困难的设计工作：它必须教授每一项基本技能
> 感觉不像是一个教训，而且它必须创造足够的投资，以便
> 玩家致力于未来的旅程。对玩家保留率的研究表明
> 大多数离开游戏的玩家都是在前 30 分钟内离开的——并不是因为
> 游戏很糟糕，但因为入职未能连接他们。
>
> 脚手架原理（维果茨基最近发展区，改编
> 对于游戏设计）：在组合之前单独介绍每个机制
> 与其他人。玩家无法在压力下同时学习两种技能。

### 玩家在每个阶段都知道什么

| 时间 | 玩家知道什么 | 他们还不知道什么 |
|------|-----------------------|--------------------------|
| [0 min] | [Literally nothing — treat this row as your most important UX audit. What can a player infer from the title screen alone?] | [Everything] |
| [5 min] | [Core movement verb, basic world reading] | [All progression systems, all secondary mechanics] |
| [15 min] | [Core interaction loop, first goal] | [Build depth, advanced mechanics, danger severity] |
| [30 min] | [Has made at least one strategic choice] | [Whether that choice was optimal] |
| [60 min] | [Has a working model of the core loop] | [Late-game depth, optional systems] |

### 机械师介绍顺序

> 引入的顺序机制是具有实际后果的设计决策。
> 首先介绍最重要的动词。引入修改其他机制
> 基础机制内化后的机制。永远不要引入两个新的
> 在同一次遭遇中的机械师。

| 机械 | 介绍于 | 介绍方法 | 介绍时的赌注 |
|----------|--------------|--------------------|-----------------------|
| [Core movement / primary verb] | [e.g., First 30 seconds] | [Tutorial prompt / environmental design / NPC instruction] | [None — safe space to experiment] |
| [Primary interaction / action] | [e.g., First 2 minutes] | [Method] | [Low — reversible, forgiving window] |
| [First resource mechanic] | [e.g., 5 min] | [Method] | [Low — abundant at introduction] |
| [First strategic choice] | [e.g., 15 min] | [Method] | [Low — choice can be changed or revisited] |
| [First real failure risk] | [e.g., 20-30 min] | [Method] | [Moderate — player should feel genuine threat but have fair tools to respond] |
| [Add mechanic] | [Timing] | [Method] | [Stakes] |

### 第一次失败

[描述玩家能够有意义地第一时刻的预期设计
失败。这是游戏中最重要的节拍之一。

精心设计的第一次失败是一种教育，而不是惩罚。玩家应该
能够立即识别他们做错了什么以及他们会做什么
不同。如果失败的原因不明确，玩家就会将责任归咎于游戏。

答：第一次失败的原因是什么？玩家可以从中学到什么？
他们可以多快重试？费用是多少？游戏是否提供任何
连接因果关系的反馈？]

### 当玩家第一次感觉自己有能力时

[确定具体时刻——不是一个模糊的窗口，而是一个特定的节拍——
玩家应该从“学习”转向“做”。这一刻
第一能力：他们对比赛的预测第一次成真，
或者他们第一次执行一个计划并且它有效时。

这一刻必须在第一个小时内发生。如果没有，玩家
不会到达旅程的第三阶段（第一掌握）。设计这一刻
故意——不要听凭偶然。

现在是什么时刻？什么系统创建它？玩家要做什么
触发吗？游戏如何传达他们已经成功的信息？]

---

## 难度高峰和低谷

> **指导**：健康的难度曲线遵循锯齿模式
> （Csikszentmihalyi 的流动模型勘测宏观结构）：已建立张力
> 通过一个序列，然后在一个里程碑处释放，然后在某个里程碑处重新参与
> 基线略高。平坦的难度会让人感到无聊；不间断的
> 升级会造成疲劳。
>
> 峰值是测试累积技能的故意峰值。山谷是
> 故意设计的低谷为玩家提供呼吸、实验和思考的空间
> 在下一次升级之前感到强大。两者都是经过设计的，而不是自然产生的。
>
> “恢复设计”至关重要：峰值后立即发生什么？这
> 玩家在经历困难时刻时应该感到成就感，而不是精疲力尽。给
> 它们是山谷、奖励或叙事回报。

| 姓名 | 游戏中的位置 | 类型 | 目的 | 恢复设计 |
|------|-----------------|------|---------|-----------------|
| [e.g., "The First Boss"] | [e.g., End of Area 1, ~1 hr] | [Spike] | [Tests all skills introduced in Area 1. Acts as a gate confirming the player is ready for increased complexity.] | [Post-boss: safe area, upgrade opportunity, story beat that provides emotional relief before Area 2 escalation begins.] |
| [e.g., "The Safe Zone"] | [e.g., Hub area between Areas 1 and 2, ~1.5 hrs] | [Valley] | [Player feels powerful from boss win. Space to experiment with build options before stakes rise.] | [N/A — this IS the recovery from the preceding spike.] |
| [e.g., "The Knowledge Wall"] | [e.g., Area 3 first encounter, ~4 hrs] | [Spike — knowledge type] | [Forces players to engage with a mechanic they may have been avoiding. Survival requires understanding it.] | [Clear feedback on what killed them. Tutorial hint surfaces on third failure. Mechanic becomes standard after this point.] |
| [e.g., "Pre-Climax Valley"] | [e.g., Just before final act, ~20 hrs] | [Valley] | [Emotional breathing room before the final escalation. Player reflects on how far they have come.] | [N/A — designed as relief before the finale's spike.] |
| [Add spike/valley] | [Location] | [Type] | [Purpose] | [Recovery] |

---

## 平衡杆

> **指导**：平衡杠杆是具体值和参数
> 调整每个阶段的难度。将它们集中在这里使得可以
> 调整整个游戏的难度曲线，无需搜索各个 GDD。
> 对于每个杠杆，拥有它的 GDD 应进行交叉引用。
>
> “当前设置”是撰写本文时的设计意图——实现
> 值存在于`assets/data/`中。整定范围是安全工作范围：
> 超出此范围的值确实会破坏预期的体验。

| 杠杆 | 阶段 | 影响 | 当前设置 | 调谐范围 | 笔记 |
|-------|----------|--------|----------------|-------------|-------|
| [Enemy health multiplier] | [All] | [Higher = longer fights = more resource pressure and execution time] | [1.0x] | [0.7x - 1.5x] | [Below 0.7x, fights end before player can read enemy patterns. Above 1.5x, attrition replaces skill.] |
| [Enemy aggression timer] | [Mid game onward] | [Time between enemy attacks; lower = less time to react] | [e.g., 2.0s] | [1.2s - 3.0s] | [Below 1.2s, reaction window is sub-human. Above 3.0s, encounters feel passive.] |
| [Resource drop rate] | [Early game] | [Lower = more resource pressure = punishes inefficiency harder] | [e.g., 1.5x baseline] | [0.8x - 2.0x] | [Onboarding generosity; reduces in mid-game as player skill assumed.] |
| [New mechanic introduction density] | [First hour] | [How many new concepts per minute of play; too high = cognitive overload] | [e.g., 1 new mechanic per 8 min] | [1 per 5 min (max) to 1 per 15 min (slow)] | [Above 1 per 5 min in early game causes retention drop. Below 1 per 15 min causes boredom.] |
| [Failure cost] | [All] | [Time lost on failure; higher = more punishing = more tension] | [e.g., 2 min setback] | [30s - 8 min] | [Must scale with encounter frequency. Frequent failures need fast recovery.] |
| [Add lever] | [Phase] | [Effect] | [Setting] | [Range] | [Notes] |

---

## 玩家技能假设

> **指导**：每个游戏都隐含地假设玩家发展了一套技能
> 在比赛过程中。明确这些假设可以让团队
> 验证每项技能在测试之前是否已实际教授，并且
> “引入”和“经过严格测试”之间的差距足够长，足以内化。
>
> 在同一次遭遇中引入并测试的技能是一个令人惊讶的难度
> 长钉。假设但从未正式引入的技能是无证知识
> 墙。两者都是可以修复的——但前提是它们被记录下来。
>
> “教导者”是指：教程机制提示、环境设计、
> 安全练习机会、NPC 指导或有机发现。
>
> “经测试”指的是第一次遭遇需要此技能才能生存
> 不会造成重大损失或成本。

| 技能 | 引入于 | 预期掌握者 | 授课者 | 第一次硬测试 |
|-------|--------------|---------------------|-----------|-----------------|
| [Core movement / dodging] | [Tutorial area, 0-5 min] | [End of Area 1, ~1 hr] | [Safe practice zone with visible hazards] | [First Elite enemy, ~45 min] |
| [Resource management] | [First shop encounter, ~10 min] | [Mid game, ~4 hrs] | [Resource scarcity in Area 2 forces planning] | [Boss that requires consumables to survive efficiently] |
| [Build decision-making] | [First upgrade choice, ~20 min] | [End of mid game, ~10 hrs] | [Multiple playthroughs / community discussion / in-game build advisor] | [Endgame encounters that punish build incoherence] |
| [Enemy pattern reading] | [Area 1 basic enemies] | [Area 3, ~4 hrs] | [Enemy telegraphs visible and consistent from introduction] | [Elite enemy with 3+ distinct attack patterns] |
| [Add skill] | [When introduced] | [When mastered] | [Taught by] | [First hard test] |

---

## 无障碍功能注意事项

> **指导**：难度设计的可访问性并不是为了制作游戏
> 更容易——这是为了确保玩家具有不同的需求和技能概况
> 才能达到预期的情感体验。明确可以做什么
> 调整和不能调整的内容，并证明两者都是合理的。
>
> 自我决定理论的原则是：玩家需要感到自己有能力。
> 无障碍功能选项可帮助玩家感觉自己有能力，而无需删除
> 代理感总是值得包括在内。培养能力的选项
> 无意义地破坏了核心体验。

### 可以调整什么

| 调整 | 方法 | 对经验的影响 | 权衡 |
|-----------|--------|---------------------|----------|
| [e.g., Enemy speed reduction] | [Difficulty setting / accessibility menu] | [Lowers execution difficulty without changing knowledge or decision requirements] | [Reduces the tension of combat timing; acceptable for narrative players] |
| [e.g., Extended input windows] | [Accessibility menu] | [Allows players with motor impairments to achieve the same skill outcomes with more time] | [Minimal — skill expression preserved, threshold relaxed] |
| [e.g., Hint frequency] | [Settings toggle] | [Surfaces contextual guidance more or less aggressively based on player preference] | [Higher hints reduce knowledge difficulty; players who want to discover organically may feel over-guided] |
| [Add option] | [Method] | [Effect] | [Tradeoff] |

### 哪些内容不能调整（以及原因）

| 固定元件 | 为什么它无法改变 | 设计推理 |
|--------------|---------------------|-----------------|
| [e.g., Permadeath in roguelike run] | [Removing it eliminates the resource pressure axis that all encounter balance is built around] | [The weight of each decision comes from permanence; without it, the core loop loses meaning] |
| [e.g., Core narrative pacing] | [Difficulty valleys are timed to story beats; adjustable pacing would decouple challenge from narrative intention] | [Story and difficulty are designed as one arc, not two independent tracks] |
| [Add fixed element] | [Why] | [Reasoning] |

---

## 跨系统难度交互

> **指南**：当两个系统同时运行时，它们的组合
> 困难往往大于各个部分的总和——或者有时
> 较少的。这些相互作用常常是无意的，并且仅在过程中浮现出来。
> 游戏测试。在此处记录预期的交互会创建一个清单
> 用于 QA 和游戏测试会议。
>
> “这是故意的吗？”是表示交互是一个设计功能。
> No表示应该缓解。Partial表示相互作用是
> 小剂量可以接受，但如果它成为主导，就会出现问题
> 经验。

| 系统A | 系统B | 综合效应 | 故意的？ |
|----------|----------|----------------|-----------|
| [Combat difficulty] | [Resource scarcity] | [Resource-poor players face combat encounters with fewer options, compounding difficulty for players already struggling. Can create a death spiral where failing creates worse conditions.] | [Partial — intended as stakes, not as a trap. Pity mechanics required to prevent unrecoverable states.] |
| [Build complexity] | [Time pressure] | [Players who are still learning their build take longer to make decisions under time pressure, increasing cognitive load beyond the intended challenge of either system alone.] | [No — reduce decision complexity demand in high time-pressure encounters.] |
| [New mechanic introduction] | [Resource pressure] | [Introducing a new system while the player is already under resource pressure forces them to learn and optimize simultaneously.] | [No — new mechanics should be introduced in low-resource-pressure environments.] |
| [Enemy density] | [Execution difficulty] | [High enemy counts with individually demanding enemies produce difficulty that scales exponentially, not linearly.] | [Partial — intended for optional challenge content only; not acceptable on the critical path.] |
| [Add System A] | [Add System B] | [Combined effect description] | [Yes / No / Partial] |

---

## 验证清单

> **指南**：这些检查点构建游戏测试会话以验证
> 难度曲线正在实现其目的。每一项都应检查
> 在标记为完成之前至少进行 3 个游戏测试会话。请注意
> 揭示问题的游戏测试者个人资料 - 难度问题几乎是
> 始终特定于玩家配置文件。

### 入职培训（0-30 分钟）
- [ ]没有任何类型经验的玩家无需外部帮助即可完成教程区域
- [ ]零玩家表示对前 5 分钟内应该做什么感到困惑
- [ ]至少一名游戏测试者在 15 分钟内自发地说“我想看看接下来会发生什么”
- [ ]第一次失败时刻会产生明显的学习反应（玩家说出出了什么问题）

### 早期游戏（30 分钟 - 2 小时）
- [ ]平均玩家在 60 分钟内达到第一个能力时刻
- [ ]平均 3-5 次尝试就能通过第一次重大遭遇（Boss 或同等级别）
- [ ]没有玩家引用了“太突然而没有警告”引入的机制
- [ ]玩家可以在没有提示的情况下描述他们当前的目标

### 游戏中期（2-10 小时）
- [ ]玩家通过有机游戏发现至少一种深度机制（无需指导）
- [ ]游戏测试会话报告“我想在下次运行中尝试不同的构建/策略”
- [ ]没有一个主题轴主导玩家抱怨——挫败感是分散的
- [ ]游戏中期失败的玩家无需被告知即可正确识别原因

### 游戏后期（10 小时以上）
- [ ]玩家表示最后的挑战感觉像是他们所学到的一切的顶峰
- [ ]游戏后期内容的失败并不感觉不公平（即使很难）
- [ ]完成主要内容的玩家表达了继续玩的理由

### 无障碍
- [ ]所有列出的无障碍功能选项都可以在不破坏遭遇意图的情况下发挥作用
- [ ]使用无障碍功能设置的玩家表示感觉自己很有能力，而不是被人欺负
- [ ]遇到并接受固定难度元素，而不会受到可访问性游戏测试人员的负面影响

---

## 开放性问题

| 问题 | 所有者 | 最后期限 | 解决 |
|----------|-------|----------|-----------|
| [Is the onboarding ramp correctly calibrated for players without prior genre experience?] | [game-designer] | [Date] | [Unresolved — schedule genre-naive playtester sessions] |
| [Does the first boss represent the correct difficulty spike or is it a wall?] | [game-designer, systems-designer] | [Date] | [Unresolved — requires 5+ playtester sessions to establish average attempt count] |
| [Do any cross-system interactions produce unrecoverable states?] | [systems-designer] | [Date] | [Unresolved — requires targeted playtest with resource-constrained starting conditions] |
| [Add question] | [Owner] | [Date] | [Resolution] |
