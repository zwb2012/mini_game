# 无障碍要求：[Game Title]

> **状态**：Draft|Committed|Audited|Certified
> **作者**：[ux-designer / producer]
> **最后更新**：[Date]
> **无障碍层目标**：[Basic / Standard / Comprehensive / Exemplary]
> **平台**：[PC / Xbox / PlayStation 5 / Nintendo Switch / iOS / Android]
> **针对的外部标准**：
> - WCAG 2.1 级别[A / AA / AAA]
> - AbleGamers CVAA 指南
> - Xbox 无障碍功能指南 (XAG)[Yes / No / Partial]
> - PlayStation 无障碍功能（索尼指南）[Yes / No / Partial]
> - Apple / Google 无障碍功能指南[Yes / No / N/A — mobile only]
> **解决顾问**：[Name and organization, or "None engaged"]
> **链接文档**：`design/gdd/systems-index.md`、`docs/ux/interaction-pattern-library.md`

> **为什么存在此文档**：每屏幕无障碍功能注释属于
> 用户体验规格。本文件涵盖了项目范围内的无障碍承诺，
> 所有系统的功能矩阵、测试计划和审核历史记录。
> 它由 UX 设计师和制作人在技术设置期间创建一次，
> 然后随着功能的添加和审核的完成而更新。如果有一个功能
> 与此处所做的承诺相冲突，本文档胜出 - 更改功能，
> 不是承诺，除非生产者批准正式修订。
>
> **何时更新**：在每次`/gate-check`通过之后，在任何可访问性之后
> 审核，以及每当新的游戏系统添加到`systems-index.md`时。

---

## 无障碍等级定义

> **为什么要定义层级**：可访问性不是二元的。定义四层给出
> 团队共享词汇，迫使在开始时做出明确的承诺
> 生产，并防止范围在两个方向上蔓延（“我们稍后会添加它”
> 和“我们必须支持一切”）。以下各层是该项目的
> 定义——行业使用相似但不相同的语言。致力于
> 具有特定功能目标的层，而不仅仅是层名称。

### 等级定义

| 等级 | 核心承诺 | 典型的努力 |
|------|----------------|----------------|
| **Basic** | 面向玩家的关键文本在标准分辨率下可读。No功能仅需要颜色辨别。音乐、SFX 和语音的音量控制独立存在。游戏可以完成，没有光敏风险。 | Low— 主要是设计限制 |
| **Standard** | 所有Basic，加上：所有平台上的完整输入重新映射、具有说话者识别功能的字幕支持、可调整文本大小、至少一种色盲模式，以及无法扩展或切换的定时输入。 | Medium— 需要专门的实施工作 |
| **Comprehensive** | 所有Standard，加上：菜单的屏幕阅读器支持、单声道音频选项、难度辅助模式、HUD 元素重新定位、简化运动模式以及所有游戏关键音频的视觉指示器。 | High— 需要平台 API 集成和重要的 UI 架构 |
| **Exemplary** | 所有Comprehensive，加上：完整的字幕自定义（字体、大小、颜色、背景、位置）、高对比度模式、认知负荷辅助工具、所有纯音频提示的tactile/haptic替代品以及外部第三方可访问性审核。 | Very High— 需要专门的无障碍预算和专家咨询 |

### 本项目的承诺

**目标层**：[Standard]

**理由**：[写 3-5 个句子来证明该层选择的合理性。不要简单地
陈述层次——解释理由。考虑：游戏的类型是什么以及
它如何映射到常见的可访问性障碍（e.g.，快速抽搐游戏有
运动障碍；阅读量大的游戏有视觉障碍）？目标是谁
球员以及研究对该群体中残疾患病率的看法如何？
平台要求是什么（Xbox 要求 ID@Xbox 符合 XAG）？
团队能力如何？降低一层会导致玩家基础损失多少，
具体来说？

示例：“这是一款针对玩家的叙事角色扮演游戏，具有回合制战斗
25-45。回合制结构消除了常见的最严重的运动障碍
在动作游戏中，但大量阅读的设计创造了显着的视觉效果和
认知障碍。Standard层解决了所有这些问题。Exemplary层不是
老年专门的退役工程师即可实现。 Xbox ID@Xbox 计划
要求游戏Pass考虑 XAG 合规性，Standard满足该要求。
下降到Basic将排除依赖色盲模式或输入的玩家
重新映射，根据AbleGamers数据估计目标受众的比例为8-12%。”]

