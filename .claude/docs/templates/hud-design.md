# HUD 设计：[Game Name]

> **状态**：Draft|In Review|Approved|Implemented
> **作者**：[Name or agent — e.g., ui-designer]
> **最后更新**：[Date]
> **游戏**：[Game name — this is a single document per game, not per element]
> **平台目标**：[All platforms this HUD must work on — e.g., PC, PS5, Xbox Series X, Steam Deck]
> **相关GDD**：[Every system that exposes information through the HUD — e.g., `design/gdd/combat.md`, `design/gdd/progression.md`, `design/gdd/quests.md`]
> **辅助功能等级**：Basic|Standard|Comprehensive|Exemplary
> **款式参考**：[Link to art bible HUD section if it exists — e.g., `design/art/art-bible.md § HUD Visual Language`]

> **注意 - 范围边界**：本文档指定了覆盖范围的所有元素
> 活跃游戏过程中的游戏世界 - 生命条、弹药计数器、小地图、任务
> 跟踪器、字幕、损坏数字和通知 toast。对于菜单屏幕，
> 暂停玩家明确导航的菜单、库存和对话框，使用
> `ux-spec.md`代替。测试：当玩家直接
> 控制他们的性格，它属于这里。

---

## 1.HUD理念

> **为什么此部分存在**：HUD 设计理念不是装饰 - 它是
> 衡量每个后续决策的设计约束。没有一个
> 理念，根据要求添加各个元素（“任务跟踪器想要一个
> 更大的图标”），没有任何原则性的方式来反击。有了哲学，就有了
> 共享的、明确的标准。更重要的是，这一理念可以防止 HUD
> 慢慢地增长以覆盖游戏世界，而每个单独的添加似乎
> 孤立地看是合理的。在指定任何元素之前写入此内容。

**这个游戏与屏幕信息有什么关系？**

[一段。这是设计声明，而不是功能描述。考虑
游戏的类型、节奏和玩家的幻想。潜行游戏的 HUD 哲学可能
be：“世界就是界面。如果玩家必须将视线从环境上移开
为了生存，HUD失败了。” 战术游戏可能会说：“完全受虐化
意识就是游戏。HUD 不是覆盖层——它是战场。”

如果有帮助的话，请参考类似的游戏，但请描述您的具体立场：
示例 - 剧情优先的动作角色扮演游戏：“我们将屏幕信息视为一种让步，
不是一个功能。每个 HUD 元素必须通过回答以下问题来获得其像素空间：
如果没有这些信息可见，玩家会做出明显更糟糕的决定吗？
如果答案是‘它们会适应’，我们就会将其放入环境中。”]

**可见性原则**——当有疑问时，显示还是隐藏？

[说明不明确情况的默认解决方案。选项：
- 默认为隐藏：信息可追溯提供（e.g.，黑暗之魂 - 没有任务跟踪器，没有小地图，统计数据在菜单中）
- 默认为SHOW：玩家更喜欢被告知；混乱总比不确定好
- 默认为上下文：信息在变得相关时出现，在不相关时消失
大多数游戏都受益于上下文默认设置。清楚地说明游戏的默认设置，以便每个元素的决定都是一致的。]

**本游戏的必要性规则**：

[完成这句话：“HUD元素在______________时赢得了其位置。”

示例：“...玩家必须停止游戏才能找到相同的信息
在其他地方，或者如果没有它，就会做出更糟糕的决定。”

示例：“...在游戏测试中删除它会导致明显的挫败感或困惑
超过 25% 的测试者在游戏的第一个小时内就发现了这一点。”

该规则是对添加 HUD 元素的功能请求的否决权。记录下来
因此可以在设计评论中引用。]

---

## 2.信息架构

> **为什么此存在部分**：在指定任何HUD元素的视觉设计之前，
> 立场或行为，你必须回答一个更基本的问题：这应该吗？
> HUD上是否有信息？这部分是一个强制功能——它需要
> 您可以对游戏世界生成的每条信息进行分类并制作一个
> 关于如何呈现每个内容的明确、有意的决定。 “我们会解决这个问题
> 后来”就是游戏最终如何以 18 个元素争夺玩家的外围设备
> 想象。这个表是游戏信息的总盘点，而不仅仅是HUD信息。

