# 关卡：[Level Name]

## 快速参考

- **Area/Region**: [Where in the game world]
- **Type**: [Combat / Exploration / Puzzle / Hub / Boss / Mixed]
- **Estimated Play Time**: [X-Y minutes]
- **Difficulty**: [1-10 relative scale]
- **Prerequisite**: [What the player must have done to reach this level]
- **Status**: [Concept | Layout | Graybox | Art Pass | Polish | Final]

## 叙事背景

- **Story Moment**: [Where in the narrative arc does this level occur]
- **Narrative Purpose**: [What story beat this level delivers]
- **Emotional Target**: [What the player should feel during this level]
- **Lore Discoveries**: [What world-building the player can find here]

## 布局

### 概览地图

```
[ASCII diagram of the level layout. Use these symbols:]
[S] = Start point
[E] = Exit/end point
[C] = Combat encounter
[P] = Puzzle
[R] = Reward/loot
[!] = Story beat
[?] = Secret/optional
[>] = One-way passage
[=] = Two-way passage
[@] = NPC
[B] = Boss encounter
```

### 关键路径

[逐步描述穿过该关卡的必经路线。]

1. 玩家从 [S] 进入
2. [Description of what happens along the path]
3. 玩家从 [E] 离开

### 可选路径

| Path | Access Requirement | Reward | Discovery Hint |
|------|-------------------|--------|---------------|

### 兴趣点

| Location | Type | Description | Purpose |
|----------|------|-------------|---------|

## 遭遇

### 战斗遭遇

| ID | Position | Enemy Composition | Difficulty | Arena Notes |
|----|----------|------------------|-----------|-------------|
| E-01 | [Map ref] | [2x Grunt, 1x Ranged] | 3/10 | 开阔区域，两翼有掩体 |
| E-02 | [Map ref] | [1x Elite, 3x Grunt] | 5/10 | 狭窄走廊，无法撤退 |

### 非战斗遭遇

| ID | Position | Type | Description | Solution Hint |
|----|----------|------|-------------|---------------|

## 节奏图

```
Intensity
10 |                              *
 8 |                         *   * *
 6 |            *  *        * * *   *
 4 |     *  *  * ** *   *  *
 2 | * ** ** *        * * *          *
 0 |S-----------------------------------------E
     [Start]    [Mid]              [Climax] [Exit]
```

[描述预期节奏：峰值、低谷、休息点在哪里？]

## 音频方向

| Zone/Moment | Music Track | Ambience | Key SFX |
|-------------|------------|----------|---------|
| [Entry] | [Track] | [Ambient sounds] | [Door opening] |
| [Combat] | [Combat music] | [Muted ambience] | [Combat SFX] |
| [Post-combat] | [Calm transition] | [Return to ambience] | |

## 视觉方向

- **Lighting**: [主光、补光、环境光描述]
- **Color Palette**: [主导颜色及原因]
- **Mood Board References**: [视觉参考描述]
- **Landmarks**: [可见导航辅助及其位置]
- **Sight Lines**: [玩家应从关键位置看到什么]

## 收集品和秘密

| Item | Location | Visibility | Hint | Required For |
|------|----------|-----------|------|-------------|

## 技术备注

- **Estimated Object Count**: [N]
- **Streaming Zones**: [Where to break the level for streaming]
- **Performance Concerns**: [Any known heavy areas]
- **Required Systems**: [What game systems are active in this level]
