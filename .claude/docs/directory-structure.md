# 目录结构

```text
/
├── AGENTS.md                    # DSH 工作区指令（DSH 从项目根读取）
├── CLAUDE.md                    # 指向 AGENTS.md 的一行指针
├── .dsh/                        # DSH 原生配置：skills、rules、hooks、delegation
├── .claude/                     # 角色定义（agents）与 docs、templates
├── src/                         # 游戏源代码（core、gameplay、ai、networking、ui、tools）
├── assets/                      # 游戏资产（art、audio、vfx、shaders、data）
├── design/                      # 游戏设计文档（gdd、narrative、levels、balance）
├── docs/                        # 技术文档（architecture、api、postmortems）
│   └── engine-reference/        # 精选的引擎 API 快照（版本固定）
├── tests/                       # 测试套件（unit、integration、performance、playtest）
├── tools/                       # 构建与流水线工具（ci、build、asset-pipeline）
├── prototypes/                  # 一次性原型（与 src/ 隔离）
└── production/                  # 制作管理（sprints、milestones、releases）
    ├── session-state/           # 临时会话状态（active.md — 已 gitignored）
    └── session-logs/            # 会话审计记录（已 gitignored）
```
