/**
 * Cocos Creator 模块 mock —— 允许纯 TypeScript 逻辑在 Jest 中测试而不依赖 Cocos 运行时。
 *
 * 各系统测试根据需要扩展此 mock。
 * 用法：在 jest.config.js 中配置 moduleNameMapper 将 'cc' 映射到此文件。
 */

// 基础类型 mock

/**
 * Color mock — 同时支持静态常量访问和 new Color(r,g,b) 实例化。
 * 向后兼容：Color.WHITE 仍可访问 r/g/b/a 属性。
 */
export class Color {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  static WHITE: Color = new Color(255, 255, 255, 255);

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

export const sys = {
  platform: 0, // UNKNOWN
  Platform: {
    WECHAT_GAME: 1,
    ANDROID: 2,
    IOS: 3,
    UNKNOWN: 0,
  },
  localStorage: {
    getItem: (key: string): string | null => null,
    setItem: (key: string, value: string): void => {},
    removeItem: (key: string): void => {},
  },
};

/**
 * Node mock — 同时支持静态 EventType 访问和实例化（new Node('name')）。
 * 向后兼容：Node.EventType.TOUCH_START 仍可用。
 */
export class Node {
  private _components: any[] = [];
  private _children: Node[] = [];
  private _posX: number = 0;
  private _posY: number = 0;
  public isValid: boolean = true;
  public name: string;

  static EventType = {
    TOUCH_START: 'touchstart',
    TOUCH_MOVE: 'touchmove',
    TOUCH_END: 'touchend',
  };

  constructor(name: string = 'Node') {
    this.name = name;
  }

  /** 添加组件。根据类型创建对应实例并关联 this 节点。 */
  addComponent(type: any): any {
    let comp: any;
    if (type === Graphics) {
      comp = new Graphics();
    } else if (type === Label) {
      comp = new Label();
    } else if (type) {
      comp = new type();
    } else {
      comp = {};
    }
    comp.node = this;
    this._components.push(comp);
    return comp;
  }

  /** 获取已挂载的同类型组件。返回第一个匹配项或 null。 */
  getComponent(type: any): any {
    for (const c of this._components) {
      if (c instanceof type) {
        return c;
      }
    }
    return null;
  }

  /** 设置节点坐标 */
  setPosition(x: number, y: number): void {
    this._posX = x;
    this._posY = y;
  }

  /** 获取节点坐标 */
  getPosition(): { x: number; y: number } {
    return { x: this._posX, y: this._posY };
  }

  /** 添加子节点 */
  addChild(child: Node): void {
    this._children.push(child);
  }

  /** 销毁节点——标记无效并清空组件/子节点列表 */
  destroy(): void {
    this.isValid = false;
    this._components = [];
    this._children = [];
  }

  /** 绑定事件（mock 不实现，仅占位） */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on(_event: string, _callback: (...args: any[]) => void, _target?: any): void {
    // Mock — no-op
  }

  /** 解绑事件（mock 不实现，仅占位） */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  off(_event: string, _callback?: (...args: any[]) => void, _target?: any): void {
    // Mock — no-op
  }
}

/** 可供 JsonAsset 引用的 mock 类 */
export class JsonAsset {
  public json: any;
  constructor(json?: any) {
    this.json = json ?? {};
  }
}

/**
 * resources mock — 支持 jest.fn() 调用追踪和可配置的 mock 数据/错误。
 *
 * 默认行为：任何路径都返回 { json: {} }，无错误。
 *
 * 配置方式（在测试中）：
 *   resources.__setMockData('levels', myData);  // 设置成功数据
 *   resources.__setMockError('levels', new Error('...'));  // 模拟加载错误
 *   resources.__resetMock();  // 重置到默认状态
 */
export const resources = {
  /** 存储每个路径的 mock 数据（原始 JSON，load 时自动包装为 { json: data }） */
  _mockData: {} as Record<string, any>,
  /** 存储每个路径的 mock 错误（undefined = 无错误，Error = 模拟错误） */
  _mockErrors: {} as Record<string, Error | undefined>,

  load: jest.fn((path: string, type: any, cb: Function) => {
    const err = path in resources._mockErrors ? resources._mockErrors[path] : undefined;
    const rawData = path in resources._mockData ? resources._mockData[path] : undefined;
    cb(err ?? null, rawData !== undefined ? { json: rawData } : { json: {} });
  }),

  /** 设置某个资源的 mock 返回数据 */
  __setMockData: (path: string, json: any): void => {
    resources._mockData[path] = json;
  },

  /** 设置某个资源的 mock 加载错误 */
  __setMockError: (path: string, error: Error | undefined): void => {
    resources._mockErrors[path] = error;
  },

  /** 重置所有 mock 状态 + 清除调用记录 */
  __resetMock: (): void => {
    resources._mockData = {};
    resources._mockErrors = {};
    resources.load.mockClear();
  },
};

export const assetManager = {
  releaseAsset: (asset: any) => {},
};

/**
 * director mock — 支持 jest.fn() 调用追踪和回调即时执行。
 *
 * 默认行为（_autoFireCallbacks = true）：
 *   loadScene / preloadScene 同步执行回调，与原有测试兼容。
 *
 * 延迟回调模式（_autoFireCallbacks = false）：
 *   回调被存储到 _pendingCallbacks 队列，通过 firePendingCallbacks() 手动触发。
 *   用于测试 _pendingLoadId 陈旧回调丢弃逻辑。
 *
 * 错误模拟（_loadErrors）：
 *   设置 _loadErrors[sceneName] = new Error(...) 可使对应场景的 loadScene 回调
 *   收到错误参数。默认无错误。
 *
 * _sceneName 记录最后一次加载的场景名，供测试断言使用。
 */
export const director = {
  _sceneName: '',
  /** 是否自动触发回调（默认 true，保持向后兼容） */
  _autoFireCallbacks: true,
  /** 延迟回调队列（_autoFireCallbacks = false 时使用） */
  _pendingCallbacks: [] as Array<() => void>,
  /** 模拟加载错误表：sceneName → Error | null */
  _loadErrors: {} as Record<string, any>,

  loadScene: jest.fn((name: string, onLaunched?: (err: any) => void) => {
    director._sceneName = name;
    const err = director._loadErrors[name] ?? null;

    if (director._autoFireCallbacks) {
      onLaunched?.(err);
    } else if (onLaunched) {
      director._pendingCallbacks.push(() => { onLaunched(err); });
    }
  }),

  preloadScene: jest.fn((name: string, onFinished?: (err: any) => void) => {
    onFinished?.(null);
  }),

  /** 按 FIFO 顺序触发所有延迟回调 */
  firePendingCallbacks: () => {
    while (director._pendingCallbacks.length > 0) {
      const cb = director._pendingCallbacks.shift()!;
      cb();
    }
  },

  /** 清空延迟回调队列（不触发） */
  clearPendingCallbacks: () => {
    director._pendingCallbacks = [];
  },
};

/** AudioClip mock — Cocos 音频资源类 */
export class AudioClip {}

/** AudioSource mock — Cocos 音频源组件 */
export class AudioSource {
  playOneShot = jest.fn();
}

export const view = {
  getDevicePixelRatio: (): number => 1,
  /** 获取可见区域尺寸 (mock: 返回默认 750x1334) */
  getVisibleSize: (): { width: number; height: number } => ({ width: 750, height: 1334 }),
};

// Touch event mock support
export class Touch {
  private _x: number;
  private _y: number;
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }
  getUILocation(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }
}

