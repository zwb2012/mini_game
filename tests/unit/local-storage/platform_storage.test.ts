/**
 * Story 001: IPlatformStorage 接口与双平台适配器
 *
 * 验证 WeChatStorage 和 WebStorage 实现。
 *
 * AC 覆盖：
 *   AC-1  WeChatStorage set/get round-trip
 *   AC-2  WeChatStorage get nonexistent → null
 *   AC-3  WebStorage set/get round-trip
 *   AC-4  WebStorage get nonexistent → null
 *   AC-5  Storage full → console.error, no crash
 *
 * ADR: ADR-004
 * GDD: local-storage.md
 */

// 在导入 SUT 前 mock wx + window.localStorage（Jest Node 环境无 window）
const mockStorage: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: jest.fn((key: string) => mockStorage[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
    clear: jest.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
    get length() { return Object.keys(mockStorage).length; },
    key: jest.fn((i: number) => Object.keys(mockStorage)[i] ?? null),
  },
};

const mockWx = {
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  getStorageInfoSync: jest.fn(),
};
(globalThis as any).wx = mockWx;

import { IPlatformStorage, platformStorage as actualPlatform } from '../../../src/core/local-storage/PlatformStorage';
import { WebStorage } from '../../../src/core/local-storage/PlatformStorage';

describe('PlatformStorage - 双平台适配器', () => {
  beforeEach(() => {
    // 清理 localStorage mock
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    jest.clearAllMocks();
  });

  // ============================================================
  // WeChatStorage tests
  // ============================================================
  describe('WeChatStorage', () => {
    test('AC-1: set/get round-trip works', () => {
      // WeChatStorage set with valid value
      mockWx.setStorageSync.mockImplementation(() => {});
      mockWx.getStorageSync.mockImplementation((key: string) => {
        if (key === 'test_key') return '{"value":42}';
        return null;
      });

      actualPlatform.set('test_key', '{"value":42}');
      const val = actualPlatform.get('test_key');

      expect(mockWx.setStorageSync).toHaveBeenCalledWith('test_key', '{"value":42}');
      expect(val).toBe('{"value":42}');
    });

    test('AC-2: get nonexistent key returns null', () => {
      mockWx.getStorageSync.mockImplementation(() => {
        throw new Error('key not found');
      });

      const val = actualPlatform.get('nonexistent');
      expect(val).toBeNull();
    });

    test('AC-5: set failure does not crash', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockWx.setStorageSync.mockImplementation(() => {
        throw new Error('storage full');
      });

      expect(() => {
        actualPlatform.set('key', 'value');
      }).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    test('remove calls wx.removeStorageSync', () => {
      mockWx.removeStorageSync.mockImplementation(() => {});

      actualPlatform.remove('test_key');
      expect(mockWx.removeStorageSync).toHaveBeenCalledWith('test_key');
    });

    test('getInfo returns storage info from wx', () => {
      mockWx.getStorageInfoSync.mockReturnValue({
        keys: ['a', 'b'],
        currentSize: 1024,
        limitSize: 10240,
      });

      const info = actualPlatform.getInfo();
      expect(info.keys).toEqual(['a', 'b']);
      expect(info.currentSize).toBe(1024);
      expect(info.limitSize).toBe(10240);
    });
  });

  // ============================================================
  // WebStorage tests
  // ============================================================
  // Create WebStorage for direct testing (factory returns WeChatStorage with wx mocked)
  let webStorage: IPlatformStorage;
  beforeAll(() => {
    // Save original wx, remove it to test WebStorage path
    webStorage = new WebStorage();
  });

  describe('WebStorage', () => {
    test('AC-3: set/get round-trip works', () => {
      webStorage.set('test_key', 'value123');
      expect(webStorage.get('test_key')).toBe('value123');
    });

    test('AC-4: get nonexistent key returns null', () => {
      expect(webStorage.get('nonexistent')).toBeNull();
    });

    test('set then get with JSON value', () => {
      const data = JSON.stringify({ a: 1, b: [2, 3] });
      webStorage.set('json_key', data);
      expect(webStorage.get('json_key')).toBe(data);
    });

    test('remove deletes key', () => {
      webStorage.set('temp', 'value');
      expect(webStorage.get('temp')).toBe('value');
      webStorage.remove('temp');
      expect(webStorage.get('temp')).toBeNull();
    });

    test('getInfo returns estimated storage info', () => {
      const info = webStorage.getInfo();
      expect(info.keys).toBeDefined();
      expect(info.limitSize).toBe(5120);
    });
  });
});
