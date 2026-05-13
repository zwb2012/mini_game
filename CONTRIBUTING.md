# 为 Claude Code Game Studios 做贡献

CCGS 是一个使用 Claude Code 进行独立游戏开发的协调框架。欢迎贡献——bug 修复、填补真实缺口的新技能、代理改进以及钩子修复。不符合框架方向的 PR 将被关闭，且不会给出冗长解释。

## 什么样的 PR 是好 PR

- **Bug 修复** —— 某些内容坏了，并提供修复
- **新技能** —— 解决尚未覆盖的工作流缺口
- **改进** —— 对现有代理、技能或钩子的改进
- **文档更正** —— 错误信息、损坏引用、过时步骤

以 PR 形式提交的功能请求将被关闭。请改为打开 issue。

**这个仓库不是什么：**
CCGS 是帮助你构建游戏的系统，不是用来存放你用它构建的游戏的地方。GDD、ADR、PRD、游戏概念、关卡设计、叙事文档，或任何其他由 CCGS 为你自己的项目生成的输出，都不会合并到这里——请把它们保存在你自己的仓库中。

## 不可协商的技术规则

如果遗漏这些规则，你的 PR 会被拒绝。

**技能文件**
- 技能位于 `.claude/skills/<name>/SKILL.md`——必须使用子目录格式。扁平的 `.md` 文件会被 Claude Code 静默忽略。
- SKILL.md 必须包含 YAML frontmatter：`name`、`description`、`argument-hint`、`allowed-tools` 和 `model`
- 模型层级：只读状态检查使用 `haiku`，多文档综合和阶段门禁使用 `opus`，其他所有内容使用 `sonnet`

**钩子**
- 使用 `grep -E`——绝不要使用 `grep -P`（Perl 正则会在 Windows Git Bash 上出问题）
- 为未安装 `jq` 或 `python` 的系统提供回退
- 钩子会在每次会话启动时运行——不适用时必须快速且优雅地退出（`exit 0`）

**代理**
- 新代理必须包含 **Collaboration Protocol** 章节，说明该代理如何提问并将决策交还给用户
- 未经明确用户委派，代理不得修改其文档化领域之外的文件

**参考文档**
- 如果你的 PR 添加或更改了技能、代理或钩子，请更新对应的参考文档（agent-roster、skills-reference、hooks-reference 或 rules-reference）。新增内容但不更新索引的 PR 会被退回。

## 协作原则

CCGS 不是自治系统。每个工作流都遵循：
**Question → Options → Decision → Draft → Approval → Write**

技能和代理必须先询问再行动。没有明确的用户确认，不会向文件写入任何内容。如果你的贡献让代理单方面做决定或写文件，它不会被合并。

## 测试你的更改

在 Claude Code 会话中运行它，并确认端到端有效。对于技能，请调用该技能，并验证输出与技能声称要做的事情一致。对于钩子，请触发相关事件，并确认钩子正确触发且干净退出。

请在 PR 描述中包含一段简短说明，描述你测试了什么以及输出是什么样子。

## 提交格式

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: add /retrospective skill for end-of-sprint reviews
fix: correct grep -P usage in session-start hook
docs: update skills-reference with new /qa-plan entry
```

类型：`feat`、`fix`、`docs`、`chore`、`refactor`、`test`

## PR 流程

- 你的 PR 会通过 CODEOWNERS 自动分配给维护者
- 评审会在有时间时进行——这是一个单人维护的项目
- 如果你的 PR 开启几周后仍没有反馈，可以留一条提醒评论
- 已合并的贡献者会在 release notes 中署名

## 平台兼容性

CCGS 必须能在 Windows（Git Bash）、macOS 和 Linux 上运行。如果你的钩子或脚本使用任何平台特定内容，它会被拒绝。拿不准时，请在 Windows 上测试。
