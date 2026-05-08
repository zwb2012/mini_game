# 上下文管理

## 会话紧凑化

Claude Code 会在上下文窗口接近上限时自动压缩对话。压缩前，`pre-compact.sh` hook 将当前会话进度保存到 `production/session-state/active.md`。压缩后，`post-compact.sh` hook 提醒 Claude 从此文件恢复状态。

## 编写 Agent 定义时的上下文预算

- 将 agent 定义控制在 200 行以内——超过则拆分为子专员
- 使用 `@` 引用将大型文档（编码规范、引擎参考）排除在上下文外，仅在需要时加载
- 将架构决策记录保持在 80 行以内
- 将 GDD 保持在 300 行以内——更长的拆分为多个文档

## 上下文效率模式

在长期 session 中:
- 在 Task 调用中显式说明所需上下文，而不是让 subagent 读取整个项目
- 启动 subagent 时引用路径——让它们按需读取文件
- 使用并行 Task 调用处理独立工作，减少顺序等待的 token 消耗
