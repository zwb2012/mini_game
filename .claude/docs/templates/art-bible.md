# 美术圣经：[Game Title]

## 文档状态
- **Version**: 1.0
- **Last Updated**: [Date]
- **Owned By**: art-director
- **Status**: [Draft / Under Review / Approved]

## 1. 视觉识别摘要
[用 2-3 句话描述整体视觉识别]

### 参考板
[列出参考游戏、电影、美术作品，以及每个参考代表的具体视觉品质]

| Reference | Medium | What We're Taking |
| --------- | ------ | ----------------- |
| [Name] | [Game/Film/Art] | [Specific quality] |

## 2. 色彩系统

### 主调色板
| Name | Hex | Usage |
| ---- | --- | ----- |
| [Color Name] | #XXXXXX | [Where and when to use] |

### 情绪色彩映射
| Game State | Dominant Colors | Mood |
| ---------- | --------------- | ---- |
| Exploration | [Colors] | [Feeling] |
| Combat | [Colors] | [Feeling] |
| Safe zones | [Colors] | [Feeling] |
| Danger | [Colors] | [Feeling] |

## 3. 光照与氛围
[光照方向、色温、对比度水平、以及不同游戏状态的情绪目标]

### 按游戏状态
- **探索**: [光照描述]
- **战斗**: [光照描述]
- **安全区域**: [光照描述]
- **菜单/UI**: [光照描述]

## 4. 角色美术方向
[剪影要求、颜色编码、动画风格、比例、辨识度规则]

## 5. 环境与关卡美术
[建筑风格、贴图哲学、道具密度、环境叙事指南]

## 6. UI 视觉语言
[按钮样式、字体排印、图标风格、菜单布局、HUD 密度、diegetic vs screen-space]

## 7. VFX 与粒子风格
[粒子风格、屏幕效果、命中反馈、颜色编码]

## 8. 资产制作标准

### 命名约定
`[category]_[name]_[variant]_[size].[ext]`

### 贴图标准
| Category | Max Resolution | Format | Color Space |
| -------- | -------------- | ------ | ----------- |
| Characters | [Size] | [Format] | [Space] |
| Environments | [Size] | [Format] | [Space] |
| UI | [Size] | [Format] | [Space] |
| VFX | [Size] | [Format] | [Space] |

### 动画标准
[帧率、混合时间、动画图结构]

### 渲染风格
[Realistic / Stylized / Pixel / Cel-shaded / etc.]

### 比例
[角色比例、环境尺度、UI 尺度关系]

### 细节层级
[角色、环境、UI 元素应有多详细？]

### 视觉层级
[我们如何引导玩家视线？什么始终最突出？]

### AI 生图指南

> 本章节为 `/asset-generate` 技能提供全局 prompt 规则。所有资产级 prompt 必须遵循此处定义的方向。

#### 通用 Prompt 风格
[描述所有 AI prompt 应遵循的整体风格关键词，例如："flat vector illustration"、"pixel art 16-bit"、"semi-realistic dark fantasy"]

#### 全局正向 Prompt 模板
```
[在此编写所有资产 prompt 都会追加的通用正向 prompt。例如：
"game asset, clean silhouette, centered composition, consistent lighting,
professional game art, [style keywords from above]"]
```

#### 全局负向 Prompt
```
[通用的负向 prompt，例如：
"photorealistic, blurry, messy composition, multiple perspectives,
watermark, text, signature, distorted proportions, bad anatomy"]
```

#### 角色生图规则
- 角色必须居中对齐，留出透明背景的裁剪空间
- 默认朝向：面向右侧（可被单个资产生成的 spec 覆盖）
- 精灵表：此处定义帧布局（例如 "4x4 grid, each frame 128x128"）

#### 场景/环境生图规则
- 默认为平铺式背景（如果是 2D 游戏）
- 光照方向：[统一的光源方向，例如 "top-left, warm key light"]

#### UI/Icon 生图规则
- Icon 风格：[例如 "flat, 2px stroke, rounded corners, consistent color palette"]
- Icon 必须能在 64x64px 下清晰可辨
- 所有 icon 使用统一的透视/正交投影

#### 风格一致性锁
[描述跨资产必须保持一致的关键视觉元素，例如：
"所有角色使用相同的轮廓线宽度"、"所有环境使用相同的色温"、"所有 VFX 使用相同的粒子语言"]

## 9. 风格禁止项
[明确列出不应该出现在此游戏视觉中的内容。例如："不使用 neon/cyberpunk 元素"、"不使用 realistic gore"、"避免对称构图（本游戏偏好动态不对称）"]

## 无障碍
- 需要色盲安全的 UI 元素
- 最小文本尺寸：1080p 下 [X]px
- 高对比模式规格
- 游戏状态使用图标 + 颜色（绝不只用颜色）