**范围内明确的功能（超出层基线）**：
- [e.g., “字幕定制——从全面升级，因为我们的全面
  游戏以对话为主，字幕是主要渠道”]
- [e.g., "One-hand mode for controller — we have hold inputs critical to combat"]

**功能明确超出范围**：
- [e.g., “游戏内世界的屏幕阅读器（不是菜单）——需要引擎工作
  超出当前能力。记录在已知的有意限制中。”]

---

## 视觉无障碍

> **为什么本节排在第一位**：视觉障碍影响最大
> 使用无障碍功能的玩家比例。色觉缺陷
> 仅此一项就影响了大约 8% 的男性和 0.5% 的女性。文本清晰度为
> 电视观看距离往往是最大的无障碍障碍
> 在已发行的游戏中。在实施开始之前记录每个视觉特征，
> 因为在资产被修改后，需要修改最小文本大小或颜色决策
> 锁起来很贵。

| 特征 | 目标层 | 范围 | 地位 | 实施说明 |
|---------|-------------|-------|--------|---------------------|
| 最小文本大小 — 菜单 UI | Standard | 所有菜单屏幕 | Not Started | 1080p时最小24像素。在4K下，按比例缩放。参考：WCAG 2.1 SC 1.4.4 要求文本大小调整至200%，且不丢失内容。 |
| 最小文字大小 - 字幕 | Standard | 所有voiced/captioned内容 | Not Started | 1080p 时最小 32 像素。玩家在 3m 处观看电视是一个限制。 |
| 最小文字大小 — HUD | Standard | 游戏内HUD | Not Started | 关键信息（生命值、弹药、目标）至少 20 像素。非关键 HUD 元素可能更小。 |
| 文本恢复 - UI 背景文本 | Standard | 所有用户界面文本 | Not Started | 正文比例为4.5:1 (WCAG AA)。3:1至少适用于大文本（18像素+或14像素粗体）。使用自动获取检查器测试最终颜色值。 |
| 文字对比——字幕 | Standard | 字幕显示 | Not Started | 字幕比例最低为 7:1 (WCAG AAA) — 玩家可以快速阅读字幕，并且无法控制背景。默认情况下使用投影或不透明背景框。 |
| 色盲模式 — 红色盲 | Standard | 所有颜色编码的游戏 | Not Started | 红绿色——影响约6%的男性。主要关注点：生命值条、敌人指标、地图标记。将红色信号移至橙色/黄色；将绿色信号转变为青色。 |
| 色盲模式——绿色盲 | Standard | 所有颜色编码的游戏 | Not Started | 绿色红色——影响约1%的男性。实际上红色与盲类似。通常用相同的调色板调整头部混合。使用Coblis或色盲模拟器进行效果验证。 |
| 色盲模式——蓝色盲 | Standard | 所有颜色编码的游戏 | Not Started | 蓝黄色 — 较稀有（~0.001%）。将蓝色 UI 元件变为紫色；将黄色变为橙色。 |
| 颜色作为唯一指标的审核 | Basic | 所有用户界面和游戏玩法 | Not Started | 下表中列出的每个地方的颜色是唯一的区别因素。每个产品在发货前都必须有非彩色备份（图标、形状、图案、文本标签）。 |
| 用户界面缩放 | Standard | 所有用户界面元素 | Not Started | 范围：75% 至 150%。默认值：100%。缩放不能破坏布局 - 以最小化和最大测试所有屏幕。HUD 缩放应独立于菜单缩放。 |
| High对比度模式 | Comprehensive | 菜单（最少）；平视显示器（首选） | Not Started | 将所有半透明背景替换为完全不透明。将中间色调 UI 颜色替换为black/white/system-high-contrast颜色。概述了所有交互元素。 |
| Brightness/gamma控制 | Basic | 全球的 | Not Started | 在图形设置中公开。包括参考校准图像（正确校准时几乎看不见的渐变或符号）。范围：默认值的 -50% 到 +50%。 |
| 屏幕闪烁/频闪警告 | Basic | 所有过场动画、视觉特效 | Not Started | (1) 发射前报警屏幕，带有光敏捕捉通知。 (2) 根据 Harding FPA 标准审核所有闪光闪光的 VFX（其中谐波阈值的峰值闪光次数不超过 3 次）。 (3) 任选：闪光闪光模式，闪光幅度降低 80%。 |
| Motion/animation还原模式 | Standard | 所有 UI 转换、相机抖动、VFX | Not Started | 减少或消除：屏幕抖动、相机抖动、运动模糊、菜单中的视差滚动、循环背景动画。无法完全消除：玩家移动动画（会破坏可读性）。切换无障碍功能设置。 |
| 字幕 —on/off | Basic | 所有有声内容 | Not Started | 默认值：关闭（行业标准 - 许多玩家更喜欢沉浸感）。首次推出时就突出显示。 |
| 字幕 — 说话者识别 | Standard | 所有有声内容 | Not Started | 发言者姓名显示在对话行之前。按说话者进行颜色编码 IF 颜色的差异不仅仅是色调（色盲兼容性测试）。 |
| 字幕——风格定制 | Comprehensive | 字幕显示 | Not Started | 字体大小（至少 4 种大小）、背景不透明度 (0–100%)、文本颜色（白色/黄色/自定义）、位置（底部/顶部/相对于玩家）。 |
| 字幕 — 音效字幕 | Comprehensive | 游戏关键的音效 | Not Started | 请参阅 SFX 资格的“听觉无障碍功能”部分。格式：括号中的[SOUND DESCRIPTION]，与对话不同。 |

