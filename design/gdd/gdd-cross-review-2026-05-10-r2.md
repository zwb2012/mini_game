# 跨 GDD 复查报告（第 2 轮）

**日期**: 2026-05-10
**基于**: 第 1 轮评审（5 阻塞 + 14 警告）全部修复后复查
**范围**: 针对性验证——仅检查修改过的文件和原阻塞项

---

## 第 1 轮阻塞项 — 修复验证

| # | 原问题 | 修复内容 | 验证结果 |
|---|--------|---------|---------|
| C-01 | step-scoring ★ 阈值矛盾 | Detailed Design → 命名阈值 `THRESHOLD_THREE_STAR`/`THRESHOLD_TWO_STAR`，按序判断；Formulas 完全对齐；Tuning Knobs 变量名对应 | ✅ 三处一致 |
| C-02 | LEVEL_COMPLETE 事件流不明 | engine Interactions：向状态机发 LEVEL_COMPLETE + 同时向评分发 LEVEL_COMPLETE + finalStepCount | ✅ 双路径明确 |
| C-03 | stepCount push/pull 矛盾 | engine Dependencies 改为"评分系统接收引擎推送"；Interactions "推送 stepCount++" | ✅ Pull→Push 统一 |
| C-04 | 末关重玩被 NEXT_LEVEL 阻止 | state-machine 新增 `REPLAY` 事件（无条件）；overlay 重玩按钮改用 REPLAY；转换表增加参数列 | ✅ 末关可重玩 |
| C-05 | MVP 范围矛盾 | systems-index 提示系统从 VS 提到 MVP；依赖从求解器改为仅依赖引擎（简化路径查找） | ✅ game-concept 与 systems-index 对齐 |

## 第 1 轮警告项 — 修复验证

| # | 原问题 | 修复 | ✅ |
|---|--------|------|----|
| C-06 | level-select-ui 缺少 data-schema 依赖 | Dependencies 添加关卡数据结构 | ✅ |
| C-07 | audio-manager Dependencies 不完整 | 添加游戏状态机、本地存储 | ✅ |
| C-08 | engine 未引用 HUD | Interactions 添加游戏内 HUD 行 | ✅ |
| C-09 | state-machine 遗漏观察者 | Interactions 添加完成结算弹窗、音频管理器 | ✅ |
| C-10 | local-storage Overview 不准确 | Summary 改为三策略描述 | ✅ |
| C-11 | 3 个 UI GDD 无 Cross-References | 全部添加完整表格 | ✅ |
| C-12 | actualSteps 范围错误 | 随 C-01 修正为 [0, ∞) | ✅ |
| C-13 | 状态机未文档化事件 payload | 转换表增加参数列 | ✅ |
| D-03 | 难度标签无公式 | level-data-schema 添加启发式难度公式 | ✅ |
| D-05 | step-scoring 支柱声明弱 | 改为 Pillar 2（一分钟一关） | ✅ |
| S-02 | HUD 撤销依赖未暴露的引擎状态 | engine 规则 6 添加 `canUndo(): boolean` | ✅ |
| S-04 | levelId 数据流不完整 | 状态机参数列 + scene-manager 已文档化 | ✅ |

---

## 剩余未修复项（均为设计建议，不阻塞架构）

| # | 类别 | 内容 | 性质 |
|---|------|------|------|
| D-01 | 设计理论 | 星级解锁条件缺乏 UI 传达 | 需 UX 设计——将在 UI 实施阶段处理 |
| D-02 | 设计理论 | 三星阈值=1.0 对休闲玩家的宽容度 | Tuning Knob 已支持调整到 1.2，上线后数据驱动 |
| D-04 | 设计理论 | AI 生成关卡验证（求解器在 VS） | 风险已知——MVP 可改为纯手工 50 关或用简化验证 |
| D-06 | 设计理论 | 设计顺序建议 | 实施时灵活调整 |
| S-03 | 场景走查 | stepCount 双重维护 | C-03 Push 模型（引擎为唯一数据源）已缓解 |

---

## 双向依赖复查

所有 GDD 之间的依赖关系现已完整双向。快速抽查：

- level-data-schema ⇄ grid-connection-engine ✅
- level-data-schema ⇄ step-scoring ✅
- level-data-schema ⇄ level-select-ui ✅（本轮新增）
- game-state-machine ⇄ grid-connection-engine ✅
- game-state-machine ⇄ level-complete-overlay ✅（本轮新增）
- game-state-machine ⇄ audio-manager ✅（本轮新增）
- grid-connection-engine ⇄ in-game-hud ✅（本轮新增）
- grid-connection-engine ⇄ step-scoring ✅（C-02/C-03 修复）
- step-scoring ⇄ local-storage ✅
- local-storage ⇄ audio-manager ✅（本轮新增）

## 一致性快速扫描

- ✅ 所有状态名（Menu/Playing/Paused/LevelComplete）在 6 个引用 GDD 间一致
- ✅ 所有事件名（SELECT_LEVEL/PAUSE/RESUME/NEXT_LEVEL/REPLAY/BACK_TO_MENU/LEVEL_COMPLETE）一致
- ✅ 公式变量使用命名常量，不再有魔数冲突
- ✅ 新增的 REPLAY 事件正确传播到 overlay 的按钮表和 Interactions
- ⚠️ 提示系统 (#13) 状态仍为 "Not Started"——无设计文档。MVP 范围包含但尚未设计

---

## 裁决: **CONCERNS**

5 个原阻塞项全部解决。19 个原警告项中 14 个已修复，5 个为设计建议（非阻塞）。提示系统虽已纳入 MVP 但尚无设计文档——建议在架构开始前至少完成骨架设计。

**复查后建议操作**：
1. 使用 `/design-system 提示系统` 为提示系统撰写骨架 GDD（S 级工作量）
2. 运行 `/gate-check pre-production` 验证阶段门禁
3. 运行 `/create-architecture` 开始架构设计