| 信息类型 | 始终显示 | 上下文（相关时显示） | 点播 (menu/button) | 隐藏（环境/饮食） | 推理 |
|-----------------|-------------|--------------------------------|------------------------|----------------------------------|-----------|
| [Health / Vitality] | [X if action game — player needs constant awareness] | [X if exploration game — show only when injured] | [ ] | [ ] | [Example: always visible because health decisions (retreat, heal) must be instant in combat] |
| [Primary resource (mana / stamina / ammo)] | [ ] | [X — show when resource is being consumed or is critically low] | [ ] | [ ] | [Example: contextual because stable resource levels are not decision-relevant] |
| [Secondary resource (currency / materials)] | [ ] | [ ] | [X — check in inventory] | [ ] | [Example: on-demand because resource totals don't affect immediate gameplay decisions] |
| [Minimap / Compass] | [X] | [ ] | [ ] | [ ] | [Example: always visible because navigation decisions are constant during exploration] |
| [Quest objective] | [ ] | [X — show when objective changes or player is near it] | [ ] | [ ] | [Example: contextual — player knows their objective; only remind at key moments] |
| [Enemy health bar] | [ ] | [X — show only during combat encounters] | [ ] | [ ] | [Example: contextual because enemy health is irrelevant outside combat] |
| [Status effects (buffs/debuffs)] | [ ] | [X — show when active] | [ ] | [ ] | [Example: contextual because status effects only affect decisions when present] |
| [Dialogue subtitles] | [X when dialogue is playing] | [ ] | [ ] | [ ] | [Example: always show while dialogue is active — accessibility requirement] |
| [Combo / streak counter] | [ ] | [X — show while combo is active, hide on reset] | [ ] | [ ] | [Example: contextual because it communicates active performance, not baseline state] |
| [Timer] | [ ] | [X — show only in timed sequences] | [ ] | [ ] | [Example: contextual because timers only exist in specific encounter types] |
| [Tutorial prompts] | [ ] | [X — show for first-time situations only] | [ ] | [ ] | [Example: contextual and one-time; never repeat to experienced players] |
| [Score / points] | [ ] | [X — show in score-relevant modes only] | [ ] | [ ] | [Example: contextual by game mode; hidden in modes where score is irrelevant] |
| [XP / level progress] | [ ] | [ ] | [X — available via character screen] | [ ] | [Example: on-demand because progression does not affect in-moment gameplay decisions] |
| [Waypoint / objective marker] | [ ] | [X — show when player is navigating to objective] | [ ] | [ ] | [Example: contextual — suppress during cutscenes, cinematic moments, and free exploration] |

---

## 3. 布局区域

> **为什么此部分存在**：游戏世界是主要内容 - HUD 是
> 围绕它的框架。在放置任何元素之前，将屏幕划分为命名区域
> 具有明确的头寸和安全区边际。此部分可防止两种故障
> 模式：(1) 临时放置元素，直到屏幕变得混乱，以及 (2) 元素
> 与平台所需的安全区域重叠并在认证中被拒绝。
> 第 4 节中的每个元素都必须分配到此处定义的区域。

### 3.1 区域图

```
[Draw your HUD layout zones. Customize this to match your game's actual layout.
 Axes represent approximate screen percentage. Adjust zone names and sizes.]

 0%                                             100%
 ┌──────────────────────────────────────────────────┐  0%
 │  [SAFE MARGIN — 10% from edge on all sides]      │
 │  ┌────────────────────────────────────────────┐  │
 │  │ [TOP-LEFT]              [TOP-CENTER]  [TOP-RIGHT] │  ~15%
 │  │  Health, resource       Quest name    Ammo, magazine │
 │  │                                              │  │
 │  │                                              │  │
 │  │               [CENTER-SCREEN]               │  │  ~50%
 │  │                Crosshair / reticle           │  │
 │  │               (minimize HUD here)            │  │
 │  │                                              │  │
 │  │                                              │  │
 │  │ [BOTTOM-LEFT]     [BOTTOM-CENTER]   [BOTTOM-RIGHT] │  ~85%
 │  │  Minimap          Subtitles          Notifications │
 │  │  Ability icons    Tutorial prompts             │  │
 │  └────────────────────────────────────────────┘  │
 │                                                  │
 └──────────────────────────────────────────────────┘  100%
```

> 区域放置规则：屏幕中心 40%（水平和水平方向）
> 垂直）是玩家的主要关注区域。保持该区域尽可能清晰
> 任何时候都可能。出现在中心区域的 HUD 元素 — 十字准线，
> 交互提示、点击标记——必须最少、高对比度和简短。

### 3.2 区域规格表

| 区域名称 | 屏幕位置 | 符合安全区标准 | 主要元素 | 最大同时元素数 | 笔记 |
|-----------|----------------|---------------------|-----------------|--------------------------|-------|
| [Top Left] | [Top-left corner, within safe margin] | [Yes — 10% from top, 10% from left] | [Health bar, stamina bar, shield bar] | [3] | [Vital status — player's own resources. Priority zone for player state.] |
| [Top Center] | [Top edge, centered horizontally] | [Yes — 10% from top] | [Quest objective, area name (on enter)] | [1 — only one message at a time] | [Use for narrative context, not mechanical information. Keep text minimal.] |
| [Top Right] | [Top-right corner, within safe margin] | [Yes — 10% from top, 10% from right] | [Ammo count, ability cooldowns] | [2] | [Weapon/ability state. Most relevant during active combat.] |
| [Center] | [Screen center ±15%] | [N/A — not a margin zone] | [Crosshair, interaction prompt, hit marker] | [1 active at a time] | [CRITICAL: Nothing persistent here. Only momentary indicators.] |
| [Bottom Left] | [Bottom-left corner, within safe margin] | [Yes — 10% from bottom, 10% from left] | [Minimap, ability icons] | [2] | [Navigation and ability readout. Small, non-intrusive.] |
| [Bottom Center] | [Bottom edge, centered horizontally] | [Yes — 10% from bottom] | [Subtitles, tutorial prompts] | [2 — subtitle + tutorial may coexist] | [Highest-priority accessibility zone. Never place other elements here.] |
| [Bottom Right] | [Bottom-right corner, within safe margin] | [Yes — 10% from bottom, 10% from right] | [Notification toasts, pick-up feedback] | [3 stacked] | [Transient notifications. Stack vertically. Oldest disappears first.] |

**按平台划分的安全区边际**：

| 平台 | 顶部 | 底部 | 左边 | 正确的 | 笔记 |
|----------|-----|--------|------|-------|-------|
| [PC — windowed] | [0% — no safe zone required] | [0%] | [0%] | [0%] | [But respect minimum resolution — elements must not crowd at 1280x720] |
| [PC — fullscreen] | [3%] | [3%] | [3%] | [3%] | [Slight margin for 4K TV-connected PCs] |
| [Console — TV] | [10%] | [10%] | [10%] | [10%] | [Action-safe zone for broadcast-spec TVs. Some TVs overscan beyond this.] |
| [Steam Deck] | [5%] | [5%] | [5%] | [5%] | [Small screen; safe zone is smaller but crowding risk is higher] |
| [Mobile — portrait] | [15% top] | [10% bottom] | [5%] | [5%] | [15% top avoids notch/camera cutout on most devices] |
| [Mobile — landscape] | [5%] | [5%] | [15% left] | [15% right] | [Thumb placement on landscape — side zones are obscured by hands] |

---

## 4. HUD 元件规格

> **为什么存在此部分**：每个 HUD 元素都需要有自己的规范
> 正确构建。 HUD 元素的临时实施会产生不一致的情况
> 大小、更新频率不匹配、缺少紧急状态和可访问性
> 失败。本节是每个元素的实施简介 - 填写它
> 完全在任何元素进入开发之前。

### 4.1 元素概览表

> 每个 HUD 元素一行。这是实施计划的主清单。

| 元素名称 | 区 | 始终可见 | 可见性触发器 | 数据来源 | 更新频率 | 最大尺寸（% 屏幕宽度） | 最小可读尺寸 | 重叠优先级 | 辅助功能替代 |
|-------------|------|---------------|-------------------|-------------|-----------------|----------------------|------------------|-----------------|------------------|
| [Health Bar] | [Top Left] | [Yes] | [N/A] | [PlayerStats] | [On value change] | [20%] | [120px wide] | [1 — highest] | [Numerical text label showing current/max: "80/100"] |
| [Stamina Bar] | [Top Left] | [No — context] | [Show when consuming stamina; hide 3s after full] | [PlayerStats] | [Realtime during use] | [15%] | [80px wide] | [2] | [Numerical label, or hide if full (accessible assumption)] |
| [Shield Indicator] | [Top Left] | [No — context] | [Show when shield is active or recently hit] | [PlayerStats] | [On value change] | [20%] | [120px wide] | [3] | [Numerical label. Must not use color alone — add shield icon.] |
| [Ammo Counter] | [Top Right] | [No — context] | [Show when weapon is equipped; hide when unarmed] | [WeaponSystem] | [On fire / on reload] | [10%] | ["88/888" readable at game's min resolution] | [4] | [Text-only fallback: "32 / 120"] |
| [Minimap] | [Bottom Left] | [Yes] | [N/A — but suppressed in cinematic mode] | [NavigationSystem] | [Realtime] | [18%] | [150x150px] | [5] | [Cardinal direction compass strip as fallback; must be toggleable] |
| [Quest Objective] | [Top Center] | [No — context] | [Show on objective change; show when near objective location; hide after 5s] | [QuestSystem] | [On event] | [30%] | [Legible at body text size] | [6] | [Read aloud on objective change via screen reader] |
| [Crosshair] | [Center] | [No — context] | [Show when ranged weapon equipped; hide in melee or unarmed] | [WeaponSystem / AimSystem] | [Realtime] | [3%] | [12px diameter minimum] | [1 — center zone priority] | [Reduce motion: static crosshair only. Option to enlarge.] |
| [Interaction Prompt] | [Center] | [No — context] | [Show when player is within interaction range of an interactive object] | [InteractionSystem] | [On enter/exit interaction range] | [15%] | [24px icon + readable text] | [2 — center zone] | [Text description of interaction always present, not icon-only] |
| [Subtitles] | [Bottom Center] | [No — always on when dialogue plays, if setting enabled] | [Show during any voiced line or ambient dialogue] | [DialogueSystem] | [Per dialogue line] | [60%] | [Minimum 24px font] | [1 — highest in zone] | [This IS the accessibility feature — see Section 8 for subtitle spec] |
| [Damage Numbers] | [World-space / anchored to entity] | [No — context] | [Show on any damage event; duration 800ms] | [CombatSystem] | [On event] | [5% per number] | [18px minimum] | [3] | [Option to disable; numbers can overwhelm for photosensitive players] |
| [Status Effect Icons] | [Top Left — below health bar] | [No — context] | [Show when any status effect is active on player] | [StatusSystem] | [On effect add/remove] | [3% per icon] | [24px per icon] | [3] | [Icon + text label on hover/focus. Never icon-only.] |
| [Notification Toast] | [Bottom Right] | [No — event-driven] | [On loot, XP gain, achievement, quest update] | [Multiple — see Section 6] | [On event] | [25%] | [Legible at body text size] | [7 — lowest] | [Queued; never overlapping. Read by screen reader if subtitle mode on.] |

### 4.2 元素细节块

> 对于上表中的每个元素，编写一个详细信息块。复制并完成
> 每个元素一个块。

---

**健康栏**

- 城市描述：[Horizontal fill bar. Left-to-right fill direction. Segmented at 25/50/75% to aid reading at a glance. Background: dark semi-transparent (40% opacity). Fill color: context-dependent — see Urgency States.]
- 显示数据：[Current HP as fill percentage. Numerical value displayed as text below bar at all times: "80 / 100".]
- 更新行为：[Bar fill decreases or increases smoothly using a lerp over 150ms per change. Large damage (>25% single hit) triggers a brief flash (1 frame white, then drain).]
- 紧急状态：
  - 正常（>50% HP）：[Green fill, no special behavior]
  - 注意（25–50% HP）：[Yellow fill, low warning pulse every 4 seconds]
  - 严重（<25% HP）：[Red fill, persistent slow pulse (1 Hz), vignette appears at screen edges]
  - 零（0%生命值）：[Bar empties and turns grey; death state begins]
- 互动：[Display only. Not interactive. Player cannot click, hover, or focus this element as an action target.]
- 播放器定制：[Opacity adjustable (see Section 7 Tuning Knobs). Can be repositioned to any corner by player in accessibility settings.]

---

**小地图**

- 城市描述：[Circular mask, radius = 75px at reference resolution 1920x1080. Player icon at center. North always up unless player has unlocked "Rotate minimap" setting. Range = configurable, default 80 world units radius.]
- 显示数据：[Player position, nearby enemies (if detection perk unlocked), quest markers within range, points of interest icons, traversal obstacles (walls, drops).]
- 更新行为：[Realtime. Updates every frame. Enemy icons fade in/out as they enter/leave detection range over 300ms.]
- 紧急状态：[None for the map itself. Enemy icons turn red when they are in combat-alert state.]
- 互动：[Not interactive in-game. Press dedicated Map button to open the full map screen (separate UX spec).]
- 播放器定制：[Size: S/M/L (70/90/110px radius). Opacity: 30–100%. Rotation: locked-north or player-relative. Can be disabled entirely (compass strip shows as fallback).]

---

**[Repeat this block for every element in Section 4.1]**

---

## 5. HUD 状态（按游戏环境）

> **为什么此部分存在**：HUD 不是静态覆盖 - 它是动态的
> 系统必须适应玩家正在做的事情。 HUD 专为
> 标准游戏玩法在过场动画中看起来会是错误的，在探索中会感觉混乱，
> 并遮挡 Boss 战中的关键信息。本节定义了
> HUD 在每个游戏环境中都会经历转变。这也是规格
> 用于管理 HUD 可见性的系统 — HUD 状态机。

| 语境 | 显示的元素 | 隐藏元素 | 修改的元素 | 过渡到这种状态 |
|---------|---------------|-----------------|------------------|---------------------------|
| [Exploration — no threats] | [Minimap, Quest Objective (faded, 60%), Subtitles (if active)] | [Ammo Counter, Crosshair, Damage Numbers, Status Effects (if none active)] | [Health Bar fades to 40% opacity — visible but not dominant] | [Fade transition, 500ms, when no enemies detected for 10s] |
| [Combat — active threat] | [Health Bar (full opacity), Stamina Bar (when used), Ammo Counter, Crosshair, Damage Numbers, Status Effects, Enemy Health Bars] | [Quest Objective (temporarily hidden), Notification Toasts (paused queue)] | [Minimap scales down 15% and raises opacity to 100%] | [Immediate snap in on first enemy detection — no fade. Combat readiness requires instant info.] |
| [Dialogue / Cutscene] | [Subtitles, Dialogue speaker name] | [All gameplay HUD elements: health, ammo, minimap, crosshair, damage numbers] | [N/A] | [All gameplay elements fade out over 300ms when cutscene flag is set] |
| [Cinematic (scripted camera sequence)] | [Subtitles only] | [Everything else including speaker name] | [Letterbox bars appear (if applicable to this game's style)] | [Immediate on cinematic flag; letterbox slides in from top/bottom over 400ms] |
| [Inventory / Menu open] | [None — inventory renders full-screen or as overlay] | [All HUD elements] | [Game world visible but paused behind inventory screen] | [All HUD elements hide over 150ms as menu opens] |
| [Death / Respawn pending] | [Death screen overlay — separate spec] | [All gameplay HUD elements] | [Screen desaturates and darkens over 800ms] | [Death state begins when HP reaches 0 — HUD elements fade over 600ms] |
| [Loading / Transition] | [Loading indicator, tip text] | [All gameplay HUD elements] | [N/A] | [Instant on level transition trigger] |
| [Tutorial — new mechanic] | [Standard context HUD + Tutorial Prompt overlay] | [Nothing additional hidden] | [Tutorial prompt dims background subtly to draw attention to prompt] | [Tutorial system fires ShowTutorial event; prompt fades in over 200ms] |
| [Boss Encounter] | [Boss health bar appears (large, bottom of screen or top center), all combat elements] | [Quest Objective] | [Boss bar renders in a distinct visual style — must not be confused with player health] | [Boss health bar slides in on boss encounter trigger over 400ms] |

---

## 6. 信息层次结构

> **为什么存在此部分**：并非所有 HUD 信息都同样重要。什么时候
> 当玩家承受高压力或元素时，屏幕空间有限
> 争夺同一个区域，必须有一个原则性的优先顺序来支配
> 哪些元素存活下来，哪些元素受到抑制。本节正式规定
> 层次结构，以便可以系统地执行，而不仅仅是“感觉显而易见”的决定
> 实施时制定的。

| 元素 | 优先级 | 推理 | 如果隐藏的话用什么代替 |
|---------|--------------|-----------|---------------------------|
| [Subtitles] | [MUST KEEP — never hide during dialogue] | [Accessibility requirement. Legal requirement in some markets. Story clarity.] | [N/A — nothing replaces subtitles] |
| [Health Bar] | [MUST KEEP — during any state where the player can be damaged] | [Without health visibility, survival decisions become impossible] | [Auditory cues (heartbeat, breathing) supplement but do not replace] |
| [Crosshair] | [MUST KEEP — while aiming with a ranged weapon] | [Targeting without a crosshair is a precision failure, not a difficulty feature] | [Alternative: dot-only mode for minimalists; never fully hidden while aiming] |
| [Interaction Prompt] | [MUST KEEP — when player is in interaction range] | [Without it, interactive objects are invisible to the player] | [Environmental visual cues can supplement but interaction affordance must be explicit] |
| [Ammo Counter] | [SHOULD KEEP] | [Low ammo decisions (switch weapon, reload) require awareness; can be contextual] | [Auditory "click" on empty chamber is acceptable fallback for experienced players] |
| [Minimap] | [SHOULD KEEP] | [Navigation requires spatial awareness; loss forces repeated map opens] | [Compass strip (simplified directional indicator) is acceptable fallback] |
| [Status Effects] | [SHOULD KEEP — while active] | [Active debuffs change what actions are viable; invisible debuffs feel unfair] | [Character animation states can partially communicate status effects (limping, sparks)] |
| [Quest Objective] | [CAN HIDE] | [Player can hold objective in memory for extended periods; contextual is correct default] | [Player remembers objective from context] |
| [Damage Numbers] | [CAN HIDE] | [Feedback element, not decision-critical. Many players turn these off.] | [Hit sounds and enemy reactions communicate hit registration] |
| [Notification Toasts] | [CAN HIDE in high-intensity moments] | [Mid-combat "You gained 50 XP" is noise, not signal. Queue and show after combat.] | [Queue held and released when combat ends] |
| [Combo Counter] | [ALWAYS HIDE when combo resets or player is not attacking] | [Stale combo information is actively misleading] | [N/A — simply hidden] |

---

## 7. 视觉预算

> **为什么存在此部分**：没有明确的预算限制，HUD 元素
> 积累直到游戏世界几乎看不见。这些数字是硬性限制，
> 不是指导方针。每个会违反限制的元素添加都需要明确
> 批准，并且必须取代或减少现有元素。

| 预算限制 | 限制 | 测量方法 | 当前估计 | 地位 |
|------------------|-------|--------------------|-----------------|--------|
| 最大同时活动 HUD 元素数 | [8] | [Count all visible, non-faded elements at any one frame] | [TBD — verify at implementation] | [To verify] |
| HUD 屏幕的最大百分比（探索模式） | [12%] | [Pixel area of all HUD elements / total screen pixels] | [TBD] | [To verify] |
| HUD 屏幕的最大百分比（战斗模式） | [22%] | [Same method — combat adds ammo, crosshair, enemy bars] | [TBD] | [To verify] |
| 中心屏幕区域的最大占用比例（屏幕W/H的40%） | [5%] | [Only crosshair and interaction prompt allowed here] | [TBD] | [To verify] |
| 最小化解决方案 — HUD 的任何背景文本 | [4.5:1 (WCAG AA)] | [Measured against the darkest and lightest game world areas the element will appear over] | [TBD] | [To verify] |
| HUD 背景面板的最大不透明度 | [65%] | [Opacity of any panel behind HUD text — must preserve world visibility through panel] | [TBD] | [To verify] |
| 支持的最小分辨率下的最小 HUD 元素大小 | [40px for icons, 18px for text] | [Measure at lowest target resolution] | [TBD] | [To verify] |

> **如何应用这些预算**：对于期间提出的每个新的 HUD 元素
> 生产，要求提案者说明（1）它影响哪个预算线，
> (2) 新的总数是多少，以及 (3) 现有的元素将减少或
> 结合实际情况以保持在预算范围内。 “这是一个小图标”并不是分析。

---

## 8. 反馈和通知系统

> **为什么存在此部分**：通知是最常添加和使用的
> 大多数 HUD 中控制最差的部分。每个系统都想告诉玩家
> 某物。没有关于通知优先级、堆叠限制的明确规则，
> 和队列行为，通知区域成为重叠的消防水带
> 玩家学会完全忽略的祝酒词。本节规定
> 所有系统的通知合同。

| 通知类型 | 触发系统 | 屏幕位置 | 持续时间（毫秒） | 动画输入/输出 | 最大同时数 | 优先事项 | 队列行为 | 可驳回吗？ |
|------------------|---------------|-----------------|--------------|-------------------|-----------------|----------|---------------|-------------|
| [Item Pickup] | [InventorySystem] | [Bottom Right — toast] | [2000] | [Slide in from right 200ms / fade out 300ms] | [3 stacked] | [Low] | [FIFO queue; older toasts pushed up as new ones enter] | [No — auto-dismiss] |
| [XP Gain] | [ProgressionSystem] | [Bottom Right — toast, below item toasts] | [1500] | [Fade in 150ms / fade out 300ms] | [1 — XP messages merge: "XP +150"] | [Very Low — suppress during combat, queue for post-combat] | [Combat-aware queue] | [No] |
| [Level Up] | [ProgressionSystem] | [Center screen — persistent until dismissed] | [Persistent — requires input to dismiss] | [Scale up from 80% + fade in 400ms] | [1] | [High — interrupts normal toasts] | [Pauses all other notifications until dismissed] | [Yes — any input] |
| [Quest Update] | [QuestSystem] | [Top Center] | [4000] | [Slide down from top 250ms / fade out 400ms] | [1 — top center is single-message zone] | [Medium] | [If quest update arrives while previous is visible, extend duration by 2000ms; do not stack] | [No] |
| [Objective Complete] | [QuestSystem] | [Top Center] | [3000] | [Same as Quest Update but with additional completion sound] | [1] | [Medium-High — preempts Quest Update] | [Preempts any queued top-center message] | [No] |
| [Critical Warning (low health, hazard)] | [CombatSystem / EnvironmentSystem] | [Screen edge vignette + text at center-bottom] | [Persistent while condition active] | [Fade in 200ms; fades out 500ms when condition clears] | [1 per warning type] | [Critical — never suppressed] | [Renders immediately, bypasses all queues] | [No] |
| [Achievement Unlocked] | [AchievementSystem] | [Bottom Right — distinct from item toasts] | [4000] | [Slide in from right with icon expansion 300ms / fade out 400ms] | [1] | [Low] | [Queues behind item toasts; never more than one achievement toast at a time] | [No] |
| [Hint / Tutorial] | [TutorialSystem] | [Bottom Center] | [Persistent — until player performs the action or dismisses] | [Fade in 300ms] | [1] | [Medium] | [Only one tutorial hint at a time; queue others] | [Yes — B button / Esc] |

**通知队列规则**：
1. 战斗感知队列：当玩家处于战斗状态时，标记为Low优先级的通知将排队，而不是显示。当玩家退出战斗时，队列会被批量刷新，最多按顺序显示 3 个项目。
2. 合并规则：在 500 个内部触发的相同通知类型中将合并为具有组合值的单个通知（e.g., "Item Pickup x3" 而不是三个单独的 toast）。
3. 重要通知（健康警告、环境危害）永远不会排队、永远不会合并，并且无论战斗状态或现有通知如何，总是立即显示。

---

## 9. 平台适配

> **为什么存在此部分**：在显示器上以 1920x1080 设计的 HUD 可能是
> 在 4K 的 55 英寸电视上难以辨认，在 Steam Deck 上以 1280x720 的分辨率损坏，或隐藏
> 落后于移动设备。平台适配不是可选的发布后工作 -
> 这是一个必须在实施之前指定的设计要求，因此
> 架构从一开始就可以支持它。此处列出的每个平台都需要
> 认证前的显式布局测试。

| 平台 | 安全区 | 分辨率范围 | 输入法 | HUD 特定注释 |
|----------|-----------|-----------------|-------------|-------------------|
| [PC — Windows, 1920x1080 reference] | [3% margin] | [1280x720 min to 3840x2160 max] | [Mouse + keyboard, controller optional] | [HUD must scale correctly at all resolutions. Test at 1280x720 — minimum before cert. Consider ultrawide (21:9) — minimap must not stretch.] |
| [PC — Steam Deck, 1280x800] | [5% margin] | [Fixed 1280x800] | [Controller + touchscreen] | [Smaller screen means minimum text sizes are critical. Test ALL elements at this resolution. Touch targets irrelevant (controller-only by default).] |
| [PlayStation 5 / Xbox Series X] | [10% margin] | [1080p to 4K] | [Controller] | [Console certification requires TV safe zone compliance. Action-safe is 90% of screen area. Test on a real TV, not a monitor — overscan behavior differs.] |
| [Mobile — iOS / Android] | [15% top, 10% other sides] | [360x640 min to 414x896 common] | [Touch] | [Notch/camera cutout avoidance at top. Bottom home indicator zone avoidance. Portrait and landscape layouts may differ significantly — specify both.] |

**HUD 可重定位性要求**：玩家必须能够使用游戏内 HUD 布局编辑器至少重新定位以下元素（控制台上的辅助功能合规性所需）：
- 生命条
- 小地图
- 能力栏（如果有）

重新定位保存到玩家个人资料，而不是单个插槽。适用于各个游戏会话。

---

## 10. 辅助功能 — HUD 特定

> **为什么存在此部分**：HUD 可访问性失败是最明显的
> 游戏中的可访问性失败——玩家在每个会话中都会遇到HUD，
> 在每个游戏时刻。色盲失败，最小比例的文本难以辨认，
> 无法禁用分散注意力的动画是最重要的可访问性之一
> 游戏评论中的投诉。本节定义了 HUD 特定要求；参考
> 到项目的`docs/accessibility-requirements.md`确定完整的项目标准。

### 10.1 色盲模式

| 元素 | 仅颜色信息风险 | 色盲模式修复 |
|---------|----------------------------|---------------------|
| [Health bar fill] | [Red = low health uses red/green distinction] | [Add icon pulse + vignette as non-color indicators. Red fill is supplemental, not sole indicator.] |
| [Damage numbers] | [Red = taken, green = healed] | [Add minus (-) prefix for damage, plus (+) for healing. Symbols, not color.] |
| [Enemy health bars] | [If colored by faction or threat level] | [Add text label or icon badge for faction/threat level. Never color-only.] |
| [Status effect icons] | [If icon tint communicates status type] | [All status icons must have distinct shapes, not just distinct colors. Shape encodes meaning; color is secondary.] |
| [Minimap icons] | [If player vs. enemy vs. objective distinguished by color] | [Distinct icon shapes: circle = player, triangle = enemy, star = objective. Color supplements shape.] |

### 10.2 文本缩放

[描述当玩家将 UI 文本比例设置为 150%（您的辅助功能级别所需的顶点）时会发生什么情况。哪些元素会回流？剪辑哪些元素？哪些元素在架构上被阻止缩放（e.g.，固定大小的负载）？

示例：“健康栏数字标签随着文本比例而增长 - 栏会稍微扩大以适应。任务目标文本以 150% 比例换行 - 验证顶部中心区域可以容纳两行目标。伤害数字不缩放（它们是世界空间，而不是屏幕空间） - 这是此处记录的可接受的限制。”]

**文本缩放测试矩阵**：

| 元素 | 100%（基线） | 125% | 150% | 溢出行为 |
|---------|----------------|------|------|-------------------|
| [Health bar label] | [Pass] | [Pass] | [TBD] | [Bar expands; does not overlap stamina bar] |
| [Quest objective text] | [Pass] | [TBD] | [TBD] | [Wraps to second line; zone height expands] |
| [Notification toast text] | [Pass] | [TBD] | [TBD] | [Toast width expands to max 35% screen width, then wraps] |
| [Subtitle text] | [Pass] | [TBD] | [TBD] | [Dedicated subtitle zone — must accommodate scale] |

### 10.3 运动灵敏度

| 动画/运动元素 | 严重性 | 被减少运动设置禁用？ | 更换行为 |
|---------------------------|----------|-------------------------------------|---------------------|
| [Health bar low-HP pulse] | [Mild] | [Yes] | [Solid fill, no pulse. Vignette remains as it is less likely to trigger sensitivity.] |
| [Screen edge vignette] | [Moderate] | [Optional — separate toggle] | [Replace with static darkened corners at 30% opacity] |
| [Damage numbers float upward] | [Mild] | [Yes] | [Instant appear/disappear in place, no float] |
| [Notification toast slide-in] | [Mild] | [Yes] | [Instant appear at final position] |
| [Level up center animation] | [High] | [Yes — required] | [Static level up card, no scale animation, no particle effects] |
| [Combo counter scale pulse] | [Mild] | [Yes] | [Number increments without scale animation] |

### 10.4 字幕规范

> 字幕是 HUD 中影响最大的辅助功能。指定它们
> 与 HUD 的其他部分一样严格。不要将字幕行为留给
> 执行自由裁量权。

- **默认设置**：[ON or OFF — document your game's default and the rationale. Industry standard is ON by default.]
- **位置**：底部中心区域，水平居中，位于底部安全区域边缘上方
- **每行最大字符数**：[42 characters — the readable limit for subtitle lines at minimum text size on TV viewing distance]
- **最大同时线路**：[2 lines before scrolling — do not display more than 2 lines at once]
- **说话人**身份：[Speaker name displayed in color or above subtitle text — never rely on color alone; add colon prefix: "ARIA: The door is locked."]
- **背景**：[Semi-transparent black panel, 70% opacity, behind all subtitle text — ensures contrast against any game world background]
- **最小字体大小**：[24px at 1080p reference — scales with text scale setting]
- **换行行为**：[Break at natural language pause points — before conjunctions, after commas, never mid-word]
- **字幕持久性**：[Each subtitle line holds for the duration of the spoken line plus 300ms after it ends — never disappear while audio is still playing]
- **非对话字幕**：[Document whether ambient sounds, music descriptions, and sound effects are captioned — e.g., "[tense music]"、"[explosion in the distance]" — 以及这些字幕与对话字幕不同时出现的位置]

### 10.5 HUD 不透明度和可见性控制

必须从“辅助功能”菜单中提供以下播放器可调整的设置：

| 环境 | 范围 | 默认 | 影响 |
|---------|-------|---------|--------|
| [HUD Opacity — Global] | [0% (HUD hidden) to 100%] | [100%] | [Scales all HUD element opacities simultaneously] |
| [HUD Text Scale] | [75% to 150%] | [100%] | [Scales all HUD text elements; layout adapts] |
| [Damage Number Visibility] | [On / Off] | [On] | [Enables or disables all floating damage numbers] |
| [Minimap Visibility] | [On / Off / Compass Only] | [On] | [Compass strip shown as fallback when minimap off] |
| [Notification Verbosity] | [All / Important Only / Off] | [All] | [All = all toasts; Important Only = quest + level up; Off = no toasts] |
| [Motion Reduction] | [On / Off] | [Off] | [When On, replaces all animated HUD transitions with instant state changes] |
| [High Contrast Mode] | [On / Off] | [Off] | [Applies high contrast visual theme to all HUD elements — see art bible for HC variants] |

---

## 11. 调音旋钮

> **为什么本节存在**：HUD 行为应该在相同程度上由数据驱动
> 作为游戏系统。硬编码的值是需要工程师的值
> 改变。配置中的值可以由设计人员调整或调整
> 玩家偏好。在实施之前记录所有可调参数，以便
> 程序员知道要具体化哪些值。

| 范围 | 当前值 | 范围 | 增加效果 | 减少的影响 | 播放器可调？ | 笔记 |
|-----------|-------------|-------|-------------------|-------------------|-------------------|-------|
| [Notification display duration (default)] | [2000ms] | [500ms – 5000ms] | [Toasts persist longer — less likely to be missed, more screen clutter] | [Toasts disappear faster — cleaner, higher miss risk] | [No — but player can adjust verbosity level] | [Per-type overrides in Section 8 take precedence] |
| [Notification queue max size] | [8] | [3 – 15] | [More messages preserved but queue takes longer to clear] | [Older messages dropped earlier] | [No] | [Expand if playtesting reveals important messages being lost] |
| [Health bar low-HP pulse frequency] | [1 Hz] | [0.5 – 2 Hz] | [More urgent feeling — can become fatiguing] | [Calmer — may fail to communicate urgency] | [No — but Reduced Motion disables it] | [Linked to accessibility setting] |
| [Combat HUD reveal duration] | [0ms (instant)] | [0 – 300ms] | [Softer reveal — feels less jarring] | [Instant — highest responsiveness] | [No] | [Keep at 0ms — combat information must be instant] |
| [Exploration HUD fade-out delay] | [10000ms (10s after last threat)] | [3000 – 30000ms] | [HUD fades sooner — cleaner exploration] | [HUD stays longer — more reassurance] | [No] | [Tune based on playtest; 10s is a starting estimate] |
| [Minimap range (world units visible)] | [80] | [40 – 200] | [More map context visible] | [Tighter local view] | [Yes — Small/Medium/Large preset] | [Exposed as S/M/L, not raw unit value] |
| [Minimap size (px radius at 1080p)] | [75] | [50 – 120] | [Larger map, more screen space consumed] | [Smaller, less intrusive] | [Yes — S/M/L preset] | [Three sizes exposed to player] |
| [Damage number duration (ms)] | [800] | [400 – 1500] | [Numbers linger longer — easier to read, more cluttered] | [Numbers clear faster — cleaner, harder to parse] | [No] | [Tune based on visual noise in dense combat] |
| [Global HUD opacity] | [100%] | [0 – 100%] | [Fully visible] | [Fully hidden] | [Yes — opacity slider in Accessibility settings] | [0% = full HUD off; some players prefer this] |

---

## 12. 验收标准

> **为什么存在此部分**：这些标准是认证清单
> 平视显示器。每个项目都必须通过才能将 HUD 标记为Approved。质量检查必须能够
> 独立验证每一项。

**布局和可见性**
- [ ]所有 HUD 元素均位于所有目标平台上的平台安全区域边缘内
- [ ]No两个 HUD 元素在任何记录的游戏环境中重叠
- [ ]HUD 在探索环境中占用的屏幕区域小于[12]%（以参考分辨率测量）
- 在战斗环境中，[ ]HUD 占用的屏幕区域小于[22]%
- [ ]NoHUD 元素在探索期间争论屏幕的中心[40]%（战斗期间十字准线这样）
- [ ]所有 HUD 元素在所有平台上支持的最低分辨率下均可见且清晰

**每个上下文的正确性**
- [ ]HUD 正确显示第 5 节中定义的每个上下文中的指定元素
- [ ]上下文转换（战斗enter/exit、对话、电影）在转换计时规范中显示正确的元素
- [ ]Boss 生命条在 Boss 遭遇触发时正确显示，并在 Boss 失败后消失
- [ ]死亡状态正确隐藏所有游戏 HUD 元素

**辅助功能**
- [ ]所有 HUD 文本元素与其出现的所有背景都满足 4.5:1 对比度（测试明亮和黑暗场景）
- [ ]NoHUD 元素使用颜色作为唯一的区分因素（验证：从每个元素中删除颜色并确认信息仍在传达）
- [ ]启用字幕设置后，所有有声台词和环境对话均显示字幕
- [ ]音频仍在播放时字幕文本永远不会消失
- [ ]简化运动设置禁用第 10.3 节中列出的所有 HUD 动画
- [ ]文本比例 150% 不会导致任何 HUD 文本溢出其容器或与另一个元素重叠
- [ ]第 10.5 节中所有玩家可调节的 HUD 设置均有效且在会话之间保持不变

**通知**
- [ ]在 500 毫秒内触发的相同类型的通知合并为单个通知
- [ ]Low- 优先级通知在战斗期间排队（不显示）并在战斗后释放
- [ ]无论队列状态或战斗状态如何，严重警告（生命值低，危险）都会立即出现
- 同时可见[ ]No多个[3]通知 Toast
- [ ]通知队列在级别转换时被正确清除（没有来自先前区域的陈旧通知）

**平台**
- [ ]所有元素均尊重主机上 10% 的安全区域边距（在物理电视上进行测试 - 而不是显示器）
- [ ]HUD 在 1280x720 (Steam Deck) 下正确显示，没有元素剪切或重叠
- [ ]HUD 元素可重新定位（生命值、小地图、能力栏）并且重新定位设置保持不变
- [ ]游戏期间控制器断开连接不会导致 HUD 状态损坏

---

## 13. 开放式问题

> 在这里跟踪未解决的设计问题。所有问题必须先解决
> HUD 设计文档可以标记为Approved。

| 问题 | 所有者 | 最后期限 | 解决 |
|----------|-------|----------|-----------|
| [e.g., Should the minimap show enemy positions by default, or only after a detection skill is unlocked?] | [systems-designer + ui-designer] | [Sprint 5, Day 2] | [Pending — depends on progression GDD decision] |
| [e.g., Does the game have a boss health bar, or do bosses use the standard enemy health bar? Bosses need a visually distinct treatment if they are significantly more important than normal enemies.] | [game-designer] | [Sprint 5, Day 1] | [Pending] |
| [e.g., Damage numbers: diegetic (floating in world space, occluded by geometry) or screen space (always readable, overlaid on HUD layer)?] | [ui-designer + lead-programmer] | [Sprint 4, Day 5] | [Pending — architecture decision affects rendering layer choice] |
| [e.g., Mobile portrait vs. landscape: does the game support both orientations? If yes, each requires its own zone layout.] | [producer] | [Sprint 3, Day 3] | [Pending — platform scope decision required first] |
