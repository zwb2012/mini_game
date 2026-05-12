# 跨 GDD 评审报告

**日期**: 2026-05-10
**评审 GDD 数量**: 13（game-concept + systems-index + 11 系统 GDD）
**覆盖系统**: 关卡数据结构、游戏状态机、输入管理器、场景管理器、音频管理器、本地存储、网格连线引擎、步数评分系统、关卡选择界面、游戏内 HUD、完成结算弹窗

---

## 一致性检查结果

### 阻塞项（架构开始前必须解决）

🔴 **[C-01] 步数评分公式内部矛盾 — ★ 阈值有两个不同值**

`step-scoring.md` Detailed Design 规则 2 表格中 `starRatio ≤ 2.5 → ★`，但 Formulas 节硬编码为 `starRatio > 1.5 → 1 星`。Tuning Knobs 中 ★ 阈值设为 2.5，但公式并未引用此参数。程序员按公式实现会忽略 2.5 这个调优参数；若将该参数调到 1.5 以下，公式将直接错误。

**受影响 GDD**: `step-scoring.md`（Detailed Design 规则 2 + Formulas + Tuning Knobs）
**修复**: 将 Formulas 节改为使用可配置的 `THRESHOLD_TWO_STAR`（默认 1.5），或在 Detailed Rules 表格中删除 2.5 行（因为 1.5 已覆盖所有情况），并在 Tuning Knobs 中注明 ★ 阈值是"感知上界"而非计算截断点。

🔴 **[C-02] LEVEL_COMPLETE 事件流不明 — 评分系统可能永远不触发计算**

`step-scoring.md` 声明从引擎接收 `LEVEL_COMPLETE + finalStepCount`。但 `grid-connection-engine.md` 的 Interactions 表显示 LEVEL_COMPLETE 发送给**状态机**，对评分系统仅发送"最终步数"。三个系统之间的数据流存在三种可能解读，但没有任何一种被两个以上 GDD 同时确认。

**受影响 GDD**: `step-scoring.md`（Interactions）、`grid-connection-engine.md`（Interactions）、`game-state-machine.md`（States and Transitions）
**修复**: 在 engine 和 scoring 的 GDD 中统一事件流描述。推荐：engine 同时发出 LEVEL_COMPLETE 给状态机（触发状态转换）和 scoring（触发星级计算），两条路径独立并行。

🔴 **[C-03] 引擎 Dependencies 与 Interactions 对 stepCount 的数据流向描述相反**

`grid-connection-engine.md` Dependencies 节："评分系统**读取**引擎的 stepCount"（Pull 模型）。Interactions 表："每步填充后**通知** stepCount++"（Push 模型）。两种架构模式互斥，会导致集成 bug。

**受影响 GDD**: `grid-connection-engine.md`（Dependencies + Interactions）
**修复**: 统一为 Push 模型（推荐——适合实时更新），将 Dependencies 节改为"引擎通知评分系统 stepCount 变化"。

🔴 **[C-04] NEXT_LEVEL 事件在末关阻止"重玩"按钮正常工作**

`level-complete-overlay.md`：「重玩」按钮使用 NEXT_LEVEL 事件 + 相同 levelId，「始终可见」。`game-state-machine.md`：`NEXT_LEVEL` 转换条件为"存在下一关"。当玩家在最后一关（id=50）点击"重玩"时，id=51 不存在 → 条件不满足 → 转换被拒绝 → 重玩失败。

**受影响 GDD**: `game-state-machine.md`（States and Transitions 表）、`level-complete-overlay.md`（Detailed Design 规则 3）
**修复**: 选项 A — 新增 `REPLAY` 事件（无"存在下一关"条件）；或选项 B — 修改 NEXT_LEVEL 条件为"存在下一关 OR levelId 未改变（同关重玩）"。

🔴 **[C-05] MVP 范围不一致 — 提示系统/激励视频归属矛盾**

