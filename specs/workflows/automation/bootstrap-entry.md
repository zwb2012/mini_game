# 一句话启动入口说明

## 目标
把“我想做一个什么类型的游戏”直接转成一个可被自动流水线接管的新项目起点。

## 适用场景
当你还没有创建任何项目文件时，可以直接用一句话启动，例如：

> 我想做一个适合广告变现的微信小游戏，方向是搞笑物理堆叠类，帮我启动一个新项目。

## 说明
- 同名 `*.meta.yaml` 是机器可读权威。
- 同名 `.md` 是给人阅读的展示层。
- 当两者存在冲突时，以 `*.meta.yaml` 为准。
- 启动后每个阶段都应形成 `state + meta + registry` 三元组。
- 原始想法必须先进入候选层，再由 `promote` 动作把强候选送进正式项目控制平面。

## 系统应自动完成的动作
1. 解析用户输入中的：
   - 游戏类型
   - 变现目标
   - 平台
   - 约束（如果有）
2. 生成项目名称、slug 与候选标识。
3. 初始化候选池输入：
   - `portfolio/idea-pool.yaml`
   - `portfolio/candidates/<candidate-id>/candidate-intake.md`
   - `portfolio/candidates/<candidate-id>/candidate-intake.meta.yaml`
4. 将状态先写为：
   - `idea_pool`
   - `next_state: candidate_intake`
5. 在候选层完成评分后，只有被 `promote` 的候选才会：
   - 创建 `specs/projects/<slug>/project-request.md`
   - 创建 `specs/projects/<slug>/project-request.meta.yaml`
   - 创建 `specs/projects/<slug>/state.yaml`
   - 登记到 `portfolio/registry.yaml`
6. promote 之后，才由 `product-pipeline-orchestrator` 接手正式项目流。

## 推荐调用语义
用户可以这样说：

> 我想做一个适合广告变现的微信小游戏，方向是搞笑物理堆叠类。请先把它作为候选启动，自动生成候选层产物和机器侧车，并推进到候选评分阶段。

或在多项目模式下说：

> 帮我把这个新方向加入组合层候选池，自动初始化候选层产物和侧车，并推进到 candidate_scored。

## 推荐系统输出格式
```text
已创建候选：摇晃桌面叠物（cand_shaky_household_stack_001）
已生成：
- portfolio/idea-pool.yaml
- portfolio/candidates/cand_shaky_household_stack_001/candidate-intake.md
- portfolio/candidates/cand_shaky_household_stack_001/candidate-intake.meta.yaml
当前状态：idea_pool
下一步：进入 candidate_intake，再推进到 candidate_scored
说明：只有 promote 后才创建正式项目目录并写入 portfolio/registry.yaml
```

## 注意事项
- 这个入口只负责“启动”，不负责越过人工门禁。
- 候选层和正式项目层必须分开。
- 启动后候选层先由 `candidate-scout` / `candidate-scorer` 处理，正式项目层才交给 `product-pipeline-orchestrator`。
- 所有自动生成的文档型产物默认使用中文。
- 运行态判断优先读取 `state + meta + registry`，Markdown 只做人工展示层。
