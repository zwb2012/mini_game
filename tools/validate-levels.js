/**
 * 关卡数据构建时校验脚本 (Build-time Level Data Validation)
 *
 * 在 CI/CD 或本地构建前执行，确保 assets/resources/levels.json
 * 中的数据格式正确、范围合法。
 *
 * 用法:
 *   node tools/validate-levels.js
 *
 * 返回值:
 *   0 — 校验通过
 *   1 — 校验失败（原因已输出到 stderr）
 *
 * 本脚本为 Node.js 独立版本，与 TypeScript 的 validateLevelData 共享相同校验逻辑，
 * 确保构建时和运行时行为一致。
 *
 * @module tools/validate-levels
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置常量（需与 validation.ts 中的 GRID_MIN/GRID_MAX 保持一致）
// ============================================================
const GRID_MIN = 3;
const GRID_MAX = 10;

// ============================================================
// 主流程
// ============================================================

const levelsPath = path.join(__dirname, '..', 'assets', 'resources', 'levels.json');

let raw;
try {
  raw = fs.readFileSync(levelsPath, 'utf-8');
} catch (err) {
  console.error(`[validate-levels] Cannot read ${levelsPath}: ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`[validate-levels] Invalid JSON in ${levelsPath}: ${err.message}`);
  process.exit(1);
}

const errors = [];

// ---- 顶层结构 ----
if (!data.version || typeof data.version !== 'string') {
  errors.push('version must be a non-empty string');
}

if (!Array.isArray(data.levels)) {
  errors.push('levels must be an array');
} else {
  // ---- 逐关校验 ----
  for (let i = 0; i < data.levels.length; i++) {
    validateLevel(data.levels[i], i, errors);
  }
}

// ---- 输出结果 ----
if (errors.length > 0) {
  console.error('Level data validation FAILED:');
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
} else {
  console.log(`Level data validation PASSED: ${data.levels.length} levels OK`);
  process.exit(0);
}

// ============================================================
// 单关校验
// ============================================================

/**
 * 校验单个 Level 对象。
 *
 * @param {object} level - 待校验的 Level 对象
 * @param {number} index - 在 levels 数组中的索引（用于错误信息）
 * @param {string[]} errors - 错误信息收集数组
 */
function validateLevel(level, index, errors) {
  const levelId = level.id !== undefined ? level.id : index;

  if (!level || typeof level !== 'object') {
    errors.push(`Level ${levelId}: must be an object`);
    return;
  }

  // ---- grid 范围 [3, 10] ----
  if (!level.grid || typeof level.grid !== 'object') {
    errors.push(`Level ${levelId}: grid must be an object`);
  } else {
    const rows = Number(level.grid.rows);
    const cols = Number(level.grid.cols);

    if (isNaN(rows) || rows < GRID_MIN || rows > GRID_MAX) {
      errors.push(`Level ${levelId}: rows ${rows} out of [${GRID_MIN},${GRID_MAX}]`);
    }
    if (isNaN(cols) || cols < GRID_MIN || cols > GRID_MAX) {
      errors.push(`Level ${levelId}: cols ${cols} out of [${GRID_MIN},${GRID_MAX}]`);
    }
  }

  // ---- nodes 校验 ----
  if (!Array.isArray(level.nodes)) {
    errors.push(`Level ${levelId}: nodes must be an array`);
  } else {
    // 至少 2 个节点
    if (level.nodes.length < 2) {
      errors.push(`Level ${levelId}: must have at least 2 nodes, got ${level.nodes.length}`);
    }

    // nodes.number 从 1 开始连续
    const sortedNodes = [...level.nodes].sort((a, b) => Number(a.number) - Number(b.number));
    for (let j = 0; j < sortedNodes.length; j++) {
      const expectedNum = j + 1;
      if (Number(sortedNodes[j].number) !== expectedNum) {
        errors.push(
          `Level ${levelId}: nodes not consecutive — expected ${expectedNum}, got ${sortedNodes[j].number}`,
        );
        break;
      }
    }

    // 坐标不重复 + 坐标在网格范围内
    const coordSet = new Set();
    const gridRows = level.grid ? Number(level.grid.rows) : Infinity;
    const gridCols = level.grid ? Number(level.grid.cols) : Infinity;

    for (const n of level.nodes) {
      const row = Number(n.row);
      const col = Number(n.col);

      if (isNaN(row) || isNaN(col)) {
        errors.push(`Level ${levelId}: node ${n.number} has invalid row/col`);
        continue;
      }

      const key = `${row},${col}`;
      if (coordSet.has(key)) {
        errors.push(`Level ${levelId}: duplicate node at (${row},${col})`);
      }
      coordSet.add(key);

      if (row < 0 || row >= gridRows) {
        errors.push(`Level ${levelId}: node ${n.number} row ${row} out of [0,${gridRows - 1}] bounds`);
      }
      if (col < 0 || col >= gridCols) {
        errors.push(`Level ${levelId}: node ${n.number} col ${col} out of [0,${gridCols - 1}] bounds`);
      }
    }
  }

  // ---- optimalSteps >= 1 ----
  const steps = Number(level.optimalSteps);
  if (isNaN(steps) || steps < 1) {
    errors.push(`Level ${levelId}: optimalSteps ${steps} must be >= 1`);
  }

  // ---- blockedCells 不覆盖所有剩余空格 ----
  if (Array.isArray(level.blockedCells) && level.grid) {
    const totalCells = Number(level.grid.rows) * Number(level.grid.cols);
    const nodeCount = Array.isArray(level.nodes) ? level.nodes.length : 0;
    if (level.blockedCells.length >= totalCells - nodeCount) {
      errors.push(
        `Level ${levelId}: too many blocked cells (${level.blockedCells.length}) — no path space left`,
      );
    }
  }
}
