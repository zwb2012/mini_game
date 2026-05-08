# 路径级规则

`.claude/rules/` 中的规则在编辑匹配路径的文件时自动应用:

| 规则文件 | 路径模式 | 强制执行 |
| ---- | ---- | ---- |
| `gameplay-code.md` | `src/gameplay/**` | 数据驱动值、delta time、禁止 UI 引用 |
| `engine-code.md` | `src/core/**` | 热点路径零分配、线程安全、API 稳定性 |
| `ai-code.md` | `src/ai/**` | 性能预算、可调试性、数据驱动参数 |
| `network-code.md` | `src/networking/**` | 服务端权威、版本化消息、安全 |
| `ui-code.md` | `src/ui/**` | 不持有游戏状态、本地化就绪、无障碍 |
| `design-docs.md` | `design/gdd/**` | 必含 8 个章节、公式格式、边界情况 |
| `narrative.md` | `design/narrative/**` | 背景一致性、角色声音、正典层级 |
| `data-files.md` | `assets/data/**` | JSON 有效性、命名约定、schema 规则 |
| `test-standards.md` | `tests/**` | 测试命名、覆盖率要求、fixture 模式 |
| `prototype-code.md` | `prototypes/**` | 放宽标准、必需 README、假设记录 |
| `shader-code.md` | `assets/shaders/**` | 命名约定、性能目标、跨平台规则 |
| `chinese-output.md` | `design/**`, `docs/**`, `*.md` | 中文文档输出（代码和 API 名保留英文） |