### 颜色作为唯一指标审核

> 填写当前以颜色为唯一的每个游戏或 UI 元素
> 差异化因素。在发货前解决每个问题。已解析的条目具有非颜色
> 备份适用于上述所有三种色盲模式。

| 地点 | 颜色信号 | 它传达什么信息 | 非彩色备份 | 地位 |
|----------|-------------|---------------------|-----------------|--------|
| [Health bar] | [Red = low health] | [Player is near death] | [Bar also shows numeric value and flashes] | [Not Started] |
| [Minimap markers] | [Red = enemy, green = ally] | [Unit allegiance] | [Enemy markers are triangles; ally markers are circles] | [Not Started] |
| [Inventory item rarity] | [Color-coded border (grey/blue/purple/gold)] | [Item quality tier] | [Rarity name shown on hover/focus; icon star count] | [Not Started] |
| [Add row for each color-coded element] | | | | |

---

## 电机无障碍功能

> **为什么电机可达性对游戏很重要**：游戏对电机的要求更高
> 比大多数软件。网络表单需要精确的点击；游戏可能需要
> 快速同时按钮组合保持特定的持续时间。发动机
> 损伤范围很广——从震颤（影响精度）到
> 偏瘫（一只功能性手）与 RSI（影响保持时间）。游戏玩家
> Able Assistance 计划估计美国有 3500 万游戏玩家患有残疾
> 影响他们的比赛能力。以下许多功能的成本都非常低
> 如果从一开始就有计划就需要实施，并且在发布后添加的成本非常昂贵。

