/**
 * 关卡数据加载器 (Level Data Provider)
 *
 * 实现 ILevelDataProvider 接口，通过 Cocos Creator 的 resources.load 加载
 * assets/resources/levels.json，并在加载后执行运行时校验。
 *
 * 用法:
 * ```typescript
 * const provider = new LevelDataProvider();
 * try {
 *   const levelData = await provider.loadLevels();
 *   const level = provider.getLevel(1);
 *   console.log(provider.getLevelCount()); // 关卡总数
 * } catch (err) {
 *   console.error('关卡数据加载失败:', err);
 * }
 * ```
 *
 * @module level-data-schema/LevelDataProvider
 */

import { resources, JsonAsset } from 'cc';
import { ILevelDataProvider, LevelData, Level } from './types';
import { validateLevelData } from './validation';

export class LevelDataProvider implements ILevelDataProvider {
  private _levelData: LevelData | null = null;

  /**
   * 从 resources/levels.json 加载全部关卡数据。
   *
   * 加载后自动执行 validateLevelData 校验：
   * - 校验通过 → 存储数据并 resolve
   * - 校验失败 → reject（不存储任何数据）
   * - resources.load 失败 → reject
   *
   * @returns Promise，resolve 时返回完整 LevelData
   */
  loadLevels(): Promise<LevelData> {
    return new Promise<LevelData>((resolve, reject) => {
      resources.load('levels', JsonAsset, (err: Error | null, asset: JsonAsset | null) => {
        if (err) {
          reject(new Error(`[LevelData] Failed to load levels.json: ${err.message}`));
          return;
        }
        // err 为 null 则 asset 一定存在
        const data = asset!.json as LevelData;
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

  /**
   * 按关卡 ID 获取单关数据。
   *
   * @param id - 关卡唯一 ID
   * @returns Level 对象，id 不存在或数据未加载时返回 null
   */
  getLevel(id: number): Level | null {
    return this._levelData?.levels.find(l => l.id === id) ?? null;
  }

  /**
   * 获取已加载的关卡总数。
   *
   * @returns 关卡数量，数据未加载时返回 0
   */
  getLevelCount(): number {
    return this._levelData?.levels.length ?? 0;
  }
}
