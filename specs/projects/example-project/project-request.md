---
doc_type: project-request
stage: idea_pool
status: draft
owner_skill: product-pipeline-orchestrator
next_state: research_options
language: zh-CN
---

# 项目基础信息
- 项目名称：示例项目
- 项目标识：example-project
- 目标平台：微信小游戏

# 产品目标
- 目标：演示如何从项目请求进入自动化流水线的第一个研究阶段
- 商业目标：验证控制平面、sidecar 与门禁协议能否稳定运转

# 约束
- 时间约束：先验证流程结构，不追求完整产品实现
- 成本约束：不依赖额外美术与真实平台资源
- 技术约束：优先选择轻量结构和明确的状态机

# 控制平面约定
- 组合层唯一运行态事实源：`portfolio/registry.yaml`
- 项目层运行态事实源：`specs/projects/example-project/state.yaml`
- 请求阶段机器侧车：`specs/projects/example-project/project-request.meta.yaml`
- 后续阶段统一使用同名 `*.meta.yaml` sidecar
- 运行时三元组：state + meta + registry

# 候选方向池
- 方向 1：家居杂物平衡塔
- 方向 2：危险早餐桌
- 方向 3：离谱搬家挑战

# 调研要求
- 是否需要自动补充候选方向：否
- 重点关注：失败反馈是否有传播性、广告触点是否自然、首局理解成本是否足够低

# 备注
- 备注：这是控制平面对齐示例，不代表真实项目立项结论
