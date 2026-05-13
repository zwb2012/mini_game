# 技术偏好

<!-- 由 /setup-engine 填充。随着用户在开发过程中做出决定而更新。 -->
<!-- 所有 agents 都会引用此文件以获取项目特定标准和约定。 -->

## 引擎与语言

- **Engine**: [TO BE CONFIGURED — run /setup-engine]
- **Language**: [TO BE CONFIGURED]
- **Rendering**: [TO BE CONFIGURED]
- **Physics**: [TO BE CONFIGURED]

## 输入与平台

<!-- 由 /setup-engine 写入。由 /ux-design、/ux-review、/test-setup、/team-ui 和 /dev-story 读取 -->
<!-- 用于将交互规格、测试辅助工具和实现范围限定到正确的输入方式。 -->

- **Target Platforms**: [TO BE CONFIGURED — e.g., PC, Console, Mobile, Web]
- **Input Methods**: [TO BE CONFIGURED — e.g., Keyboard/Mouse, Gamepad, Touch, Mixed]
- **Primary Input**: [TO BE CONFIGURED — the dominant input for this game]
- **Gamepad Support**: [TO BE CONFIGURED — Full / Partial / None]
- **Touch Support**: [TO BE CONFIGURED — Full / Partial / None]
- **Platform Notes**: [TO BE CONFIGURED — any platform-specific UX constraints]

## 命名约定

- **Classes**: [TO BE CONFIGURED]
- **Variables**: [TO BE CONFIGURED]
- **Signals/Events**: [TO BE CONFIGURED]
- **Files**: [TO BE CONFIGURED]
- **Scenes/Prefabs**: [TO BE CONFIGURED]
- **Constants**: [TO BE CONFIGURED]

## 性能预算

- **Target Framerate**: [TO BE CONFIGURED]
- **Frame Budget**: [TO BE CONFIGURED]
- **Draw Calls**: [TO BE CONFIGURED]
- **Memory Ceiling**: [TO BE CONFIGURED]

## 测试

- **Framework**: [TO BE CONFIGURED]
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## 禁用模式

<!-- 添加本项目代码库中绝不应出现的模式 -->
- [None configured yet — add as architectural decisions are made]

## 允许的库 / Addons

<!-- 在此添加已批准的第三方依赖 -->
- [None configured yet — add as dependencies are approved]

## 架构决策日志

<!-- 快速参考，链接到 docs/architecture/ 中的完整 ADR -->
- [No ADRs yet — use /architecture-decision to create one]

## 引擎专家

<!-- 配置引擎时由 /setup-engine 写入。 -->
<!-- 由 /code-review、/architecture-decision、/architecture-review 和 team skills 读取 -->
<!-- 用于了解应生成哪个 specialist 来进行引擎特定验证。 -->

- **Primary**: [TO BE CONFIGURED — run /setup-engine]
- **Language/Code Specialist**: [TO BE CONFIGURED]
- **Shader Specialist**: [TO BE CONFIGURED]
- **UI Specialist**: [TO BE CONFIGURED]
- **Additional Specialists**: [TO BE CONFIGURED]
- **Routing Notes**: [TO BE CONFIGURED]

### 文件扩展名路由

<!-- Skills 使用此表按文件类型选择正确的 specialist。 -->
<!-- 如果某行显示 [TO BE CONFIGURED]，则该文件类型回退到 Primary。 -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (primary language) | [TO BE CONFIGURED] |
| Shader / material files | [TO BE CONFIGURED] |
| UI / screen files | [TO BE CONFIGURED] |
| Scene / prefab / level files | [TO BE CONFIGURED] |
| Native extension / plugin files | [TO BE CONFIGURED] |
| General architecture review | Primary |
