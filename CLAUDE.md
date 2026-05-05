# 模板仓库执行规则

## 语言规则
- 所有文档型产物默认使用中文输出。
- 仅在代码、API 名称、第三方库名、字段键名与必要英文术语处保留英文。
- 如果文档主体不是中文，应视为未通过当前模板规则。

## 自动化流水线边界
- 这套模板的目标是把小游戏项目从研究一路推进到 `submission_ready`。
- 默认不自动执行真实微信提审动作。
- `submission_ready` 是自动化流水线的默认终点。

## 三个人工门禁
以下节点必须停住，不能自动越过：
1. 方向选择
2. PRD 审批
3. 提审包完成

## 单入口原则
- 用户不应手动逐个调用各阶段叶子技能。
- 优先通过单一总控入口或 bootstrap 入口启动和推进项目。

## 事实源规则
### 组合层
- `portfolio/projects.yaml`：组合层运行态数据源
- `portfolio/wip-rules.yaml`：WIP 与优先级规则源
- `portfolio/portfolio-board.md`：给人阅读的组合层看板视图
- `portfolio/decision-log.md`：关键决策记录

### 项目层
- `specs/projects/<slug>/state.yaml`：单项目运行态状态源
- 各阶段主产物位于 `specs/projects/<slug>/`

## 工作流规则
- 状态机：`specs/workflows/automation/state-machine.md`
- 门禁：`specs/workflows/automation/gates.md`
- 规则：`specs/workflows/automation/rules.md`
- 产物 schema：`specs/workflows/automation/artifact-schema.md`
- 启动协议：`specs/workflows/automation/startup-protocol.md`
- 操作说明：`specs/workflows/automation/operator-guide.md`

## 实施原则
- 速度服务于质量，不为追求快而降低用户价值验证门槛。
- 任何阶段如果出现 blocker、测试失败、验收失败、输入缺失或用户价值验证不成立，必须停住。
- 对多项目并行场景，必须遵守组合层 WIP 限制。