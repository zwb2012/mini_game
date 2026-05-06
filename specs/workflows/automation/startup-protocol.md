# 自动化流水线启动协议

## 目标
这份说明不是解释模板内部怎么设计，而是告诉使用者：**如何先把原始想法送入候选层、如何在候选层完成评分与 promote、以及如何在 promote 之后启动正式项目。**

适用对象：
- 独立开发者
- 希望同时维护多个小游戏候选方向
- 只在少数关键节点人工拍板，其余阶段尽量自动推进

## 说明
- 同名 `*.meta.yaml` 是机器可读权威。
- 同名 `.md` 仅作为人类可读展示层。
- `portfolio/idea-pool.yaml`、`portfolio/candidates/`、`portfolio/registry.yaml` 与 `specs/projects/<slug>/state.yaml` 共同构成运行时三元组与候选层事实源。
- 自动推进、门禁判断和状态回写都应优先读取 sidecar，再同步 Markdown。
- 候选层与正式项目层必须分开处理：候选先走 `idea_pool -> candidate_intake -> candidate_scored -> promoted_to_registry`，正式项目再走 `research_options -> direction_selected -> ...`。

---

## 一、你只需要做两类动作
### 动作 1：启动一个新候选
你准备一个新想法或候选池条目，系统就会先把它整理进候选层，再决定是否 promote。

### 动作 2：在门禁点回复
系统只会在以下三个节点停住：
1. 方向选择
2. PRD 审批
3. 提审包完成

除此之外，系统默认继续自动推进。

---

## 二、首次启动一个条目
### Step 1：新建候选或项目目录
在模板仓库或对应项目仓库里创建：

- `portfolio/idea-pool.yaml`（原始想法池，权威输入之一）
- `portfolio/candidates/`（候选产物目录）
- `specs/projects/<slug>/project-request.md`
- `specs/projects/<slug>/state.yaml`
- `specs/projects/<slug>/<stage>.meta.yaml`（对应阶段的机器可读 sidecar）

其中 `<slug>` 是项目标识，例如：
- `shaky-household-stack`
- `kitchen-balance`
- `moving-chaos`

### Step 2：选择 bootstrap 模式
你至少要判断当前属于哪种模式：
- `candidate_pool`：原始想法先进入候选池，推进 `idea_pool -> candidate_intake -> candidate_scored`
- `formal_project`：候选已被 promote，进入正式项目初始化，推进 `promoted_to_registry -> research_options`

模板文件：
- `specs/_templates/project-request.template.md`
- `specs/_templates/project-state.template.yaml`

### Step 3：填写条目内容
你至少要填写：
- 项目名称
- 项目标识
- 产品目标
- 约束（时间、成本、技术）
- 候选方向池（可选）
- 是否需要系统自动补方向

### Step 4：初始化状态文件
如果是第一次启动，`state.yaml` 初始化为：
- 候选池模式：`stage: idea_pool`，`next_state: candidate_intake`
- 正式项目模式：`stage: promoted_to_registry`，`next_state: research_options`

### Step 5：如果你在多项目模式下运行
还要在组合层登记条目：
- 候选层：`portfolio/idea-pool.yaml`
- 候选结果：`portfolio/candidates/`
- 正式项目层：`portfolio/registry.yaml`

这样组合层才能知道：
- 这个想法是否只是候选
- 它现在处于什么状态
- 是否该成为当前主推项目

---

## 三、如何真正调用总控入口
### 方式 A：先启动候选池
你可以直接对总控说：

> 为这个游戏想法启动候选池流程。请读取 `portfolio/idea-pool.yaml`、`portfolio/candidates/`、`specs/projects/<slug>/state.yaml`，先推进到候选评分门禁，并只输出当前状态、下一步和需要我确认的事项。

适合：
- 你只有一个原始想法
- 你还不确定它是否值得进入正式项目

### 方式 B：候选已 promote 后启动正式项目
你也可以让系统先读：
- `portfolio/registry.yaml`
- `portfolio/portfolio-board.md`
- `portfolio/wip-rules.yaml`

然后让它说：

> 从 `portfolio/registry.yaml` 中选出当前主推项目，读取对应的 `project-request.md` 和 `state.yaml`，自动推进到下一个人工门禁，并更新组合层摘要。

适合：
- 候选已经完成评分并被 promote
- 你需要正式项目层继续跑 `research_options -> direction_selected -> ...`

---

## 四、总控每次应该返回什么
为了避免每次输出风格不一致，总控每轮应尽量固定返回这 5 项：

1. **当前条目**
2. **当前状态**
3. **下一动作**
4. **当前产物路径**
5. **是否需要人工确认**

示例：

