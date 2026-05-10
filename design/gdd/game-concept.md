# Game Concept: 数字连线 (Number Link)

*Created: 2026-05-10*
*Status: Draft*

---

## Elevator Pitch

> 一款纯逻辑益智连线游戏。在网格中按序连接数字节点，填满全部格子即可通关。零随机、零运气——每一关都是可解的确定性谜题。画线本身就是奖励。

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | 益智解谜 / 逻辑连线 |
| **Platform** | 微信小游戏 |
| **Target Audience** | 碎片时间玩家（等车、排队、蹲坑），成就型+探索型 |
| **Player Count** | 单人 |
| **Session Length** | 3-10 分钟（每关 1-3 分钟，一次 3-5 关） |
| **Monetization** | 广告变现（激励视频获得提示/复活），无内购 |
| **Estimated Scope** | 小（MVP 3 周 solo，Full Vision 5 周 solo） |
| **Comparable Titles** | Flow Free（1 亿+下载）、Numbrix、数字华容道 |

---

## Core Fantasy

"别人觉得乱的东西，我看得到秩序。"

玩家在看似杂乱无章的网格中，找到那条唯一的最优路径，一步一步把空白填满。每一次手指滑过屏幕都是一次"让世界变得整齐"的小胜利。

---

## Unique Hook

像 Flow Free 一样直觉上手（滑屏连线），但核心挑战来自**按序连接 + 填满所有格子**的组合约束。不是画任意路径，而是用最少的步数走出最优解。每一步都有"卡住了"和"灵光一现"的交替快感。

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics (What the player FEELS)

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Challenge** (obstacle course, mastery) | 1 | 50 关难度梯度，三星评分驱动重复挑战 |
| **Sensation** (sensory pleasure) | 2 | 划线咔嗒音效 + 填满格子的视觉满足 |
| **Submission** (relaxation, comfort zone) | 3 | 无时间压力，无惩罚，失败可立即重来 |
| **Discovery** (exploration, secrets) | 4 | 每关有多条路径，玩家发现自己的解法 |
| **Fantasy** (make-believe) | N/A | 无叙事需求 |
| **Narrative** (drama, story arc) | N/A | 无剧情 |
| **Fellowship** (social connection) | N/A | 无社交功能 |
| **Expression** (self-expression, creativity) | N/A | 无创造工具 |

### Key Dynamics (Emergent player behaviors)

- 玩家会在卡关时"倒推"——从终点往回找路径
- 获得三星后会产生"还能更优吗？"的自我挑战
- 玩完一关会自然想"再试一关"（一分钟一关的节奏）

### Core Mechanics (Systems we build)

1. **网格连线系统** — 滑屏操作在网格中绘制路径，按数字顺序连接节点
2. **步数计数与评分** — 每关记录步数，与最优解对比给出 1-3 星
3. **关卡选择与进度** — 解锁式关卡界面，本地存档
4. **提示系统** — 激励视频兑换提示（显示下一步最优方向）

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** (freedom, meaningful choice) | 每关多条可行路径，玩家自由选择解法 | Supporting |
| **Competence** (mastery, skill growth) | 难度曲线从 3x3 网格渐进到 10x10，三星评分验证成长 | Core |
| **Relatedness** (connection, belonging) | MVP 阶段无社交功能 | Minimal |

### Player Type Appeal (Bartle Taxonomy)

- [x] **Achievers** (目标完成，收集，进度) — How: 50 关解锁 + 三星全收集
- [x] **Explorers** (发现，理解系统，挖掘秘密) — How: 每关探索不同路径和最优解
- [ ] **Socializers** (关系，合作，社区) — MVP 不做
- [ ] **Killers/Competitors** (主导，PvP，排行榜) — 完整愿景版可加排行榜

### Flow State Design

- **Onboarding curve**: 前 5 关用 3x3-4x4 网格教学，6 岁可解
- **Difficulty scaling**: 网格扩大 + 数字增多 + 障碍格引入
- **Feedback clarity**: 划线即时动画 + 完成音效 + 星级结算明确
- **Recovery from failure**: 一键撤销，无惩罚，可无限重试

