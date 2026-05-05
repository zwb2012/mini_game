# 自动化流水线状态机

## 目标
定义模板仓库、组合层与单项目仓库在自动化流水线中的标准状态，保证总控入口能够根据状态自动推进、停住或回退。

## 一、组合层状态
组合层只负责“多个项目同时推进时的全局视图”，不负责单个项目的具体实现细节。

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `idea_pool` | 方向池中的原始想法，尚未进入研究 | 进入 `researching` |
| `researching` | 正在自动调研题材、竞品、传播性、变现适配性 | 输出 `research_options` |
| `direction_waiting` | 调研完成，等待用户选定方向 | 用户选方向后进入 `active_pipeline` |
| `active_pipeline` | 某个项目已进入完整产品流水线 | 按单项目状态继续推进 |
| `blocked` | 组合层存在阻塞，如资源冲突、关键信息缺失 | 人工处理后回到原状态 |
| `submission_ready` | 某个项目的提审包已完成，等待用户决定是否真正提交 | 人工决定后结束或进入外部发布流程 |
| `killed` | 某个方向或项目被淘汰 | 归档，不再自动推进 |

## 二、单项目生命周期状态
单项目状态机用于驱动从方向确定到提审包完成的完整自动化闭环。

`idea_pool -> research_options -> direction_selected -> prd_draft -> prd_approved -> architecture -> solution_design -> uiux -> implementation -> test -> acceptance -> launch_prep -> submission_ready`

### 状态说明
- `research_options`：自动调研完成，产出候选方向与排序建议。
- `direction_selected`：用户已选定方向，项目正式立项。
- `prd_draft`：已生成 PRD 草稿，等待审批。
- `prd_approved`：PRD 已通过人工确认，可继续自动推进。
- `architecture`：输出技术架构。
- `solution_design`：输出模块拆分、实现方案、依赖关系。
- `uiux`：输出界面结构、交互说明、关键页面方案。
- `implementation`：进入代码实现与集成。
- `test`：执行功能测试、回归测试、质量验证。
- `acceptance`：按验收标准检查产品是否可进入提审准备。
- `launch_prep`：准备提审清单、素材、配置、说明文档。
- `submission_ready`：提审包完整，但不自动执行真实提交动作。

## 三、异常与侧状态
以下状态可以从任意主状态进入：

| 状态 | 触发条件 | 退出方式 |
| --- | --- | --- |
| `blocked` | 缺失输入、凭据、素材、环境、关键依赖 | 补齐条件后回到原状态 |
| `needs_input` | 需要用户做明确判断或补充必要信息 | 用户提供输入后回到原状态 |
| `rework` | 当前阶段产物未通过测试、验收或门禁 | 重新进入指定阶段 |
| `killed` | 用户或系统确认该项目不值得继续 | 归档终止 |

## 四、状态推进规则
1. 任何状态推进前，必须先验证上一个阶段产物是否存在且字段完整。
2. 命中人工门禁时，状态只能停在门禁前，不允许自动越过。
3. 命中自动停止条件时，必须进入 `blocked`、`needs_input` 或 `rework`。
4. `submission_ready` 是自动化流水线的终止状态，真实提审动作不在本模板自动执行范围内。
