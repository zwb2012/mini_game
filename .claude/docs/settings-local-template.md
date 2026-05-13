# settings.local.json 模板

创建 `.claude/settings.local.json`，用于不应提交到版本控制的个人覆盖设置。
将其加入 `.gitignore`。

## settings.local.json 示例

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Read",
      "Glob",
      "Grep"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)"
    ]
  }
}
```

## 权限模式

Claude Code 支持不同的权限模式。游戏开发推荐如下：

### 开发期间（默认）
使用 **normal mode** — Claude 会在运行大多数命令前询问。这对 production code 最安全。

### 原型制作期间
使用范围受限的 **auto-accept mode** — 对一次性代码迭代更快。
仅在 `prototypes/` 目录中工作时使用。

### 代码评审期间
使用 **read-only** 权限 — Claude 可以读取和搜索，但不能修改文件。

## 本地自定义 Hooks

你可以在 `settings.local.json` 中添加个人 hooks，用于扩展（而非覆盖）
项目 hooks。例如，构建完成时添加通知：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'echo Session ended at $(date)'",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```
