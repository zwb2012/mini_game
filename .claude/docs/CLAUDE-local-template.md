# CLAUDE.local.md 模板

将此文件复制到项目根目录，命名为 `CLAUDE.local.md`，用于个人覆盖设置。
此文件已 gitignored，不会被提交。

```markdown
# 个人偏好

## 模型偏好
- 复杂设计任务优先使用 Opus
- 快速查找和简单编辑使用 Haiku

## 工作流偏好
- 代码变更后始终运行测试
- 在上下文使用率达到 60% 时主动压缩
- 在不相关任务之间使用 /clear

## 本地环境
- Python command: python (or py / python3)
- Shell: Git Bash on Windows
- IDE: VS Code with Claude Code extension

## 沟通风格
- 保持回复简洁
- 在所有代码引用中显示文件路径
- 简要解释架构决策

## 个人快捷方式
- 当我说 “review” 时，对最后变更的文件运行 /code-review
- 当我说 “status” 时，显示 git status + sprint progress
```

## 设置

1. 将此模板复制到项目根目录：`cp .claude/docs/CLAUDE-local-template.md CLAUDE.local.md`
2. 编辑以匹配你的偏好
3. 确认 `CLAUDE.local.md` 位于 `.gitignore` 中（Claude Code 会从项目根目录读取它）
