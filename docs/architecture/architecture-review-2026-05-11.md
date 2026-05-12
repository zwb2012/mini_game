# Architecture Review Report

**日期**：2026-05-11
**引擎**：Cocos Creator 3.8.8
**GDD 审查数**：12（全部 MVP 系统 GDD）
**ADR 审查数**：5（ADR-001 ~ ADR-005）
**TR 总数**：37

---

## 可追溯性摘要

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ 已覆盖 | 17 | 46% |
| ⚠️ 部分覆盖 | 12 | 32% |
| ❌ 缺口 | 8 | 22% |
| **总计** | **37** | 100% |

---

## 完整可追溯性矩阵

| TR-ID | GDD | 需求 | ADR 覆盖 | 状态 |
|-------|-----|------|---------|------|
| TR-LDS-001 | level-data-schema | LevelData JSON 格式 — version + levels[] 数组 | — | ❌ GAP |
| TR-LDS-002 | level-data-schema | 单关数据结构 — grid, nodes, blockedCells, optimalSteps, unlockCondition | — | ❌ GAP |
| TR-LDS-003 | level-data-schema | 数据校验 — nodes 连续、坐标不重复、grid [3,10]、optimalSteps >= 1 | — | ❌ GAP |
| TR-GSM-001 | game-state-machine | 4 状态 — Menu, Playing, Paused, LevelComplete | ADR-001 | ✅ |
| TR-GSM-002 | game-state-machine | 8 条合法转换 | ADR-001 | ✅ |
| TR-GSM-003 | game-state-machine | onEnter/onExit 回调 — 同步按序执行 | ADR-001 | ✅ |
| TR-GSM-004 | game-state-machine | 非法转换静默忽略 + 微信切后台自动 PAUSE | ADR-001 | ✅ |
| TR-IM-001 | input-manager | TOUCH_START/MOVE/END → 屏幕坐标转网格坐标 | ADR-005 | ✅ |
| TR-IM-002 | input-manager | 滑动阈值 4px + 多点触摸忽略 + 越界丢弃 | ADR-005 | ✅ |
| TR-IM-003 | input-manager | 端到端延迟 ≤50ms, 仅 Playing 态激活 | ADR-005 | ✅ |
| TR-SM-001 | scene-manager | MenuScene + GameScene 状态驱动切换 + 预加载 | ADR-001（状态驱动部分） | ⚠️ PARTIAL |
| TR-SM-002 | scene-manager | 场景参数传递 levelId → engine 初始化 | ADR-001（间接） | ⚠️ PARTIAL |
| TR-LS-001 | local-storage | nl_ 前缀命名空间 — LevelProgress, Settings, Meta | ADR-004 | ✅ |
| TR-LS-002 | local-storage | 通关同步写入 + 设置 500ms 防抖 + 元数据会话结束写 | ADR-004 | ✅ |
| TR-LS-003 | local-storage | 微信 wx.setStorage 优先 + cc.sys.localStorage 回退 | ADR-004 | ✅ |
| TR-GCE-001 | grid-connection-engine | 网格初始化 — Cell[][] 创建、节点放置、障碍格标记 | ADR-002 | ✅ |
| TR-GCE-002 | grid-connection-engine | 路径追踪 — 按序连接、填充格子、切换 currentNumber | ADR-002 | ✅ |
| TR-GCE-003 | grid-connection-engine | Bresenham 插值 — 快速滑动填充跳格 | ADR-002 | ✅ |
| TR-GCE-004 | grid-connection-engine | 路径回溯 — 滑入当前路径末格 = 撤销 | ADR-002 | ✅ |
| TR-GCE-005 | grid-connection-engine | 通关检测 — 全部非障碍格 filled=true → LEVEL_COMPLETE | ADR-002 | ✅ |
| TR-GCE-006 | grid-connection-engine | 撤销接口 — undo() + canUndo() | ADR-002 | ✅ |
| TR-GCE-007 | grid-connection-engine | 3 内部状态 — Idle, Drawing, Dirty | ADR-002 | ✅ |
| TR-SS-001 | step-scoring | 步数追踪 — engine 推送 +-1 增量, stepCount >= 0 | ADR-003（Push/Pull 分类） | ⚠️ PARTIAL |
| TR-SS-002 | step-scoring | 星级计算 — starRatio = actualSteps/optimalSteps, THRESHOLD 可配 | ADR-003（Pull 结果） | ⚠️ PARTIAL |
| TR-SS-003 | step-scoring | 保底 1 星 — 永不返回 0 星 | — | ⚠️ PARTIAL |
| TR-HS-001 | hint-system | 每日 3 次免费提示 — 日历日重置 | — | ❌ GAP |
| TR-HS-002 | hint-system | 简化 BFS — 起点=当前路径末格/节点格, 目标=下一数字节点 | ADR-002（箭头渲染）+ ADR-003（Pull 网格快照） | ⚠️ PARTIAL |
| TR-UI-001 | level-select-ui | 3 列按钮网格 + 锁定/解锁/已完成 3 态 + 星级角标 | — | ❌ GAP |
| TR-UI-002 | level-select-ui | 44x44px 最小触控 + 滚动位置保持 | — | ❌ GAP |
| TR-UI-003 | in-game-hud | 步数计数器 + 撤销按钮 + 暂停按钮 + 暂停菜单 | ADR-003（Pull stepCount）+ ADR-002（undo）+ ADR-001（PAUSE） | ⚠️ PARTIAL |
| TR-UI-004 | in-game-hud | 撤销按钮仅在 canUndo()=true 时可点击 | ADR-002（canUndo 接口） | ⚠️ PARTIAL |
| TR-UI-005 | level-complete-overlay | 1-3 星依次点亮 (200ms) + 步数对比 + 3 操作按钮 | ADR-001（NEXT_LEVEL/REPLAY）+ ADR-003（Pull getResult） | ⚠️ PARTIAL |
| TR-UI-006 | level-complete-overlay | 末关隐藏下一关按钮 — REPLAY 始终可见 | ADR-001（REPLAY 始终在转换表中） | ⚠️ PARTIAL |
| TR-AM-001 | audio-manager | 音频事件定义 — TICK/LEVEL_COMPLETE 启动时预加载, AMBIENT 延迟加载 | ADR-004（存储交互） | ⚠️ PARTIAL |
| TR-AM-002 | audio-manager | 播放接口 — play(eventId)、setMuted(bool)、isMuted() | ADR-004（静音偏好持久化） | ⚠️ PARTIAL |
| TR-AM-003 | audio-manager | TICK 同帧防抖 — 同一帧多次请求合并为一次播放 | — | ❌ GAP |
| TR-AM-004 | audio-manager | 资源缺失静默降级 — 加载失败 console.warn, 游戏不崩溃 | — | ❌ GAP |

