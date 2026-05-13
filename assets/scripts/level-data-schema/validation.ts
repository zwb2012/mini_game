/**
 * 关卡数据校验函数 (Level Data Validation)
 *
 * 实现 ADR-006 定义的运行时校验规则：
 * - version 必须存在且为非空字符串
 * - levels 必须为数组
 * - 每关 grid.rows/cols 范围 [3, 10]
 * - nodes.number 从 1 开始连续
 * - nodes 坐标不重复（在同一 Level 内）
 * - nodes 坐标在网格范围内
 * - nodes.length >= 2
 * - optimalSteps >= 1
 * - blockedCells 不覆盖所有剩余空格（至少留一条路径空间）
 *
 * 校验函数为纯函数——返回 { ok, errors }，不抛异常，不修改输入。
 * 零外部依赖，可在 Node.js（Jest）和 Cocos 运行时中同时使用。
 *
 * @module level-data-schema/validation
 */

import { LevelData, NodeData } from './types';

/** 校验结果类型 */
export interface ValidationResult {
  /** 校验是否通过（errors 数组为空则 ok = true） */
  ok: boolean;
  /** 错误信息列表。通过时为空数组 */
  errors: string[];
}

/**
 * 网格尺寸有效范围
 */
const GRID_MIN = 3;
const GRID_MAX = 10;

/**
 * 校验完整关卡数据。
 *
 * @param data - 从 JSON 解析得到的 LevelData 对象
 * @returns 校验结果，包含 ok 标志和错误信息列表
 *
 * @example
 * ```typescript
 * const result = validateLevelData(parsedData);
 * if (!result.ok) {
 *   console.error('关卡数据校验失败:', result.errors.join('\n'));
 * }
 * ```
 */
export function validateLevelData(data: LevelData): ValidationResult {
  const errors: string[] = [];

  // 1. version 必须存在且为非空字符串
  if (!data.version || typeof data.version !== 'string') {
    errors.push('version must be a non-empty string');
  }

  // 2. levels 必须为数组
  if (!Array.isArray(data.levels)) {
    errors.push('levels must be an array');
    // 如果 levels 不是数组，无法继续逐关校验
    return { ok: false, errors };
  }

  // 逐关校验
  for (let i = 0; i < data.levels.length; i++) {
    const level = data.levels[i];
    // 关卡 id 可能缺失，使用索引作为后备标识
    const levelId = level.id !== undefined ? level.id : i;

    validateLevel(level, levelId, errors);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * 校验单个 Level 对象。
 *
 * @param level - 待校验的 Level 对象
 * @param levelId - 关卡标识（用于错误信息）
 * @param errors - 错误信息收集数组（直接 push）
 */
function validateLevel(
  level: Record<string, unknown> | any,
  levelId: number,
  errors: string[],
): void {
  // 字段存在性快速检查
  if (!level || typeof level !== 'object') {
    errors.push(`Level ${levelId}: must be an object`);
    return;
  }

  // === grid 范围检查 ===
  if (!level.grid || typeof level.grid !== 'object') {
    errors.push(`Level ${levelId}: grid must be an object`);
  } else {
    if (typeof level.grid.rows !== 'number' || level.grid.rows < GRID_MIN || level.grid.rows > GRID_MAX) {
      errors.push(`Level ${levelId}: rows ${level.grid.rows} out of [${GRID_MIN},${GRID_MAX}]`);
    }
    if (typeof level.grid.cols !== 'number' || level.grid.cols < GRID_MIN || level.grid.cols > GRID_MAX) {
      errors.push(`Level ${levelId}: cols ${level.grid.cols} out of [${GRID_MIN},${GRID_MAX}]`);
    }
  }

  // === nodes 校验 ===
  if (!Array.isArray(level.nodes)) {
    errors.push(`Level ${levelId}: nodes must be an array`);
  } else {
    // 至少需要 2 个节点
    if (level.nodes.length < 2) {
      errors.push(`Level ${levelId}: must have at least 2 nodes, got ${level.nodes.length}`);
    }

    // nodes.number 从 1 开始连续
    const sortedNodes = [...level.nodes].sort((a: NodeData, b: NodeData) => a.number - b.number);
    for (let j = 0; j < sortedNodes.length; j++) {
      const expectedNum = j + 1;
      if (sortedNodes[j].number !== expectedNum) {
        errors.push(
          `Level ${levelId}: nodes not consecutive — expected ${expectedNum}, got ${sortedNodes[j].number}`,
        );
        // 连续性检查出现第一个不连续即停止，避免重复错误
        break;
      }
    }

    // 坐标不重复 + 坐标在网格范围内
    const coordSet = new Set<string>();
    const gridRows = level.grid?.rows ?? Infinity;
    const gridCols = level.grid?.cols ?? Infinity;

    for (const n of level.nodes) {
      if (typeof n.row !== 'number' || typeof n.col !== 'number') {
        errors.push(`Level ${levelId}: node ${n.number} has invalid row/col`);
        continue;
      }

      const key = `${n.row},${n.col}`;
      if (coordSet.has(key)) {
        errors.push(`Level ${levelId}: duplicate node at (${n.row},${n.col})`);
      }
      coordSet.add(key);

      if (n.row < 0 || n.row >= gridRows) {
        errors.push(`Level ${levelId}: node ${n.number} row ${n.row} out of [0,${gridRows - 1}] bounds`);
      }
      if (n.col < 0 || n.col >= gridCols) {
        errors.push(`Level ${levelId}: node ${n.number} col ${n.col} out of [0,${gridCols - 1}] bounds`);
      }
    }
  }

  // === optimalSteps >= 1 ===
  if (typeof level.optimalSteps !== 'number' || level.optimalSteps < 1) {
    errors.push(`Level ${levelId}: optimalSteps ${level.optimalSteps} must be >= 1`);
  }

  // === blockedCells 不覆盖所有剩余空格 ===
  if (Array.isArray(level.blockedCells) && level.grid) {
    const totalCells = level.grid.rows * level.grid.cols;
    const nodeCount = Array.isArray(level.nodes) ? level.nodes.length : 0;
    if (level.blockedCells.length >= totalCells - nodeCount) {
      errors.push(`Level ${levelId}: too many blocked cells (${level.blockedCells.length}) — no path space left`);
    }
  }
}
