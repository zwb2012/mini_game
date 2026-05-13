# Agent 协调与委派地图

## 组织层级

```
                           [Human Developer]
                                 |
                 +---------------+---------------+
                 |               |               |
         creative-director  technical-director  producer
                 |               |               |
        +--------+--------+     |        (coordinates all)
        |        |        |     |
  game-designer art-dir  narr-dir  lead-programmer  qa-lead  audio-dir
        |        |        |         |                |        |
     +--+--+     |     +--+--+  +--+--+--+--+--+   |        |
     |  |  |     |     |     |  |  |  |  |  |  |   |        |
    sys lvl eco  ta   wrt  wrld gp ep  ai net tl ui qa-t    snd
                                 |
                             +---+---+
                             |       |
                          perf-a   devops   analytics

  Additional Leads（向 producer/directors 汇报）：
    release-manager         -- Release pipeline、versioning、deployment
    localization-lead       -- i18n、string tables、translation pipeline
    prototyper              -- 快速 throwaway prototypes、concept validation
    security-engineer       -- Anti-cheat、exploits、data privacy、network security
    accessibility-specialist -- WCAG、colorblind、remapping、text scaling
    live-ops-designer       -- Seasons、events、battle passes、retention、live economy
    community-manager       -- Patch notes、player feedback、crisis comms

  Engine Specialists（使用与你的引擎匹配的 SET）：
    unreal-specialist  -- UE5 lead: Blueprint/C++、GAS overview、UE subsystems
      ue-gas-specialist         -- GAS: abilities、effects、attributes、tags、prediction
      ue-blueprint-specialist   -- Blueprint: BP/C++ boundary、graph standards、optimization
      ue-replication-specialist -- Networking: replication、RPCs、prediction、bandwidth
      ue-umg-specialist         -- UI: UMG、CommonUI、widget hierarchy、data binding

    unity-specialist   -- Unity lead: MonoBehaviour/DOTS、Addressables、URP/HDRP
      unity-dots-specialist         -- DOTS/ECS: Jobs、Burst、hybrid renderer
      unity-shader-specialist       -- Shaders: Shader Graph、VFX Graph、SRP customization
      unity-addressables-specialist -- Assets: async loading、bundles、memory、CDN
      unity-ui-specialist           -- UI: UI Toolkit、UGUI、UXML/USS、data binding

    godot-specialist   -- Godot 4 lead: GDScript、node/scene、signals、resources
      godot-gdscript-specialist    -- GDScript: static typing、patterns、signals、performance
      godot-csharp-specialist      -- C#: .NET patterns、[Signal] delegates、async、type-safe node access
      godot-shader-specialist      -- Shaders: Godot shading language、visual shaders、VFX
      godot-gdextension-specialist -- Native: C++/Rust bindings、GDExtension、build systems
```

### 图例
```
sys  = systems-designer       gp  = gameplay-programmer
lvl  = level-designer         ep  = engine-programmer
eco  = economy-designer       ai  = ai-programmer
ta   = technical-artist       net = network-programmer
wrt  = writer                 tl  = tools-programmer
wrld = world-builder          ui  = ui-programmer
snd  = sound-designer         qa-t = qa-tester
narr-dir = narrative-director perf-a = performance-analyst
art-dir = art-director
```

## 委派规则

### 谁可以委派给谁

| From | Can Delegate To |
|------|----------------|
| creative-director | game-designer, art-director, audio-director, narrative-director |
| technical-director | lead-programmer, devops-engineer, performance-analyst, technical-artist（技术决策） |
| producer | 任何 agent（仅在其领域内分配任务） |
| game-designer | systems-designer, level-designer, economy-designer |
| lead-programmer | gameplay-programmer, engine-programmer, ai-programmer, network-programmer, tools-programmer, ui-programmer |
| art-director | technical-artist, ux-designer |
| audio-director | sound-designer |
| narrative-director | writer, world-builder |
| qa-lead | qa-tester |
| release-manager | devops-engineer（release builds）, qa-lead（release testing） |
| localization-lead | writer（string review）, ui-programmer（text fitting） |
| prototyper | （独立工作，向 producer 和相关 leads 汇报发现） |
| security-engineer | network-programmer（security review）, lead-programmer（secure patterns） |
| accessibility-specialist | ux-designer（accessible patterns）, ui-programmer（implementation）, qa-tester（a11y testing） |
| [engine]-specialist | engine sub-specialists（委派子系统特定工作） |
| [engine] sub-specialists | （为所有 programmers 提供 engine subsystem patterns 和 optimization 建议） |
| live-ops-designer | economy-designer（live economy）, community-manager（event comms）, analytics-engineer（engagement metrics） |
| community-manager | （与 producer 协作获取 approval，与 release-manager 协作安排 patch note timing） |

