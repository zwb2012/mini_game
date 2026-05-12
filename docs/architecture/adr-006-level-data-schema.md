# ADR-006: 关卡数据格式与校验策略

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Data |
| **Knowledge Risk** | LOW — `resources.load()` 是 Cocos 3.0+ 核心 API，JSON 解析为纯 JavaScript，无引擎版本依赖 |
| **References Consulted** | `docs/engine-reference/cocos/VERSION.md`, `design/gdd/level-data-schema.md`, `docs/architecture/architecture.md`, `docs/architecture/adr-004-platform-adapter.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 50 关 JSON (~50KB) 在微信小游戏真机上 `resources.load()` + 校验 ≤100ms |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-002 (网格渲染——引擎初始化读取 Level 数据), ADR-007 (步数评分——读取 optimalSteps), ADR-008 (提示系统——BFS 读网格尺寸约束) |
| **Blocks** | Epic `grid-connection-engine` — 引擎初始化依赖关卡数据加载；Epic `level-select-ui` — 界面渲染依赖关卡元数据 |
| **Ordering Note** | Foundation 层——必须在 ADR-002（Core 层网格渲染）实现前 Accept。与 ADR-004（平台适配层）并行——均无相互依赖 |

## Context

### Problem Statement

数字连线有 50 关（MVP 20 手工 + 30 AI 生成），每关包含网格尺寸、节点坐标、障碍格、最优步数和元信息。关卡数据是 Foundation 层的数据契约——网格连线引擎读取几何数据渲染可玩关卡、步数评分系统读取 optimalSteps 作为评分基准、关卡选择界面读取元信息渲染按钮列表。如果没有统一的加载策略和校验规则，将导致三个问题：

1. **数据损坏静默传播**：一个拼错的节点坐标可能在构建时不报错，到运行时玩家才发现关卡不可解
2. **加载策略不一致**：每个消费者各自解析 JSON → 重复代码、错误处理不一致
3. **Schema 演进无门禁**：新增字段或修改格式时无法验证旧关卡数据是否兼容

### Constraints
- 微信小游戏包体限制 2MB——50 关 JSON 数据必须极小（当前估算 ~50KB）
- MVP 仅需本地关卡——不依赖服务器下发
- 关卡数据在构建时已知——适合编译期校验而非运行时校验
- 遵循 Pillar 4（越简单越好）——单文件、零运行时依赖
- 遵循 Pillar 1（纯逻辑零运气）——每关数据在构建时已通过求解器验证

### Requirements
- 支持从 `resources/` 目录加载单个 JSON 文件包含全部 50 关
- 构建时校验所有必填字段、坐标范围、节点连续性
- 运行时加载后二次校验（防止打包过程中数据损坏）
- 加载失败有明确错误信息——不静默跳过坏数据
- 支持 Schema 版本号——未来格式变更可平滑升级

## Decision

采用**单 JSON 文件 + 构建时校验 + 运行时防御性校验**——全部关卡数据打包为单个 `levels.json` 文件置于 `resources/` 目录，通过 `resources.load('levels', (err, asset) => ...)` 加载。构建时运行 JSON Schema 校验脚本（Node.js，非 Cocos 运行时），运行时在加载完成后对每关执行快速字段校验。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                  LevelDataProvider                    │
│                                                      │
│  loadLevels(): Promise<LevelData>                    │
│  getLevel(id: number): Level                         │
│  getLevelCount(): number                             │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────┐        │
│  │  Load Step   │    │   Validate Step       │        │
│  │              │    │                      │        │
│  │ resources.   │───→│  validateSchema()    │        │
│  │ load('levels')│   │  validateLevel(lvl)  │        │
│  │              │    │  → {ok, errors[]}    │        │
│  └─────────────┘    └──────────────────────┘        │
│         │                      │                     │
│    Cocos Asset Mgr      Pure TypeScript              │
│    (唯一引擎依赖)         (可单元测试)                  │
└──────────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
  Engine   Scoring   LevelSelect    (future: Solver)
  (Level)  (optSteps) (id/name/diff)
```

### Key Interfaces

```typescript
/** 关卡数据容器——与 GDD level-data-schema.md 定义一致 */
interface LevelData {
  version: string;       // Schema 版本（"1.0"）
  levels: Level[];       // 按 id 升序排列
}

/** 单关数据 */
interface Level {
  id: number;
  name: string;
  chapter: number;
  difficulty: number;     // 1-5
  grid: { rows: number; cols: number };
  nodes: NodeData[];      // 按 number 升序
  blockedCells: CellCoord[];
  optimalSteps: number;
  unlockCondition: { type: 'stars'; value: number } | null;
}

interface NodeData {
  number: number;         // 从 1 开始连续
  row: number;
  col: number;
}

interface CellCoord {
  row: number;
  col: number;
}

/** 关卡数据提供者——唯一的加载入口 */
interface ILevelDataProvider {
  /** 加载全部关卡数据。失败抛异常——调用者负责处理 */
  loadLevels(): Promise<LevelData>;

  /** 按 id 获取单关数据。id 不存在返回 null */
  getLevel(id: number): Level | null;

  /** 获取关卡总数 */
  getLevelCount(): number;
}
```

