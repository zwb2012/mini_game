# Art Bible: 坍塌禁区 (Collapse Zone)

*Created: 2026-05-20*
*Completed: 2026-05-20*
*Status: Complete — 9/9 sections authored*
*Review mode: Lean (AD-ART-BIBLE gate skipped)*

---

## 1. Visual Identity Statement

### One-Line Rule

> **「废墟不掩线索」**

当"让画面更像废墟"和"让玩家看得懂下一个连锁"冲突时，废墟程度可以打折，线索可读性不能妥协。每一条视觉决策的问法是：「这会让玩家更容易还是更难找到下一步要打的东西？」

（在上下文中，"线索"= 可交互物理要素、危险区域、连锁路径指示物、敌人位置。任何与玩家下一步行动决策相关的视觉信息。）

### Supporting Principles

#### Principle 1: 重量即身份 (Weight Is Identity)
*Serves Pillar 1 — 每一发子弹都有重量*

每个物理对象通过三个视觉通道唯一传达其重量级：剪影形状（紧凑 vs 不规则）、边缘线条（粗 vs 细）、填充明度（暗 vs 亮）。纹理细节是次要的。玩家在任何画面中瞥一眼，就该知道「这颗子弹能不能推动它、打碎它、还是弹开它」。

**Design test**: When a visual scheme for an object is ambiguous between "looks heavy" and "looks detailed," choose the one that communicates weight — even if it means fewer textures and simpler surfaces.

#### Principle 2: 连锁先于细节 (Chain Before Detail)
*Serves Pillar 2 (多米诺战场) + Pillar 3 (规则稳定结果惊喜)*

在连锁反应正在进行或正在布设的任何帧中，物理对象之间的空间链接（哪个物体影响哪个、顺序如何）必须在视觉层级上压倒任何一个物体的表面修饰。连锁因果是主动态帧中的顶级视觉信息；物体细节下降到次级的被动信息。

**Design test**: When laying out a set of chain elements, if it's ambiguous between "highlight each object's individual identity" and "highlight the connections between objects," choose connection visibility. The A→B→C path between three crates matters more than any single crate's wood grain.

#### Principle 3: 废墟三景 (Three-Depth Ruins)
*Serves Pillar 4 — 通关靠脑子，不靠反应*