`game-concept.md` MVP Definition 明确列入"激励视频提示系统"（第 6 项），Scope Tiers 表也列出 MVP 包含"提示"。但 `systems-index.md` 将提示系统标为 Vertical Slice、激励视频广告标为 Alpha。两个最高级文档相互矛盾。

**受影响 GDD**: `game-concept.md`（MVP Definition + Scope Tiers）、`systems-index.md`（Systems Enumeration + Priority Tiers）
**修复**: 二选一——如果提示系统确实属于 MVP，更新 systems-index.md 将 #13 和 #14 提到 MVP tier；如果提示系统推迟，更新 game-concept.md 将第 6 项移到 "Explicitly NOT in MVP" 或注明为 Vertical Slice。

---

### 警告项（应该解决，但不阻塞架构）

⚠️ **[C-06] level-select-ui 未声明对 level-data-schema 的依赖**

`level-select-ui.md` 需要关卡元数据（id、name、chapter、difficulty、unlockCondition）来渲染按钮列表，但 Dependencies 仅列出本地存储和场景管理器。数据来源不明。

**修复**: 在 `level-select-ui.md` 的 Dependencies 和 Cross-References 中添加 `level-data-schema.md`。

⚠️ **[C-07] audio-manager 正式 Dependencies 节不完整**

仅列出网格连线引擎，但 Interactions 表显示还依赖游戏状态机（LevelComplete 触发）和本地存储（静音偏好读写）。

**修复**: 添加游戏状态机和本地存储到 audio-manager.md Dependencies 节。

⚠️ **[C-08] grid-connection-engine 未在 Cross-References 中引用 in-game-hud**

HUD 调用 engine.undo()，engine 向 HUD 发送 stepCount 和 currentNumber。但 engine 的 Interactions 表和 Cross-References 中均无 HUD。

**修复**: 在 engine 的 Interactions 表和 Cross-References 中添加 in-game-hud。

⚠️ **[C-09] game-state-machine Interactions 表遗漏观察者**

未列出 level-complete-overlay（触发 NEXT_LEVEL/BACK_TO_MENU）和 audio-manager（监听 LevelComplete 播音频）。

**修复**: 添加这两个系统到 state-machine 的 Interactions 表。

⚠️ **[C-10] local-storage Overview 描述与实际写入策略不符**

Overview 声称"所有读写操作为同步写"，但 Detailed Design 定义了三种写入策略：同步写（关卡通关）、延迟写（设置 500ms 防抖）、会话结束写（元数据）。

**修复**: 修改 Overview 为"关键进度数据同步写入，设置延迟写入，元数据会话结束时写入"。

⚠️ **[C-11] 3 个 UI GDD 的 Cross-References 节为空**

`level-select-ui.md`、`in-game-hud.md`、`level-complete-overlay.md` 没有 Cross-References 表（其他 8 个 GDD 均有完整表格）。不利于后续变更影响的追溯。

**修复**: 为三个 UI GDD 添加 Cross-References 表，列出各自引用的系统。

⚠️ **[C-12] step-scoring 公式中 actualSteps 文档范围错误**

Formulas 节标注 actualSteps 范围为 `[optimalSteps, ∞)`，但实际上可以为 0（理论）或小于 optimalSteps（玩家找到比设计最优更短的路径）。

**修复**: 改为 `actualSteps | int | [0, ∞)`。

⚠️ **[C-13] 状态机未文档化事件携带 payload**

"重玩"按钮发出 NEXT_LEVEL(levelId)，"下一关"按钮发出 NEXT_LEVEL(levelId+1)，但状态机的转换表未说明事件可携带参数。

**修复**: 在 game-state-machine.md 的 States and Transitions 表中添加"参数"列。

---

## 设计理论检查结果

### 阻塞项

（无）

### 警告项

⚠️ **[D-01] 星级解锁条件缺乏 UI 传达**

