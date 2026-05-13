# 声音圣经：[Project Name]

## 音频愿景

### 声音识别
[用 2-3 句话描述游戏整体的音频个性。游戏“听起来像什么”？音频应唤起哪些情绪？]

### 音频支柱
1. **[Pillar 1]**: [该支柱如何体现在音频中]
2. **[Pillar 2]**: [该支柱如何体现在音频中]
3. **[Pillar 3]**: [该支柱如何体现在音频中]

### 参考游戏 / 媒体
| Reference | What to Take From It | What to Avoid |
| ---- | ---- | ---- |
| [Game/Film 1] | [要借鉴的具体音频品质] | [不符合我们愿景的内容] |
| [Game/Film 2] | [要借鉴的具体音频品质] | [不符合我们愿景的内容] |

---

## 音乐方向

### 风格与类型
[主要音乐风格、配器调色板、速度范围]

### 配器调色板
- **Core instruments**: [列出定义声音的主要乐器/合成器]
- **Accent instruments**: [用于强调、转场、特殊时刻]
- **Avoid**: [不适合游戏的乐器或风格]

### 自适应音乐系统
| Game State | Music Behavior | Transition |
| ---- | ---- | ---- |
| Exploration | [速度、能量、配器] | [如何转入下一状态] |
| Combat | [速度、能量、配器] | [触发条件和交叉淡化时间] |
| Stealth/Tension | [速度、能量、配器] | [触发与转场] |
| Victory/Reward | [短促乐句或转场行为] | [返回探索] |
| Menu/UI | [菜单风格] | [游戏开始时淡出] |

### 音乐规则
- [循环规则，例如“所有探索曲目必须在 2-4 分钟后无缝循环”]
- [静音规则，例如“探索循环之间允许 10-15 秒静默”]
- [强度规则，例如“战斗音乐必须在战斗开始后 3 秒内达到完整强度”]
- [转场规则，例如“所有音乐转场使用 1.5 秒交叉淡化”]

---

## 音效

### SFX 调色板
| Category | Description | Style Notes |
| ---- | ---- | ---- |
| Player Actions | [移动、攻击、能力] | [有力、响应迅速、位于混音前景] |
| Enemy Actions | [攻击、能力、死亡] | [与玩家区分，略微后置] |
| UI | [按钮点击、菜单转场、通知] | [干净、细腻，重复时绝不烦人] |
| Environment | [环境循环、天气、物件] | [沉浸、分层、空间化] |
| Feedback | [受伤、拾取物品、升级] | [清晰、令人满足、不疲劳] |

### 音频反馈优先级
当多个声音竞争时，该优先级决定播放内容：
1. 玩家受伤 / 关键警告（始终可听）
2. 玩家动作（攻击、能力）
3. 敌人动作（附近敌人优先）
4. UI 反馈
5. 环境 / 氛围

### SFX 规则
- [重复规则，例如“每个 >3 次/分钟的 SFX 需要 3+ 个变体”]
- [空间音频规则，例如“所有游戏玩法 SFX 必须 3D 定位，UI SFX 为 2D”]
- [ducking 规则，例如“玩家受击 SFX 会让所有其他 SFX 降低 3dB，持续 200ms”]
- [响应时间规则，例如“动作 SFX 必须在动作发生后 1 帧内触发”]

---

## 混音

### 混音总线结构
| Bus | Content | Target Level |
| ---- | ---- | ---- |
| Master | Everything | 0 dB |
| Music | All music tracks | [target dBFS] |
| SFX | All sound effects | [target dBFS] |
| Dialogue | All voice/narration | [target dBFS] |
| UI | All interface sounds | [target dBFS] |
| Ambient | Environment loops | [target dBFS] |

### 混音规则
- 对话始终优先——对话期间压低音乐和 SFX
- 音乐应被感受到，而不是占据主导——如果玩家听不清音乐下的 SFX，说明音乐太响
- Master 输出绝不能削波——在 master bus 上使用限制器
- 所有音量都必须可由玩家调整（按总线）
- 默认混音在扬声器和耳机上都应听起来良好

### 动态范围
- [指定响度目标，例如“目标 -14 LUFS integrated，-1 dBTP true peak”]
- [指定压缩策略，例如“SFX bus 使用轻度压缩，music 不压缩”]

---

## 技术规格

### 格式要求
| Type | Format | Sample Rate | Bit Depth | Notes |
| ---- | ---- | ---- | ---- | ---- |
| Music | [OGG/WAV] | [44.1/48 kHz] | [16/24 bit] | [从磁盘流式播放] |
| SFX | [WAV/OGG] | [44.1/48 kHz] | [16 bit] | [加载到内存] |
| Ambient | [OGG] | [44.1 kHz] | [16 bit] | [流式、可循环] |
| Dialogue | [OGG/WAV] | [44.1 kHz] | [16 bit] | [流式] |

### 命名约定
`[category]_[subcategory]_[name]_[variation].ext`
- 示例：`sfx_weapon_sword_swing_01.wav`
- 示例：`music_exploration_forest_loop.ogg`
- 示例：`amb_environment_cave_drip_loop.ogg`

### 内存预算
- 总音频内存：[target, e.g., 128 MB]
- SFX 池：[target]
- 音乐流缓冲：[target]
- 语音流缓冲：[target]

---

## 无障碍

- 所有关键音频提示都必须有视觉替代（字幕、屏幕闪烁、图标）
- 为听力受损玩家提供单声道音频选项
- 所有总线提供独立音量控制
- 提供禁用突然大音量的选项
- 所有对话支持字幕，并标识说话者
