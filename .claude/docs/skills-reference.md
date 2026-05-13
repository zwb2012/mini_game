# 可用 Skills（Slash Commands）

按阶段组织的 73 个 slash commands。在 Claude Code 中输入 `/` 即可访问它们。

## 入门与导航

| Command | Purpose |
|---------|---------|
| `/start` | 首次入门 — 询问你当前所处位置，然后引导到正确工作流 |
| `/help` | 上下文感知的“我下一步该做什么？” — 读取当前阶段并显示必要下一步 |
| `/project-stage-detect` | 完整项目审计 — 检测阶段、识别存在性缺口、推荐下一步 |
| `/setup-engine` | 配置引擎 + 版本、检测知识缺口、填充版本感知参考文档 |
| `/adopt` | Brownfield 格式审计 — 检查现有 GDDs/ADRs/stories 的内部结构，产出迁移计划 |

## 游戏设计

| Command | Purpose |
|---------|---------|
| `/brainstorm` | 使用专业工作室方法进行引导式构思（MDA、SDT、Bartle、verb-first） |
| `/map-systems` | 将游戏概念拆解为系统、映射依赖、确定设计顺序优先级 |
| `/design-system` | 为单个游戏系统进行逐章节引导式 GDD 撰写 |
| `/quick-design` | 小变更的轻量设计规格 — 调校、微调、小型新增 |
| `/review-all-gdds` | 跨所有设计文档的跨 GDD 一致性与游戏设计整体性评审 |
| `/propagate-design-change` | GDD 修订后，查找受影响的 ADRs 并产出影响报告 |

## 美术与资产

| Command | Purpose |
|---------|---------|
| `/art-bible` | 逐章节引导式 Art Bible 撰写 — 在资产生产开始前创建视觉身份规格 |
| `/asset-spec` | 从 GDDs、level docs 或 character profiles 生成逐资产视觉规格和 AI 生成 prompts |
| `/asset-audit` | 审计资产的命名约定、文件大小预算和流水线合规性 |

## UX 与界面设计

| Command | Purpose |
|---------|---------|
| `/ux-design` | 逐章节引导式 UX spec 撰写（screen/flow、HUD 或 pattern library） |
| `/ux-review` | 验证 UX specs 的 GDD 对齐、accessibility 和 pattern 合规性 |

## 架构

| Command | Purpose |
|---------|---------|
| `/create-architecture` | 引导撰写游戏的 master architecture document |
| `/architecture-decision` | 创建 Architecture Decision Record（ADR） |
| `/architecture-review` | 验证所有 ADRs 的完整性、依赖排序和 GDD 覆盖 |
| `/create-control-manifest` | 从 accepted ADRs 生成扁平化 programmer rules sheet |

## Stories 与 Sprints

| Command | Purpose |
|---------|---------|
| `/create-epics` | 将 GDDs + ADRs 转换为 epics — 每个 architectural module 一个 |
| `/create-stories` | 将单个 epic 拆分为可实现的 story files |
| `/dev-story` | 读取 story 并实现 — 路由到正确的 programmer agent |
| `/sprint-plan` | 生成或更新 sprint plan；初始化 sprint-status.yaml |
| `/sprint-status` | 快速 30 行 sprint snapshot（读取 sprint-status.yaml） |
| `/story-readiness` | 在领取前验证 story 是否已准备好实现（READY/NEEDS WORK/BLOCKED） |
| `/story-done` | 实现后的 8 阶段完成评审；更新 story file，显示下一个 story |
| `/estimate` | 结构化工作量估算，包含复杂度、依赖和风险拆解 |

## 评审与分析

| Command | Purpose |
|---------|---------|
| `/design-review` | 评审游戏设计文档的完整性与一致性 |
| `/code-review` | 对文件或 changeset 进行架构代码评审 |
| `/balance-check` | 分析游戏平衡 data、formulas 和 config — 标记异常值 |
| `/content-audit` | 对照已实现内容审计 GDD 指定内容数量 |
| `/scope-check` | 对照原计划分析 feature 或 sprint scope，标记 scope creep |
| `/perf-profile` | 结构化性能 profiling 与瓶颈识别 |
| `/tech-debt` | 扫描、跟踪、优先级排序并报告 technical debt |
| `/gate-check` | 验证阶段推进准备度（PASS/CONCERNS/FAIL） |
| `/consistency-check` | 根据 entity registry 扫描所有 GDDs，检测跨文档不一致（stats、names、相互矛盾的 rules） |
| `/security-audit` | 审计游戏安全漏洞：save tampering、cheat vectors、network exploits、data exposure 和 input validation gaps |

## QA 与测试

| Command | Purpose |
|---------|---------|
| `/qa-plan` | 为 sprint 或 feature 生成 QA test plan |
| `/smoke-check` | 在 QA hand-off 前运行 critical path smoke test gate |
| `/soak-test` | 为长时间游玩会话生成 soak test protocol |
| `/regression-suite` | 将 test coverage 映射到 GDD critical paths，识别已修复 bug 中缺失 regression tests 的情况 |
| `/test-setup` | 为项目引擎搭建 test framework 与 CI/CD pipeline |
| `/test-helpers` | 为 test suite 生成引擎特定 test helper libraries |
| `/test-evidence-review` | 对 test files 和 manual evidence documents 进行质量评审 |
| `/test-flakiness` | 从 CI run logs 检测非确定性（flaky）tests |
| `/skill-test` | 验证 skill files 的结构合规性与行为正确性 |
| `/skill-improve` | 使用 test-fix-retest loop 改进 skill — 诊断、提出修复、重写、验证 |

## 制作

| Command | Purpose |
|---------|---------|
| `/milestone-review` | 评审 milestone 进度并生成状态报告 |
| `/retrospective` | 运行结构化 sprint 或 milestone retrospective |
| `/bug-report` | 创建结构化 bug report |
| `/bug-triage` | 读取所有 open bugs，重新评估 priority vs. severity，分配 owner 和 label |
| `/reverse-document` | 从现有实现生成 design 或 architecture docs |
| `/playtest-report` | 生成结构化 playtest report 或分析现有 playtest notes |

## 发布

| Command | Purpose |
|---------|---------|
| `/release-checklist` | 为当前 build 生成并验证 pre-release checklist |
| `/launch-checklist` | 跨所有部门进行完整 launch readiness validation |
| `/changelog` | 从 git commits 和 sprint data 自动生成 changelog |
| `/patch-notes` | 从 git history 和内部 data 生成面向玩家的 patch notes |
| `/hotfix` | 带 audit trail 的紧急修复工作流，绕过正常 sprint process |
| `/day-one-patch` | 为 gold master 后、公开发布前或发布时发现的已知问题准备聚焦的 day-one patch |

## 创意与内容

| Command | Purpose |
|---------|---------|
| `/prototype` | 概念原型 — brainstorm 后立即制作 throwaway build，用于验证核心想法（Phase 1） |
| `/vertical-slice` | Pre-Production 验证 — 在投入 Production 前构建 production-quality 端到端 build（Phase 4） |
| `/onboard` | 为新 contributor 或 agent 生成上下文化 onboarding document |
| `/localize` | 本地化工作流：string extraction、validation、translation readiness |

## Team 编排

在单个 feature area 上协调多个 agents：

| Command | Coordinates |
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
