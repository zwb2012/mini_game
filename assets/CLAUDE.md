# Assets Directory

> 所有游戏资产的根目录。生成管线（`/asset-generate`）和审计（`/asset-audit`）
> 均以此目录结构为基准。

## 目录结构

```
assets/
├── CLAUDE.md          # 本文件 — 资产目录标准与命名规范
├── art/               # 美术资产（精灵、纹理、UI 图集）
│   ├── characters/    # 角色精灵 / 模型
│   ├── environments/  # 环境与背景
│   ├── props/         # 道具与物品
│   └── ui/            # UI 图标与面板素材
├── audio/             # 音频资产
│   ├── music/         # 背景音乐
│   ├── sfx/           # 音效
│   └── ambient/       # 环境氛围音
├── vfx/               # 视觉特效（粒子贴图、序列帧）
├── shaders/           # 着色器（.gdshader / .shader）
├── data/              # 数据资产（配置文件、平衡表、区域定义）
└── concept-art/       # 概念艺术（参考用途，非游戏内资产）
```

## 命名规范

遵循 `.claude/docs/technical-preferences.md` 中定义的命名约定。通用格式：

```
[category]_[name]_[variant]_[size].[ext]
```

示例：
- 精灵：`char_hero_idle_256.png`
- 音效：`sfx_combat_hit_01.wav`
- 特效：`vfx_frost_burst_loop_128.png`
- 环境：`env_forest_bg_large.png`

## 格式标准

| 类别 | 推荐格式 | 备注 |
|------|----------|------|
| 2D 精灵 / UI | PNG（RGBA） | 保持透明度，UI 素材用 SVG 备选 |
| 3D 纹理 | PNG / KTX2 | KTX2 用于 GPU 压缩纹理 |
| 音乐 | OGG Vorbis | 44.1kHz，192kbps 起步 |
| 音效 | WAV（源）/ OGG（发布） | 48kHz，24-bit |
| 着色器 | .gdshader / .shader | 引擎原生格式 |
| 数据 | JSON / TOML / CSV | 运行时加载用 JSON，设计配置用 TOML |

## 文件大小预算

| 类别 | 单文件上限 | 说明 |
|------|----------|------|
| 角色精灵 | 2 MB | 单张纹理上限 |
| 环境背景 | 4 MB | 大尺寸背景 |
| UI 素材 | 512 KB | 高 DPI 下酌情放宽 |
| 音乐轨道 | 10 MB | 2 分钟以内 |
| 短音效 | 1 MB | 5 秒以内 |
| VFX 贴图 | 1 MB | 单张贴图 |

预算以目标平台最低配置为准，必要时分级。

## 资产引用

- 所有资产必须通过 manifest（`design/assets/asset-manifest.md`）追踪
- 未在 manifest 中列出的资产视为"孤儿资产"，可由 `/asset-audit` 检测
- AI 生成的资产进入 `Generated` 状态，人工审核后标记 `Approved`