---

## Core Loop

### Moment-to-Moment (30 seconds)
扫描网格 → 锁定下一个数字位置 → 手指滑屏画出路径 → 格子逐个点亮（咔嗒反馈）→ 抵达目标数字 → 锁定该路径 → 找到下一个数字

### Short-Term (1-3 minutes)
完成一关的全部数字连线 → 看到满屏格子被填满 → 结算星级评分

### Session-Level (5-10 minutes)
完成 3-5 关 → 检查新的关卡解锁 → 可能重玩旧关刷三星

### Long-Term Progression
解锁从简单到复杂的全部 50 关（MVP）→ 后期关卡加入障碍格和额外约束 → 全三星达成

### Retention Hooks
- **Curiosity**: 新关卡解锁，"下一关长什么样？"
- **Mastery**: 已过关刷三星，追求最优解
- **Investment**: 进度存档，不想丢失已解锁关卡

---

## Game Pillars

### Pillar 1: 纯逻辑，零运气

每道谜题都有确定的唯一最优解。不需要猜，不需要赌，不依赖随机生成。

*Design test*: 「如果我们纠结于加随机元素还是加确定性规则，此支柱说选后者。」

### Pillar 2: 一分钟一关

每关 1-3 分钟可解，适配微信碎片化场景——等车、排队、蹲坑的时间够玩一关。

*Design test*: 「如果测试中一关超过 5 分钟解不出，就拆成两关。」

### Pillar 3: 划线本身就是奖励

手指滑过网格的音效+动画让每一条线都有"填满了！"的快感。核心操作的触觉满足感必须一流。

*Design test*: 「如果某个机制不增强划线的触觉满足感，就不加。」

### Pillar 4: 越简单越好

每个视觉元素必须证明自己的存在价值。去掉它游戏还能玩？那就去掉。

*Design test*: 「能用色块不用图标，能用图标不用文字，能用文字不用动画。」

### Anti-Pillars (What This Game Is NOT)

- **不做叙事/剧情** — 会拖累"一分钟一关"的快节奏，违背 Pillar 2
- **不做社交对战/PvP** — 纯逻辑挑战不需要竞争压力
- **不做复杂动画和特效** — 违反 Pillar 4，增加包体和开发周期
- **不做内购消费系统** — MVP 纯广告变现，不设计数值付费

---

## Visual Identity Anchor

- **视觉方向**: 极简几何风 (Minimalist Geometric)
- **视觉规则**: 几何形状 + 数字 + 明确颜色分区。没有角色，没有场景，没有多余装饰。
- **设计原则**:
  1. 背景纯色/微渐变，不做纹理
  2. 连线色与数字色一致，直觉对应
  3. 网格线 1px 细灰线，不抢视觉焦点
  4. 完成态格子用高亮饱和色填充，"填满了"的满足感
- **配色哲学**: 白底 + 6 种高对比色（用于不同数字的连线色），无障碍色板（色盲友好）

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| Flow Free | 滑屏连线核心玩法，网格填充满足感 | 按序连接 + 步数最优解评分，不是任意路径 | 验证连线玩法在大众市场可行（1 亿+下载） |
| 数独 | 纯逻辑、无随机、确定性解 | 空间连线代替数字填空，更直觉更视觉 | 验证纯逻辑 puzzle 有稳定忠实受众 |
| 箭了又箭 | 微信小游戏发行经验，激励视频变现 | 我们做连线不做箭头，三星评分驱动留存 | 验证 3-5 周开发周期可造进入 TOP100 的产品 |

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 18-45 |
| **Gaming experience** | 休闲玩家 (Casual) |
| **Time availability** | 碎片时间：3-10 分钟/次，日均 1-3 次 |
| **Platform preference** | 微信小游戏（无需下载，即点即玩） |
| **Current games they play** | 羊了个羊、欢乐斗地主、跳一跳 |
| **What they're looking for** | 短时动脑、不费眼、有成就感的小挑战 |
| **What would turn them away** | 强制看广告、太难第一关就卡住、需要注册登录 |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | Cocos Creator 3.x（TypeScript） |
| **Key Technical Challenges** | 关卡路径验证算法、AI 关卡生成质量、划线手感调优 |
| **Art Style** | 极简 2D 几何风 |
| **Art Pipeline Complexity** | 极低（无角色/场景，仅色块 + 数字 + 网格线） |
| **Audio Needs** | 极简（连线音效 + 完成音效 + 背景白噪音，单文件 <500KB） |
| **Networking** | 无（完整愿景版加排行榜时需要） |
| **Content Volume** | MVP 50 关，Full Vision 150 关 + 每日挑战 |
| **Procedural Systems** | AI 辅助关卡生成（后期） |