| 特征 | 目标层 | 范围 | 地位 | 实施说明 |
|---------|-------------|-------|--------|---------------------|
| 完整输入重新映射 | Standard | 所有游戏输入、所有平台 | Not Started | 默认情况下绑定的每个输入都必须是可重新绑定的。重新映射独立地应用于键盘、鼠标、控制器和任何支持的外围设备。No两个操作可以同时绑定到同一输入（冲突时发出警告）。坚持重新映射到玩家档案。 |
| 输入法切换 | Standard | 个人电脑 | Not Started | 玩家必须能够随时在keyboard/mouse和游戏手柄之间切换，而无需重新启动。 UI 必须动态更新提示（显示活动输入法的正确按钮图标）。 |
| 单手模式 | [Tier] | [Identify which features require two simultaneous hands] | Not Started | 审核每个多输入操作。对于每一个：可以单手执行吗？如果没有，请提供切换替代方案或按住切换版本。在此指定哪些要素具有单手路径，哪些要素没有。 |
| 按住按钮的替代方案 | Standard | 所有保持输入 | Not Started | 每个“保持[button]到[action]”必须提供一个切换选项。切换模式：第一次按下激活，第二次按下关闭。示例：“按住冲刺”成为可选的“切换冲刺”模式。此时启动游戏中的所有保持输入。 |
| 快速输入替代方案 | Standard | 任何按钮组合/快速输入序列 | Not Started | 任何需要每秒持续按下 3 次以上的输入都必须提供单按切换替代方案。例如：哈迪斯的“按住反复冲刺”就优雅地解决了这个问题。 |
| 输入时序调整 | Standard | QTE、定时按钮按下、节奏输入 | Not Started | 在无障碍功能设置中提供计时窗口乘数。最小范围：0.5x 至 3.0x。默认值：1.0x。在 3.0x 下，500ms 的窗口变为 1500ms。记录该游戏中的每个定时输入并测试所有乘数值。 |
| 瞄准辅助 | Standard | 所有远程战斗/瞄准 | Not Started | 不仅仅是开/关—提供精度：辅助强度（0–100%）、辅助补充、瞄准磁力（捕捉到目标）和瞄准监视（接近目标目标）作为单独的调谐。默认值应该调整为有帮助，而不是干扰。 |
| 自动冲刺/移动辅助 | Standard | 运动系统 | Not Started | “按住冲刺”切换（如上所述）。另外：自动运行选项（按住方向，玩家无需输入即可继续）。指定在正常游戏中持续保持的任何移动输入。 |
| 平台化/穿越辅助 | [Tier] | [If game has platforming] | Not Started | 评估自动提取（宽容的边缘抓取检测）、土狼时间延长和跳跃高度调整是否适合该游戏的设计。如果平台不是游戏系统，请标记N/A。 |
| HUD 元素重新定位 | Comprehensive | 所有 HUD 元素 | Not Started | 允许玩家将生命条、小地图和任务追踪器移动到他们喜欢的屏幕位置。对于使用头部追踪或眼睛注视硬件的玩家来说尤其重要，因为他们的周边视觉覆盖范围可能会减少。 |

---

## 认知无障碍

> **为什么认知可及性经常被低估**：认知可及性
> 影响患有多动症、阅读障碍、自闭症谱系疾病、后天性大脑的玩家
> 受伤和焦虑症——总人数比许多工作室还要多
> 意识到。它还对处于高压力时刻的所有玩家都有好处。最常见的
> 失败的地方是：没有任何暂停，教程信息只能看到一次，
> 以及需要跟踪太多同时状态的系统。类似游戏
> 哈迪斯和塞莱斯特已经证明了认知辅助选项（上帝模式、
> 持续提醒、扩展文本显示）不会损害体验
> 不使用它们的玩家。

| 特征 | 目标层 | 范围 | 地位 | 实施说明 |
|---------|-------------|-------|--------|---------------------|
| 难度选项 | Standard | 所有游戏难度参数 | Not Started | 尽可能使用单独的颗粒状滑块（造成的伤害、收到的伤害、敌人的攻击、敌人的速度），而不是单个Easy/Normal/Hard标签。记录哪些参数是可调整的，哪些是固定的。固定参数需要设计合理性。 |
| 随处暂停 | Basic | 所有游戏状态 | Not Started | 玩家必须能够在任何游戏状态下暂停，包括过场动画、对话和教程序列。记录当前阻止暂停的任何状态以及该限制的设计理由。任何限制都是有风险的。 |
| 教程坚持 | Standard | 所有教程和帮助文本 | Not Started | 关闭教程提示后，玩家必须能够从菜单中的“帮助”部分检索它。不要指望玩家在第一次遇到时就吸收教程——AbleGamers 的研究表明，许多玩家本可以忽略提示。 |
| 任务/目标明确性 | Standard | 任务和目标系统 | Not Started | 在游戏过程中，必须随时按 2 次按钮即可访问当前活动目标。根据需要显示完整的目标文本，而不仅仅是截断的标记。避免需要推理的目标（“调查北部地区”——到底在哪里？）。 |
| 仅音频信息的视觉指示器 | Standard | 所有携带游戏信息的 SFX | Not Started | 审核传达游戏关键状态的音效。对于每个：是否有视觉上的标价物？定向每个音频（屏幕瞄准的敌人）都需要屏幕边缘。关键警告（Boss阶段转换、陷阱触发等）需要视觉提示。请参阅听觉无障碍功能以获取完整列表。 |
| UI 的阅读时间 | Standard | 所有自动关闭对话框 | Not Started | 包含可操作信息的无对话框、通知或工具提示可能会在 5 秒内自动关闭。首选：根本不自动关闭——需要玩家确认。这里记录每个自动删除元素及其当前持续时间。 |
| 认知负荷文档 | Comprehensive | 每场比赛系统 | Not Started | 对于系统-index.md中的每个系统，记录它要求玩家同时跟踪的最大数量。下面标记数量超过 4 的任何系统。这不是一个硬性规则，而是一个审查负担——高认知负载系统需要补偿 UI 进程。请参阅按功能可访问性矩阵。 |
| 导航辅助 | Standard | 世界导航 | Not Started | 快速旅行（到之前访问过的地点），当前目标的航路点系统，可选的目标指示器始终可见。记录其中哪些适用于该游戏的设计以及哪些被有意省略。 |

