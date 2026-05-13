# 系统索引：[Game Title]

> **Status**: [Draft / Under Review / Approved]
> **Created**: [Date]
> **Last Updated**: [Date]
> **Source Concept**: design/gdd/game-concept.md

---

## 概览

[用一段话说明游戏的机制范围。这款游戏需要什么类型的系统？引用核心循环和游戏支柱。这应帮助任何团队成员理解需要设计和构建内容的“大图景”。]

---

## 系统枚举

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | [e.g., Player Controller] | Core | MVP | [Not Started / In Design / In Review / Approved / Implemented] | [design/gdd/player-controller.md or "—"] | [e.g., Input System, Physics] |
| 2 | [e.g., Camera System] | Core | MVP | Not Started | — | Player Controller |

[为每个识别出的系统添加一行。使用下方定义的类别和优先级层级。将推断出的系统（概念文档中未明确提到）在系统名中标记为“(inferred)”。]

---

## 类别

| Category | Description | Typical Systems |
|----------|-------------|-----------------|
| **Core** | 一切依赖的基础系统 | 玩家控制器、输入、物理、摄像机、场景管理、状态机 |
| **Gameplay** | 让游戏变得有趣的系统 | 战斗、AI、潜行、移动能力、交互 |
| **Progression** | 玩家如何随时间成长 | XP/等级、技能树、解锁、成就、声望 |
| **Economy** | 资源的产生和消耗 | 货币、战利品、制作、商店、物品数据库、掉落表 |
| **Persistence** | 存档状态与连续性 | 保存/加载、设置、云同步、档案管理 |
| **UI** | 面向玩家的信息展示 | HUD、菜单、背包界面、对话 UI、地图、通知 |
| **Audio** | 声音与音乐系统 | 音乐管理器、SFX bus、环境音频、自适应音乐、语音 |
| **Narrative** | 故事与对话呈现 | 对话系统、任务追踪、过场、日志、lore 条目 |
| **Meta** | 核心游戏循环之外的系统 | 分析、教程/引导、无障碍选项、拍照模式 |

[不是每个游戏都需要每个类别。删除不适用的类别。如有需要，添加自定义类别。]

---

## 优先级层级

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | 核心循环运转所必需。没有这些，就无法测试“这是否有趣？” | First playable prototype | Design FIRST |
| **Vertical Slice** | 一个完整、打磨过区域所必需。展示完整体验。 | Vertical slice / demo | Design SECOND |
| **Alpha** | 所有功能以粗略形式存在。完整机制范围，内容可为占位。 | Alpha milestone | Design THIRD |
| **Full Vision** | 打磨、边界情况、可有可无项，以及内容完整功能。 | Beta / Release | Design as needed |

---

## 依赖地图

[按依赖顺序排序的系统——从上到下设计和构建。顶部是基础，底部是包装层。]

### 基础层（无依赖）

1. [System] — [为什么这是基础的一句话依据]

### 核心层（依赖基础）

1. [System] — depends on: [list]

### 功能层（依赖核心）

1. [System] — depends on: [list]

### 表现层（依赖功能）

1. [System] — depends on: [list]

### 打磨层（依赖所有内容）

1. [System] — depends on: [list]

---

## 建议设计顺序

[结合依赖排序和优先级层级。按此顺序设计这些系统。每个系统的 GDD 都应在开始下一个之前完成并审查，不过同一层中的独立系统可以并行设计。]

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | [First system to design] | MVP | Foundation | game-designer | [S/M/L] |
| 2 | [Second system] | MVP | Foundation | game-designer | [S/M/L] |

[工作量估算：S = 1 次会话，M = 2-3 次会话，L = 4+ 次会话。“会话”指一次专注的设计对话，产出完整 GDD。]

---

## 循环依赖

[列出分析中发现的任何循环依赖链。这些需要特殊架构关注——要么用接口打破循环，要么同时设计这些系统。]

- [None found] OR
- [System A <-> System B: 循环关系描述及建议解决方案]

---

## 高风险系统

[技术上未经验证、设计不确定或范围危险的系统。无论优先级层级如何，都应尽早原型验证。]

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| [System] | [Technical / Design / Scope] | [可能出错的内容] | [原型、研究或范围 fallback] |

---

## 进度跟踪器

| Metric | Count |
|--------|-------|
| Total systems identified | [N] |
| Design docs started | [N] |
| Design docs reviewed | [N] |
| Design docs approved | [N] |
| MVP systems designed | [N/total MVP] |
| Vertical Slice systems designed | [N/total VS] |

---

## 下一步

- [ ] 审查并批准此系统枚举
- [ ] 先设计 MVP 层级系统（使用 `/design-system [system-name]`）
- [ ] 对每个完成的 GDD 运行 `/design-review`
- [ ] MVP 系统设计完成后运行 `/gate-check pre-production`
- [ ] 在承诺进入 Production 前，用 `/vertical-slice` 验证最高风险系统
