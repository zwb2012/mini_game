# 示例流水线 dry run 结果

## 项目
- 名称：摇晃桌面叠物
- 标识：shaky-household-stack

## 已生成产物
- project-request.md / project-request.meta.yaml
- research-options.md / research-options.meta.yaml
- prd.md / prd.meta.yaml
- architecture.md / architecture.meta.yaml
- solution-design.md / solution-design.meta.yaml
- uiux.md / uiux.meta.yaml
- implementation.md / implementation.meta.yaml
- test-report.md / test-report.meta.yaml
- acceptance.md / acceptance.meta.yaml
- launch-prep.md / launch-prep.meta.yaml
- state.yaml
- portfolio/registry.yaml

## 控制平面对齐
- 组合层唯一运行态事实源：`portfolio/registry.yaml`
- 项目运行态事实源：`specs/projects/shaky-household-stack/state.yaml`
- 阶段机器侧车：对应阶段的 `*.meta.yaml`
- 三者共同构成运行时三元组：state + meta + registry

## 门禁表现
- 方向选择门禁：已用研究结果中的推荐方向模拟人工选定
- PRD 审批门禁：已将 PRD 标记为 approved 后继续推进
- 提审包完成门禁：流水线已停在 submission_ready，没有执行真实提审动作

## 最终状态
- 当前状态：submission_ready
- 当前 blocker：
  - 真实代码仓构建产物未接入
  - 真实提审素材与账号信息未提供

## 结论
这次 dry run 证明：
1. 模板仓库已经能生成一条完整的中文文档流水线，并把 `state.yaml`、阶段 `*.meta.yaml` 和 `portfolio/registry.yaml` 作为同一套运行态控制面
2. 流水线会在三个门禁处体现停点语义
3. 在没有真实项目代码仓与平台凭据的前提下，会正确停在 submission_ready，而不会越界执行真实发布动作
