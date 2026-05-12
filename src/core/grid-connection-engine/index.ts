/**
 * 网格连线引擎 (Grid Connection Engine) — barrel export
 *
 * 统一导出所有类型定义、枚举和引擎组件。
 * 外部模块通过此文件引用本模块的公开 API。
 *
 * @module grid-connection-engine
 */

export { GridConnectionEngine } from './GridConnectionEngine';
export { EngineState, ArrowDirection } from './types';
export type {
  Cell,
  PathEntry,
  ArrowData,
  GridLayout,
  EngineEventType,
  EngineEvent,
  EngineCallback,
  StepChangeData,
} from './types';