export class EventTouch {
  private _touch: Touch | null;
  private _id: number;
  constructor(touch: Touch | null, id: number = 0) {
    this._touch = touch;
    this._id = id;
  }
  get touch(): Touch | null { return this._touch; }
  getID(): number { return this._id; }
  preventDefault(): void {}
}

// ============================================================
// GridConnectionEngine 需要的 Cocos 组件 mock
// ============================================================

/**
 * _decorator mock — ccclass 和 property 为 no-op 装饰器工厂。
 * 使带有 @ccclass/@property 的组件可通过 TestBed 实例化。
 */
export const _decorator = {
  ccclass: (_name: string) => (target: any): any => target,
  property: (_opts?: any) => (target: any, _key: string): void => {
    /* no-op */
  },
};

/**
 * Component mock — 引擎组件基类。
 * 提供 node 属性（默认创建空 Node）。
 */
export class Component {
  node: Node;

  constructor() {
    this.node = new Node('Component');
  }
}

/**
 * Graphics mock — cc.Graphics 2D 绘制 API。
 *
 * 所有绘制方法使用 jest.fn() 以便测试中追踪调用。
 * ADR-002: 绘制方法不含 fillRect/fillText（Cocos 3.x 已移除）。
 *
 * 使用方式：
 * ```typescript
 * const g = new Graphics();
 * g.fillColor = new Color(0x9E, 0x9E, 0x9E);
 * g.rect(x, y, w, h);
 * g.fill();
 * // 验证：expect(g.rect).toHaveBeenCalledTimes(2);
 * ```
 */
export class Graphics {
  fillColor: Color = Color.WHITE;
  strokeColor: Color = Color.WHITE;
  lineWidth: number = 1;
  node: any = null;

  clear = jest.fn();
  rect = jest.fn();
  fill = jest.fn();
  stroke = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  close = jest.fn();
}

/**
 * Label mock — cc.Label 组件。
 *
 * 支持 HorizontalAlign/VerticalAlign 枚举。
 * fontSize 默认 14，color 默认 WHITE。
 */
export class Label {
  string: string = '';
  fontSize: number = 14;
  font: any = null;
  color: Color = Color.WHITE;
  horizontalAlign: number = Label.HorizontalAlign.CENTER;
  verticalAlign: number = Label.VerticalAlign.CENTER;
  node: any = null;

  static HorizontalAlign = {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2,
  };

  static VerticalAlign = {
    TOP: 0,
    CENTER: 1,
    BOTTOM: 2,
  };

  constructor() {
    this.node = new Node('Label');
  }
}

/**
 * Font mock — cc.Font 字体资源。
 */
export class Font {
  _uuid: string = '';

  constructor(uuid?: string) {
    this._uuid = uuid || '';
  }
}

/**
 * Canvas mock — cc.Canvas 组件（仅用于 type 引用）。
 */
export class Canvas {} // eslint-disable-line @typescript-eslint/no-extraneous-class
