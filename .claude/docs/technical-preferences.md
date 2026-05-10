# 技术偏好

<!-- 由 /setup-engine 填充。随着开发过程中用户做出决策而更新。 -->
<!-- 所有 agent 引用此文件获取项目特定规范和约定。 -->

## 引擎与语言

- **引擎**: Cocos Creator 3.8.8
- **语言**: TypeScript
- **渲染**: Cocos 内置渲染管线（2D Canvas/WebGL）
- **物理**: 无（纯逻辑益智游戏，无需物理引擎）

## 输入与平台

<!-- 由 /setup-engine 写入。由 /ux-design、/ux-review、/test-setup、/team-ui、/dev-story 读取 -->
<!-- 用于限定交互规格、测试辅助工具和实现范围到正确的输入方式。 -->

- **目标平台**: 微信小游戏
- **输入方式**: 触屏
- **主要输入**: 触屏
- **手柄支持**: 无
- **触屏支持**: 完整
- **平台备注**: 所有 UI 必须适配触屏操作。支持手指滑屏划线。最小触控区域 44x44px。微信小游戏 Canvas 限制 2MB 包体。

## 命名约定

- **类/组件**: PascalCase（例如 `PlayerController`）
- **方法/变量**: camelCase（例如 `moveSpeed`、`takeDamage()`）
- **私有字段**: `_camelCase`（例如 `_moveSpeed`）
- **文件**: PascalCase 匹配类名（例如 `PlayerController.ts`）
- **场景/预制体**: PascalCase（例如 `GameScene.scene`、`LevelButton.prefab`）
- **接口**: PascalCase，`I` 前缀可选（例如 `IPlayerData`）
- **常量**: UPPER_SNAKE_CASE
- **装饰器**: `@ccclass`、`@property` 用于编辑器集成

## 性能预算

- **目标帧率**: 60fps
- **帧预算**: 16.6ms
- **Draw Call**: < 20（2D 益智游戏，极简视觉）
- **内存上限**: 100MB（微信小游戏限制）

## 测试

- **框架**: Jest（TypeScript 单元测试）；微信开发者工具（真机测试）
- **最低覆盖率**: 核心逻辑（评分算法、关卡验证、状态机）80%+
- **必需测试**: 连线算法、步数计数、三星评分逻辑、关卡解锁逻辑

## 禁止模式

<!-- 添加不应在此项目代码库中出现的模式 -->
- [尚未配置 — 随架构决策做出而添加]

## 允许的库/插件

<!-- 在此添加已批准的三方依赖 -->
- [尚未配置 — 随依赖审批而添加]

## 架构决策记录

<!-- 快速参考，链接到 docs/architecture/ 中的完整 ADR -->
- [尚无 ADR — 使用 /architecture-decision 创建]

## 引擎专员

<!-- 由 /setup-engine 在配置引擎时写入。 -->
<!-- 由 /code-review、/architecture-decision、/architecture-review 和 team skill 读取 -->
<!-- 以确定启动哪个专员进行引擎特定校验。 -->

- **主专员**: cocos-specialist
- **语言/代码专员**: cocos-specialist（TypeScript 组件架构审查）
- **Shader 专员**: cocos-specialist（Cocos 无专用 Shader 专员——主专员覆盖材质和特效）
- **UI 专员**: cocos-specialist（无专用 UI 专员——主专员覆盖所有 UI）
- **额外专员**: wechat-platform-specialist（微信 API：登录、支付、广告、排行榜、云存储）、backend-developer（Express/TypeScript 后端 API）
- **路由备注**: 架构决策和通用 TypeScript 审查调用主专员。微信平台 API 调用 wechat-platform-specialist。后端 API 开发调用 backend-developer。Shader/特效由主专员覆盖。

### 文件扩展名路由

<!-- Skill 使用此表按文件类型选择正确的专员。 -->

| 文件扩展名 / 类型 | 应启动的专员 |
|-----------------------|---------------------|
| 游戏代码（.ts 文件） | cocos-specialist |
| Shader / 材质文件 | cocos-specialist |
| UI / 界面文件（.prefab、UI 组件） | cocos-specialist |
| 场景 / 预制体 / 关卡文件（.scene、.prefab） | cocos-specialist |
| 微信平台代码（wx.* API） | wechat-platform-specialist |
| 后端代码（server/ 目录） | backend-developer |
| 通用架构评审 | cocos-specialist |