### 升级路径

| Situation | Escalate To |
|-----------|------------|
| 两个 designers 在机制上意见不一致 | game-designer |
| Game design vs narrative conflict | creative-director |
| Game design vs technical feasibility | producer（协调），然后 creative-director + technical-director |
| Art vs audio tonal conflict | creative-director |
| Code architecture disagreement | technical-director |
| Cross-system code conflict | lead-programmer，然后 technical-director |
| Schedule conflict between departments | producer |
| Scope exceeds capacity | producer，然后 creative-director 负责 cuts |
| Quality gate disagreement | qa-lead，然后 technical-director |
| Performance budget violation | performance-analyst 标记，technical-director 决策 |

## 常见工作流模式

### 模式 1：新 Feature（完整 Pipeline）

```
1. creative-director  -- 批准 feature concept 与愿景一致
2. game-designer      -- 创建包含完整 spec 的设计文档
3. producer           -- 安排工作，识别 dependencies
4. lead-programmer    -- 设计代码架构，创建 interface sketch
5. [specialist-programmer] -- 实现 feature
6. technical-artist   -- 实现视觉效果（如需要）
7. writer             -- 创建文本内容（如需要）
8. sound-designer     -- 创建 audio event list（如需要）
9. qa-tester          -- 编写测试用例
10. qa-lead           -- 评审并批准测试覆盖
11. lead-programmer   -- Code review
12. qa-tester         -- 执行测试
13. producer          -- 将任务标记完成
```

### 模式 2：Bug Fix

```
1. qa-tester          -- 使用 /bug-report 提交 bug report
2. qa-lead            -- 分流 severity 和 priority
3. producer           -- 分配到 sprint（如果不是 S1）
4. lead-programmer    -- 识别 root cause，分配给 programmer
5. [specialist-programmer] -- 修复 bug
6. lead-programmer    -- Code review
7. qa-tester          -- 验证修复并运行 regression
8. qa-lead            -- 关闭 bug
```

### 模式 3：Balance Adjustment

```
1. analytics-engineer -- 从 data（或玩家报告）识别 imbalance
2. game-designer      -- 根据设计意图评估问题
3. economy-designer   -- 建模 adjustment
4. game-designer      -- 批准新 values
5. [data file update] -- 修改 configuration values
6. qa-tester          -- Regression test affected systems
7. analytics-engineer -- 监控 post-change metrics
```

### 模式 4：New Area/Level

```
1. narrative-director -- 定义该区域的 narrative purpose 和 beats
2. world-builder      -- 创建 lore 和 environmental context
3. level-designer     -- 设计 layout、encounters、pacing
4. game-designer      -- 评审 encounters 的 mechanical design
5. art-director       -- 定义该区域的 visual direction
6. audio-director     -- 定义该区域的 audio direction
7. [implementation by relevant programmers and artists]
8. writer             -- 创建区域特定文本内容
9. qa-tester          -- 测试完整区域
```

### 模式 5：Sprint Cycle

```
1. producer           -- 使用 /sprint-plan new 规划 sprint
2. [All agents]       -- 执行 assigned tasks
3. producer           -- 使用 /sprint-plan status 做 daily status
4. qa-lead            -- Sprint 期间持续测试
5. lead-programmer    -- Sprint 期间持续 code review
6. producer           -- 使用 post-sprint hook 做 sprint retrospective
7. producer           -- 基于经验教训规划下一个 sprint
```

### 模式 6：Milestone Checkpoint

```
1. producer           -- 运行 /milestone-review
2. creative-director  -- 评审 creative progress
3. technical-director -- 评审 technical health
4. qa-lead            -- 评审 quality metrics
5. producer           -- 协调 go/no-go discussion
6. [All directors]    -- 如需要，对 scope adjustments 达成一致
7. producer           -- 记录决策并更新 plans
```