```text
当前条目：摇晃桌面叠物（shaky-household-stack）
当前状态：candidate_intake
下一动作：生成 candidate-scorecard.md，并停在候选评分门禁
当前产物：portfolio/candidates/shaky-household-stack/candidate-scorecard.md
是否需要人工确认：需要，确认是否进入 candidate_scored
```

---

## 五、门禁点怎么回复
### 1. 方向选择门禁
系统会停在：
- `research-options.md`
- `research-options.meta.yaml`
- `direction-gate.md`

你建议用这个格式回复：

```text
选定方向：家居杂物平衡塔
其他方向处理：保留
备注：优先走开发成本更低、失败反馈更强的方向
```

### 2. PRD 审批门禁
系统会停在：
- `prd.md`
- `prd.meta.yaml`
- `prd-gate.md`

你建议用这个格式回复：

```text
是否通过：是
备注：保持当前范围，不要提前扩展成长系统
```

如果不通过：

```text
是否通过：否
不通过原因：核心玩法闭环还不够清晰，首局目标描述太长
备注：先收紧首局目标与失败条件
```

### 3. 提审包完成门禁
系统会停在：
- `launch-prep.md`
- `launch-prep.meta.yaml`
- `state.yaml`

你建议用这个格式回复：

```text
是否进入 submission_ready：是
是否执行真实提审：否
备注：先停住，我要人工检查素材和账号信息
```

---

## 六、系统会自动生成什么
在正常推进中，系统会自动生成这些文档型产物：

- 候选层：`candidate-intake.md`、`candidate-intake.meta.yaml`、`candidate-scorecard.md`、`candidate-scorecard.meta.yaml`
- 正式项目层：`research-options.md`、`research-options.meta.yaml`、`direction-gate.md`
- 后续阶段：`prd.md`、`prd.meta.yaml`、`prd-gate.md`
- `architecture.md`
- `architecture.meta.yaml`
- `solution-design.md`
- `solution-design.meta.yaml`
- `uiux.md`
- `uiux.meta.yaml`
- `implementation.md`
- `implementation.meta.yaml`
- `test-report.md`
- `test-report.meta.yaml`
- `acceptance.md`
- `acceptance.meta.yaml`
- `launch-prep.md`
- `launch-prep.meta.yaml`
- `state.yaml`
- `portfolio/idea-pool.yaml`
- `portfolio/candidates/`
- `portfolio/registry.yaml`

默认都应以中文为主输出。

---

## 七、系统在什么情况下会自动停住
除了三个门禁外，遇到以下情况也必须停住：
- 输入缺失
- 测试失败
- 验收失败
- 关键 blocker 未解除
- 需要账号、凭据、资质、素材
- 文档不是中文主输出
- 用户价值验证不成立

这时一般会进入：
- `blocked`
- `needs_input`
- `rework`
- `killed`

---

## 八、如何恢复推进
如果系统停住，你一般只需要做以下之一：
1. 补输入
2. 做人工门禁回复
3. 明确回退到哪个阶段
4. 解除 blocker

然后再次对总控说：

> 继续推进 `shaky-household-stack`，请读取当前 `state.yaml` 和最新阶段产物，自动推进到下一个人工门禁。

---

## 九、多项目模式下怎么用
如果你同时跑多个项目，推荐这样做：

1. 每个候选或项目保留自己的：
   - `specs/projects/<slug>/...`
   - `specs/projects/<slug>/<stage>.meta.yaml`
2. 组合层统一维护：
   - `portfolio/idea-pool.yaml`
   - `portfolio/candidate-score-rules.yaml`
   - `portfolio/candidates/`
   - `portfolio/registry.yaml`
   - `portfolio/portfolio-board.md`
   - `portfolio/wip-rules.yaml`
   - `portfolio/decision-log.md`
3. 每次只把少量条目推进到高投入阶段

推荐理解方式：
- `portfolio/idea-pool.yaml`：原始想法事实源
- `portfolio/candidates/`：候选产物事实源
- `portfolio/registry.yaml`：正式项目运行态数据源
- `portfolio/wip-rules.yaml`：并行限制与优先级规则
- `portfolio/portfolio-board.md`：给人看的摘要看板
- `portfolio/decision-log.md`：保留关键决策历史

---

## 十、最小上手路径
如果你明天就想试一次，最短路径是：

1. 复制 `project-request.template.md`
2. 填一个真实候选方向
3. 复制 `project-state.template.yaml`
4. 把状态设成 `idea_pool`
5. 用总控入口启动一次候选池
6. 在候选评分和方向门禁各回复一次
7. 让它在 promote 后继续跑到 `submission_ready`

这样你就能最快验证：
- 这套模板是否真适合你的工作方式
- 哪个阶段还需要继续细化
- 哪些地方以后可以再自动化得更彻底