**加载实现**：

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
          reject(new Error(
            `[LevelData] Validation failed:\n${validation.errors.join('\n')}`
          ));
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

**校验规则（运行时——与 GDD 验收标准一致）**：

```typescript
function validateLevelData(data: LevelData): ValidationResult {
  const errors: string[] = [];

  if (!data.version) errors.push('Missing version field');
  if (!Array.isArray(data.levels)) errors.push('levels must be an array');

  for (const level of data.levels) {
    // grid 范围检查
    if (level.grid.rows < 3 || level.grid.rows > 10)
      errors.push(`Level ${level.id}: grid.rows ${level.grid.rows} out of [3,10]`);
    if (level.grid.cols < 3 || level.grid.cols > 10)
      errors.push(`Level ${level.id}: grid.cols ${level.grid.cols} out of [3,10]`);

    // nodes 连续性检查
    const numbers = level.nodes.map(n => n.number);
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] !== i + 1)
        errors.push(`Level ${level.id}: nodes not consecutive — expected ${i+1}, got ${numbers[i]}`);
    }
    if (numbers.length < 2)
      errors.push(`Level ${level.id}: must have ≥2 nodes`);

    // 坐标不重复
    const coordSet = new Set<string>();
    for (const n of level.nodes) {
      const key = `${n.row},${n.col}`;
      if (coordSet.has(key))
        errors.push(`Level ${level.id}: duplicate node at (${n.row},${n.col})`);
      coordSet.add(key);
      if (n.row < 0 || n.row >= level.grid.rows)
        errors.push(`Level ${level.id}: node ${n.number} row ${n.row} out of bounds`);
      if (n.col < 0 || n.col >= level.grid.cols)
        errors.push(`Level ${level.id}: node ${n.number} col ${n.col} out of bounds`);
    }

    // optimalSteps ≥ 1
    if (level.optimalSteps < 1)
      errors.push(`Level ${level.id}: optimalSteps ${level.optimalSteps} must be ≥ 1`);

    // 障碍格不覆盖所有空格
    const totalCells = level.grid.rows * level.grid.cols;
    if (level.blockedCells.length >= totalCells - level.nodes.length)
      errors.push(`Level ${level.id}: too many blocked cells — no path space left`);
  }

  return { ok: errors.length === 0, errors };
}
```

**构建时校验**（Node.js 脚本 `tools/validate-levels.js`）：
- 读取 `assets/resources/levels.json`
- 执行与运行时相同的字段校验
- 额外执行：nodes 坐标不重复、nodes 均在网格范围内、障碍格不与节点重合
- 校验失败 → 构建中断（`exit(1)`）
- 集成到 CI pipeline——每次 PR 自动执行

### Schema 版本策略

- `version: "1.0"` — MVP 格式
- 若未来需新增字段（如 `hintOptimalPath`），升级 `version` 至 `"1.1"`
- 运行时校验：`version` 不匹配 → 拒绝加载 + 明确错误信息
- 不使用语义化版本（`1.0.0`）——关卡数据格式变更是结构性变更，非功能变更

## Alternatives Considered

### Alternative 1: Asset Bundle 按章节分包
- **Description**: 每章（~10 关）一个 Cocos Asset Bundle，按需加载，减少启动时内存占用
- **Pros**: 内存友好——每次只加载当前章节数据；Cocos 原生支持热更新 Asset Bundle
- **Cons**: 增加构建配置复杂度（N 个 Bundle 配置）；50 关 × 500 bytes ≈ 25KB——全量加载内存开销微不足道；MVP 仅 3 章——分包收益微乎其微
- **Rejection Reason**: 50 关 JSON 仅 ~25KB——全量加载内存 <100KB。Asset Bundle 的配置和管理开销远大于其收益。未来若扩展至 500+ 关，可重访此决策

### Alternative 2: 远程配置下发
- **Description**: 关卡数据存放在后端，客户端启动时从服务器拉取，支持不更新包体即新增关卡
- **Pros**: 无需更新客户端即可添加/调整关卡；支持 A/B 测试关卡难度；运营灵活性最高
- **Cons**: 依赖网络——弱网环境首关加载延迟不可接受；增加后端 API 和 CDN 成本；微信小游戏 2MB 包体限制下 25KB 关卡数据不构成压力
- **Rejection Reason**: MVP 无后端关卡下发需求——50 关本地打包完全满足。远程下发为 Live-Ops 阶段功能（Alpha+），届时可通过新增 `RemoteLevelDataProvider` 实现 `ILevelDataProvider` 接口——本 ADR 的接口设计已预留此扩展点