### 模式 7：Release Pipeline

```text
1. producer             -- 宣布 release candidate，确认 milestone criteria 已满足
2. release-manager      -- 切 release branch，生成 /release-checklist
3. qa-lead              -- 运行 full regression，质量签核
4. localization-lead    -- 验证所有 strings 已翻译，text fitting 通过
5. performance-analyst  -- 确认 performance benchmarks 在 targets 内
6. devops-engineer      -- 构建 release artifacts，运行 deployment pipeline
7. release-manager      -- 生成 /changelog，标记 release，创建 release notes
8. technical-director   -- 重大 releases 的最终签核
9. release-manager      -- 部署并监控 48 小时
10. producer            -- 标记 release complete
```

### 模式 8：Concept Prototype（早期 — GDDs 之前）

```text
1. game-designer        -- 定义 hypothesis 和 success criteria
2. prototyper           -- 使用 /prototype 搭建 concept prototype
3. prototyper           -- 构建最小实现（1-3 天）
4. game-designer        -- 根据 criteria 评估 prototype
5. prototyper           -- 在 REPORT.md 中记录发现
6. creative-director    -- PROCEED / PIVOT / KILL 决策（仅 full mode）
7. game-designer        -- 如果 PROCEED，用 prototype learnings 指导 GDD 撰写
```

### 模式 8b：Vertical Slice（pre-production — GDDs 和 architecture 之后）

```text
1. game-designer        -- 对照 GDDs 确认 slice scope
2. prototyper           -- 使用 /vertical-slice 构建 production-quality 端到端 build
3. prototyper           -- 进行 internal playtest sessions（至少 1 次）
4. prototyper           -- 在 REPORT.md 中记录发现
5. creative-director    -- 是否进入 Production 的 go/no-go 决策（full mode）
6. producer             -- 如果 PROCEED，安排 Production epics/sprints
```

### 模式 9：Live Event / Season Launch

```text
1. live-ops-designer     -- 设计 event/season content、rewards、schedule
2. game-designer         -- 验证 event 的 gameplay mechanics
3. economy-designer      -- 平衡 event economy 和 reward values
4. narrative-director    -- 提供 seasonal narrative theme
5. writer                -- 创建 event descriptions 和 lore
6. producer              -- 安排 implementation work
7. [implementation by relevant programmers]
8. qa-lead               -- 端到端测试 event flow
9. community-manager     -- 起草 event announcement 和 patch notes
10. release-manager      -- 部署 event content
11. analytics-engineer   -- 监控 event participation 和 metrics
12. live-ops-designer    -- Post-event analysis 和 learnings
```

## 跨领域沟通协议

### Design Change Notification

当设计文档变更时，game-designer 必须通知：
- lead-programmer（implementation impact）
- qa-lead（需要更新 test plan）
- producer（schedule impact assessment）
- 取决于变更内容的相关 specialist agents

### Architecture Change Notification

当 ADR 创建或修改时，technical-director 必须通知：
- lead-programmer（需要 code changes）
- 所有受影响的 specialist programmers
- qa-lead（testing strategy 可能改变）
- producer（schedule impact）

### Asset Standard Change Notification

当 art bible 或 asset standards 变更时，art-director 必须通知：
- technical-artist（pipeline changes）
- 所有使用受影响 assets 的 content creators
- devops-engineer（如果 build pipeline 受影响）

## 需要避免的反模式

1. **Bypassing the hierarchy**：specialist agent 不应在未咨询的情况下，
   做出属于其 lead 的决策。
2. **Cross-domain implementation**：agent 不应在没有相关 owner 明确委派的情况下，
   修改其指定区域之外的文件。
3. **Shadow decisions**：所有决策都必须记录。没有书面记录的口头协议会导致矛盾。
4. **Monolithic tasks**：分配给 agent 的每个任务都应能在 1-3 天内完成。
   如果更大，必须先拆分。
5. **Assumption-based implementation**：如果 spec 有歧义，实现者必须询问 specifier，
   而不是猜测。错误猜测的成本高于提问。
