# 经济模型：[System Name]

*Created: [Date]*
*Owner: economy-designer*
*Status: [Draft / Balanced / Live]*

---

## 概览

[该经济覆盖哪些资源、货币和交换系统？它鼓励哪些玩家行为？]

---

## 货币

| Currency | Type | Earn Rate | Sink Rate | Cap | Notes |
| ---- | ---- | ---- | ---- | ---- | ---- |
| [Gold] | Soft | [per hour] | [per hour] | [max or none] | [Primary transaction currency] |
| [Gems] | Premium | [per day F2P] | [varies] | [max] | [Premium currency, purchasable] |
| [XP] | Progression | [per action] | [level-up cost] | [none] | [Cannot be traded] |

### 货币规则
- [Rule 1 — 例如，“软货币无上限，但通过消耗项控制通胀”]
- [Rule 2 — 例如，“高级货币不能兑换回真钱”]
- [Rule 3]

---

## 来源（Faucets）

| Source | Currency | Amount | Frequency | Conditions |
| ---- | ---- | ---- | ---- | ---- |
| [Quest completion] | Gold | [50-200] | [per quest] | [Scales with quest difficulty] |
| [Enemy drops] | Gold | [1-10] | [per kill] | [Modified by luck stat] |
| [Daily login] | Gems | [5] | [daily] | [Streak bonus: +1 per consecutive day] |
| [Achievement] | XP | [100-500] | [one-time] | [Per achievement tier] |

---

## 消耗（Drains）

| Sink | Currency | Cost | Frequency | Purpose |
| ---- | ---- | ---- | ---- | ---- |
| [Equipment purchase] | Gold | [100-5000] | [as needed] | [Power progression] |
| [Repair costs] | Gold | [10-100] | [per death] | [Death penalty, gold drain] |
| [Cosmetic shop] | Gems | [50-500] | [optional] | [Vanity, premium sink] |
| [Respec] | Gold | [1000] | [rare] | [Build experimentation tax] |

---

## 平衡目标

| Metric | Target | Rationale |
| ---- | ---- | ---- |
| Time to first meaningful purchase | [X minutes] | [Player should feel spending power early] |
| Hourly gold earn rate (mid-game) | [X gold/hr] | [Based on session length and purchase cadence] |
| Days to max level (F2P) | [X days] | [Enough to retain, not so long it frustrates] |
| Sink-to-source ratio | [0.7-0.9] | [Slight surplus keeps players feeling wealthy] |
| Premium currency F2P earn rate | [X/week] | [Enough to buy something monthly, not everything] |

---

## 进度曲线

### 等级 XP 需求
| Level | XP Required | Cumulative XP | Estimated Time |
| ---- | ---- | ---- | ---- |
| 1→2 | [100] | [100] | [10 min] |
| 5→6 | [500] | [1,500] | [2 hrs] |
| 10→11 | [1,500] | [7,500] | [8 hrs] |
| 20→21 | [5,000] | [50,000] | [40 hrs] |

*Formula*: `XP(n) = [formula, e.g., 100 * n^1.5]`

### 物品价格缩放
*Formula*: `Price(tier) = [formula, e.g., base_price * 2^(tier-1)]`

---

## 掉落表

### [Drop Source Name]
| Item | Rarity | Drop Rate | Pity Timer | Notes |
| ---- | ---- | ---- | ---- | ---- |
| [Common item] | Common | [60%] | [N/A] | [Always useful, never feels bad] |
| [Uncommon item] | Uncommon | [25%] | [N/A] | [Noticeable upgrade] |
| [Rare item] | Rare | [12%] | [10 drops] | [Exciting, build-defining] |
| [Legendary item] | Legendary | [3%] | [30 drops] | [Game-changing, celebration moment] |

### 保底系统
[描述保底系统如何工作，以防止极端坏运气连败。]

---

## 经济健康指标

| Metric | Healthy Range | Warning Threshold | Action if Breached |
| ---- | ---- | ---- | ---- |
| Average player gold | [X-Y at level Z] | [>Y or <X] | [Adjust faucets/sinks] |
| Gold Gini coefficient | [<0.4] | [>0.5] | [Wealth too concentrated] |
| % players hitting currency cap | [<5%] | [>10%] | [Raise cap or add sinks] |
| Premium conversion rate | [2-5%] | [<1% or >10%] | [Rebalance F2P earn rate] |
| Average time between purchases | [X minutes] | [>Y minutes] | [Nothing worth buying] |

---

## 伦理护栏

- [无 pay-to-win：高级货币不能购买玩法强度优势]
- [所有随机掉落都有保底：X 次尝试内保证结果]
- [向玩家透明显示掉率]
- [未成年人账户消费限制]
- [核心物品不使用人为稀缺压力（FOMO 计时器）]

---

## 模拟结果

[如有经济模拟结果，在此包含：玩家财富随时间分布、消耗项有效性、通胀率等。]

---

## 依赖

- Depends on: [combat balance, quest design, crafting system]
- Affects: [difficulty curve, player retention, monetization]
- Must coordinate with: `game-designer`, `live-ops-designer`, `analytics-engineer`
