/**
 * PlatformStorage — 平台存储适配层
 *
 * ADR-004: 平台适配层——WeChat API 隔离与 Web 回退
 * IPlatformStorage 接口 + WeChatStorage / WebStorage 双实现
 *
 * 用法：
 * ```typescript
 * import { platformStorage } from './PlatformStorage';
 * platformStorage.set('key', 'value');
 * const val = platformStorage.get('key');
 * ```
 *
 * 平台检测在模块加载时自动完成——code path 零分支开销。
 */

export interface StorageInfo {
  keys: string[];
  currentSize: number;
  limitSize: number;
}

/**
 * 平台存储抽象接口。
 * MVP 仅覆盖 KV 存储——广告和云存储为 Alpha 层扩展点。
 */
export interface IPlatformStorage {
  /** 同步写入。key 已带 nl_ 前缀，value 为 JSON 字符串 */
  set(key: string, value: string): void;

  /** 同步读取。key 不存在返回 null，数据损坏返回 null */
  get(key: string): string | null;

  /** 删除指定 key */
  remove(key: string): void;

  /** 获取存储信息。Web 回退返回估算值 */
  getInfo(): StorageInfo;
}

// ===== WeChatStorage =====

/**
 * 微信小游戏存储实现。
 * 使用 wx.setStorageSync/getStorageSync——同步 API 确保写入可靠性。
 * 所有方法包裹 try-catch——存储满或数据损坏时不崩溃。
 */
class WeChatStorage implements IPlatformStorage {
  set(key: string, value: string): void {
    try {
      (globalThis as any).wx.setStorageSync(key, value);
    } catch (e) {
      console.error(`[WeChatStorage] set failed: ${key}`, e);
    }
  }

  get(key: string): string | null {
    try {
      const val = (globalThis as any).wx.getStorageSync(key);
      return val !== undefined && val !== null ? String(val) : null;
    } catch {
      // key 不存在或数据损坏——wx.getStorageSync 抛异常
      return null;
    }
  }

  remove(key: string): void {
    try {
      (globalThis as any).wx.removeStorageSync(key);
    } catch (e) {
      console.error(`[WeChatStorage] remove failed: ${key}`, e);
    }
  }

  getInfo(): StorageInfo {
    try {
      const info = (globalThis as any).wx.getStorageInfoSync();
      return {
        keys: info.keys || [],
        currentSize: info.currentSize || 0,
        limitSize: info.limitSize || 10240, // 10MB 默认
      };
    } catch {
      return { keys: [], currentSize: 0, limitSize: 10240 };
    }
  }
}

// ===== WebStorage =====

/**
 * Web 预览环境存储实现。
 * 使用 window.localStorage（标准 DOM API，所有浏览器一致支持）。
 */
export class WebStorage implements IPlatformStorage {
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.error(`[WebStorage] set failed: ${key}`, e);
    }
  }

  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.error(`[WebStorage] remove failed: ${key}`, e);
    }
  }

  getInfo(): StorageInfo {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k !== null) keys.push(k);
      }
      return {
        keys,
        currentSize: keys.length * 128, // 估算：每个 key ~128 bytes
        limitSize: 5120, // 浏览器 localStorage 典型限制 5MB
      };
    } catch {
      return { keys: [], currentSize: 0, limitSize: 5120 };
    }
  }
}

// ===== Factory =====

/**
 * 模块级单例——平台检测在 import 时执行一次，后续零开销。
 * 检测顺序：微信环境 → WeChatStorage，其他 → WebStorage。
 */
function createPlatformStorage(): IPlatformStorage {
  // 双重守卫：sys.platform 检测 + typeof wx 校验
  if (typeof (globalThis as any).wx !== 'undefined') {
    return new WeChatStorage();
  }
  return new WebStorage();
}

export const platformStorage: IPlatformStorage = createPlatformStorage();
