/**
 * Cocos Creator engine module type declaration.
 *
 * This file provides ambient type information for the `cc` module used by
 * Cocos Creator 3.x at runtime. In the test environment the module is replaced
 * by `tests/__mocks__/cc.mock.ts` via Jest's `moduleNameMapper`.
 *
 * Only the APIs used by the project are declared here. Extend as needed.
 */

declare module 'cc' {
  // Directories

  export const director: {
    _sceneName: string;
    /** 是否自动触发回调（测试 mock 扩展，默认 true） */
    _autoFireCallbacks: boolean;
    /** 延迟回调队列（测试 mock 扩展） */
    _pendingCallbacks: Array<() => void>;
    /** 模拟加载错误表（测试 mock 扩展） */
    _loadErrors: Record<string, any>;
    loadScene: (name: string, onLaunched?: (err: any) => void) => void;
    preloadScene: (name: string, onFinished?: (err: any) => void) => void;
    /** 触发所有延迟回调（测试 mock 扩展） */
    firePendingCallbacks: () => void;
    /** 清空延迟回调队列（测试 mock 扩展） */
    clearPendingCallbacks: () => void;
  };

  export const sys: {
    platform: number;
    Platform: {
      WECHAT_GAME: number;
      ANDROID: number;
      IOS: number;
      UNKNOWN: number;
    };
    localStorage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
  };

  export class Node {
    static EventType: {
      TOUCH_START: string;
      TOUCH_MOVE: string;
      TOUCH_END: string;
    };
    isValid: boolean;
    name: string;
    constructor(name?: string);
    addComponent<T>(type: new (...args: any[]) => T): T;
    getComponent<T>(type: new (...args: any[]) => T): T | null;
    setPosition(x: number, y: number): void;
    getPosition(): { x: number; y: number };
    addChild(child: Node): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void, target?: any): void;
    off(event: string, callback?: (...args: any[]) => void, target?: any): void;
  }

  export class Component {
    node: Node;
    constructor();
  }

  export const _decorator: {
    ccclass: (name: string) => (target: any) => any;
    property: (opts?: any) => (target: any, key: string) => void;
  };

  export class JsonAsset {
    json: any;
    constructor(json?: any);
  }

  export class AudioClip {}

  export class AudioSource {
    playOneShot(clip: AudioClip, volume?: number): void;
  }

  export const resources: {
    load: (path: string, type: any, cb: Function) => void;
    // 以下为测试 mock 扩展——仅在 Jest 环境下可用
    _mockData: Record<string, any>;
    _mockErrors: Record<string, Error | undefined>;
    __setMockData: (path: string, json: any) => void;
    __setMockError: (path: string, error: Error | undefined) => void;
    __resetMock: () => void;
  };

  export const assetManager: {
    releaseAsset: (asset: any) => void;
  };

  export const view: {
    getDevicePixelRatio: () => number;
    getVisibleSize: () => { width: number; height: number };
  };

  export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    static WHITE: Color;
    constructor(r?: number, g?: number, b?: number, a?: number);
  }

  export class Touch {
    constructor(x: number, y: number);
    getUILocation(): { x: number; y: number };
  }

  export class EventTouch {
    constructor(touch: Touch | null, id?: number);
    touch: Touch | null;
    getID(): number;
    preventDefault(): void;
  }

  export class Graphics {
    fillColor: Color;
    strokeColor: Color;
    lineWidth: number;
    node: any;
    clear(): void;
    rect(x: number, y: number, w: number, h: number): void;
    fill(): void;
    stroke(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    close(): void;
  }

  export class Label {
    string: string;
    fontSize: number;
    font: Font | null;
    color: Color;
    horizontalAlign: number;
    verticalAlign: number;
    node: Node;
    static HorizontalAlign: { LEFT: number; CENTER: number; RIGHT: number };
    static VerticalAlign: { TOP: number; CENTER: number; BOTTOM: number };
  }

  export class Font {
    _uuid: string;
    constructor(uuid?: string);
  }

  export class Canvas {}
}
