# Sprint 1 — 2026-05-24 至 2026-05-30

## Sprint Goal

完成 Touch Input Epic 并建立开发基础设施（GUT 测试运行器 + CI），为后续 Epic 实现提供可复用的 Autoload → Signal → Config 模式。

## Capacity

- Total days: 5
- Buffer (20%): 1 day
- Available: 4 days

## Tasks

### Must Have (Critical Path)

| ID | Task | Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------|-----------|-------------|---------------------|
| S01 | `/test-setup` — GUT 运行器 + CI | engine-programmer | 0.5 | None | `godot --headless --script tests/gdunit4_runner.gd` 可执行；GitHub Actions workflow 存在 |
| S02 | Touch Input Story 005: 游戏状态集成 | gameplay-programmer | 0.5 | S01, GameStateMachine stub | AC8 + AC11 通过；`tests/integration/touch-input/state_integration_test.gd` 存在并 pass |
| S03 | Touch Input Story 006: 配置驱动参数 | gameplay-programmer | 0.25 | S02 | AC14 + AC15 通过；`assets/data/touch_input_config.json` 存在；零硬编码值 |
| S04 | 提交 Stories 001-004 累积更改 | — | 0.1 | S01 | 常规提交，引用 story ID |

### Should Have

| ID | Task | Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------|-----------|-------------|---------------------|
| S05 | GameStateMachine Autoload 骨架（Story 005 依赖） | engine-programmer | 0.3 | None | 最小 `GameStateMachine` autoload + `state_changed` signal；默认状态 PLAYING |
| S06 | `/create-stories` → game-state-machine epic | producer | 0.4 | None | 3-5 story 文件就绪 |

### Nice to Have

| ID | Task | Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------|-----------|-------------|---------------------|
| S07 | `/create-stories` → physics-config epic | producer | 0.4 | None | 3-5 story 文件就绪 |

## Carryover from Previous Sprint

（无 — 第一个 Sprint）

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Story 005 依赖 GameStateMachine — 无现有实现 | HIGH | MEDIUM | S05 先创建骨架：一个发射 `state_changed` signal 的 autoload，默认 PLAYING 状态 |
| 无 CI 基础设施 — 测试无法自动运行 | HIGH | MEDIUM | S01 优先执行 — `/test-setup` 是 Sprint 的第一项任务 |

## Dependencies on External Factors

- Story 005 需要在 `_ready()` 中连接 `GameStateMachine.state_changed` signal。GameStateMachine epic 仅有 EPIC.md，无 story 文件或实现。策略：在 Sprint 1 中先创建最小 GameStateMachine autoload 骨架（S05）。

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-1.md`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged

> ⚠️ **No QA Plan**: This sprint was started without a QA plan. Run `/qa-plan sprint`
> before the last story is implemented. The Production → Polish gate requires a QA
> sign-off report, which requires a QA plan.
