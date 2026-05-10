# 目录结构

```text
/
├── CLAUDE.md                    # 主配置文件
├── .claude/                     # Agent 定义、Skill、Hook、Rule、文档
├── src/                         # 游戏源码（core、gameplay、ai、networking、ui、tools）
├── assets/                      # 游戏资源（美术、音频、VFX、Shader、数据）
├── server/                      # 服务端代码（Express + TypeScript API）
│   └── src/routes/              # 排行榜、用户数据、配置下发、支付验证路由
├── design/                      # 游戏设计文档（GDD、叙事、关卡、数值）
├── docs/                        # 技术文档（架构、API、复盘）
│   └── engine-reference/        # 精选引擎 API 快照（锁定版本）
├── tests/                       # 测试套件（单元、集成、性能、可玩性测试）
├── tools/                       # 构建和流水线工具（CI、构建、资源流水线）
├── prototypes/                  # 一次性原型（与 src/ 隔离）
├── templates/                   # 代码模板（Cocos 基座、微信适配器、后端骨架）
└── production/                  # 制作管理（Sprint、里程碑、发布）
    ├── session-state/           # 临时会话状态（active.md — gitignored）
    └── session-logs/            # 会话审计记录（gitignored）
```
