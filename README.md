# 微信小游戏自动化产品流水线模板

这是一个面向 **微信小游戏** 的自动化产品流水线模板仓库。

它的目标不是单纯提供一些零散 skill，而是提供一套可复用的模板，帮助你把一个小游戏项目从：

**调研 → 方向选择 → PRD → 架构 → 方案 → UI/UX → 实现 → 测试 → 验收 → 上架准备**

尽量用统一规则和少量人工门禁跑通。

---

## 这套模板解决什么问题
适合以下场景：
- 独立开发者同时尝试多个小游戏方向
- 希望减少“每一步都手动想下一步”的负担
- 只在少数关键节点人工拍板，其余阶段尽量自动推进
- 希望把文档、规则、门禁、状态机沉淀成可反复复用的模板

这套模板默认：
- **多项目并行**
- **三处人工门禁**：方向选择、PRD 审批、提审包完成
- **停在 `submission_ready`**，不自动执行真实微信提审动作
- **所有文档型产物默认中文输出**
- **P0 控制平面第一版包含**：
  - 1 个引擎实现：`templates/cocos-game-base/`
  - 2 个平台适配器：`templates/platform-adapters/wechat/`、`templates/platform-adapters/android/`

---

## 第一次进入仓库建议先看什么
如果你是第一次打开这个仓库，建议按下面顺序阅读：

1. `README.md`（仓库定位与导航）
2. `QUICKSTART.md`（3 分钟快速上手）
3. `specs/workflows/automation/operator-guide.md`（完整操作说明）
4. `specs/workflows/automation/startup-protocol.md`（启动协议）
5. `FAQ.md`（常见问题）

如果你准备贡献或修改模板，再看：
- `CONTRIBUTING.md`
- `CLAUDE.md`

---

## 仓库结构
### 1. `skills/`
放可复用的阶段技能与总控能力，例如：
- `new-project-bootstrap`
- `candidate-scout`
- `candidate-scorer`
- `product-pipeline-orchestrator`
- `research-analyst`
- `prd-writer`
- `architecture-designer`
- `solution-designer`
- `uiux-designer`
- `implementation-orchestrator`
- `test-orchestrator`
- `acceptance-checker`
- `launch-prep`
- 以及已有的 idea / candidate / prototype / mvp / observe / decision 类技能

### 2. `specs/workflows/automation/`
放工作流规则与使用说明，例如：
- 状态机
- 门禁规则
- 停止条件
- 语言规则
- 启动协议
- 操作说明

### 3. `specs/_templates/`
放所有阶段模板，例如：
- `project-request.template.md`
- `research-options.template.md`
- `direction-gate.template.md`
- `prd.template.md`
- `prd-gate.template.md`
- `architecture.template.md`
- `solution-design.template.md`
- `uiux.template.md`
- `implementation.template.md`
- `test-report.template.md`
- `acceptance.template.md`
- `launch-prep.template.md`
- `project-state.template.yaml`

### 4. `portfolio/`
放组合层控制平面文件：
- `idea-pool.yaml`（原始想法 SSOT，先进入候选层）
- `candidate-score-rules.yaml`（候选评分与 promote / hold / reject 规则）
- `candidates/`（候选产物根目录）
- `registry.yaml`（候选通过后进入的运行态事实源）
- `projects.yaml`（兼容层）
- `wip-rules.yaml`（WIP 与优先级规则源）
- `portfolio-board.md`（展示视图）
- `decision-log.md`（决策记录）

原始想法不会直接登记到 `portfolio/registry.yaml`，而是先经过 `portfolio/idea-pool.yaml` 和 `portfolio/candidate-score-rules.yaml` 的候选层，再决定是否进入正式组合层。

### 5. `templates/platform-adapters/`
放平台适配器模板：
- `wechat/`：微信小游戏平台适配器模板
- `android/`：Android 平台适配器模板

### 6. `contracts/`
放引擎无关的能力契约层，按职责划分为：
- `platform/`：平台能力契约，例如广告、分析、存储、生命周期、登录、支付
- `runtime/`：运行时能力契约，例如场景流、UI 根、游戏状态、事件总线、配置加载
- `build/`：构建与发布契约，例如构建目标、发布产物
- `telemetry/`：埋点契约，例如玩法事件、变现事件

---

## 最短上手路径
如果你现在就想试一次，最短路径是：

1. 复制 `specs/_templates/project-request.template.md`
2. 在 `specs/projects/<slug>/project-request.md` 填入你的项目请求
3. 复制 `specs/_templates/project-state.template.yaml`
4. 在 `specs/projects/<slug>/state.yaml` 初始化项目状态
5. 让总控入口读取这两个文件并推进到下一个人工门禁

建议总控调用语义：

> 为 `<slug>` 启动自动化产品流水线。请读取 `specs/projects/<slug>/project-request.md` 和 `specs/projects/<slug>/state.yaml`，自动推进到下一个人工门禁，并只输出当前状态、下一步和需要我确认的事项。

如果你想更快开始，先看：
- `QUICKSTART.md`

---

## 三个人工门禁
### 1. 方向选择
调研完成后，系统停在：
- `research-options.md`
- `direction-gate.md`

### 2. PRD 审批
PRD 草稿完成后，系统停在：
- `prd.md`
- `prd-gate.md`

### 3. 提审包完成
上架准备完成后，系统停在：
- `launch-prep.md`
- `state.yaml`

默认不自动执行真实微信提审动作。

---

## 详细文档
### 使用与启动
- `QUICKSTART.md`
- `specs/workflows/automation/operator-guide.md`
- `specs/workflows/automation/startup-protocol.md`
- `specs/workflows/automation/bootstrap-entry.md`

### 规则与结构
- `specs/workflows/automation/state-machine.md`
- `specs/workflows/automation/gates.md`
- `specs/workflows/automation/rules.md`
- `specs/workflows/automation/artifact-schema.md`
- `specs/workflows/automation/portfolio-topology.md`
- `specs/workflows/automation/language-rules.md`

### 仓库使用与协作
- `CONTRIBUTING.md`
- `FAQ.md`
- `CLAUDE.md`

---

## 示例 dry run
仓库里已经放了一条示例流水线产物链：
- `specs/projects/shaky-household-stack/`

你可以直接看这条链路，理解从 `research_options` 到 `submission_ready` 的文档推进方式。

---

## 当前定位
这套仓库现在更像：
- **自动化模板母版**
- **工作流与门禁规范仓库**
- **多项目小游戏试错的产品编排基础设施**
- **P0 第一版控制平面**：`templates/cocos-game-base/` + `templates/platform-adapters/wechat/` + `templates/platform-adapters/android/`

它不是单个游戏项目本身，而是帮助你反复启动和推进多个小游戏项目的“模板系统”。