---

## 听觉无障碍

> **为什么即使对于没有听力损失的玩家来说，听觉可达性也很重要**：
> 7% 的玩家耳聋或有听力障碍。此外，很大一部分
> 玩家经常在音频减少或没有音频的环境中进行游戏（通勤、
> 共享家庭、婴儿睡眠）。传递的任何游戏关键信息
> 即使在考虑可访问性之前，仅通过音频也是一种设计失败。
> 指导原则：每一个声音都会改变玩家下一步应该做什么
> 必须有一个视觉上的等价物。

| 特征 | 目标层 | 范围 | 地位 | 实施说明 |
|---------|-------------|-------|--------|---------------------|
| 所有对话都有字幕 | Basic | 所有有声内容 | Not Started | 100%覆盖率——无一例外。包括旁白、发动机内对话、从远处听到的广播/环境对话。根据配音时间测试字幕同步。 |
| 游戏关键 SFX 的隐藏式字幕 | Comprehensive | 已确定的 SFX 列表（如下） | Not Started | 并非所有 SFX 都需要字幕——只有那些传送玩家无法通过视觉推断状态的字幕。请参阅下面的 SFX 审核表。 |
| 单声道音频选项 | Comprehensive | 全局音频输出 | Not Started | 将stereo/spatial音频折叠为单声道。保持通道之间的音量平衡，而不是在两侧加总音量。对于单侧耳聋的玩家来说至关重要。 |
| 独立音量控制 | Basic | 音乐/SFX/语音/UI 音频总线 | Not Started | 至少四个独立滑块。坚持玩家档案。范围：0–100%，默认 80%。在主设置和暂停菜单中均显示。 |
| 定向音频的视觉表示 | Comprehensive | 所有屏幕外的威胁和音频事件 | Not Started | 屏幕边缘指示器指向音频源。不透明度随音量变化（越近=越不透明）。两种变体：威胁指示器（红色）和信息指示器（中性）。示例：《最后生还者第二部分》使用屏幕边缘指示器来指示屏幕外的敌人位置。 |
| 助听器兼容模式 | Standard | High- 频率音频提示 | Not Started | 审核所有音频提示的频率范围。任何仅通过高频声音（4kHz 以上）传达关键信息的提示必须具有低频或视觉等效项。助听器通常会过滤高频。 |

### 游戏玩法关键 SFX 审核

> 识别传达玩家需要采取行动的状态的每个音效。
> 此表中的每个条目都需要经过确认的视觉备份或标题。

| 音效 | 它传达什么信息 | 可视化备份 | 需要说明文字 | 地位 |
|-------------|---------------------|--------------|-----------------|--------|
| [Enemy attack windup sound] | [Incoming damage — player should dodge] | [Enemy animation telegraph visible from all camera angles] | [No — visual is sufficient] | [Not Started] |
| [Trap trigger click] | [Trap is about to fire] | [Not always visible depending on camera angle] | [Yes — "[CLICK]"带着方向的标题] | [Not Started] |
| [Low health heartbeat] | [Player health critical] | [Health bar also shows critical state visually] | [No — visual is sufficient] | [Not Started] |
| [Quest completion chime] | [Objective completed] | [Quest tracker updates visually] | [No — visual is sufficient] | [Not Started] |
| [Add each SFX that changes what the player should do] | | | | |