`level-data-schema.md` 定义了 `unlockCondition: {type: "stars", value: N}`，但 `level-select-ui.md` 只有 3 个视觉状态（Locked/Unlocked/Completed）。如果某关因星级不足而锁定，玩家看到的是普通灰色按钮，无从知道为什么被锁、需要多少星才能解锁。

**修复**: 添加第 4 个视觉状态"Locked — 需要 N 星"，或在 MVP 中仅使用通关解锁（取消星级解锁）。

⚠️ **[D-02] 三星阈值=1.0（精确最优）可能挫败休闲玩家**

当前 `starRatio ≤ 1.0 → ★★★`，多 1 步即降为 2 星。对于 10x10 网格 optimalSteps=50 的关卡，51 步（ratio=1.02）也得 2 星。目标受众包括《羊了个羊》等超休闲玩家，"差一点就完美"的感觉可能导向挫败而非重新挑战。

**修复**: 考虑将 ★★★ 默认阈值调至 1.1 或 1.15（Tuning Knob 安全范围已支持 [1.0, 1.2]）。

⚠️ **[D-03] 难度标签（1-5）为手工标注，无客观公式**

`level-data-schema.md` 的 `difficulty` 字段是手工元数据。对于 20 关手工设计勉强适用，但对于 30 关 AI 生成关卡，可能产生标注错误的难度，破坏解锁曲线的平滑性。

**修复**: 定义基于 grid 尺寸、节点数、障碍密度的启发式难度公式。例如：`difficulty = clamp(floor(rows*cols*0.1 + nodes*0.3 + blockedRatio*2), 1, 5)`。

⚠️ **[D-04] AI 生成关卡（第 21-50 关）缺少难度排序保证**

game-concept 的风险节明确提到"AI 关卡生成质量不可控"。MVP 中后 30 关为 AI 生成，但关卡求解器（负责验证和计算最优解）属于 Vertical Slice——不在 MVP 内。这意味着 AI 生成的关卡在 MVP 中无法自动验证唯一最优解（违反 Pillar 1），也无法客观排序难度。

**修复**: 将关卡求解器的核心验证功能提前到 MVP。或改为 MVP 仅 20 关手工设计，30 关 AI 生成推迟到 Vertical Slice。

⚠️ **[D-05] 步数评分系统声明的支柱（P1 纯逻辑）关联薄弱**

`step-scoring.md` 声明实现 Pillar 1，但评分系统不决定谜题是否逻辑驱动或是否随机（那是 level-data-schema 和求解器的职责）。评分系统更适合 Pillar 2（一分钟一关——快速结算有助于快速进入下一关）。

**修复**: 将声明的支柱改为 P2，或补充说明间接联系："评分通过提供透明、确定性的表现评估来强化 P1"。

⚠️ **[D-06] systems-index 设计顺序将 UI 排在核心引擎之前**

推荐设计顺序中 #7 是关卡选择界面（Presentation 层），#8 才是网格连线引擎（Core 层）。虽然技术上是独立可构建的，但应该在验证核心手感之后再投入菜单界面。

**修复**: 交换顺序——引擎 #7，关卡选择 #8。或在实施时使用 mock 数据先行构建关卡选择。

---

## 跨系统场景走查结果

**走查场景**: 6 个（选择关卡并开始、画线核心循环、通关结算、撤销操作、暂停/恢复、重玩刷星）

### 阻塞项

🔴 **[S-01] 重玩刷星 — NEXT_LEVEL 条件阻止末关重玩**

**涉及系统**: game-state-machine + level-complete-overlay
同上 C-04。在末关（id=50）点重玩时，state-machine 检查"存在下一关(id=51)"→ 不存在 → 拒绝转换。

### 警告项

⚠️ **[S-02] 撤销按钮依赖引擎内部状态但未暴露 API**

**涉及系统**: in-game-hud + grid-connection-engine
HUD 规则 2："仅在 Drawing/Dirty 状态且 path 非空时可点击"。但 engine 的内部状态（Drawing/Dirty）没有暴露给 HUD 的接口。HUD 无法判断 engine 当前内部状态。

