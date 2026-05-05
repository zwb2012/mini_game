# 自动化流水线启动协议

## 目标
定义用户如何真正启动一次新项目自动化流水线，避免每次都靠口头说明重新组织上下文。

## 一、单入口原则
用户不需要手动逐个调用 `idea-intake`、`prd-writer`、`architecture-designer` 等叶子技能。

启动方式统一为：
1. 提交一个**新项目启动请求**
2. 系统自动进入 `research_options`
3. 在方向选择门禁停住
4. 用户选定方向后，自动进入 PRD、架构、方案、UI/UX、实现、测试、验收、上架准备
5. 在 `submission_ready` 停住，不执行真实平台提审动作

## 二、启动输入
每次启动一个新项目时，用户至少提供一份请求文档：
- `specs/projects/<slug>/project-request.md`

建议最小字段：
- 项目名称
- 项目标识（slug）
- 产品目标
- 目标平台（默认微信小游戏）
- 约束（时间、成本、技术栈）
- 候选方向池（可选）
- 是否需要系统自动补充候选方向

## 三、启动流程
### Step 1：写入启动请求
用户或上层组合层先准备：
- `specs/projects/<slug>/project-request.md`
- `specs/projects/<slug>/state.yaml`

其中：
- `state.yaml` 初始状态为 `idea_pool`
- 若没有候选方向池，则系统先自动做研究扩展

### Step 2：进入 research
总控入口读取：
- 启动请求
- 状态文件
- workflow 规则

然后自动调用 `research-analyst` 生成：
- `research-options.md`

### Step 3：触发方向选择门禁
系统生成：
- `direction-gate.md`

用户只需在门禁中选择：
- 选哪个方向
- 其他方向保留 / 观察 / 淘汰

一旦选定，状态更新为：
- `direction_selected`

### Step 4：自动进入 PRD 草稿
系统调用 `prd-writer`，生成：
- `prd.md`
- `prd-gate.md`

用户在 `prd-gate.md` 审批通过后，状态更新为：
- `prd_approved`

### Step 5：自动连续推进
后续自动推进：
- `architecture`
- `solution_design`
- `uiux`
- `implementation`
- `test`
- `acceptance`
- `launch_prep`

只有命中 blocker、测试失败、验收失败，或到达 `submission_ready` 才停止。

## 四、组合层如何发起新项目
对于多项目并行场景，建议组合层把每个候选项目的最小索引记录在：
- `portfolio/projects.yaml`

当某个项目被真正启动时：
1. 在项目仓创建 `specs/projects/<slug>/project-request.md`
2. 创建 `specs/projects/<slug>/state.yaml`
3. 在 `portfolio/projects.yaml` 里登记该项目当前状态
4. 由总控入口自动接管

## 五、中文输出规则
启动协议本身，以及后续所有文档型产物默认使用中文。
仅在代码、API 名称、第三方库名、字段键名和必要英文术语处保留英文。
