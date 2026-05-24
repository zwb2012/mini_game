# Enemy AI — Review Log

## Review — 2026-05-22 — Verdict: APPROVED (after revision)
Scope signal: L
Specialists: 无（lean 模式——单会话分析，跳过 specialist agent 阶段）
Blocking items: 4 (已全部修订) | Recommended: 5 (已全部修订)
Summary: 首次审查发现 4 个阻塞项：(1) fire_single() 接口与 shooting-projectile.md 不匹配——敌人 AI 引用的 API 在上游 GDD 中不存在；(2) IDLE→STUNNED 恢复路径在状态机中缺失；(3) AC2 的射击协调机制在 Detailed Rules 中无定义；(4) state_changed 信号在 MVP 阶段无消费者。4 个阻塞项 + 5 个建议项均在同一会话中修订完成。用户拍板了 4 个设计决策：IDLE→STUNNED 回 COMBAT、射击协调用随机错开、友军伤害子弹关/爆炸开、掩体权重保持约束。修订后 GDD 达到 APPROVED 标准。
Prior verdict resolved: 不适用——首次审查
