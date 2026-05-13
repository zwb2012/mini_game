# 技能测试规范：/[skill-name]

## 技能摘要

[一段话说明该技能做什么、何时使用、会产出什么。包含主要输出产物、它使用的裁定格式，以及它属于哪个流水线阶段。]

---

## 静态断言（结构）

由 `/skill-test static` 自动验证——无需 fixture。

- [ ] 包含必需的 frontmatter 字段：`name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`
- [ ] 包含 ≥2 个阶段标题（## Phase N 或编号的 ## 章节）
- [ ] 包含裁定关键词：[列出预期关键词，例如 PASS, FAIL, CONCERNS]
- [ ] 如果技能会写文件，则包含“May I write”协作协议语言
- [ ] 结尾包含下一步交接

---

## 测试用例

### 用例 1：成功路径 — [简短描述]

**Fixture:** [描述假定的项目状态。哪些文件存在？它们包含什么？例如：“game-concept.md 存在，且所有 8 个必需章节完整。systems-index.md 存在。所有 MVP GDD 都存在且已单独审查。”]

**Input:** `/[skill-name] [args]`

**Expected behavior:**
1. [Phase 1 action — 技能应读取或检查什么]
2. [Phase 2 action — 技能应评估什么]
3. [Phase N action — 技能应输出什么]

**Assertions:**
- [ ] 技能在产生输出前读取 [specific file]
- [ ] 输出包含裁定关键词 [PASS/FAIL/etc.]
- [ ] 输出列出 fixture 中的 [specific content]
- [ ] 技能在写入任何文件前请求批准

---

### 用例 2：失败路径 — [简短描述，例如“缺少必需产物”]

**Fixture:** [描述失败状态。例如：“缺少 game-concept.md。design/gdd/ 中没有任何文件。”]

**Input:** `/[skill-name] [args]`

**Expected behavior:**
1. [Phase 1: 技能检测到缺失文件]
2. [Phase 2: 技能暴露缺口，而不是假设 OK]
3. [Output: FAIL 或 BLOCKED 裁定，并点名具体阻塞项]

**Assertions:**
- [ ] 当 fixture 不完整时，技能不会输出 PASS
- [ ] 技能点名具体缺失产物
- [ ] 技能建议补救行动（例如“Run /[other-skill]”）
- [ ] 技能不会在未询问的情况下创建文件来填补缺口

---

### 用例 3：边界情况 — [简短描述，例如“未提供参数”]

**Fixture:** [该用例的项目文件状态]

**Input:** `/[skill-name]`（无参数）

**Expected behavior:**
1. [技能在无参数调用时应做什么]

**Assertions:**
- [ ] [assertion]

---

## 协议合规

- [ ] 所有文件写入前使用“May I write”
- [ ] 在请求写入批准前呈现发现或报告
- [ ] 以建议的下一步或后续技能结束
- [ ] 绝不在没有明确用户批准的情况下自动创建文件
- [ ] 不跳过阶段，也不在未检查的情况下直接给出裁定

---

## 覆盖说明

[记录本规范有意不测试什么，以及原因。示例：
- “Case 3 (all-mode) 未覆盖，因为它运行过多检查，难以在单个规范中评估——应分别测试每个子模式。”
- “数据库集成路径未覆盖，因为它需要实时环境。”
- “涉及损坏 YAML 文件的边界情况推迟到未来规范。”]