**修复**: engine 暴露 `canUndo(): boolean` 或 `getPathLength(): number` 接口。

⚠️ **[S-03] stepCount 双重维护风险**

**涉及系统**: grid-connection-engine + step-scoring
Engine 维护 `stepCount` 变量，step-scoring 也维护自己的 `stepCount`。engine 发送增量通知（+1/-1），scoring 据此更新自己的计数器。如果一条通知丢失或重复，两个计数将不同步且无法检测。

**修复**: 考虑使用单一数据源——engine 持有 stepCount 绝对值，scoring 每次读取最新值，或 engine 发送绝对值而非增量。

⚠️ **[S-04] levelId 从关卡选择到引擎的数据传递链路不完整**

**涉及系统**: level-select-ui → game-state-machine → scene-manager → grid-connection-engine
level-select-ui 触发 SELECT_LEVEL(levelId)，state-machine 切换状态，scene-manager 通过场景参数传 levelId 给引擎。但 state-machine 和 scene-manager 的接口均未正式文档化 levelId 参数的传递。链路是隐式的。

**修复**: 在 game-state-machine 的 Events 表中添加参数列；在 scene-manager 的 Interactions 中明确"接收并转发 levelId"。

---

## 需修订的 GDD

| GDD | 原因 | 类型 | 优先级 |
|-----|------|------|--------|
| step-scoring.md | 公式阈值矛盾 (C-01) | 一致性 | 阻塞 |
| grid-connection-engine.md | stepCount 数据流向矛盾 (C-03) | 一致性 | 阻塞 |
| game-state-machine.md | NEXT_LEVEL 条件阻止末关重玩 (C-04) | 一致性 | 阻塞 |
| game-concept.md | MVP 范围与 systems-index 矛盾 (C-05) | 一致性 | 阻塞 |
| step-scoring.md + grid-connection-engine.md | LEVEL_COMPLETE 事件流未定义 (C-02) | 一致性 | 阻塞 |
| level-select-ui.md | 缺少 level-data-schema 依赖 (C-06)、缺少 Cross-References (C-11) | 一致性 | 警告 |
| audio-manager.md | Dependencies 不完整 (C-07) | 一致性 | 警告 |
| in-game-hud.md | 缺少 Cross-References (C-11)、撤销按钮状态判断依赖未暴露接口 (S-02) | 一致性+场景 | 警告 |
| level-complete-overlay.md | 缺少 Cross-References (C-11)、NEXT_LEVEL vs REPLAY (S-01) | 一致性+场景 | 警告 |
| local-storage.md | Overview 描述不准确 (C-10) | 一致性 | 警告 |
| systems-index.md | MVP 范围矛盾 (C-05)、设计顺序建议 (D-06) | 范围+设计 | 警告 |
| level-data-schema.md | 难度标签无公式 (D-03) | 设计理论 | 警告 |

---

## 裁决: **FAIL**

5 个阻塞项必须在架构设计开始前解决：
1. C-01: 步数评分公式阈值矛盾
2. C-02: LEVEL_COMPLETE 事件流未定义
3. C-03: stepCount pull vs push 矛盾
4. C-04: NEXT_LEVEL 在末关拒绝重玩
5. C-05: MVP 范围矛盾（提示系统属于 MVP 还是 VS）

### 阻塞项修复后重新运行 /review-all-gdds 前需完成的操作：
- 统一 step-scoring.md 的公式（保留调优参数引用）
- 在 engine + scoring + state-machine 三个 GDD 中统一 LEVEL_COMPLETE 事件流
- 将 grid-connection-engine.md 的 Dependencies 和 Interactions 统一为 Push 模型
- 在 game-state-machine.md 中新增 REPLAY 事件或修改 NEXT_LEVEL 条件
- 对齐 game-concept.md 和 systems-index.md 的 MVP 范围定义
