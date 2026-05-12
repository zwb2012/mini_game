# Story 001: 数据接口与校验逻辑

> **Epic**: level-data-schema
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: 2-3 hours

## Context

**GDD**: `design/gdd/level-data-schema.md`
**Requirements**: `TR-LDS-001` (LevelData JSON 格式 — version + levels[] 数组), `TR-LDS-002` (单关数据结构 — grid, nodes, blockedCells, optimalSteps, unlockCondition), `TR-LDS-003` (数据校验 — nodes 连续、坐标不重复、grid [3,10]、optimalSteps >= 1)

**ADR Governing Implementation**: ADR-006: 关卡数据格式与校验策略
**ADR Decision Summary**: 单 JSON + resources.load() + 运行时防御性校验。所有关卡数据打包为单个 `levels.json`。使用纯 TypeScript 校验函数（零外部依赖），构建时和运行时共用同一套校验规则。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 纯 TypeScript 类型定义和校验逻辑，零 Cocos API 依赖。可脱离引擎环境在 Jest 中完全测试。

**Control Manifest Rules (this layer)**:
- Required: 所有公共方法必须可单元测试（依赖注入优于单例）
- Required: 禁止 Foundation 层反向依赖 Core/Feature/Presentation
- Forbidden: 禁止使用 `Math.random()`（所有游戏逻辑确定性可重现）

---

## Acceptance Criteria

*From GDD `design/gdd/level-data-schema.md`:*

- [ ] **GIVEN** 一份符合 Schema 的 levels.json，**WHEN** 加载器解析它，**THEN** 返回 `LevelData` 对象，`levels` 数组按 `id` 升序排列
- [ ] **GIVEN** 一个 Level 对象，**WHEN** `nodes` 的 `number` 为 `[1, 2, 3]` 且连续，**THEN** 数据校验通过
- [ ] **GIVEN** 一个 Level 对象，**WHEN** `nodes` 的 `number` 为 `[1, 3]`（不连续），**THEN** 校验拒绝，返回明确错误信息
- [ ] **GIVEN** 一个 Level 对象，**WHEN** `grid.rows = 12`（超出 [3,10]），**THEN** 校验拒绝
- [ ] **GIVEN** 一个 Level 对象，**WHEN** 两个 Node 坐标相同，**THEN** 校验拒绝
- [ ] **GIVEN** 一个 Level 对象，**WHEN** `optimalSteps = 0`，**THEN** 校验拒绝

---

## Implementation Notes

*Derived from ADR-006 Decision:*

```typescript
interface LevelData { version: string; levels: Level[]; }
interface Level { id: number; name: string; chapter: number; difficulty: number; grid: { rows: number; cols: number }; nodes: NodeData[]; blockedCells: CellCoord[]; optimalSteps: number; unlockCondition: { type: 'stars'; value: number } | null; }
interface NodeData { number: number; row: number; col: number; }
interface CellCoord { row: number; col: number; }

interface ILevelDataProvider {
  loadLevels(): Promise<LevelData>;
  getLevel(id: number): Level | null;
  getLevelCount(): number;
}
```

`validateLevelData(data: LevelData): ValidationResult` 校验规则：
- `version` 必须存在且为非空字符串
- `levels` 必须为数组
- 每个 Level：grid.rows/cols 范围 [3,10]
- nodes.number 从 1 开始连续
- 坐标不重复（在同 Level 内）
- 坐标在网格范围内
- optimalSteps >= 1
- blockedCells 不覆盖所有剩余空格

校验函数为纯函数——返回 `{ ok: boolean, errors: string[] }`，不抛异常，不修改输入。

---

## Out of Scope

*Handled by neighbouring stories:*
- Story 002: `LevelDataProvider` 具体实现（`resources.load` 包装）、`tools/validate-levels.js` 构建脚本、示例 `levels.json`
- 关卡内容设计（不在本 epic 范围内）

---

## QA Test Cases

- **AC-1**: 有效 JSON 解析为 LevelData
  - Given: 符合 Schema 的 LevelData 对象
  - When: 校验函数处理它
  - Then: 返回 `{ ok: true, errors: [] }`
  - Edge cases: `levels` 为空数组（无关卡）→ 通过（但应警告）

- **AC-2**: nodes 连续校验通过
  - Given: nodes.number = [1, 2, 3]
  - When: validateLevelData
  - Then: ok = true

- **AC-3**: nodes 不连续校验拒绝
  - Given: nodes.number = [1, 3]
  - When: validateLevelData
  - Then: ok = false, errors 包含 "nodes not consecutive — expected 2, got 3"

- **AC-4**: grid.rows 超出范围
  - Given: grid.rows = 12
  - When: validateLevelData
  - Then: ok = false, errors 包含 "rows 12 out of [3,10]"

- **AC-5**: 坐标重复
  - Given: 两个 node 的 (row, col) 相同
  - When: validateLevelData
  - Then: ok = false, errors 包含 "duplicate node"

- **AC-6**: optimalSteps = 0
  - Given: optimalSteps = 0
  - When: validateLevelData
  - Then: ok = false, errors 包含 "optimalSteps 0 must be ≥ 1"

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/level-data-schema/data_validation.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None (Foundation layer, no dependencies)
- Unlocks: Story 002 (LevelDataProvider implementation)

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 6/6 passing (26 test functions cover all ACs + edge cases)
**Deviations**: None
**Test Evidence**: Logic — test file at `tests/unit/level-data-schema/data_validation.test.ts` (26 tests)
**Code Review**: Approved (pure TS, clean interfaces)
