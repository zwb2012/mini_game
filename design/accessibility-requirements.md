# Accessibility Requirements — 数字连线 (Number Link)

> **Status**: Draft
> **Created**: 2026-05-11
> **Tier**: Standard
> **Target Platform**: 微信小游戏 (WeChat Mini Game)
> **References**: game-concept.md, systems-index.md, ADR-002, technical-preferences.md

---

## Tier Selection

**Standard** — 核心玩法对所有玩家无障碍，关键交互有替代方案，视觉设计覆盖常见色觉障碍。

选择理由：
- 游戏核心机制依赖颜色区分 6 条连线路径——色盲模式为强制性需求（非可选）
- 游戏已有部分无障碍内建（44x44px 触控、数字标签、色盲友好色板）
- 微信小游戏平台的辅助功能 API 有限（无系统级屏幕阅读器集成）
- MVP 阶段聚焦核心可玩性——Comprehensive/Exemplary 层级需求推迟到 Vertical Slice

---

## Feature Matrix

### Vision

| Feature | Status | Details |
|---------|--------|---------|
| 色盲模式 | **Required — MVP** | 6 色色板已通过 protanopia/deuteranopia/tritanopia 色盲模拟器验证（ADR-002）。颜色有足够明度差（≥30% 亮度差），确保即使完全色盲也能按明度区分 |
| 数字节点标签 | **Already present** | 每个连线起点/终点显示数字（1, 2, 3...）——文字提供颜色之外的识别通道 |
| 高对比度模式 | **Deferred — Vertical Slice** | 网格线对比度从 #E0E0E0 可提升至 #BDBDBD |
| 文字缩放 | **Deferred — Alpha** | Label fontSize 从固定 14px 改为用户可选（S/M/L 三档） |
| 屏幕阅读器 | **Not applicable** | 微信小游戏环境不支持系统屏幕阅读器 API |

### Motor / Input

| Feature | Status | Details |
|---------|--------|---------|
| 最小触控区域 44×44px | **Already present** | All buttons, level select cells, and grid cells meet this minimum |
| 撤销按钮 | **Already present** | 滑错可立即撤销——降低精确滑动的要求 |
| 滑动阈值 4px | **Already present** | ADR-005 输入管线内置阈值——过滤手指颤抖 |
| 单手操作 | **Already present** | All core interactions reachable with one thumb |
| 替代输入方式 | **Deferred — Vertical Slice** | 逐格点按模式（tap-to-draw）作为滑动连线的替代——对手部活动受限玩家 |
| 输入速度调节 | **Deferred — Alpha** | Bresenham 插值容差可调——快速滑动阈值 |

### Audio

| Feature | Status | Details |
|---------|--------|---------|
| TICK 音效反馈 | **Already present** | 每步连线有咔嗒音效——触觉替代的听觉确认 |
| 静音开关 | **Required — MVP** | 已设计（audio-manager.md setMuted API + local-storage 持久化） |
| 音量独立控制 | **Deferred — Vertical Slice** | 音效/背景音独立音量滑块 |
| 视觉替代音频提示 | **Already present** | 所有音频事件有同步视觉反馈（格子填充动画 = TICK 的视觉替代） |

### Cognitive

| Feature | Status | Details |
|---------|--------|---------|
| 撤销/重试 | **Already present** | 无惩罚撤销——降低完美执行的认知压力 |
| 提示系统 | **Required — MVP** | 每日 3 次免费提示——卡关玩家的求助通道 |
| 步数对比 | **Already present** | 通关后显示"实际步数 / 最优步数"——清晰的成功度量 |
| 教程/引导 | **Deferred — Vertical Slice** | 首次启动 3 关引导（逐步介绍连线→撤销→提示） |
| 操作确认 | **Deferred — Vertical Slice** | "返回菜单"需要确认弹窗（防止误触） |

---

## Implementation Checklist

### MVP (must ship)

- [x] 色盲友好 6 色色板（ADR-002 LINE_COLORS）
- [x] 数字节点标签（Label 组件）
- [x] 44×44px 最小触控区域
- [x] 撤销按钮（无惩罚）
- [x] 静音开关 + 持久化
- [x] 视觉替代音频提示（格填充动画 = TICK 视觉对等物）
- [x] 提示系统（每日 3 次免费）

### Vertical Slice

- [ ] 高对比度网格线模式
- [ ] 点按模式（tap-to-draw 替代滑动）
- [ ] 音效/背景音独立音量
- [ ] 首次启动引导（3 关教程）
- [ ] 返回确认弹窗

### Alpha

- [ ] 可调字体大小（S/M/L）
- [ ] Bresenham 插值容差可调

---

## Verification

| Method | Frequency |
|--------|-----------|
| 色盲模拟器验证（Coblis / Color Oracle） | 每次新增颜色或 UI 元素时 |
| 真机触控测试（低端 Android） | 每 Sprint |
| 可玩性测试观察（无障碍玩家） | Vertical Slice + Polish 各 1 次 |
