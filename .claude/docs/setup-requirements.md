# 系统要求

## 必需
- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)

## 推荐
- [jq](https://jqlang.github.io/jq/) — hook 中 JSON 校验使用
- Python 3 — JSON 校验和 `ccjson` 命令（一些 hook 使用）

所有 hook 在可选工具缺失时会优雅降级——不会报错，只是少一层校验。

## 引擎要求

根据你选择的引擎:
- **Cocos Creator**: Cocos Creator 3.x + Node.js / TypeScript
- **Godot 4**: 从 [godotengine.org](https://godotengine.org/) 下载
- **Unity**: Unity Hub + Unity 编辑器（版本匹配 `.claude/docs/technical-preferences.md`）
- **Unreal Engine 5**: Epic Games Launcher + UE 5.x

## 快速验证

```bash
# 检查核心工具
git --version
claude --version

# 检查可选工具
jq --version 2>/dev/null || echo "jq 未安装（hook 会跳过 JSON 校验）"
python3 --version 2>/dev/null || echo "Python 3 未安装（hook 会回退）"
```