---

## 平台无障碍功能 API 集成

> **为什么存在此部分**：每个平台都提供本机无障碍功能 API
> 使用时，允许操作系统级功能（系统屏幕阅读器、显示
> 住宿、汽车无障碍服务）来配合您的游戏。忽略
> 这些API不会破坏游戏，但它意味着玩家依赖操作系统级别
> 辅助工具在游戏中不会从中受益。特别是Xbox
> 需要 XAG 合规性才能进行认证。之前验证平台要求
> 致力于一个层级——平台要求设定了一个下限，而不是上限。

| 平台 | API /Standard | 特点Planned | 地位 | 笔记 |
|----------|---------------|-----------------|--------|-------|
| Xbox (GDK) | Xbox 游戏核心无障碍功能 / XAG | [Input remapping via Xbox Ease of Access, high contrast support, narrator integration for menus] | Not Started | ID@Xbox 游戏通行证考虑需要满足 XAG 要求。在https://docs.microsoft.com/gaming/accessibility/guidelines查看XAG清单中 |
| 游戏机5 | 索尼无障碍功能指南 / AccessibilityNode API | [Screen reader passthrough for menus, mono audio, high contrast] | Not Started | 如果游戏在 UI 元素上公开 AccessibilityNode 数据，PS5 原生支持系统级音频描述和单声道音频。 |
| 蒸汽（电脑） | Steam 无障碍功能 / SDL | [Controller input remapping via Steam Input, subtitle support] | Not Started | Steam 输入允许独立于游戏内重新映射的系统级重新映射。keyboard/mouse仍需要游戏内重新映射。 |
| iOS系统 | UI无障碍功能/旁白 | [VoiceOver support for menus if mobile port planned] | N/A | 仅当移动版本在范围内时才需要。 |
| 安卓 | 无障碍服务/TalkBack | [TalkBack support for menus if mobile port planned] | N/A | 仅当移动版本在范围内时才需要。 |
| 电脑（屏幕阅读器） | JAWS / NVDA / Windows 讲述人 | [Menu navigation announcements] | Not Started | 要求 UI 元素通过平台 UI 层公开可访问的名称和角色。Godot 4.5+ AccessKit 集成内容讲述了支持的控件类型的这一点。根据引擎-reference/godot/ 文档进行验证。 |

---

## 每个功能的可访问性矩阵

> **为什么存在这个矩阵**：无障碍功能不是设置列表 - 它是一个
> 每个游戏系统的属性。该矩阵创建了“可访问性影响”
> 游戏观点：哪些系统有哪些障碍，以及是否存在这些障碍
> 已解决。当新系统添加到系统-index.md时，必须添加一行
> 添加到这里。如果系统存在未解决的可访问性问题，则不能
> 在系统索引中标记为Approved。

| 系统 | 视觉问题 | 电机问题 | 认知问题 | 听觉问题 | 已解决 | 笔记 |
|--------|----------------|---------------|-------------------|------------------|-----------|-------|
| [Combat System] | [Enemy health bars are color-coded; attack animations may cause motion sickness] | [Rapid input required for combos; hold inputs for guard] | [Track enemy patterns + cooldowns + player resources simultaneously] | [Audio cues for off-screen attacks; critical damage warning sounds] | [Partial] | [Colorblind palette applied; hold-to-block toggle needed] |
| [Inventory / Equipment] | [Item rarity conveyed by border color] | [No motor concerns — turn-based] | [Item stats comparison requires reading multiple values] | [None — no critical audio in this system] | [Partial] | [Non-color rarity indicators in progress] |
| [Dialogue System] | [Subtitle display depends on contrast settings] | [No motor concerns] | [Long dialogue trees with time pressure on dialogue choices] | [All dialogue must be subtitled] | [Not Started] | [Timed dialogue choices must support extended timer option] |
| [Navigation / World Map] | [Map marker colors] | [No motor concerns] | [Quest objective clarity; waypoint visibility] | [Audio pings for objectives have no visual equivalent] | [Not Started] | |
| [Add system from systems-index.md] | | | | | | |