---

## 覆盖缺口详情（8 个无 ADR 覆盖的需求）

### Foundation 层（阻塞 Core 层）

| TR-ID | 需求 | 建议 ADR | 领域 | 引擎风险 |
|-------|------|---------|------|---------|
| TR-LDS-001 | LevelData JSON 格式 | ADR-006: 关卡数据格式与校验策略 | Data | LOW |
| TR-LDS-002 | 单关数据结构 | ADR-006 | Data | LOW |
| TR-LDS-003 | 数据校验规则 | ADR-006 | Data | LOW |

### Feature 层

| TR-ID | 需求 | 建议 ADR | 领域 | 引擎风险 |
|-------|------|---------|------|---------|
| TR-HS-001 | 每日 3 次免费提示 — 日历日重置 | ADR-008: 提示系统 BFS 路径查找策略 | Feature | LOW |

### Presentation 层

| TR-ID | 需求 | 建议 ADR | 领域 | 引擎风险 |
|-------|------|---------|------|---------|
| TR-UI-001 | 3 列按钮网格 + 3 态 | ADR-009: UI 组件树与数据绑定模式 | UI | LOW |
| TR-UI-002 | 44x44px 最小触控 + 滚动位置 | ADR-009 | UI | LOW |

### Audio（Foundation — MVP）

| TR-ID | 需求 | 建议 ADR | 领域 | 引擎风险 |
|-------|------|---------|------|---------|
| TR-AM-003 | TICK 同帧防抖 | ADR-010: 音频资源预加载与降级策略 | Audio | LOW |
| TR-AM-004 | 资源缺失静默降级 | ADR-010 | Audio | LOW |

---

## Cross-ADR 冲突检测

**未检测到阻塞性冲突。** 5 份 ADR 在以下方面一致：
- 引擎版本（均为 3.8.8）
- 状态所有权（ADR-001 独占游戏状态）
- 数据流模式（ADR-003 标准化 Push/Pull）
- 接口契约（subscribe/getter 模式一致）

### GDD 内部不一致

| GDD | 问题 | 严重度 |
|-----|------|--------|
| game-state-machine.md | Summary 写"5 条合法转换"，详细设计定义 8 条（与 ADR-001 一致） | LOW — 修复 Summary |

---

## ADR 依赖排序

所有 ADR 当前状态均为 **Proposed**（无 Accepted）。

```
Foundation（无依赖）:
  1. ADR-001: 游戏状态机架构 [Proposed]
  2. ADR-004: 平台适配层 [Proposed]

依赖 Foundation:
  3. ADR-003: 数据流模式 (requires ADR-001) [Proposed]
  4. ADR-005: 触控输入管线 (requires ADR-001) [Proposed]

依赖 Stage 2:
  5. ADR-002: 网格渲染策略 (requires ADR-001, ADR-003, ADR-005) [Proposed]
```

⚠️ **ADR-002 依赖 ADR-001/003/005——三者全部 Proposed 时 ADR-002 无法安全实现。**

无依赖循环。

---

## GDD 修订标识

| GDD | 假设 | 实际情况（来自 ADR/引擎参考） | 操作 |
|-----|------|---------------------------|------|
| game-state-machine.md | Summary："5 条合法转换" | 详细设计 + ADR-001 定义 8 条 | 修复 Summary |

