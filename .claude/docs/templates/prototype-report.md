# 概念原型报告：[Concept Name]

> **Date**: [YYYY-MM-DD]
> **Prototype Path**: [HTML / Engine / Paper]
> **Concept File**: design/gdd/game-concept.md (if exists)

---

## 假设

[本原型要验证的可证伪假设：
“如果玩家 [does X]，他们会感到 [Y] —— 证据是 [measurable signal Z]。”]

---

## 已测试的最高风险假设

[概念中被识别为最大风险的内容是什么，以及它是否被验证成立。]

---

## 方法

[构建了什么、花了多长时间、哪些捷径是有意采用的。]

**Path chosen:** [HTML / Engine / Paper]
**Reason for path:** [为什么这一路径适合该假设]

**Shortcuts taken (intentional):**
- [例如，硬编码数值、占位美术、无菜单等]

---

## 结果

[实际发生了什么——具体观察，而不是观点。尽可能直接引用试玩者的话。]

---

## 指标

| Metric | Value |
|--------|-------|
| Path used | [HTML / Engine / Paper] |
| Iterations to playable | [N — Engine path only; N/A otherwise] |
| Prototype duration | [例如，4 hours] |
| Playtesters | [N internal / N external] |
| Feel assessment | [具体描述——“200ms 时响应感觉迟滞”，不要写“感觉不好”] |
| Hypothesis verdict | [CONFIRMED / PARTIALLY CONFIRMED / REFUTED] |

---

## 建议：[PROCEED / PIVOT / KILL]

[用一段话结合上方结果中的证据解释该建议。]

---

## 如果继续推进

[原型揭示了哪些应直接用于 GDD 编写的内容：]

- **Core tuning values discovered:** [例如，“3.5 单位的跳跃高度手感最好”]
- **Assumptions confirmed:** [概念文档中哪些假设被证明为真]
- **Assumptions disproved:** [概念文档中哪些假设被证明为错]
- **Emergent mechanics:** [测试中出现、值得正式化的行为]

> Note: 如果使用了 HTML 路径且手感仍不确定，请考虑先做一个专门验证手感的引擎原型，再承诺进入 GDD。

**Next steps:**
1. `/design-review design/gdd/game-concept.md`
2. `/gate-check`
3. `/map-systems`
4. `/design-system [mechanic]`（将经验用于 Tuning Knobs 和 Formulas 章节）

---

## 如果转向

[结果暗示的替代方向——哪些地方几乎正确，以及要调整什么。具体说明要改什么，而不仅仅是“需要改变”。]

**Pivot direction:** [要尝试的不同方向]
**What to keep:** [有效且应保留的内容]
**Next step:** `/prototype [revised-concept]`

---

## 如果终止

[为什么这个概念行不通——是什么具体信号导致该结论。本报告即为交付物；该概念无需进一步行动。]

**Next step:** `/brainstorm [new-direction]`

---

## 经验教训

- **真正构建之后，哪些假设被打破？**
  [...]

- **有哪些在头脑风暴中没有显现的意外发现？**
  [...]

- **下次我们会用什么不同方式测试？**
  [...]

---

> *Prototype code location: `prototypes/[concept-name]-concept/`*
> *此代码是一次性的。绝不要重构进生产代码。*