---

## Risks and Open Questions

### Design Risks
- **核心循环太"干"** — 纯逻辑无随机可能导致部分玩家觉得闷 → 缓解：重点打磨音效+动画，让操作本身有 ASMR 感
- **难度曲线失控** — 从简单到难的跳跃太大导致玩家中途流失 → 缓解：前 20 关手工设计做教学，难度分析后再批量生成

### Technical Risks
- **划线操作在微信端的响应延迟** — 滑屏手感可能不如原生 App → 缓解：第一周做触控原型验证
- **AI 关卡生成质量不可控** — 生成关卡可能无解或有多解 → 缓解：每个 AI 关卡必须通过求解器验证

### Market Risks
- **头部箭头解谜挤压注意力** — 市场已被《箭了又箭》等占据 → 缓解：按序连线机制与箭头解谜有本质差异，定位"纯逻辑"赛道
- **纯广告变现收入不确定** — 轻量级游戏广告 eCPM 相对低 → 缓解：三星评分系统拉升留存 → 提升广告展示频次

### Scope Risks
- **50 关手工设计耗时长** — 可能超过 3 周预算 → 缓解：前 20 关手工，后 30 关 AI 生成+人工校验

### Open Questions
- 微信小游戏 Canvas 上划线操作的帧率能否稳定 60fps？→ 第一周原型验证
- AI 关卡生成使用什么算法？→ 研究网格填充算法 (backtracking + heuristics)
- 激励视频广告接入需要哪些微信 API？→ wechat-platform-specialist 调研

---

## MVP Definition

**Core hypothesis**: 玩家在碎片时间（1-3 分钟）里会被按序连线 + 最优步数评分的纯逻辑循环吸引，产生"再玩一关"的持续动力。

**Required for MVP**:
1. 50 关（前 20 关手工设计 + 后 30 关 AI 生成）
2. 滑屏划线操作（支持撤销）
3. 步数计数 + 三星评分系统
4. 关卡选择界面（解锁式）
5. 关卡数据本地存储（进度/星级）
6. 激励视频提示系统（看广告获取下一步提示）

**Explicitly NOT in MVP** (defer to later):
- 关卡编辑器
- 每日挑战模式
- 微信排行榜/好友对战
- 主题皮肤系统
- 音效包/背景音乐选择

### Scope Tiers

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **MVP** | 50 关 | 核心连线 + 评分 + 提示 + 存档 | 3 周 |
| **Vertical Slice** | 80 关 | MVP + 每日挑战 + 关卡 AI 生成器 | +1.5 周 |
| **Full Vision** | 150 关 | VS + 排行榜 + 关卡编辑器 + 主题皮肤 | +2.5 周 |

---

## Next Steps

- [ ] Run `/setup-engine` 配置 Cocos Creator 引擎并生成版本参考文档
- [ ] Run `/design-review design/gdd/game-concept.md` 验证概念完整性
- [ ] Run `/map-systems` 将概念拆解为各子系统并排序
- [ ] Run `/design-system [first-system]` 按依赖顺序撰写各系统 GDD
- [ ] Run `/create-architecture` 产出架构蓝图和 ADR 清单
- [ ] Run `/gate-check concept` 验证概念阶段门禁
- [ ] Run `/prototype 核心连线操作` 验证划线手感和核心循环
- [ ] Run `/sprint-plan new` 规划第一个 Sprint
