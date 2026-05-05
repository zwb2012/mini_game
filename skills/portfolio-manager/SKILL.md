---
name: portfolio-manager
description: Use when a solo developer is managing multiple game ideas or projects and needs to decide what to advance, pause, rework, observe, or kill across a shared portfolio.
---

# Portfolio Manager

## Overview
Manage the project portfolio, not individual implementation details. Keep work in progress low, compare projects against each other, and decide which stage skill should run next.

## When to Use
- Multiple projects exist at once
- Daily prioritization is unclear
- Weekly promote/hold/kill decisions are needed
- A project changed state and the next step is unclear

## Inputs
- `specs/portfolio/portfolio-board.md`
- Latest stage document for each active project
- Current WIP limits

## Workflow
1. Group projects by stage: `idea`, `candidate`, `prototype`, `mvp`, `live-observe`, `scale`, `hold`, `rework`, `kill`.
2. Enforce WIP limits: candidate `<= 5`, prototype `<= 3`, mvp `<= 2`, live-observe `<= 2`.
3. Choose `today-primary`, `today-secondary`, and `today-observe` projects.
4. For each chosen project, emit exactly one next action and the next skill to invoke.
5. When evidence is mixed, prefer the shortest next validation step.

## Output
- Updated portfolio summary
- Ranked project queue
- Promote / hold / rework / kill recommendations
- Explicit next-skill dispatch per active project

## Common Mistakes
- Treating every project as equally urgent
- Letting prototype and mvp work grow without limits
- Reviving weak projects without a review date
