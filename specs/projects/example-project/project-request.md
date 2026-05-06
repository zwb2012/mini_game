---
doc_type: project-request
stage: idea_pool
status: draft
owner_skill: product-pipeline-orchestrator
next_state: research_options
language: zh-CN
---

# 项目基础信息
- 项目名称：摇晃桌面叠物
- 项目标识：shaky-household-stack
- 目标平台：微信小游戏

# 产品目标
- 目标：做一款失败反馈有趣、能快速复玩的轻度物理堆叠小游戏
- 商业目标：通过复活、结算加倍和短局复玩形成广告变现闭环

# 约束
- 时间约束：优先验证方向，先用最小版本证明可玩性
- 成本约束：控制内容生产量，不依赖大量美术资源
- 技术约束：优先选择轻量实现和稳定的单局状态机

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
- 备注：希望先从开发成本更低、反馈更强的方向开始验证
