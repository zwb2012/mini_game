# 活跃 Hooks

Hooks 在 `.claude/settings.json` 中配置，并会自动触发：

| Hook | Event | Trigger | Action |
| ---- | ----- | ------- | ------ |
| `validate-commit.sh` | PreToolUse (Bash) | `git commit` commands | 验证设计文档章节、JSON data 文件、硬编码数值、TODO 格式 |
| `validate-push.sh` | PreToolUse (Bash) | `git push` commands | 对推送到受保护分支（develop/main）发出警告 |
| `validate-assets.sh` | PostToolUse (Write/Edit) | Asset file changes | 检查 `assets/` 中文件的命名约定和 JSON 有效性 |
| `session-start.sh` | SessionStart | Session begins | 加载 sprint context、milestone、git activity；检测并预览 active session state 文件以便恢复 |
| `detect-gaps.sh` | SessionStart | Session begins | 检测新项目（建议 /start）以及存在 code/prototypes 时缺失的文档，建议 /reverse-document 或 /project-stage-detect |
| `pre-compact.sh` | PreCompact | Context compression | 在压缩前将 session state（active.md、modified files、WIP design docs）转储到对话中，以便其在 summarization 后保留 |
| `post-compact.sh` | PostCompact | After compaction | 提醒 Claude 从 `active.md` checkpoint 恢复 session state |
| `notify.sh` | Notification | Notification event | 通过 PowerShell 显示 Windows toast notification |
| `session-stop.sh` | Stop | Session ends | 总结成果并更新 session log |
| `log-agent.sh` | SubagentStart | Agent spawned | 审计轨迹开始 — 使用时间戳记录 subagent 调用 |
| `log-agent-stop.sh` | SubagentStop | Agent stops | 审计轨迹结束 — 完成 subagent 记录 |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | Skill file changes | 在写入或编辑任何 `.claude/skills/` 文件后，建议运行 `/skill-test` |

Hook 参考文档：`.claude/docs/hooks-reference/`
Hook 输入 schema 文档：`.claude/docs/hooks-reference/hook-input-schemas.md`
