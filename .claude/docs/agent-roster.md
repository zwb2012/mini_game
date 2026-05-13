# Agent 名册

以下 agents 可供使用。每个 agent 都在 `.claude/agents/` 中有专用定义文件。
请使用最适合当前任务的 agent。当任务跨越多个领域时，协调 agent（通常是 `producer` 或领域 lead）
应委派给 specialists。

## Tier 1 -- 领导层 Agents（Opus）
| Agent | Domain | When to Use |
|-------|--------|-------------|
| `creative-director` | 高层愿景 | 重大创意决策、pillar 冲突、tone/direction |
| `technical-director` | 技术愿景 | 架构决策、技术栈选择、性能策略 |
| `producer` | 制作管理 | Sprint 规划、milestone 跟踪、风险管理、协调 |

## Tier 2 -- 部门 Lead Agents（Sonnet）
| Agent | Domain | When to Use |
|-------|--------|-------------|
| `game-designer` | 游戏设计 | 机制、系统、progression、economy、balancing |
| `lead-programmer` | 代码架构 | 系统设计、代码评审、API 设计、重构 |
| `art-director` | 视觉方向 | Style guides、art bible、asset standards、UI/UX direction |
| `audio-director` | 音频方向 | Music direction、sound palette、audio implementation strategy |
| `narrative-director` | 故事与写作 | Story arcs、world-building、character design、dialogue strategy |
| `qa-lead` | 质量保证 | Test strategy、bug triage、release readiness、regression planning |
| `release-manager` | 发布流水线 | Build management、versioning、changelogs、deployment、rollbacks |
| `localization-lead` | 国际化 | String externalization、translation pipeline、locale testing |

## Tier 3 -- Specialist Agents（Sonnet 或 Haiku）
| Agent | Domain | Model | When to Use |
|-------|--------|-------|-------------|
| `systems-designer` | 系统设计 | Sonnet | 具体机制实现、公式设计、loops |
| `level-designer` | 关卡设计 | Sonnet | Level layouts、pacing、encounter design、flow |
| `economy-designer` | 经济/平衡 | Sonnet | Resource economies、loot tables、progression curves |
| `gameplay-programmer` | Gameplay code | Sonnet | Feature implementation、gameplay systems code |
| `engine-programmer` | 引擎系统 | Sonnet | Core engine、rendering、physics、memory management |
| `ai-programmer` | AI 系统 | Sonnet | Behavior trees、pathfinding、NPC logic、state machines |
| `network-programmer` | 网络 | Sonnet | Netcode、replication、lag compensation、matchmaking |
| `tools-programmer` | 开发工具 | Sonnet | Editor extensions、pipeline tools、debug utilities |
| `ui-programmer` | UI 实现 | Sonnet | UI framework、screens、widgets、data binding |
| `technical-artist` | 技术美术 | Sonnet | Shaders、VFX、optimization、art pipeline tools |
| `sound-designer` | 声音设计 | Sonnet | SFX design docs、audio event lists、mixing notes |
| `writer` | Dialogue/lore | Sonnet | Dialogue writing、lore entries、item descriptions |
| `world-builder` | World/lore design | Sonnet | World rules、faction design、history、geography |
| `qa-tester` | 测试执行 | Haiku | Writing test cases、bug reports、test checklists |
| `performance-analyst` | 性能 | Sonnet | Profiling、optimization recs、memory analysis |
| `devops-engineer` | Build/deploy | Haiku | CI/CD、build scripts、version control workflow |
| `analytics-engineer` | Telemetry | Sonnet | Event tracking、dashboards、A/B test design |
| `ux-designer` | UX flows | Sonnet | User flows、wireframes、accessibility、input handling |
| `prototyper` | 快速原型 | Sonnet | Throwaway prototypes、mechanic testing、feasibility validation |
| `security-engineer` | 安全 | Sonnet | Anti-cheat、exploit prevention、save encryption、network security |
| `accessibility-specialist` | Accessibility | Haiku | WCAG compliance、colorblind modes、remapping、text scaling |
| `live-ops-designer` | Live operations | Sonnet | Seasons、events、battle passes、retention、live economy |
| `community-manager` | 社区 | Haiku | Patch notes、player feedback、crisis comms、community health |

## 引擎特定 Agents（使用与你的引擎匹配的一组）

### Engine Leads

| Agent | Engine | Model | When to Use |
| ---- | ---- | ---- | ---- |
| `unreal-specialist` | Unreal Engine 5 | Sonnet | Blueprint vs C++、GAS overview、UE subsystems、Unreal optimization |
| `unity-specialist` | Unity | Sonnet | MonoBehaviour vs DOTS、Addressables、URP/HDRP、Unity optimization |
| `godot-specialist` | Godot 4 | Sonnet | GDScript patterns、node/scene architecture、signals、Godot optimization |

### Unreal Engine Sub-Specialists

| Agent | Subsystem | Model | When to Use |
| ---- | ---- | ---- | ---- |
| `ue-gas-specialist` | Gameplay Ability System | Sonnet | Abilities、gameplay effects、attribute sets、tags、prediction |
| `ue-blueprint-specialist` | Blueprint Architecture | Sonnet | BP/C++ boundary、graph standards、naming、BP optimization |
| `ue-replication-specialist` | Networking/Replication | Sonnet | Property replication、RPCs、prediction、relevancy、bandwidth |
| `ue-umg-specialist` | UMG/CommonUI | Sonnet | Widget hierarchy、data binding、CommonUI input、UI performance |

### Unity Sub-Specialists

| Agent | Subsystem | Model | When to Use |
| ---- | ---- | ---- | ---- |
| `unity-dots-specialist` | DOTS/ECS | Sonnet | Entity Component System、Jobs、Burst compiler、hybrid renderer |
| `unity-shader-specialist` | Shaders/VFX | Sonnet | Shader Graph、VFX Graph、URP/HDRP customization、post-processing |
| `unity-addressables-specialist` | Asset Management | Sonnet | Addressable groups、async loading、memory、content delivery |
| `unity-ui-specialist` | UI Toolkit/UGUI | Sonnet | UI Toolkit、UXML/USS、UGUI Canvas、data binding、cross-platform input |

### Godot Sub-Specialists

| Agent | Subsystem | Model | When to Use |
| ---- | ---- | ---- | ---- |
| `godot-gdscript-specialist` | GDScript | Sonnet | Static typing、design patterns、signals、coroutines、GDScript performance |
| `godot-csharp-specialist` | C# / .NET | Sonnet | .NET patterns、[Signal] delegates、async、nullable types、type-safe node access |
| `godot-shader-specialist` | Shaders/Rendering | Sonnet | Godot shading language、visual shaders、particles、post-processing |
| `godot-gdextension-specialist` | GDExtension | Sonnet | C++/Rust bindings、native performance、custom nodes、build systems |
