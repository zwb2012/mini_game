# 活跃 Hook 列表

Hook 在 `.claude/settings.json` 中配置，自动触发:

| Hook | 事件 | 触发条件 | 操作 |
| ---- | ----- | ------- | ------ |
| `validate-commit.sh` | PreToolUse (Bash) | `git commit` 命令 | 校验设计文档章节、JSON 数据文件、硬编码值、TODO 格式 |
| `validate-push.sh` | PreToolUse (Bash) | `git push` 命令 | 对推送到受保护分支发出警告 |
| `validate-assets.sh` | PostToolUse (Write/Edit) | 资源文件变更 | 检查 `assets/` 中文件的命名规范和 JSON 有效性 |
| `session-start.sh` | SessionStart | 会话开始 | 加载 Sprint 上下文、里程碑、Git 活动；检测并预览活跃会话状态文件以恢复 |
| `detect-gaps.sh` | SessionStart | 会话开始 | 检测新项目（建议 `/start`），存在代码或原型时建议 `/reverse-document` 或 `/project-stage-detect` |
| `pre-compact.sh` | PreCompact | 上下文压缩 | 将会话状态（active.md、修改的文件、WIP 设计文档）写入对话以便压缩后恢复 |
| `post-compact.sh` | PostCompact | 压缩后 | 提醒 Claude 从 `active.md` 恢复会话状态 |
| `notify.sh` | Notification | 通知事件 | 通过 PowerShell 显示 Windows 桌面通知 |
| `session-stop.sh` | Stop | 会话结束 | 总结成果并更新会话日志 |
| `log-agent.sh` | SubagentStart | Agent 启动 | 审计追踪开始 — 带时间戳记录 subagent 调用 |
| `log-agent-stop.sh` | SubagentStop | Agent 停止 | 审计追踪结束 — 补全 subagent 记录 |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | Skill 文件变更 | 检测到 `.claude/skills/` 文件变更后建议运行 `/skill-test` |