视觉场分为三个深度层，各有明确角色：
- **Foreground (#1)**: 可交互物理对象 — 完整重量信号 + 连锁标识
- **Midground (#2)**: 碎片、破坏特效 — 物理语境，无交互
- **Background (#3)**: 环境废墟 — 气氛，去饱和

玩家永远不会对背景墙纸浪费一颗子弹。

**Design test**: When a visual element is ambiguous between "looks interactive" and "looks like background decoration," push it to background — desaturate and reduce contrast until no player would waste a bullet on it.

### Productive Tensions

| Tension | Conflict | Resolution |
|---------|----------|------------|
| **P1 ↔ P2** | Individual weight markers vs. chain integration | Phased priority: P1 leads during room-scanning phase; P2 leads during chain-execution phase. Two visual LOD states. |
| **P1 ↔ P3** | Strong foreground presence vs. desaturated midground | Luminance threshold: foreground objects sit on darker bases with colored edges; midground shifts to neutral gray-brown, no edge lines. |
| **P2 ↔ P3** | Chain connection indicators cross depth layers vs. strict depth isolation | Chain indicators exist only within foreground. Midground links inferred via spatial proximity — player fills the gap. |

---

## 2. Mood & Atmosphere

### 2.1 Room Entry / Scanning

| Parameter | Target |
|-----------|--------|
| **Emotion** | 谨慎评估 (Cautious Assessment) — 战术层面的"阅读房间" |
| **Color Temp** | 6500-7000K (偏冷分析感) |
| **Contrast** | 3.5:1 ~ 4.5:1 (中等) |
| **Energy** | Contemplative — 静止中的张力 |
| **Descriptors** | 沉寂、待机、清晰、广角、警觉 |

Core visual carriers:
- **扫描光晕 (Scan Glow)** — 可交互物理要素外发光入场时短暂亮起 (0.5s fade in)
- **灰尘光柱 (Dust God Rays)** — 天花板裂缝光束中的悬浮灰尘
- **入场时间微放大** — 入场最初 0.3s 游戏运行在 70% 速度
- **边缘高亮** — 前景物理对象边缘叠加 2px 亮度提升

Three-depth layers:
| Layer | Color Temp Offset | Saturation | Brightness |
|-------|-------------------|------------|------------|
| Fg (interactive) | 0 | 100% | 70% |
| Mg (debris) | +300K cool | 30% | 50% |
| Bg (atmosphere) | +500K cool | 20% | 40% |

### 2.2 Chain Execution

| Parameter | Target |
|-----------|--------|
| **Emotion** | 宣泄释放 (Cathartic Release) — 计划被执行，多米诺正在倒下 |
| **Color Temp** | Base 5500K + explosion flash 3500K (alternating) |
| **Contrast** | Peak 8:1 ~ 10:1 (high dynamic range) |
| **Energy** | Frenetic — 高密度视觉事件，但玩家输入密度很低 |
| **Descriptors** | 爆发、流畅、连锁、璀璨、混乱 |

Core visual carriers:
- **连锁轨迹线 (Chain Path Trace)** — A→B→C 路径上的 2-4px 彩色轨迹线，每步后 0.2s 渐隐
- **冲击波环 (Shockwave Ring)** — 径向扩散环，大小与破坏物重量成正比
- **命中停顿 (Hit-stop Pulse)** — 关键触点 2-3 帧全局停顿 + 单帧白闪
- **屏幕震动 (Screen Shake)** — 震动强度 = 当前连锁物体质量 / 总质量

Three-depth layers:
| Layer | Color Temp Offset | Saturation | Brightness |
|-------|-------------------|------------|-------------|
| Fg | per hazard color | 100% | peak 100% |
| Mg | +200K warm | 60% | peak 80% |
| Bg | per flash temp | 30% peak | 40%→70% spike |

### 2.3 Cleanup

| Parameter | Target |
|-----------|--------|
| **Emotion** | 精确收割 (Calculated Mop-up) — 紧张度下降，点射解决幸存者 |
| **Color Temp** | 5500K (return to baseline) |
| **Contrast** | 3:1 ~ 4:1 (medium-low) |
| **Energy** | Measured — 需再次主动决策，但不是高压 |
| **Descriptors** | 沉降、烟尘、余烬、松懈、收尾 |

Core visual carriers:
- **沉降碎片** — 碎片减速消失，2s 后全部清除
- **余烬微光** — 爆炸点残留红/橙光晕 (30-60px)，1-2s 后渐熄
- **VFX 衰减** — 射击 VFX 缩小 50%，无震动、无命中停顿

### 2.4 Boss Encounter

| Parameter | Target |
|-----------|--------|
| **Emotion** | 持续压迫 (Sustained Tension) — 终极物理谜题 |
| **Color Temp** | 4500K ↔ 6500K pulse (3-5s cycle) |
| **Contrast** | Peak 10:1 (extreme) |
| **Energy** | Frenetic ↔ Measured alternating |
| **Descriptors** | 压迫、沉重、警告、宏大、紧张 |

Core visual carriers:
- **弱点脉冲 (Weakpoint Pulse)** — Boss 弱点以 1.5Hz 脉冲发光，颜色按危险色编码
- **场地范围指示 (Zone Indicator)** — Boss 攻击覆盖区域 0.5s 预显半透明红区
- **相机拉出** — 入场时相机拉远至 120%
- **环境要素持续高亮** — 可交互环境物体边缘高亮全程保持

### 2.5 Room Clear / Victory

| Parameter | Target |
|-----------|--------|
| **Emotion** | 短暂凯旋 (Brief Triumph) — 克制、满足 |
| **Color Temp** | 4500K (warm shift) |
| **Contrast** | 2:1 ~ 2.5:1 (low) |
| **Energy** | Contemplative — 1-2s 休息 |
| **Descriptors** | 胜利、温暖、明朗、宁静、满足 |

Core visual carriers:
- **暖色调 bloom** — 后处理 bloom 从 0.1→0.3，色温暖偏移
- **出口指引** — 出口路径出现柔和光晕 (0→40% alpha, 0.5s)
- **碎片终息** — 所有碎片停止运动

### 2.6 Death / Retry

| Parameter | Target |
|-----------|--------|
| **Emotion** | 公平失败 (Fair Failure) — 学习信号，不是挫败 |
| **Color Temp** | 7500K+ (extreme cool) |
| **Contrast** | 3:1 (medium-low) |
| **Energy** | Contemplative — 强制停顿 |
| **Descriptors** | 失败、冷却、沉淀、教训、重来 |

Core visual carriers:
- **画面去饱和** — 全画饱和度 0.3s 内降至 10%
- **死亡慢镜** — 死亡瞬间游戏速度降至 20% (0.5s)
- **暗角紧收** — vignette 从 10%→60% alpha
- **重试按钮呼吸脉冲** — 1Hz pulse, alpha 50%→80%

### 2.7 Menu / UI

| Parameter | Target |
|-----------|--------|
| **Emotion** | 世界暗示 (World Suggestion) — 菜单是游戏世界的窗口 |
| **Color Temp** | Baseline 5500K + local 4500K warm zones |
| **Contrast** | 5:1 (high, for UI readability) |
| **Energy** | Contemplative |
| **Descriptors** | 标志、沉静、克制、神秘、质感 |

Core visual carriers:
- **废墟 parallax 背景** — 缓慢平移的静态废墟场景，无危险色
- **碎片循环** — 极缓慢飘过的碎片颗粒 (1-2 个, 循环 > 10s)
- **标题危险色嵌入** — "坍塌禁区" 中一个字笔画使用橙色强调
- **UI 边缘语言** — 主要操作=粗边+亮填充，次级=细边+暗填充

### State Transition Table

| From → To | Duration | Key Signal |
|------------|----------|------------|
| Menu → Room Entry | 0.5-0.8s fade-in | Warm→cool temp gradient |
| Room Entry → Chain Execution | 0s (first bullet) | Scan glow off → chain trace on |
| Chain Execution → Cleanup | 0.3-0.5s natural | Last trace fades; shake decays |
| Cleanup → Room Clear | 0.3s | Warm bloom fades in; exit glow on |
| Any → Death | 0.3s immediate | Desat + slo-mo + vignette sync |
| Death → Retry | 0.5s fade → 0.3s fade-in | Scene reset; vignette release |
| Boss → Room Clear | 0.5s + 1s slo-mo | Extended boss-shatter close-up |

### Godot 4.6 Implementation Notes

- Color temp: `WorldEnvironment` → `ColorCorrection` → `Temperature` / `Tint`
- Contrast: `ToneMap` exposure + `ColorCorrection` contrast
- State transitions: `SceneTreeTween`, not `_process` polling
- Chain trace: `Line2D` + gradient material, max 32 vertices (mobile)
- Shockwave: `Sprite2D` + radial gradient, 64×64 alpha-only (mobile)
- Dust particles: 16×16 sprite, max 20 active per room

---

## 3. Shape Language

> **Motto**: 「形即是力，形即是向」—— 一个形状告诉玩家两件事：它有多重（力），它往哪倒（向）。拒绝装饰形状，每一个几何选择都是物理信息。

### 3.1 Character Silhouette Philosophy

#### Principle Declaration

角色的剪影必须在 0.3 秒内、在手机缩略图尺寸下，唯一地传达其角色类型（威胁分类）、重量级和崩塌方向。

#### Design Rationale

移动屏幕小。玩家需要在瞬间识别威胁并进行战术优先级排序。此原则直接服务 P1（重量即身份）和 P4（通关靠脑子不靠反应）——玩家依靠剪影快速读取做出战术决策，而不是浪费时间逐个检视图标细节。在"废墟三景"框架下，角色剪影是前景层（#1）的核心视觉载体，需要与所有环境物体产生明确区分。

#### Specific Rules

**玩家角色**:
- 比例为紧凑直立矩形，宽高比约 1:2，重心落在下半部。
- 武器轮廓从右下象限伸出（默认面对右方），形成唯一的不对称特征。
- 没有任何敌人或环境物体共享此宽高比。玩家角色剪影在全游戏中是唯一的。
- 边缘线 2px，填充明度 80%（全游戏中最高明度的实体）。
- 轮廓在闲置/瞄准/射击状态之间有不超过 15% 的形状变化（武器伸出角度变化），保持核心轮廓恒定。

**基础敌人**:
- 上重下轻的倒梯形/倒三角剪影，顶部宽度 ≥ 底部宽度 × 1.3。
- 此比例明确传达"我不稳定——推我一把我就倒"。
- 边缘线 1.5px，填充明度 50-60%。

**重型敌人**:
- 近正方形或矮矩形，宽高比 0.8:1 ~ 1.2:1，重心极低。
- 传达"你推不动我，但你可以挖空我脚下的东西"。
- 边缘线 3px，填充明度 30-40%（全场最暗的可动实体）。

**飞行敌人**:
- 水平拉长的扁平轮廓，宽高比 ≥ 2:1，底部平坦。
- 传达"我没有崩塌方向——被击毁时垂直下落"。
- 边缘线 1px，填充明度 60-70%，翅膀/推进器轮廓不对称。

**Boss**:
- 非对称剪影，明确突出的弱点部位以最高边缘对比度呈现。
- 弱点部位的边缘线比其他部位亮 40% 或使用互补色。
- Boss 的总体剪影必须在其出场动画的 1 秒内被玩家识别为"这不是普通敌人"——通过尺寸异常（超出常规敌人体积 200% 以上）和轮廓的不对称比例（宽高比 ≥ 2:1 或 ≤ 1:2）实现。

**剪影区分规则**:
- 任意两种敌人类型之间的剪影 Jaccard 相似度 ≤ 25%（以二值化 silhouette 交并比计算）。
- 不存在"靠颜色才能区分两种敌人剪影"的情况。灰度化后两种敌人的轮廓必须仍然可辨。
- 玩家角色的轮廓与最近敌人类型的轮廓相似度 ≤ 15%。

#### Emotional Communication

玩家感觉自己在"战术阅读"——他们在扫描房间时处理的是物理系统的节点和杠杆，而非恐怖画廊里的怪物。每一个剪影都是一个已知物理状态的预告。

---

### 3.2 Environment Geometry

#### Principle Declaration

所有环境几何以锐角多边形为核心语言——曲线仅用于"正在破坏中"或"已经失效"的状态，标志着形体的变化而非稳定。

#### Design Rationale

P2（多米诺战场）要求玩家能够一眼阅读连锁路径。锐角几何将力的集中点、裂缝传播方向和结构崩塌方向暴露给玩家——每一个顶点都是一个物理事件的可能起点。曲线隐藏了结构信息，因此曲线在本游戏中等价于"不稳定、正在断裂或已经倒下"。P3（废墟三景）中三个深度层的几何复杂度分层也依赖于此原则：前景高密度顶点 → 中景简化顶点 → 背景去顶点化。

#### Specific Rules

**材质与厚度的几何映射**（决定性的重量视觉公式）:

| 材质 | 厚度:长度比 | 填充明度 | 边缘线条 | 顶点密度 |
|------|-----------|---------|---------|---------|
| 混凝土 | ≥ 1:4 | < 35% | 3-4px | 高（每 24px 一个顶点） |
| 金属 | 1:5 ~ 1:8 | 35-55% | 2px | 中（每 32px 一个顶点） |
| 木材 | < 1:8 | > 55% | 1px | 低（每 48px 一个顶点） |

**崩塌方向的内置几何信号**:
- 每一个独立直立结构（柱子、墙壁、支架）的底座必须具有非对称性——较窄的一侧指向崩塌方向。
- 规则：玩家看到一根柱子，底座宽度 = 左 60% 右 40% → 右侧是崩塌方向。
- 预裂缝表面必须有一条可见应力线，尖端指向崩塌路径方向。应力线 = 1px 亮色（比表面填充亮 30%），从受力点向崩塌方向延伸。

**曲线使用守则**:
- 游戏中出现曲率的物体自动被玩家语义标记为"非刚性"。
- 允许使用曲线的唯一场景：（1）绳索/链条——正在摇晃中；（2）断裂面的撕裂边缘——已破坏；（3）爆炸冲击波——物理事件进行中。
- 一个稳定状态的物体如果带有曲线，则必须是游戏 bug。所有稳定结构必须是直线边形。

**三深度层几何差异化**:
- 前景（#1）：高密度顶点，每 24-32px 一个转角。结构细节完整，每个转角都是有物理意义的。
- 中景（#2）：顶点密度降低 50%，几何简化。无独立可识别的结构——碎片以聚合块的形态出现。
- 背景（#3）：仅轮廓剪影，无内部分割线。单个物体的顶点数 ≤ 6。

**禁止规则**:
- 前景中无任何纯装饰几何体。每一根梁、柱、管道、箱子都是有物理功能的。"如果它在前景层，它就能被打、被推、或被推倒。"
- 平行线仅在表示"承重结构"时使用（梁、轨、加固筋）。一旦此结构被破坏，平行线必须断裂为折线。

#### Emotional Communication

玩家感觉世界是一台可读的物理机器——每一个角度都是一个可供性（affordance），每一个顶点都是一个决策点。废墟不是杂乱的，而是有结构语言的。

---

### 3.3 UI Shape Grammar

#### Principle Declaration

UI 形状语言使用硬边矩形作为布局框架，但交互元素继承世界的锐角语言——UI 不是覆盖层，而是废墟世界的延伸界面。

#### Design Rationale

移动端触摸目标要求最小 44×44px 的点击区域。UI 必须与游戏场景瞬间可区分（玩家不会把按钮当成可破坏物理要素）。但同时，视觉身份（废墟美学）需要在 UI 中被感知。解决方案：UI 使用直角矩形框架（干净、可读），内部用废墟的锐角/裂缝语言作为交互元素装饰。Pillar 4（通关靠脑子）也要求 UI 信息层级清晰——玩家不会在紧张时刻看错血量和弹药数。

#### Specific Rules

**按钮形状**:
- 主按钮：圆角矩形（仅 2px 圆角半径——禁止药丸形），边框宽度 8px 使用世界颜色（灰棕底色系的加深版本），最小触控尺寸 44×44px。
- 辅助按钮：方形或圆形 + 图标，视觉尺寸可以小于 44px，但不可见点击区域必须 ≥ 44px。
- 危险操作按钮（放弃、重置、退出）：锐角梯形下边，上宽下窄，与"不稳定结构"的视觉语言一致。

**HUD 元素**:
- 血量/能量指示条：直角矩形，角部切角 45°（切角 4px），与世界几何的锐角语言一致。
- 弹药指示：六边形或八边形边框，每发子弹在框内用一个顶点凸起来表示（满弹 = 8 凸点）。
- 连锁计数器：使用断裂环状图形（缺角圆环），缺角方向指向当前连锁进行的进度。
- 所有 HUD 元素使用 1px 边缘线，内部 50% 不透明填充，确保不遮挡游戏场景。

**触摸反馈指示器**:
- 玩家触摸可交互物体时，触摸点出现 45° 角闪光——与世界几何角度一致。
- 闪光缩放到消失的持续时间为 0.15s，且不阻碍玩家视线。

**威胁指示器（屏幕外敌人）**:
- 等边三角形指向威胁方向。三角形 = 威胁（继承自世界的"不稳定形状"语义）。
- 三角形边长 28px，边缘 2px 使用危险色（橙色 = 直接威胁，黄色 = 间接/即将入场）。
- 接近屏幕边缘时三角形渐变半透明，避免遮挡。

**菜单/UI 背景**:
- 使用废墟三景层系统：菜单自身 = 前景层 + 高斯模糊的中景废墟 + 缓慢飘浮的颗粒背景。
- 菜单中的装饰性几何体不重复使用按键形状——装饰元素使用简化的多边形剪影（≤6 个顶点），与可交互按钮保持视觉区分。

**移动端特殊考量**:
- 所有触摸目标之间的最小间距 12px，避免误触。
- 虚拟摇杆区域使用半透明 45° 切角环形，不遮挡游戏视野。
- 射击按钮位于屏幕右下角，最小 60×60px（满足拇指操作的人体工学范围）。

#### Emotional Communication

玩家感觉 UI 是同一个世界的一部分，而不是叠加在游戏上方的另一套操作系统。按钮看起来像废墟中可以按的东西，而不是一个独立的"界面层"。

---

### 3.4 Hero Shapes vs. Supporting Shapes

#### Principle Declaration

每一帧的视觉层级遵循：玩家剪影 > 可交互危险物 > 敌人剪影 > 连锁路径碎片 > 大气背景——按此顺序分配形状对比度。

#### Design Rationale

P3（废墟三景）定义了深度层的堆叠顺序，但在每个层内部，形状对比度决定了视觉吸引力的分配。玩家角色必须在任何帧中都是形状上最独特的元素。之后，最优先级的信息是"我可以与什么交互"（可交互物理要素），然后是"什么在威胁我"（敌人）——即使敌人出现在玩家前方，可交互要素的视觉优先级仍然更高。这直接对应 Pillar 4（通关靠脑子）：玩家的第一认知任务是读取环境连锁路径，其次才是应对敌人。

#### Specific Rules

**玩家角色的形状主权**:
- 玩家角色是游戏中唯一使用约 1:1.8 宽高比（高而稳定）+ 不对称武器轮廓的组合。
- 此组合被定义为"不可复用"——任何其他物体不得同时具有这两个特征。
- 玩家角色填充明度在任意帧中都必须维持在全画面最高 15% 之内（即：玩家永远是画面上最亮的实体）。

**可交互危险物的形状隔离**:
- 每种危险物使用独特的基形，与所有角色剪影视觉隔离：
  - 爆炸桶（橙色）：圆柱体（高:宽 ≈ 1:1）——无角色使用圆柱体。
  - 木箱：矩形（高:宽 ≈ 1:1 ~ 1:1.5），边缘 1px——无角色使用此比例。
  - 不稳定支柱：楔形（梯形，上窄下宽或上宽下窄），底边非对称——无角色使用梯形。
  - 悬挂物：顶端固定点 + 下方自由悬挂的链条/绳索——无角色有悬挂轮廓。
- 规则：将任意交互物的灰度剪影与任意角色灰度剪影重叠，交并比 ≤ 20%。

**连锁路径中的形状对比度瞬态调整**:
- 连锁执行期间，非链对象的形状对比度在 0.1s 内降低 40%。
- 降低方式：统一将非链物体的边缘线减薄 1px、填充明度向灰色中值靠拢。
- 链上物体保持全对比度。效果：玩家视线被自然引导到活跃连锁路径上，无需显式箭头指示。

**三深度层的形状分配**:
| 层 | 形状对比度 | 边缘定义 | 内部分割线 |
|----|-----------|---------|-----------|
| 前景（#1） | 100% | 完整 | 完整 |
| 中景（#2） | 60% | 边缘减 1px | 仅保留主分割线 |
| 背景（#3） | 30% | 仅外轮廓 | 无分割线 |

**帧内形状密度限值**:
- 任意帧中，前景层（#1）内具有完整形状对比度的物体数量上限 = 12。
- 超过 12 个时，距离玩家最近的 12 个保持全对比度，其余按距离递减到 70%。
- 此规则确保移动端小屏幕上不会出现形状过载。

#### Emotional Communication

玩家本能地知道往哪看——眼睛被形状层级引导，而非显式的标记。每一帧都是经过设计的视觉导览。

---

### 3.5 Shape Language and Physics

#### Principle Declaration

每一个物理对象的形状都是一本用几何写成的物理说明书——形状决定重量级、稳定状态、崩塌方向和连锁潜力，全程不需要一个字的标签。

#### Design Rationale

这是"形即是力，形即是向"的核心意义。玩家通过游戏过程学习形状-物理词典，一旦掌握，他们可以在 1 秒内"读"通一个房间。此原则支撑 P2（多米诺战场——连锁规划就是形状阅读）和 P3（规则稳定结果惊喜——形状永远映射到相同的物理行为，结果中的变量来自组合而非规则突变）。这个映射字典在游戏前 10 分钟通过引导关卡逐步教给玩家，并在整个游戏过程中保持完全一致。

#### Specific Rules

**重量级形状映射**（决定性、不可变更）:

| 等级 | 冲击反应 | 形状特征 | 填充明度 | 边缘 | 玩家的心理模型 |
|------|---------|---------|---------|------|-------------|
| 1 — 推得动 | 一发子弹推动位移 | 细长比 ≤ 1:2，面积小 | ≥ 70% | 1px | "一枪就能把它推走" |
| 2 — 打得裂 | 一发子弹开裂，两发断 | 长宽比 1:2 ~ 1:3 | 40-70% | 2px | "一枪裂开，两枪断" |
| 3 — 弹得开 | 子弹弹开，无损伤 | 块状 ≥ 1:3，厚重 | < 40% | 3-4px | "打它没用——得用环境" |
| 4 — 炸得碎 | 子弹无效，爆炸才能破坏 | 不规则轮廓，宽 > 高 ≥ 2:3 | < 30% | 4px | "别开枪，炸它旁边的桶" |

**稳定状态的形状信号**:
- 直立 + 底座对称 = 稳定。可以用多枪改变其状态。
- 直立 + 底座非对称（一侧底座宽度小于另一侧的 60%）= "将向窄侧倒下"。
- 表面出现 ≥ 2 个可见角状缺口（预裂缝）= "下次冲击将崩塌"。
- 顶部水平延伸超过底座宽度 30% 以上（悬挑）= "在悬挑端施加冲击会导致旋转倒塌"。
- 底座到顶部中心偏移 ≥ 5° = "已经失稳——轻轻一碰就完成倒塌"。

**崩塌方向的内置几何指针**:
- 梯形/锥形顶部 = "向锥尖指向的方向倒"。
- 底座一侧的角状切角 = "失效点——崩塌从此处开始"。
- 悬挑结构 = "在此端用力导致绕支点旋转"。

**连锁潜力的形状信号**:
- 两个物体间物理间距 ≤ 8px，且其中至少一个是 1-2 级物体 = "摧毁这个可以激活那个"。
- 一个物体上有可见的凹槽/朝向另一个物体的插座状凹陷 = "此设计是为了接纳那个——连锁路径是被预设的"。
- 堆叠物体交替朝向（如十字堆叠木箱）= "连锁将以蛇形传播——预判交错路径"。
- 链条/绳索连接的物体 = "连锁方向是绳索张力方向"。

**形状规则的教学嵌入**:
- 第一个教学关卡是"介绍四个重量级"——四种物体各出现一次，玩家必须分别使用正确的交互方式应对。
- 第二个教学关卡是"崩塌方向阅读"——三根柱子底座偏左、偏右、对称，玩家需要射击触发倒塌来看方向是否与底座预测一致。
- 第三个教学关卡是"连锁阅读"——两段连锁路径，一段形状指示明确（间距近、有凹槽、交替堆叠），另一段隐晦（需要玩家自己推断）。过关后对比两种阅读方式的成功率。

**规则一致性保证**:
- 全局形状 → 物理映射表在工程中实现为一个 `ShapePhysicsMapping` 资源文件，所有关卡使用同一份映射表。
- 任何需要增加新物理交互类型的需求必须同时更新此映射表和相应的教学关卡。
- 不允许出现"看起来像 2 级物体但实际上是 4 级"的误导形状——这是游戏设计中不可违反的规则。欺骗玩家对形状语言的信任 == 摧毁核心体验。

#### Emotional Communication

玩家感觉自己像一个专业的拆除专家——他们读懂了房间的物理语言，执行了一个"必然发生"的计划。形状不是障碍，是玩家已经学会说的一种语言。当计划如期展开时，那种"我早就知道会这样"的确认感是核心的智力快感来源。

---

## 4. Color System

> **Principle**: 色彩的第一职责是传达语义（线索），废墟氛围（废墟）是第二位的。灰度测试法则：任意帧转灰度后，所有交互要素必须在明度上与背景形成 ΔL ≥ 30 的差异。

### 4.1 Primary Palette (9 Colors)

#### Foundation Colors (基底色系)

| # | Name | HEX | HSV | Role |
|---|------|-----|-----|------|
| F1 | 断层灰 (Fault Gray) | `#7C7C7A` | 60°, 2%, 49% | 主结构色 — 非交互环境表面默认色 |
| F2 | 铁锈棕 (Rust Brown) | `#594233` | 24°, 42%, 35% | 次级结构色 — 金属框架、管道、老旧机械 |
| F3 | 深隙黑 (Deep Gap Black) | `#2B2B2B` | 0°, 0%, 17% | 阴影与空隙色 — 崩塌间隙、暗角、不可达区域 |

#### Hazard Colors (危险色系)

| # | Name | HEX | HSV | Role | Weight Tier |
|---|------|-----|-----|------|-------------|
| H1 | 爆燃橙 (Blast Orange) | `#E87D2A` | 25°, 82%, 91% | 爆炸性 — 燃料罐、油桶、炸药包 | 1-2 (轻-中) |
| H2 | 蚀骨绿 (Corrode Green) | `#5DB84D` | 108°, 58%, 72% | 腐蚀性 — 酸液池、毒气云 | 非固体 (持续伤害) |
| H3 | 崩裂红 (Fracture Red) | `#C23B3B` | 0°, 70%, 76% | 结构不稳定 — 裂缝墙、将塌柱子 | 3-4 (重-极重) |

#### Player Colors (玩家色系)

| # | Name | HEX | HSV | Role |
|---|------|-----|-----|------|
| P1 | 战术青蓝 (Tactical Cyan) | `#38C0D4` | 187°, 73%, 83% | 玩家阵营色 — 子弹轨迹、连锁路径线、UI 高亮 |
| P2 | 战利金黄 (Loot Gold) | `#E8B82A` | 45°, 82%, 91% | 奖励色 — 弹药/生命拾取、隐藏通道提示 |
| P3 | 核心白 (Core White) | `#FFFFFF` | 0°, 0%, 100% | 极端高亮 — 玩家高光点、命中停顿白闪 (限制 <5% 屏幕面积) |

**为何青蓝为玩家色**: 色环上与橙棕系形成 120-160° 互补，不与任何危险色冲突，冷色调关联"理性与控制"（Pillar 4）。

**灰度 L* 验证**: F3(17)→F2(35)→F1(49)→H2(55)→H3(42)→H1(62)→P1(68)→P2(82)→P3(100)。相邻 ΔL ≥ 5，所有颜色灰度可区分。

### 4.2 Semantic Color System (色彩词汇表)

| Category | Colors | Instant Read Signal | Eye Dwell | Emotion |
|----------|--------|---------------------|-----------|---------|
| **Danger** | 橙/绿/红 | 高饱和 + 脉冲发光 | 0.2s | 警觉/决策 |
| **Reward** | 金黄 | 高饱和 + 呼吸发光 + 六边形轮廓 | 0.3s | 期待/满足 |
| **Info** | 青蓝/白 | 冷色调高对比 + 线性形态 | 0.15s (被动) | 理解/确认 |

**Danger hierarchy** (multiple hazards present):
1. Orange (explosive) — highest priority, 1.5Hz pulse, most common chain starter
2. Red (unstable) — medium priority, 1.0Hz pulse, directional delayed collapse
3. Green (corrosive) — normal priority, 0.5Hz pulse, pre-judged by player

**Key separation rules**:
- No reward item may be orange, green, or red
- Gold: smooth sine-wave breath (1.0Hz); Danger: sharp square-wave pulse (1.0-1.5Hz)
- Cyan: never glows/pulses — solid lines and stable fills only

### 4.3 Environmental Color Rules

**Three-Depth Layer Parameters** (universal):

| Parameter | Fg #1 (Interactive) | Mg #2 (Debris/VFX) | Bg #3 (Atmosphere) |
|-----------|---------------------|--------------------|--------------------|
| Saturation | 100% (hazard) / 80% (other) | 30% | 15% |
| Brightness | 30-100% | 40-60% | 35-50% |
| Color temp offset | 0 | +300K cool | +500K cool |
| Hue shift | None | +15° warm | 90% neutralized |
| Edge lines | 1-4px clear | 0.5px or none | None |

**Zone Color Temperature** (8 levels):

| Zones | Color Temp | Base Shift | Keywords |
|-------|-----------|------------|----------|
| 1-2: Surface Ruins | 5500K (baseline) | None | Gray, brown, rust |
| 3-4: Underground | 6000K (slightly cool) | +5% blue tint | Cold gray, dark green |
| 5-6: Lab Zone | 5000K (slightly warm) | +5% red tint | Charcoal, scorched brown |
| 7: Core Zone | 6500K (cold) | +10% blue tint | Cold blue-gray, arc white |
| 8: Collapse Origin | 4500K (warm) | +8% orange tint | Molten orange, jet black |

**Hazard colors maintain identical HSV values across ALL zones** — only glow halos shift ±200K for readability.

**Background forbidden colors**: pure white, any saturated orange/green/red, cyan.

### 4.4 UI Palette

UI renders on independent CanvasLayer — not affected by WorldEnvironment color temp/post-processing.

| Role | Color | HEX | Scene Equivalent |
|------|-------|-----|------------------|
| UI Base (panels/bg) | Dark gray 80% opacity | `#1A1A1A CC` | F3 Deep Gap Black |
| UI Border (structure) | Mid gray | `#5C5C5C` | F2 desaturated |
| UI Primary Text | Off-white | `#F0F0F0` | P3 dimmed |
| UI Secondary Text | Light gray | `#999999` | F1 brightened |
| UI Highlight (selected) | Cyan dimmed | `#38C0D4` 60% | P1 Tactical Cyan |
| UI Warning (danger action) | Red-orange | `#D4602A` | H1 hue-shifted to 18° |
| UI Disabled | Dark gray | `#3D3D3D` | F3 brightened |

**CRITICAL RULE**: UI elements must NEVER use exact H1/H2/H3 hex values. UI colors are always ≥15% less saturated than scene colors. A UI button must not look like an explosive barrel.

**Key HUD element colors**: HP bar (cyan→white gradient, 120x8px), ammo indicator (hex border white, cyan dots, 32x32px), chain counter (white number, cyan ring, 40x40px), virtual joystick (45° chamfer gray ring, cyan center), fire button (white-border rounded rect, cyan 30% fill, 60x60px).

### 4.5 Colorblind Safety

**Failing pairs and backup signals**:

| Color Pair | Meaning | Failure Type | Shape Backup | Animation Backup | Sound Backup |
|------------|---------|--------------|--------------|------------------|--------------|
| Red ↔ Green | Unstable vs. Corrosive | Deuteranopia/Protanopia | Red→jagged crack, Green→circular ripple | Red→1.0Hz square flash, Green→0.5Hz sine breath | Red→low creak, Green→hiss |
| Orange ↔ Red | Explosive vs. Unstable | Protanopia | Orange→cylinder/barrel, Red→flat surface cracks | Orange→spark particles, Red→crack pulse 1-3px | Orange→high fizzle, Red→low groan |
| Cyan ↔ Green | Player vs. Corrosive | Tritanopia | Cyan→line/arrow, Green→area/pool | Cyan→trail motion, Green→static surface | Cyan→air whoosh, Green→static hiss |

**Universal rules**:
- Never convey information by color alone — always at least one backup channel
- Color-shape binding table: `assets/data/colorblind-safety-map.json`
- Grayscale test gate: every new element must pass grayscale distinguishability before commit
- Godot 4.6 colorblind simulation filters mandatory — weekly 10-min playtest in all 3 modes
- Optional "Color Label Mode" in settings: 2-3 char labels (EXP/COR/COL/AMMO/HEAL) above key elements

---

## 5. Character Design Direction

> **Principle**: "装备是军事级的，身份是勘探队的" — the player is an explorer-soldier, not a warrior. Every character design must communicate its physics role (weight tier, push direction, chain potential) at thumbnail size on mobile.

### 5.1 Player Character: 特勤勘探兵 (Tactical Recon Specialist)

**Helmet**: Full-seal deep-dive exploration helmet with arched rectangular face window (not military goggles). Tactical Cyan (#38C0D4) glowing goggles = iconic visual anchor. Angular side vents (3-4 sharp cut lines). Rock-layer survey antenna on top (thin rod + small sensor sphere).

**Body**: Modular load-bearing vest, 1:2 width-height ratio, center of gravity in lower half. Vest color: F2 Rust Brown base + F1 Fault Gray pocket accents. 45° chamfer language throughout.

**Backpack**: Trapezoid profile (top 20% wider than bottom). External cyan crystal sample container (cylinder, 30% transparent cyan fill + 2px cyan edge, 0.5Hz breath glow alpha 40%→70%). Creates silhouette asymmetry.

**Tool Belt** (left to right): Cutter (rectangular + angled head), Scanner (hexagonal, faint cyan screen), Signal Flares (3 cylinders, #8C3A3A shell — not H3 red).

**Arm Patch**: Survey team emblem — simplified hexagon + crack line pattern, 24×24px, F1 Fault Gray.

**Weapon**: Physics Launcher — short pump-action launcher, 4 ammo ports at front. Dark gray base (#3D3D3D) + cyan accent lines. Sits in bottom-right quadrant.

**Damage States** (expressed through visor + backpack only, never silhouette):

| Stage | HP | Visor | Backpack |
|-------|-----|-------|----------|
| Intact | 100-61% | Cyan full brightness, stable | Crystal normal breath |
| Light damage | 60-31% | Cyan 70% brightness, 1-2 hairline cracks | Breath accelerates to 1Hz |
| Heavy damage | 30-1% | Cyan 40% brightness, 3-4 cracks, random 0.1s flicker | Container flickers, F3 black seepage at edges |
| Fatal | 0% | Extinguishes to dark gray in 0.5s | Shatter VFX |

### 5.2 Enemy Visual Hierarchy

**Universal anti-player rules**: No 1:2 ratio, no cyan base color, no visor+antenna combo, no bottom-right weapon asymmetry, no translucent containers.

| Type | Silhouette | Ratio | Color | Edge | Size | Key Read |
|------|-----------|-------|-------|------|------|----------|
| **Basic** | Inverted trapezoid (top ≥1.3× bottom) | 1:1.2~1.5 | H2 Corrode Green 50% fill | 1.5px dark gray | 0.7× player height | Single eye sensor, 1Hz pulse. Top-heavy = easy to push |
| **Heavy** | Near-square block | 0.8:1~1.2:1 | F3 Deep Gap Black 35% fill | 3px H1 Blast Orange | 1.0-1.2× player | Orange stress lines (2-3, 12-16px) pointing to weak direction |
| **Flying** | Horizontal flat strip, asymmetric wings | 2:1~3:1 | H1 Blast Orange 60% fill | 1px gray | Width 1.5× player, height 0.4× | Suspended orange weakpoint sphere below, 1.5Hz pulse |
| **Boss** | Asymmetric, weakpoint regions 40%+ brighter than body | Varies | F1/F2/F3 base | 3-4px body | ≥200% player | Weakpoints use H1/H3/P1 with unique pulse patterns |

**Enemy Jaccard similarity**: All pairwise ≤15%. All vs. player ≤12%.

### 5.3 Boss Design Philosophy

**Weakpoint Language**:

| Type | Color | Shape | Pulse | Effect on hit |
|------|-------|-------|-------|---------------|
| Physical weakpoint | H3 Fracture Red | Jagged cracks radiating from center | 1.0Hz square flash | Boss recoils, 0.5s stun |
| Explosive weakpoint | H1 Blast Orange | Circle/hexagon with concentric rings | 1.5Hz sawtooth pulse | AoE damage, armor shatter |
| Chain weakpoint | P1 Cyan + white highlight | Diamond/arrow pointing to target object | 0.5Hz sine breath | Activates environmental trap for weight-3+ damage |

Max 2 weakpoint types simultaneously. Boss body uses F1/F2/F3 only — saturated colors (≥60% sat) limited to ≤15% screen area, exclusively on weakpoints. Weakpoint minimum 44px touch target.

### 5.4 Expression & Pose Style

**Philosophy**: Restrained Expressionism — character state conveyed through body pose and speed changes, not facial expression or exaggerated gestures.

| State | Pose change | Speed | Key posture |
|-------|------------|-------|-------------|
| Idle | ±2px breath | Slow (0.5Hz) | Upright, weapon down 45°, center-balanced |
| Aim | Forward lean 8° | Very slow | Body forward, weapon horizontal, rear foot back |
| Fire | Recoil ±3px | Instant (0.1s) | Shoulder kicks back, weapon rises 5° |
| Hurt | Forward lean increased | -30% speed | Lean 5-10°, backpack sway +50% |
| Death | Full unbalance | 20% speed | Body falls backward, weapon drops, visor extinguishes |

**Keyframe philosophy**: Fewer keyframes = stronger physics feel. Idle ≤4 frames, movement ≤6 frames, hurt = 1 frame hit + 0.15s hold + 0.2s recovery, death = 3 frames with slo-mo. Stepped animation curves (no easing).

### 5.5 LOD & Mobile Optimization

| LOD | Screen height | Preserved | Removed |
|-----|--------------|-----------|---------|
| LOD0 | ≥120px | Full: fill, edges (1-4px), internals, attachments, glow | Nothing |
| LOD1 | 60-119px | Fill, edges (-1px), main internal lines, main attachments, visor glow | Tool belt details, antenna detail, crystal breath |
| LOD2 | 30-59px | Fill (same hue), 1px edges, overall silhouette, 50% visor glow | All internal lines, attachments become block silhouettes |
| LOD3 | <30px | Monochrome fill + 1px outline. Visor = 4px white dot. 3-5 polygon silhouette. | All internals. Pulse/breath stopped. |

**Critical invariant**: LOD transitions never change width-height ratio or color hue.

**Vertex budgets** (LOD0): Player ≤24, Basic enemy ≤16, Heavy ≤20, Flying ≤18, Boss ≤60.

**Zero-texture character rendering**: All characters use `ColorRect`/`Polygon2D` + `Line2D` + `ShaderMaterial` only. No texture files. Glow/pulse via shader TIME uniform, not CPU per-frame.

**Z-index hierarchy**: Player(100) > Player bullets(90) > Boss(80) > Flying(70) > Basic/Heavy(60) > Interactive objects(50) > Midground(40) > Background(30) > Parallax(20) > Sky(10) > World base(0).

---

## 6. Environment Design Language

> **Principle**: "废墟可读，连锁可见" — every environment design decision supports physics chain planning and reading. Ruin atmosphere must never overpower interaction readability.

### 6.1 Architectural Language: 深源工业联合体

Five architectural layers of the "Deep Source Industrial Complex":

| Layer | Zones | Original Function | Dominant Materials | Key Forms |
|-------|-------|-------------------|-------------------|-----------|
| Civilian | 1-2 | Living/admin spaces | Concrete(70%) + Wood(20%) + Metal(10%) | Horizontal skyline, large rectangles, broken walls |
| Industrial | 3-4 | Production/resource processing | Concrete(50%) + Metal(40%) + Wood(10%) | Low arched tunnels, dense vertical pillars |
| Research | 5-6 | Laboratory facilities | Metal(60%) + Concrete(30%) + Wood(10%) | Modular cells, hexagonal partitions, straight corridors |
| Core | 7 | Energy nexus | Metal(70%) + Concrete(20%) + Special alloy | Centripetal arcs, radial structures, circular hall |
| Origin | 8 | Collapse epicenter | Special (uniform 2-3px edge, no thickness mapping) | Inorganic forms, flow contours, recrystallized geometry |

**Structural grammar — room components**:

| Component | Material | Typical Form | Physics Role |
|-----------|----------|-------------|--------------|
| Support column/pillar | Concrete (3-4px edge) | Rectangle/trapezoid, vertical | Collapse direction indicator |
| Beam/lintel | Concrete/Metal | Horizontal rectangle, ends on pillars | Falls as obstacle on collapse |
| Wall panel/partition | Concrete/Wood | Large rectangle face | Bullet block/breakable surface |
| Pipe/conduit | Metal (2px edge) | Thin rectangular zigzag | Chain path conductor |
| Floor/platform | Concrete/Metal | Wide horizontal rectangle | Stable standing surface, hollow below |
| Bracket/support | Metal | Triangle/diagonal brace | Stability key — break = upper collapse |
| Container/crate | Wood (1px edge) | Small rectangle | Pushable/breakable object |

**Joint rule**: Connection nodes (column-beam, pipe-wall, platform-bracket) marked by junction brightness +10%. Damaged nodes: broken connections, discontinuous edge lines, brightness → F3. Near-failure nodes: 1px H3 Fracture Red stress lines pointing to collapse direction.

**Collapse patterns** (each room has ≥1): Centripetal (pillars→center, break center = ceiling fall), Chain (A→beam B→platform C visible dependency), Cantilever (unsupported overhang, break base = rotational collapse), Domino (≥3 asymmetric-base pillars in line).

### 6.2 Zero-Texture Visual Strategy

All visual richness from polygon fills + edge lines + shader effects. Zero texture atlases, zero UV mapping, zero texture memory.

**Polygon fill techniques**:
- Gradient fill: vertex brightness varies top→bottom (simulates light direction)
- Noise fill: shader-based low-intensity noise, HSV brightness ±3-5% (aging/unevenness)
- Seam lines: 1px internal lines between fill and edge (panel gaps, casting marks)
- Edge wear: center→edge brightness gradient +10% (simulates edge erosion)

**Edge line refinement by material**:

| Material | Base Width | Damaged State | Joint Treatment | Corner Treatment |
|----------|-----------|---------------|-----------------|------------------|
| Concrete | 3-4px | Jagged broken lines | +1px at corners | Hard right angle |
| Metal | 2px | Continuous but uneven brightness (±15%) | -1px at joints (weld point) | 45° chamfer or right angle |
| Wood | 1px | Slight wave (vertex ±1px) | Cross lines at joints | Right angle or slight rounding |

**Vertex displacement for wear (no textures)**:
- Edge erosion: 30% of edge vertices offset inward 2-4px
- Dents/pitting: local vertex cluster offset inward
- Cracks: vertices split along a line, 2-6px gap
- Warping: entire vertex group sine-wave shifted ≤3px
- Missing chunks: delete 1-2 corner vertices, create gap

Max vertex displacement ≤6px at 720p. Four damage state tiers per destructible object.

**Shader-based weathering**: Edge rust (orange noise near edges, metal only, ≤5% screen), dust deposition (bottom-half fill brightness → F1 ±5%), water stains (vertical gradient from top edge, underground only), heat shimmer (1-2px edge sine distortion, zone 8 only, radius ≤200px).

### 6.3 Prop Density Rules

| Area Type | Foreground Objects | Midground Fragment Groups | Chain Potential |
|-----------|-------------------|--------------------------|----------------|
| Open hall | 4-8 | 2-3 | High — multi-directional |
| Narrow corridor | 2-4 | 1-2 | Medium — linear |
| Control room/lab | 6-10 | 3-4 | High — compact |
| Ruin field | 8-12 | 4-6 | Very high — filtering cost |
| Collapse zone | 4-6 | 2-3 | Medium — terrain limited |
| Boss room | 2-4 (+Boss) | 0-1 | Specialized — Boss-only |

**Spacing rules**: Chain objects (same chain) 8-240px apart. Different chain objects ≥48px apart. Pushable objects ≥32px from edges. Interactive vs. non-interactive ≥16px apart.

**Four placement principles** (serving Pillar 2):
1. Progressive complexity — first 3 objects form "entry chain" (simple), rest are optimization paths
2. Sight-line priority — ≥2 interactive objects within 60° forward view from entry
3. Depth distribution — objects span ≥50% screen width in room depth
4. Density alternation — dense zones (6-10) alternate with sparse zones (2-4) for breathing room

**Prohibitions**: No purely decorative foreground objects. Max 6 objects in entry sight-line. Chain node objects must have ΔL ≥30 from background.

### 6.4 Environmental Storytelling

**Philosophy**: No dialogue, no cutscenes, no text logs — the ruins tell the story. World-building through environmental clues only, in the same cognitive mode as the core loop (read room → plan chain → execute).

**Five-layer narrative arc**:
- Zones 1-2: Abandoned living spaces. Cracks burst upward from below. Disaster came from below.
- Zones 3-4: Structural reinforcement marks increase. Emergency equipment density spikes. They tried to control it downward — and failed.
- Zones 5-6: Sealed cells, shattered observation windows, escaped containment tanks. It was a lab accident.
- Zone 7: Centripetal structure rupture, energy conduit blowout, molten machinery. Energy burst outward from center.
- Zone 8: Everything reduced to basic geometry — molten metal re-solidified, rock recrystallized. The collapse origin — energy breached physical boundaries here.

**Narrative techniques**:
- **Directional debris**: Fragments >32px have sharp ends pointing away from impact source. Consistent across all zones.
- **Progressive deterioration**: Zone 1-2 (60-70% intact) → 3-4 (40-60%) → 5-6 (20-40%) → 7 (10-20%) → 8 (<10%).
- **Human traces**: Office items (zones 1-2) → abandoned tools/sandbags (3-4) → broken containers/drag marks (5-6) → none (7-8).
- **Warning mark evolution**: Standard industrial (1-2) → density increases + biohazard (3-4) → hand-painted/urgent (5-6) → destroyed/covered (7) → none — language fails here (8).

**Key narrative object**: One per zone — a non-interactive foreground object with +20% fill brightness (no hazard colors) that hints at the zone's story.

### 6.5 Three-Depth Implementation

| Parameter | Fg #1 (Interactive) | Mg #2 (Debris/VFX) | Bg #3 (Atmosphere) |
|-----------|---------------------|--------------------|--------------------|
| Core identity | Interactive physics elements | Destruction context + feedback | Depth and atmosphere |
| Player attention | Primary — chain planning target | Secondary — feedback signal | Passive — ambiance only |
| Interactive | Yes | No | No |
| Physics collision | Full | Fragment physics only (or none) | None |
| Polygons/object | 8-24 vertices | 3-8 vertices | 2-6 vertices |
| Edge lines | 1-4px per material | ≤0.5px or none | None |
| Fill brightness | 30-100% | 40-60% | 35-50% |
| Saturation | 100%(hazard)/80%(other) | 30% | 15% |
| Color temp offset | 0 | +300K cool | +500K cool |
| Responds to Light2D | Yes | No | No |

**Foreground construction**: Every object must embed weight signal in its shape (Section 3.5). Min object size 16×16px for touch. Max 3 stacking layers. No non-interactive objects.

**Midground construction**: Fragments in clusters of 3-6 small polygons, sum ≤30 vertices. Fill from source material, desaturated to 30%. Lifetime 2-3s before alpha→0. Max 20 active fragments at once on mobile.

**Background construction**: ≤6 vertices per object, no edge lines, all angles ≥70°. Fill = F1/F2 at 15% saturation. No sharp angles (≤60°). Five bg types: silhouette ruins, rock strata, structural skeletons, pipe matrices, recrystallized forms.

**Parallax**: Fg 1.0× (camera-locked), Mg 0.3-0.5×, Bg 0.1-0.2×, Sky 0.02-0.05×. Inter-layer ΔL ≥15%.

### 6.6 Per-Zone Visual Differentiation

| Zone | Color Temp | Skyline | Dominant Material | Signature Props | Damage % |
|------|-----------|---------|-------------------|-----------------|----------|
| 1-2 Surface | 5500K | Horizontal, large blocks | Concrete 70% | Office furniture, vent ducts, lamp frames | 60-70% intact |
| 3-4 Underground | 6000K | Low arched, dense pillars | Concrete 50% + Metal 40% | Pipe valves, emergency lights, mine carts | 40-60% intact |
| 5-6 Lab | 5000K | Modular grid, hexagonal partitions | Metal 60% | Broken containers, equipment frames, vent shafts | 20-40% intact |
| 7 Core | 6500K | Centripetal arcs, radial | Metal 70% | Energy conduits, molten units, ring tracks | 10-20% intact |
| 8 Origin | 4500K | Inorganic, flow contours | Special alloy | Molten metal blocks, heat-warped debris, crystal clusters | <10% recognizable |

**Zone transition language**: 1 transition room between zones. Interactive objects suspended during transition, fade in 0.5s after completion. Key transitions: surface→underground (vertical drop + brightness 50%→20%), underground→lab (material shift concrete→metal), lab→core (geometry shift rectilinear→arcs + 5000K→6500K), core→origin (vertical drop + 0.5s temp jump 6500K→4500K + near-blackout 15% brightness → recover to 40%).

**Verification tests per zone**: Grayscale silhouette recognition (1s), color temp read (2s, must match definition), same-game confusion test, chain readability test (≥2 interactive objects + ≥1 chain path in 3s for new player).

---

## 7. UI/HUD Visual Direction

> **Motto**: 「界面即废墟的操作面」—— UI 不是悬浮在游戏上方的另一层软件，而是废墟世界的延伸控制面板。每一个 UI 元素都遵循世界的锐角语言、颜色语义和物理感。

### 7.1 HUD Layout & Element Specification

**Screen zones**: Combat zone (left edge + bottom-right, ~25% width each), Status zone (top strip ≤60px), Transient zone (center 60% — no fixed overlay). Persistent elements: 4 (joystick, fire button, ammo indicator, ammo type icon). All other elements state-dependent.

**Virtual Joystick** (left half-screen, anchored left, center at 18%x/75%y):
- Outer ring: 45° chamfered circle, 8 segments, outer diameter ≥120px, ring width 8px, UI Border `#5C5C5C`, 45% idle / 60% touching
- Center dot: solid circle 16px, UI Highlight `#38C0D4` 60%, 50% idle / 80% touching
- Direction ticks: 4 triangles at N/E/S/W, 8×6px, UI Secondary `#999999`
- Touch maps to movement within 60px dead zone → full speed at ring edge

**Fire Button** (bottom-right, 88%x/82%y):
- 72×72px rounded rect (2px radius), fill `#1A1A1A` 80%, border `#5C5C5C` 4px, 50% idle / 70% touching
- Crosshair icon: concentric circles + 4 cross lines, 24×24px, UI Primary `#F0F0F0`, 100% opaque
- Press: body shifts 2px down+right (mechanical switch depression), cyan overlay 0→100% (0.05s), icon 1.1× pulse
- Single tap = aim+shoot combined (left swipe=move, right tap=aim+shoot)

**HP Display** (diegetic primary, HUD fallback):
- Primarily through visor damage states (Section 5.1): cyan brightness/cracks on character
- HUD HP bar appears only at ≤30% HP: 120×8px chamfered bar, top-center, P1→P3 gradient
- ≤15% HP: vignette darkens to 30%, visor crack overlay `#D4602A` 1px diagonal lines 30-40% screen width

**Ammo Indicator** (bottom-right, 20px above fire button):
- Octagonal border 32×32px, 2px edge `#5C5C5C`
- 8 dots at vertices, 4px each, `#F0F0F0` (loaded) / `#3D3D3D` (empty)
- Empty state: frame pulses 1Hz `#D4602A`

**Chain Counter** (centered, ~40% from top, visible only during chains):
- Broken ring 40px diameter, 4px width, P1 `#38C0D4`→P3 `#FFFFFF` glow, gap expands with chain progress
- Number 28px monospace bold, UI Primary `#F0F0F0`
- Each step: number crossfade (0.08s), ring gap advances (0.1s), splash particles (3-5 diamonds, 0.4s), 1-frame 1.3× scale pulse
- Disappear: holds 0.5s, then shrinks to 0 (0.15s)

**Threat Indicators** (screen edges only when enemy off-screen):
- Equilateral triangle 28px side, 2px edge, fill `#D4602A`, edge `#C23B3B`
- Rotates to point toward enemy. Opacity 60% (far) → 90% (near). Max 3 indicators.
- Imminent indicator: inner white triangle when enemy enters ≤1.5s

**HUD Readability**: Panel bg 30% opaque `#1A1A1A`, text/icons 100% opaque + 4px stroke `#1A1A1A` + 6px outer glow. HUD numbers ≥16sp, menu titles ≥24sp, menu body ≥14sp. Touch targets ≥44×44px (Apple) / ≥48×48px (Android), spacing ≥12px.

### 7.2 Typography System

**Fonts**: Latin: Barlow Condensed (Semi-Bold 600 HUD/menus, Bold 700 titles, Medium 500 body). CJK: Noto Sans SC (Medium 500 HUD/body, Bold 700 titles). Both SIL Open Font License.

**Size tiers** (4px baseline grid):
| Tier | Size | Weight | Use |
|------|------|--------|-----|
| Display | 36-48sp | Bold 700 | Title screen, level title cards |
| Headline | 24-32sp | Semi-Bold 600 / Bold 700 | Menu headers |
| Subhead | 18-20sp | Semi-Bold 600 / Medium 500 | Tab labels, button text |
| Body | 14-16sp | Medium 500 | Settings, descriptions |
| Caption | 12sp | Medium 500 | Subtitles, hints |
| HUD Number | 24-32sp | Bold 700 (tnum) | Chain counter, timer |

**Language mixing**: Chinese = Noto Sans SC, inline English = Barlow Condensed at matching x-height.

### 7.3 Iconography System

**Two styles**: Solid (info icons — closed polygon, solid fill, 1px edge) vs. Outline (guide icons — open stroke, 2px stroke, no fill). Solid = "this is a thing" (stable). Outline = "this is a direction" (dynamic).

**Size grid**: Small 16×16px (badge), Medium 24×24px (ammo/items), Large 32×32px (menu categories), Hero 48×48px (title emblem). 1px inset padding on all sides.

**Construction**: Medium icons ≤8 vertices, Large ≤12. All interior angles ≥45° (solid). Parallel strokes ≥3px apart. Miter corner joins (not round), miter limit 4.

**Key semantic icons**: Ammo types (standard/explosive/corrosive/magnetic = 24×24px solid), Item pickups (HP=circle+cross, Ammo=octagon+dot, 16×16px), Threat (triangle outline), Danger labels (EXP/COR/COL per Section 4.5).

### 7.4 UI Animation Language

**Default curve**: ease-out cubic. Guiding principle: "UI elements feel like physical objects" (Pillar 1).

| Animation | Duration | Curve | Physical Metaphor |
|-----------|----------|-------|-------------------|
| Button press | 0.05s | Linear | Switch breaks contact |
| Button release | 0.1s | Ease-out cubic | Spring returns |
| Panel slide in | 0.25s | Ease-out cubic, 5% overshoot | Drawer with momentum |
| Panel slide out | 0.15s | Ease-in cubic | Drawer slammed shut |
| Fade in/out | 0.15s/0.1s | Ease-out/Ease-in | Light switching |
| Scale pop | 0.2s | Overshoot 15%, settle | Rubber band snap |
| Tab switch slide | 0.2s | Ease-out cubic | Sliding bolt lock |
| Error shake | 0.3s | 4 cycles, amp 4→1px | Physical rattle |

**Button press model**: Idle → Press (2px down+right, inner shadow `#000000` 40%, cyan overlay 100%, 0.05s) → Release (spring back, 1px overshoot, 0.1s). The 2px depression mirrors hit-stop — a button press has weight, like a bullet impact.

**Transient element rules**: No blink/flash during active chain execution. Chain counter step pulse is 1-frame scale change (not brightness flash). Threat indicators hold steady opacity.

### 7.5 Menu Screen Design

**Tab-based navigation** (tabs = 45° chamfered hexagons, 64×36px). Bottom tabs bar, 3-5 tabs. Tab indicator: 2px `#38C0D4` line below selected. Content slides horizontally 0.2s with crossfade.

**Title Screen**: Slow parallax ruin background (3 depth layers, <5px/s motion). Title "坍塌禁区" 48sp Bold, character "坍" has one stroke in H1 Blast Orange `#E87D2A`. Buttons: START (primary, 200×56px, cyan edge pulse 1Hz), LEVELS, SETTINGS, CREDITS. Floating polygon fragments (3-5, 3-5 vertices, 20% opacity). Enter: 0.8s fade from black, staggered button slide-up.

**Level Select**: 2-column scrollable card grid (140×160px cards). Each card: thumbnail (top 60%), level number (36sp), level name (18sp), star rating (3 max, 12×12px, `#E8B82A`). Locked cards: grayscale + lock icon overlay. Card top-edge 4px strip tinted to zone color temp.

**Settings**: Single-column scrollable list, 56px rows. Toggle: 45° chamfered hexagonal switch 48×28px. Slider: 120×6px track + 24×24px knob (10 steps). Groups: Audio, Visual (Reduce Motion), Accessibility, Language, Controls, Credits, Reset Progress (danger button).

**Pause Menu**: Full-screen `#000000` 50% overlay over frozen scene. Options (centered vertical): RESUME (cyan pulse), RESTART ROOM (`#D4602A` warning), SETTINGS, QUIT TO MENU (danger trapezoid). Confirmation dialog: `#1A1A1A` 90%, 120×80px.

### 7.6 Accessibility Integration

**Reduce Motion toggle** (Settings → Visual): Disables screen shake, hit-stop (0 frame pause), slow-motion death, strobing flash (→+10% bloom), pulse/breath animations (→static midpoint), parallax motion (→static bg). Fallbacks: chain step = static brightness pulse, damage = 0.15s red vignette, enemy pulse = constant mid-glow.

**Font Scaling** (100%/150%/200%): All text via Godot Theme multiplier. 150%: settings rows 72px, cards single-column. 200%: all panels single-column, tabs truncate, HUD overlap → customizable layout.

**Colorblind Label Mode**: 2-3 char labels (EXP/COR/COL/AMMO/HEAL) in 10sp Caption + 4px stroke above key elements, with matching 16×16px solid icon. Fixed 16sp (not affected by font scaling).

**Haptic Feedback** (Core Haptics iOS / Vibrator Android):
| Event | Pattern | Duration |
|-------|---------|----------|
| UI tap | Light (intensity 0.3) | 10ms |
| Fire | Medium click (0.6) | 20ms |
| Bullet impact | Sharp thud (0.5) | 15ms |
| Heavy impact | Heavy thud (0.8) | 30ms |
| Chain step | Quick double-tap (0.4→0.6) | 40ms |
| Chain complete | Rising buzz (0.3→0.7) | 100ms |
| Death | Long descending (0.7→0.1) | 500ms |

Haptics remain active when Reduce Motion is on (haptics ≠ visual motion). Hit-stop haptic reduced from 0.9 to 0.4 with Reduce Motion.

---

## 8. Asset Standards

> **Principle**: All visual assets use Godot-native formats only. Zero external image files. Zero textures. All visuals = Polygon2D fills + Line2D edges (or Polygon2D.border) + ShaderMaterials.

### 8.1 File Formats

**Allowed**: `.tscn` (scenes), `.tres` (resources — palettes, physics maps, themes, animations), `.gdshader` / `.gdshaderinc` (shaders).

**Forbidden**: `.png`, `.jpg`, `.webp`, `.svg`, `.glb`, `.gltf`, `.obj`, `.fbx`, `.dae`, `.otf`/`.ttf` embedded in scenes (use Theme .tres instead).

**Scene rules**: One logical entity per scene. Nesting depth ≤3. Root node name = file name. Inline resources for single-use; shared resources as external `.tres` with `preload()`.

### 8.2 Naming Conventions

**Scenes**: `[category]_[object]_[variant]_[lod].tscn`
- category: `char`, `env`, `ui`, `vfx`, `prop`, `room`
- Examples: `char_player_idle_lod0.tscn`, `env_barrel_explosive_lod1.tscn`

**Scripts**: Match scene name (if scene-specific) or PascalCase short description (`PhysicsManager.gd`).

**Resources**: Prefix by type — `palette_`, `physmap_`, `theme_`, `animlib_`.

**Shaders**: `shd_[effect].gdshader` or `shdlib_[library].gdshaderinc`.

**CanvasLayer naming**: `CanvasLayer_Bg`, `CanvasLayer_Mg`, `CanvasLayer_Fg`, `CanvasLayer_Vfx`, `CanvasLayer_Hud`, `CanvasLayer_Menu`.

### 8.3 Resolution Tiers

- **Base Design Resolution**: 1920×1080, aspect 16:9 letterbox
- **Scale Mode**: `canvas_items`, basis = shortest edge
- **UI Scale**: Small phone (<360px) 0.85×, Regular (360-430px) 1.0×, Large (>430px) 1.15×
- **Safe area**: 16px inset for HUD, 24px for menus (respecting `DisplayServer.screen_get_usable_rect()`)
- All visual assets are vectorized polygons — resolution-independent by design

### 8.4 Vertex Budgets (Mobile)

**Global per-frame**: Total ≤1,200 vertices, Draw Calls ≤50, Fg ≤600, Mg ≤300, Bg ≤300, VFX ≤150.

| Category | LOD0 | LOD1 | LOD2 | LOD3 |
|----------|------|------|------|------|
| Player | ≤24 | ≤18 | ≤10 | ≤5 |
| Basic Enemy | ≤16 | ≤12 | ≤8 | ≤4 |
| Heavy Enemy | ≤20 | ≤15 | ≤10 | ≤5 |
| Flying Enemy | ≤18 | ≤14 | ≤8 | ≤4 |
| Boss (visual) | ≤60 | ≤40 | ≤24 | ≤10 |
| Boss (collision) | ≤12 | — | — | — |
| Foreground interactive | 8-24 | 6-16 | 4-10 | 2-5 |
| Midground fragment | 3-8 | — | — | — |
| Background object | 2-6 | — | — | — |

**LOD switch distances** (based on screen height): LOD0→LOD1 at <120px, LOD1→LOD2 at <60px, LOD2→LOD3 at <30px.

**Critical**: Collision shapes use simplified convex hulls (≤12 vertices). Visual polygon ≠ collision polygon. Use `Polygon2D.border_width` + `border_color` instead of separate `Line2D` nodes to reduce Draw Calls.

### 8.5 Godot 4.6 Export Settings

| Parameter | iOS | Android |
|-----------|-----|---------|
| Target Arch | arm64 | arm64-v8a |
| Renderer | Mobile | Mobile |
| Shader Baker | ON (mandatory) | ON (mandatory) |
| GDScript Bytecode | ON | ON |
| Optimization | Size | Size |
| Min SDK | — | 28 (Android 9) |
| Physics FPS | 60 | 60 |

**Renderer note**: Mobile renderer has limited `WorldEnvironment.glow` and `ColorCorrection.Temperature` support. All glow/color-temp effects implemented via custom `ShaderMaterial` on Polygon2D layers, not via WorldEnvironment. WorldEnvironment used only for basic tone mapping + contrast.

### 8.6 Physics Constraints (Jolt 2D via GodotPhysics2D)

- Active RigidBody2D ≤20 simultaneously (fragments strip collision after 0.3s, switch to GPU particles or static Polygon2D)
- Fragments use GPU particles (`GpuParticles2D`) for visual motion — not physics engine
- Collision shapes: prefer `CircleShape2D`/`RectangleShape2D`/`CapsuleShape2D`; `ConvexPolygonShape2D` ≤12 vertices; NO `ConcavePolygonShape2D` on mobile
- Single chain ≤8 steps, explosion radius ≤240px, object spacing ≥8px
- Physics layer: 8-bit collision matrix defined in project settings `physics/2d/layers`

### 8.7 Color Palette Enforcement

Centralized resource: `res://assets/data/palette_main.tres` — defines all 9 approved colors as `@export var Color`.

**Three enforcement layers**:
1. Compile-time: `palette_validator.gd` tool script scans all `.tscn`/`.tres`/`.gd` for non-palette color values
2. Debug runtime: asserts `is_color_approved()` per frame (dev builds only)
3. CI grayscale gate: auto-screenshot → grayscale → verify ΔL ≥30 layer separation

**Allowed color deviations**: Shader dynamic effects (brightness ±15%, hue shift 0), weathering noise (brightness ±5%, saturation ±5%, F1/F2/F3 only), edge rust (hue shift toward orange ≤15°, metal objects only), background desaturation (to 15% saturation).

### 8.8 Z-Index Compression (Draw Call Optimization)

Original 11-layer system compressed to 6 batch-friendly layers:

| Layer | Z Range | Content |
|-------|---------|---------|
| World | 0 | WorldEnvironment, static collision |
| Background | 16-48 | Sky(16) + Parallax(32) + Bg(48) |
| Midground | 64 | Fragment groups |
| Foreground | 80 | All interactive objects (same Z, same material) |
| Characters | 96-100 | Enemies(96) + Player(100) |
| VFX | 110 | Chain traces, shockwaves, particles |

UI on independent CanvasLayer (Z:100 in screen-space). All objects sharing same material + Z render in single Draw Call. Target: ≤16-18 Draw Calls per frame.

### 8.9 Quality Gates (15 Checks)

**Blocking (must pass before merge)**:
- GP-1: Palette compliance (automated scan)
- GP-2: Grayscale distinguishability ΔL ≥30 (CI)
- GP-3: Vertex budget within limits (debug runtime)
- GP-4: Naming convention compliance (CI regex)
- GP-5: Scene root name = file name, depth ≤3 (CI)
- GP-6: Zero texture references (CI — no `Texture2D` in scene)
- GP-7: Physics layer assignment correct (debug runtime)
- GP-8: Touch target ≥44px, min object size ≥16px (CI)
- GP-14: Collision shape center vs. visual center deviation ≤4px (debug)
- GP-15: No external image file references (CI)

**Advisory (flag but don't block)**:
- GP-9: LOD0-3 completeness
- GP-10: Animation track count ≤10
- GP-11: UI doesn't use exact H1/H2/H3 hex values
- GP-12: Colorblind backup channels present (manual review)
- GP-13: Single scene ≤50KB, single shader ≤20KB

**Merge pipeline**: Format check → Color compliance → Physics validation → Performance check → Grayscale+touch test → Colorblind review (manual sign-off) → Merge to main.

### 8.10 Engine Conflicts Resolved

The following art bible rules have adjusted implementation per Technical Artist review (visual intent unchanged):

| Art Bible Rule | Original Method | Adjusted Method | Reason |
|---------------|----------------|-----------------|--------|
| Edge lines (Section 3.4, 6.2) | Separate `Line2D` per object | `Polygon2D.border_width` + `border_color` | Reduce Draw Calls (16 → 1) |
| Glow/Bloom (Section 2) | `WorldEnvironment.glow` | Custom `ShaderMaterial` off-axis glow | Mobile renderer doesn't support glow reliably |
| Color temp transitions (Section 2) | `WorldEnvironment.ColorCorrection.Temperature` | Custom full-screen `ShaderMaterial` | ColorCorrection limited on Mobile |
| Dust particles (Section 2) | 16×16 sprite | `GpuParticles2D` point rendering (no texture) | Zero-texture compliance |
| Shockwave rings (Section 2) | 64×64 alpha-only sprite | `Polygon2D` + radial gradient `ShaderMaterial` | Zero-texture compliance |
| Fragment physics (Section 6.5) | RigidBody2D for 2-3s | RigidBody2D 0.3s → strip collision → GPU particles | Active physics ≤20 |
| Physics variance (Pillar 3) | Add random variables | GodotPhysics2D natural non-determinism sufficient (10-20%) | Don't add more randomness |
| Z-index hierarchy (Section 5.5) | 11 discrete Z layers | 6 compressed layers | Batch-friendly Draw Call optimization |

---

## 9. Style Prohibitions

> **Purpose**: What this game's art MUST NEVER do. These are the guardrails that prevent visual drift during production.

### 9.1 Shape Prohibitions

- **NO rounded corners** — all corners are sharp (right angle or 45° chamfer). Rounded corners = stability, which contradicts the ruin aesthetic.
- **NO organic curves** in stable structures — curves are reserved for ropes, fractures, shockwaves, and destroyed states only.
- **NO circles** as primary shapes — use hexagons, octagons, or broken rings. Circles = completeness, which contradicts the broken/ruined world.
- **NO decorative shapes** — every polygon must communicate either weight, direction, or hazard type. Purely ornamental geometry is forbidden.
- **NO symmetrical silhouettes for bosses** — asymmetry = vulnerability that can be exploited.

### 9.2 Color Prohibitions

- **NO pure white except on player and hit-stop flashes** — white ≤5% screen area per frame.
- **NO saturated colors in background layer** — Bg #3 saturation permanently capped at 15%.
- **NO hazard colors (H1/H2/H3) in UI elements** — UI warning color is `#D4602A` (hue-shifted to 18°), NOT exact H1 `#E87D2A`.
- **NO new colors outside the 9-color palette** — all 9 hex values are frozen. Any new color requires art bible amendment.
- **NO black (#000000)** — use F3 Deep Gap Black `#2B2B2B` instead. True black creates "void holes" that break the three-depth system.

### 9.3 Texture Prohibitions

- **NO pixel textures** (.png/.jpg/.webp) — zero-texture strategy is absolute. All visuals = polygon fills + edge lines + shaders.
- **NO normal maps, roughness maps, or any PBR textures** — the game is 2D stylized, not physically-based.
- **NO sprite sheets** — each visual element is a self-contained Godot scene with vector geometry.

### 9.4 Animation Prohibitions

- **NO easing on character motion** — stepped animation curves only for character movement (weight feel). Easing reserved for UI transitions.
- **NO idle fidgeting** — no weapon inspection, no head turns, no gear adjustment. Idle = breath cycle only (4 frames max).
- **NO victory celebrations** — room clear is contemplative, not celebratory. No fist pumps, no weapon spins.
- **NO death ragdolls** — death is 3 frames of deliberate visual storytelling, not physics simulation.
- **NO animation exceeding 2 seconds** (except looping idles) — mobile memory constraint.

### 9.5 VFX Prohibitions

- **NO particle textures** — all particles are polygon fragments (3-5 vertices) or GPU point sprites.
- **NO full-screen flash exceeding 2 frames** — single-frame white flash for hit-stop only. No strobe sequences.
- **NO screen shake during chain execution** — shake is per-chain-step, not continuous. Continuous shake causes nausea on mobile.
- **NO additive blending on mobile** — use `MIX` blend mode. Additive blend consumes more GPU on mobile renderers.

### 9.6 UI Prohibitions

- **NO translucent UI text** — all text 100% opaque + 4px stroke + 6px glow. Semi-transparent text is unreadable during combat.
- **NO UI elements in screen center 60% during gameplay** — that zone belongs to the physics arena.
- **NO pop-up tutorials** — all teaching through environment design and the 3 tutorial rooms (Section 3.5).
- **NO "PRESS START" flashing text** — all UI animation must follow the physical-material language. No arcade-era blinking.

### 9.7 Reference Prohibitions

- **DO NOT copy Contra's enemy density** — 坍塌禁区 is NOT a bullet hell. Enemy count per room is low; threat comes from physics complexity.
- **DO NOT copy Noita's pixel-sim granularity** — every pixel is NOT simulated. Physics works at the object level, not the pixel level.
- **DO NOT copy Teardown's fully destructible everything** — only designated interactive objects can be destroyed. Background structures are permanent.
- **DO NOT copy Dead Cells' biome variety** — 8 zones share one coherent architectural language. Visual variety comes from deterioration level and color temp, not from entirely different art styles per zone.
- **DO NOT reference anime, comic book, or cartoon styles** — the visual language is industrial/architectural. No cel shading, no exaggerated expressions, no chibi proportions.

---
