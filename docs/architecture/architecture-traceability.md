# Architecture Traceability Index — 数字连线 (Number Link)

> **Last Updated**: 2026-05-11
> **Engine**: Cocos Creator 3.8.8
> **ADRs Covered**: ADR-001~006
> **Source Review**: docs/architecture/architecture-review-2026-05-11.md

---

## Coverage Summary

| Status | Count | % |
|--------|-------|---|
| ✅ Covered | 20 | 54% |
| ⚠️ Partial | 11 | 30% |
| ❌ Gaps | 6 | 16% |
| **Total** | **37** | 100% |

---

## Full Traceability Matrix

| TR-ID | GDD | Requirement | ADR | Status |
|-------|-----|-------------|-----|--------|
| TR-LDS-001 | level-data-schema | LevelData JSON format | ADR-006 | ✅ |
| TR-LDS-002 | level-data-schema | Single level data structure | ADR-006 | ✅ |
| TR-LDS-003 | level-data-schema | Data validation rules | ADR-006 | ✅ |
| TR-GSM-001 | game-state-machine | 4 states | ADR-001 | ✅ |
| TR-GSM-002 | game-state-machine | 8 transitions | ADR-001 | ✅ |
| TR-GSM-003 | game-state-machine | onEnter/onExit callbacks | ADR-001 | ✅ |
| TR-GSM-004 | game-state-machine | Illegal ignore + WeChat PAUSE | ADR-001 | ✅ |
| TR-IM-001 | input-manager | Touch → grid coordinates | ADR-005 | ✅ |
| TR-IM-002 | input-manager | 4px threshold + multi-touch + bounds | ADR-005 | ✅ |
| TR-IM-003 | input-manager | ≤50ms latency, Playing only | ADR-005 | ✅ |
| TR-SM-001 | scene-manager | MenuScene + GameScene + preload | ADR-001 (state-driven) | ⚠️ |
| TR-SM-002 | scene-manager | Scene params levelId → engine | ADR-001 (indirect) | ⚠️ |
| TR-LS-001 | local-storage | nl_ prefix namespace | ADR-004 | ✅ |
| TR-LS-002 | local-storage | Sync write + 500ms debounce | ADR-004 | ✅ |
| TR-LS-003 | local-storage | wx.setStorage primary + localStorage fallback | ADR-004 | ✅ |
| TR-GCE-001 | grid-connection-engine | Cell[][] init + nodes + blocked | ADR-002 | ✅ |
| TR-GCE-002 | grid-connection-engine | Path tracing + fill + currentNumber | ADR-002 | ✅ |
| TR-GCE-003 | grid-connection-engine | Bresenham interpolation | ADR-002 | ✅ |
| TR-GCE-004 | grid-connection-engine | Path backtrack = undo | ADR-002 | ✅ |
| TR-GCE-005 | grid-connection-engine | All filled → LEVEL_COMPLETE | ADR-002 | ✅ |
| TR-GCE-006 | grid-connection-engine | undo() + canUndo() | ADR-002 | ✅ |
| TR-GCE-007 | grid-connection-engine | 3 internal states | ADR-002 | ✅ |
| TR-SS-001 | step-scoring | Step tracking +-1 | ADR-003 (Push/Pull) | ⚠️ |
| TR-SS-002 | step-scoring | Star ratio formula, configurable | ADR-003 (Pull result) | ⚠️ |
| TR-SS-003 | step-scoring | Minimum 1 star | — | ⚠️ |
| TR-HS-001 | hint-system | Daily 3 free hints | — | ❌ |
| TR-HS-002 | hint-system | Simplified BFS | ADR-002 (render) + ADR-003 (Pull) | ⚠️ |
| TR-UI-001 | level-select-ui | 3-column grid + 3 states | — | ❌ |
| TR-UI-002 | level-select-ui | 44x44 touch + scroll | — | ❌ |
| TR-UI-003 | in-game-hud | Step counter + undo + pause | ADR-003 + ADR-002 + ADR-001 | ⚠️ |
| TR-UI-004 | in-game-hud | Undo only when canUndo | ADR-002 (canUndo) | ⚠️ |
| TR-UI-005 | level-complete-overlay | Stars + steps + 3 buttons | ADR-001 + ADR-003 | ⚠️ |
| TR-UI-006 | level-complete-overlay | Last level hide next, REPLAY always | ADR-001 | ⚠️ |
| TR-AM-001 | audio-manager | TICK/LEVEL_COMPLETE preload | ADR-004 (storage) | ⚠️ |
| TR-AM-002 | audio-manager | play/setMuted/isMuted | ADR-004 (mute persist) | ⚠️ |
| TR-AM-003 | audio-manager | TICK same-frame debounce | — | ❌ |
| TR-AM-004 | audio-manager | Graceful degradation on fail | — | ❌ |

---

## Known Gaps (6 TRs)

| TR-ID | Suggested ADR | Priority |
|-------|---------------|----------|
| TR-SS-003 | ADR-007 (step scoring) | Should Have |
| TR-HS-001 | ADR-008 (hint system BFS) | Should Have |
| TR-UI-001 | ADR-009 (UI component tree) | Should Have |
| TR-UI-002 | ADR-009 (UI component tree) | Should Have |
| TR-AM-003 | ADR-010 (audio preload/degrade) | Can Defer |
| TR-AM-004 | ADR-010 (audio preload/degrade) | Can Defer |

---

## ADR Implementation Order

```
Implemented (Accepted):
  1. ADR-001: 游戏状态机 ✅
  2. ADR-004: 平台适配层 ✅
  3. ADR-003: 数据流模式 ✅
  4. ADR-005: 触控输入管线 ✅
  5. ADR-002: 网格渲染策略 ✅

Implemented (Proposed):
  6. ADR-006: 关卡数据格式 ✅

Planned:
  7. ADR-007: 步数评分公式可配置化
  8. ADR-008: 提示系统 BFS 路径查找策略
  9. ADR-009: UI 组件树与数据绑定模式
  10. ADR-010: 音频资源预加载与降级策略
```
