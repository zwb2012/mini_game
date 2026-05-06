# 常见问题

## 1. 这是一个单项目模板还是多项目模板？
它本质上是一个**多项目组合层 + 单项目流水线**模板。

也就是说：
- 多个项目可以同时存在于组合层
- 但单个项目仍然按自己的状态机独立推进

---

## 2. 我还需要手动调用每个 skill 吗？
理想状态下不需要。

你应该优先通过：
- `new-project-bootstrap`
- `candidate-scout`
- `candidate-scorer`
- `product-pipeline-orchestrator`

这样的入口来启动和推进项目，而不是手动一个个调叶子技能。

---

## 3. 为什么还会有这么多 skill？
因为 skill 在这里不是“用户手动入口”，而是：
- 流水线的叶子能力
- 阶段文档的稳定生成器
- 可被总控调度的可复用模块

---

## 4. 为什么有 `portfolio/`，又有 `specs/projects/`？
两者职责不同：
- `portfolio/`：跨项目组合层控制平面
- `specs/projects/`：单项目产物层

现在 `portfolio/` 内部也进一步拆分为：
- `portfolio/idea-pool.yaml`：原始想法 SSOT，先进入候选层
- `portfolio/candidate-score-rules.yaml`：候选评分与 promote / hold / reject 规则
- `portfolio/candidates/`：候选产物根目录
- `portfolio/registry.yaml`：候选通过后的唯一运行态事实源
- `portfolio/projects.yaml`：兼容层
- `portfolio/wip-rules.yaml`：WIP 与优先级规则源
- `portfolio/portfolio-board.md`：展示视图
- `portfolio/decision-log.md`：决策记录

简单理解：
- 原始想法先进入候选层，再决定是否进入 `portfolio/registry.yaml`
- `portfolio/registry.yaml` 决定“现在真实是什么状态”
- `portfolio/wip-rules.yaml` 决定“谁先做、谁该停”
- `portfolio/portfolio-board.md` 只负责展示
- `specs/projects/` 记录“这个项目本身现在推进到了哪一步”

---

## 5. 为什么还需要 `CLAUDE.md`？
`CLAUDE.md` 不是强制必须，但很有价值。

它适合放：
- Claude 每次进入仓库都该优先知道的硬规则
- 中文输出约束
- 门禁边界
- 事实源规则
- 自动化停止边界

而完整方法论仍然应该放在 `specs/workflows/automation/`。

---

## 6. 能不能只通过一句“我想做一个什么类型的游戏”就启动？
可以，这正是 `new-project-bootstrap` 的目标。

理想输入例如：
> 我想做一个适合广告变现的微信小游戏，方向是搞笑物理堆叠类。

系统应自动：
- 生成项目名称与 slug
- 生成 `project-request.md`
- 生成 `state.yaml`
- 如有需要，登记到组合层
- 推进到 `research_options`

---

## 7. 为什么不自动执行真实微信提审？
因为这属于高风险、不可逆、依赖外部账号与资质的动作。

当前模板默认停在：
- `submission_ready`

也就是说：
- 提审包可以准备好
- 但真正提交动作需要人工控制

---

## 8. 为什么文档都要求中文？
因为这套模板的核心工作产物是文档，不只是代码。

如果主要内容用英文，会增加：
- 审阅成本
- 沉淀成本
- 长期维护成本

所以规则是：
- 文档主体中文
- 代码/API/字段键名等必要技术标识保留英文

---

## 9. 真正的项目代码应该也放在这个仓库里吗？
不推荐。

这个仓库更适合作为：
- 模板仓库
- 工作流规范仓库
- 技能与模板母版

真实小游戏项目更适合一项目一仓库。

---

## 10. 我应该先看哪个文档？
推荐顺序：
1. [`README.md`](README.md)
2. [`QUICKSTART.md`](QUICKSTART.md)
3. [`specs/workflows/automation/operator-guide.md`](specs/workflows/automation/operator-guide.md)
4. [`specs/workflows/automation/startup-protocol.md`](specs/workflows/automation/startup-protocol.md)
5. [`specs/projects/shaky-household-stack/`](specs/projects/shaky-household-stack/) 示例产物链
