# 编码标准

- 所有游戏代码都必须为公共 API 添加文档注释
- 每个系统都必须在 `docs/architecture/` 中有对应的架构决策记录
- Gameplay 数值必须由数据驱动（外部配置），绝不能硬编码
- 所有 public 方法都必须可进行单元测试（使用依赖注入而不是单例）
- Commit 必须引用相关设计文档或任务 ID
- **Commit messages**：使用 Conventional Commits 格式 — `feat:`、`fix:`、`chore:`、`docs:`、`test:`、`refactor:`。在正文中引用 story 或 task ID（例如 `Story: EPIC-001-S02`）。
- **验证驱动开发**：添加 gameplay 系统时先写测试。
  UI 变更需使用截图验证。标记工作完成前，对比预期输出与实际输出。
  每项实现都应有方法证明它能正常工作。

# 设计文档标准

- 所有设计文档使用 Markdown
- 每个机制都在 `design/gdd/` 中有独立文档
- 文档必须包含以下 8 个必需章节：
  1. **Overview** -- 一段式摘要
  2. **Player Fantasy** -- 目标感受与体验
  3. **Detailed Rules** -- 无歧义的机制规则
  4. **Formulas** -- 所有数学公式均使用变量定义
  5. **Edge Cases** -- 处理异常情况
  6. **Dependencies** -- 列出其他系统
  7. **Tuning Knobs** -- 识别可配置数值
  8. **Acceptance Criteria** -- 可测试的成功条件
- 平衡数值必须链接到其来源公式或设计理由

# 测试标准

## 按 Story 类型划分的测试证据

所有 stories 在标记为 Done 之前都必须具备适当的测试证据：

| Story Type | Required Evidence | Location | Gate Level |
|---|---|---|---|
| **Logic**（公式、AI、状态机） | 自动化单元测试 — 必须通过 | `tests/unit/[system]/` | BLOCKING |
| **Integration**（多系统） | 集成测试 OR 已记录的 playtest | `tests/integration/[system]/` | BLOCKING |
| **Visual/Feel**（动画、VFX、手感） | 截图 + Lead 签核 | `production/qa/evidence/` | ADVISORY |
| **UI**（菜单、HUD、界面） | 手动 walkthrough 文档 OR 交互测试 | `production/qa/evidence/` | ADVISORY |
| **Config/Data**（平衡调校） | Smoke check 通过 | `production/qa/smoke-[date].md` | ADVISORY |

## 自动化测试规则

- **Naming**：文件使用 `[system]_[feature]_test.[ext]`；函数使用 `test_[scenario]_[expected]`
- **Determinism**：测试每次运行都必须产生相同结果 — 不使用随机种子，不使用依赖时间的断言
- **Isolation**：每个测试都设置并清理自己的状态；测试不得依赖执行顺序
- **No hardcoded data**：测试夹具使用常量文件或工厂函数，不使用内联 magic numbers
  （例外：边界值测试中精确数字本身就是测试重点）
- **Independence**：单元测试不调用外部 API、数据库或文件 I/O — 使用依赖注入

## 不应自动化的内容

- 视觉保真度（shader 输出、VFX 外观、动画曲线）
- “手感”品质（输入响应、感知重量、时机）
- 平台特定渲染（在目标硬件上测试，而不是 headless）
- 完整游戏会话（由 playtesting 覆盖，而不是自动化）

## CI/CD 规则

- 自动化测试套件在每次 push 到 main 和每个 PR 时运行
- 测试失败不得合并 — 测试是 CI 中的阻塞 gate
- 绝不要为了让 CI 通过而禁用或跳过失败测试 — 修复根本问题
- 引擎特定 CI 命令：
  - **Godot**：`godot --headless --script tests/gdunit4_runner.gd`
  - **Unity**：`game-ci/unity-test-runner@v4`（GitHub Actions）
  - **Unreal**：带 `-nullrhi` flag 的 headless runner
