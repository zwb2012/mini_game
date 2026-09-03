# DSH 设置说明

DSH 的运行配置由桌面端管理（`$DSH_HOME/settings.yaml` 与桌面端设置面板）。本项目
不再使用 Claude Code 的 `.claude/settings.json`；权限与审批由 DSH 的沙箱 / 审批模型处理。

## 权限 / 审批

DSH 使用基于策略的审批（允许 / 拒绝）而非 Claude 的 `permissions.allow/deny` 列表。
安全操作（git status、测试运行）默认放行；危险操作（强制推送、`rm -rf`、读取 `.env`）
会被拒绝并在需要时向你确认。不要试图绕过拒绝 —— 按 DSH 政策处理。

## Hooks

DSH 通过 `hooks-claude-code` 桥接加载 `.dsh/hooks.json`（见 `.dsh/hooks/README.md`）。
这取代了旧的 `.claude/settings.json` hooks 段。

## 本地覆盖

个人 / 未提交的覆盖使用 DSH 的本地工作区指令文件：

- `AGENTS.local.md` —— 项目根的个人工作区指令覆盖（DSH 在 `AGENTS.md` 之后读取 `.local` 覆盖）。
- DSH 桌面端设置 —— 模型、provider、推理档位等运行偏好。

`AGENTS.local.md` 已被 `.gitignore` 忽略。
