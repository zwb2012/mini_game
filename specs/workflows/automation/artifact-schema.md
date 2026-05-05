# 自动化流水线产物 Schema

## 一、统一 frontmatter 字段
所有 Markdown 产物都应尽量包含以下 frontmatter：

```yaml
doc_type: <文档类型>
stage: <所属阶段>
status: draft | approved | blocked | done
owner_skill: <负责生成该文档的技能>
next_state: <推荐下一状态>
updated_at: <YYYY-MM-DD>
language: zh-CN
```

说明：
- `language` 默认必须为 `zh-CN`
- `status` 用于区分草稿、通过、阻塞和完成
- `next_state` 由当前阶段结论决定

## 二、阶段主产物映射
| 阶段 | 主产物 |
| --- | --- |
| research_options | `research-options.md` |
| prd_draft | `prd.md` |
| architecture | `architecture.md` |
| solution_design | `solution-design.md` |
| uiux | `uiux.md` |
| implementation | `implementation.md` |
| test | `test-report.md` |
| acceptance | `acceptance.md` |
| launch_prep | `launch-prep.md` |

## 三、门禁状态与产物映射
门禁状态不强制要求独立模板，但必须明确绑定到主产物或状态文件，避免流程推进时出现语义空档。

| 门禁状态 | 绑定产物 | 通过条件 |
| --- | --- | --- |
| `direction_selected` | `research-options.md` + `state.yaml` | 用户已明确选择推荐方向，并写入状态文件 |
| `prd_approved` | `prd.md` + `state.yaml` | PRD 已通过人工审批，状态文件标记为已批准 |
| `submission_ready` | `launch-prep.md` + `state.yaml` | 提审包完整，状态文件标记为 `submission_ready`，但不执行真实提审 |

## 四、每类产物的最低要求
### 1. 研究产物
必须包含：
- 候选方向
- 竞品观察
- 变现适配性
- 风险
- 推荐排序

### 2. PRD
必须包含：
- 目标用户
- 核心体验
- 核心循环
- 范围边界
- 验收标准

### 3. 架构文档
必须包含：
- 模块划分
- 关键依赖
- 状态与数据流
- 关键技术决策

### 4. 方案设计
必须包含：
- 实现路径
- 任务拆分
- 关键接口与边界
- 主要风险

### 5. UI/UX 文档
必须包含：
- 页面结构
- 交互流程
- 反馈机制
- 广告触点设计原则

### 6. 实现文档
必须包含：
- 当前实现范围
- 已完成模块
- 未完成模块
- 关键变更说明

### 7. 测试报告
必须包含：
- 测试范围
- 通过项
- 失败项
- 阻塞项
- 是否允许进入验收

### 8. 验收文档
必须包含：
- 验收标准
- 对照结果
- 是否通过
- 回退建议

### 9. 上架准备文档
必须包含：
- 提审包内容
- 素材准备情况
- 配置准备情况
- 未完成事项
- 是否达到 `submission_ready`
