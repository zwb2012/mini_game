/**
 * 关卡数据接口定义 (Level Data Schema)
 *
 * 定义 LevelData、Level、NodeData、CellCoord 等核心数据结构，
 * 以及 ILevelDataProvider 接口。所有接口与 ADR-006 和
 * design/gdd/level-data-schema.md 保持一致。
 *
 * 本文件为零 Cocos 依赖的纯 TypeScript，可在 Jest 中独立测试。
 *
 * @module level-data-schema/types
 */

/** 单个网格单元格坐标 */
export interface CellCoord {
  /** 行号（从 0 开始） */
  row: number;
  /** 列号（从 0 开始） */
  col: number;
}

/** 关卡中的节点数据 */
export interface NodeData {
  /** 节点编号（从 1 开始，在同一关内必须连续） */
  number: number;
  /** 节点所在行 */
  row: number;
  /** 节点所在列 */
  col: number;
}

/** 单关数据结构 */
export interface Level {
  /** 关卡唯一 ID（在 levels 数组中唯一） */
  id: number;
  /** 关卡名称（如 "第一关"） */
  name: string;
  /** 所属章节编号 */
  chapter: number;
  /** 难度等级，范围 1-5 */
  difficulty: number;
  /** 网格尺寸（行数 x 列数），rows/cols 范围 [3, 10] */
  grid: { rows: number; cols: number };
  /** 节点列表，按 number 升序排列 */
  nodes: NodeData[];
  /** 障碍格坐标列表 */
  blockedCells: CellCoord[];
  /** 最优步数（求解器计算的理论最少步数），必须 >= 1 */
  optimalSteps: number;
  /** 解锁条件：null 表示默认解锁；{ type: 'stars', value: N } 表示需要累计 N 星 */
  unlockCondition: { type: 'stars'; value: number } | null;
}

/** 关卡数据容器——对应 resources/levels.json 的整体结构 */
export interface LevelData {
  /** Schema 版本号（如 "1.0"），用于未来格式演进兼容 */
  version: string;
  /** 关卡列表，按 id 升序排列 */
  levels: Level[];
}

/**
 * 关卡数据提供者接口——所有关卡数据的统一加载入口。
 *
 * 当前 MVP 通过 resources.load('levels', JsonAsset, cb) 实现，
 * 未来如需远程下发，只需新增 RemoteLevelDataProvider 实现此接口。
 */
export interface ILevelDataProvider {
  /** 加载全部关卡数据。失败抛异常——调用者负责处理 */
  loadLevels(): Promise<LevelData>;

  /** 按 id 获取单关数据。id 不存在返回 null */
  getLevel(id: number): Level | null;

  /** 获取关卡总数 */
  getLevelCount(): number;
}
