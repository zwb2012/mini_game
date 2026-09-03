# 路径特定规则

`.dsh/rules/` 中的规则会在编辑匹配路径中的文件时自动执行：

| Rule File | Path Pattern | Enforces |
| ---- | ---- | ---- |
| `gameplay-code.md` | `src/gameplay/**` | 数据驱动数值、delta time、无 UI 引用 |
| `engine-code.md` | `src/core/**` | 热路径零分配、线程安全、API 稳定性 |
| `ai-code.md` | `src/ai/**` | 性能预算、可调试性、数据驱动参数 |
| `network-code.md` | `src/networking/**` | Server-authoritative、版本化消息、安全性 |
| `ui-code.md` | `src/ui/**` | 不拥有游戏状态、localization-ready、accessibility |
| `design-docs.md` | `design/gdd/**` | 必需 8 个章节、公式格式、edge cases |
| `narrative.md` | `design/narrative/**` | Lore 一致性、角色 voice、canon levels |
| `data-files.md` | `assets/data/**` | JSON 有效性、命名约定、schema 规则 |
| `test-standards.md` | `tests/**` | 测试命名、覆盖率要求、fixture 模式 |
| `prototype-code.md` | `prototypes/**` | 放宽标准、README required、hypothesis documented |
| `shader-code.md` | `assets/shaders/**` | 命名约定、性能目标、跨平台规则 |
