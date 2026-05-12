# Sprint 1 — 2026-05-12 to 2026-05-18

## Sprint Goal

完成核心玩法层通关检测与视觉渲染，激活 Foundation 层输入管线——使游戏从"逻辑骨架"变为"可触摸可玩的完整连线体验"。

## Capacity

- 总天数: 5
- 缓冲 (20%): 1 天
- 可用: 4 天

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent | Est. | Depends On | Acceptance Criteria |
|----|------|-------|------|------------|---------------------|
| GCE-005 | 通关检测与事件发射 | gameplay-programmer | 0.5d | GCE-004 ✓ | allCellsFilled → LEVEL_COMPLETE Push 事件 |
| GCE-006 | 视觉打磨——填充动画、路径渲染与音频同步 | gameplay-programmer | 1d | GCE-005 | Graphics 路径线、填充色覆盖、Label 池、TICK 音效 |
| IM-001 | 输入管理器——坐标映射与护栏 | engine-programmer | 0.5d | — | 屏幕坐标→网格坐标、滑动阈值 4px、Playing 状态守卫 |
| IM-002 | 输入管理器——Cocos 触摸管线集成 | engine-programmer | 0.5d | IM-001 | TOUCH_START/MOVE/END → INPUT_MOVE(row,col) 事件 |

### Should Have

| ID | Task | Agent | Est. | Depends On | Acceptance Criteria |
|----|------|-------|------|------------|---------------------|
| LS-001 | 平台存储适配器 | engine-programmer | 0.5d | — | IPlatformStorage 接口、微信优先 + cc.sys localStorage 回退 |
| LS-002 | 存储管理器 | engine-programmer | 0.5d | LS-001 | 关卡进度、设置、元数据读写 |

### Nice to Have

| ID | Task | Agent | Est. | Depends On | Acceptance Criteria |
|----|------|-------|------|------------|---------------------|
| LS-003 | 写入策略——防抖与容量管理 | engine-programmer | 0.25d | LS-002 | 通关同步写入、设置 500ms 防抖、存储满容 catch |

## Carryover from Previous Sprint

_(无——首个 Sprint)_

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Story 006 (Visual/Feel) 在微信真机上渲染性能不达标 | 中 | 高 | ADR-002 双 Graphics 组件分离优化作为备选方案 |
| TTF 字体资源缺失导致 Label 合批失效 (15 独立 draw call) | 高 | 中 | Story 006 前创建 TTF 字体或 BMFont 数字纹理 |
| 输入管线在微信低端设备上延迟 >50ms | 低 | 中 | 管线每步为纯函数，瓶颈在 Cocos 事件投递而非管线逻辑 |

## Dependencies on External Factors

- TTF 字体资源 (`assets/resources/fonts/`) — Story 006 需要；缺失则合批退化为 SystemFont（~15 draw call）
- 关卡数据文件 — 通关检测需完整关卡数据验证

## Definition of Done for this Sprint

- [ ] 所有 Must Have 任务完成并通过验收
- [ ] 所有 Logic/Integration stories 有通过测试（`tests/` 目录下）
- [ ] GCE-006 有可视化证据（截图/录屏 + 手动走查文档）
- [ ] 代码已 review 并合并
- [ ] Sprint 结束后 `grid-connection-engine` epic 完全 Done
- [ ] 核心玩法在 Cocos 预览器中可玩——网格可见 + 可触摸连线 + 通关触发