---

## 无障碍功能测试计划

> **为什么与 QA 分开测试可访问性**：StandardQA 测试是否
> 功能有效。无障碍功能测试测试功能是否适合玩家
> 谁使用它们。这些是不同的测试。字幕系统可以通过 QA（它
> 显示文本）并且未通过可访问性测试（文本在电视上无法读取）
> 弱视玩家的距离）。规划三种测试类型： 自动化
> （对比度、文字大小），手动内部（团队成员模拟
> 使用无障碍模拟器的障碍）和用户测试（玩家
> 实际使用这些功能）。

| 特征 | 测试方法 | 测试用例 | Pass标准 | 负责任的 | 地位 |
|---------|------------|------------|--------------|-------------|--------|
| 文本对比度 | 自动化 — 所有 UI 屏幕截图上的对比分析工具 | 所有游戏状态下的所有text/background组合 | 所有正文文本≥4.5:1；所有大文本≥3:1；字幕背景≥7:1 | 用户体验设计师 | Not Started |
| 色盲模式 | 手册 - Coblis模拟器在所有启用模式的游戏屏幕截图上 | 各模式探索、战斗、库存的游戏截图 | No任何模式下都会丢失重要信息；玩家可以在没有颜色歧视的情况下完成所有目标 | 用户体验设计师 | Not Started |
| 输入重新映射 | 手动 - 将所有输入重新映射到非默认绑定、完整教程和第一级 | 所有默认输入反弹；游戏功能正常；不可能有绑定冲突 | 重新映射后可以执行所有操作；预防冲突工作；绑定在重新启动后仍然存在 | 质量保证测试员 | Not Started |
| 字幕准确度 | 手动 — 对照语音脚本进行验证，检查所有线路 | 所有有声内容；字幕时间；说话人识别 | 100% 有声台词有字幕；为所有多角色场景识别说话者；行结束后超过 3 秒没有字幕显示 | 质量保证测试员 | Not Started |
| 保持输入切换 | 手动 — 启用所有切换选项，完成所有战斗和遍历序列 | 所有保持输入处于切换模式 | 所有按住操作均可在切换模式下完成；启用切换时，没有游戏状态需要持续按住 | 质量保证测试员 | Not Started |
| 减少运动模式 | 手动 — 启用模式、导航所有菜单并完成游戏的第一个小时 | 所有菜单转换；所有 HUD 动画；所有相机抖动事件 | No菜单中的循环动画；相机抖动没有超过阈值；所有屏幕过渡都是淡入淡出或剪切的 | 用户体验设计师 | Not Started |
| 平台屏幕阅读器（菜单） | 手动 — 启用操作系统屏幕阅读器，导航所有菜单 | 主菜单、设置、暂停菜单、库存、地图 | 所有交互式菜单元素都有屏幕阅读器公告；导航顺序符合逻辑；没有keyboard/D-pad无法访问的元素 | 用户体验设计师 | Not Started |
| 用户测试——色盲 | 色盲参与者的用户测试 | 每种色盲模式的完整游戏会话 | 参与者完成所有内容，无需要求颜色说明；没有会话停止混乱 | 制片人 | Not Started |
| 用户测试——运动障碍 | 使用一只手或自适应控制器与参与者进行用户测试 | 启用切换和扩展计时模式的完整游戏会话 | 参与者在健全完成时间的允许范围内完成所有MVP内容 | 制片人 | Not Started |

---

## 已知的有意限制

> **为什么要记录未包含的内容**：未记录的遗漏变成
> 对认证或社区反馈感到惊讶。记录限制
> 有理由表明这是一个深思熟虑的选择，而不是疏忽。
> 它还可以确定哪些玩家没有得到服务以及缓解措施是什么。
> 这里的每一个条目都是一个风险——诚实地评估它。