### Alternative 3: 运行时 JSON Schema 库校验（如 ajv）
- **Description**: 使用 JSON Schema 标准 + ajv 校验器在运行时验证关卡数据
- **Pros**: 校验规则声明式、标准化——不需手写校验逻辑
- **Cons**: ajv 压缩后 ~30KB——微信小游戏 2MB 包体限制下不值得为一个校验器消耗 1.5% 包体；校验逻辑仅 100 行 TypeScript——手写足够且零依赖
- **Rejection Reason**: 违反 Pillar 4（越简单越好）。100 行纯 TypeScript 校验函数完成同样功能，无包体开销、无依赖风险、更易调试

## Consequences

### Positive
- 统一加载入口——所有系统通过 `ILevelDataProvider` 获取关卡数据，加载策略和校验规则集中管理
- 构建时 + 运行时双校验——构建时捕获数据错误，运行时防止打包损坏，关卡数据可靠性双保险
- 接口预留扩展点——若未来需支持远程下发，只需新增 `RemoteLevelDataProvider` 实现同名接口，不修改任何消费者
- 纯 TypeScript 校验逻辑——可脱离 Cocos 运行时单元测试，满足 80%+ 覆盖率要求
- 包体极小——50 关 JSON ~25KB，校验代码 ~3KB，零外部依赖

### Negative
- 全量加载 50 关数据——内存中始终持有全部关卡（~100KB 解析后对象），不按需释放
  - **缓解**: 50 关数据量极小——100KB 在 100MB 内存上限中占 0.1%。若扩展至 500+ 关，可重访 Alternative 1
- 版本号手动管理——Schema 演进时需人工更新 version 字段和校验规则
  - **缓解**: 构建时校验脚本会检测 version 与校验规则的一致性；CI 中强制校验

### Risks
- `resources.load()` 在微信小游戏环境中可能因文件打包路径问题加载失败
  - **缓解**: 在微信开发者工具 + 真机（低端 Android）验证加载成功；失败时提供明确错误信息而非白屏
- 构建时校验脚本可能漏检运行时才暴露的数据问题（如 JSON 中使用了 Unicode 不可见字符）
  - **缓解**: 运行时校验作为第二道防线——即使构建时校验通过，运行时仍执行完整字段校验

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| level-data-schema.md | LevelData JSON 格式 — version + levels[] 数组 (TR-LDS-001) | `LevelData` 接口精确映射 GDD 定义——`version: string` + `levels: Level[]` |
| level-data-schema.md | 单关数据结构 — grid, nodes, blockedCells, optimalSteps, unlockCondition (TR-LDS-002) | `Level` 接口包含全部必填字段；`ILevelDataProvider.getLevel(id)` 为统一访问入口 |
| level-data-schema.md | 数据校验 — nodes 连续、坐标不重复、grid [3,10]、optimalSteps >= 1 (TR-LDS-003) | `validateLevelData()` 实现全部 GDD 定义的校验规则——构建时 + 运行时双校验 |
| grid-connection-engine.md | 引擎读取 Level 数据渲染网格 (TR-GCE-001) | `ILevelDataProvider.getLevel(id)` → 引擎初始化时通过 Promise 获取 Level，包含 grid/nodes/blockedCells |
| step-scoring.md | 评分读取 optimalSteps 作为基准 (TR-SS-001) | `Level.optimalSteps` ——通过 `getLevel(id).optimalSteps` 获取，评分公式直接引用 |
| level-select-ui.md | 界面读取关卡元信息 (TR-UI-001) | `Level.id/name/chapter/difficulty` ——通过 `getLevel(id)` 获取按钮显示的元数据 |

## Performance Implications
- **CPU**: 校验 50 关 <10ms（纯字段检查），加载 JSON ~30ms（`resources.load` 异步，不阻塞主线程）
- **Memory**: ~100KB（50 关解析后 JS 对象——包含网格坐标和元信息）
- **Load Time**: <100ms（目标——微信真机测量）
- **Network**: 无（本地打包）

## Migration Plan
不适用——项目尚无关卡数据实现。`LevelDataProvider` 直接实现 `ILevelDataProvider` 接口，无需迁移。

## Validation Criteria
- `resources.load('levels', JsonAsset, cb)` 在微信开发者工具中成功加载并解析为 `LevelData` 对象
- `validateLevelData()` 拒绝 `grid.rows=12` 的关卡数据（范围外）并返回明确错误信息
- `validateLevelData()` 拒绝 `nodes.number = [1, 3]`（不连续）的关卡数据
- `validateLevelData()` 拒绝两个 Node 坐标相同的关卡数据
- 加载 50 关 JSON（~50KB 文件）在微信真机上 ≤100ms（`performance.now()` 打点）
- 构建脚本 `tools/validate-levels.js` 在校验失败时 `exit(1)`——CI pipeline 中验证

## Related Decisions
- ADR-001: 游戏状态机——Playing 状态进入后触发关卡加载
- ADR-003: 数据流模式——`ILevelDataProvider.getLevel()` 为 Pull 模式（一次性数据拉取）
- ADR-004: 平台适配层——关卡数据通过 `resources.load()` 加载，不依赖平台 API；local-storage 以 level.id 为 key 存储进度
