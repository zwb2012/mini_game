# 自动化流水线门禁

## 目标
定义哪些节点必须人工确认，哪些情况必须自动停止，避免流水线在错误方向上高速推进。

## 一、必须人工确认的门禁
### 门禁 1：候选阈值确认
触发时机：`candidate_scored` 阶段结束后。

人工确认内容：
- `threshold_result` 是否符合候选层判定
- `threshold_reason` 是否解释清楚
- `required_rework` 是否完整
- `human_override` 是否需要介入

绑定产物：
- `candidate-scorecard.md`
- `candidate-scorecard.meta.yaml`
- `portfolio/candidate-score-rules.yaml`

通过后进入：`promoted_to_registry`、`candidate_hold` 或 `candidate_reject`

### 门禁 2：正式项目阈值确认
触发时机：`research_options`、`prd_draft`、`architecture`、`solution_design`、`uiux`、`implementation`、`test`、`acceptance`、`launch_prep` 任一阶段结束后。

人工确认内容：
- `threshold_result` 是否为 `pass / hold / fail / rework` 中符合当前阶段的结果
- 阈值说明是否和当前产物一致
- 是否需要人工覆盖自动结果

绑定产物：
- 对应阶段的 `.md`
- 对应阶段的 `.meta.yaml`
- `portfolio/project-thresholds.yaml`

通过后进入：下一阶段或 `submission_ready`

### 门禁 3：提审包完成
触发时机：`launch_prep` 阶段结束后。

人工确认内容：
- 提审文档、素材、配置、检查表是否齐全
- 是否真正执行外部平台的审核提交流程

绑定产物：
- `launch-prep.md`
- `launch-prep.meta.yaml`
- `state.yaml`

通过后进入：`submission_ready`

> 注意：本模板默认停在 `submission_ready`，不自动执行微信平台的真实提审动作。

## 二、自动停止条件
任意阶段遇到以下情况必须停止：
- 输入缺失或目标模糊
- 关键依赖未准备好
- 测试失败
- 验收失败
- 需要账号、凭据、资质、外部权限
- 方案出现重大歧义
- 用户价值验证不成立

## 三、停止后的分流
- 信息缺失：进入 `needs_input`
- 技术或资源受阻：进入 `blocked`
- 产物不达标：进入 `rework`
- 项目不值得继续：进入 `killed`

## 四、默认自动推进范围
除以上三处人工门禁外，其余阶段默认允许自动推进：
- research
- architecture
- solution_design
- uiux
- implementation
- test
- acceptance
- launch_prep

前提是：
1. 上一阶段产物齐全
2. 未命中自动停止条件
3. 当前项目未超出 WIP 规则

## 五、机器可读权威规则
- 每个门禁判断都应优先读取同名 `*.meta.yaml`。
- Markdown 仅用于人工阅读与复核。
- 状态回写时，先更新 sidecar，再同步 Markdown。
