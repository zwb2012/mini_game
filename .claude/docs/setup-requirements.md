# 设置要求

此模板需要安装少量工具才能获得完整功能。
如果缺少工具，所有 hooks 都会优雅失败 — 不会破坏任何内容，但
你会失去验证功能。

## 必需

| Tool | Purpose | Install |
| ---- | ---- | ---- |
| **Git** | 版本控制、分支管理 | [git-scm.com](https://git-scm.com/) |
| **Claude Code** | AI agent CLI | `npm install -g @anthropic-ai/claude-code` |

## 推荐

| Tool | Used By | Purpose | Install |
| ---- | ---- | ---- | ---- |
| **jq** | Hooks（12 个中的 7 个） | 在 commit/push/asset/agent hooks 中解析 JSON | 见下文 |
| **Python 3** | Hooks（12 个中的 2 个） | 验证 data 文件中的 JSON | [python.org](https://www.python.org/) |
| **Bash** | 所有 hooks | Shell 脚本执行 | Git for Windows 已包含 |

### 安装 jq

**Windows**（任选其一）：
```
winget install jqlang.jq
choco install jq
scoop install jq
```

**macOS**：
```
brew install jq
```

**Linux**：
```
sudo apt install jq     # Debian/Ubuntu
sudo dnf install jq     # Fedora
sudo pacman -S jq       # Arch
```

## 平台说明

### Windows
- Git for Windows 包含 **Git Bash**，提供所有 hooks 在 `.dsh/hooks.json` 中使用的 `bash` 命令
- 确保 Git Bash 位于你的 PATH 中（如果通过 Git 安装器安装，默认如此）
- Hooks 使用 `bash .dsh/hooks/[name].sh` — 这在 Windows 上可用，因为
  DSH 会通过能够找到 `bash.exe` 的 shell 调用命令

### macOS / Linux
- Bash 原生可用
- 通过你的包管理器安装 `jq`，以获得完整 hook 支持

## 验证你的设置

运行这些命令检查先决条件：

```bash
git --version          # Should show git version
bash --version         # Should show bash version
jq --version           # Should show jq version (optional)
python3 --version      # Should show python version (optional)
```

## 缺少可选工具时会发生什么

| Missing Tool | Effect |
| ---- | ---- |
| **jq** | Commit 验证、push 保护、asset 验证和 agent 审计 hooks 会静默跳过检查。Commits 和 pushes 仍可工作。 |
| **Python 3** | Commit 和 asset hooks 中的 JSON data 文件验证会被跳过。无效 JSON 可能在没有警告的情况下被提交。 |
| **Both** | 所有 hooks 仍会无错误执行（exit 0），但不提供验证。你等于在没有安全网的情况下飞行。 |

## 推荐 IDE

Claude Code 可配合任何编辑器使用，但此模板针对以下环境优化：
- 带 Claude Code 扩展的 **VS Code**
- **Cursor**（兼容 Claude Code）
- 基于终端的 Claude Code CLI
