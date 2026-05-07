# Claude Code Game Studios -- 游戏工作室 Agent 架构（Cocos/WeChat 扩展版）

独立游戏开发通过 52 个协作式 Claude Code subagent 管理。
每个 agent 负责一个特定领域，强制执行关注点分离和质量标准。

## 语言规则（最高优先级）

**所有文档型产物、对话和输出默认使用中文。** 仅在代码、API 名称、第三方库名和必要技术术语处保留英文。

详细规则见 `.claude/rules/chinese-output.md`。

## 技术栈

- **Engine**: [CHOOSE: Cocos Creator / Godot 4 / Unity / Unreal Engine 5]
- **Language**: [CHOOSE: TypeScript / GDScript / C# / C++ / Blueprint]
- **Target Platform**: [CHOOSE: 微信小游戏 / Android / iOS / Web / PC / Console]
- **Version Control**: Git with trunk-based development
- **Build System**: [SPECIFY after choosing engine]

> **Note**: 本模板完整保留了 CCGS 的 Godot/Unity/Unreal agent，并额外提供了
> Cocos Creator 引擎 agent、微信小游戏平台 agent 和后端开发 agent。
> 使用匹配你引擎的 agent 组。

## 本模板相比 CCGS 的扩展

| 扩展 | 说明 |
|------|------|
| `cocos-specialist` | Cocos Creator 3.x + TypeScript 引擎专家 |
| `wechat-platform-specialist` | 微信小游戏 API 适配（登录/支付/广告/排行榜） |
| `backend-developer` | Express/TypeScript 后端 API 开发 |
| `templates/cocos-game-base/` | Cocos TypeScript 运行时核心 + noop 平台适配器 |
| `templates/wechat-adapter/` | 微信小游戏平台适配骨架 |
| `templates/backend-base/` | Express 后端骨架（排行榜/用户数据/配置/支付验证） |

## Project Structure

@.claude/docs/directory-structure.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md
