# Story 006: 配置驱动参数

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Config/Data
> **Estimate**: 1h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-23

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-007`

**ADR Governing Implementation**: ADR-0009: 玩家控制器与触屏射击架构
**ADR Decision Summary**: 所有调优参数（deadzone, max_radius, tap_threshold, split_x）从配置文件读取——无硬编码值。MVP 阶段至少支持 deadzone 和 tap_threshold 的热调整（用于 A/B 测试）

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: JSON.parse_string() 读取配置；ResourceLoader 备用

**Control Manifest Rules (this layer)**:
- Required: 所有游戏数值从外部配置文件读取——不硬编码
- Forbidden: 禁止在脚本中 `const DEADZONE = 20`——必须在配置文件中定义
- Guardrail: 配置文件缺失时使用代码内默认回退值

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [ ] **AC14**: GIVEN `split_x` 配置为 `screen_width * 0.3`，WHEN 触控点在 30% 左侧，THEN 归属于左区；在 30% 右侧则归属右区
- [ ] **AC15**: 无硬编码值——所有调优参数（deadzone, max_radius, tap_threshold, split_x）均从配置文件读取

---

## Implementation Notes

*Derived from ADR-0009 Implementation Guidelines:*

- 创建配置文件：`assets/data/touch_input_config.json`
- 配置结构：
  ```json
  {
    "deadzone": 20,
    "max_radius": 200,
    "tap_threshold": 200,
    "split_x_ratio": 0.5
  }
  ```
- `split_x = screen_width * split_x_ratio`——使用比例而非像素值，适配不同分辨率
- TouchInput `_ready()` 中加载配置：`FileAccess.open()` → `JSON.parse_string()` → 验证值在安全范围内
- 安全范围验证（从 GDD Tuning Knobs 表）：
  - deadzone: 10~50 px
  - max_radius: 100~300 px
  - tap_threshold: 150~300 ms
  - split_x_ratio: 0.3~0.7
- 配置文件缺失或值越界→使用代码内硬编码默认值并打印 `push_warning()`
- 提供 `reload_config()` 方法：重新读取配置文件，运行时热更新参数（用于 A/B 测试）

---

## Out of Scope

- Story 001-004: 参数的具体消费——分区逻辑、移动计算、射击判定各自读取 TouchInput 的属性（deadzone/max_radius 等），本故事仅负责加载和验证配置文件
- 其他系统的配置文件管理

---

## QA Test Cases

### AC14: 可配置 split_x
- Given: 配置文件 `split_x_ratio = 0.3`；屏幕宽度 1080px（split_x = 324）
- When: 触控点在 x=200 按下；触控点在 x=400 按下
- Then: x=200 → 左区归属；x=400 → 右区归属

### AC14 边界值: split_x_ratio = 0.3（合法最小值）
- Given: `split_x_ratio = 0.3`；屏幕宽度 1080px
- When: 触控点在 x=323（刚好 < split_x=324）和 x=324（≥ split_x）
- Then: x=323 → 左区；x=324 → 右区

### AC14 边界值: split_x_ratio = 0.7（合法最大值）
- Given: `split_x_ratio = 0.7`；屏幕宽度 1080px（split_x = 756）
- When: 触控点在 x=755（< split_x）和 x=756（≥ split_x）
- Then: x=755 → 左区；x=756 → 右区

### AC14 Edge: split_x_ratio 小于 0.3（越界）
- Given: 配置文件 `split_x_ratio = 0.1`
- When: TouchInput 加载配置
- Then: 回退到默认值 0.5 + `push_warning()`；split_x = screen_width * 0.5

### AC15: 零硬编码值
- Given: 代码仓库中的 `touch_input.gd`
- When: 搜索 `const DEADZONE`、`const MAX_RADIUS`、`const TAP_THRESHOLD`、`const SPLIT_X` 或任何硬编码的数值型 tuning 参数
- Then: 不存在上述硬编码常量

### AC15 验证: 配置文件缺失 → 回退默认值
- Given: `assets/data/touch_input_config.json` 不存在
- When: TouchInput 启动
- Then: 使用 GDD 默认值（deadzone=20, max_radius=200, tap_threshold=200, split_x_ratio=0.5）+ `push_warning()`

### AC15 验证: 配置值越界 → 回退默认值
- Given: 配置文件中 deadzone=5（< 安全范围 10~50）
- When: TouchInput 加载配置
- Then: deadzone 回退到 20 + `push_warning()`

### AC15 验证: 配置值在安全边界上 → 允许使用
- Given: 配置文件中 deadzone=10（= 安全范围最小值）
- When: TouchInput 加载配置
- Then: deadzone=10 正常使用，无 warning

### AC15 验证: JSON 格式错误
- Given: `touch_input_config.json` 包含非 JSON 文本
- When: TouchInput 加载配置
- Then: 所有参数使用默认值 + `push_warning()`

### AC15 验证: JSON 缺少 key → 该 key 使用默认值
- Given: 配置文件中仅包含 `{"deadzone": 25}`（缺少 max_radius, tap_threshold, split_x_ratio）
- When: TouchInput 加载配置
- Then: deadzone=25（来自配置）；其他三个参数使用 GDD 默认值

### AC15 验证: JSON 包含未知 key → 忽略
- Given: 配置文件包含 `{"deadzone": 20, "unknown_key": 999}`
- When: TouchInput 加载配置
- Then: deadzone=20 正常使用；unknown_key 被忽略，无 crash

### AC15 验证: 负值参数 → 回退
- Given: 配置文件中 max_radius = -50
- When: TouchInput 加载配置
- Then: max_radius 回退到默认值 200 + `push_warning()`

### reload_config() 热更新
- Given: 游戏运行中，配置文件中 deadzone=20
- When: 修改配置文件 deadzone=30 → 调用 `reload_config()`
- Then: deadzone 立即更新为 30，后续触控使用新值

### reload_config() 热更新 → 无效值回退
- Given: 游戏运行中，当前 deadzone=20
- When: 修改配置文件 deadzone=5（越界）→ 调用 `reload_config()`
- Then: deadzone 回退到 20（默认值）+ `push_warning()`

---

## Test Evidence

**Story Type**: Config/Data
**Required evidence**: Smoke check pass (`production/qa/smoke-config-[date].md`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001-005 — 所有功能逻辑必须先实现，配置驱动是最后的系统化
- Unlocks: None — Epic 最后一个故事