| 特征 | 所需等级 | 为什么不包括在内 | 风险/影响 | 减轻 |
|---------|--------------|-----------------|--------------|------------|
| [Screen reader support for in-game world (NPCs, objects, environmental text)] | Exemplary | Engine (Godot 4.6) AccessKit 集成仅涵盖菜单；延伸到游戏世界需要超出当前范围的定制空间音频描述系统 | 影响盲人和弱视玩家，他们可以浏览菜单但无法独立探索游戏世界 | 确保所有重要的世界信息都复制到可访问的菜单系统（任务日志、地图）中；评估发布后 DLC |
| [Full subtitle customization (font/color/background)] | Comprehensive | 范围缩小——针对标准层。Godot中的自定义字体渲染需要额外的资源管道工作 | 影响具有特定易读性需求的聋哑和听力障碍玩家；尤其影响使用自定义字体的阅读障碍玩家 | 提供两种预设的字幕样式（默认和高可读性）作为部分缓解措施；启动后更新日志 |
| [Tactile/haptic alternatives for all audio cues] | Exemplary | 非 Xbox 平台的平台隆隆 API 集成超出了v1.0的范围 | 依靠触觉反馈影响聋哑玩家；使用非 Xbox 控制器的 PC 玩家没有触觉响应 | Xbox 控制器触觉集成在范围内；评估 PlayStation DualSense 触觉 API 以获取发布后补丁 |
| [Add any other intentionally excluded accessibility feature] | | | | |

---

## 审计历史

> **为什么要跟踪审核历史记录**：可访问性并不是一次性得到认证的。
> 平台要求发生变化。新功能可能会带来新的障碍。合法的
> 标准不断发展。审计历史证明了尽职调查并有助于识别
> 审计之间的回归。

| 日期 | 审计员 | 类型 | 范围 | 调查结果摘要 | 地位 |
|------|---------|------|-------|-----------------|--------|
| [Date] | [Internal — ux-designer] | 内部审查 | [Pre-submission checklist against committed tier] | [e.g., "12 items verified, 3 open issues: subtitle contrast below target in 2 scenes, color-only indicator on minimap not resolved"] | [In Progress] |
| [Date] | [External — AbleGamers Player Panel] | 用户测试 | [Motor accessibility — one-hand mode and timing adjustments] | [e.g., "Toggle modes functional. Timed QTE window at 3x still failed for one participant — recommend 5x option."] | [Findings addressed] |
| [Add row for each audit] | | | | | |

---

## 外部资源

| 资源 | 网址 | 关联 |
|----------|-----|-----------|
| WCAG 2.1（网页内容无障碍指南） | https://www.w3.org/TR/WCAG21/ | 基础无障碍功能标准——对比度、文本大小、输入要求 |
| 游戏无障碍指南 | https://gameaccessibilityguidelines.com | Comprehensive按类别和成本组织的游戏特定清单 |
| AbleGamers 玩家面板 | https://ablegamers.org/player-panel/ | 用户测试服务以及残疾游戏玩家咨询 |
| Xbox 无障碍功能指南 (XAG) | https://docs.microsoft.com/gaming/accessibility/guidelines | Xbox 认证必读；结构良好的功能清单 |
| PlayStation 无障碍功能指南 | https://www.playstation.com/en-us/accessibility/ | 索尼平台要求；还包含精心编写的设计指南 |
| 色盲模拟器（Coblis） | https://www.color-blindness.com/coblis-color-blindness-simulator/ | 用于在屏幕截图上模拟色盲模式的免费工具 |
| 无障碍游戏数据库 | https://accessible.games | 无障碍游戏设计决策的研究和示例 |
| CVAA（21 世纪通信和视频无障碍法案） | https://www.fcc.gov/consumers/guides/21st-century-communications-and-video-accessibility-act-cvaa | 美国对具有通信功能（语音聊天、消息传递）的游戏的法律要求 |

---

## 开放性问题

| 问题 | 所有者 | 最后期限 | 解决 |
|----------|-------|----------|-----------|
| [Does Godot 4.6 AccessKit support dynamic accessibility node updates for HUD elements, or only static menus?] | [ux-designer] | [Before Technical Setup gate] | [Unresolved — check engine-reference/godot/ docs] |
| [What is the Xbox ID@Xbox minimum XAG compliance requirement for our release window?] | [producer] | [Before Pre-Production gate] | [Unresolved] |
| [Will the dialogue system support timed choice extensions without a full architecture change?] | [lead-programmer] | [During Technical Design] | [Unresolved] |
| [Add question] | [Owner] | [Deadline] | [Resolution] |
