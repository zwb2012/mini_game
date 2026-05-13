# 上下文管理

上下文是 Claude Code 会话中最关键的资源。请主动管理它。

## 文件承载状态（主要策略）

**文件才是记忆，而不是对话。** 对话是临时的，可能会被压缩或丢失。
磁盘上的文件会在压缩和会话崩溃后继续保留。

### 会话状态文件

将 `production/session-state/active.md` 维护为一个实时 checkpoint。在每个重要里程碑后更新它：

- 设计章节已批准并写入文件
- 已做出架构决策
- 达成实现里程碑
- 获得测试结果

状态文件应包含：当前任务、进度 checklist、已做出的关键决策、
正在处理的文件，以及开放问题。

### Status Line Block（仅 Production+）

当项目处于 Production、Polish 或 Release 阶段时，在 `active.md` 中包含一个结构化
status block，供 status line 脚本解析：

```markdown
<!-- STATUS -->
Epic: Combat System
Feature: Melee Combat
Task: Implement hitbox detection
<!-- /STATUS -->
```

- 三个字段（Epic、Feature、Task）都是可选的 — 只包含适用项
- 切换关注区域时更新此 block
- status line 会将其显示为 breadcrumb：`Combat System > Melee Combat > Hitboxes`
- 没有活跃工作焦点时，移除或清空此 block

任何中断（compaction、crash、`/clear`）之后，先读取状态文件。

### 增量文件写入

创建多章节文档（设计文档、架构文档、lore entries）时：

1. 立即创建带 skeleton 的文件（所有章节标题，正文为空）
2. 在对话中一次讨论并起草一个章节
3. 每个章节一经批准就写入文件
4. 每写完一个章节后更新 session state 文件
5. 写入某章节后，关于该章节的先前讨论可以安全地被压缩 — 决策已在文件中

这会让上下文窗口只保留*当前*章节的讨论（约 3-5k tokens），
而不是整个文档的对话历史（约 30-50k tokens）。

## 主动压缩

- 在上下文使用率约 60-70% 时**主动压缩**，不要等到接近上限才被动压缩
- 在不相关任务之间，或连续 2 次以上修正失败后，**使用 `/clear`**
- **自然压缩点：** 写入一个章节后、commit 后、完成一个任务后、开始新主题前
- **聚焦压缩：** `/compact Focus on [current task] — sections 1-3 are
  written to file, working on section 4`

## 按任务类型划分的上下文预算

- 轻量（read/review）：启动约 3k tokens
- 中等（implement feature）：约 8k tokens
- 重型（multi-system refactor）：约 15k tokens

## Subagent 委派

使用 subagents 进行研究和探索，以保持主会话整洁。
Subagents 在自己的上下文窗口中运行，并只返回摘要：

- **使用 subagents**：当需要跨多个文件调查、探索不熟悉的代码，
  或研究会消耗超过 5k tokens 的文件读取时
- **使用直接读取**：当你明确只需检查 1-2 个具体文件时
- Subagents 不继承对话历史 — 在 prompt 中提供完整上下文

## 压缩说明

上下文被压缩时，在摘要中保留以下内容：

- 引用 `production/session-state/active.md`（读取它以恢复状态）
- 本会话中修改过的文件列表及其目的
- 做出的任何架构决策及其理由
- 活跃 sprint tasks 及其当前状态
- Agent 调用及其结果（success/failure/blocked）
- 测试结果（pass/fail 数量、具体失败项）
- 等待用户输入的未解决 blockers 或问题
- 当前任务以及我们所处的步骤
- 当前文档哪些章节已写入文件，哪些仍在进行中

**压缩后：** 读取 `production/session-state/active.md` 和任何正在处理的文件，
以恢复完整上下文。决策存放在文件中；对话历史是次要的。

## 会话崩溃后的恢复

如果会话死亡（“prompt too long”）或你启动新会话继续工作：

1. `session-start.sh` hook 会自动检测并预览 `active.md`
2. 读取完整状态文件以获取上下文
3. 读取状态中列出的部分完成文件
4. 从下一个未完成章节或任务继续
