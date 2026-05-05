# 一句话启动入口说明

## 目标
把“我想做一个什么类型的游戏”直接转成一个可被自动流水线接管的新项目起点。

## 适用场景
当你还没有创建任何项目文件时，可以直接用一句话启动，例如：

> 我想做一个适合广告变现的微信小游戏，方向是搞笑物理堆叠类，帮我启动一个新项目。

## 系统应自动完成的动作
1. 解析用户输入中的：
   - 游戏类型
   - 变现目标
   - 平台
   - 约束（如果有）
2. 生成项目名称与 slug
3. 初始化：
   - `specs/projects/<slug>/project-request.md`
   - `specs/projects/<slug>/state.yaml`
4. 若开启组合层管理，则登记：
   - `portfolio/projects.yaml`
5. 将状态设置为：
   - `idea_pool`
   - `next_state: research_options`
6. 返回启动结果，并提示可以直接交给 `product-pipeline-orchestrator` 继续推进。

## 推荐调用语义
用户可以这样说：

> 我想做一个适合广告变现的微信小游戏，方向是搞笑物理堆叠类。请直接启动一个新项目，自动生成项目请求和状态文件，并推进到第一个人工门禁。

或在多项目模式下说：

> 帮我把这个新方向加入组合层，并自动初始化项目请求、状态文件，推进到 research_options。

## 推荐系统输出格式
```text
已创建项目：摇晃桌面叠物（shaky-household-stack）
已生成：
- specs/projects/shaky-household-stack/project-request.md
- specs/projects/shaky-household-stack/state.yaml
已登记组合层：是
当前状态：idea_pool
下一步：进入 research_options，并生成 research-options.md
```

## 注意事项
- 这个入口只负责“启动”，不负责越过人工门禁。
- 启动后仍由 `product-pipeline-orchestrator` 继续接管。
- 所有自动生成的文档型产物默认使用中文。
