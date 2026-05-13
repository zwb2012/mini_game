# 事件响应：[Incident Title]

**Severity**: [S1-Critical / S2-Major / S3-Moderate / S4-Minor]
**Status**: [Active / Mitigated / Resolved / Post-Mortem Complete]
**Detected**: [Date Time UTC]
**Resolved**: [Date Time UTC or ONGOING]
**Duration**: [Total time from detection to resolution]
**Incident Commander**: [Name/Role]

---

## 影响摘要

[用 2-3 句话描述玩家经历了什么。请从玩家视角写，而不是技术视角。]

- **Players affected**: [estimated count or percentage]
- **Platforms affected**: [PC / Console / Mobile / All]
- **Regions affected**: [All / specific regions]
- **Revenue impact**: [estimated if applicable]

---

## 时间线

| Time (UTC) | Event | Action Taken |
| ---- | ---- | ---- |
| [HH:MM] | Incident detected via [monitoring/player report/etc.] | Incident commander assigned |
| [HH:MM] | Root cause identified | [Brief description of cause] |
| [HH:MM] | Mitigation deployed | [What was done] |
| [HH:MM] | Service restored / Fix confirmed | Monitoring for recurrence |
| [HH:MM] | All-clear declared | Post-mortem scheduled |

---

## 根因

### 发生了什么
[根因的技术描述。具体说明导致事件的事件链。]

### 为什么会发生
[系统性原因——为什么现有流程、测试或防护未能阻止它？这比技术原因更重要。]

### 促成因素
- [Factor 1 — 例如，“新匹配系统负载测试不足”]
- [Factor 2 — 例如，“监控告警阈值设置过高”]
- [Factor 3]

---

## 缓解与解决

### 立即行动（事件期间）
1. [止血行动]
2. [恢复服务行动]
3. [验证解决的行动]

### 后续行动（解决后）
1. [如果立即行动是临时方案，写永久修复]
2. [新增测试或监控]
3. [防止复发的流程变更]

---

## 玩家沟通

### 初始确认
*Sent: [Time] via [channel]*
> [首次公开承认问题的准确文本]

### 状态更新
*Sent: [Time] via [channel]*
> [每次后续更新文本]

### 解决通知
*Sent: [Time] via [channel]*
> [宣布修复及任何补偿的文本]

### 补偿（如适用）
- **What**: [补偿描述——例如，“500 高级货币 + 24 小时 XP 加成”]
- **Who**: [all players / affected players only / players who logged in during incident]
- **When**: [发放日期和方式]
- **Rationale**: [为什么该补偿与影响相称]

---

## 预防

### 我们正在改变什么

| Action Item | Owner | Deadline | Status |
| ---- | ---- | ---- | ---- |
| [Specific preventive measure] | [Role] | [Date] | [TODO/Done] |
| [Add monitoring for X] | [Role] | [Date] | [TODO/Done] |
| [Add test coverage for Y] | [Role] | [Date] | [TODO/Done] |
| [Update runbook for Z] | [Role] | [Date] | [TODO/Done] |

### 流程改进
- [防止类似事件的流程变更]
- [监控/告警改进]
- [测试改进]

---

## 经验教训

### 做得好的地方
- [事件响应中的积极方面——例如，“由于监控告警，检测很快”]
- [积极方面]

### 做得不好的地方
- [响应问题——例如，“花了 20 分钟才找到正确的值班人员”]
- [问题]

### 我们侥幸的地方
- [因偶然而非设计降低影响的因素——这些是需要处理的隐藏风险]

---

## 签核

- [ ] Technical Director — 根因准确，预防计划充分
- [ ] QA Lead — 测试覆盖缺口已处理
- [ ] Producer — 时间线和沟通已评审
- [ ] Community Manager — 玩家沟通已评审

---

*本文档归档在 `production/hotfixes/`，并从修复版本的 release notes 链接。*
