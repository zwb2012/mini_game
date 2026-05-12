/**
 * 关卡数据模块 (Level Data Schema) — barrel export
 *
 * 统一导出所有类型定义、接口和校验函数。
 * 外部模块通过此文件引用本模块的公开 API。
 *
 * 用法:
 * ```typescript
 * import { LevelData, Level, validateLevelData } from '@core/level-data-schema';
 * ```
 *
 * @module level-data-schema
 */

export type { CellCoord, NodeData, Level, LevelData, ILevelDataProvider } from './types';
export { validateLevelData } from './validation';
export type { ValidationResult } from './validation';
export { LevelDataProvider } from './LevelDataProvider';
