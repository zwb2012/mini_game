# 示例会话：范围危机 - 战略决策

**背景：** 独立开发者，项目第 8 周（第 2 个月），接近 Alpha milestone。

**危机：**
- Alpha milestone 还有 2 周
- Crafting system（Pillar 2）尚未实现
- Lead programmer 说完整 crafting 需要 3 周
- Alpha 有 investor demo——必须展示所有 pillars

**会话时长：** 约 25 分钟
**轮次：** 8
**结果：** 做出战略范围决策，并用 ADR 记录

---

## Turn 1: User 将问题升级给 Creative Director

**User:**
> We have a problem. Alpha is in 2 weeks. The crafting system (Pillar 2 "Emergent Discovery") isn't implemented yet. Lead programmer says it'll take 3 weeks to implement fully. But the investor demo is at Alpha and they need to see both pillars (Combat + Crafting). What should I do?

## Turn 2: Creative Director 收集完整上下文

**Agent（creative-director）:**
> 这是典型的 pillar vs. schedule 冲突——正是我应该帮助解决的问题。在推荐选项前，我先收集完整上下文。
>
> 首先，我会 review 相关文档：
> - `production/milestones/alpha.md` (milestone definition)
> - `design/pillars.md` (what's non-negotiable)
> - `design/gdd/crafting-system.md` (what was designed)
> - `production/sprints/sprint-current.md` (current work)
>
> [Reads documents]
>
> **Context Understood:**
> - Pillar 2: "Emergent Discovery Through Experimentation"（crafting 是主要表达）
> - Alpha success criteria: "All pillars demonstrated in playable form"
> - Investor demo purpose: Validate vision and secure next funding round
> - Current crafting design: Tag-based deduction system with 12 tags, ~50 recipes, progressive hint unlocking
>
> **Clarifying Questions:**
> 1. Alpha 日期是 **hard**（investor 不会改期）还是 **soft**（可以请求多 1 周）？
> 2. 仍能展示 Pillar 2 的 **minimum crafting** 是什么？（一个配方？十个配方？完整 tag system？）
> 3. 如果 Alpha 完全砍掉 crafting，**会破坏什么**？（游戏是否仍说得通？）
> 4. 这个 investor 关系有多 **critical**？（锦上添花 funding vs. 项目生死攸关？）
> 5. **team status** 如何？（已经被 crunch 榨干？还是状态好、可以冲刺？）

## Turn 3: User 提供决策上下文

**User:**
> 1. Hard date - investor flying in specifically for demo, can't reschedule
> 2. I think minimum is: discovery mechanic working (tag system) + 10 recipes. Doesn't need polish.
> 3. Without crafting, Alpha only shows combat. That's 50% of the vision - investor might think it's just another combat game
> 4. Make-or-break. This investor is our only lead. No funding = project dies.
> 5. Just me solo, I'm not burned out yet.

## Turn 4: Creative Director 框定决策

**Agent:**
> 谢谢。现在我明白真正的利害关系了。让我正确地框定这个决策：
>
> **The Core Question:**
> 我们是交付完整 crafting 但 Alpha 延期，交付简化 crafting 并按时 Alpha，还是砍掉 crafting 并冒着 investor 看不到完整愿景的风险？
>
> **What's Really at Stake:**
> - **Vision Integrity**：Investor 是否能看到 Pillar 2？
> - **Schedule Trust**：我们是否兑现 Alpha 日期承诺？
> - **Project Survival**：没有 funding = 没有游戏
> - **Quality Standards**：对这次 demo 来说，“rough but working” 是否可接受？
>
> **Decision Criteria（按本场景优先级）：**
> 1. **Investor Confidence**（最高——项目生存依赖它）
> 2. **Pillar Representation**（高——他们需要看到完整愿景）
> 3. **Schedule Integrity**（中——重要，但低于 funding）
> 4. **Polish Quality**（最低——vertical slice 可以粗糙）
>
> 现在我提出三个战略选项……

## Turn 5: Creative Director 提出选项与分析

**Agent:**
> **Option A: Implement Full Crafting System (3 weeks, slip Alpha by 1 week)**
>
> **Execution:**
> - 实现完整 tag-based system 和全部 50 个 recipes
> - 完整 UI polish，GDD 中所有功能
> - 错过 Alpha 日期，重排 investor demo（+1 周）
>
> **Pros:**
> - ✅ Pillar 2 以 production quality 完整呈现
> - ✅ 无设计妥协
> - ✅ 第一印象更 polished
>
> **Cons:**
> - ❌ 打破 investor 承诺（他们是按原日期飞来）
> - ❌ 传递 schedule management 问题信号（“如果 Alpha 都延期，release 会不会也延期？”）
> - ❌ 可能比粗糙 demo 更伤害 investor trust
>
> **Risk: CRITICAL**
> - Investor 可能无法改期（行程忙、还有其他机会）
> - 即使能改期，延期也会伤害可信度
> - 在 hard date 约束下不太可能成功
>
> **Verdict: NOT RECOMMENDED** - 日期是 hard 且不可协商
>
> ---
>
> **Option B: Simplify Crafting to Core Pillar (1.5 weeks, make Alpha)**
>
> **Execution:**
> - 只实现 core tag discovery mechanic
> - 10 个 recipes 而不是 50 个（足够展示系统）
> - 基础 UI（功能性，不 polished）
> - 无 progressive hint unlock（demo 清晰度需要，Skill 0 即可见所有 tags）
> - 无 failed-attempt feedback system（只做 success/fail）
>
> **Scope: "Vertical Slice of Pillar 2"**
> - Players CAN discover recipes by combining tagged ingredients
> - Players CAN learn tag patterns and deduce new recipes
> - Pillar 2 的 SOUL 存在，只是不 polished
>
> **Pros:**
> - ✅ 达成 Alpha deadline（保持 schedule integrity）
> - ✅ Pillar 2 得到展示（investor 看到完整愿景）
> - ✅ 核心机制可玩、可证明
> - ✅ 可用 “Alpha → Beta improvement” 作为叙事（“这里是粗糙版，这里是 polished 方向”）
>
> **Cons:**
> - ⚠️ 第一印象是 “rough”（但 vertical slices 预期就是 rough）
> - ⚠️ Investor 可能觉得 “this feels small”（缓解：展示 post-Alpha expansion roadmap）
>
> **Risk: MEDIUM**
> - Investor 可能无法从 10 个 recipes 中 “get” 到 pillar（缓解：用良好的 demo script 解释愿景）
> - 可能感觉不完整（缓解：框定为 “vertical slice proving the concept”）
>
> **Verdict: RECOMMENDED** - 平衡所有约束
>
> ---
>
> **Option C: Cut Crafting from Alpha, Focus on Combat Polish (0 weeks, make Alpha)**
>
> **Execution:**
> - Alpha 只交付完全 polished 的 Pillar 1（Combat）
> - 用额外 2 周超 polish combat、加内容、做亮点
> - 把 crafting 作为 “design doc + concept art” 展示（不可玩）
>
> **Pros:**
> - ✅ 零压力赶上 deadline
> - ✅ 现有内容 AAA-polished
> - ✅ 没有 “half-baked” 感知风险
>
> **Cons:**
> - ❌ Pillar 2 未展示（50% 愿景缺失）
> - ❌ Investor 看到 “another combat game”——差异化不足
> - ❌ 为 “potential” 融资比为 “proven concept” 更难
> - ❌ 如果 combat 单独没有打动他们，我们没有后备亮点
>
> **Risk: HIGH**
> - Investor 看不到游戏特别之处
> - 他们可能会想 “Combat is fine, but where's the hook?”
> - 竞品也有 combat——我们必须展示 differentiator
>
> **Verdict: NOT RECOMMENDED** - 对 make-or-break demo 来说风险太高
>
> ---
>
> ## My Recommendation: Option B (Simplified Crafting Core)
>
> **Reasoning:**
> 1. **Investor Confidence**：按承诺日期交付显示可靠性
> 2. **Pillar Visibility**：rough but working > polished but missing。Investors 投的是 VISION，不是 polish。
> 3. **Demo Narrative**：“这是 Alpha vs. Beta progression” 很有说服力——展示轨迹
> 4. **Risk Mitigation**：如果 crafting 没打动，combat 仍然稳。如果砍掉 crafting（Option C）而 combat 单独没打动，我们就什么都没有
> 5. **Historical Precedent**：Hades、Dead Cells、Slay the Spire 都展示过粗糙 Early Access verticals，investors 喜欢的是 SYSTEMS 而不是 polish
>
> **What Option B Sacrifices:**
> - Polish（vertical slice 可接受）
> - Feature completeness（50 recipes → 10）
> - Progressive unlocks（延后到 post-Alpha）
>
> **What Option B Protects:**
> - Schedule trust
> - Pillar representation
> - Vision clarity
> - Project survival（secured funding）
>
> **Implementation Plan if you choose Option B:**
> 1. 我会创建 ADR 记录这个 scope decision
> 2. 我会更新 `design/gdd/crafting-system.md`，加入 “Alpha Scope” markers
> 3. 我会向 gameplay-programmer brief 简化实现
> 4. 我会为你创建 demo script：如何 PRESENT 10-recipe system，以展示 50-recipe vision
>
> **But this is your call.** 你比我更了解这个 investor。如果你认为他们更重视 polish 而非 pillar representation，Option C 可能正确。如果你认为他们能接受 1 周延期，Option A 在创意上最安全。
>
> 你的决定是什么？

## Turn 6: User 做出决定

**User:**
> Option B. The investor is technical and will appreciate the systems thinking even if it's rough. Let's simplify the crafting scope to make Alpha. Can you create the ADR and update the GDD?

## Turn 7: Creative Director 记录决策

**Agent:**
> 很好的决定。我会详尽记录，这样未来的你能理解为什么做出这个选择。
>
> **Creating:**
> 1. ADR-007: Alpha Crafting Scope Reduction
> 2. Updated design/gdd/crafting-system.md with Alpha/Beta scope markers
> 3. Updated production/milestones/alpha.md success criteria
> 4. Demo script guidance for investor presentation
>
> [Creates documents]
>
> **ADR Summary:**
> ```markdown
> ## Decision
> Simplify crafting system to core tag discovery mechanic (10 recipes)
> for Alpha milestone. Defer full implementation (50 recipes + progressive
> unlocks) to post-Alpha.
>
> ## Context
> - Alpha in 2 weeks (hard date, investor demo)
> - Full crafting requires 3 weeks
> - Investor demo is make-or-break for funding
>
> ## Consequences
> Positive:
> - Makes Alpha deadline, preserves investor trust
> - Both pillars demonstrated (rough but playable)
> - Can show Alpha→Beta improvement narrative
>
> Negative:
> - First impression is "rough"
> - Limited recipe variety
> - Missing progressive unlock system
>
> ## Validation Criteria
> We'll know this was the right choice if:
> - Investor demo successfully shows both pillars
> - Funding secured for next development phase
> - Post-Alpha sprint can implement full system without rework
> ```
>
> **Updated GDD Markers:**
> ```markdown
> ## Detailed Rules
>
> ### Core Loop (**ALPHA SCOPE**)
> [Core mechanic description]
>
> ### Progressive Unlocks (**POST-ALPHA**)
> [Skill-based hint system - deferred]
>
> ### Recipe Catalog
> - Alpha: 10 recipes (demonstrates tag variety)
> - Beta: 50 recipes (full content)
> ```
>
> **Demo Script Guidance:**
> ```markdown
> ## Presenting Crafting to Investor (10-recipe Alpha)
>
> **Frame it as proof-of-concept:**
> "This is a vertical slice of the crafting pillar. You'll see 10 recipes
> here, but the SYSTEM supports unlimited recipes through tag combinations.
> Watch how players deduce patterns..."
>
> **Show, don't tell:**
> - Live demo: Discover 2 recipes on the fly
> - Explain: "Notice Fire+Water made Steam Potion. Now the player knows
>   Fire+Water is valid. They can deduce that Fire+Earth might work..."
> - Connect to pillar: "This is Emergent Discovery - the game teaches rules,
>   players become scientists."
>
> **Roadmap slide:**
> "Alpha: 10 recipes (proof of concept)
>  Beta: 50 recipes (content expansion)
>  Release: 100+ recipes (includes community-designed recipes)"
>
> **Emphasize systems:**
> "We're not making a content game, we're making a systems game. The tag
> system can generate endless combinations. We're building a platform for
> discovery, not a recipe database."
> ```
>
> May I proceed to write these documents?

## Turn 8: User 批准，Agent 完成

**User:**
> Yes, create all those documents and also notify the gameplay-programmer about the scope change.

**Agent:**
> ✅ Complete! Created/Updated:
> - `docs/architecture/adr-007-alpha-crafting-scope.md`
> - `design/gdd/crafting-system.md` (added Alpha/Beta scope markers)
> - `production/milestones/alpha.md` (updated success criteria)
> - `production/demo-script-investor-alpha.md` (new file with presentation guide)
>
> **Notifications Sent:**
>
> To `gameplay-programmer`:
> > "Crafting scope simplified for Alpha: Core tag mechanic + 10 recipes only.
> > Progressive unlocks and full recipe set deferred to post-Alpha. Updated
> > GDD has implementation guidance. Estimated 1.5 weeks to implement Alpha scope."
>
> To `producer`:
> > "Strategic decision made: Simplified crafting to make Alpha deadline.
> > ADR-007 documents rationale. Sprint plan needs updating to reflect new scope."
>
> **Next Steps:**
> 1. Gameplay-programmer can start implementing simplified crafting
> 2. You can practice demo script before investor meeting
> 3. Producer will update sprint plan with new task breakdown
>
> **Validation:**
> We'll know this decision was correct when:
> - Alpha ships on time with both pillars playable
> - Investor demo successfully communicates the vision
> - Funding secured for continued development
>
> 祝 demo 顺利！对这个受众而言，这是正确取舍——vision over polish。

---

## 会话总结

**做得好的地方：**
- Creative director 在提出方案前先读取上下文文档
- 提出 5 个澄清问题来理解约束
- 正确框定决策（利害关系、评估标准）
- 提出 3 个不同选项，并诚实列出 pros/cons
- 给出明确推荐和理由，但把决定权留给 user
- 用 ADR 详尽记录决策，并更新所有受影响文档
- 提供 demo script，帮助 user 正向呈现决策

**关键协作时刻：**
- Turn 2：Agent 在跳到方案前收集完整上下文
- Turn 3：User 提供决策标准优先级（funding > schedule > polish）
- Turn 5：Agent 提出 3 个选项、给出推荐，但明确说 “this is your call”
- Turn 6：User 做出战略决策
- Turn 7：Agent 提供 demo script 支持 user presentation
- Turn 8：Agent 将决策级联给受影响角色

**战略决策质量：**
- User 做出最终决定
- Agent 用 game dev theory 和 precedent 提供专家分析
- Trade-offs 明确且诚实
- 决策被记录以供未来参考
- 定义了 success criteria 用于验证

**创建/更新的文件：**
- ADR-007（decision record）
- Updated crafting GDD with scope markers
- Updated Alpha milestone definition
- Demo script for investor presentation

**Context Usage:** 约 30%
**User Satisfaction:** 高——在信息充分的情况下做出有信心的决策
