# Story 002: 加载器与构建脚本

> **Epic**: level-data-schema
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: 2-3 hours

## Context

**GDD**: `design/gdd/level-data-schema.md`
**Requirements**: `TR-LDS-001` (LevelData JSON 格式), `TR-LDS-003` (数据校验)

**ADR Governing Implementation**: ADR-006: 关卡数据格式与校验策略
**ADR Decision Summary**: 单 JSON + resources.load() + 构建时+运行时双校验。LevelDataProvider 封装 resources.load 作为统一加载入口。构建时脚本 `tools/validate-levels.js` 在 CI 中执行相同校验逻辑。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: `resources.load('levels', JsonAsset, cb)` 是 Cocos 3.0+ 核心 API。需确认微信小游戏环境下文件打包路径正确。`cc.loader.loadRes` 在 3.x 已移除——必须使用 `resources.load`。

**Control Manifest Rules (this layer)**:
- Required: 所有公共方法必须可单元测试（依赖注入优于单例）
- Required: 禁止 Foundation 层反向依赖 Core/Feature/Presentation
- Forbidden: 引擎 API 约束 — `cc.loader.loadRes` 已移除，使用 `resources.load`
- Forbidden: 禁止使用 `Math.random()`

---

## Acceptance Criteria

*From GDD `design/gdd/level-data-schema.md`:*

- [ ] **GIVEN** 一份包含 50 关的有效 levels.json，**WHEN** 加载并校验全部，**THEN** 50 关全部通过，无遗漏
- [ ] **GIVEN** 关卡文件缺失或加载失败，**WHEN** `resources.load` 回调 error，**THEN** Promise reject，抛明确错误信息
- [ ] 性能：**GIVEN** 加载 50 关 JSON（~50KB），**WHEN** 调用 `loadLevels()`，**THEN** 在微信小游戏环境中 ≤ 100ms
- [ ] **GIVEN** 构建时运行校验脚本，**WHEN** levels.json 数据无效，**THEN** 脚本 `exit(1)`，输出具体错误

---

## Implementation Notes

*Derived from ADR-006:*

```typescript
import { resources, JsonAsset } from 'cc';

class LevelDataProvider implements ILevelDataProvider {
  private _levelData: LevelData | null = null;

  loadLevels(): Promise<LevelData> {
    return new Promise((resolve, reject) => {
      resources.load('levels', JsonAsset, (err, asset) => {
        if (err) {
          reject(new Error(`[LevelData] Failed to load levels.json: ${err.message}`));
          return;
        }
        const data = asset.json as LevelData;
        const validation = validateLevelData(data);
        if (!validation.ok) {
          reject(new Error(`[LevelData] Validation failed:\n${validation.errors.join('\n')}`));
          return;
        }
        this._levelData = data;
        resolve(data);
      });
    });
  }

  getLevel(id: number): Level | null {
    return this._levelData?.levels.find(l => l.id === id) ?? null;
  }

  getLevelCount(): number {
    return this._levelData?.levels.length ?? 0;
  }
}
```

**构建时脚本 `tools/validate-levels.js`**（Node.js）:
- 读取 `assets/resources/levels.json`
- 调用 `validateLevelData()` 相同校验逻辑
- 校验失败 → `console.error` 输出错误 → `process.exit(1)`
- 与 CI pipeline 集成

**示例数据**：在 `assets/resources/levels.json` 中放置 2-3 个有效关卡作为 MVP 开发用示例数据。

---

## QA Test Cases

- **AC-1**: 50 关全部通过
  - Given: 包含 50 个有效 Level 的 LevelData
  - When: LevelDataProvider.loadLevels()
  - Then: resolve 返回包含 50 个 level 的 LevelData
  - Edge cases: levels 数组排序校验（按 id 升序）

- **AC-2**: 加载失败 Promise reject
  - Given: resources.load 返回错误
  - When: LevelDataProvider.loadLevels()
  - Then: reject 抛出 Error，message 包含 "Failed to load levels.json"
  - Edge cases: 网络错误、资源路径错误、JSON 解析错误

- **AC-3**: getLevel 返回正确结果
  - Given: loadLevels() 已完成
  - When: getLevel(1)
  - Then: 返回 id=1 的 Level 对象
  - Edge cases: getLevel(999) 返回 null

- **AC-4**: getLevelCount
  - Given: loadLevels() 已完成
  - When: getLevelCount()
  - Then: 返回 50
  - Edge cases: 未加载时返回 0

- **AC-5**: 构建脚本校验失败
  - Given: levels.json 包含无效数据
  - When: node tools/validate-levels.js
  - Then: 输出具体错误，exit code = 1

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/level-data-schema/data_provider.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (数据接口与校验逻辑 — `ILevelDataProvider` 接口 + `validateLevelData()`)
- Unlocks: Core 层 epic (grid-connection-engine 依赖 LevelDataProvider 加载关卡数据)

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: all passing (17 test functions)
**Deviations**: None
**Test Evidence**: Logic — test file at `tests/unit/level-data-schema/data_provider.test.ts` (17 tests)
**Code Review**: Approved
