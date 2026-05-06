# 自动化流水线操作说明

## 目标
这份说明不是解释模板内部怎么设计，而是告诉使用者：**如何真正启动一个新项目、怎么与门禁交互、系统会自动做到哪一步。**

适用对象：
- 独立开发者
- 希望同时维护多个小游戏候选方向
- 只在少数关键节点人工拍板，其余阶段尽量自动推进

## 说明
- 同名 `*.meta.yaml` 是机器可读权威。
- 同名 `.md` 仅作为人类可读展示层。
- 自动推进、门禁判断与状态回写都应优先读取 sidecar，再同步 Markdown。

---

## 一、你只需要做两类动作
### 动作 1：启动一个新项目
你准备一个新项目请求文件，系统就会自动开始调研并推进到第一个人工门禁。

### 动作 2：在门禁点回复
系统只会在以下三个节点停住：
1. 方向选择
2. PRD 审批
3. 提审包完成

除此之外，系统默认继续自动推进。

---

## 二、首次启动一个项目
### Step 1：新建项目目录
在模板仓库或对应项目仓库里创建：

- `specs/projects/<slug>/project-request.md`
- `specs/projects/<slug>/state.yaml`
- `specs/projects/<slug>/<stage>.meta.yaml`（对应阶段的机器可读 sidecar）

其中 `<slug>` 是项目标识，例如：
- `shaky-household-stack`
- `kitchen-balance`
- `moving-chaos`

### Step 2：填写项目请求
你至少要填写：
- 项目名称
- 项目标识
- 产品目标
- 约束（时间、成本、技术）
- 候选方向池（可选）
- 是否需要系统自动补方向

模板文件：
- `specs/_templates/project-request.template.md`

### Step 3：初始化状态文件
如果是第一次启动，`state.yaml` 初始化为：
- `stage: idea_pool`
- `next_state: research_options`

模板文件：
- `specs/_templates/project-state.template.yaml`

### Step 4：如果你在多项目模式下运行
还要在组合层登记项目：
- `portfolio/projects.yaml`

这样组合层才能知道：
- 这个项目存在
- 现在处于什么状态
- 是否该成为当前主推项目

---

## 三、如何真正调用总控入口
### 方式 A：直接启动单个项目
你可以直接对总控说：

> 为 `shaky-household-stack` 启动自动化产品流水线。请读取 `specs/projects/shaky-household-stack/project-request.md` 和 `specs/projects/shaky-household-stack/state.yaml`，自动推进到下一个人工门禁，并只输出当前状态、下一步和需要我确认的事项。

适合：
- 你已经确定要启动某个具体项目
- 你不需要组合层先做优先级调度

### 方式 B：从组合层挑选主项目再启动
你也可以让系统先读：
- `portfolio/projects.yaml`
- `portfolio/portfolio-board.md`
- `portfolio/wip-rules.yaml`

然后让它说：

> 从 `portfolio/projects.yaml` 中选出当前主推项目，读取对应的 `project-request.md` 和 `state.yaml`，自动推进到下一个人工门禁，并更新组合层摘要。

适合：
- 同时跑多个项目
- 需要组合层帮你决定先推哪个

---

## 四、总控每次应该返回什么
为了避免每次输出风格不一致，总控每轮应尽量固定返回这 5 项：

1. **当前项目**
2. **当前状态**
3. **下一动作**
4. **当前产物路径**
5. **是否需要人工确认**

示例：

```text
当前项目：摇晃桌面叠物（shaky-household-stack）
当前状态：research_options
下一动作：生成 direction-gate.md，并停在方向选择门禁
当前产物：specs/projects/shaky-household-stack/research-options.md
是否需要人工确认：需要，确认推荐方向与其余方向处理方式
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

- `research-options.md`
- `research-options.meta.yaml`
- `direction-gate.md`
- `prd.md`
- `prd.meta.yaml`
- `prd-gate.md`
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

1. 每个项目保留自己的：
   - `specs/projects/<slug>/...`
   - `specs/projects/<slug>/<stage>.meta.yaml`
2. 组合层统一维护：
   - `portfolio/projects.yaml`
   - `portfolio/portfolio-board.md`
   - `portfolio/wip-rules.yaml`
   - `portfolio/decision-log.md`
3. 每次只把少量项目推进到高投入阶段

推荐理解方式：
- `portfolio/projects.yaml`：运行态数据源
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
5. 用总控入口启动一次
6. 在方向门禁和 PRD 门禁各回复一次
7. 让它自动跑到 `submission_ready`

这样你就能最快验证：
- 这套模板是否真适合你的工作方式
- 哪个阶段还需要继续细化
- 哪些地方以后可以再自动化得更彻底
