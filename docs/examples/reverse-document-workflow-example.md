# 反向文档工作流示例

## 场景
开发者已经构建了一个可运行的技能树系统，但从未编写设计文档。
代码位于 `src/gameplay/skills/`，但 `design/gdd/` 中没有 skill-system.md。

---

## 会话记录

**User:**
```
我在 src/gameplay/skills/ 里有一个可运行的技能树系统，大约 1200 行
代码。我从来没写过设计文档。我们能从实现里反推出一份吗？
```

**Game-Designer（读取代码并分析）:**
```
我已经分析了你的技能树实现。以下是我的发现：

STRUCTURE:
- 3 个技能树：Combat、Survival、Tech
- 每棵树 5 个层级（通过等级 + 前置条件解锁）
- 共 45 个技能（每棵树 15 个）
- 消耗：技能点（每级 1 点，可花费金币重置）

MECHANICS:
- 被动技能（属性加成）
- 主动技能（带冷却的能力）
- 协同加成（第 4 层级以上解锁跨树协同）

IMPLEMENTATION DETAILS:
- 数据驱动（JSON 文件位于 assets/data/skills/）
- 存档兼容（技能状态会序列化）
- UI 显示 locked/unlocked/available 状态

在我起草设计文档前，需要先确认几个问题：

1. **设计意图：** 3 棵树的结构是为了代表玩家原型
   （fighter/survivor/engineer），还是为了玩法风格的灵活性？

2. **重置成本：** 重置需要金币，这是否是为了：
   - 限制频繁重置（让 build 有承诺感）？
   - 制造金币消耗点（经济平衡）？
   - 还是应该免费（鼓励实验）？

3. **协同系统：** 跨树协同出现在第 4 层级。这是：
   - 有意设计（奖励后期混合 build）？
   - 还是涌现结果（意外形成混合 meta）？

4. **平衡理念：** 我看到有些技能明显更强（第 5 层被动
   是 +50% damage）。这是：
   - 强力幻想（后期应该感觉 OP）？
   - 还是不平衡（需要调优）？
```

**User:**
```
好问题！意图是这样的：

1. 是的，3 棵树是原型，但我想保留灵活性
2. 重置应该便宜——我想鼓励实验
3. 协同是有意的——混合 build 是一个特色
4. 对，第 5 层应该很强，但 +50% 可能太多了
```

**Game-Designer:**
```
很好，这澄清了愿景。我来起草设计文档：

[展示 design/gdd/skill-system.md 草稿]

SECTIONS:
1. Overview（3 树系统，支持混合，鼓励重置）
2. Design Pillars:
   - Archetype clarity（每棵树有清晰身份）
   - Build flexibility（不锁死，便宜重置）
   - Synergy rewards（跨树组合可行）
3. Detailed Design（树结构、解锁规则、重置）
4. Balance Framework（层级强度曲线、协同限制）
5. Edge Cases（战斗中重置？技能满级？上限？）
6. Dependencies（UI、存档系统、教程）
7. Acceptance Criteria（所有树都可行、10+ 混合 build、清晰 tooltip）
8. Open Questions:
   - 重置成本应该随等级缩放，还是保持固定？
   - 第 5 层伤害加成：调到 +30%，还是保留 +50%？

**May I write this to design/gdd/skill-system.md?**
```

**User:**
```
Yes, write it. But let's tune tier 5 to +30% and make respec cost scale.
```

**Game-Designer:**
```
✅ Written to design/gdd/skill-system.md
✅ Marked as [REVERSE-DOCUMENTED FROM IMPLEMENTATION]
✅ Added TODO: Update tier-5 passive to +30% in assets/data/skills/combat-tree.json
✅ Added TODO: Implement scaling respec cost formula

Next steps:
- Run /balance-check to validate skill tree progression curve?
- Create ADR documenting why 3 trees instead of 5?
- Update tutorial to explain hybrid synergies?
```

---

## 关键观察

1. **Agent 提出了澄清问题**——没有只是复述代码
2. **把意图与实现分开**——用户修正了“意外”的不平衡
3. **设计文档捕捉“为什么”**——不只是“代码做了什么”
4. **识别缺失内容**——代码里没有的边界情况
5. **标记后续工作**——平衡调优、ADR、教程

## 结果

设计文档现在已经存在，并且**匹配当前现实**，同时也捕捉了**预期愿景**。未来变更将引用这份文档，新团队成员也能理解决策背后的 *why*。
