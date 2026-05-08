# 可用 Skill（Slash 命令）

68 个按阶段组织的 Slash 命令。在 Claude Code 中输入 `/` 即可访问。

## 入门与导航

| 命令 | 用途 |
|---------|---------|
| `/start` | 首次引导 — 问你在哪，然后引导到正确的工作流 |
| `/help` | 上下文感知的"下一步做什么？" — 读取当前阶段并推荐下一步 |
| `/project-stage-detect` | 完整项目审计 — 检测阶段、识别缺失、推荐下一步 |
| `/setup-engine` | 配置引擎 + 版本、检测知识缺口、填充版本感知的参考文档 |
| `/adopt` | 已有项目格式审计 — 检查现有 GDD/ADR/Story 的内部结构，产出迁移计划 |

## 游戏设计

| 命令 | 用途 |
|---------|---------|
| `/brainstorm` | 使用专业工作室方法（MDA、SDT、Bartle、verb-first）的引导式构思 |
| `/map-systems` | 将游戏概念解构为系统、映射依赖关系、排序设计优先级 |
| `/design-system` | 单系统的逐章节引导式 GDD 撰写 |
| `/quick-design` | 小变更的轻量设计规格 — 调优、微调、小补充 |
| `/review-all-gdds` | 跨所有设计文档的 GDD 一致性和游戏设计整体性评审 |
| `/propagate-design-change` | 当 GDD 被修订时，查找受影响的 ADR 并产出影响报告 |

## UX 与界面设计

| 命令 | 用途 |
|---------|---------|
| `/ux-design` | 逐章节引导式 UX 规格撰写（界面/流程、HUD、交互模式库） |
| `/ux-review` | 验证 UX 规格的 GDD 对齐、无障碍和模式合规性 |

## 架构

| 命令 | 用途 |
|---------|---------|
| `/create-architecture` | 引导式撰写主体架构文档 |
| `/architecture-decision` | 创建架构决策记录 (ADR) |
| `/architecture-review` | 验证所有 ADR 的完整性、依赖排序和 GDD 覆盖 |
| `/create-control-manifest` | 从已通过的 ADR 生成平面程序员规则单 |

## Story 与 Sprint

| 命令 | 用途 |
|---------|---------|
| `/create-epics` | 将 GDD + ADR 翻译为 Epic — 每个架构模块一个 |
| `/create-stories` | 将单个 Epic 拆分为可实现的 Story 文件 |
| `/dev-story` | 读取 Story 并实现 — 路由到正确的程序员 agent |
| `/sprint-plan` | 生成或更新 Sprint 计划 |
| `/sprint-status` | 30 行 Sprint 快照 |
| `/story-readiness` | Story 被领取前验证其实现就绪度 (READY/NEEDS WORK/BLOCKED) |
| `/story-done` | 实现后的 8 阶段完成评审 |
| `/estimate` | 含复杂度、依赖和风险分解的结构化工作量估算 |

## 评审与分析

| 命令 | 用途 |
|---------|---------|
| `/design-review` | 评审游戏设计文档的完整性和一致性 |
| `/code-review` | 文件或变更集的架构级代码评审 |
| `/balance-check` | 分析游戏数值数据、公式和配置 — 标记异常值 |
| `/asset-audit` | 按命名规范、文件大小预算、流水线合规审计资源 |
| `/content-audit` | 对比 GDD 指定的内容数量与实际实现数量 |
| `/scope-check` | 对比当前功能/Sprint 范围与原始计划，标记范围蔓延 |
| `/perf-profile` | 结构化性能分析及瓶颈识别 |
| `/tech-debt` | 扫描、追踪、优先级排序并报告技术债务 |
| `/gate-check` | 验证推进到下一开发阶段的就绪度 (PASS/CONCERNS/FAIL) |
| `/consistency-check` | 扫描所有 GDD 与实体注册表，检测跨文档不一致 |

## QA 与测试

| 命令 | 用途 |
|---------|---------|
| `/qa-plan` | 生成 Sprint 或功能的 QA 测试计划 |
| `/smoke-check` | QA 交接前运行关键路径冒烟测试门禁 |
| `/soak-test` | 生成长时间游戏的浸泡测试协议 |
| `/regression-suite` | 映射测试覆盖率到 GDD 关键路径，识别缺少回归测试的已修复 bug |
| `/test-setup` | 为项目引擎搭建测试框架和 CI/CD 流水线 |
| `/test-helpers` | 为测试套件生成引擎特定的测试辅助库 |
| `/test-evidence-review` | 测试文件和手动证据文档的质量评审 |
| `/test-flakiness` | 从 CI 运行日志中检测非确定性（flaky）测试 |
| `/skill-test` | 验证 skill 文件的结构合规性和行为正确性 |

## 制作

| 命令 | 用途 |
|---------|---------|
| `/milestone-review` | 评审里程碑进度并生成状态报告 |
| `/retrospective` | 运行结构化 Sprint 或里程碑复盘 |
| `/bug-report` | 创建结构化 bug 报告 |
| `/bug-triage` | 读取所有未关闭 bug，重新评估优先级 vs 严重程度，分配负责人和标签 |
| `/reverse-document` | 从现有实现反向生成设计或架构文档 |
| `/playtest-report` | 生成结构化可玩性测试报告或分析现有测试笔记 |

## 发布

| 命令 | 用途 |
|---------|---------|
| `/release-checklist` | 生成并验证当前构建的发布前检查清单 |
| `/launch-checklist` | 跨所有部门的完整上线就绪验证 |
| `/changelog` | 从 git commit 和 Sprint 数据自动生成 Changelog |
| `/patch-notes` | 从 git 历史生成面向玩家的补丁说明 |
| `/hotfix` | 紧急修复工作流（带审计追踪），跳过正常 Sprint 流程 |

## 创意与内容

| 命令 | 用途 |
|---------|---------|
| `/prototype` | 快速一次性原型验证机制（放宽标准、隔离 worktree） |
| `/onboard` | 为新贡献者或 agent 生成上下文入门文档 |
| `/localize` | 本地化工作流：字符串提取、校验、翻译就绪 |

## 团队协作

协调多个 agent 完成单个功能领域:

| 命令 | 协调的 Agent |
|---------|-------------|
| `/team-combat` | game-designer + gameplay-programmer + ai-programmer + technical-artist + sound-designer + qa-tester |
| `/team-narrative` | narrative-director + writer + world-builder + level-designer |
| `/team-ui` | ux-designer + ui-programmer + art-director + accessibility-specialist |
| `/team-release` | release-manager + qa-lead + devops-engineer + producer |
| `/team-polish` | performance-analyst + technical-artist + sound-designer + qa-tester |
| `/team-audio` | audio-director + sound-designer + technical-artist + gameplay-programmer |
| `/team-level` | level-designer + narrative-director + world-builder + art-director + systems-designer + qa-tester |
| `/team-live-ops` | live-ops-designer + economy-designer + community-manager + analytics-engineer |
| `/team-qa` | qa-lead + qa-tester + gameplay-programmer + producer |