无 GDD 假设与已验证引擎行为冲突。

---

## 引擎兼容性问题

### 引擎兼容性审计结果

| 检查项 | 结果 |
|--------|------|
| ADR 含 Engine Compatibility 章节 | 5/5 ✅ |
| 版本一致性（均为 3.8.8） | ✅ |
| 废弃 API 引用 | 0 — 全部通过 ✅ |
| Post-Cutoff API 冲突 | 无 ✅ |

### 具体问题

| 严重度 | ADR | 问题 | 详情 |
|--------|-----|------|------|
| **HIGH** | ADR-002 | Draw call 估算错误 | 声称 2-3 draw call；实际 5-11（Graphics 多色 fill/stroke）。SystemFont Label 不可合批（3.8.8 实测 15 个 Label = ~15 draw call），总 draw call ~26，非声称的"<10" |
| **HIGH** | ADR-002 | SystemFont 合批认知错误 | Cocos 3.8.8 中 SystemFont Label **不能**自动合批——每个 Label 生成独立纹理。需改用嵌入式 TTF 字体文件（~100-200KB）使所有数字 Label 共享纹理，合批为 1 draw call |
| **MEDIUM** | ADR-002 | Knowledge Risk 评级偏低 | 当前 MEDIUM，应上调至 MEDIUM-HIGH——Label 合批和 draw call 估算均有误差 |
| **MEDIUM** | ADR-002 | 缺失 onDestroy 生命周期 | LabelPool.destroy() 未绑定到 Component.onDestroy()——场景切换时 Label 节点变为孤儿节点（内存泄漏） |
| **MEDIUM** | ADR-005 | 坐标系假设未声明 | getUILocation() 原点取决于 Canvas anchor。若 anchor=(0.5,0.5)，原点在屏幕中心。gridOriginY 必须与事件节点坐标系对齐 |
| **LOW** | ADR-004 | wx 全局对象单层守卫 | WeChatStorage 构造函数应增加 `typeof wx !== 'undefined'` 双重保险 |
| **LOW** | ADR-005 | 订阅者列表变异风险 | forEach 遍历中若回调调用 unsubscribe() 会跳过元素——使用 .slice() 快照迭代 |

### 引擎专员判定（cocos-specialist）

专员确认了上述发现，并额外建议：

1. **双 Graphics 组件优化**：将静态网格线拆分到独立（不清除的）Graphics 组件，减少低端 Android 设备每帧重绘成本（100 rect+fill 在低端机可能达 8-12ms，而非 <2ms）
2. **避免渲染循环中 new Color()**：预创建颜色常量，用 `graphics.fillColor = COLOR_RED` 直接赋值
3. **LabelPool.update() 快速守卫**：destroy() 后若意外调用 update()，应检查 `_labels.length === 0`

---

## 架构文档覆盖

`docs/architecture/architecture.md` 覆盖全部 11 个 MVP 系统。层映射、数据流图、API 边界和模块所有权表完整。Required ADRs 表（Must Have / Should Have / Can Defer）与已有 ADR 001-005 及计划中的 006-011 一致。

---

## 判定：CONCERNS

**理由**：无阻塞性跨 ADR 冲突，引擎兼容性基本良好，架构蓝图覆盖所有系统。但：

- **8 个需求无 ADR**（Foundation 层 LDS、Feature 层 HS-001、Presentation 层 UI、Audio）
- **12 个需求仅部分 ADR 覆盖**
- **全部 5 份 ADR 均为 Proposed**——无一 Accepted，依赖链不可执行
- **ADR-002 存在显著的引擎知识误差**（SystemFont 合批），Accept 前需修正

### 阻塞问题（必须解决才能 PASS）

1. ADR-002：修正 draw call 估算，将 SystemFont 换为 TTF 字体
2. ADR-001：必须先 Accept——ADR-002/003/005 依赖它（依赖链阻塞）
3. 缺失 ADR 006-010（Should Have 级别）——对应系统实现前需要创建

### 待创建 ADR 优先级

1. **ADR-006: 关卡数据格式与校验策略** — 覆盖 3 个 TR-LDS 缺口（Foundation 层，阻塞 Core 层）
2. **ADR-007: 步数评分公式可配置化** — 覆盖 3 个 TR-SS partial
3. **ADR-008: 提示系统 BFS 路径查找策略** — 覆盖 TR-HS-001 缺口
4. ADR-009: UI 组件树与数据绑定模式
5. ADR-010: 音频资源预加载与降级策略

---

## 建议下一步

1. **立即**：Accept ADR-001（状态机）——所有其他 ADR 依赖它
2. **本轮**：修正 ADR-002 的 draw call 估算和字体策略
3. **下一轮**：创建 ADR-006（关卡数据）——Foundation 层最后一个缺口
4. 所有阻塞问题解决后运行 `/gate-check pre-production`
5. 每次新 ADR 创建后重新运行 `/architecture-review` 验证覆盖率提升
